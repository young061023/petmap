import * as Location from 'expo-location';
import {
  cacheDirectory,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useMapStore } from '@/store/useMapStore';
import { MAP_HTML } from '@/web-map/map-html';

// Exponential moving average weight applied to each raw GPS fix — lower
// values smooth out more jitter at the cost of a little lag.
const GPS_SMOOTHING_ALPHA = 0.35;

const FOX_MODEL_MODULE = require('../../../assets/models/fox.glb');

const WEB_MAP_DIR = `${cacheDirectory}web-map/`;

// maplibre-gl and three.js/GLTFLoader are loaded by map-html.ts as local
// files rather than from a CDN — network requests made *from inside* the
// WebView never completed on this device/network (confirmed with an inline
// fetch() probe that never resolved or rejected), regardless of CDN or
// whether the page was loaded via source={{html}} or a file:// URI. Loading
// these as local files sidesteps that entirely. Paths mirror each library's
// own internal relative imports (GLTFLoader.js imports '../utils/...') so
// nothing needs rewriting.
//
// maplibre-gl ships its files with a `.mjs` extension, which this WebView's
// file:// resource loader serves with the wrong MIME type (text/html instead
// of a JS type), and ES module scripts enforce strict MIME checking — this
// silently broke maplibre's own worker (maplibre-gl-worker.mjs), which is
// what actually parses/renders tiles, even though the main maplibre-gl.mjs
// module itself loaded fine. Renamed to `.js` (same extension the working
// three.js/GLTFLoader files already use) with the handful of internal
// `.mjs` cross-references between these 3 files text-replaced to match.
const WEB_LIB_ASSETS: { module: number; relativePath: string }[] = [
  { module: require('../../../assets/web-libs/maplibre-gl.js.txt'), relativePath: 'maplibre-gl.js' },
  { module: require('../../../assets/web-libs/maplibre-gl-shared.js.txt'), relativePath: 'maplibre-gl-shared.js' },
  { module: require('../../../assets/web-libs/maplibre-gl.css.txt'), relativePath: 'maplibre-gl.css' },
  { module: require('../../../assets/web-libs/three.module.js.txt'), relativePath: 'three.module.js' },
  { module: require('../../../assets/web-libs/loaders/GLTFLoader.js.txt'), relativePath: 'loaders/GLTFLoader.js' },
  {
    module: require('../../../assets/web-libs/utils/BufferGeometryUtils.js.txt'),
    relativePath: 'utils/BufferGeometryUtils.js',
  },
  { module: require('../../../assets/web-libs/utils/SkeletonUtils.js.txt'), relativePath: 'utils/SkeletonUtils.js' },
];

// maplibre-gl's own worker (maplibre-gl-worker.js) is loaded internally via
// `new Worker(url, {type: 'module'})` — a different, stricter loading path
// than <script type=module>/dynamic import(), which silently fails on this
// WebView for file:// module workers ("non-JavaScript MIME type" in
// DevTools, but no error ever reaches the Worker's own onerror — confirmed
// by isolating the two loading paths directly). Bundled with esbuild into a
// single dependency-free classic (non-module) script so the page can build
// its own Blob URL with an explicit JS MIME type and hand that to
// maplibregl.setWorkerUrl() instead of letting maplibre-gl construct a
// file:// module Worker URL itself.
const WORKER_BUNDLE_MODULE = require('../../../assets/web-libs/maplibre-gl-worker-bundled.js.txt');

export default function MapScreen() {
  const location = useMapStore((state) => state.location);
  const heading = useMapStore((state) => state.heading);
  const setLocation = useMapStore((state) => state.setLocation);
  const permissionStatus = useMapStore((state) => state.permissionStatus);
  const setPermissionStatus = useMapStore((state) => state.setPermissionStatus);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [webviewReady, setWebviewReady] = useState(false);
  const [modelDataUri, setModelDataUri] = useState<string | null>(null);
  const [mapHtmlFileUri, setMapHtmlFileUri] = useState<string | null>(null);
  const [workerCode, setWorkerCode] = useState<string | null>(null);

  const webviewRef = useRef<WebView>(null);
  const smoothedLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== 'granted') {
        setErrorMessage('위치 권한이 필요합니다.');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 2,
        },
        (position) => {
          const raw = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          const previous = smoothedLocationRef.current;
          const smoothed = previous
            ? {
                latitude: previous.latitude + (raw.latitude - previous.latitude) * GPS_SMOOTHING_ALPHA,
                longitude: previous.longitude + (raw.longitude - previous.longitude) * GPS_SMOOTHING_ALPHA,
              }
            : raw;
          smoothedLocationRef.current = smoothed;
          setLocation(smoothed, position.coords.heading);
        },
      );
    })();

    return () => subscription?.remove();
  }, [setLocation, setPermissionStatus]);

  // The character model is bundled locally (never depends on network to
  // render) and read once as base64 so it can be handed to the WebView's
  // GLTFLoader as a data URI — the WebView has no access to the app's local
  // asset filesystem otherwise.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const asset = Asset.fromModule(FOX_MODEL_MODULE);
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
      if (!cancelled) setModelDataUri(`data:model/gltf-binary;base64,${base64}`);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Sent as plain text (not written to disk like WEB_LIB_ASSETS) so the page
  // can build its own Blob with an explicit MIME type for maplibre-gl's
  // worker — see WORKER_BUNDLE_MODULE above for why.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const asset = Asset.fromModule(WORKER_BUNDLE_MODULE);
      await asset.downloadAsync();
      const code = await readAsStringAsync(asset.localUri ?? asset.uri);
      if (!cancelled) setWorkerCode(code);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Write map.html plus every local library file it depends on (see
  // WEB_LIB_ASSETS above) into the same directory, then point the WebView at
  // the file:// URI. A WebView loaded via source={{html}} also turned out to
  // get treated as an opaque/restricted origin on this device (its own
  // <script src="https://..."> CDN tags never loaded either), so this both
  // fixes that and removes the CDN dependency entirely.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      await makeDirectoryAsync(`${WEB_MAP_DIR}loaders`, { intermediates: true });
      await makeDirectoryAsync(`${WEB_MAP_DIR}utils`, { intermediates: true });

      await Promise.all(
        WEB_LIB_ASSETS.map(async ({ module, relativePath }) => {
          const asset = Asset.fromModule(module);
          await asset.downloadAsync();
          const content = await readAsStringAsync(asset.localUri ?? asset.uri);
          await writeAsStringAsync(`${WEB_MAP_DIR}${relativePath}`, content);
        }),
      );

      const uri = `${WEB_MAP_DIR}map.html`;
      await writeAsStringAsync(uri, MAP_HTML);
      if (!cancelled) setMapHtmlFileUri(uri);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let message: { type?: string; text?: string };
      try {
        message = JSON.parse(event.nativeEvent.data);
      } catch {
        console.warn('[webview] unparseable message', event.nativeEvent.data);
        return;
      }
      console.warn('[webview]', message.type, message.text ?? '');
      if (message.type === 'ready') setWebviewReady(true);
    },
    [],
  );

  // Send the model once the page signals it's ready to receive it.
  useEffect(() => {
    console.warn('[rn] model effect', { webviewReady, hasModel: !!modelDataUri });
    if (!webviewReady || !modelDataUri) return;
    console.warn('[rn] sending model, length', modelDataUri.length);
    webviewRef.current?.postMessage(JSON.stringify({ type: 'model', dataUri: modelDataUri }));
  }, [webviewReady, modelDataUri]);

  // Send maplibre's worker bundle as raw text so the page can build its own
  // Blob URL for it (see WORKER_BUNDLE_MODULE above).
  useEffect(() => {
    if (!webviewReady || !workerCode) return;
    console.warn('[rn] sending worker code, length', workerCode.length);
    webviewRef.current?.postMessage(JSON.stringify({ type: 'workerCode', code: workerCode }));
  }, [webviewReady, workerCode]);

  // Forward every smoothed GPS fix into the page — this is the only way the
  // character's position changes; the WebView never touches
  // navigator.geolocation itself.
  useEffect(() => {
    console.warn('[rn] location effect', { webviewReady, location });
    if (!webviewReady || !location) return;
    console.warn('[rn] sending location', location, heading);
    webviewRef.current?.postMessage(
      JSON.stringify({ type: 'location', latitude: location.latitude, longitude: location.longitude, heading }),
    );
  }, [webviewReady, location, heading]);

  // WebView treats a new `source` object as a navigation and reloads the
  // page — without memoizing this, every re-render (e.g. each GPS fix)
  // handed it a fresh object and reset the page before it ever got past the
  // initial handshake.
  const webviewSource = useMemo(
    () => (mapHtmlFileUri ? { uri: mapHtmlFileUri } : undefined),
    [mapHtmlFileUri],
  );

  if (permissionStatus !== 'granted') {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>{errorMessage ?? '위치 권한을 요청하는 중...'}</ThemedText>
      </ThemedView>
    );
  }

  if (!location || !mapHtmlFileUri) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return (
    <WebView
      ref={webviewRef}
      style={styles.map}
      source={webviewSource}
      originWhitelist={['*']}
      javaScriptEnabled
      allowFileAccess
      allowFileAccessFromFileURLs
      allowUniversalAccessFromFileURLs
      webviewDebuggingEnabled
      onMessage={handleMessage}
      onError={(e) => console.warn('[webview] onError', e.nativeEvent)}
      onHttpError={(e) => console.warn('[webview] onHttpError', e.nativeEvent)}
      onRenderProcessGone={(e) => console.warn('[webview] onRenderProcessGone', e.nativeEvent)}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
});
