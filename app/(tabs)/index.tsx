import { Camera, Map, UserLocation } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/src/components/Themed';
import { useMapStore } from '@/src/store/useMapStore';

// OpenFreeMap 공개 인스턴스 - API 키 없이 사용 가능한 벡터 타일 스타일
// liberty 스타일에는 OpenMapTiles 스키마 기반 3D 건물 레이어("building-3d")가 이미 포함돼 있음
// (maptiler-3d-gl-style과 동일하게 render_height/render_min_height 사용) - pitch가 있어야 입체로 보임
const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export default function MapScreen() {
  const userLocation = useMapStore((state) => state.userLocation);
  const setUserLocation = useMapStore((state) => state.setUserLocation);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    })();
  }, [setUserLocation]);

  return (
    <View style={styles.container}>
      {permissionDenied && (
        <Text style={styles.notice}>위치 권한이 거부되어 현재 위치를 표시할 수 없습니다.</Text>
      )}
      <Map style={styles.map} mapStyle={MAP_STYLE_URL}>
        <Camera
          initialViewState={{
            center: userLocation
              ? [userLocation.longitude, userLocation.latitude]
              : [126.978, 37.5665], // 서울 시청 기본값
            zoom: 17,
            pitch: 60,
          }}
          trackUserLocation="default"
        />
        <UserLocation animated accuracy />
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  notice: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 1,
    textAlign: 'center',
    padding: 8,
  },
});
