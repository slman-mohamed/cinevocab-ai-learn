import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { addMovie } from "@/lib/store";
import { fileToPoster } from "@/lib/poster";
import { notify } from "@/lib/notify";
import type { Movie } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: (movie: Movie) => void;
}

export function AddMovieDialog({ open, onOpenChange, onAdded }: Props) {
  const [title, setTitle] = useState("");
  const [poster, setPoster] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      setPoster(await fileToPoster(file));
    } catch {
      notify("Could not read that image", "error");
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const movie = addMovie(title, poster ?? undefined);
    setTitle("");
    setPoster(null);
    onOpenChange(false);
    onAdded?.(movie);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-95 border-line bg-surface text-fg">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold text-fg">Add a movie</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Glass Horizon"
              className="mt-1.5 w-full rounded-[8px] border border-line bg-raised px-3 py-2.5 text-[14px] text-fg outline-none focus:border-accent/60"
            />
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              Poster
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void pick(e.target.files?.[0])}
            />
            {poster ? (
              <div className="mt-1.5 flex items-center gap-3">
                <img
                  src={poster}
                  alt="Selected poster"
                  className="h-24 w-16 rounded-[6px] border border-line object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPoster(null)}
                  className="flex items-center gap-1.5 rounded-[8px] border border-line bg-raised px-2.5 py-1.5 text-[12px] text-muted hover:text-destructive"
                >
                  <X className="size-3.5" /> Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-[8px] border border-dashed border-line py-4 text-[12px] font-medium text-muted transition-colors hover:border-accent/50 hover:text-accent"
              >
                <ImagePlus className="size-4" /> {busy ? "Reading image…" : "Upload poster"}
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!title.trim() || busy}
            className="w-full rounded-[9px] bg-accent py-3 text-[14px] font-semibold text-accent-foreground disabled:opacity-40"
          >
            Save movie
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
