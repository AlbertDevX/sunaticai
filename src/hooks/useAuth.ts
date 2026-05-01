import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, getUserProfile, createUserProfile, updateUserProfileInDB, signInWithGoogle as firebaseSignInWithGoogle, logOut } from '../lib/firebase';
import { UserProfile } from '../types';
import { timestampToISO } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchOrCreateProfile(firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // Listen for online/offline status
    const handleOnline = () => setOfflineMode(false);
    const handleOffline = () => setOfflineMode(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const extractBirthYear = (metadata: Record<string, unknown> | null): number | null => {
    if (!metadata) return null;
    // Firebase no tiene birthday por defecto, pero podemos verificar si existe
    if ((metadata as any).birthday && typeof (metadata as any).birthday === 'string') {
      const year = parseInt((metadata as any).birthday.split('-')[0]);
      if (!isNaN(year) && year > 1900) return year;
    }
    return null;
  };

  const fetchOrCreateProfile = async (firebaseUser: User) => {
    try {
      const { data, error } = await getUserProfile(firebaseUser.uid);

      if (error && !(error as any)?.message?.includes('offline')) {
        throw error;
      }

      if (!data) {
        const newProfile: Partial<UserProfile> = {
          id: firebaseUser.uid,
          email: firebaseUser.email ?? null,
          display_name: firebaseUser.displayName ?? null,
          avatar_url: firebaseUser.photoURL ?? null,
          age_verified: false,
          birth_year: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await createUserProfile(firebaseUser.uid, newProfile as any);
        setProfile(newProfile as UserProfile);
      } else {
        const profileData = data as any;
        setProfile({
          id: firebaseUser.uid,
          email: profileData.email ?? firebaseUser.email,
          display_name: profileData.display_name ?? firebaseUser.displayName,
          avatar_url: profileData.avatar_url ?? firebaseUser.photoURL,
          age_verified: profileData.age_verified ?? false,
          birth_year: profileData.birth_year ?? null,
          created_at: profileData.created_at ? timestampToISO(profileData.created_at) : new Date().toISOString(),
          updated_at: profileData.updated_at ? timestampToISO(profileData.updated_at) : new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error fetching/creating profile:', err);
      // Create a minimal profile from Firebase Auth data even if Firestore fails
      if (firebaseUser) {
        setProfile({
          id: firebaseUser.uid,
          email: firebaseUser.email ?? null,
          display_name: firebaseUser.displayName ?? null,
          avatar_url: firebaseUser.photoURL ?? null,
          age_verified: false,
          birth_year: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  async function signInWithGoogle() {
    const { user: firebaseUser, error } = await firebaseSignInWithGoogle();
    return { error };
  }

  async function signOut() {
    await logOut();
  }

  async function verifyAge() {
    if (!user) return;
    await updateUserProfileInDB(user.uid, { age_verified: true });
    setProfile(prev => prev ? { ...prev, age_verified: true } : null);
  }

  return { 
    user, 
    session: null, 
    profile, 
    loading, 
    offlineMode,
    signInWithGoogle, 
    signOut, 
    verifyAge 
  };
}
