import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

function toUser(raw: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
} | null): AuthUser | null {
  if (!raw) return null;
  const meta = (raw.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: raw.id,
    email: raw.email ?? null,
    name: (meta['full_name'] as string) ?? (meta['name'] as string) ?? null,
    avatarUrl: (meta['avatar_url'] as string) ?? (meta['picture'] as string) ?? null,
  };
}

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toUser(session?.user ?? null));
      setLoading(false);
    });
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(toUser(session?.user ?? null));
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { user, loading };
}

/** Optional Google sign-in — shows the accounts already on the device. */
export async function signInWithGoogle() {
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
    extraParams: { prompt: "select_account" },
  });
  if (result.error) throw result.error;
  return result;
}

export async function signOut() {
  await supabase.auth.signOut();
}
