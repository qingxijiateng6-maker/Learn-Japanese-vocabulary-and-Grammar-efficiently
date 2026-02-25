"use client";

import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

type FirebaseClientBundle = {
  app: FirebaseApp;
  auth: Auth;
  googleProvider: GoogleAuthProvider;
};

type FirebaseClientResult =
  | { ok: true; bundle: FirebaseClientBundle }
  | { ok: false; error: string };

let cachedBundle: FirebaseClientBundle | null = null;

function readEnv(name: string): string {
  return (process.env[name] ?? "").trim();
}

function buildFirebaseConfig():
  | { ok: true; config: FirebaseOptions }
  | { ok: false; error: string } {
  const apiKey = readEnv("NEXT_PUBLIC_FIREBASE_API_KEY");
  const authDomain = readEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  const projectId = readEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  const appId = readEnv("NEXT_PUBLIC_FIREBASE_APP_ID");

  const missing = [
    !apiKey ? "NEXT_PUBLIC_FIREBASE_API_KEY" : null,
    !authDomain ? "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" : null,
    !projectId ? "NEXT_PUBLIC_FIREBASE_PROJECT_ID" : null,
    !appId ? "NEXT_PUBLIC_FIREBASE_APP_ID" : null,
  ].filter((value): value is string => Boolean(value));

  if (missing.length > 0) {
    return {
      ok: false,
      error: `Missing Firebase env vars: ${missing.join(", ")}`,
    };
  }

  return {
    ok: true,
    config: {
      apiKey,
      authDomain,
      projectId,
      appId,
      storageBucket: readEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET") || undefined,
      messagingSenderId: readEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID") || undefined,
      measurementId: readEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID") || undefined,
    },
  };
}

export function getFirebaseClient(): FirebaseClientResult {
  if (cachedBundle) {
    return { ok: true, bundle: cachedBundle };
  }

  const configResult = buildFirebaseConfig();
  if (!configResult.ok) {
    return configResult;
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(configResult.config);
  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });

  cachedBundle = { app, auth, googleProvider };
  return { ok: true, bundle: cachedBundle };
}
