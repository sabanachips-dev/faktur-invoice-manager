import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useMemo, useState } from "react";

export type SupabaseAppUser = { id: string; name: string; email: string | null };

export function toSupabaseAppUser(user: User | null): SupabaseAppUser | null {
  if (!user) return null;
  const name = typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : user.email?.split("@")[0] || "Pemilik bisnis";
  return { id: user.id, name, email: user.email ?? null };
}

export function useSupabaseAuth() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      setAuthUser(data.session?.user ?? null);
      setError(sessionError?.message ?? null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    setError(signOutError?.message ?? null);
  }, []);

  const state = useMemo(() => ({
    user: toSupabaseAppUser(authUser),
    loading,
    error,
    isAuthenticated: Boolean(authUser),
  }), [authUser, error, loading]);

  return { ...state, logout, setError };
}
