"use client";

import { useEffect, useRef } from "react";
import { getLocalDateISO } from "@/repo/progressRepo";

type UseStudyTimerOptions = {
  idleThresholdMs?: number;
  flushIntervalMs?: number;
  onAddSeconds: (dateISO: string, secondsDelta: number) => void | Promise<void>;
};

const DEFAULT_IDLE_THRESHOLD_MS = 60_000;
const DEFAULT_FLUSH_INTERVAL_MS = 10_000;
const TICK_MS = 1000;

export function useStudyTimer({
  idleThresholdMs = DEFAULT_IDLE_THRESHOLD_MS,
  flushIntervalMs = DEFAULT_FLUSH_INTERVAL_MS,
  onAddSeconds,
}: UseStudyTimerOptions): void {
  const callbackRef = useRef(onAddSeconds);
  const pendingMsRef = useRef(0);
  const lastTickAtRef = useRef<number | null>(null);
  const lastActivityAtRef = useRef<number>(Date.now());
  const isVisibleRef = useRef<boolean>(typeof document === "undefined" ? true : !document.hidden);

  callbackRef.current = onAddSeconds;

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    let disposed = false;

    const isIdle = (nowMs: number): boolean =>
      nowMs - lastActivityAtRef.current >= idleThresholdMs;

    const flushPending = async (): Promise<void> => {
      const secondsDelta = Math.floor(pendingMsRef.current / 1000);
      if (secondsDelta <= 0) {
        return;
      }

      pendingMsRef.current -= secondsDelta * 1000;
      const dateISO = getLocalDateISO(new Date());

      try {
        await callbackRef.current(dateISO, secondsDelta);
      } catch {
        // Do not crash the page if persistence fails.
      }
    };

    const tick = (): void => {
      const nowMs = Date.now();
      const lastTickAt = lastTickAtRef.current ?? nowMs;
      const deltaMs = Math.max(0, nowMs - lastTickAt);
      lastTickAtRef.current = nowMs;

      if (!isVisibleRef.current) {
        return;
      }

      if (isIdle(nowMs)) {
        return;
      }

      pendingMsRef.current += deltaMs;
    };

    const onVisibilityChange = (): void => {
      isVisibleRef.current = !document.hidden;
      lastTickAtRef.current = Date.now();
    };

    const onActivity = (): void => {
      lastActivityAtRef.current = Date.now();
      if (isVisibleRef.current) {
        lastTickAtRef.current = Date.now();
      }
    };

    lastTickAtRef.current = Date.now();
    lastActivityAtRef.current = Date.now();
    isVisibleRef.current = !document.hidden;

    const tickIntervalId = window.setInterval(tick, TICK_MS);
    const flushIntervalId = window.setInterval(() => {
      void flushPending();
    }, flushIntervalMs);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("mousedown", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("touchstart", onActivity, { passive: true });
    window.addEventListener("scroll", onActivity, { passive: true });

    return () => {
      if (disposed) {
        return;
      }
      disposed = true;

      window.clearInterval(tickIntervalId);
      window.clearInterval(flushIntervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("mousedown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
      window.removeEventListener("scroll", onActivity);

      tick();
      void flushPending();
    };
  }, [flushIntervalMs, idleThresholdMs]);
}

export const studyTimerDefaults = {
  idleThresholdMs: DEFAULT_IDLE_THRESHOLD_MS,
  flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS,
} as const;
