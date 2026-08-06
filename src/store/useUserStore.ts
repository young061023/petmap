import { create } from 'zustand';
import type { AppUser } from '@/src/types/user';

type UserState = {
  user: AppUser | null;
  setUser: (user: AppUser | null) => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
