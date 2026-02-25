import Link from "next/link";
import { loadA2GrammarSessions } from "@/content/loaders";
import { GrammarSessionList } from "@/features/grammar/components/GrammarSessionList";
import { PageScaffold } from "@/shared/components/PageScaffold";

export default async function GrammarA2SessionsPage() {
  const { sessions, warnings } = await loadA2GrammarSessions();

  return (
    <PageScaffold
      title="Grammar • A2"
      description="Session list placeholder for A2 grammar. Real explanations and practice items will be loaded from JSON."
    >
      <GrammarSessionList
        sessions={sessions.map((session) => ({
          sessionNumber: session.sessionNumber,
          topicCount: session.items.length,
          questionCount: session.items.reduce((count, item) => count + item.questions.length, 0),
        }))}
        warning={warnings[0]}
      />
      <section className="page-card">
        <h2 className="page-title">Rule</h2>
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
