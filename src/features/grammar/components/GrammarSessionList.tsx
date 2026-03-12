"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isGrammarSessionCompleted } from "@/domain/progress/calc";
import { useProgressRepo } from "@/repo/progressRepoContext";
import type { UserProgress } from "@/repo/progressRepo";

type GrammarSessionListItem = {
  sessionNumber: number;
  sessionTitle: string;
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
      <section className="page-card grammar-panel grammar-panel--selection">
        <h2 className="page-title">A2 Sessions</h2>
        <p className="page-subtitle">
          Content preparing. No valid grammar sessions are available yet.
        </p>
        {warning ? <p className="muted-note">Warning: {warning}</p> : null}
      </section>
    );
  }

  return (
    <section className="page-card grammar-panel grammar-panel--selection">
      <h2 className="page-title">A2 Sessions</h2>
      <div className="grammar-session-list">
        {sessions.map((session) => {
          const sessionKey = `A2:GRAMMAR:${session.sessionNumber}`;
          const bestScore = progress?.grammarBestScoreBySession[sessionKey];
          const completed = progress
            ? isGrammarSessionCompleted(progress.grammarSessionCompletion, sessionKey)
            : false;

          return (
            <Link
              key={session.sessionNumber}
              className="grammar-session-link grammar-selection-card"
              href={`/grammar/a2/session/${session.sessionNumber}`}
            >
              <div className="stack-row">
                <strong className="grammar-session-link__title">{session.sessionTitle}</strong>
                {completed ? <span className="status-badge">Completed</span> : null}
              </div>
              <p className="muted-note">
                {session.topicCount} topic{session.topicCount === 1 ? "" : "s"} •{" "}
                {session.questionCount} practice question{session.questionCount === 1 ? "" : "s"}
              </p>
              <div className="stack-row">
                <span className="muted-note">
                  Best score: {typeof bestScore === "number" ? `${Math.round(bestScore)}%` : "-"}
                </span>
                <span className="grammar-session-link__cta">Open explanation</span>
              </div>
            </Link>
          );
        })}
      </div>
      <p className="muted-note">Completion requires 80%+ (Best score).</p>
      {warning ? <p className="muted-note">Warning: {warning}</p> : null}
    </section>
  );
}
