"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isGrammarSessionCompleted } from "@/domain/progress/calc";
import { useProgressRepo } from "@/repo/progressRepoContext";
import type { UserProgress } from "@/repo/progressRepo";

type GrammarSessionListItem = {
  sessionNumber: number;
  topicCount: number;
  questionCount: number;
};

type GrammarSessionListProps = {
  sessions: GrammarSessionListItem[];
  warning?: string;
};

export function GrammarSessionList({ sessions, warning }: GrammarSessionListProps) {
  const progressRepo = useProgressRepo();
  const [progress, setProgress] = useState<UserProgress | null>(null);

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
        <h2 className="page-title">A2 Sessions</h2>
        <p className="page-subtitle">
          Content preparing. No valid grammar sessions are available yet.
        </p>
        {warning ? <p className="muted-note">Warning: {warning}</p> : null}
      </section>
    );
  }

  return (
    <section className="page-card">
      <h2 className="page-title">A2 Sessions</h2>
      <ul className="placeholder-list">
        {sessions.map((session) => {
          const sessionKey = `A2:GRAMMAR:${session.sessionNumber}`;
          const bestScore = progress?.grammarBestScoreBySession[sessionKey];
          const completed = progress
            ? isGrammarSessionCompleted(progress.grammarSessionCompletion, sessionKey)
            : false;

          return (
            <li key={session.sessionNumber}>
              <Link href={`/grammar/a2/session/${session.sessionNumber}`}>
                Session {session.sessionNumber} ({session.topicCount} topic
                {session.topicCount === 1 ? "" : "s"}, {session.questionCount} questions)
              </Link>
              {typeof bestScore === "number" ? (
                <span className="muted-inline">Best: {Math.round(bestScore)}%</span>
              ) : (
                <span className="muted-inline">Best: -</span>
              )}
              {completed ? <span className="status-badge">Completed</span> : null}
            </li>
          );
        })}
      </ul>
      <p className="muted-note">Completion requires 80%+ (Best score).</p>
      {warning ? <p className="muted-note">Warning: {warning}</p> : null}
    </section>
  );
}
