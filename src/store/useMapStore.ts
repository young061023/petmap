import { create } from 'zustand';
import type { Coordinates } from '@/src/types/location';

type MapState = {
  userLocation: Coordinates | null;
  setUserLocation: (location: Coordinates) => void;
};

export const useMapStore = create<MapState>((set) => ({
  userLocation: null,
  setUserLocation: (location) => set({ userLocation: location }),
}));
