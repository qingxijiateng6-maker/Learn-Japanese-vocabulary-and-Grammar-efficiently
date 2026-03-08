import a2GrammarJson from "@/content/a2/grammar.json";
import a2VocabularyJson from "@/content/a2/vocab.json";
import {
  type GrammarSessionJsonV1,
  GrammarJsonV1Schema,
  type LocalizedExample,
  type VocabularyJsonV1Item,
  VocabularyJsonV1Schema,
} from "@/content/schema";

export type LoaderWarning = string;

export type SafeLoadResult<T> = {
  sessions: T[];
  warnings: LoaderWarning[];
};

export type VocabularyItem = Omit<VocabularyJsonV1Item, "examples"> & {
  examples: LocalizedExample[];
};

export type VocabularySession = {
  level: string;
  sessionNumber: number;
  items: VocabularyItem[];
};

export type GrammarSession = GrammarSessionJsonV1;

function groupBySessionNumber<T extends { sessionNumber: number; level: string }>(
  items: T[],
): Array<{ level: string; sessionNumber: number; items: T[] }> {
  const groups = new Map<number, { level: string; sessionNumber: number; items: T[] }>();

  for (const item of items) {
    const existing = groups.get(item.sessionNumber);

    if (existing) {
      existing.items.push(item);
      continue;
    }

    groups.set(item.sessionNumber, {
      level: item.level,
      sessionNumber: item.sessionNumber,
      items: [item],
    });
  }

  return [...groups.values()].sort((a, b) => a.sessionNumber - b.sessionNumber);
}

function normalizeVocabularyItem(item: VocabularyJsonV1Item): VocabularyItem {
  const fallbackExample = {
    jp: item.exampleJP,
    en: item.exampleEN,
  };

  return {
    ...item,
    examples: item.examples && item.examples.length > 0 ? item.examples : [fallbackExample],
  };
}

function parseVocabularyJson(json: unknown): SafeLoadResult<VocabularySession> {
  const parsed = VocabularyJsonV1Schema.safeParse(json);
  if (!parsed.success) {
    return {
      sessions: [],
      warnings: [
        `Invalid vocabulary JSON (src/content/a2/vocab.json): ${parsed.error.issues
          .slice(0, 3)
          .map((issue) => issue.path.join(".") || "root")
          .join(", ")}`,
      ],
    };
  }

  const normalizedItems = parsed.data.map(normalizeVocabularyItem);
  const grouped = groupBySessionNumber(normalizedItems).map((session) => ({
    ...session,
    items: session.items.sort((a, b) => a.id.localeCompare(b.id)),
  }));

  return {
    sessions: grouped,
    warnings: [],
  };
}

function parseGrammarJson(json: unknown): SafeLoadResult<GrammarSession> {
  const parsed = GrammarJsonV1Schema.safeParse(json);
  if (!parsed.success) {
    return {
      sessions: [],
      warnings: [
        `Invalid grammar JSON (src/content/a2/grammar.json): ${parsed.error.issues
          .slice(0, 3)
          .map((issue) => issue.path.join(".") || "root")
          .join(", ")}`,
      ],
    };
  }

  const sessions = [...parsed.data]
    .sort((a, b) => a.sessionNumber - b.sessionNumber)
    .map((session) => ({
      ...session,
      topics: [...session.topics].sort((a, b) => a.id.localeCompare(b.id)),
      questions: [...session.questions].sort((a, b) => a.id.localeCompare(b.id)),
    }));

  return {
    sessions,
    warnings: [],
  };
}

export async function loadA2VocabularySessions(): Promise<SafeLoadResult<VocabularySession>> {
  return parseVocabularyJson(a2VocabularyJson);
}

export async function loadA2GrammarSessions(): Promise<SafeLoadResult<GrammarSession>> {
  return parseGrammarJson(a2GrammarJson);
}
