"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GoogleSignInButton, useGoogleAuth } from "@/auth/googleAuth";

export function SiteHeader() {
  const { user, signOut, isConfigured, configError } = useGoogleAuth();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isSignedOutHome = isHome && !user;
  const shouldShowHeaderAuth = Boolean(user) || !isSignedOutHome;

  return (
    <header className={`site-header${isHome ? " site-header--home" : ""}`}>
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand">
          Japanese Learning App
        </Link>
        {shouldShowHeaderAuth ? (
          <div className="auth-controls" aria-label="Authentication">
            {user ? (
              <>
                <div className="auth-user">
                  {user.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.picture}
                      alt=""
                      className="auth-user__avatar"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="auth-user__avatar auth-user__avatar--fallback" aria-hidden="true">
                      {user.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="auth-user__text">
                    <span className="auth-user__name">{user.name}</span>
                    <span className="auth-user__email">{user.email}</span>
                  </div>
                </div>
                <button type="button" className="site-nav__link" onClick={signOut}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <GoogleSignInButton />
                {configError ? (
                  <span className="auth-config-hint" title={configError}>
                    {isConfigured
                      ? `Google login error: ${configError}`
                      : `Google login not configured: ${configError}`}
                  </span>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}
