import Link from "next/link";
import { loadA2VocabularySessions } from "@/content/loaders";
import { VocabularySessionList } from "@/features/vocabulary/components/VocabularySessionList";
import { PageScaffold } from "@/shared/components/PageScaffold";

export default async function VocabularyA2SessionsPage() {
  const { sessions, warnings } = await loadA2VocabularySessions();

  return (
    <PageScaffold
      title="Vocabulary • A2"
      description="Session list placeholder for A2 vocabulary. Real session metadata will come from JSON content."
    >
      <VocabularySessionList
        sessions={sessions.map((session) => ({
          sessionNumber: session.sessionNumber,
          itemCount: session.items.length,
        }))}
        warning={warnings[0]}
      />
      <section className="page-card">
        <h2 className="page-title">Modes</h2>
        <p className="muted-note">
          Use each session page to choose Flashcards or Quiz. Flashcards completion is tracked on
          the learning screen.
        </p>
        <div className="button-row">
          <Link className="button-link" href="/vocabulary">
            Back to level list
          </Link>
        </div>
      </section>
    </PageScaffold>
  );
}
