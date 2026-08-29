import { useSyncExternalStore } from "react";
import type { AppState, ExtractedWord, Movie, SavedWord } from "./types";

const KEY = "cinevocab.state.v1";

const empty: AppState = { movies: [], words: [], selectedMovieId: null };

let state: AppState = empty;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

export function hydrateStore() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      state = {
        movies: parsed.movies ?? [],
        words: parsed.words ?? [],
        selectedMovieId: parsed.selectedMovieId ?? null,
      };
    }
  } catch {
    state = empty;
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const getSnapshot = () => state;
const getServerSnapshot = () => empty;

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function set(next: AppState) {
  state = next;
  persist();
  emit();
}

const id = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function addMovie(title: string, year?: string): Movie {
  const movie: Movie = { id: id(), title: title.trim(), year: year?.trim() || undefined, createdAt: Date.now() };
  set({ ...state, movies: [...state.movies, movie], selectedMovieId: movie.id });
  return movie;
}

export function removeMovie(movieId: string) {
  set({
    ...state,
    movies: state.movies.filter((m) => m.id !== movieId),
    words: state.words.filter((w) => w.movieId !== movieId),
    selectedMovieId: state.selectedMovieId === movieId ? null : state.selectedMovieId,
  });
}

export function selectMovie(movieId: string | null) {
  set({ ...state, selectedMovieId: movieId });
}

export function saveWord(word: ExtractedWord, movieId: string, sourceSentence: string): SavedWord {
  const saved: SavedWord = {
    ...word,
    id: id(),
    movieId,
    sourceSentence,
    createdAt: Date.now(),
    dueAt: Date.now(),
    intervalDays: 0,
    reps: 0,
  };
  set({ ...state, words: [...state.words, saved] });
  return saved;
}

export function deleteWord(wordId: string) {
  set({ ...state, words: state.words.filter((w) => w.id !== wordId) });
}

export function updateWord(wordId: string, patch: Partial<SavedWord>) {
  set({
    ...state,
    words: state.words.map((w) => (w.id === wordId ? { ...w, ...patch } : w)),
  });
}

export function isSaved(word: string, movieId: string | null) {
  return state.words.some(
    (w) => w.movieId === movieId && w.word.toLowerCase() === word.toLowerCase(),
  );
}
