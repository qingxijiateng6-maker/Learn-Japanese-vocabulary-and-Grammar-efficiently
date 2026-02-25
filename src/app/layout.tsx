import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProviders } from "@/app/AppProviders";
import { SiteHeader } from "@/shared/components/SiteHeader";

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
        <AppProviders>
          <div className="app-shell">
            <SiteHeader />
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
