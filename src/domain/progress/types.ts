export type WeekRange = {
  startISO: string;
  endISOExclusive: string;
};

export type WeeklyTimeLogEntry = {
  dateISO: string;
  seconds: number;
};

export type VocabSessionCompletionMap = Record<
  string,
  {
    completedAtISO: string;
  }
>;

export type GrammarSessionCompletionMap = Record<
  string,
  {
    completed: boolean;
    completedAtISO?: string;
  }
>;

export type GrammarBestScoreBySession = Record<string, number>;

export type WeeklyContentProgressInput = {
  weekRange: WeekRange;
  availableVocabSessionKeys: string[];
  availableGrammarSessionKeys: string[];
  vocabSessionCompletion: VocabSessionCompletionMap;
  grammarSessionCompletion: GrammarSessionCompletionMap;
};

export type WeeklyContentProgressResult = {
  percent: number;
  completedCount: number;
  totalCount: number;
};

export type GrammarBestAndCompletionUpdateResult = {
  bestScoreBySession: GrammarBestScoreBySession;
  completion: GrammarSessionCompletionMap;
};
