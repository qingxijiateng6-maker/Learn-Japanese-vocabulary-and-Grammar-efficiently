"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type StudyDisplaySettings = {
  furiganaEnabled: boolean;
  showEnglishMeaning: boolean;
};

type StudySettingsContextValue = {
  settings: StudyDisplaySettings;
  setFuriganaEnabled: (enabled: boolean) => void;
  setShowEnglishMeaning: (enabled: boolean) => void;
};

const STORAGE_KEY = "japanese-learning-app.study-settings.v1";

const defaultSettings: StudyDisplaySettings = {
  furiganaEnabled: true,
  showEnglishMeaning: true,
};

const StudySettingsContext = createContext<StudySettingsContextValue | null>(null);

function readStoredSettings(): StudyDisplaySettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultSettings;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) {
      return defaultSettings;
    }

    const record = parsed as Record<string, unknown>;
    return {
      furiganaEnabled:
        typeof record.furiganaEnabled === "boolean"
          ? record.furiganaEnabled
          : defaultSettings.furiganaEnabled,
      showEnglishMeaning:
        typeof record.showEnglishMeaning === "boolean"
          ? record.showEnglishMeaning
          : defaultSettings.showEnglishMeaning,
    };
  } catch {
    return defaultSettings;
  }
}

function writeStoredSettings(settings: StudyDisplaySettings): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage failures; UI should continue working with in-memory state.
  }
}

export function StudySettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<StudyDisplaySettings>(defaultSettings);

  useEffect(() => {
    setSettings(readStoredSettings());
  }, []);

  useEffect(() => {
    writeStoredSettings(settings);
  }, [settings]);

  const value = useMemo<StudySettingsContextValue>(
    () => ({
      settings,
      setFuriganaEnabled: (enabled) =>
        setSettings((previous) => ({ ...previous, furiganaEnabled: enabled })),
      setShowEnglishMeaning: (enabled) =>
        setSettings((previous) => ({ ...previous, showEnglishMeaning: enabled })),
    }),
    [settings],
  );

  return <StudySettingsContext.Provider value={value}>{children}</StudySettingsContext.Provider>;
}

export function useStudySettings(): StudySettingsContextValue {
  const value = useContext(StudySettingsContext);
  if (!value) {
    throw new Error("useStudySettings must be used within StudySettingsProvider");
  }
  return value;
}
