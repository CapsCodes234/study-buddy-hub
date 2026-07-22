import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export type SignUpResult = {
  requiresEmailConfirmation: boolean;
};

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  completeOnboarding: () => Promise<Profile>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

type AuthProviderProps = {
  children: ReactNode;
};

async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const {
        data: { session: restoredSession },
        error,
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (error) {
        console.error('Unable to restore Supabase session:', error);
        setSession(null);
      } else {
        setSession(restoredSession);
      }

      setLoading(false);
    };

    void restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) {
        return;
      }

      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const userId = session?.user.id;

    if (!userId) {
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);

      return () => {
        active = false;
      };
    }

    setProfileLoading(true);
    setProfileError(null);

    void fetchProfile(userId)
      .then((nextProfile) => {
        if (active) {
          setProfile(nextProfile);
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load your profile.';

        console.error('Unable to load Supabase profile:', error);
        setProfile(null);
        setProfileError(message);
      })
      .finally(() => {
        if (active) {
          setProfileLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [session?.user.id]);

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    const userId = session?.user.id;

    if (!userId) {
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      return null;
    }

    setProfileLoading(true);
    setProfileError(null);

    try {
      const nextProfile = await fetchProfile(userId);
      setProfile(nextProfile);
      return nextProfile;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load your profile.';

      console.error('Unable to refresh Supabase profile:', error);
      setProfileError(message);
      throw error;
    } finally {
      setProfileLoading(false);
    }
  }, [session?.user.id]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw error;
    }
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string,
    ): Promise<SignUpResult> => {
      const cleanDisplayName = displayName?.trim();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: cleanDisplayName
          ? {
              data: {
                display_name: cleanDisplayName,
              },
            }
          : undefined,
      });

      if (error) {
        throw error;
      }

      return {
        requiresEmailConfirmation: data.session === null,
      };
    },
    [],
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setProfile(null);
    setProfileError(null);
  }, []);

  const completeOnboarding = useCallback(async (): Promise<Profile> => {
    const userId = session?.user.id;

    if (!userId) {
      throw new Error('Authentication required.');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        onboarding_status: 'completed',
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    setProfile(data);
    setProfileError(null);

    return data;
  }, [session?.user.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      profileLoading,
      profileError,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      completeOnboarding,
    }),
    [
      completeOnboarding,
      loading,
      profile,
      profileError,
      profileLoading,
      refreshProfile,
      session,
      signIn,
      signOut,
      signUp,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
