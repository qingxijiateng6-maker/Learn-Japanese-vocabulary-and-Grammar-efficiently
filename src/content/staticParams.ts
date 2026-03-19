import {
  loadA2GrammarSessions,
  loadA2VocabularyLevelGroup,
  loadA2VocabularySessions,
  loadGrammarSessionsForLevel,
} from "@/content/loaders";
import { CEFR_LEVELS } from "@/shared/config/cefrLevels";
import {
  getVocabularyPartOfSpeechSlug,
  VOCABULARY_LEVELS,
} from "@/domain/vocabulary/meta";

export function getVocabularyLevelStaticParams() {
  return VOCABULARY_LEVELS.map((level) => ({
    level: level.toLowerCase(),
  }));
}

export async function getVocabularyPartOfSpeechStaticParams() {
  const { level } = await loadA2VocabularyLevelGroup();

  return (
    level?.partsOfSpeech.map((group) => ({
      level: level.level.toLowerCase(),
      partOfSpeech: getVocabularyPartOfSpeechSlug(group.partOfSpeech),
    })) ?? []
  );
}

export async function getVocabularySessionStaticParams() {
  const { sessions } = await loadA2VocabularySessions();

  return sessions.map((session) => ({
    level: session.level.toLowerCase(),
    partOfSpeech: getVocabularyPartOfSpeechSlug(session.partOfSpeech),
    sessionNumber: session.sessionNumber.toString(),
  }));
}

export async function getGrammarSessionStaticParams() {
  const { sessions } = await loadA2GrammarSessions();

  return sessions.map((session) => ({
    sessionNumber: session.sessionNumber.toString(),
  }));
}

export function getGrammarLevelStaticParams() {
  return CEFR_LEVELS.filter((level) => level.available && (level.code === "A2" || level.code === "B1")).map(
    (level) => ({
      level: level.code.toLowerCase(),
    }),
  );
}

export async function getGrammarSessionStaticParamsForLevel(level: string) {
  const { sessions } = await loadGrammarSessionsForLevel(level);

  return sessions.map((session) => ({
    sessionNumber: session.sessionNumber.toString(),
  }));
}
