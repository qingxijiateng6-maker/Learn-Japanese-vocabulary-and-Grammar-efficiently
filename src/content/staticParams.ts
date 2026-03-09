import {
  loadA2GrammarSessions,
  loadA2VocabularyLevelGroup,
  loadA2VocabularySessions,
} from "@/content/loaders";
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
