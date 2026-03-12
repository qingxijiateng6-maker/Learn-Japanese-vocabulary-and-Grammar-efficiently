import Link from "next/link";
import { loadA2GrammarSessions } from "@/content/loaders";
import { GrammarSessionList } from "@/features/grammar/components/GrammarSessionList";
import { PageScaffold } from "@/shared/components/PageScaffold";

export default async function GrammarA2SessionsPage() {
  const { sessions, warnings } = await loadA2GrammarSessions();

  return (
    <PageScaffold className="page-main grammar-page grammar-page--overview" backdropVariant="grammar">
      <section className="page-card grammar-panel grammar-panel--hero">
        <p className="flashcard-label">Grammar Level</p>
        <h1 className="page-title">Grammar • A2</h1>
        <p className="page-subtitle">
          Start with the explanation page for each session, then move to 4-choice practice.
        </p>
      </section>
      <GrammarSessionList
        sessions={sessions.map((session) => ({
          sessionNumber: session.sessionNumber,
          sessionTitle: session.sessionTitle,
          topicCount: session.topics.length,
          questionCount: session.questions.length,
        }))}
        warning={warnings[0]}
      />
      <section className="page-card grammar-panel grammar-panel--support">
        <h2 className="page-title">Study flow</h2>
        <p className="muted-note">
          Open a session, read the explanation, then use practice to answer one question at a time
          with immediate feedback.
        </p>
        <p className="muted-note">Completion requires 80%+ (Best score) on Practice.</p>
        <div className="button-row">
          <Link className="button-link" href="/grammar">
            Back to level list
          </Link>
        </div>
      </section>
    </PageScaffold>
  );
}
