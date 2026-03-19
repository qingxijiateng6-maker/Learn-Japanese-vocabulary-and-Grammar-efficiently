export const GRAMMAR_LEVELS = ["A2", "B1", "B2", "C1"] as const;

export type GrammarLevel = (typeof GRAMMAR_LEVELS)[number];

export function normalizeGrammarLevelParam(value: string): GrammarLevel | null {
  const normalized = value.toUpperCase();
  return GRAMMAR_LEVELS.find((level) => level === normalized) ?? null;
}

export function buildGrammarSessionKey(level: string, sessionNumber: number): string {
  return `${level.toUpperCase()}:GRAMMAR:${sessionNumber}`;
}

export function getGrammarLevelHref(level: string): string {
  return `/grammar/${level.toLowerCase()}`;
}

export function getGrammarSessionHref(level: string, sessionNumber: number): string {
  return `${getGrammarLevelHref(level)}/session/${sessionNumber}`;
}

export function getGrammarPracticeHref(level: string, sessionNumber: number): string {
  return `${getGrammarSessionHref(level, sessionNumber)}/practice`;
}
