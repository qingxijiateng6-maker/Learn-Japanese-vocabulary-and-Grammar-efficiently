"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getFirebaseClient } from "@/auth/firebaseClient";

type GoogleAuthUser = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

type GoogleAuthContextValue = {
  user: GoogleAuthUser | null;
  isConfigured: boolean;
  isLoading: boolean;
  isSigningIn: boolean;
  configError: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
};
const GoogleAuthContext = createContext<GoogleAuthContextValue | null>(null);

function mapFirebaseUser(user: User): GoogleAuthUser {
  return {
    id: user.uid,
    email: user.email ?? "",
    name: user.displayName ?? "Google User",
    ...(user.photoURL ? { picture: user.photoURL } : {}),
  };
}

function toFriendlyAuthError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Google sign-in failed.";
  }

  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  if (code === "auth/popup-closed-by-user") {
    return "Google sign-in was canceled.";
  }
  if (code === "auth/popup-blocked") {
    return "Popup was blocked. Allow popups and try again.";
  }
  if (code === "auth/unauthorized-domain") {
    return "This domain is not authorized in Firebase Authentication settings.";
  }
  if (code === "auth/operation-not-allowed") {
    return "Google provider is not enabled in Firebase Authentication.";
  }
  return "Google sign-in failed. Check Firebase settings and try again.";
}

export function GoogleAuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<GoogleAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const firebaseClient = useMemo(() => getFirebaseClient(), []);

  useEffect(() => {
    if (!firebaseClient.ok) {
      setConfigError(firebaseClient.error);
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseClient.bundle.auth, (nextUser) => {
      setUser(nextUser ? mapFirebaseUser(nextUser) : null);
      setConfigError(null);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [firebaseClient]);

  const value = useMemo<GoogleAuthContextValue>(
    () => ({
      user,
      isConfigured: firebaseClient.ok,
      isLoading,
      isSigningIn,
      configError,
      signIn: async () => {
        if (!firebaseClient.ok) {
          setConfigError(firebaseClient.error);
          return;
        }

        setIsSigningIn(true);
        setConfigError(null);
        try {
          await signInWithPopup(firebaseClient.bundle.auth, firebaseClient.bundle.googleProvider);
        } catch (error) {
          setConfigError(toFriendlyAuthError(error));
        } finally {
          setIsSigningIn(false);
        }
      },
      signOut: () => {
        if (!firebaseClient.ok) {
          setUser(null);
          return;
        }
        void firebaseSignOut(firebaseClient.bundle.auth).catch(() => {
          setConfigError("Failed to sign out cleanly. Please refresh and try again.");
        });
      },
    }),
    [configError, firebaseClient, isLoading, isSigningIn, user],
  );

  return <GoogleAuthContext.Provider value={value}>{children}</GoogleAuthContext.Provider>;
}

export function useGoogleAuth(): GoogleAuthContextValue {
  const value = useContext(GoogleAuthContext);
  if (!value) {
    throw new Error("useGoogleAuth must be used within a GoogleAuthProvider");
  }
  return value;
}

export function GoogleSignInButton() {
  const { isConfigured, isLoading, isSigningIn, signIn } = useGoogleAuth();

  if (!isConfigured) {
    return <span className="google-signin-fallback">Set Firebase env vars</span>;
  }

  return (
    <button
      type="button"
      className="google-signin-button"
      onClick={() => {
        void signIn();
      }}
      disabled={isLoading || isSigningIn}
    >
      {isLoading ? "Checking session..." : isSigningIn ? "Signing in..." : "Sign in with Google"}
    </button>
  );
}
