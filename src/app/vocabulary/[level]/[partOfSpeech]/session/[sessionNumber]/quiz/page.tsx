import Link from "next/link";
import { notFound } from "next/navigation";
import { getVocabularySessionStaticParams } from "@/content/staticParams";
import {
  getVocabularyPartOfSpeechLabel,
  getVocabularySessionHref,
  normalizeVocabularyPartOfSpeechParam,
} from "@/domain/vocabulary/meta";
import { VocabularyQuizClient } from "@/features/vocabulary/components/VocabularyQuizClient";
import {
  findVocabularySession,
  loadVocabularyRouteData,
} from "@/features/vocabulary/vocabularyRouteData";
import { StudyTimerMount } from "@/shared/components/StudyTimerMount";
import { PageScaffold } from "@/shared/components/PageScaffold";

type VocabularyQuizPageProps = {
  params: Promise<{
    level: string;
    partOfSpeech: string;
    sessionNumber: string;
  }>;
};

export async function generateStaticParams() {
  return getVocabularySessionStaticParams();
}

export default async function VocabularyQuizPage({
  params,
}: VocabularyQuizPageProps) {
  const {
    level: levelParam,
    partOfSpeech: partOfSpeechParam,
    sessionNumber,
  } = await params;
  const routeData = await loadVocabularyRouteData(levelParam);
  const partOfSpeech = normalizeVocabularyPartOfSpeechParam(partOfSpeechParam);
  const parsedSessionNumber = Number.parseInt(sessionNumber, 10);

  if (!routeData || !partOfSpeech || Number.isNaN(parsedSessionNumber) || parsedSessionNumber < 1) {
    notFound();
  }

  const label = getVocabularyPartOfSpeechLabel(partOfSpeech);
  const session = findVocabularySession(
    routeData.sessions,
    partOfSpeech,
    parsedSessionNumber,
  );
  const levelItems = routeData.sessions.flatMap((entry) => entry.items);

  return (
    <PageScaffold
      className="page-main"
      title={`Vocabulary • ${routeData.level} • ${label} • Session ${sessionNumber} • Quiz`}
      description="Multiple-choice quiz using curated prompts when available, with hidden target words."
    >
      <StudyTimerMount />
      <section className="page-card">
        <p className="muted-note">
          {session
            ? `Quiz uses ${session.items.length} session cards and distractors from the same ${routeData.level} level.`
            : "Content preparing. Quiz questions and scoring UI will be added in a later task."}
        </p>
        {routeData.warnings.length > 0 ? (
          <p className="muted-note">Warning: {routeData.warnings[0]}</p>
        ) : null}
        <div className="button-row">
          <Link
            className="button-link"
            href={getVocabularySessionHref(routeData.level, partOfSpeech, parsedSessionNumber)}
          >
            Back to mode select
          </Link>
        </div>
      </section>
      {session ? (
        <VocabularyQuizClient
          level={session.level}
          partOfSpeech={session.partOfSpeech}
          sessionNumber={session.sessionNumber}
          sessionItems={session.items}
          levelItems={levelItems}
        />
      ) : null}
    </PageScaffold>
  );
}
