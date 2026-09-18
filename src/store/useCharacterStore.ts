import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CharacterType = 'dog' | 'cat' | 'fox';

interface CharacterState {
  character: CharacterType;
  setCharacter: (character: CharacterType) => void;
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set) => ({
      character: 'dog',
      setCharacter: (character) => set({ character }),
    }),
    {
      name: 'petmap-character',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
