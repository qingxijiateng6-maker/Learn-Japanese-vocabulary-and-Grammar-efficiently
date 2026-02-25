import Link from "next/link";
import { loadA2GrammarSessions } from "@/content/loaders";
import { StudySettingsPanel } from "@/shared/components/StudySettingsPanel";
import { StudyTimerMount } from "@/shared/components/StudyTimerMount";
import { PageScaffold } from "@/shared/components/PageScaffold";

type GrammarSessionPageProps = {
  params: {
    sessionNumber: string;
  };
};

function renderMarkdownText(markdown: string) {
  const parts = markdown.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}:${index}`}>{part.slice(2, -2)}</strong>;
    }
    return <span key={`${part}:${index}`}>{part}</span>;
  });
}

export default async function GrammarSessionPage({ params }: GrammarSessionPageProps) {
  const { sessionNumber } = params;
  const parsedSessionNumber = Number.parseInt(sessionNumber, 10);
  const { sessions, warnings } = await loadA2GrammarSessions();
  const session = sessions.find((item) => item.sessionNumber === parsedSessionNumber);
  const topicCount = session?.items.length ?? 0;
  const questionCount =
    session?.items.reduce((count, item) => count + item.questions.length, 0) ?? 0;

  return (
    <PageScaffold
      title={`Grammar A2 • Session ${sessionNumber}`}
      description="Explanation placeholder page with a next step to practice. Safe to render with no content data."
      actions={[
        {
          href: `/grammar/a2/session/${sessionNumber}/practice`,
          label: "Go to Practice",
          primary: true,
        },
      ]}
    >
      <StudyTimerMount />
      <StudySettingsPanel />
      <section className="page-card">
        <h2 className="page-title">Explanation (Placeholder)</h2>
        <p className="page-subtitle">
          {session
            ? `Loaded ${topicCount} grammar topic${topicCount === 1 ? "" : "s"} with ${questionCount} total practice question${questionCount === 1 ? "" : "s"}.`
            : "Content preparing. Grammar explanation text/examples will be loaded from JSON later."}
        </p>
        {session ? (
          <div className="topic-stack">
            {session.items.map((topic) => (
              <article key={topic.id} className="topic-card">
                <h3 className="topic-card__title">{topic.titleEN}</h3>
                <p className="topic-card__markdown">{renderMarkdownText(topic.explanationMarkdownEN)}</p>
                <div className="topic-card__examples">
                  {topic.examples.map((example, index) => (
                    <div key={`${topic.id}:ex:${index}`} className="topic-card__example">
                      <p className="flashcard-example">
                        <strong>JP:</strong> {example.jp}
                      </p>
                      <p className="flashcard-example">
                        <strong>EN:</strong> {example.en}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : null}
        <p className="muted-note">Completion requires 80%+ (Best score) on Practice.</p>
        <div className="button-row">
          <Link
            className="button-link button-link--primary"
            href={`/grammar/a2/session/${sessionNumber}/practice`}
          >
            Go to Practice
          </Link>
        </div>
        {warnings.length > 0 ? <p className="muted-note">Warning: {warnings[0]}</p> : null}
      </section>
    </PageScaffold>
  );
}
