import Link from "next/link";
import { loadA2VocabularySessions } from "@/content/loaders";
import { VocabularyQuizClient } from "@/features/vocabulary/components/VocabularyQuizClient";
import { StudySettingsPanel } from "@/shared/components/StudySettingsPanel";
import { StudyTimerMount } from "@/shared/components/StudyTimerMount";
import { PageScaffold } from "@/shared/components/PageScaffold";

type VocabularyQuizPageProps = {
  params: {
    sessionNumber: string;
  };
};

export default async function VocabularyQuizPage({ params }: VocabularyQuizPageProps) {
  const { sessionNumber } = params;
  const parsedSessionNumber = Number.parseInt(sessionNumber, 10);
  const { sessions, warnings } = await loadA2VocabularySessions();
  const session = sessions.find((item) => item.sessionNumber === parsedSessionNumber);
  const levelItems = sessions.flatMap((item) => item.items);

  return (
    <PageScaffold
      title={`Vocabulary A2 • Session ${sessionNumber} • Quiz`}
      description="Multiple-choice quiz using example sentences with the target word hidden."
    >
      <StudyTimerMount />
      <StudySettingsPanel />
      <section className="page-card">
        <p className="muted-note">
          {session
            ? `Quiz uses ${session.items.length} session cards and distractors from the same A2 level.`
            : "Content preparing. Quiz questions and scoring UI will be added in a later task."}
        </p>
        {warnings.length > 0 ? <p className="muted-note">Warning: {warnings[0]}</p> : null}
        <div className="button-row">
          <Link className="button-link" href={`/vocabulary/a2/session/${sessionNumber}`}>
            Back to mode select
          </Link>
        </div>
      </section>
      {session ? (
        <VocabularyQuizClient
          level={session.level}
          sessionNumber={session.sessionNumber}
          sessionItems={session.items}
          levelItems={levelItems}
        />
      ) : null}
    </PageScaffold>
  );
}
