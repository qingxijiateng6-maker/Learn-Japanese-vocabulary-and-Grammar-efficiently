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
  const questionCount =
    session?.items.reduce((count, item) => count + item.questions.length, 0) ?? 0;

  return (
    <PageScaffold
      title={`Grammar A2 • Session ${sessionNumber} • Practice`}
      description="Answer 4-choice questions, review explanations immediately, and improve your best score."
    >
      <StudyTimerMount />
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
          items={session.items}
        />
      ) : null}
    </PageScaffold>
  );
}
