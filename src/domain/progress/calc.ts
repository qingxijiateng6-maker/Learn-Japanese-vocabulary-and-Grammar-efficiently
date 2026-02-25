import type {
  GrammarBestAndCompletionUpdateResult,
  GrammarBestScoreBySession,
  GrammarSessionCompletionMap,
  VocabSessionCompletionMap,
  WeekRange,
  WeeklyContentProgressInput,
  WeeklyContentProgressResult,
  WeeklyTimeLogEntry,
} from "@/domain/progress/types";

const GRAMMAR_COMPLETION_THRESHOLD_PERCENT = 80;

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value <= 0) {
    return 0;
  }
  if (value >= 100) {
    return 100;
  }
  return Math.round(value);
}

function localDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isISODateInRange(dateISO: string, weekRange: WeekRange): boolean {
  return dateISO >= weekRange.startISO && dateISO < weekRange.endISOExclusive;
}

function toLocalDateISOFromTimestamp(timestampISO: string | undefined): string | null {
  if (!timestampISO) {
    return null;
  }

  const parsed = new Date(timestampISO);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return localDateISO(parsed);
}

export function getWeekRange(
  date: Date,
  weekStartsOnMonday = true,
): { startISO: string; endISOExclusive: string } {
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayIndex = localDate.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
  const offsetToWeekStart = weekStartsOnMonday ? (dayIndex + 6) % 7 : dayIndex;
  const weekStart = addDays(localDate, -offsetToWeekStart);
  const weekEndExclusive = addDays(weekStart, 7);

  return {
    startISO: localDateISO(weekStart),
    endISOExclusive: localDateISO(weekEndExclusive),
  };
}

export function calcTimeProgressPercent(
  weeklyGoalMinutes: number,
  weeklyTimeSeconds: number,
): number {
  const goalSeconds = Math.max(0, weeklyGoalMinutes) * 60;
  if (goalSeconds <= 0) {
    return 0;
  }

  return clampPercent((weeklyTimeSeconds / goalSeconds) * 100);
}

export function calcWeeklyTimeSeconds(
  weeklyTimeLog: WeeklyTimeLogEntry[],
  weekRange: WeekRange,
): number {
  return weeklyTimeLog.reduce((sum, entry) => {
    if (!entry || typeof entry.dateISO !== "string" || typeof entry.seconds !== "number") {
      return sum;
    }

    if (!isISODateInRange(entry.dateISO, weekRange)) {
      return sum;
    }

    return sum + Math.max(0, Math.round(entry.seconds));
  }, 0);
}

export function isVocabSessionCompleted(
  vocabSessionCompletion: VocabSessionCompletionMap,
  sessionKey: string,
): boolean {
  return Boolean(vocabSessionCompletion[sessionKey]?.completedAtISO);
}

export function isGrammarSessionCompleted(
  grammarSessionCompletion: GrammarSessionCompletionMap,
  sessionKey: string,
): boolean {
  return grammarSessionCompletion[sessionKey]?.completed === true;
}

export function shouldMarkVocabCompleted(seenCount: number, totalCards: number): boolean {
  if (totalCards <= 0) {
    return false;
  }
  return seenCount === totalCards;
}

export function updateGrammarBestAndCompletion(
  bestScoreBySession: GrammarBestScoreBySession,
  completion: GrammarSessionCompletionMap,
  sessionKey: string,
  newScorePct: number,
  completedAtISO: string,
): GrammarBestAndCompletionUpdateResult {
  const normalizedScore = clampPercent(newScorePct);
  const currentBest = bestScoreBySession[sessionKey] ?? 0;
  const nextBest = Math.max(currentBest, normalizedScore);
  const currentCompletion = completion[sessionKey];
  const alreadyCompleted = currentCompletion?.completed === true;
  const reachesCompletion = nextBest >= GRAMMAR_COMPLETION_THRESHOLD_PERCENT;

  const nextCompletionRecord =
    alreadyCompleted
      ? currentCompletion
      : reachesCompletion
        ? {
            completed: true as const,
            completedAtISO,
          }
        : {
            completed: false as const,
          };

  return {
    bestScoreBySession: {
      ...bestScoreBySession,
      [sessionKey]: nextBest,
    },
    completion: {
      ...completion,
      [sessionKey]: nextCompletionRecord,
    },
  };
}

export function calcWeeklyContentProgress(
  input: WeeklyContentProgressInput,
): WeeklyContentProgressResult {
  const vocabKeys = [...new Set(input.availableVocabSessionKeys)];
  const grammarKeys = [...new Set(input.availableGrammarSessionKeys)];
  const totalCount = vocabKeys.length + grammarKeys.length;

  let completedCount = 0;

  for (const sessionKey of vocabKeys) {
    const completionRecord = input.vocabSessionCompletion[sessionKey];
    const completedDateISO = toLocalDateISOFromTimestamp(completionRecord?.completedAtISO);
    if (completedDateISO && isISODateInRange(completedDateISO, input.weekRange)) {
      completedCount += 1;
    }
  }

  for (const sessionKey of grammarKeys) {
    const completionRecord = input.grammarSessionCompletion[sessionKey];
    if (!completionRecord?.completed) {
      continue;
    }
    const completedDateISO = toLocalDateISOFromTimestamp(completionRecord.completedAtISO);
    if (completedDateISO && isISODateInRange(completedDateISO, input.weekRange)) {
      completedCount += 1;
    }
  }

  const percent = totalCount <= 0 ? 0 : clampPercent((completedCount / totalCount) * 100);
  return { percent, completedCount, totalCount };
}

export const progressCalcConstants = {
  GRAMMAR_COMPLETION_THRESHOLD_PERCENT,
} as const;
