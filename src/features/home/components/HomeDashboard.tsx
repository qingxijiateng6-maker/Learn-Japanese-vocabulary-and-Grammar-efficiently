"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useProgressRepo } from "@/repo/progressRepoContext";
import type { UserProgress } from "@/repo/progressRepo";
import {
  calcTimeProgressPercent,
  calcWeeklyContentProgress,
  calcWeeklyTimeSeconds,
  getWeekRange,
} from "@/domain/progress/calc";

type HomeDashboardProps = {
  availableVocabSessionKeys: string[];
  availableGrammarSessionKeys: string[];
};

function ProgressBar({
  label,
  percent,
  detail,
}: {
  label: string;
  percent: number;
  detail: string;
}) {
  return (
    <div className="progress-block">
      <div className="progress-block__header">
        <span>{label}</span>
        <strong>{percent}%</strong>
      </div>
      <div
        className="progress-bar"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="progress-bar__fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="muted-note">{detail}</p>
    </div>
  );
}

export function HomeDashboard({
  availableVocabSessionKeys,
  availableGrammarSessionKeys,
}: HomeDashboardProps) {
  const progressRepo = useProgressRepo();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [goalInput, setGoalInput] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await progressRepo.getProgress();
        if (!active) {
          return;
        }
        setProgress(data);
        setGoalInput(String(data.weeklyGoalMinutes));
      } catch {
        if (!active) {
          return;
        }
        setLoadError("Could not load progress yet. Please refresh and try again.");
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [progressRepo]);

  const derived = useMemo(() => {
    const weekRange = getWeekRange(new Date(), true);
    const weeklyGoalMinutes = progress?.weeklyGoalMinutes ?? 0;
    const isGoalLockedForCurrentWeek =
      progress?.weeklyGoalLockedWeekStartISO === weekRange.startISO;
    const weeklyTimeSeconds = calcWeeklyTimeSeconds(progress?.weeklyTimeLog ?? [], weekRange);
    const timeProgressPercent =
      weeklyGoalMinutes <= 0
        ? 0
        : calcTimeProgressPercent(weeklyGoalMinutes, weeklyTimeSeconds);
    const weeklyContent = calcWeeklyContentProgress({
      weekRange,
      availableVocabSessionKeys,
      availableGrammarSessionKeys,
      vocabSessionCompletion: progress?.vocabSessionCompletion ?? {},
      grammarSessionCompletion: progress?.grammarSessionCompletion ?? {},
    });

    return {
      weekRange,
      weeklyGoalMinutes,
      isGoalLockedForCurrentWeek,
      weeklyTimeSeconds,
      timeProgressPercent,
      weeklyContent,
    };
  }, [availableGrammarSessionKeys, availableVocabSessionKeys, progress]);

  const handleSaveGoal = () => {
    if (derived.isGoalLockedForCurrentWeek) {
      setSaveMessage("This week's goal is already locked. You can change it next week.");
      return;
    }

    const parsed = Number.parseInt(goalInput, 10);
    const nextGoal = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    const confirmed = window.confirm(
      `Are you sure this is the goal time you want for this week? (${nextGoal} minutes)`,
    );

    if (!confirmed) {
      return;
    }

    startSaving(() => {
      void (async () => {
        try {
          const next = await progressRepo.setWeeklyGoalMinutes(nextGoal);
          setProgress(next);
          setGoalInput(String(next.weeklyGoalMinutes));
          setSaveMessage("Weekly goal saved.");
        } catch (error) {
          if (error instanceof Error && error.message.includes("locked")) {
            setSaveMessage("This week's goal is already locked. You can change it next week.");
            return;
          }
          setSaveMessage("Could not save weekly goal.");
        }
      })();
    });
  };

  return (
    <main className="page-main">
      <section className="page-card">
        <h1 className="page-title">Home</h1>
        <p className="page-subtitle">
          Track your weekly study time and session completion progress.
        </p>
        <p className="muted-note">
          Current week: {derived.weekRange.startISO} to {derived.weekRange.endISOExclusive} (exclusive end)
        </p>
      </section>

      <section className="page-card">
        <h2 className="page-title">Weekly Goal</h2>
        <p className="page-subtitle">
          Set your study time goal in minutes for this week.
        </p>
        <p className="muted-note">
          Week runs from Monday to Sunday. Once you save this week's goal, it cannot be changed
          until next week.
        </p>
        <div className="goal-form">
          <label className="goal-form__label" htmlFor="weekly-goal-minutes">
            Weekly goal (minutes)
          </label>
          <input
            id="weekly-goal-minutes"
            className="goal-form__input"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={goalInput}
            onChange={(event) => {
              setGoalInput(event.target.value);
              setSaveMessage(null);
            }}
            disabled={derived.isGoalLockedForCurrentWeek}
          />
          <button
            type="button"
            className="button-link button-link--primary"
            onClick={handleSaveGoal}
            disabled={isSaving || derived.isGoalLockedForCurrentWeek}
          >
            {isSaving ? "Saving..." : derived.isGoalLockedForCurrentWeek ? "Goal locked" : "Save goal"}
          </button>
        </div>
        {derived.isGoalLockedForCurrentWeek ? (
          <p className="muted-note">
            This week's goal is locked. You can update it after Sunday (starting next Monday).
          </p>
        ) : null}
        {derived.weeklyGoalMinutes <= 0 ? (
          <p className="muted-note">Set a weekly goal to start tracking Time Progress %.</p>
        ) : null}
        {saveMessage ? <p className="muted-note">{saveMessage}</p> : null}
        {loadError ? <p className="muted-note">{loadError}</p> : null}
      </section>

      <section className="page-card">
        <h2 className="page-title">Progress Overview</h2>
        <div className="progress-grid">
          <ProgressBar
            label="Time Progress %"
            percent={derived.timeProgressPercent}
            detail={`${Math.round(derived.weeklyTimeSeconds / 60)} min studied this week / ${derived.weeklyGoalMinutes} min goal`}
          />
          <ProgressBar
            label="Content Progress %"
            percent={derived.weeklyContent.percent}
            detail={`${derived.weeklyContent.completedCount}/${derived.weeklyContent.totalCount} sessions completed this week`}
          />
        </div>
      </section>

      <section className="page-card">
        <h2 className="page-title">Quick Links</h2>
        <div className="button-row">
          <Link className="button-link" href="/vocabulary">
            Vocabulary
          </Link>
          <Link className="button-link" href="/grammar">
            Grammar
          </Link>
          <Link className="button-link" href="/history">
            History
          </Link>
        </div>
      </section>
    </main>
  );
}
