import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ProgressRepoProvider } from "@/repo/progressRepoContext";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { StudySettingsProvider } from "@/shared/settings/studySettings";

export const metadata: Metadata = {
  title: "Japanese Learning App",
  description: "MVP route skeleton for Japanese learning",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <ProgressRepoProvider>
          <StudySettingsProvider>
            <div className="app-shell">
              <SiteHeader />
              {children}
            </div>
          </StudySettingsProvider>
        </ProgressRepoProvider>
      </body>
    </html>
  );
}
