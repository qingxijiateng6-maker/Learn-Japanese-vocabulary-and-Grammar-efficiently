import { z } from "zod";

export const ContentLevelSchema = z.string().min(1);

export const LocalizedExampleSchema = z.object({
  jp: z.string().min(1),
  en: z.string().min(1),
});

export const VocabularyJsonV1ItemSchema = z.object({
  id: z.string().min(1),
  level: ContentLevelSchema,
  sessionNumber: z.number().int().positive(),
  wordJP: z.string().min(1),
  readingKana: z.string().min(1),
  meaningEN: z.string().min(1),
  exampleJP: z.string().min(1),
  exampleEN: z.string().min(1),
  // Optional future extension for multiple examples while keeping v1 minimum fields.
  examples: z.array(LocalizedExampleSchema).min(1).optional(),
});

export const VocabularyJsonV1Schema = z.array(VocabularyJsonV1ItemSchema);

export const GrammarQuestionJsonV1Schema = z.object({
  id: z.string().min(1),
  promptJP: z.string().min(1),
  promptEN: z.string().min(1).optional(),
  choices: z.tuple([
    z.string().min(1),
    z.string().min(1),
    z.string().min(1),
    z.string().min(1),
  ]),
  correctIndex: z.number().int().min(0).max(3),
  feedback: z.string().min(1).optional(),
});

export const GrammarTopicJsonV1Schema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  explanationMarkdown: z.string().min(1),
  examples: z.array(LocalizedExampleSchema).min(1),
});

export const GrammarSessionJsonV1Schema = z.object({
  level: ContentLevelSchema,
  sessionNumber: z.number().int().positive(),
  sessionTitle: z.string().min(1),
  topics: z.array(GrammarTopicJsonV1Schema).min(1),
  questions: z.array(GrammarQuestionJsonV1Schema).min(1),
});

export const GrammarJsonV1Schema = z.array(GrammarSessionJsonV1Schema);

export type LocalizedExample = z.infer<typeof LocalizedExampleSchema>;
export type VocabularyJsonV1Item = z.infer<typeof VocabularyJsonV1ItemSchema>;
export type GrammarQuestionJsonV1 = z.infer<typeof GrammarQuestionJsonV1Schema>;
export type GrammarTopicJsonV1 = z.infer<typeof GrammarTopicJsonV1Schema>;
export type GrammarSessionJsonV1 = z.infer<typeof GrammarSessionJsonV1Schema>;
