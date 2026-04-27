import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  onAuthChange, 
  getUserProfile, 
  createUserProfile, 
  updateUserProfileInDB, 
  signInWithGoogle as firebaseSignInWithGoogle, 
  logOut,
  timestampToISO 
} from '../lib/firebase';
import { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

    return () => unsubscribe();
  }, []);

  const fetchOrCreateProfile = async (firebaseUser: User) => {
    try {
      const { data, error } = await getUserProfile(firebaseUser.uid);

      if (error) {
        if (error.code === 'unavailable' || error.message.includes('offline')) {
          console.warn("CodeSec Auth: Trabajando en modo offline. Usando datos de sesión local.");
          generateFallbackProfile(firebaseUser);
          return;
        }
        throw error;
      }

      if (!data) {
        const newProfile: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          display_name: firebaseUser.displayName,
          avatar_url: firebaseUser.photoURL,
          age_verified: false,
          birth_year: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await createUserProfile(firebaseUser.uid, newProfile);
        setProfile(newProfile);
      } else {
        setProfile({
          id: firebaseUser.uid,
          email: data.email ?? firebaseUser.email,
          display_name: data.display_name ?? firebaseUser.displayName,
          avatar_url: data.avatar_url ?? firebaseUser.photoURL,
          age_verified: data.age_verified ?? false,
          birth_year: data.birth_year ?? null,
          created_at: data.created_at ? timestampToISO(data.created_at) : new Date().toISOString(),
          updated_at: data.updated_at ? timestampToISO(data.updated_at) : new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error crítico en fetchOrCreateProfile:', err);
      generateFallbackProfile(firebaseUser);
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackProfile = (firebaseUser: User) => {
    setProfile({
      id: firebaseUser.uid,
      email: firebaseUser.email,
      display_name: firebaseUser.displayName,
      avatar_url: firebaseUser.photoURL,
      age_verified: false, 
      birth_year: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  };

  async function signInWithGoogle() {
    try {
      const { user: firebaseUser, error } = await firebaseSignInWithGoogle();
      if (error) return { error };
      return { user: firebaseUser };
    } catch (err) {
      return { error: err };
    }
  }

  async function signOut() {
    try {
      await logOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  }

  async function verifyAge() {
    if (!user) return;
    try {
      await updateUserProfileInDB(user.uid, { 
        age_verified: true,
        updated_at: new Date().toISOString() 
      });
      setProfile(prev => prev ? { ...prev, age_verified: true } : null);
    } catch (err) {
      console.error("No se pudo verificar la edad en la DB (¿Offline?):", err);
      // Actualizamos localmente para no bloquear la sesión actual
      setProfile(prev => prev ? { ...prev, age_verified: true } : null);
    }
  }

  return { 
    user, 
    profile, 
    loading, 
    signInWithGoogle, 
    signOut, 
    verifyAge 
  };
}
