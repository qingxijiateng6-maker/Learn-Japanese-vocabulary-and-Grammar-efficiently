import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  type GrammarJsonV1Item,
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
  const grouped = groupBySessionNumber(normalizedItems).map((session) => ({
    ...session,
    items: session.items.sort((a, b) => a.id.localeCompare(b.id)),
  }));

  return {
    sessions: grouped,
    warnings: fileResult.warnings,
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
