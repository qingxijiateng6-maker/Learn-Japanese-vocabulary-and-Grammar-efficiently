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

const firebaseEnv = {
  apiKey: (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "").trim(),
  authDomain: (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "").trim(),
  projectId: (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "").trim(),
  appId: (process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "").trim(),
  storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "").trim(),
  messagingSenderId: (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "").trim(),
  measurementId: (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "").trim(),
};

function buildFirebaseConfig():
  | { ok: true; config: FirebaseOptions }
  | { ok: false; error: string } {
  const { apiKey, authDomain, projectId, appId } = firebaseEnv;

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
      storageBucket: firebaseEnv.storageBucket || undefined,
      messagingSenderId: firebaseEnv.messagingSenderId || undefined,
      measurementId: firebaseEnv.measurementId || undefined,
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
