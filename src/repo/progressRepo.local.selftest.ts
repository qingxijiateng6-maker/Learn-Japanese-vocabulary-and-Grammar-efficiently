import { createLocalProgressRepo, type StorageLike } from "@/repo/progressRepo.local";
import { getLocalDateISO } from "@/repo/progressRepo";

class MemoryStorage implements StorageLike {
  private readonly map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(`ProgressRepo self-test failed: ${message}`);
  }
}

export async function runProgressRepoSelfTests(): Promise<void> {
  const storage = new MemoryStorage();
  const fixedNow = new Date("2026-02-25T10:30:00");
  const repo = createLocalProgressRepo({
    storage,
    storageKey: "test.progress.v1",
    now: () => fixedNow,
  });

  const initial = await repo.getProgress();
  assert(initial.weeklyGoalMinutes > 0, "default weekly goal should be initialized");
  assert(initial.weeklyTimeLog.length === 0, "initial weeklyTimeLog should be empty");

  await repo.addWeeklyTimeLog(90, fixedNow);
  const afterTime = await repo.getProgress();
  assert(afterTime.weeklyTimeLog.length === 1, "time log should contain one day entry");
  assert(afterTime.weeklyTimeLog[0]?.dateISO === getLocalDateISO(fixedNow), "dateISO mismatch");
  assert(afterTime.weeklyTimeLog[0]?.seconds === 90, "time log seconds mismatch");

  await repo.setVocabGrade("a2-s1-001", "remembered");
  await repo.markVocabSessionCompleted("A2:VOCAB:1", fixedNow);
  const afterVocab = await repo.getProgress();
  assert(afterVocab.vocabGrades["a2-s1-001"] === "remembered", "vocab grade not saved");
  assert(!!afterVocab.vocabSessionCompletion["A2:VOCAB:1"], "vocab completion not saved");

  await repo.addGrammarAttempt({
    sessionKey: "A2:GRAMMAR:1",
    dateISO: getLocalDateISO(fixedNow),
    correctCount: 2,
    totalCount: 3,
    scorePercent: 66.67,
  });
  await repo.addGrammarAttempt({
    sessionKey: "A2:GRAMMAR:1",
    dateISO: getLocalDateISO(fixedNow),
    correctCount: 3,
    totalCount: 3,
    scorePercent: 100,
  });
  const afterGrammar = await repo.getProgress();
  assert(afterGrammar.grammarAttempts.length === 2, "grammar attempts should be appended");
  assert(
    afterGrammar.grammarBestScoreBySession["A2:GRAMMAR:1"] === 100,
    "grammar best score should track max",
  );

  await repo.setGrammarSessionCompletion("A2:GRAMMAR:1", { completed: true });
  const afterCompletion = await repo.getProgress();
  assert(
    afterCompletion.grammarSessionCompletion["A2:GRAMMAR:1"]?.completed === true,
    "grammar session completion should persist",
  );
}
