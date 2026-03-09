import { createLocalProgressRepo, createMemoryStorage } from "@/repo/progressRepo.local";
import { getLocalDateISO } from "@/repo/progressRepo";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(`ProgressRepo self-test failed: ${message}`);
  }
}

export async function runProgressRepoSelfTests(): Promise<void> {
  const storage = createMemoryStorage();
  const fixedNow = new Date("2026-02-25T10:30:00");
  const repo = createLocalProgressRepo({
    storage,
    storageKey: "test.progress.v1",
    now: () => fixedNow,
  });

  const initial = await repo.getProgress();
  assert(initial.weeklyGoalMinutes > 0, "default weekly goal should be initialized");
  assert(initial.weeklyTimeLog.length === 0, "initial weeklyTimeLog should be empty");
  assert(
    initial.weeklyGoalLockedWeekStartISO === undefined,
    "initial weekly goal should not be locked",
  );

  const afterGoalSave = await repo.setWeeklyGoalMinutes(180);
  assert(afterGoalSave.weeklyGoalMinutes === 180, "weekly goal should update on first save");
  assert(
    typeof afterGoalSave.weeklyGoalLockedWeekStartISO === "string",
    "weekly goal lock week should be stored after first save",
  );

  let rejectedSecondGoalChange = false;
  try {
    await repo.setWeeklyGoalMinutes(200);
  } catch {
    rejectedSecondGoalChange = true;
  }
  assert(rejectedSecondGoalChange, "weekly goal should not be changeable twice in the same week");

  await repo.addWeeklyTimeLog(90, fixedNow);
  const afterTime = await repo.getProgress();
  assert(afterTime.weeklyTimeLog.length === 1, "time log should contain one day entry");
  assert(afterTime.weeklyTimeLog[0]?.dateISO === getLocalDateISO(fixedNow), "dateISO mismatch");
  assert(afterTime.weeklyTimeLog[0]?.seconds === 90, "time log seconds mismatch");

  await repo.setVocabGrade("a2-s1-001", "remembered");
  await repo.markVocabSessionCompleted("A2:VOCAB:NOUN:1", fixedNow);
  const afterVocab = await repo.getProgress();
  assert(afterVocab.vocabGrades["a2-s1-001"] === "remembered", "vocab grade not saved");
  assert(
    !!afterVocab.vocabSessionCompletion["A2:VOCAB:NOUN:1"],
    "vocab completion not saved",
  );

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

  const guestStorage = createMemoryStorage();
  const guestRepoA = createLocalProgressRepo({
    storage: guestStorage,
    storageKey: "test.progress.guest.v1",
    now: () => fixedNow,
  });
  const guestRepoB = createLocalProgressRepo({
    storage: guestStorage,
    storageKey: "test.progress.guest.v1",
    now: () => fixedNow,
  });

  await guestRepoA.addWeeklyTimeLog(45, fixedNow);
  await guestRepoA.setVocabGrade("guest-a2-s1-001", "not_sure");
  const guestSharedProgress = await guestRepoB.getProgress();
  assert(
    guestSharedProgress.weeklyTimeLog[0]?.seconds === 45,
    "shared memory storage should preserve guest time log for the active tab",
  );
  assert(
    guestSharedProgress.vocabGrades["guest-a2-s1-001"] === "not_sure",
    "shared memory storage should preserve guest progress for the active tab",
  );

  const newGuestStorage = createMemoryStorage();
  const freshGuestRepo = createLocalProgressRepo({
    storage: newGuestStorage,
    storageKey: "test.progress.guest.v1",
    now: () => fixedNow,
  });
  const freshGuestProgress = await freshGuestRepo.getProgress();
  assert(
    freshGuestProgress.weeklyTimeLog.length === 0,
    "new guest memory storage should not retain prior time log data",
  );
  assert(
    Object.keys(freshGuestProgress.vocabGrades).length === 0,
    "new guest memory storage should not retain prior vocab grade data",
  );
}
