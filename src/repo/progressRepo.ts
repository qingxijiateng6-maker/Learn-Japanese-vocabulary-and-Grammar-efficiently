export type VocabGrade = "remembered" | "not_sure" | "didnt_remember";

export type TimeLogEntry = {
  dateISO: string;
  seconds: number;
};

export type VocabSessionCompletionRecord = {
  completedAtISO: string;
};

export type VocabQuizAttempt = {
  sessionKey: string;
  dateISO: string;
  correctCount: number;
  totalCount: number;
  accuracyPercent: number;
};

export type GrammarAttempt = {
  sessionKey: string;
  dateISO: string;
  correctCount: number;
  totalCount: number;
  scorePercent: number;
};

export type GrammarSessionCompletionRecord = {
  completed: boolean;
  completedAtISO?: string;
};

export type UserProgress = {
  weeklyGoalMinutes: number;
  weeklyTimeLog: TimeLogEntry[];
  vocabGrades: Record<string, VocabGrade>;
  vocabSessionCompletion: Record<string, VocabSessionCompletionRecord>;
  vocabQuizAttempts: VocabQuizAttempt[];
  grammarAttempts: GrammarAttempt[];
  grammarBestScoreBySession: Record<string, number>;
  grammarSessionCompletion: Record<string, GrammarSessionCompletionRecord>;
};

export type ProgressRepo = {
  getProgress(): Promise<UserProgress>;
  saveProgress(progress: UserProgress): Promise<void>;
  resetProgress(): Promise<void>;

  setWeeklyGoalMinutes(minutes: number): Promise<UserProgress>;
  addStudySeconds(dateISO: string, secondsDelta: number): Promise<UserProgress>;
  addWeeklyTimeLog(seconds: number, date?: Date): Promise<UserProgress>;

  setVocabGrade(vocabItemId: string, grade: VocabGrade): Promise<UserProgress>;
  markVocabSessionCompleted(
    sessionKey: string,
    completedAt?: Date,
  ): Promise<UserProgress>;
  addVocabQuizAttempt(attempt: VocabQuizAttempt): Promise<UserProgress>;

  addGrammarAttempt(attempt: GrammarAttempt): Promise<UserProgress>;
  setGrammarBestScore(sessionKey: string, scorePercent: number): Promise<UserProgress>;
  setGrammarSessionCompletion(
    sessionKey: string,
    record: GrammarSessionCompletionRecord,
  ): Promise<UserProgress>;
};

export const DEFAULT_WEEKLY_GOAL_MINUTES = 120;

export function createEmptyUserProgress(
  weeklyGoalMinutes = DEFAULT_WEEKLY_GOAL_MINUTES,
): UserProgress {
  return {
    weeklyGoalMinutes,
    weeklyTimeLog: [],
    vocabGrades: {},
    vocabSessionCompletion: {},
    vocabQuizAttempts: [],
    grammarAttempts: [],
    grammarBestScoreBySession: {},
    grammarSessionCompletion: {},
  };
}

export function getLocalDateISO(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
