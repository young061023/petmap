import { Center, useAnimations, useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Asset } from 'expo-asset';
import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import type { Group } from 'three';

const SIZE = 72;
const IDLE_CLIP = 'Survey';
const WALK_CLIP = 'Walk';
const CROSSFADE_SECONDS = 0.3;

// Bundled locally at assets/models/fox.glb — Khronos glTF-Sample-Models "Fox"
// (CC0), used as a placeholder walking character until a custom pet model is
// ready. https://github.com/KhronosGroup/glTF-Sample-Models
// Loaded from the app bundle (not a remote URL) so the character never
// depends on network access to render.
const FOX_MODEL_MODULE = require('../../assets/models/fox.glb');

// Warms the local copy so the first mount doesn't wait on the download.
Asset.fromModule(FOX_MODEL_MODULE).downloadAsync();

function Fox({ modelUri, headingRad, isMoving }: { modelUri: string; headingRad: number; isMoving: boolean }) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(modelUri);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    const action = actions[isMoving ? WALK_CLIP : IDLE_CLIP];
    action?.reset().fadeIn(CROSSFADE_SECONDS).play();
    return () => {
      action?.fadeOut(CROSSFADE_SECONDS);
    };
  }, [actions, isMoving]);

  return (
    <Center scale={0.02}>
      <primitive ref={group} object={scene} rotation={[0, Math.PI + headingRad, 0]} />
    </Center>
  );
}

// Errors thrown inside the three.js scene graph (bad GLTF parse, GL context
// loss, etc.) don't always reach a normal RN error boundary, but this still
// catches what does — cheap insurance so a render glitch can't blank the
// whole map screen.
class CanvasErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return <FallbackMarker />;
    return this.props.children;
  }
}

export function PetCharacter3D({ heading = 0, isMoving = false }: { heading?: number; isMoving?: boolean }) {
  const headingRad = (heading * Math.PI) / 180;
  const [modelUri, setModelUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Asset.fromModule(FOX_MODEL_MODULE)
      .downloadAsync()
      .then((asset) => {
        if (!cancelled) setModelUri(asset.localUri ?? asset.uri);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return <FallbackMarker />;

  if (!modelUri) {
    return <View style={{ width: SIZE, height: SIZE }} />;
  }

  return (
    <View style={{ width: SIZE, height: SIZE, overflow: 'hidden' }}>
      <CanvasErrorBoundary>
        <Canvas
          style={{ width: SIZE, height: SIZE, backgroundColor: 'transparent' }}
          camera={{ position: [0, 2, 6], fov: 45 }}
          gl={{ alpha: true, precision: 'lowp' }}
        >
          <ambientLight intensity={1} />
          <directionalLight position={[2, 3, 2]} intensity={2} />
          <Suspense fallback={<LoadingFallback />}>
            <Fox modelUri={modelUri} headingRad={headingRad} isMoving={isMoving} />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </View>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshBasicMaterial color="red" />
    </mesh>
  );
}

// Plain 2D dot shown if the 3D model fails to load or render — keeps the
// character's position on the map legible even in a worst-case failure.
function FallbackMarker() {
  return (
    <View
      style={{
        width: SIZE,
        height: SIZE,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: SIZE * 0.4,
          height: SIZE * 0.4,
          borderRadius: (SIZE * 0.4) / 2,
          backgroundColor: '#3478f6',
          borderWidth: 2,
          borderColor: 'white',
        }}
      />
    </View>
  );
}
