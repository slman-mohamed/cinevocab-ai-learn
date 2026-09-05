export type FrequencyLevel = "Very Common" | "Common" | "Uncommon" | "Rare";

export interface Movie {
  id: string;
  title: string;
  year?: string | undefined;
  /** optional poster image, stored as a compact data URL */
  poster?: string | undefined;
  createdAt: number;
}

export interface QAEntry {
  question: string;
  answer: string;
}

export interface ExtractedWord {
  word: string;
  ipa: string;
  partOfSpeech: string;
  frequency: FrequencyLevel;
  definition: string;
  examples: string[];
  /** follow-up questions the user asked about this word, with AI answers */
  qa?: QAEntry[] | undefined;
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
  /** Last Discover extraction so cards survive tab navigation. */
  lastSubmittedSentence?: string;
  lastResults?: ExtractedWord[];
  lastExplanation?: string | null;
}
