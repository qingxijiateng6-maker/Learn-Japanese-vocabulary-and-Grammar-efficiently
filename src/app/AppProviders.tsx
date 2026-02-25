"use client";

import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { GoogleAuthProvider, useGoogleAuth } from "@/auth/googleAuth";
import { ProgressRepoProvider } from "@/repo/progressRepoContext";
import { StudySettingsProvider } from "@/shared/settings/studySettings";

const GUEST_PROGRESS_STORAGE_KEY = "japanese-learning-app.progress.v1.guest";

function sanitizeUserIdForStorage(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function AuthScopedProgressRepoProvider({ children }: PropsWithChildren) {
  const { user } = useGoogleAuth();
  const storageKey = user
    ? `japanese-learning-app.progress.v1.google.${sanitizeUserIdForStorage(user.id)}`
    : GUEST_PROGRESS_STORAGE_KEY;
  const localOptions = useMemo(() => ({ storageKey }), [storageKey]);

  return (
    <ProgressRepoProvider key={storageKey} localOptions={localOptions}>
      {children}
    </ProgressRepoProvider>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GoogleAuthProvider>
      <AuthScopedProgressRepoProvider>
        <StudySettingsProvider>{children}</StudySettingsProvider>
      </AuthScopedProgressRepoProvider>
    </GoogleAuthProvider>
  );
}
