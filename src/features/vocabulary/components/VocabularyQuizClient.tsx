"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { VocabularyItem } from "@/content/loaders";
import {
  buildVocabularySessionKey,
  type VocabularyPartOfSpeech,
} from "@/domain/vocabulary/meta";
import { getLocalDateISO } from "@/repo/progressRepo";
import { useProgressRepo } from "@/repo/progressRepoContext";
import { playStudyFeedbackAudio } from "@/shared/lib/studyFeedbackAudio";

type VocabularyQuizClientProps = {
  level: string;
  partOfSpeech: VocabularyPartOfSpeech;
  sessionNumber: number;
  sessionItems: VocabularyItem[];
  levelItems: VocabularyItem[];
};

type VocabularyQuizMode = "jpToEnglish" | "clozeJP";

type QuizQuestion = {
  item: VocabularyItem;
  mode: VocabularyQuizMode;
  promptLabel: string;
  promptText: string;
  choices: string[];
  correctIndex: number;
  answerText: string;
};

const ACTIVE_QUIZ_MODE: VocabularyQuizMode = "jpToEnglish";

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function shuffleChoices(
  choices: string[],
  correctIndex: number,
): Pick<QuizQuestion, "choices" | "correctIndex"> {
  const shuffled = shuffle(
    choices.map((choice, index) => ({
      choice,
      isCorrect: index === correctIndex,
    })),
  );

  return {
    choices: shuffled.map((entry) => entry.choice),
    correctIndex: shuffled.findIndex((entry) => entry.isCorrect),
  };
}

function formatJapanesePrompt(item: VocabularyItem): string {
  const reading = item.readingKana.trim();
  const word = item.wordJP.trim();

  if (!reading) {
    return word;
  }

  if (!word || reading === word) {
    return reading;
  }

  return `${reading} | ${word}`;
}

function buildBlankedExample(exampleJP: string, wordJP: string): string {
  if (!wordJP) {
    return exampleJP;
  }

  if (exampleJP.includes(wordJP)) {
    return exampleJP.replace(wordJP, "____");
  }

  return `${exampleJP} (Target: ____ )`;
}

function buildClozePrompt(item: VocabularyItem): string {
  const sourcePrompt = item.quiz?.clozeJP?.promptJP;

  if (sourcePrompt && sourcePrompt.includes("___")) {
    return sourcePrompt;
  }

  if (sourcePrompt) {
    return buildBlankedExample(sourcePrompt, item.quiz?.clozeJP?.answerJP ?? item.wordJP);
  }

  return buildBlankedExample(item.exampleJP, item.wordJP);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderExampleENWithBold(exampleEN: string, meaningEN: string) {
  const candidates = [
    meaningEN,
    meaningEN.split("/")[0]?.trim(),
    meaningEN.split(",")[0]?.trim(),
  ].filter((value): value is string => Boolean(value && value.length > 0));

  for (const candidate of candidates) {
    const regex = new RegExp(escapeRegExp(candidate), "i");
    const match = regex.exec(exampleEN);
    if (!match) {
      continue;
    }

    const start = match.index;
    const end = start + match[0].length;

    return (
      <>
        {exampleEN.slice(0, start)}
        <strong>{exampleEN.slice(start, end)}</strong>
        {exampleEN.slice(end)}
      </>
    );
  }

  return (
    <>
      {exampleEN} (<strong>{meaningEN}</strong>)
    </>
  );
}

function buildFallbackJapaneseChoices(
  item: VocabularyItem,
  levelItems: VocabularyItem[],
): Pick<QuizQuestion, "choices" | "correctIndex"> {
  const distractorPool = levelItems
    .filter((candidate) => candidate.id !== item.id && candidate.wordJP !== item.wordJP)
    .map((candidate) => candidate.wordJP);
  const uniqueDistractors = Array.from(new Set(distractorPool));
  const selectedDistractors = shuffle(uniqueDistractors).slice(0, 3);
  const fallbackPool = ["時間", "場所", "勉強", "友だち", "予定", "旅行"];

  for (const fallback of fallbackPool) {
    if (fallback !== item.wordJP && !selectedDistractors.includes(fallback)) {
      selectedDistractors.push(fallback);
    }
    if (selectedDistractors.length === 3) {
      break;
    }
  }

  return shuffleChoices([item.wordJP, ...selectedDistractors.slice(0, 3)], 0);
}

function buildFallbackEnglishChoices(
  item: VocabularyItem,
  levelItems: VocabularyItem[],
): Pick<QuizQuestion, "choices" | "correctIndex"> {
  const distractorPool = levelItems
    .filter((candidate) => candidate.id !== item.id && candidate.meaningEN !== item.meaningEN)
    .map((candidate) => candidate.meaningEN);
  const uniqueDistractors = Array.from(new Set(distractorPool));
  const selectedDistractors = shuffle(uniqueDistractors).slice(0, 3);
  const fallbackPool = ["time", "place", "study", "friend", "plan", "trip"];

  for (const fallback of fallbackPool) {
    if (fallback !== item.meaningEN && !selectedDistractors.includes(fallback)) {
      selectedDistractors.push(fallback);
    }
    if (selectedDistractors.length === 3) {
      break;
    }
  }

  return shuffleChoices([item.meaningEN, ...selectedDistractors.slice(0, 3)], 0);
}

function buildJpToEnglishQuestion(
  item: VocabularyItem,
  levelItems: VocabularyItem[],
): QuizQuestion {
  const jpToEnglish = item.quiz?.jpToEnglish;
  const shuffled =
    jpToEnglish !== undefined
      ? shuffleChoices([...jpToEnglish.choicesEN], jpToEnglish.correctOptionIndex)
      : buildFallbackEnglishChoices(item, levelItems);

  return {
    item,
    mode: "jpToEnglish",
    promptLabel: "Word (JP)",
    promptText: formatJapanesePrompt(item),
    choices: shuffled.choices,
    correctIndex: shuffled.correctIndex,
    answerText: jpToEnglish?.answerEN ?? item.meaningEN,
  };
}

function buildClozeQuestion(item: VocabularyItem, levelItems: VocabularyItem[]): QuizQuestion {
  const clozeJP = item.quiz?.clozeJP;
  const shuffled =
    clozeJP !== undefined
      ? {
          choices: [...clozeJP.choicesJP],
          correctIndex: clozeJP.correctOptionIndex,
        }
      : buildFallbackJapaneseChoices(item, levelItems);

  return {
    item,
    mode: "clozeJP",
    promptLabel: "Prompt (JP)",
    promptText: buildClozePrompt(item),
    choices: shuffled.choices,
    correctIndex: shuffled.correctIndex,
    answerText: clozeJP?.answerJP ?? item.wordJP,
  };
}

const quizQuestionBuilders: Record<
  VocabularyQuizMode,
  (item: VocabularyItem, levelItems: VocabularyItem[]) => QuizQuestion
> = {
  jpToEnglish: buildJpToEnglishQuestion,
  clozeJP: buildClozeQuestion,
};

function buildQuestions(
  sessionItems: VocabularyItem[],
  levelItems: VocabularyItem[],
  quizMode: VocabularyQuizMode,
): QuizQuestion[] {
  const uniqueLevelItems = Array.from(new Map(levelItems.map((item) => [item.id, item])).values());

  return sessionItems.map((item) => quizQuestionBuilders[quizMode](item, uniqueLevelItems));
}

export function VocabularyQuizClient({
  level,
  partOfSpeech,
  sessionNumber,
  sessionItems,
  levelItems,
}: VocabularyQuizClientProps) {
  const progressRepo = useProgressRepo();
  const [isSavingAttempt, startSavingAttempt] = useTransition();
  const [attemptVersion, setAttemptVersion] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndexByQuestion, setSelectedIndexByQuestion] = useState<Record<number, number>>({});
  const [revealedByQuestion, setRevealedByQuestion] = useState<Record<number, boolean>>({});
  const [attemptSaved, setAttemptSaved] = useState(false);

  const sessionKey = buildVocabularySessionKey(level, partOfSpeech, sessionNumber);
  const questions = useMemo(
    () => buildQuestions(sessionItems, levelItems, ACTIVE_QUIZ_MODE),
    [attemptVersion, levelItems, sessionItems],
  );

  const currentQuestion = questions[questionIndex] ?? null;
  const selectedIndex = selectedIndexByQuestion[questionIndex];
  const isRevealed = revealedByQuestion[questionIndex] === true;

  const correctCount = questions.reduce((count, question, index) => {
    const answer = selectedIndexByQuestion[index];
    return answer === question.correctIndex ? count + 1 : count;
  }, 0);
  const totalCount = questions.length;
  const answeredCount = Object.keys(revealedByQuestion).filter(
    (key) => revealedByQuestion[Number(key)],
  ).length;
  const isQuizFinished = totalCount > 0 && answeredCount === totalCount;
  const accuracyPercent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  useEffect(() => {
    if (!isQuizFinished || attemptSaved || totalCount <= 0) {
      return;
    }

    setAttemptSaved(true);
    startSavingAttempt(() => {
      void progressRepo.addVocabQuizAttempt({
        sessionKey,
        dateISO: getLocalDateISO(new Date()),
        correctCount,
        totalCount,
        accuracyPercent,
      });
    });
  }, [
    accuracyPercent,
    attemptSaved,
    correctCount,
    isQuizFinished,
    progressRepo,
    sessionKey,
    totalCount,
  ]);

  const handleSelectChoice = (choiceIndex: number) => {
    if (isRevealed) {
      return;
    }
    setSelectedIndexByQuestion((previous) => ({ ...previous, [questionIndex]: choiceIndex }));
  };

  const handleCheckAnswer = () => {
    if (selectedIndex === undefined) {
      return;
    }

    void playStudyFeedbackAudio(
      selectedIndex === currentQuestion?.correctIndex ? "correct" : "wrong",
    );
    setRevealedByQuestion((previous) => ({ ...previous, [questionIndex]: true }));
  };

  const handleNext = () => {
    setQuestionIndex((previous) => Math.min(previous + 1, questions.length - 1));
  };

  const handlePrevious = () => {
    setQuestionIndex((previous) => Math.max(previous - 1, 0));
  };

  const handleRetry = () => {
    setQuestionIndex(0);
    setSelectedIndexByQuestion({});
    setRevealedByQuestion({});
    setAttemptSaved(false);
    setAttemptVersion((previous) => previous + 1);
  };

  if (questions.length === 0) {
    return (
      <section className="page-card">
        <h2 className="page-title">Vocabulary Quiz</h2>
        <p className="muted-note">Content preparing. No quiz items available for this session.</p>
      </section>
    );
  }

  return (
    <section className="page-card">
      <div className="stack-row">
        <h2 className="page-title">Vocabulary Quiz</h2>
        <p className="muted-note">
          {answeredCount}/{totalCount} answered
        </p>
      </div>
      <p className="page-subtitle">
        Choose the best English meaning for each Japanese word. Quiz attempts are saved, but quiz
        completion does not affect flashcards session completion.
      </p>

      {isQuizFinished ? (
        <div className="flashcard-panel">
          <div className="flashcard-face">
            <p className="flashcard-label">Quiz complete</p>
            <p className="flashcard-meaning">
              Score: {correctCount}/{totalCount} ({accuracyPercent}%)
            </p>
            <p className="muted-note">
              Attempt saved to local progress history. {isSavingAttempt ? "Saving..." : ""}
            </p>
          </div>
          <div className="button-row">
            <button type="button" className="button-link button-link--primary" onClick={handleRetry}>
              Try again
            </button>
          </div>
        </div>
      ) : currentQuestion ? (
        <div className="flashcard-panel">
          <div className="stack-row">
            <strong>
              Question {questionIndex + 1} / {totalCount}
            </strong>
          </div>

          <div className="flashcard-face">
            <p className="flashcard-label">{currentQuestion.promptLabel}</p>
            <p className="flashcard-example vocabulary-quiz__prompt">
              {currentQuestion.promptText}
            </p>
          </div>

          <div className="quiz-choices">
            {currentQuestion.choices.map((choice, choiceIndex) => {
              const isSelected = selectedIndex === choiceIndex;
              const isCorrect = currentQuestion.correctIndex === choiceIndex;
              const showCorrect = isRevealed && isCorrect;
              const showWrong = isRevealed && isSelected && !isCorrect;

              return (
                <button
                  key={`${currentQuestion.item.id}:${choice}`}
                  type="button"
                  className={[
                    "quiz-choice",
                    isSelected ? "quiz-choice--selected" : "",
                    showCorrect ? "quiz-choice--correct" : "",
                    showWrong ? "quiz-choice--wrong" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => handleSelectChoice(choiceIndex)}
                  disabled={isRevealed}
                >
                  {choice}
                </button>
              );
            })}
          </div>

          <div className="button-row">
            <button type="button" className="button-link" onClick={handlePrevious}>
              Previous
            </button>
            {!isRevealed ? (
              <button
                type="button"
                className="button-link button-link--primary"
                onClick={handleCheckAnswer}
                disabled={selectedIndex === undefined}
              >
                Check answer
              </button>
            ) : (
              <button
                type="button"
                className="button-link button-link--primary"
                onClick={handleNext}
                disabled={questionIndex >= totalCount - 1}
              >
                Next question
              </button>
            )}
          </div>

          {isRevealed ? (
            <div className="quiz-explanation">
              <p className="flashcard-label">Explanation</p>
              <p className="flashcard-example">
                {selectedIndex === currentQuestion.correctIndex ? "Correct. " : "Incorrect. "}
                The correct answer is <strong>{currentQuestion.answerText}</strong>.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
