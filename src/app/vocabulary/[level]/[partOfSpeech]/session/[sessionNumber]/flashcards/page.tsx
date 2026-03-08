import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getVocabularyPartOfSpeechLabel,
  getVocabularySessionHref,
  normalizeVocabularyPartOfSpeechParam,
} from "@/domain/vocabulary/meta";
import { VocabularyFlashcardsClient } from "@/features/vocabulary/components/VocabularyFlashcardsClient";
import {
  findVocabularySession,
  loadVocabularyRouteData,
} from "@/features/vocabulary/vocabularyRouteData";
import { StudySettingsPanel } from "@/shared/components/StudySettingsPanel";
import { StudyTimerMount } from "@/shared/components/StudyTimerMount";
import { PageScaffold } from "@/shared/components/PageScaffold";

type VocabularyFlashcardsPageProps = {
  params: Promise<{
    level: string;
    partOfSpeech: string;
    sessionNumber: string;
  }>;
};

export default async function VocabularyFlashcardsPage({
  params,
}: VocabularyFlashcardsPageProps) {
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

  return (
    <PageScaffold
      className="page-main"
      title={`Vocabulary • ${routeData.level} • ${label} • Session ${sessionNumber} • Flashcards`}
      description="Study flashcards with grading, review filters, and automatic completion tracking."
    >
      <StudyTimerMount />
      <StudySettingsPanel />
      <section className="page-card">
        <p className="muted-note">
          {session
            ? `${session.items.length} cards loaded from local JSON content for this session.`
            : "Content preparing. Flashcard deck and progress tracking will be loaded from JSON later."}
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
        <VocabularyFlashcardsClient
          level={session.level}
          partOfSpeech={session.partOfSpeech}
          sessionNumber={session.sessionNumber}
          items={session.items}
        />
      ) : null}
    </PageScaffold>
  );
}
