import Link from "next/link";
import { loadA2GrammarSessions } from "@/content/loaders";
import { GrammarPracticeClient } from "@/features/grammar/components/GrammarPracticeClient";
import { StudySettingsPanel } from "@/shared/components/StudySettingsPanel";
import { StudyTimerMount } from "@/shared/components/StudyTimerMount";
import { PageScaffold } from "@/shared/components/PageScaffold";

type GrammarPracticePageProps = {
  params: Promise<{
    sessionNumber: string;
  }>;
};

export default async function GrammarPracticePage({ params }: GrammarPracticePageProps) {
  const { sessionNumber } = await params;
  const parsedSessionNumber = Number.parseInt(sessionNumber, 10);
  const { sessions, warnings } = await loadA2GrammarSessions();
  const session = sessions.find((item) => item.sessionNumber === parsedSessionNumber);
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
          Answer one four-choice question at a time. Feedback appears immediately after you tap an
          answer.
        </p>
        <div className="grammar-session-hero__meta">
          <span>{questionCount} practice question{questionCount === 1 ? "" : "s"}</span>
          <span>Best score decides completion</span>
        </div>
      </section>
      <StudySettingsPanel />
      <section className="page-card">
        <p className="muted-note">
          {session
            ? `${questionCount} question${questionCount === 1 ? "" : "s"} loaded for this session. Completion requires 80%+ (Best score).`
            : "Content preparing. Practice questions and score tracking are not connected yet."}
        </p>
        {warnings.length > 0 ? <p className="muted-note">Warning: {warnings[0]}</p> : null}
        <div className="button-row">
          <Link className="button-link" href={`/grammar/a2/session/${sessionNumber}`}>
            Back to explanation
          </Link>
        </div>
      </section>
      {session ? (
        <GrammarPracticeClient
          level={session.level}
          sessionNumber={session.sessionNumber}
          questions={session.questions}
        />
      ) : null}
    </PageScaffold>
  );
}
