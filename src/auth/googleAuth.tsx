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

type GoogleSignInButtonProps = {
  className?: string;
  label?: string;
  loadingLabel?: string;
  signingInLabel?: string;
  fallbackLabel?: string;
};

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

function withOptionalClassName(baseClassName: string, className?: string): string {
  return className ? `${baseClassName} ${className}` : baseClassName;
}

export function GoogleSignInButton({
  className,
  label = "Sign in with Google",
  loadingLabel = "Checking session...",
  signingInLabel = "Signing in...",
  fallbackLabel = "Set Firebase env vars",
}: GoogleSignInButtonProps = {}) {
  const { isConfigured, isLoading, isSigningIn, signIn } = useGoogleAuth();

  if (!isConfigured) {
    return (
      <span className={withOptionalClassName("google-signin-fallback", className)}>
        {fallbackLabel}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={withOptionalClassName("google-signin-button", className)}
      onClick={() => {
        void signIn();
      }}
      disabled={isLoading || isSigningIn}
    >
      {isLoading ? loadingLabel : isSigningIn ? signingInLabel : label}
    </button>
  );
}
