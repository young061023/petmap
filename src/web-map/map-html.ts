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
  #search-area { display: none; align-items: center; justify-content: center; position: absolute; top: 16px; left: 50%; z-index: 12; transform: translateX(-50%);
    height: 42px; padding: 0 18px; border: 1px solid #456B54; border-radius: 22px; background: #FFFFFF;
    color: #456B54; font: 700 14px sans-serif; line-height: normal; box-shadow: 0 4px 14px rgba(38,53,44,0.2); white-space: nowrap; }
  #search-area.visible { display: flex; }
  #search-area:disabled { opacity: 0.7; }
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
<button id="search-area" type="button">이 위치에서 찾기</button>
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
  const originalConsoleError = console.error.bind(console);
  console.error = (...args) => {
    originalConsoleError(...args);
    earlyPost({ type: 'debug', text: 'console.error: ' + args.map((a) => (a && a.message) || String(a)).join(' ') });
  };
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
  fetch('./main-map-bundled.js')
    .then((res) => res.text())
    .then((text) => earlyPost({ type: 'debug', text: 'fetch main-map-bundled.js ok, length=' + text.length + ' head=' + text.slice(0, 60) }))
    .catch((err) => earlyPost({ type: 'debug', text: 'fetch main-map-bundled.js failed: ' + (err && err.message) }));
</script>
<!--
  Not <script type="module"> + an import map: WKWebView (iOS) doesn't support
  module scripts for file:// pages. main-map-bundled.js is
  src/web-map/main-map-script.js pre-bundled by scripts/bundle-map-script.sh
  into a single classic script (see that file's own header comment).
-->
<script src="./main-map-bundled.js" id="main-module-script">
</script>
</body>
</html>
`;
