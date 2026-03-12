import type { ReactNode } from "react";

type VocabularyLayoutProps = {
  children: ReactNode;
};

export default function VocabularyLayout({ children }: VocabularyLayoutProps) {
  return <div className="vocabulary-shell">{children}</div>;
}
