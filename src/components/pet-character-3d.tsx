import { Center, Clone, useAnimations, useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Asset } from 'expo-asset';
import { Component, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, View } from 'react-native';
import type { Group } from 'three';

const SIZE = 112;
const IDLE_CLIP = 'Survey';
const WALK_CLIP = 'Walk';
const CROSSFADE_SECONDS = 0.3;
const VISIBILITY_FADE_MS = 220;

const SHADOW_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SHADOW_FRAGMENT_SHADER = `
  varying vec2 vUv;
  void main() {
    float dist = distance(vUv, vec2(0.5));
    float alpha = smoothstep(0.5, 0.1, dist) * 0.35;
    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
  }
`;

// Cheap fake "contact shadow" under the character's feet so it reads as
// standing on the tilted map instead of floating over it. Drei's <Shadow>
// builds its texture via document.createElement('canvas'), which doesn't
// exist on native — this draws the same soft radial blob with a plain GLSL
// shader instead, which works identically through expo-gl.
function GroundShadow({ y }: { y: number }) {
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
      <circleGeometry args={[0.75, 32]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        vertexShader={SHADOW_VERTEX_SHADER}
        fragmentShader={SHADOW_FRAGMENT_SHADER}
      />
    </mesh>
  );
}

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
  // fox.glb is plain, uncompressed glTF — Draco/Meshopt aren't needed, and
  // leaving drei's defaults on makes it try to set up MeshoptDecoder's WASM
  // module via WebAssembly.instantiate(), which Hermes doesn't implement.
  // That failure was silently killing the scene graph (blank canvas, no
  // thrown render error) instead of ever reaching the model.
  const { scene, animations } = useGLTF(modelUri, false, false);
  const { actions } = useAnimations(animations, group);
  const [shadowY, setShadowY] = useState(0);

  useEffect(() => {
    const action = actions[isMoving ? WALK_CLIP : IDLE_CLIP];
    action?.reset().fadeIn(CROSSFADE_SECONDS).play();
    return () => {
      action?.fadeOut(CROSSFADE_SECONDS);
    };
  }, [actions, isMoving]);

  // Center measures the model's bounding box in its own (pre-scale) units, so
  // convert its reported height into the scaled scene units the shadow lives
  // in to find the model's actual feet position — without touching Center's
  // own alignment, which is tuned to how the canvas camera frames it.
  const onCentered = useCallback(({ height }: { height: number }) => {
    setShadowY(-(height / 2) * 0.02);
  }, []);

  return (
    <>
      <Center scale={0.02} onCentered={onCentered}>
        {/* useGLTF caches and returns the SAME scene object across every
            mount (and this component mounts more than once — Suspense's
            dev-mode retry, marker re-renders). <primitive> just reparents
            that shared object, so an earlier mount reclaiming it (or
            unmounting) can leave the current one attached to nothing. Clone
            deep-clones per mount instead, matching drei's own Gltf helper. */}
        <Clone ref={group} object={scene} rotation={[0, Math.PI + headingRad, 0]} />
      </Center>
      <GroundShadow y={shadowY} />
    </>
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

export function PetCharacter3D({
  heading = 0,
  isMoving = false,
  hidden = false,
}: {
  heading?: number;
  isMoving?: boolean;
  hidden?: boolean;
}) {
  const headingRad = (heading * Math.PI) / 180;
  const [modelUri, setModelUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const opacity = useRef(new Animated.Value(hidden ? 0 : 1)).current;

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

  // Fades instead of hard-toggling so passing behind a 3D building doesn't
  // make the character pop in/out on every 300ms occlusion poll.
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: hidden ? 0 : 1,
      duration: VISIBILITY_FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [hidden, opacity]);

  let content: ReactNode;
  if (failed) {
    content = <FallbackMarker />;
  } else if (!modelUri) {
    content = <View style={{ width: SIZE, height: SIZE }} />;
  } else {
    content = (
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

  return <Animated.View style={{ opacity }}>{content}</Animated.View>;
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
