import Link from "next/link";
import { loadA2GrammarSessions } from "@/content/loaders";
import { GrammarMarkdown } from "@/features/grammar/components/GrammarMarkdown";
import { StudyTimerMount } from "@/shared/components/StudyTimerMount";
import { PageScaffold } from "@/shared/components/PageScaffold";

type GrammarSessionPageProps = {
  params: Promise<{
    sessionNumber: string;
  }>;
};

export default async function GrammarSessionPage({ params }: GrammarSessionPageProps) {
  const { sessionNumber } = await params;
  const parsedSessionNumber = Number.parseInt(sessionNumber, 10);
  const { sessions, warnings } = await loadA2GrammarSessions();
  const session = sessions.find((item) => item.sessionNumber === parsedSessionNumber);
  const topicCount = session?.topics.length ?? 0;
  const questionCount = session?.questions.length ?? 0;

  return (
    <PageScaffold className="page-main">
      <StudyTimerMount />
      <section className="page-card grammar-session-hero">
        <p className="flashcard-label">Grammar • A2 • Session {sessionNumber}</p>
        <h1 className="grammar-session-hero__title">
          {session?.sessionTitle ?? `session${sessionNumber}`}
        </h1>
        <p className="page-subtitle">
          {session
            ? `Read the explanation first, then move to practice with ${questionCount} four-choice question${questionCount === 1 ? "" : "s"}.`
            : "Content preparing. The explanation page is ready to receive formatted lesson material."}
        </p>
        <div className="grammar-session-hero__meta">
          <span>{topicCount} topic{topicCount === 1 ? "" : "s"}</span>
          <span>{questionCount} practice question{questionCount === 1 ? "" : "s"}</span>
        </div>
      </section>
      <section className="page-card">
        <div className="stack-row">
          <h2 className="page-title">Explanation</h2>
          <span className="muted-note">Read before practice</span>
        </div>
        {session ? (
          <div className="grammar-doc">
            {session.topics.map((topic, topicIndex) => (
              <article key={topic.id} className="grammar-doc__section">
                <div className="grammar-doc__header">
                  <p className="grammar-doc__index">Topic {topicIndex + 1}</p>
                  <h3 className="grammar-doc__title">{topic.title}</h3>
                </div>
                <GrammarMarkdown markdown={topic.explanationMarkdown} />
                <div className="grammar-example-grid">
                  {topic.examples.map((example, index) => (
                    <section key={`${topic.id}:ex:${index}`} className="grammar-example-card">
                      <p className="flashcard-label">Example {index + 1}</p>
                      <p className="grammar-example-card__jp">{example.jp}</p>
                      <p className="grammar-example-card__en">{example.en}</p>
                    </section>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="page-subtitle">
            Content preparing. Grammar explanation text and examples will appear here.
          </p>
        )}
        <p className="muted-note">Completion requires 80%+ (Best score) on Practice.</p>
        <div className="button-row">
          {session ? (
            <Link
              className="button-link button-link--primary"
              href={`/grammar/a2/session/${sessionNumber}/practice`}
            >
              To Practice
            </Link>
          ) : null}
          <Link className="button-link" href="/grammar/a2">
            Back to sessions
          </Link>
        </div>
        {warnings.length > 0 ? <p className="muted-note">Warning: {warnings[0]}</p> : null}
      </section>
    </PageScaffold>
  );
}
