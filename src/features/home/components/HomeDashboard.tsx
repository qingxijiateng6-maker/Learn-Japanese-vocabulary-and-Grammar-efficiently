"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { GoogleSignInButton, useGoogleAuth } from "@/auth/googleAuth";
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

const homeNavItems = [
  {
    href: "/",
    label: "Home",
    imageSrc: "/images/ChatGPT Image 2026年3月12日 08_01_47.png",
    imageAlt: "",
  },
  {
    href: "/vocabulary",
    label: "Vocabulary",
    imageSrc: "/images/anki_card.png",
    imageAlt: "",
  },
  {
    href: "/grammar",
    label: "Grammar",
    imageSrc: "/images/ChatGPT Image 2026年3月12日 07_34_49.png",
    imageAlt: "",
  },
  {
    href: "/history",
    label: "History",
    imageSrc: "/images/ChatGPT Image 2026年3月12日 07_39_00.png",
    imageAlt: "",
  },
] as const;

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
      <p className="home-progress__detail">{detail}</p>
    </div>
  );
}

export function HomeDashboard({
  availableVocabSessionKeys,
  availableGrammarSessionKeys,
}: HomeDashboardProps) {
  const { user, isConfigured, configError } = useGoogleAuth();
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
    <main className="home-page">
      {!user ? (
        <section className="home-auth" aria-label="Authentication">
          <GoogleSignInButton
            className="home-auth__button"
            label="Sign in with Google"
            loadingLabel="ログイン状態を確認中..."
            signingInLabel="Googleでログイン中..."
            fallbackLabel="Firebase設定が必要です"
          />
          {configError ? (
            <span className="auth-config-hint home-auth__hint" title={configError}>
              {isConfigured
                ? `Googleログインエラー: ${configError}`
                : `Googleログイン未設定: ${configError}`}
            </span>
          ) : null}
        </section>
      ) : null}

      <section className="home-panel home-panel--hero">
        <div className="home-panel__content">
          <h1 className="home-page__title">Home</h1>
          <p className="home-page__description">
            Track your weekly study time and session completion progress.
          </p>
          <p className="home-page__week">
            Current week: {derived.weekRange.startISO} to {derived.weekRange.endISOExclusive}{" "}
            (exclusive end)
          </p>
        </div>
      </section>

      <section className="home-panel home-panel--goal">
        <div className="home-panel__content">
          <h2 className="home-panel__title">Weekly Goal</h2>
          <p className="home-panel__description">
            Set your study time goal in minutes for this week.
          </p>
          <p className="home-panel__note">
            Week runs from Monday to Sunday. Once you save this week&apos;s goal, it cannot be
            changed until next week.
          </p>

          <div className="home-goal">
            <label className="home-goal__label" htmlFor="weekly-goal-minutes">
              Weekly goal (minutes)
            </label>
            <div className="home-goal__controls">
              <input
                id="weekly-goal-minutes"
                name="weeklyGoalMinutes"
                className="home-goal__input"
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
                className="home-goal__button"
                onClick={handleSaveGoal}
                disabled={isSaving || derived.isGoalLockedForCurrentWeek}
              >
                {isSaving
                  ? "Saving..."
                  : derived.isGoalLockedForCurrentWeek
                    ? "Goal locked"
                    : "Save goal"}
              </button>
            </div>
          </div>

          {saveMessage ? (
            <p
              className={`home-goal__message${
                saveMessage === "Weekly goal saved."
                  ? " home-goal__message--success"
                  : " home-goal__message--error"
              }`}
            >
              {saveMessage}
            </p>
          ) : null}
          {loadError ? <p className="home-goal__message home-goal__message--error">{loadError}</p> : null}
          {derived.isGoalLockedForCurrentWeek ? (
            <p className="home-goal__message home-goal__message--muted">
              This week&apos;s goal is locked. You can update it next Monday.
            </p>
          ) : null}
        </div>
      </section>

      <section className="home-panel home-panel--progress">
        <div className="home-panel__content">
          <h2 className="home-panel__title">Progress Overview</h2>
          <div className="progress-grid home-progress-grid">
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
        </div>
      </section>

      <section className="home-panel home-panel--nav">
        <div className="home-panel__content">
          <nav className="home-nav-grid" aria-label="Quick navigation">
            {homeNavItems.map((item) => (
              <Link
                key={item.href}
                className="home-nav-card"
                href={item.href}
                aria-current={item.href === "/" ? "page" : undefined}
              >
                <span className="home-nav-card__image-wrap" aria-hidden="true">
                  <Image
                    className="home-nav-card__image"
                    src={item.imageSrc}
                    alt={item.imageAlt}
                    width={88}
                    height={88}
                  />
                </span>
                <span className="home-nav-card__label">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </main>
  );
}
