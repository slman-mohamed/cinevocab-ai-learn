import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { signInWithGoogle, signOut, useAuthUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-2.8-.4-4.1H24v7.8h12.1c-.2 2-1.5 5-5 7l-.1.3 5.4 4.2.4.1c3.4-3.2 5.3-7.9 5.3-13.4z"
      />
      <path
        fill="#34A853"
        d="M24 46c5 0 9.1-1.6 12.2-4.4l-5.8-4.5c-1.6 1.1-3.7 1.9-6.4 1.9-4.9 0-9-3.2-10.5-7.6l-.3.1-5.6 4.3-.1.3C10.5 42.1 16.8 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M13.5 31.4c-.4-1.2-.6-2.4-.6-3.7s.2-2.6.6-3.8l-.1-.3-5.7-4.4-.2.1A21.9 21.9 0 0 0 5 27.7c0 3.5.9 6.9 2.5 9.9l6-6.2z"
      />
      <path
        fill="#EA4335"
        d="M24 13.6c3.5 0 5.8 1.5 7.2 2.8l5.2-5.1C33.1 8.3 29 6 24 6c-7.2 0-13.5 4-16.5 10.2l6.1 4.7c1.5-4.4 5.5-7.3 10.4-7.3z"
      />
    </svg>
  );
}

export function AccountButton() {
  const { user, loading } = useAuthUser();
  const [busy, setBusy] = useState(false);

  const onSignIn = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Sign-in failed", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <span className="grid size-8 place-items-center rounded-full border border-line bg-surface" />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => void onSignIn()}
        disabled={busy}
        aria-label="Sign in with Google to sync your word bank"
        className="grid size-8 place-items-center rounded-full border border-line bg-surface transition-colors hover:bg-raised disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin text-muted" />
        ) : (
          <GoogleMark className="size-4" />
        )}
      </button>
    );
  }

  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Account"
          className="grid size-8 place-items-center overflow-hidden rounded-full border border-line bg-raised"
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="font-mono text-[12px] font-semibold text-accent">{initial}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-56 rounded-xl border-line bg-raised p-2 text-fg"
      >
        <div className="px-2 pt-1 pb-2">
          <p className="truncate text-[13px] font-semibold">{user.name ?? "Signed in"}</p>
          <p className="truncate font-mono text-[10px] text-muted">{user.email}</p>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
            Syncing
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void signOut().then(() => notify("Signed out"));
          }}
          className="flex w-full items-center gap-2 rounded-[9px] px-2 py-2 text-[13px] font-medium text-fg transition-colors hover:bg-surface"
        >
          <LogOut className="size-3.5 text-muted" /> Log out
        </button>
      </PopoverContent>
    </Popover>
  );
}
