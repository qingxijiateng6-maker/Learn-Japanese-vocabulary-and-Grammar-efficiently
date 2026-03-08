"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isVocabSessionCompleted } from "@/domain/progress/calc";
import {
  getVocabularyPartOfSpeechLabel,
  getVocabularySessionHref,
  type VocabularyLevel,
  type VocabularyPartOfSpeech,
} from "@/domain/vocabulary/meta";
import { useProgressRepo } from "@/repo/progressRepoContext";
import type { UserProgress } from "@/repo/progressRepo";

type VocabularySessionListItem = {
  sessionNumber: number;
  itemCount: number;
  sessionKey: string;
};

type VocabularySessionListProps = {
  level: VocabularyLevel;
  partOfSpeech: VocabularyPartOfSpeech;
  sessions: VocabularySessionListItem[];
  warning?: string;
};

export function VocabularySessionList({
  level,
  partOfSpeech,
  sessions,
  warning,
}: VocabularySessionListProps) {
  const progressRepo = useProgressRepo();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const partOfSpeechLabel = getVocabularyPartOfSpeechLabel(partOfSpeech);

  useEffect(() => {
    let active = true;
    void (async () => {
      const next = await progressRepo.getProgress();
      if (active) {
        setProgress(next);
      }
    })();
    return () => {
      active = false;
    };
  }, [progressRepo]);

  if (sessions.length === 0) {
    return (
      <section className="page-card">
        <h2 className="page-title">
          {level} {partOfSpeechLabel} Sessions
        </h2>
        <p className="page-subtitle">
          Content preparing. No valid vocabulary sessions are available yet.
        </p>
        {warning ? <p className="muted-note">Warning: {warning}</p> : null}
      </section>
    );
  }

  return (
    <section className="page-card">
      <h2 className="page-title">
        {level} {partOfSpeechLabel} Sessions
      </h2>
      <ul className="placeholder-list">
        {sessions.map((session) => {
          const completed = progress
            ? isVocabSessionCompleted(progress.vocabSessionCompletion, session.sessionKey)
            : false;

          return (
            <li key={session.sessionNumber}>
              <Link href={getVocabularySessionHref(level, partOfSpeech, session.sessionNumber)}>
                Session {session.sessionNumber} ({session.itemCount} items)
              </Link>
              {completed ? <span className="status-badge">Completed</span> : null}
            </li>
          );
        })}
      </ul>
      <p className="muted-note">
        Flashcards completion rule: view all cards once in All cards filter.
      </p>
      {warning ? <p className="muted-note">Warning: {warning}</p> : null}
    </section>
  );
}
