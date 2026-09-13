// The map+character screen, as a self-contained HTML page run inside a
// react-native-webview <WebView>. This exists because the native
// @maplibre/maplibre-react-native <Marker> positions the 3D character as a
// separate Android View, repositioned every frame from a native callback
// independently of the map's own GL surface — two separate rendering
// pipelines that don't always land on the same frame, which is what causes
// visible jitter between the character and the road during a drag.
//
// A first version of this file used maplibre-gl JS's DOM `Marker` (an HTML
// element with its own small Three.js canvas, CSS-positioned) — the same
// approach as the user's other project ("stream"), which has no jitter as a
// normal browser tab. Tested inside this app's WebView, it still jittered:
// Android's WebView appears to composite the WebGL map canvas and the
// marker's CSS-transformed DOM element as separate layers, reintroducing the
// same kind of two-pipeline desync as the native version, just one level
// down.
//
// The actual fix: render the character as a MapLibre GL JS "custom layer"
// (`type: 'custom'`) instead of a DOM marker. A custom layer's `render(gl,
// matrix)` callback runs *inside* the map's own WebGL draw call, sharing its
// GL context and receiving its exact camera matrix for that frame — the
// character becomes literally part of the same draw call as the map tiles,
// not a separately-composited layer. This is the standard technique for
// embedding a 3D model in Mapbox/MapLibre GL JS (see e.g. their official
// "Add a 3D model" custom-layer example, which this follows).
//
// maplibre-gl and three.js/GLTFLoader are loaded as local files (written
// alongside this HTML by index.tsx — see WEB_LIB_ASSETS there) rather than
// from a CDN: network requests made from inside this WebView never
// completed on this device (confirmed with an inline fetch() probe that
// neither resolved nor rejected), regardless of which CDN was used or
// whether the page was loaded via source={{html}} or a file:// URI.
//
// GPS itself stays fully native (see index.tsx) — this page never touches
// navigator.geolocation. The RN side does the permission request + GPS watch
// + smoothing (unchanged from before) and pushes {type:'location', ...} in
// via postMessage; this page is purely presentational.
//
// Stage 1 (current): map + character glued directly to the incoming GPS fix,
// no road-snap/occlusion/camera-follow/zoom-scale yet — meant to validate
// that this architecture is actually jitter-free before porting the rest of
// index.tsx's logic over.

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="./maplibre-gl.css" />
<style>
  html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #FAFAF6; }
  #status { position: absolute; top: 16px; left: 16px; z-index: 10; color: #68736C; font: 12px sans-serif;
    background: #FAFAF6; padding: 10px 14px; border: 1px solid #DFE6DF; border-radius: 18px; pointer-events: none; }
  .spot-marker { display: grid; place-items: center; width: 40px; height: 40px; background: #769883; color: #14231A;
    border: 2px solid #456B54; border-radius: 50% 50% 50% 12px; font-size: 22px; line-height: 1; cursor: pointer;
    box-shadow: 0 3px 8px rgba(38,53,44,0.14); }
  .maplibregl-popup-content { background: #FFFFFF; border: 1px solid #DFE6DF; border-radius: 20px; padding: 18px; box-shadow: 0 6px 20px rgba(38,53,44,0.1); }
  .spot-popup-title { font: 700 15px sans-serif; color: #26352C; margin-bottom: 6px; }
  .spot-popup-address, .spot-popup-tel { font: 13px sans-serif; color: #68736C; line-height: 1.5; margin-top: 4px; }
  .maplibregl-ctrl-group { border: 1px solid #DFE6DF; border-radius: 18px; overflow: hidden; box-shadow: 0 3px 10px rgba(38,53,44,0.1); }
</style>
</head>
<body>
<div id="map"></div>
<div id="status">waiting for GPS...</div>
<script>
  // A classic (non-module) script, so it runs regardless of whether the
  // module script below (or its imports) fail — a failed import means
  // *none* of the module script's own code runs, including any error
  // handlers defined inside it. The capture-phase 'error' listener also
  // catches failed resource loads (e.g. a 404 on one of the local library
  // files), which window.onerror alone does not.
  function earlyPost(message) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }
  window.addEventListener('error', (event) => {
    const t = event.target;
    const targetInfo = t && t !== window
      ? (t.tagName + ' type=' + t.type + ' id=' + t.id + ' src=' + t.src + ' text=' + (t.textContent || '').slice(0, 40))
      : 'no target';
    earlyPost({
      type: 'debug',
      text: 'window error: ' + (event.message || (event.error && event.error.message) || event.type) +
        (event.filename ? ' @' + event.filename + ':' + event.lineno : '') + ' | ' + targetInfo,
    });
  }, true);
  window.addEventListener('unhandledrejection', (event) => {
    earlyPost({ type: 'debug', text: 'unhandledrejection: ' + (event.reason && event.reason.message || event.reason) });
  });
</script>
<script type="importmap" id="importmap-script">
{
  "imports": {
    "maplibre-gl": "./maplibre-gl.js",
    "three": "./three.module.js",
    "three/addons/loaders/GLTFLoader.js": "./loaders/GLTFLoader.js"
  }
}
</script>
<script type="module" id="main-module-script">
import * as maplibregl from 'maplibre-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function post(message) {
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
}

const BASE_ZOOM = 18;
const IDLE_CLIP = 'Survey';
const WALK_CLIP = 'Walk';
const CROSSFADE_SECONDS = 0.3;
// Pokémon GO-style camera: re-center on the character on every GPS fix
// (fixes arrive ~every 2s, so a short ease never overlaps the next one).
// If the user drags/zooms the map themselves, following pauses and resumes
// on its own a couple seconds after they let go.
const FOLLOW_EASE_MS = 350;
const FOLLOW_RESUME_DELAY_MS = 2500;
// Fox.glb is modeled in meters at roughly real-world fox size; scale it up
// so it reads clearly against building/road geometry at street zoom levels
// (tuned by eye, matches the native version's on-screen presence).
const MODEL_SCALE_METERS = 6;

let map = null;
let mixer = null;
let actions = {};
let currentClipName = null;
let characterGroup = null;
let modelLoaded = false;
let pendingDataUri = null;
let lastFix = null;
let currentLngLat = null;
let currentHeadingRad = 0;
let workerReady = false;
let pendingMapCenter = null;
let followEnabled = true;
let resumeFollowTimeout = null;
let spotMarkers = [];
let pendingSpots = null;

function setStatus(text) {
  const el = document.getElementById('status');
  el.textContent = text;
  el.style.display = text ? 'block' : 'none';
}

function setClip(name) {
  if (currentClipName === name) return;
  const next = actions[name];
  const prev = currentClipName ? actions[currentClipName] : null;
  if (prev) prev.fadeOut(CROSSFADE_SECONDS);
  if (next) next.reset().fadeIn(CROSSFADE_SECONDS).play();
  currentClipName = name;
}

// A MapLibre GL JS custom layer: onAdd sets up a Three.js scene sharing the
// map's own GL context; render() runs inside the map's own draw call, using
// the camera matrix MapLibre hands us that frame — so the character tracks
// the map with zero extra latency, the same way the map tiles themselves do.
const characterLayer = {
  id: 'character-3d',
  type: 'custom',
  renderingMode: '3d',
  onAdd(mapInstance, gl) {
    post({ type: 'debug', text: 'characterLayer.onAdd' });
    this.camera = new THREE.Camera();
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.AmbientLight(0xffffff, 1));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(0, 10, 5);
    this.scene.add(dirLight);

    characterGroup = new THREE.Group();
    this.scene.add(characterGroup);

    this.renderer = new THREE.WebGLRenderer({
      canvas: mapInstance.getCanvas(),
      context: gl,
      antialias: true,
    });
    this.renderer.autoClear = false;

    if (pendingDataUri) loadModel(pendingDataUri);
  },
  // maplibre-gl v6 changed CustomLayerInterface.render's second argument from
  // a flat 16-number matrix array (older v1-3 API, what every "3D model on a
  // custom layer" example online is still written against) to an options
  // object. Treating that object as a flat array (the old fromArray(matrix)
  // call) silently read 16 undefineds, producing an all-NaN projection
  // matrix: no GL error, no thrown exception, just zero fragments ever
  // rasterized — which is why the character (and even a giant diagnostic
  // test cube) never appeared no matter its scale, position, or depth-test
  // settings.
  //
  // args.modelViewProjectionMatrix looked like the obvious replacement and
  // does produce real (non-NaN) numbers, but it's the wrong matrix: v6 uses
  // it internally for tile rendering in a different coordinate space, and
  // multiplying it by our mercator-space transform put the model miles
  // outside the clip volume (NDC values like -14.7, nowhere near [-1, 1]).
  // The matrix that actually maps mercator [0,1] coordinates to clip space —
  // the direct equivalent of the old v1-3 flat matrix — is
  // args.defaultProjectionData.mainMatrix (confirmed by reading v6's own
  // getProjectionDataForCustomLayer() source, which builds mainMatrix from
  // the transform's _viewProjMatrix the same way the old API's matrix was
  // built).
  render(gl, args) {
    if (!currentLngLat) return;

    const mc = maplibregl.MercatorCoordinate.fromLngLat(currentLngLat, 0);
    const scale = mc.meterInMercatorCoordinateUnits() * MODEL_SCALE_METERS;

    // Three.js scenes are Y-up; Mercator space is X-east/Y-north/Z-up — this
    // fixed rotation aligns the two, matching the standard MapLibre/Mapbox
    // "3D model as custom layer" example.
    const rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);

    const l = new THREE.Matrix4()
      .makeTranslation(mc.x, mc.y, mc.z)
      .scale(new THREE.Vector3(scale, -scale, scale))
      .multiply(rotationX);

    const m = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix);
    this.camera.projectionMatrix = m.multiply(l);

    characterGroup.rotation.y = currentHeadingRad;

    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
    map.triggerRepaint();
  },
};

function loadModel(dataUri) {
  if (!characterGroup) {
    pendingDataUri = dataUri;
    return;
  }
  new GLTFLoader().load(
    dataUri,
    (gltf) => {
      const model = gltf.scene;
      // fox.glb's raw scene units are huge (~150 units tall) — matches the
      // native version's <Center scale={0.02}>. Measure the box in the
      // model's original (unscaled) space first, then scale, then position
      // using offsets scaled to match — Box3 reads the object's last-computed
      // world matrix, which doesn't retroactively reflect a scale set just
      // before measuring without an explicit updateMatrixWorld() call, so
      // measure-then-scale is more robust than scale-then-measure here.
      const CHARACTER_SCALE = 0.02;
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      model.scale.setScalar(CHARACTER_SCALE);
      model.position.set(-center.x * CHARACTER_SCALE, -box.min.y * CHARACTER_SCALE, -center.z * CHARACTER_SCALE);
      // The character stands at ground level at the exact map center, which
      // is frequently inside or behind a 3D building extrusion from the
      // 'liberty' style's fill-extrusion layer — those write to the shared
      // GL depth buffer, and Three's default depth test then discards the
      // character's fragments behind them. A "you are here" marker should
      // never be hidden by buildings, so draw it depth-test-free (always on
      // top, like every other map app's location dot).
      model.traverse((node) => {
        if (!node.isMesh) return;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((mat) => {
          mat.depthTest = false;
          mat.depthWrite = false;
        });
        node.renderOrder = 999;
      });
      characterGroup.add(model);
      post({ type: 'debug', text: 'model added, rawSize=' + size.x.toFixed(1) + ',' + size.y.toFixed(1) + ',' + size.z.toFixed(1) + ' childCount=' + characterGroup.children.length });

      mixer = new THREE.AnimationMixer(model);
      const idleClip = THREE.AnimationClip.findByName(gltf.animations, IDLE_CLIP);
      const walkClip = THREE.AnimationClip.findByName(gltf.animations, WALK_CLIP);
      actions = {
        idle: idleClip ? mixer.clipAction(idleClip) : null,
        walk: walkClip ? mixer.clipAction(walkClip) : null,
      };
      setClip('idle');
      modelLoaded = true;
      setStatus('');

      const clock = new THREE.Clock();
      (function tick() {
        requestAnimationFrame(tick);
        if (mixer) mixer.update(clock.getDelta());
      })();
    },
    undefined,
    (err) => {
      setStatus('model load failed: ' + (err && err.message));
      post({ type: 'debug', text: 'model load failed: ' + (err && err.message) });
    },
  );
}

// maplibre-gl's own worker fails to load as a file:// module Worker on this
// WebView (see WORKER_BUNDLE_MODULE's comment in index.tsx for the full
// diagnosis) — override it with a Blob URL built from the bundled worker
// code the RN side sends over, which lets us set an explicit JS MIME type
// and sidesteps the broken loading path entirely. Must happen before the
// map (and its worker) is created.
function setWorkerCode(code) {
  const blob = new Blob([code], { type: 'text/javascript' });
  maplibregl.setWorkerUrl(URL.createObjectURL(blob));
  workerReady = true;
  post({ type: 'debug', text: 'worker blob URL set' });
  if (pendingMapCenter) ensureMap(pendingMapCenter[0], pendingMapCenter[1]);
}

function ensureMap(lng, lat) {
  if (map) return;
  if (!workerReady) {
    pendingMapCenter = [lng, lat];
    return;
  }
  post({ type: 'debug', text: 'creating map at ' + lng + ',' + lat });
  map = new maplibregl.Map({
    container: 'map',
    style: '${MAP_STYLE_URL}',
    center: [lng, lat],
    zoom: BASE_ZOOM,
    pitch: 60,
    // The default attribution control sits bottom-left and spans wide
    // enough to sit right under the floating radial menu button — moved to
    // a compact "i" icon in a top corner instead, out of its way.
    attributionControl: false,
  });
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'top-left');
  // maplibre-gl's compact:true option still renders the attribution fully
  // expanded (not just a collapsed "i" icon) the first time it mounts on a
  // map container 640px wide or less — i.e. on every phone — since it's
  // meant to guarantee attribution is seen at least once on small maps. Its
  // visual expanded/collapsed state is driven by the maplibregl-compact-show
  // class (not the <details> element's own open attribute, which the same
  // code toggles somewhat inversely for its own transition styling), and
  // that class only gets added once the map's style has actually loaded
  // (asynchronously, well after addControl() returns here) — so collapsing
  // it immediately is a no-op. A MutationObserver reacts the moment the
  // library adds it instead of guessing at timing, then disconnects so it
  // doesn't fight the user's own subsequent taps on the icon.
  const attribEl = document.querySelector('.maplibregl-ctrl-attrib');
  if (attribEl) {
    const collapseAttribution = () => {
      if (!attribEl.classList.contains('maplibregl-compact-show')) return;
      attribEl.setAttribute('open', '');
      attribEl.classList.remove('maplibregl-compact-show');
      attribObserver.disconnect();
    };
    const attribObserver = new MutationObserver(collapseAttribution);
    attribObserver.observe(attribEl, { attributes: true, attributeFilter: ['class'] });
    collapseAttribution();
  }

  map.on('load', () => {
    post({ type: 'debug', text: 'map load event fired' });
    map.addLayer(characterLayer);
    if (pendingSpots) {
      renderSpots(pendingSpots);
      pendingSpots = null;
    }
  });
  map.on('error', (e) => {
    post({ type: 'debug', text: 'map error: ' + (e && e.error && e.error.message) });
  });

  // e.originalEvent is only set for gestures the user actually performed
  // (mouse/touch) — camera moves we trigger ourselves via easeTo() don't set
  // it, so this only reacts to the user taking the wheel, not our own follow.
  const pauseFollow = (e) => {
    if (!e.originalEvent) return;
    followEnabled = false;
    if (resumeFollowTimeout) clearTimeout(resumeFollowTimeout);
  };
  const scheduleResumeFollow = (e) => {
    if (!e.originalEvent) return;
    if (resumeFollowTimeout) clearTimeout(resumeFollowTimeout);
    resumeFollowTimeout = setTimeout(() => {
      followEnabled = true;
      // Snap back right away instead of waiting for the next GPS fix — if
      // the character hasn't moved (or moved less than distanceInterval)
      // since the drag, no new 'location' message may arrive for a while.
      if (currentLngLat) {
        map.easeTo({ center: currentLngLat, duration: FOLLOW_EASE_MS, easing: (t) => t });
      }
    }, FOLLOW_RESUME_DELAY_MS);
  };
  map.on('dragstart', pauseFollow);
  map.on('zoomstart', pauseFollow);
  map.on('rotatestart', pauseFollow);
  map.on('pitchstart', pauseFollow);
  map.on('dragend', scheduleResumeFollow);
  map.on('zoomend', scheduleResumeFollow);
  map.on('rotateend', scheduleResumeFollow);
  map.on('pitchend', scheduleResumeFollow);
}

function handleLocation(msg) {
  const latitude = msg.latitude;
  const longitude = msg.longitude;
  const heading = msg.heading;

  ensureMap(longitude, latitude);
  currentLngLat = [longitude, latitude];
  if (typeof heading === 'number' && heading >= 0) {
    currentHeadingRad = Math.PI + (heading * Math.PI) / 180;
  }
  if (map) {
    map.triggerRepaint();
    if (followEnabled) {
      map.easeTo({ center: [longitude, latitude], duration: FOLLOW_EASE_MS, easing: (t) => t });
    }
  }

  const moved = !lastFix || Math.hypot(latitude - lastFix.latitude, longitude - lastFix.longitude) > 3e-6;
  if (modelLoaded) setClip(moved ? 'walk' : 'idle');
  lastFix = { latitude, longitude };
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Pet-friendly tourism spots (한국관광공사 KorPetTourService2), sent over from
// the RN side — rendered as simple DOM markers (unlike the character, these
// don't need to share the map's own draw call, so the jitter concern that
// ruled out DOM markers for the character doesn't apply to static POIs).
function renderSpots(spots) {
  if (!map || !map.loaded()) {
    pendingSpots = spots;
    return;
  }
  spotMarkers.forEach((marker) => marker.remove());
  spotMarkers = [];

  spots.forEach((spot) => {
    const el = document.createElement('div');
    el.className = 'spot-marker';
    el.textContent = '🐾';

    const popupHtml =
      '<div class="spot-popup-title">' + escapeHtml(spot.title) + '</div>' +
      (spot.address ? '<div class="spot-popup-address">' + escapeHtml(spot.address) + '</div>' : '') +
      (spot.tel ? '<div class="spot-popup-tel">' + escapeHtml(spot.tel) + '</div>' : '');

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([spot.longitude, spot.latitude])
      .setPopup(new maplibregl.Popup({ offset: 20 }).setHTML(popupHtml))
      .addTo(map);
    spotMarkers.push(marker);
  });
  post({ type: 'debug', text: 'rendered ' + spots.length + ' pet spots' });
}

function handleMessage(event) {
  let msg;
  try {
    msg = JSON.parse(event.data);
  } catch (e) {
    post({ type: 'debug', text: 'parse failed: ' + String(event.data).slice(0, 80) });
    return;
  }
  post({ type: 'debug', text: 'received ' + msg.type });
  if (msg.type === 'model') loadModel(msg.dataUri);
  else if (msg.type === 'location') handleLocation(msg);
  else if (msg.type === 'workerCode') setWorkerCode(msg.code);
  else if (msg.type === 'spots') renderSpots(msg.spots);
}

document.addEventListener('message', handleMessage);
window.addEventListener('message', handleMessage);

post({ type: 'ready' });
</script>
</body>
</html>
`;
