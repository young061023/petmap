import type { MapRef } from '@maplibre/maplibre-react-native';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const ROAD_LAYERS = [
  'road_path_pedestrian',
  'road_minor',
  'road_secondary_tertiary',
  'road_trunk_primary',
  'road_link',
  'road_service_track',
];

const QUERY_RADIUS_PX = 160;
const MAX_SNAP_DISTANCE_METERS = 60;
const METERS_PER_DEGREE = 111320;

function closestPointOnSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) return { x: x1, y: y1 };

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
  return { x: x1 + t * dx, y: y1 + t * dy };
}

/**
 * Finds the nearest point on a nearby road to `point` and returns it, so the
 * character appears to stand on a road instead of at its raw GPS fix. Falls
 * back to `point` unchanged if no road is within MAX_SNAP_DISTANCE_METERS.
 */
export async function snapToNearestRoad(
  mapRef: MapRef,
  point: Coordinates,
  screenCenter: [number, number],
): Promise<Coordinates> {
  const box: [[number, number], [number, number]] = [
    [screenCenter[0] - QUERY_RADIUS_PX, screenCenter[1] - QUERY_RADIUS_PX],
    [screenCenter[0] + QUERY_RADIUS_PX, screenCenter[1] + QUERY_RADIUS_PX],
  ];

  const features = await mapRef.queryRenderedFeatures(box, { layers: ROAD_LAYERS });
  if (!features || features.length === 0) return point;

  // Flatten lng/lat into a locally-flat, roughly-equal-scale plane so plain
  // Euclidean distance comparisons are meaningful.
  const lngScale = Math.cos((point.latitude * Math.PI) / 180);
  const px = point.longitude * lngScale;
  const py = point.latitude;

  let bestX = px;
  let bestY = py;
  let bestDistSq = Infinity;

  for (const feature of features) {
    const geometry = feature.geometry;
    const lines: number[][][] =
      geometry.type === 'LineString'
        ? [geometry.coordinates as number[][]]
        : geometry.type === 'MultiLineString'
          ? (geometry.coordinates as number[][][])
          : [];

    for (const line of lines) {
      for (let i = 0; i < line.length - 1; i++) {
        const [lng1, lat1] = line[i];
        const [lng2, lat2] = line[i + 1];
        const candidate = closestPointOnSegment(px, py, lng1 * lngScale, lat1, lng2 * lngScale, lat2);
        const dx = candidate.x - px;
        const dy = candidate.y - py;
        const distSq = dx * dx + dy * dy;

        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          bestX = candidate.x;
          bestY = candidate.y;
        }
      }
    }
  }

  const maxSnapDistanceDeg = MAX_SNAP_DISTANCE_METERS / METERS_PER_DEGREE;
  if (Math.sqrt(bestDistSq) > maxSnapDistanceDeg) return point;

  return { longitude: bestX / lngScale, latitude: bestY };
}
