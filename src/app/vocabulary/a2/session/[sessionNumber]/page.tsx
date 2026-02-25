import Link from "next/link";
import { loadA2VocabularySessions } from "@/content/loaders";
import { PageScaffold } from "@/shared/components/PageScaffold";

type VocabularySessionModePageProps = {
  params: Promise<{
    sessionNumber: string;
  }>;
};

export default async function VocabularySessionModePage({
  params,
}: VocabularySessionModePageProps) {
  const { sessionNumber } = await params;
  const parsedSessionNumber = Number.parseInt(sessionNumber, 10);
  const { sessions, warnings } = await loadA2VocabularySessions();
  const session = sessions.find((item) => item.sessionNumber === parsedSessionNumber);

  return (
    <PageScaffold
      title={`Vocabulary A2 • Session ${sessionNumber}`}
      description="Choose a study mode for this vocabulary session."
    >
      <section className="page-card">
        <h2 className="page-title">Mode Select</h2>
        <p className="page-subtitle">
          {session
            ? `This session has ${session.items.length} vocabulary cards. Flashcards support grading and completion tracking.`
            : "Content preparing. This session is not available yet."}
        </p>
        <div className="button-row">
          <Link
            className="button-link button-link--primary"
            href={`/vocabulary/a2/session/${sessionNumber}/flashcards`}
          >
            Flashcards
          </Link>
          <Link className="button-link" href={`/vocabulary/a2/session/${sessionNumber}/quiz`}>
            Quiz
          </Link>
          <Link className="button-link" href="/vocabulary/a2">
            Back to A2 sessions
          </Link>
        </div>
        <p className="muted-note">
          Flashcards completion rule: view all cards once in All cards filter.
        </p>
        {warnings.length > 0 ? <p className="muted-note">Warning: {warnings[0]}</p> : null}
      </section>
    </PageScaffold>
  );
}
