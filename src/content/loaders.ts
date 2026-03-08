import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  type GrammarJsonV1Item,
  GrammarJsonV1Schema,
  type LocalizedExample,
  type VocabularyPartOfSpeech,
  type VocabularyJsonV1Item,
  VocabularyJsonV1Schema,
} from "@/content/schema";
import {
  VOCABULARY_PARTS_OF_SPEECH,
  buildVocabularySessionKey,
} from "@/domain/vocabulary/meta";

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
  partOfSpeech: VocabularyPartOfSpeech;
  sessionNumber: number;
  sessionKey: string;
  items: VocabularyItem[];
};

export type VocabularyPartOfSpeechGroup = {
  level: string;
  partOfSpeech: VocabularyPartOfSpeech;
  sessions: VocabularySession[];
  totalItemCount: number;
};

export type VocabularyLevelGroup = {
  level: string;
  partsOfSpeech: VocabularyPartOfSpeechGroup[];
  totalSessionCount: number;
  totalItemCount: number;
};

export type GrammarSession = {
  level: string;
  sessionNumber: number;
  items: GrammarJsonV1Item[];
};

async function readLocalJson(relativePathFromRoot: string): Promise<{
  json: unknown | null;
  warnings: LoaderWarning[];
}> {
  const fullPath = path.join(process.cwd(), relativePathFromRoot);

  try {
    const raw = await readFile(fullPath, "utf8");
    return { json: JSON.parse(raw), warnings: [] };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown file read error";
    return {
      json: null,
      warnings: [`Failed to load ${relativePathFromRoot}: ${message}`],
    };
  }
}

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

function groupVocabularyByPartOfSpeechAndSession(
  items: VocabularyItem[],
): VocabularySession[] {
  const groups = new Map<string, VocabularySession>();

  for (const item of items) {
    const groupKey = `${item.partOfSpeech}:${item.sessionNumber}`;
    const existing = groups.get(groupKey);

    if (existing) {
      existing.items.push(item);
      continue;
    }

    groups.set(groupKey, {
      level: item.level,
      partOfSpeech: item.partOfSpeech,
      sessionNumber: item.sessionNumber,
      sessionKey: buildVocabularySessionKey(item.level, item.partOfSpeech, item.sessionNumber),
      items: [item],
    });
  }

  return [...groups.values()].sort((a, b) => {
    const partOfSpeechOrder =
      VOCABULARY_PARTS_OF_SPEECH.indexOf(a.partOfSpeech) -
      VOCABULARY_PARTS_OF_SPEECH.indexOf(b.partOfSpeech);

    if (partOfSpeechOrder !== 0) {
      return partOfSpeechOrder;
    }

    return a.sessionNumber - b.sessionNumber;
  });
}

function buildVocabularyLevelGroup(
  level: string,
  sessions: VocabularySession[],
): VocabularyLevelGroup {
  const partsOfSpeech = VOCABULARY_PARTS_OF_SPEECH.map((partOfSpeech) => {
    const sessionsForPartOfSpeech = sessions
      .filter((session) => session.partOfSpeech === partOfSpeech)
      .map((session) => ({
        ...session,
        items: [...session.items].sort((a, b) => a.id.localeCompare(b.id)),
      }))
      .sort((a, b) => a.sessionNumber - b.sessionNumber);

    return {
      level,
      partOfSpeech,
      sessions: sessionsForPartOfSpeech,
      totalItemCount: sessionsForPartOfSpeech.reduce(
        (count, session) => count + session.items.length,
        0,
      ),
    };
  }).filter((entry) => entry.sessions.length > 0);

  return {
    level,
    partsOfSpeech,
    totalSessionCount: partsOfSpeech.reduce((count, entry) => count + entry.sessions.length, 0),
    totalItemCount: partsOfSpeech.reduce((count, entry) => count + entry.totalItemCount, 0),
  };
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

export async function loadA2VocabularySessions(): Promise<
  SafeLoadResult<VocabularySession>
> {
  const filePath = "src/content/a2/vocab.json";
  const fileResult = await readLocalJson(filePath);

  if (!fileResult.json) {
    return { sessions: [], warnings: fileResult.warnings };
  }

  const parsed = VocabularyJsonV1Schema.safeParse(fileResult.json);
  if (!parsed.success) {
    return {
      sessions: [],
      warnings: [
        ...fileResult.warnings,
        `Invalid vocabulary JSON (${filePath}): ${parsed.error.issues
          .slice(0, 3)
          .map((issue) => issue.path.join(".") || "root")
          .join(", ")}`,
      ],
    };
  }

  const normalizedItems = parsed.data.map(normalizeVocabularyItem);
  const grouped = groupVocabularyByPartOfSpeechAndSession(normalizedItems).map((session) => ({
    ...session,
    items: session.items.sort((a, b) => a.id.localeCompare(b.id)),
  }));

  return {
    sessions: grouped,
    warnings: fileResult.warnings,
  };
}

export async function loadA2VocabularyLevelGroup(): Promise<{
  level: VocabularyLevelGroup | null;
  sessions: VocabularySession[];
  warnings: LoaderWarning[];
}> {
  const result = await loadA2VocabularySessions();

  return {
    level:
      result.sessions.length > 0 ? buildVocabularyLevelGroup(result.sessions[0].level, result.sessions) : null,
    sessions: result.sessions,
    warnings: result.warnings,
  };
}

export async function loadA2GrammarSessions(): Promise<SafeLoadResult<GrammarSession>> {
  const filePath = "src/content/a2/grammar.json";
  const fileResult = await readLocalJson(filePath);

  if (!fileResult.json) {
    return { sessions: [], warnings: fileResult.warnings };
  }

  const parsed = GrammarJsonV1Schema.safeParse(fileResult.json);
  if (!parsed.success) {
    return {
      sessions: [],
      warnings: [
        ...fileResult.warnings,
        `Invalid grammar JSON (${filePath}): ${parsed.error.issues
          .slice(0, 3)
          .map((issue) => issue.path.join(".") || "root")
          .join(", ")}`,
      ],
    };
  }

  const grouped = groupBySessionNumber(parsed.data).map((session) => ({
    ...session,
    items: session.items.sort((a, b) => a.id.localeCompare(b.id)),
  }));

  return {
    sessions: grouped,
    warnings: fileResult.warnings,
  };
}
