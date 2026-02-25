"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { shouldMarkVocabCompleted } from "@/domain/progress/calc";
import { useProgressRepo } from "@/repo/progressRepoContext";
import type { VocabGrade } from "@/repo/progressRepo";
import type { VocabularyItem } from "@/content/loaders";
import { JapaneseExampleText } from "@/shared/components/JapaneseExampleText";
import { useStudySettings } from "@/shared/settings/studySettings";

type ReviewFilter = "all" | "didnt_remember" | "review";

type VocabularyFlashcardsClientProps = {
  level: string;
  sessionNumber: number;
  items: VocabularyItem[];
};

const gradeOrder: Array<{ value: VocabGrade; label: string }> = [
  { value: "remembered", label: "Remembered" },
  { value: "not_sure", label: "Not sure" },
  { value: "didnt_remember", label: "Didn't remember" },
];

export function VocabularyFlashcardsClient({
  level,
  sessionNumber,
  items,
}: VocabularyFlashcardsClientProps) {
  const progressRepo = useProgressRepo();
  const { settings } = useStudySettings();
  const sessionKey = `${level.toUpperCase()}:VOCAB:${sessionNumber}`;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [gradesById, setGradesById] = useState<Record<string, VocabGrade>>({});
  const [seenInAllFilter, setSeenInAllFilter] = useState<Set<string>>(new Set());
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [speechMessage, setSpeechMessage] = useState<string | null>(null);
  const [isSavingGrade, startSavingGrade] = useTransition();

  useEffect(() => {
    let active = true;
    void (async () => {
      const progress = await progressRepo.getProgress();
      if (!active) {
        return;
      }

      const nextGrades: Record<string, VocabGrade> = {};
      for (const item of items) {
        const grade = progress.vocabGrades[item.id];
        if (grade) {
          nextGrades[item.id] = grade;
        }
      }
      setGradesById(nextGrades);
      setSessionCompleted(Boolean(progress.vocabSessionCompletion[sessionKey]));
    })();

    return () => {
      active = false;
    };
  }, [items, progressRepo, sessionKey]);

  const filteredItems = useMemo(() => {
    if (filter === "all") {
      return items;
    }

    if (filter === "didnt_remember") {
      return items.filter((item) => gradesById[item.id] === "didnt_remember");
    }

    return items.filter((item) => {
      const grade = gradesById[item.id];
      return grade === "not_sure" || grade === "didnt_remember";
    });
  }, [filter, gradesById, items]);

  useEffect(() => {
    setCurrentIndex(0);
    setShowBack(false);
  }, [filter]);

  const currentCard = filteredItems[currentIndex] ?? null;

  useEffect(() => {
    if (filter !== "all") {
      return;
    }
    if (!currentCard) {
      return;
    }

    setSeenInAllFilter((previous) => {
      if (previous.has(currentCard.id)) {
        return previous;
      }

      const next = new Set(previous);
      next.add(currentCard.id);
      return next;
    });
  }, [currentCard, filter]);

  useEffect(() => {
    if (sessionCompleted) {
      return;
    }

    if (!shouldMarkVocabCompleted(seenInAllFilter.size, items.length)) {
      return;
    }

    setSessionCompleted(true);
    void progressRepo.markVocabSessionCompleted(sessionKey);
  }, [items.length, progressRepo, seenInAllFilter, sessionCompleted, sessionKey]);

  const handleGrade = (grade: VocabGrade) => {
    if (!currentCard) {
      return;
    }

    const vocabItemId = currentCard.id;
    setGradesById((previous) => ({ ...previous, [vocabItemId]: grade }));

    startSavingGrade(() => {
      void progressRepo.setVocabGrade(vocabItemId, grade);
    });
  };

  const handlePlayPronunciation = () => {
    if (!currentCard) {
      return;
    }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeechMessage("Pronunciation is not available in this browser.");
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentCard.wordJP);
      utterance.lang = "ja-JP";
      window.speechSynthesis.speak(utterance);
      setSpeechMessage(null);
    } catch {
      setSpeechMessage("Could not play pronunciation.");
    }
  };

  const moveCard = (delta: number) => {
    if (filteredItems.length <= 0) {
      return;
    }
    setCurrentIndex((previous) => {
      const nextIndex = previous + delta;
      if (nextIndex < 0) {
        return 0;
      }
      if (nextIndex >= filteredItems.length) {
        return filteredItems.length - 1;
      }
      return nextIndex;
    });
    setShowBack(false);
  };

  const currentGrade = currentCard ? gradesById[currentCard.id] : undefined;

  return (
    <section className="page-card">
      <div className="stack-row">
        <h2 className="page-title">Flashcards</h2>
        {sessionCompleted ? <span className="status-badge">Completed</span> : null}
      </div>
      <p className="page-subtitle">
        Completion rule: View all cards once in <strong>All cards</strong> filter.
      </p>
      <p className="muted-note">
        Seen in All cards: {seenInAllFilter.size}/{items.length}
      </p>

      <div className="filter-row" role="tablist" aria-label="Review filters">
        <button
          type="button"
          className={`chip-button${filter === "all" ? " chip-button--active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All cards ({items.length})
        </button>
        <button
          type="button"
          className={`chip-button${filter === "didnt_remember" ? " chip-button--active" : ""}`}
          onClick={() => setFilter("didnt_remember")}
        >
          Didnt remember only
        </button>
        <button
          type="button"
          className={`chip-button${filter === "review" ? " chip-button--active" : ""}`}
          onClick={() => setFilter("review")}
        >
          Not sure + Didnt remember
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="flashcard-panel">
          <p className="muted-note">
            No cards match this filter yet. Grade cards first or switch to All cards.
          </p>
        </div>
      ) : currentCard ? (
        <div className="flashcard-panel">
          <div className="stack-row">
            <strong>
              Card {currentIndex + 1} / {filteredItems.length}
            </strong>
            <button type="button" className="button-link" onClick={handlePlayPronunciation}>
              Play pronunciation
            </button>
          </div>

          <div className="flashcard-face">
            {!showBack ? (
              <>
                <p className="flashcard-label">Front</p>
                <p className="flashcard-word">{currentCard.wordJP}</p>
                <p className="muted-note">{currentCard.readingKana}</p>
              </>
            ) : (
              <>
                <p className="flashcard-label">Back</p>
                {settings.showEnglishMeaning ? (
                  <p className="flashcard-meaning">{currentCard.meaningEN}</p>
                ) : (
                  <p className="muted-note">
                    English meaning is hidden by your display setting.
                  </p>
                )}
                <p className="flashcard-example">
                  <strong>Example (JP):</strong>{" "}
                  <JapaneseExampleText
                    text={currentCard.exampleJP}
                    furiganaEnabled={settings.furiganaEnabled}
                  />
                </p>
                <p className="flashcard-example">
                  <strong>Example (EN):</strong> {currentCard.exampleEN}
                </p>
              </>
            )}
          </div>

          <div className="button-row">
            <button
              type="button"
              className="button-link"
              onClick={() => setShowBack((previous) => !previous)}
            >
              {showBack ? "Show front" : "Show back"}
            </button>
            <button type="button" className="button-link" onClick={() => moveCard(-1)}>
              Previous
            </button>
            <button type="button" className="button-link" onClick={() => moveCard(1)}>
              Next
            </button>
          </div>

          <div className="button-row">
            {gradeOrder.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`button-link${currentGrade === option.value ? " button-link--primary" : ""}`}
                onClick={() => handleGrade(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="muted-note">
            Current grade:{" "}
            {currentGrade === "didnt_remember"
              ? "Didn't remember"
              : currentGrade === "not_sure"
                ? "Not sure"
                : currentGrade === "remembered"
                  ? "Remembered"
                  : "Not graded yet"}
            {isSavingGrade ? " (saving...)" : ""}
          </p>
          {speechMessage ? <p className="muted-note">{speechMessage}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
