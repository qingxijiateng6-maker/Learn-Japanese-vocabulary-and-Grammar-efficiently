import {
  loadA2VocabularyLevelGroup,
  type VocabularyLevelGroup,
  type VocabularySession,
} from "@/content/loaders";
import type { VocabularyPartOfSpeech } from "@/content/schema";
import { normalizeVocabularyLevelParam, type VocabularyLevel } from "@/domain/vocabulary/meta";

export type VocabularyRouteData = {
  level: VocabularyLevel;
  levelGroup: VocabularyLevelGroup | null;
  sessions: VocabularySession[];
  warnings: string[];
};

export async function loadVocabularyRouteData(
  levelParam: string,
): Promise<VocabularyRouteData | null> {
  const level = normalizeVocabularyLevelParam(levelParam);

  if (!level) {
    return null;
  }

  if (level !== "A2") {
    return {
      level,
      levelGroup: null,
      sessions: [],
      warnings: [],
    };
  }

  const result = await loadA2VocabularyLevelGroup();

  return {
    level,
    levelGroup: result.level,
    sessions: result.sessions,
    warnings: result.warnings,
  };
}

export function findVocabularySession(
  sessions: VocabularySession[],
  partOfSpeech: VocabularyPartOfSpeech,
  sessionNumber: number,
): VocabularySession | null {
  return (
    sessions.find(
      (session) =>
        session.partOfSpeech === partOfSpeech && session.sessionNumber === sessionNumber,
    ) ?? null
  );
}
