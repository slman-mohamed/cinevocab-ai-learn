import { useSyncExternalStore } from "react";
import type { AppState, ExtractedWord, Movie, SavedWord } from "./types";

const KEY = "cinevocab.state.v1";

const empty: AppState = {
  movies: [],
  words: [],
  selectedMovieId: null,
  lastSubmittedSentence: "",
  lastResults: [],
  lastExplanation: null,
};

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
        lastSubmittedSentence: parsed.lastSubmittedSentence ?? "",
        lastResults: parsed.lastResults ?? [],
        lastExplanation: parsed.lastExplanation ?? null,
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

export const subscribeState = subscribe;

export function getState(): AppState {
  return state;
}

/** Union local and cloud data, keeping every movie and word from both sides. */
export function mergeState(incoming: Partial<AppState>) {
  const movies = [...state.movies];
  for (const m of incoming.movies ?? []) {
    if (!movies.some((x) => x.id === m.id)) movies.push(m);
  }
  const words = [...state.words];
  for (const w of incoming.words ?? []) {
    const dup = words.some(
      (x) =>
        x.id === w.id ||
        (x.movieId === w.movieId && x.word.toLowerCase() === w.word.toLowerCase()),
    );
    if (!dup) words.push(w);
  }
  set({
    movies: movies.sort((a, b) => a.createdAt - b.createdAt),
    words: words.sort((a, b) => a.createdAt - b.createdAt),
    selectedMovieId: state.selectedMovieId ?? incoming.selectedMovieId ?? null,
  });
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

export function addMovie(title: string, poster?: string): Movie {
  const movie: Movie = { id: id(), title: title.trim(), poster: poster || undefined, createdAt: Date.now() };
  set({ ...state, movies: [...state.movies, movie], selectedMovieId: movie.id });
  return movie;
}

/** Move a saved word from one movie folder to another. */
export function moveWord(wordId: string, movieId: string) {
  set({
    ...state,
    words: state.words.map((w) => (w.id === wordId ? { ...w, movieId } : w)),
  });
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

export function setDiscoveryResults(results: ExtractedWord[], explanation: string | null) {
  set({ ...state, lastResults: results, lastExplanation: explanation });
}

export function setDiscoverySentence(sentence: string) {
  set({ ...state, lastSubmittedSentence: sentence });
}

export function clearDiscovery() {
  set({ ...state, lastSubmittedSentence: "", lastResults: [], lastExplanation: null });
}
