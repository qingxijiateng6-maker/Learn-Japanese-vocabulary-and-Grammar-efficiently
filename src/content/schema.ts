import { z } from "zod";
import { VOCABULARY_PARTS_OF_SPEECH } from "@/domain/vocabulary/meta";

export const ContentLevelSchema = z.string().min(1);
export const VocabularyPartOfSpeechSchema = z.enum(VOCABULARY_PARTS_OF_SPEECH);

export const LocalizedExampleSchema = z.object({
  jp: z.string().min(1),
  en: z.string().min(1),
});

const FourChoiceStringTupleSchema = z.tuple([
  z.string().min(1),
  z.string().min(1),
  z.string().min(1),
  z.string().min(1),
]);

export const VocabularyLegacyQuizJsonV1Schema = z.object({
  clozeJP: z.string().min(1),
  choicesJP: FourChoiceStringTupleSchema,
  answerJP: z.string().min(1),
  correctOptionIndex: z.number().int().min(0).max(3),
});

export const VocabularyClozeQuizModeJsonV2Schema = z.object({
  promptJP: z.string().min(1),
  choicesJP: FourChoiceStringTupleSchema,
  answerJP: z.string().min(1),
  correctOptionIndex: z.number().int().min(0).max(3),
});

export const VocabularyJpToEnglishQuizModeJsonV2Schema = z.object({
  choicesEN: FourChoiceStringTupleSchema,
  answerEN: z.string().min(1),
  correctOptionIndex: z.number().int().min(0).max(3),
});

export const VocabularyQuizJsonV2Schema = z
  .object({
    clozeJP: VocabularyClozeQuizModeJsonV2Schema.optional(),
    jpToEnglish: VocabularyJpToEnglishQuizModeJsonV2Schema.optional(),
  })
  .refine((value) => value.clozeJP !== undefined || value.jpToEnglish !== undefined, {
    message: "At least one vocabulary quiz mode is required.",
  });

export const VocabularyQuizJsonV1Schema = z.union([
  VocabularyLegacyQuizJsonV1Schema,
  VocabularyQuizJsonV2Schema,
]);

export const VocabularyJsonV1ItemSchema = z.object({
  id: z.string().min(1),
  level: ContentLevelSchema,
  partOfSpeech: VocabularyPartOfSpeechSchema,
  sessionNumber: z.number().int().positive(),
  wordJP: z.string().min(1),
  readingKana: z.string().min(1),
  meaningEN: z.string().min(1),
  exampleJP: z.string().min(1),
  exampleEN: z.string().min(1),
  // Optional future extension for multiple examples while keeping v1 minimum fields.
  examples: z.array(LocalizedExampleSchema).min(1).optional(),
  quiz: VocabularyQuizJsonV1Schema.optional(),
});

export const VocabularyJsonV1Schema = z.array(VocabularyJsonV1ItemSchema);

export const GrammarQuestionJsonV1Schema = z.object({
  id: z.string().min(1),
  promptJP: z.string().min(1),
  promptEN: z.string().min(1).optional(),
  choices: FourChoiceStringTupleSchema,
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
export type VocabularyPartOfSpeech = z.infer<typeof VocabularyPartOfSpeechSchema>;
export type VocabularyLegacyQuizJsonV1 = z.infer<typeof VocabularyLegacyQuizJsonV1Schema>;
export type VocabularyClozeQuizModeJsonV2 = z.infer<typeof VocabularyClozeQuizModeJsonV2Schema>;
export type VocabularyJpToEnglishQuizModeJsonV2 = z.infer<
  typeof VocabularyJpToEnglishQuizModeJsonV2Schema
>;
export type VocabularyQuizJsonV2 = z.infer<typeof VocabularyQuizJsonV2Schema>;
export type VocabularyQuizJsonV1 = z.infer<typeof VocabularyQuizJsonV1Schema>;
export type VocabularyJsonV1Item = z.infer<typeof VocabularyJsonV1ItemSchema>;
export type GrammarQuestionJsonV1 = z.infer<typeof GrammarQuestionJsonV1Schema>;
export type GrammarTopicJsonV1 = z.infer<typeof GrammarTopicJsonV1Schema>;
export type GrammarSessionJsonV1 = z.infer<typeof GrammarSessionJsonV1Schema>;
