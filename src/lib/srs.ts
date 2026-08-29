import type { SavedWord } from "./types";

export type Rating = "hard" | "medium" | "easy";

const DAY = 24 * 60 * 60 * 1000;

export function nextSchedule(word: SavedWord, rating: Rating) {
  const prev = word.intervalDays || 1;
  const intervalDays =
    rating === "hard" ? 1 : rating === "medium" ? Math.max(2, Math.round(prev * 1.8)) : Math.max(4, Math.round(prev * 2.6));
  return {
    intervalDays,
    dueAt: Date.now() + intervalDays * DAY,
    reps: word.reps + 1,
  };
}

export function isDue(word: SavedWord) {
  return word.dueAt <= Date.now();
}

export function dueLabel(word: SavedWord) {
  const diff = word.dueAt - Date.now();
  if (diff <= 0) return "due now";
  const days = Math.ceil(diff / DAY);
  return days === 1 ? "due in 1d" : `due in ${days}d`;
}
