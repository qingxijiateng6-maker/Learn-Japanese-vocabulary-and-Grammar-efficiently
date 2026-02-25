"use client";

import { Fragment, useEffect, useMemo, useState, useTransition } from "react";
import type { VocabularyItem } from "@/content/loaders";
import { getLocalDateISO } from "@/repo/progressRepo";
import { useProgressRepo } from "@/repo/progressRepoContext";

type VocabularyQuizClientProps = {
  level: string;
  sessionNumber: number;
  sessionItems: VocabularyItem[];
  levelItems: VocabularyItem[];
};

type QuizQuestion = {
  item: VocabularyItem;
  choices: string[];
  correctIndex: number;
};

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
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

function buildQuestions(sessionItems: VocabularyItem[], levelItems: VocabularyItem[]): QuizQuestion[] {
  const uniqueLevelItems = Array.from(new Map(levelItems.map((item) => [item.id, item])).values());

  return sessionItems.map((item) => {
    const distractorPool = uniqueLevelItems
      .filter((candidate) => candidate.id !== item.id && candidate.wordJP !== item.wordJP)
      .map((candidate) => candidate.wordJP);
    const uniqueDistractors = Array.from(new Set(distractorPool));

    const selectedDistractors = shuffle(uniqueDistractors).slice(0, 3);

    if (selectedDistractors.length < 3) {
      const fallbackPool = ["時間", "場所", "勉強", "友だち", "予定", "旅行"];
      for (const fallback of fallbackPool) {
        if (
          fallback !== item.wordJP &&
          !selectedDistractors.includes(fallback)
        ) {
          selectedDistractors.push(fallback);
        }
        if (selectedDistractors.length === 3) {
          break;
        }
      }
    }

    const choices = shuffle([item.wordJP, ...selectedDistractors.slice(0, 3)]);
    const correctIndex = choices.findIndex((choice) => choice === item.wordJP);

    return {
      item,
      choices,
      correctIndex,
    };
  });
}

export function VocabularyQuizClient({
  level,
  sessionNumber,
  sessionItems,
  levelItems,
}: VocabularyQuizClientProps) {
  const progressRepo = useProgressRepo();
  const [isSavingAttempt, startSavingAttempt] = useTransition();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndexByQuestion, setSelectedIndexByQuestion] = useState<Record<number, number>>({});
  const [revealedByQuestion, setRevealedByQuestion] = useState<Record<number, boolean>>({});
  const [attemptSaved, setAttemptSaved] = useState(false);

  const sessionKey = `${level.toUpperCase()}:VOCAB:${sessionNumber}`;
  const questions = useMemo(
    () => buildQuestions(sessionItems, levelItems),
    [levelItems, sessionItems],
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
        Fill the blank using the best Japanese word. Quiz attempts are saved, but quiz completion
        does not affect flashcards session completion.
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
            <span className="muted-note">{currentQuestion.item.readingKana}</span>
          </div>

          <div className="flashcard-face">
            <p className="flashcard-label">Prompt (JP)</p>
            <p className="flashcard-example">
              {buildBlankedExample(currentQuestion.item.exampleJP, currentQuestion.item.wordJP)}
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
                The correct answer is <strong>{currentQuestion.item.wordJP}</strong>.
              </p>
              <p className="flashcard-example">
                <strong>Sentence meaning:</strong>{" "}
                {renderExampleENWithBold(
                  currentQuestion.item.exampleEN,
                  currentQuestion.item.meaningEN,
                )}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
