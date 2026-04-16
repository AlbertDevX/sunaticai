import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchOrCreateProfile(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchOrCreateProfile(session.user);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, [fetchOrCreateProfile]);

  const extractBirthYear = (metadata: Record<string, unknown> | null): number | null => {
    if (!metadata) return null;
    if (metadata.birthday && typeof metadata.birthday === 'string') {
      const year = parseInt(metadata.birthday.split('-')[0]);
      if (!isNaN(year) && year > 1900) return year;
    }
    return null;
  };

  const fetchOrCreateProfile = useCallback(async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const metadata = user.user_metadata;
        const birthYear = extractBirthYear(metadata);
        const newProfile: Partial<UserProfile> = {
          id: user.id,
          email: user.email ?? null,
          display_name: metadata?.full_name ?? metadata?.name ?? null,
          avatar_url: metadata?.avatar_url ?? metadata?.picture ?? null,
          age_verified: birthYear ? new Date().getFullYear() - birthYear >= 18 : false,
          birth_year: birthYear,
        };
        const { data: created } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single();
        setProfile(created);
      } else {
        const metadata = user.user_metadata;
        const birthYear = extractBirthYear(metadata);
        if (birthYear && !data.age_verified) {
          const isAdult = new Date().getFullYear() - birthYear >= 18;
          if (isAdult) {
            await supabase
              .from('user_profiles')
              .update({ age_verified: true, birth_year: birthYear })
              .eq('id', user.id);
            data.age_verified = true;
          }
        }
        setProfile(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  async function signInWithGoogle() {
    const redirectTo = `${window.location.protocol}//${window.location.host}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'openid email profile',
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function verifyAge() {
    if (!user) return;
    await supabase
      .from('user_profiles')
      .update({ age_verified: true })
      .eq('id', user.id);
    setProfile(prev => prev ? { ...prev, age_verified: true } : null);
  }

  return { user, session, profile, loading, signInWithGoogle, signOut, verifyAge };
}
