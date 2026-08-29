import { PetInfo } from '../types/pet';

let currentPet: PetInfo = {
  name: '몽이',
  breed: '포메라니안',
  avatarUrl: '',
};

export const petService = {
  async getPetInfo(): Promise<PetInfo> {
    return { ...currentPet };
  },

  async updatePetName(name: string): Promise<PetInfo> {
    currentPet.name = name;
    return { ...currentPet };
  },
};
