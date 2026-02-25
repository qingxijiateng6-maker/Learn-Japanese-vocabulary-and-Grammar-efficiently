import {
  calcTimeProgressPercent,
  calcWeeklyContentProgress,
  calcWeeklyTimeSeconds,
  getWeekRange,
  isGrammarSessionCompleted,
  isVocabSessionCompleted,
  shouldMarkVocabCompleted,
  updateGrammarBestAndCompletion,
} from "@/domain/progress/calc";
import type {
  GrammarSessionCompletionMap,
  VocabSessionCompletionMap,
} from "@/domain/progress/types";

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

export function runProgressCalcTests(): void {
  const week = getWeekRange(new Date("2026-02-25T12:00:00")); // Wednesday
  assertEqual(week.startISO, "2026-02-23", "Week start should be Monday");
  assertEqual(week.endISOExclusive, "2026-03-02", "Week end exclusive should be next Monday");

  const weeklyTimeSeconds = calcWeeklyTimeSeconds(
    [
      { dateISO: "2026-02-22", seconds: 120 }, // previous week
      { dateISO: "2026-02-23", seconds: 600 },
      { dateISO: "2026-02-25", seconds: 900 },
      { dateISO: "2026-03-02", seconds: 500 }, // exclusive boundary
    ],
    week,
  );
  assertEqual(weeklyTimeSeconds, 1500, "Weekly time seconds should sum only in-range days");

  assertEqual(calcTimeProgressPercent(120, 0), 0, "0 seconds should be 0%");
  assertEqual(calcTimeProgressPercent(120, 7200), 100, "Goal hit should be 100%");
  assertEqual(calcTimeProgressPercent(120, 3600), 50, "Half goal should be 50%");
  assertEqual(calcTimeProgressPercent(120, 999999), 100, "Percent should clamp to 100%");

  const vocabCompletion: VocabSessionCompletionMap = {
    "A2:VOCAB:1": { completedAtISO: "2026-02-24T11:00:00.000Z" },
  };
  assert(isVocabSessionCompleted(vocabCompletion, "A2:VOCAB:1"), "Vocab session should be completed");
  assert(
    !isVocabSessionCompleted(vocabCompletion, "A2:VOCAB:2"),
    "Missing vocab completion should be false",
  );

  const grammarCompletion: GrammarSessionCompletionMap = {
    "A2:GRAMMAR:1": { completed: false },
  };
  assert(
    !isGrammarSessionCompleted(grammarCompletion, "A2:GRAMMAR:1"),
    "Incomplete grammar session should be false",
  );

  assert(
    shouldMarkVocabCompleted(3, 3),
    "Vocab should be completed when seenCount equals totalCards",
  );
  assert(
    !shouldMarkVocabCompleted(2, 3),
    "Vocab should not be completed when seenCount is lower",
  );
  assert(
    !shouldMarkVocabCompleted(0, 0),
    "Empty sessions should not auto-complete",
  );

  const firstGrammarUpdate = updateGrammarBestAndCompletion(
    {},
    {},
    "A2:GRAMMAR:1",
    66.67,
    "2026-02-24T12:00:00.000Z",
  );
  assertEqual(
    firstGrammarUpdate.bestScoreBySession["A2:GRAMMAR:1"],
    67,
    "Best score should be rounded/clamped",
  );
  assertEqual(
    firstGrammarUpdate.completion["A2:GRAMMAR:1"]?.completed,
    false,
    "Grammar should remain incomplete below 80%",
  );

  const secondGrammarUpdate = updateGrammarBestAndCompletion(
    firstGrammarUpdate.bestScoreBySession,
    firstGrammarUpdate.completion,
    "A2:GRAMMAR:1",
    80,
    "2026-02-25T15:30:00.000Z",
  );
  assertEqual(
    secondGrammarUpdate.bestScoreBySession["A2:GRAMMAR:1"],
    80,
    "Best score should update to new max",
  );
  assertEqual(
    secondGrammarUpdate.completion["A2:GRAMMAR:1"]?.completed,
    true,
    "Grammar should complete at 80%",
  );
  assertEqual(
    secondGrammarUpdate.completion["A2:GRAMMAR:1"]?.completedAtISO,
    "2026-02-25T15:30:00.000Z",
    "Grammar completion should set completedAtISO on first completion",
  );

  const thirdGrammarUpdate = updateGrammarBestAndCompletion(
    secondGrammarUpdate.bestScoreBySession,
    secondGrammarUpdate.completion,
    "A2:GRAMMAR:1",
    95,
    "2026-02-26T18:00:00.000Z",
  );
  assertEqual(
    thirdGrammarUpdate.completion["A2:GRAMMAR:1"]?.completedAtISO,
    "2026-02-25T15:30:00.000Z",
    "Completion timestamp should not be overwritten after already completed",
  );

  const weeklyContent = calcWeeklyContentProgress({
    weekRange: week,
    availableVocabSessionKeys: ["A2:VOCAB:1", "A2:VOCAB:2"],
    availableGrammarSessionKeys: ["A2:GRAMMAR:1", "A2:GRAMMAR:2"],
    vocabSessionCompletion: {
      "A2:VOCAB:1": { completedAtISO: "2026-02-24T11:00:00.000Z" },
      "A2:VOCAB:2": { completedAtISO: "2026-02-10T11:00:00.000Z" },
    },
    grammarSessionCompletion: {
      "A2:GRAMMAR:1": { completed: true, completedAtISO: "2026-02-25T09:00:00.000Z" },
      "A2:GRAMMAR:2": { completed: true, completedAtISO: "2026-03-03T09:00:00.000Z" },
    },
  });
  assertEqual(weeklyContent.completedCount, 2, "Completed weekly content count should be 2");
  assertEqual(weeklyContent.totalCount, 4, "Total content count should be 4");
  assertEqual(weeklyContent.percent, 50, "Weekly content percent should be 50%");
}

runProgressCalcTests();
console.log("Progress calc tests passed.");
