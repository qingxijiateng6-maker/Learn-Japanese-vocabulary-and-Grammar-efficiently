"use client";

import { useEffect, useMemo, useState } from "react";
import {
  isGrammarSessionCompleted,
  isVocabSessionCompleted,
} from "@/domain/progress/calc";
import { useProgressRepo } from "@/repo/progressRepoContext";
import type { UserProgress, VocabQuizAttempt } from "@/repo/progressRepo";

type HistorySessionMeta = {
  level: string;
  sessionNumber: number;
  sessionKey: string;
};

type HistoryDashboardProps = {
  vocabSessionsByLevel: Record<string, HistorySessionMeta[]>;
  grammarSessionsByLevel: Record<string, HistorySessionMeta[]>;
  warnings?: string[];
};

type SessionRow = {
  id: string;
  type: "Vocabulary" | "Grammar";
  level: string;
  sessionNumber: number;
  completed: boolean;
  grammarBestScore?: number;
  vocabQuizAccuracyLatest?: number;
};

function getLatestVocabQuizAttemptForSession(
  attempts: VocabQuizAttempt[],
  sessionKey: string,
): VocabQuizAttempt | null {
  const matching = attempts.filter((attempt) => attempt.sessionKey === sessionKey);
  if (matching.length === 0) {
    return null;
  }

  return matching.sort((a, b) => {
    const aDate = new Date(a.dateISO).getTime();
    const bDate = new Date(b.dateISO).getTime();
    return bDate - aDate;
  })[0];
}

function calcLevelProgressPercent(completedCount: number, totalCount: number): number {
  if (totalCount <= 0) {
    return 0;
  }
  return Math.round((completedCount / totalCount) * 100);
}

export function HistoryDashboard({
  vocabSessionsByLevel,
  grammarSessionsByLevel,
  warnings = [],
}: HistoryDashboardProps) {
  const progressRepo = useProgressRepo();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const next = await progressRepo.getProgress();
        if (active) {
          setProgress(next);
        }
      } catch {
        if (active) {
          setLoadError("Could not load history yet.");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [progressRepo]);

  const rows = useMemo<SessionRow[]>(() => {
    if (!progress) {
      return [];
    }

    const vocabRows = Object.entries(vocabSessionsByLevel).flatMap(([level, sessions]) =>
      sessions.map((session) => {
        const latestAttempt = getLatestVocabQuizAttemptForSession(
          progress.vocabQuizAttempts,
          session.sessionKey,
        );

        return {
          id: `v:${session.sessionKey}`,
          type: "Vocabulary" as const,
          level,
          sessionNumber: session.sessionNumber,
          completed: isVocabSessionCompleted(progress.vocabSessionCompletion, session.sessionKey),
          vocabQuizAccuracyLatest: latestAttempt?.accuracyPercent,
        };
      }),
    );

    const grammarRows = Object.entries(grammarSessionsByLevel).flatMap(([level, sessions]) =>
      sessions.map((session) => ({
        id: `g:${session.sessionKey}`,
        type: "Grammar" as const,
        level,
        sessionNumber: session.sessionNumber,
        completed: isGrammarSessionCompleted(progress.grammarSessionCompletion, session.sessionKey),
        grammarBestScore: progress.grammarBestScoreBySession[session.sessionKey],
      })),
    );

    return [...vocabRows, ...grammarRows].sort((a, b) => {
      if (a.level !== b.level) {
        return a.level.localeCompare(b.level);
      }
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }
      return a.sessionNumber - b.sessionNumber;
    });
  }, [grammarSessionsByLevel, progress, vocabSessionsByLevel]);

  const perLevelProgress = useMemo(() => {
    const levels = ["A2", "B1", "C1"];

    return levels.map((level) => {
      const vocabSessions = vocabSessionsByLevel[level] ?? [];
      const grammarSessions = grammarSessionsByLevel[level] ?? [];

      if (!progress || (vocabSessions.length === 0 && grammarSessions.length === 0)) {
        return {
          level,
          available: false,
          vocabPercent: 0,
          grammarPercent: 0,
          vocabCounts: "0/0",
          grammarCounts: "0/0",
        };
      }

      const vocabCompleted = vocabSessions.filter((session) =>
        isVocabSessionCompleted(progress.vocabSessionCompletion, session.sessionKey),
      ).length;
      const grammarCompleted = grammarSessions.filter((session) =>
        isGrammarSessionCompleted(progress.grammarSessionCompletion, session.sessionKey),
      ).length;

      return {
        level,
        available: true,
        vocabPercent: calcLevelProgressPercent(vocabCompleted, vocabSessions.length),
        grammarPercent: calcLevelProgressPercent(grammarCompleted, grammarSessions.length),
        vocabCounts: `${vocabCompleted}/${vocabSessions.length}`,
        grammarCounts: `${grammarCompleted}/${grammarSessions.length}`,
      };
    });
  }, [grammarSessionsByLevel, progress, vocabSessionsByLevel]);

  return (
    <main className="page-main">
      <section className="page-card">
        <h1 className="page-title">History</h1>
        <p className="page-subtitle">
          Review your session completion, grammar best scores, and vocabulary quiz results.
        </p>
        <p className="muted-note">
          Vocabulary quiz accuracy shows the <strong>latest attempt</strong> per session.
        </p>
        {loadError ? <p className="muted-note">{loadError}</p> : null}
        {warnings.length > 0 ? <p className="muted-note">Warning: {warnings[0]}</p> : null}
      </section>

      <section className="page-card">
        <h2 className="page-title">Per-Level Progress</h2>
        <div className="history-grid">
          {perLevelProgress.map((entry) => (
            <article key={entry.level} className="history-level-card">
              <h3 className="topic-card__title">{entry.level}</h3>
              {entry.available ? (
                <>
                  <p className="muted-note">
                    Vocabulary: {entry.vocabPercent}% ({entry.vocabCounts})
                  </p>
                  <div className="progress-bar" aria-hidden="true">
                    <div className="progress-bar__fill" style={{ width: `${entry.vocabPercent}%` }} />
                  </div>
                  <p className="muted-note">
                    Grammar: {entry.grammarPercent}% ({entry.grammarCounts})
                  </p>
                  <div className="progress-bar" aria-hidden="true">
                    <div
                      className="progress-bar__fill"
                      style={{ width: `${entry.grammarPercent}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="muted-note">Coming soon for MVP.</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="page-card">
        <h2 className="page-title">Per-Session History</h2>
        {rows.length === 0 ? (
          <p className="muted-note">No session history available yet. Start studying to see records.</p>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Level</th>
                  <th>Session</th>
                  <th>Completed</th>
                  <th>Grammar Best</th>
                  <th>Vocab Quiz (Latest)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.type}</td>
                    <td>{row.level}</td>
                    <td>{row.sessionNumber}</td>
                    <td>{row.completed ? "Yes" : "No"}</td>
                    <td>
                      {row.type === "Grammar"
                        ? typeof row.grammarBestScore === "number"
                          ? `${Math.round(row.grammarBestScore)}%`
                          : "-"
                        : "-"}
                    </td>
                    <td>
                      {row.type === "Vocabulary"
                        ? typeof row.vocabQuizAccuracyLatest === "number"
                          ? `${Math.round(row.vocabQuizAccuracyLatest)}%`
                          : "-"
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
