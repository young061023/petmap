#!/bin/bash
# Bundles src/web-map/main-map-script.js (a normal ES module importing
# maplibre-gl/three/GLTFLoader) into a single classic (non-module) script,
# because WKWebView (iOS) doesn't support <script type="module"> for file://
# pages. Run this after editing main-map-script.js; it writes the result
# into assets/web-libs/main-map-bundled.js.txt, which index.tsx loads as a
# WEB_LIB_ASSETS entry and map-html.ts includes with a plain <script src>.
set -euo pipefail
cd "$(dirname "$0")/.."

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$TMP/loaders" "$TMP/utils"
cp assets/web-libs/maplibre-gl.js.txt "$TMP/maplibre-gl.js"
cp assets/web-libs/maplibre-gl-shared.js.txt "$TMP/maplibre-gl-shared.js"
cp assets/web-libs/three.module.js.txt "$TMP/three.module.js"
cp assets/web-libs/loaders/GLTFLoader.js.txt "$TMP/loaders/GLTFLoader.js"
cp assets/web-libs/utils/BufferGeometryUtils.js.txt "$TMP/utils/BufferGeometryUtils.js"
cp assets/web-libs/utils/SkeletonUtils.js.txt "$TMP/utils/SkeletonUtils.js"

npx esbuild src/web-map/main-map-script.js \
  --bundle \
  --format=iife \
  --alias:maplibre-gl="$TMP/maplibre-gl.js" \
  --alias:three="$TMP/three.module.js" \
  --alias:three/addons/loaders/GLTFLoader.js="$TMP/loaders/GLTFLoader.js" \
  --outfile=assets/web-libs/main-map-bundled.js.txt

echo "Wrote assets/web-libs/main-map-bundled.js.txt"
