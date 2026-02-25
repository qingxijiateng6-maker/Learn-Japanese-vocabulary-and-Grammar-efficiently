"use client";

import { useProgressRepo } from "@/repo/progressRepoContext";
import { useStudyTimer } from "@/shared/hooks/useStudyTimer";

type StudyTimerMountProps = {
  idleThresholdMs?: number;
};

export function StudyTimerMount({ idleThresholdMs }: StudyTimerMountProps) {
  const progressRepo = useProgressRepo();

  useStudyTimer({
    idleThresholdMs,
    onAddSeconds: async (dateISO, secondsDelta) => {
      if (secondsDelta <= 0) {
        return;
      }
      await progressRepo.addStudySeconds(dateISO, secondsDelta);
    },
  });

  return null;
}
