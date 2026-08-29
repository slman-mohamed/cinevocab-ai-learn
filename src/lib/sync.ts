import { supabase } from "@/integrations/supabase/client";
import { getState, mergeState, subscribeState } from "./store";
import type { AppState } from "./types";

let started = false;
let userId: string | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

/**
 * Optional cloud sync: while signed in, the local word bank is merged with the
 * account's cloud copy and every change is pushed back, so laptop and phone
 * stay in step. Signed out, everything stays local only.
 */
export function startCloudSync() {
  if (started || typeof window === "undefined") return;
  started = true;

  const handle = (id: string | null) => {
    if (id === userId) return;
    userId = id;
    if (id) void pullAndMerge(id);
  };

  supabase.auth.onAuthStateChange((_event, session) => handle(session?.user?.id ?? null));
  void supabase.auth.getSession().then(({ data }) => handle(data.session?.user?.id ?? null));

  subscribeState(() => {
    if (!userId) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void push(), 700);
  });
}

async function pullAndMerge(id: string) {
  const { data, error } = await supabase
    .from("user_state")
    .select("payload")
    .eq("user_id", id)
    .maybeSingle();
  if (error) return;
  if (data?.payload) mergeState(data.payload as Partial<AppState>);
  await push();
}

async function push() {
  if (!userId) return;
  await supabase
    .from("user_state")
    .upsert({ user_id: userId, payload: getState(), updated_at: new Date().toISOString() });
}
