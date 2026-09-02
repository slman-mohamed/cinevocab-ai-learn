import { Film } from "lucide-react";
import type { Movie } from "@/lib/types";
import { cn } from "@/lib/utils";

const shades = [
  "bg-pos-noun/20 text-pos-noun",
  "bg-pos-verb/20 text-pos-verb",
  "bg-pos-adj/20 text-pos-adj",
  "bg-pos-adv/20 text-pos-adv",
  "bg-pos-other/20 text-pos-other",
];

export function moviePoster(movie: Movie) {
  const seed = movie.id.charCodeAt(0) + movie.title.length;
  return shades[seed % shades.length];
}

interface Props {
  movie?: Movie | null;
  className?: string;
  textClassName?: string;
}

/** Poster image when available, otherwise a stylized initial badge. */
export function MovieThumb({ movie, className, textClassName }: Props) {
  if (movie?.poster) {
    return (
      <img
        src={movie.poster}
        alt={`${movie.title} poster`}
        loading="lazy"
        className={cn("shrink-0 object-cover", className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center font-mono font-semibold",
        movie ? moviePoster(movie) : "bg-raised text-muted",
        className,
        textClassName,
      )}
    >
      {movie ? movie.title.charAt(0).toUpperCase() : <Film className="size-5" />}
    </span>
  );
}
