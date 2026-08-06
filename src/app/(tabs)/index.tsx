import {
  Camera,
  Map,
  Marker,
  type CameraRef,
  type MapRef,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, type NativeSyntheticEvent } from 'react-native';

import { PetCharacter3D } from '@/components/pet-character-3d';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useMapStore } from '@/store/useMapStore';
import { snapToNearestRoad, type Coordinates } from '@/utils/snapToRoad';

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const WALK_ANIMATION_MS = 1000;

// Exponential moving average weight applied to each raw GPS fix — lower
// values smooth out more jitter at the cost of a little lag.
const GPS_SMOOTHING_ALPHA = 0.35;

// How often the camera eases toward the character while idle/walking.
const FOLLOW_INTERVAL_MS = 200;
const FOLLOW_EASE_DURATION_MS = 350;
// How long to wait after the user stops panning/zooming before auto-follow
// takes back over.
const FOLLOW_RESUME_DELAY_MS = 2500;

function bearingBetween(from: Coordinates, to: Coordinates) {
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Interpolates between two headings along the shorter arc, so the character
// never spins the long way around through a 359°→0° crossing.
function shortestAngleLerp(from: number, to: number, t: number) {
  const delta = ((((to - from) % 360) + 540) % 360) - 180;
  return (from + delta * t + 360) % 360;
}

export default function MapScreen() {
  const location = useMapStore((state) => state.location);
  const setLocation = useMapStore((state) => state.setLocation);
  const permissionStatus = useMapStore((state) => state.permissionStatus);
  const setPermissionStatus = useMapStore((state) => state.setPermissionStatus);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [displayCoords, setDisplayCoords] = useState<Coordinates | null>(null);
  const [displayHeading, setDisplayHeading] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [isBehindBuilding, setIsBehindBuilding] = useState(false);
  const [snappedLocation, setSnappedLocation] = useState<Coordinates | null>(null);

  const walkFromRef = useRef<Coordinates | null>(null);
  const headingRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const displayCoordsRef = useRef<Coordinates | null>(null);
  const smoothedLocationRef = useRef<Coordinates | null>(null);
  const isUserInteractingRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Nudge the smoothed GPS fix onto the nearest road so the character stands
  // on a street instead of at an arbitrary point (GPS drift, courtyards,
  // etc.). Uses the character's actual projected screen point (not an
  // assumed map center), so this still works correctly if the user has
  // panned/zoomed away.
  useEffect(() => {
    if (!location) return;

    let cancelled = false;

    (async () => {
      const map = mapRef.current;
      if (!map) {
        if (!cancelled) setSnappedLocation(location);
        return;
      }
      try {
        const screenPoint = await map.project([location.longitude, location.latitude]);
        const snapped = await snapToNearestRoad(map, location, screenPoint);
        if (!cancelled) setSnappedLocation(snapped);
      } catch {
        if (!cancelled) setSnappedLocation(location);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location]);

  useEffect(() => {
    if (!snappedLocation) return;

    const from = walkFromRef.current ?? snappedLocation;
    const to = snappedLocation;
    const movedEnough = Math.abs(to.latitude - from.latitude) > 1e-9 || Math.abs(to.longitude - from.longitude) > 1e-9;
    const fromHeading = headingRef.current;
    const toHeading = movedEnough ? bearingBetween(from, to) : fromHeading;
    const start = Date.now();

    setIsMoving(movedEnough);

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);

    const step = () => {
      const t = Math.min(1, (Date.now() - start) / WALK_ANIMATION_MS);
      const next = {
        latitude: from.latitude + (to.latitude - from.latitude) * t,
        longitude: from.longitude + (to.longitude - from.longitude) * t,
      };
      setDisplayCoords(next);
      displayCoordsRef.current = next;
      setDisplayHeading(shortestAngleLerp(fromHeading, toHeading, t));

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        walkFromRef.current = to;
        headingRef.current = toHeading;
        setIsMoving(false);
      }
    };
    step();

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [snappedLocation]);

  // Polls the character's actual on-screen position (via project(), so this
  // stays correct even if the user has manually panned/zoomed the map) and
  // checks whether a building is rendered there — i.e. whether a building
  // sits between the camera and the character.
  useEffect(() => {
    let cancelled = false;

    const checkOcclusion = async () => {
      const coords = displayCoordsRef.current;
      const map = mapRef.current;
      if (!coords || !map) {
        if (!cancelled) setIsBehindBuilding(false);
        return;
      }
      try {
        const screenPoint = await map.project([coords.longitude, coords.latitude]);
        const features = await map.queryRenderedFeatures(screenPoint, { layers: ['building-3d'] });
        if (!cancelled) setIsBehindBuilding((features?.length ?? 0) > 0);
      } catch {
        // Query failed (e.g. map not ready yet) — fail open so the character
        // never gets stuck hidden.
        if (!cancelled) setIsBehindBuilding(false);
      }
    };

    checkOcclusion();
    const interval = setInterval(checkOcclusion, 300);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleRegionIsChanging = useCallback((event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    if (!event.nativeEvent.userInteraction) return;
    isUserInteractingRef.current = true;
    if (resumeTimeoutRef.current != null) clearTimeout(resumeTimeoutRef.current);
  }, []);

  const handleRegionDidChange = useCallback((event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    if (!event.nativeEvent.userInteraction) return;
    if (resumeTimeoutRef.current != null) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, FOLLOW_RESUME_DELAY_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current != null) clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  // Like Pokemon GO: the camera continuously glides toward the character, but
  // backs off the moment the user starts panning/zooming to look around, and
  // only resumes a couple seconds after they let go.
  useEffect(() => {
    const interval = setInterval(() => {
      if (isUserInteractingRef.current) return;
      const coords = displayCoordsRef.current;
      if (!coords) return;
      cameraRef.current?.easeTo({
        center: [coords.longitude, coords.latitude],
        zoom: 18,
        pitch: 60,
        duration: FOLLOW_EASE_DURATION_MS,
      });
    }, FOLLOW_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  if (permissionStatus !== 'granted') {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>{errorMessage ?? '위치 권한을 요청하는 중...'}</ThemedText>
      </ThemedView>
    );
  }

  if (!displayCoords) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return (
    <Map
      ref={mapRef}
      style={styles.map}
      mapStyle={MAP_STYLE_URL}
      onRegionIsChanging={handleRegionIsChanging}
      onRegionDidChange={handleRegionDidChange}
    >
      <Camera
        ref={cameraRef}
        initialViewState={{
          center: [displayCoords.longitude, displayCoords.latitude],
          zoom: 18,
          pitch: 60,
        }}
      />
      {!isBehindBuilding && (
        <Marker lngLat={[displayCoords.longitude, displayCoords.latitude]} anchor="center">
          <PetCharacter3D heading={displayHeading} isMoving={isMoving} />
        </Marker>
      )}
    </Map>
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
