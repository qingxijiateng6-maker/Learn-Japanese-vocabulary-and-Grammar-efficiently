import Link from "next/link";
import { loadA2VocabularySessions } from "@/content/loaders";
import { VocabularyFlashcardsClient } from "@/features/vocabulary/components/VocabularyFlashcardsClient";
import { StudySettingsPanel } from "@/shared/components/StudySettingsPanel";
import { StudyTimerMount } from "@/shared/components/StudyTimerMount";
import { PageScaffold } from "@/shared/components/PageScaffold";

type VocabularyFlashcardsPageProps = {
  params: {
    sessionNumber: string;
  };
};

export default async function VocabularyFlashcardsPage({
  params,
}: VocabularyFlashcardsPageProps) {
  const { sessionNumber } = params;
  const parsedSessionNumber = Number.parseInt(sessionNumber, 10);
  const { sessions, warnings } = await loadA2VocabularySessions();
  const session = sessions.find((item) => item.sessionNumber === parsedSessionNumber);

  return (
    <PageScaffold
      title={`Vocabulary A2 • Session ${sessionNumber} • Flashcards`}
      description="Study flashcards with grading, review filters, and automatic completion tracking."
    >
      <StudyTimerMount />
      <StudySettingsPanel />
      <section className="page-card">
        <p className="muted-note">
          {session
            ? `${session.items.length} cards loaded from local JSON content for this session.`
            : "Content preparing. Flashcard deck and progress tracking will be loaded from JSON later."}
        </p>
        {warnings.length > 0 ? <p className="muted-note">Warning: {warnings[0]}</p> : null}
        <div className="button-row">
          <Link className="button-link" href={`/vocabulary/a2/session/${sessionNumber}`}>
            Back to mode select
          </Link>
        </div>
      </section>
      {session ? (
        <VocabularyFlashcardsClient
          level={session.level}
          sessionNumber={session.sessionNumber}
          items={session.items}
        />
      ) : null}
    </PageScaffold>
  );
}
