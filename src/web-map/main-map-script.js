// The actual map/character rendering logic for the WebView page in
// map-html.ts, kept as a real ES module here (so imports type-check/lint
// normally, `three`/`maplibre-gl` resolve via node_modules for editing) but
// bundled into a single classic (non-module) script before being embedded
// in map-html.ts — WKWebView (iOS) does not support `<script type="module">`
// for file:// pages (a well-known WebKit limitation; Android's WebView is
// more permissive, which is why this worked there and not on iOS). Same
// class of problem as the maplibre-gl worker (see WORKER_BUNDLE_MODULE in
// index.tsx), solved the same way: pre-bundle to a plain script.
//
// After editing this file, regenerate the embedded bundle in map-html.ts:
//   bash scripts/bundle-map-script.sh
import * as maplibregl from 'maplibre-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

function post(message) {
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
}

const BASE_ZOOM = 18;
const IDLE_CLIP = 'Survey';
const WALK_CLIP = 'Walk';
// Some character models' baked "Walk" clip reads as a full sprint at its
// native 1.0 speed (most noticeably the fox) — slowed down so it reads as an
// actual walking pace instead.
const WALK_TIME_SCALE = 0.55;
const CROSSFADE_SECONDS = 0.3;
// Pokémon GO-style camera: re-center on the character on every GPS fix
// (fixes arrive ~every 2s, so a short ease never overlaps the next one).
// If the user drags/zooms the map themselves, following pauses so they can
// search around the new map center without a later GPS fix snapping it back.
const FOLLOW_EASE_MS = 350;
// The character model's raw units read clearly against building/road
// geometry at street zoom levels once scaled up this much (tuned by eye,
// matches the native version's on-screen presence).
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
let spotMarkers = [];
let pendingSpots = null;

function setStatus(text) {
  const el = document.getElementById('status');
  el.textContent = text;
  el.style.display = text ? 'block' : 'none';
}

const searchAreaButton = document.getElementById('search-area');
function showSearchAreaButton() {
  searchAreaButton.disabled = false;
  searchAreaButton.textContent = '이 위치에서 찾기';
  searchAreaButton.classList.add('visible');
}
searchAreaButton.addEventListener('click', () => {
  if (!map || searchAreaButton.disabled) return;
  const center = map.getCenter();
  searchAreaButton.disabled = true;
  searchAreaButton.textContent = '찾는 중...';
  post({ type: 'searchArea', latitude: center.lat, longitude: center.lng });
});

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
      // The character model's raw scene units are huge (tens-to-hundreds of
      // units tall) — matches the native version's <Center scale={0.02}>.
      // Measure the box in the
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
      // loadModel can run more than once against the same still-live scene
      // (e.g. the RN side resending 'model' after a WebView reload it can't
      // always distinguish from an in-place refresh) — without clearing the
      // group first, the old model stays in the scene and a second character
      // ends up rendered on top of/next to the first.
      while (characterGroup.children.length) characterGroup.remove(characterGroup.children[0]);
      characterGroup.add(model);
      post({ type: 'debug', text: 'model added, rawSize=' + size.x.toFixed(1) + ',' + size.y.toFixed(1) + ',' + size.z.toFixed(1) + ' childCount=' + characterGroup.children.length });

      mixer = new THREE.AnimationMixer(model);
      const idleClip = THREE.AnimationClip.findByName(gltf.animations, IDLE_CLIP);
      const walkClip = THREE.AnimationClip.findByName(gltf.animations, WALK_CLIP);
      actions = {
        idle: idleClip ? mixer.clipAction(idleClip) : null,
        walk: walkClip ? mixer.clipAction(walkClip) : null,
      };
      if (actions.walk) actions.walk.timeScale = WALK_TIME_SCALE;
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

// MapLibre's built-in rotate gesture needs two fingers (TouchZoomRotateHandler
// only reacts to a 2-touch twist), so rotating one-handed isn't possible with
// it. This adds a one-finger alternative: press and hold on the map, then —
// without lifting — drag left/right to rotate. A quick drag that starts
// moving before the hold threshold fires is left alone so normal one-finger
// panning still works untouched.
function setupOneFingerRotate(mapInstance) {
  const container = mapInstance.getCanvasContainer();
  const LONG_PRESS_MS = 400;
  const MOVE_CANCEL_PX = 10;
  const DEGREES_PER_PIXEL = 0.5;

  let pressTimer = null;
  let rotating = false;
  let activeTouchId = null;
  let startX = 0;
  let startY = 0;
  let startBearing = 0;

  function clearPressTimer() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  }

  function onTouchStart(e) {
    if (e.touches.length !== 1) {
      clearPressTimer();
      return;
    }
    const touch = e.touches[0];
    activeTouchId = touch.identifier;
    startX = touch.clientX;
    startY = touch.clientY;
    startBearing = mapInstance.getBearing();
    clearPressTimer();
    pressTimer = setTimeout(() => {
      rotating = true;
      mapInstance.dragPan.disable();
      post({ type: 'rotateEngaged' });
    }, LONG_PRESS_MS);
  }

  function onTouchMove(e) {
    let touch = null;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === activeTouchId) touch = e.touches[i];
    }
    if (!touch) return;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    if (!rotating) {
      // Real movement before the long-press fired means this is an ordinary
      // pan, not a rotate — bail out and let MapLibre's own handlers work.
      if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) clearPressTimer();
      return;
    }
    e.preventDefault();
    mapInstance.setBearing(startBearing - dx * DEGREES_PER_PIXEL);
  }

  function onTouchEnd() {
    clearPressTimer();
    if (rotating) {
      rotating = false;
      mapInstance.dragPan.enable();
      post({ type: 'debug', text: 'one-finger rotate released' });
    }
    activeTouchId = null;
  }

  container.addEventListener('touchstart', onTouchStart, { passive: true });
  container.addEventListener('touchmove', onTouchMove, { passive: false });
  container.addEventListener('touchend', onTouchEnd, { passive: true });
  container.addEventListener('touchcancel', onTouchEnd, { passive: true });
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
    style: MAP_STYLE_URL,
    center: [lng, lat],
    zoom: BASE_ZOOM,
    pitch: 60,
    // The default attribution control sits bottom-left and spans wide
    // enough to sit right under the floating radial menu button — moved to
    // a compact "i" icon in a top corner instead, out of its way.
    attributionControl: false,
  });
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'top-left');
  setupOneFingerRotate(map);
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
      const spots = pendingSpots;
      pendingSpots = null;
      renderSpots(spots);
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
  };
  const offerAreaSearch = (e) => {
    if (!e.originalEvent) return;
    showSearchAreaButton();
  };
  map.on('dragstart', pauseFollow);
  map.on('zoomstart', pauseFollow);
  map.on('rotatestart', pauseFollow);
  map.on('pitchstart', pauseFollow);
  map.on('dragend', offerAreaSearch);
  map.on('zoomend', offerAreaSearch);
  map.on('rotateend', offerAreaSearch);
  map.on('pitchend', offerAreaSearch);
}

// Snaps the character's on-screen position to the nearest road so it doesn't
// appear to stand on top of a building — raw GPS is routinely a few meters
// off, which reads as clearly wrong against the style's 3D building
// extrusions. Reads road geometry MapLibre has already fetched/rendered for
// the current view (queryRenderedFeatures) rather than calling an external
// snapping API — network requests made from inside this WebView don't
// reliably complete on this device (see the file-header comment), and this
// needs none.
const MAX_SNAP_METERS = 25;
const METERS_PER_DEGREE = 111320;

function closestPointOnSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  let t = lenSq > 0 ? ((px - ax) * abx + (py - ay) * aby) / lenSq : 0;
  t = Math.max(0, Math.min(1, t));
  return { x: ax + abx * t, y: ay + aby * t };
}

// Flat-earth approximation (scaling longitude by cos(lat)) is accurate
// enough at the few-meter scale this snaps within.
function snapToRoad(lng, lat) {
  if (!map || !map.isStyleLoaded()) return null;
  let point;
  try {
    point = map.project([lng, lat]);
  } catch (e) {
    return null;
  }
  const pad = 70;
  let features;
  try {
    features = map.queryRenderedFeatures([
      [point.x - pad, point.y - pad],
      [point.x + pad, point.y + pad],
    ]);
  } catch (e) {
    return null;
  }

  const cosLat = Math.cos((lat * Math.PI) / 180);
  const px = lng * cosLat;
  const py = lat;
  let bestX = null;
  let bestY = null;
  let bestDistSq = Infinity;

  for (const feature of features) {
    // 'transportation' is the OpenMapTiles-schema source-layer this style's
    // road network lives in, regardless of which visual layer (road,
    // bridge, tunnel, by class) rendered a given feature.
    if (feature.sourceLayer !== 'transportation' || !feature.geometry) continue;
    const geom = feature.geometry;
    const lines =
      geom.type === 'LineString' ? [geom.coordinates] : geom.type === 'MultiLineString' ? geom.coordinates : null;
    if (!lines) continue;
    for (const line of lines) {
      for (let i = 0; i < line.length - 1; i++) {
        const ax = line[i][0] * cosLat;
        const ay = line[i][1];
        const bx = line[i + 1][0] * cosLat;
        const by = line[i + 1][1];
        const c = closestPointOnSegment(px, py, ax, ay, bx, by);
        const dx = px - c.x;
        const dy = py - c.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          bestX = c.x;
          bestY = c.y;
        }
      }
    }
  }

  if (bestX === null) return null;
  const distMeters = Math.sqrt(bestDistSq) * METERS_PER_DEGREE;
  // Off-road (parks, plazas, a road layer not loaded yet) — keep raw GPS
  // rather than snapping to some unrelated road far away.
  if (distMeters > MAX_SNAP_METERS) return null;
  return [bestX / cosLat, bestY];
}

function handleLocation(msg) {
  const latitude = msg.latitude;
  const longitude = msg.longitude;
  const heading = msg.heading;

  ensureMap(longitude, latitude);
  const snapped = snapToRoad(longitude, latitude);
  currentLngLat = snapped || [longitude, latitude];
  if (typeof heading === 'number' && heading >= 0) {
    currentHeadingRad = Math.PI + (heading * Math.PI) / 180;
  }
  if (map) {
    map.triggerRepaint();
    if (followEnabled) {
      map.easeTo({ center: currentLngLat, duration: FOLLOW_EASE_MS, easing: (t) => t });
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
  if (!map || !map.isStyleLoaded()) {
    pendingSpots = spots;
    return;
  }
  spotMarkers.forEach((marker) => marker.remove());
  spotMarkers = [];

  spots.forEach((spot) => {
    const el = document.createElement('div');
    el.className = 'spot-marker';
    el.textContent = '🐾';
    el.dataset.spotId = String(spot.id);

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

function focusSpot(msg) {
  if (!map) return;
  followEnabled = false;
  searchAreaButton.classList.remove('visible');
  map.easeTo({ center: [msg.longitude, msg.latitude], zoom: Math.max(map.getZoom(), 17), duration: 650, essential: true });
  const marker = spotMarkers.find((item) => item.getElement().dataset.spotId === String(msg.id));
  const popup = marker && marker.getPopup();
  if (popup) popup.addTo(map);
}

function recenterOnLocation(msg) {
  if (!map) return;
  followEnabled = true;
  searchAreaButton.classList.remove('visible');
  const longitude = typeof msg.longitude === 'number' ? msg.longitude : currentLngLat && currentLngLat[0];
  const latitude = typeof msg.latitude === 'number' ? msg.latitude : currentLngLat && currentLngLat[1];
  if (typeof longitude !== 'number' || typeof latitude !== 'number') return;
  map.easeTo({ center: [longitude, latitude], zoom: Math.max(map.getZoom(), BASE_ZOOM), duration: 650, essential: true });
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
  else if (msg.type === 'focusSpot') focusSpot(msg);
  else if (msg.type === 'recenter') recenterOnLocation(msg);
  else if (msg.type === 'searchComplete') {
    searchAreaButton.disabled = false;
    if (msg.success) searchAreaButton.classList.remove('visible');
    else searchAreaButton.textContent = '다시 찾기';
  }
}

document.addEventListener('message', handleMessage);
window.addEventListener('message', handleMessage);

post({ type: 'ready' });
