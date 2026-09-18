import { create } from 'zustand';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface MapState {
  location: Coordinates | null;
  heading: number | null;
  permissionStatus: string | null;
  setLocation: (location: Coordinates, heading?: number | null) => void;
  setPermissionStatus: (status: string) => void;
}

export const useMapStore = create<MapState>((set) => ({
  location: null,
  heading: null,
  permissionStatus: null,
  setLocation: (location, heading) =>
    set((state) => ({
      location,
      heading: heading != null && heading >= 0 ? heading : state.heading,
    })),
  setPermissionStatus: (status) => set({ permissionStatus: status }),
}));
