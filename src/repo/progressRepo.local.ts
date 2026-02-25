import {
  createEmptyUserProgress,
  getLocalDateISO,
  type GrammarAttempt,
  type GrammarSessionCompletionRecord,
  type ProgressRepo,
  type UserProgress,
  type VocabGrade,
  type VocabQuizAttempt,
} from "@/repo/progressRepo";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type LocalProgressRepoOptions = {
  storage?: StorageLike | null;
  storageKey?: string;
  now?: () => Date;
};

type PersistedProgressEnvelope = {
  version: 1;
  progress: UserProgress;
};

const DEFAULT_STORAGE_KEY = "japanese-learning-app.progress.v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNonNegativeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 100) {
    return 100;
  }
  return Math.round(value * 100) / 100;
}

function sanitizeTimeLog(value: unknown): UserProgress["weeklyTimeLog"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((entry) => ({
      dateISO: typeof entry.dateISO === "string" ? entry.dateISO : getLocalDateISO(),
      seconds: Math.round(toNonNegativeNumber(entry.seconds)),
    }));
}

function sanitizeVocabGrades(value: unknown): UserProgress["vocabGrades"] {
  if (!isRecord(value)) {
    return {};
  }

  const output: UserProgress["vocabGrades"] = {};
  for (const [key, grade] of Object.entries(value)) {
    if (
      grade === "remembered" ||
      grade === "not_sure" ||
      grade === "didnt_remember"
    ) {
      output[key] = grade;
    }
  }

  return output;
}

function sanitizeVocabSessionCompletion(
  value: unknown,
): UserProgress["vocabSessionCompletion"] {
  if (!isRecord(value)) {
    return {};
  }

  const output: UserProgress["vocabSessionCompletion"] = {};
  for (const [key, record] of Object.entries(value)) {
    if (isRecord(record) && typeof record.completedAtISO === "string") {
      output[key] = { completedAtISO: record.completedAtISO };
    }
  }
  return output;
}

function sanitizeVocabQuizAttempts(value: unknown): UserProgress["vocabQuizAttempts"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((attempt) => ({
      sessionKey:
        typeof attempt.sessionKey === "string" ? attempt.sessionKey : "UNKNOWN:VOCAB:0",
      dateISO: typeof attempt.dateISO === "string" ? attempt.dateISO : getLocalDateISO(),
      correctCount: Math.round(toNonNegativeNumber(attempt.correctCount)),
      totalCount: Math.max(1, Math.round(toNonNegativeNumber(attempt.totalCount, 1))),
      accuracyPercent: clampPercent(toNonNegativeNumber(attempt.accuracyPercent)),
    }));
}

function sanitizeGrammarAttempts(value: unknown): UserProgress["grammarAttempts"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((attempt) => ({
      sessionKey:
        typeof attempt.sessionKey === "string" ? attempt.sessionKey : "UNKNOWN:GRAMMAR:0",
      dateISO: typeof attempt.dateISO === "string" ? attempt.dateISO : getLocalDateISO(),
      correctCount: Math.round(toNonNegativeNumber(attempt.correctCount)),
      totalCount: Math.max(1, Math.round(toNonNegativeNumber(attempt.totalCount, 1))),
      scorePercent: clampPercent(toNonNegativeNumber(attempt.scorePercent)),
    }));
}

function sanitizeBestScores(value: unknown): UserProgress["grammarBestScoreBySession"] {
  if (!isRecord(value)) {
    return {};
  }

  const output: UserProgress["grammarBestScoreBySession"] = {};
  for (const [key, score] of Object.entries(value)) {
    output[key] = clampPercent(toNonNegativeNumber(score));
  }
  return output;
}

function sanitizeGrammarSessionCompletion(
  value: unknown,
): UserProgress["grammarSessionCompletion"] {
  if (!isRecord(value)) {
    return {};
  }

  const output: UserProgress["grammarSessionCompletion"] = {};
  for (const [key, record] of Object.entries(value)) {
    if (!isRecord(record) || typeof record.completed !== "boolean") {
      continue;
    }
    output[key] = {
      completed: record.completed,
      ...(typeof record.completedAtISO === "string"
        ? { completedAtISO: record.completedAtISO }
        : {}),
    };
  }
  return output;
}

function sanitizeUserProgress(value: unknown): UserProgress {
  if (!isRecord(value)) {
    return createEmptyUserProgress();
  }

  return {
    weeklyGoalMinutes: Math.max(0, Math.round(toNonNegativeNumber(value.weeklyGoalMinutes, 120))),
    weeklyTimeLog: sanitizeTimeLog(value.weeklyTimeLog),
    vocabGrades: sanitizeVocabGrades(value.vocabGrades),
    vocabSessionCompletion: sanitizeVocabSessionCompletion(value.vocabSessionCompletion),
    vocabQuizAttempts: sanitizeVocabQuizAttempts(value.vocabQuizAttempts),
    grammarAttempts: sanitizeGrammarAttempts(value.grammarAttempts),
    grammarBestScoreBySession: sanitizeBestScores(value.grammarBestScoreBySession),
    grammarSessionCompletion: sanitizeGrammarSessionCompletion(value.grammarSessionCompletion),
  };
}

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export class LocalProgressRepo implements ProgressRepo {
  private readonly storage: StorageLike | null;
  private readonly storageKey: string;
  private readonly now: () => Date;

  constructor(options: LocalProgressRepoOptions = {}) {
    this.storage = options.storage ?? getBrowserStorage();
    this.storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
    this.now = options.now ?? (() => new Date());
  }

  async getProgress(): Promise<UserProgress> {
    return this.readProgress();
  }

  async saveProgress(progress: UserProgress): Promise<void> {
    this.writeProgress(progress);
  }

  async resetProgress(): Promise<void> {
    if (!this.storage) {
      return;
    }
    this.storage.removeItem(this.storageKey);
  }

  async setWeeklyGoalMinutes(minutes: number): Promise<UserProgress> {
    const next = await this.update((progress) => ({
      ...progress,
      weeklyGoalMinutes: Math.max(0, Math.round(minutes)),
    }));
    return next;
  }

  async addStudySeconds(dateISO: string, secondsDelta: number): Promise<UserProgress> {
    const increment = Math.max(0, Math.round(secondsDelta));
    if (!dateISO || increment <= 0) {
      return this.getProgress();
    }

    return this.update((progress) => {
      const existingIndex = progress.weeklyTimeLog.findIndex((entry) => entry.dateISO === dateISO);
      const weeklyTimeLog = [...progress.weeklyTimeLog];

      if (existingIndex >= 0) {
        const existing = weeklyTimeLog[existingIndex];
        weeklyTimeLog[existingIndex] = {
          ...existing,
          seconds: Math.max(0, existing.seconds + increment),
        };
      } else {
        weeklyTimeLog.push({ dateISO, seconds: increment });
      }

      weeklyTimeLog.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
      return { ...progress, weeklyTimeLog };
    });
  }

  async addWeeklyTimeLog(seconds: number, date = this.now()): Promise<UserProgress> {
    return this.addStudySeconds(getLocalDateISO(date), seconds);
  }

  async setVocabGrade(vocabItemId: string, grade: VocabGrade): Promise<UserProgress> {
    return this.update((progress) => ({
      ...progress,
      vocabGrades: { ...progress.vocabGrades, [vocabItemId]: grade },
    }));
  }

  async markVocabSessionCompleted(
    sessionKey: string,
    completedAt = this.now(),
  ): Promise<UserProgress> {
    return this.update((progress) => ({
      ...progress,
      vocabSessionCompletion: {
        ...progress.vocabSessionCompletion,
        [sessionKey]: {
          completedAtISO: completedAt.toISOString(),
        },
      },
    }));
  }

  async addVocabQuizAttempt(attempt: VocabQuizAttempt): Promise<UserProgress> {
    const normalized: VocabQuizAttempt = {
      ...attempt,
      correctCount: Math.max(0, Math.round(attempt.correctCount)),
      totalCount: Math.max(1, Math.round(attempt.totalCount)),
      accuracyPercent: clampPercent(attempt.accuracyPercent),
      dateISO: attempt.dateISO || getLocalDateISO(this.now()),
    };

    return this.update((progress) => ({
      ...progress,
      vocabQuizAttempts: [...progress.vocabQuizAttempts, normalized],
    }));
  }

  async addGrammarAttempt(attempt: GrammarAttempt): Promise<UserProgress> {
    const normalized: GrammarAttempt = {
      ...attempt,
      correctCount: Math.max(0, Math.round(attempt.correctCount)),
      totalCount: Math.max(1, Math.round(attempt.totalCount)),
      scorePercent: clampPercent(attempt.scorePercent),
      dateISO: attempt.dateISO || getLocalDateISO(this.now()),
    };

    return this.update((progress) => {
      const nextAttempts = [...progress.grammarAttempts, normalized];
      const existingBest = progress.grammarBestScoreBySession[normalized.sessionKey] ?? 0;
      const nextBest = Math.max(existingBest, normalized.scorePercent);

      return {
        ...progress,
        grammarAttempts: nextAttempts,
        grammarBestScoreBySession: {
          ...progress.grammarBestScoreBySession,
          [normalized.sessionKey]: nextBest,
        },
      };
    });
  }

  async setGrammarBestScore(
    sessionKey: string,
    scorePercent: number,
  ): Promise<UserProgress> {
    return this.update((progress) => ({
      ...progress,
      grammarBestScoreBySession: {
        ...progress.grammarBestScoreBySession,
        [sessionKey]: clampPercent(scorePercent),
      },
    }));
  }

  async setGrammarSessionCompletion(
    sessionKey: string,
    record: GrammarSessionCompletionRecord,
  ): Promise<UserProgress> {
    return this.update((progress) => ({
      ...progress,
      grammarSessionCompletion: {
        ...progress.grammarSessionCompletion,
        [sessionKey]: record.completed
          ? {
              completed: true,
              completedAtISO: record.completedAtISO ?? this.now().toISOString(),
            }
          : { completed: false },
      },
    }));
  }

  private async update(updater: (progress: UserProgress) => UserProgress): Promise<UserProgress> {
    const current = this.readProgress();
    const next = sanitizeUserProgress(updater(current));
    this.writeProgress(next);
    return next;
  }

  private readProgress(): UserProgress {
    if (!this.storage) {
      return createEmptyUserProgress();
    }

    const raw = this.storage.getItem(this.storageKey);
    if (!raw) {
      return createEmptyUserProgress();
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (isRecord(parsed) && parsed.version === 1 && "progress" in parsed) {
        return sanitizeUserProgress(parsed.progress);
      }

      // Backward-compat fallback if a raw progress object was stored.
      return sanitizeUserProgress(parsed);
    } catch {
      return createEmptyUserProgress();
    }
  }

  private writeProgress(progress: UserProgress): void {
    if (!this.storage) {
      return;
    }

    const payload: PersistedProgressEnvelope = {
      version: 1,
      progress: sanitizeUserProgress(progress),
    };

    try {
      this.storage.setItem(this.storageKey, JSON.stringify(payload));
    } catch {
      // localStorage quota/private-mode failures should not break the app
    }
  }
}

export function createLocalProgressRepo(
  options: LocalProgressRepoOptions = {},
): ProgressRepo {
  return new LocalProgressRepo(options);
}

export type { LocalProgressRepoOptions, StorageLike };
