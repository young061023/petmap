import type { Session } from '@supabase/supabase-js';
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '@/services/authService';
import { profileService } from '@/services/profileService';
import { supabase } from '@/services/supabase';
import type { AuthStatus, SignInInput, SignUpInput } from '@/types/auth';
import type { PetProfile, UserProfile } from '@/types/user';

interface AuthContextValue { status: AuthStatus; profile: UserProfile | null; signIn: (input: SignInInput) => Promise<void>; signUp: (input: SignUpInput) => Promise<boolean>; signOut: () => Promise<void>; savePet: (pet: Omit<PetProfile, 'id'>) => Promise<void>; updatePetName: (name: string) => Promise<void>; }
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const hydrate = async (session: Session | null) => {
    if (!session?.user) { setProfile(null); setStatus('unauthenticated'); return; }
    try {
      const nextProfile = await authService.getProfile(session.user.id, session.user.email ?? '');
      const pet = await profileService.getPet(session.user.id);
      setProfile({ ...nextProfile, pet }); setStatus('authenticated');
    } catch { setProfile(null); setStatus('unauthenticated'); }
  };
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => hydrate(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => void hydrate(session));
    return () => data.subscription.unsubscribe();
  }, []);
  const value = useMemo<AuthContextValue>(() => ({
    status, profile,
    signIn: async (input) => { const next = await authService.signIn(input); const pet = await profileService.getPet(next.id); setProfile({ ...next, pet }); setStatus('authenticated'); },
    signUp: async (input) => { const next = await authService.signUp(input); if (!next) return false; setProfile(next); setStatus('authenticated'); return true; },
    signOut: async () => { await authService.signOut(); setProfile(null); setStatus('unauthenticated'); },
    savePet: async (pet) => { if (!profile) throw new Error('로그인이 필요해요.'); setProfile(await profileService.updatePet(profile, pet)); },
    updatePetName: async (name) => { if (!profile) throw new Error('로그인이 필요해요.'); setProfile(await profileService.updatePetName(profile, name)); },
  }), [profile, status]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be used inside AuthProvider'); return value; }
