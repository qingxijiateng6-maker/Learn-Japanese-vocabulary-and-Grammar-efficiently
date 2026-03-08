export const VOCABULARY_LEVELS = ["A2", "B1", "B2", "C1"] as const;

export type VocabularyLevel = (typeof VOCABULARY_LEVELS)[number];

export const VOCABULARY_PARTS_OF_SPEECH = [
  "NOUN",
  "VERB",
  "ADJECTIVE",
  "ADVERB",
  "OTHER",
] as const;

export type VocabularyPartOfSpeech = (typeof VOCABULARY_PARTS_OF_SPEECH)[number];

type VocabularyPartOfSpeechMeta = {
  label: string;
  slug: string;
  shortDescription: string;
};

export const vocabularyPartOfSpeechMeta: Record<
  VocabularyPartOfSpeech,
  VocabularyPartOfSpeechMeta
> = {
  NOUN: {
    label: "Noun",
    slug: "noun",
    shortDescription: "People, places, things, and concepts",
  },
  VERB: {
    label: "Verb",
    slug: "verb",
    shortDescription: "Actions, states, and events",
  },
  ADJECTIVE: {
    label: "Adjective",
    slug: "adjective",
    shortDescription: "Words that describe nouns",
  },
  ADVERB: {
    label: "Adverb",
    slug: "adverb",
    shortDescription: "Words that modify verbs and adjectives",
  },
  OTHER: {
    label: "Others",
    slug: "others",
    shortDescription: "Particles, expressions, and other forms",
  },
};

export function normalizeVocabularyLevelParam(value: string): VocabularyLevel | null {
  const normalized = value.toUpperCase();
  return VOCABULARY_LEVELS.find((level) => level === normalized) ?? null;
}

export function normalizeVocabularyPartOfSpeechParam(
  value: string,
): VocabularyPartOfSpeech | null {
  const normalized = value.toLowerCase();

  for (const partOfSpeech of VOCABULARY_PARTS_OF_SPEECH) {
    if (vocabularyPartOfSpeechMeta[partOfSpeech].slug === normalized) {
      return partOfSpeech;
    }
  }

  return null;
}

export function getVocabularyPartOfSpeechLabel(
  partOfSpeech: VocabularyPartOfSpeech,
): string {
  return vocabularyPartOfSpeechMeta[partOfSpeech].label;
}

export function getVocabularyPartOfSpeechSlug(
  partOfSpeech: VocabularyPartOfSpeech,
): string {
  return vocabularyPartOfSpeechMeta[partOfSpeech].slug;
}

export function getVocabularyLevelHref(level: VocabularyLevel): string {
  return `/vocabulary/${level.toLowerCase()}`;
}

export function getVocabularyPartOfSpeechHref(
  level: VocabularyLevel,
  partOfSpeech: VocabularyPartOfSpeech,
): string {
  return `${getVocabularyLevelHref(level)}/${getVocabularyPartOfSpeechSlug(partOfSpeech)}`;
}

export function getVocabularySessionHref(
  level: VocabularyLevel,
  partOfSpeech: VocabularyPartOfSpeech,
  sessionNumber: number,
): string {
  return `${getVocabularyPartOfSpeechHref(level, partOfSpeech)}/session/${sessionNumber}`;
}

export function getVocabularyFlashcardsHref(
  level: VocabularyLevel,
  partOfSpeech: VocabularyPartOfSpeech,
  sessionNumber: number,
): string {
  return `${getVocabularySessionHref(level, partOfSpeech, sessionNumber)}/flashcards`;
}

export function getVocabularyQuizHref(
  level: VocabularyLevel,
  partOfSpeech: VocabularyPartOfSpeech,
  sessionNumber: number,
): string {
  return `${getVocabularySessionHref(level, partOfSpeech, sessionNumber)}/quiz`;
}

export function buildVocabularySessionKey(
  level: string,
  partOfSpeech: VocabularyPartOfSpeech,
  sessionNumber: number,
): string {
  return `${level.toUpperCase()}:VOCAB:${partOfSpeech}:${sessionNumber}`;
}
