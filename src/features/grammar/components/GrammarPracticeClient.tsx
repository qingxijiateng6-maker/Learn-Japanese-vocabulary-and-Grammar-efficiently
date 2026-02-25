"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { updateGrammarBestAndCompletion } from "@/domain/progress/calc";
import type { GrammarJsonV1Item, GrammarQuestionJsonV1 } from "@/content/schema";
import { getLocalDateISO } from "@/repo/progressRepo";
import { useProgressRepo } from "@/repo/progressRepoContext";

type GrammarPracticeClientProps = {
  level: string;
  sessionNumber: number;
  items: GrammarJsonV1Item[];
};

type FlattenedQuestion = {
  topicId: string;
  topicTitleEN: string;
  question: GrammarQuestionJsonV1;
};

function flattenQuestions(items: GrammarJsonV1Item[]): FlattenedQuestion[] {
  return items.flatMap((item) =>
    item.questions.map((question) => ({
      topicId: item.id,
      topicTitleEN: item.titleEN,
      question,
    })),
  );
}

export function GrammarPracticeClient({
  level,
  sessionNumber,
  items,
}: GrammarPracticeClientProps) {
  const progressRepo = useProgressRepo();
  const [isSaving, startSaving] = useTransition();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndexByQuestion, setSelectedIndexByQuestion] = useState<Record<number, number>>({});
  const [revealedByQuestion, setRevealedByQuestion] = useState<Record<number, boolean>>({});
  const [attemptSaved, setAttemptSaved] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const sessionKey = `${level.toUpperCase()}:GRAMMAR:${sessionNumber}`;
  const questions = useMemo(() => flattenQuestions(items), [items]);
  const current = questions[questionIndex] ?? null;
  const selectedIndex = selectedIndexByQuestion[questionIndex];
  const revealed = revealedByQuestion[questionIndex] === true;

  useEffect(() => {
    let active = true;
    void (async () => {
      const progress = await progressRepo.getProgress();
      if (!active) {
        return;
      }
      const savedBest = progress.grammarBestScoreBySession[sessionKey];
      setBestScore(typeof savedBest === "number" ? savedBest : null);
      setCompleted(progress.grammarSessionCompletion[sessionKey]?.completed === true);
    })();
    return () => {
      active = false;
    };
  }, [progressRepo, sessionKey]);

  const correctCount = questions.reduce((count, item, index) => {
    const selected = selectedIndexByQuestion[index];
    return selected === item.question.correctIndex ? count + 1 : count;
  }, 0);
  const totalCount = questions.length;
  const answeredCount = Object.keys(revealedByQuestion).filter(
    (key) => revealedByQuestion[Number(key)],
  ).length;
  const finished = totalCount > 0 && answeredCount === totalCount;
  const scorePercent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  useEffect(() => {
    if (!finished || attemptSaved || totalCount <= 0) {
      return;
    }

    setAttemptSaved(true);
    startSaving(() => {
      void (async () => {
        try {
          const now = new Date();
          await progressRepo.addGrammarAttempt({
            sessionKey,
            dateISO: getLocalDateISO(now),
            correctCount,
            totalCount,
            scorePercent,
          });

          const progress = await progressRepo.getProgress();
          const updated = updateGrammarBestAndCompletion(
            progress.grammarBestScoreBySession,
            progress.grammarSessionCompletion,
            sessionKey,
            scorePercent,
            now.toISOString(),
          );
          const nextBest = updated.bestScoreBySession[sessionKey] ?? scorePercent;
          const nextCompletion = updated.completion[sessionKey] ?? { completed: false };

          await progressRepo.setGrammarBestScore(sessionKey, nextBest);
          await progressRepo.setGrammarSessionCompletion(sessionKey, nextCompletion);

          setBestScore(nextBest);
          setCompleted(nextCompletion.completed === true);
          setSaveMessage("Attempt saved.");
        } catch {
          setSaveMessage("Could not save attempt.");
        }
      })();
    });
  }, [
    attemptSaved,
    correctCount,
    finished,
    progressRepo,
    scorePercent,
    sessionKey,
    totalCount,
  ]);

  const selectChoice = (index: number) => {
    if (revealed) {
      return;
    }
    setSelectedIndexByQuestion((previous) => ({ ...previous, [questionIndex]: index }));
  };

  const checkAnswer = () => {
    if (selectedIndex === undefined) {
      return;
    }
    setRevealedByQuestion((previous) => ({ ...previous, [questionIndex]: true }));
  };

  const nextQuestion = () => {
    setQuestionIndex((previous) => Math.min(previous + 1, totalCount - 1));
  };

  const prevQuestion = () => {
    setQuestionIndex((previous) => Math.max(previous - 1, 0));
  };

  const retry = () => {
    setQuestionIndex(0);
    setSelectedIndexByQuestion({});
    setRevealedByQuestion({});
    setAttemptSaved(false);
    setSaveMessage(null);
  };

  if (totalCount === 0) {
    return (
      <section className="page-card">
        <h2 className="page-title">Practice</h2>
        <p className="muted-note">Content preparing. No practice questions are available yet.</p>
      </section>
    );
  }

  return (
    <section className="page-card">
      <div className="stack-row">
        <h2 className="page-title">Practice</h2>
        {completed ? <span className="status-badge">Completed</span> : null}
      </div>
      <p className="page-subtitle">Completion requires 80%+ (Best score).</p>
      <p className="muted-note">
        Best score: {bestScore === null ? "-" : `${Math.round(bestScore)}%`} | Current attempt:{" "}
        {finished ? `${scorePercent}%` : `${correctCount}/${totalCount} correct so far`}
      </p>

      {finished ? (
        <div className="flashcard-panel">
          <div className="flashcard-face">
            <p className="flashcard-label">Practice complete</p>
            <p className="flashcard-meaning">
              Score: {correctCount}/{totalCount} ({scorePercent}%)
            </p>
            <p className="muted-note">
              {completed
                ? "Session completed because your best score is 80% or higher."
                : "Session not completed yet. Try again to reach 80% or higher best score."}
            </p>
            {saveMessage ? <p className="muted-note">{saveMessage}</p> : null}
            {isSaving ? <p className="muted-note">Saving...</p> : null}
          </div>
          <div className="button-row">
            <button type="button" className="button-link button-link--primary" onClick={retry}>
              Try again
            </button>
          </div>
        </div>
      ) : current ? (
        <div className="flashcard-panel">
          <div className="stack-row">
            <strong>
              Question {questionIndex + 1} / {totalCount}
            </strong>
            <span className="muted-note">{current.topicTitleEN}</span>
          </div>

          <div className="flashcard-face">
            <p className="flashcard-label">Prompt</p>
            <p className="flashcard-example">{current.question.promptEN}</p>
            {current.question.promptJP ? (
              <p className="muted-note">JP: {current.question.promptJP}</p>
            ) : null}
          </div>

          <div className="quiz-choices">
            {current.question.choices.map((choice, index) => {
              const isSelected = selectedIndex === index;
              const isCorrect = current.question.correctIndex === index;
              const showCorrect = revealed && isCorrect;
              const showWrong = revealed && isSelected && !isCorrect;

              return (
                <button
                  key={`${current.question.id}:${choice}`}
                  type="button"
                  className={[
                    "quiz-choice",
                    isSelected ? "quiz-choice--selected" : "",
                    showCorrect ? "quiz-choice--correct" : "",
                    showWrong ? "quiz-choice--wrong" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => selectChoice(index)}
                  disabled={revealed}
                >
                  {choice}
                </button>
              );
            })}
          </div>

          <div className="button-row">
            <button type="button" className="button-link" onClick={prevQuestion}>
              Previous
            </button>
            {!revealed ? (
              <button
                type="button"
                className="button-link button-link--primary"
                onClick={checkAnswer}
                disabled={selectedIndex === undefined}
              >
                Check answer
              </button>
            ) : (
              <button
                type="button"
                className="button-link button-link--primary"
                onClick={nextQuestion}
                disabled={questionIndex >= totalCount - 1}
              >
                Next
              </button>
            )}
          </div>

          {revealed ? (
            <div className="quiz-explanation">
              <p className="flashcard-label">Explanation</p>
              <p className="flashcard-example">
                {selectedIndex === current.question.correctIndex ? "Correct. " : "Incorrect. "}
                Correct answer:{" "}
                <strong>{current.question.choices[current.question.correctIndex]}</strong>
              </p>
              <p className="flashcard-example">{current.question.explanationEN}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
