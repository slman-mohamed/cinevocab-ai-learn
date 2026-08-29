export type FrequencyLevel = "Very Common" | "Common" | "Uncommon" | "Rare";

export interface Movie {
  id: string;
  title: string;
  year?: string | undefined;
  createdAt: number;
}

export interface ExtractedWord {
  word: string;
  ipa: string;
  partOfSpeech: string;
  frequency: FrequencyLevel;
  definition: string;
  examples: string[];
}

export interface SavedWord extends ExtractedWord {
  id: string;
  movieId: string;
  sourceSentence: string;
  createdAt: number;
  /** spaced repetition */
  dueAt: number;
  intervalDays: number;
  reps: number;
}

export interface AppState {
  movies: Movie[];
  words: SavedWord[];
  selectedMovieId: string | null;
}
