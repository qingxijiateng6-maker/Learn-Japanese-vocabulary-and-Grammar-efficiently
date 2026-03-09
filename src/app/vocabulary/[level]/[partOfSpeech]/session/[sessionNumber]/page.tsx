import Link from "next/link";
import { notFound } from "next/navigation";
import { getVocabularySessionStaticParams } from "@/content/staticParams";
import {
  getVocabularyFlashcardsHref,
  getVocabularyPartOfSpeechHref,
  getVocabularyPartOfSpeechLabel,
  getVocabularyQuizHref,
  normalizeVocabularyPartOfSpeechParam,
} from "@/domain/vocabulary/meta";
import {
  findVocabularySession,
  loadVocabularyRouteData,
} from "@/features/vocabulary/vocabularyRouteData";
import { PageScaffold } from "@/shared/components/PageScaffold";

type VocabularySessionModePageProps = {
  params: Promise<{
    level: string;
    partOfSpeech: string;
    sessionNumber: string;
  }>;
};

export async function generateStaticParams() {
  return getVocabularySessionStaticParams();
}

export default async function VocabularySessionModePage({
  params,
}: VocabularySessionModePageProps) {
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
      title={`Vocabulary • ${routeData.level} • ${label} • Session ${sessionNumber}`}
      description="Choose a study mode for this vocabulary session."
    >
      <section className="page-card">
        <h2 className="page-title">Mode Select</h2>
        <p className="page-subtitle">
          {session
            ? `This session has ${session.items.length} vocabulary cards. Flashcards support grading and completion tracking.`
            : "Content preparing. This session is not available yet."}
        </p>
        <div className="button-row">
          {session ? (
            <>
              <Link
                className="button-link button-link--primary"
                href={getVocabularyFlashcardsHref(routeData.level, partOfSpeech, parsedSessionNumber)}
              >
                Flashcards
              </Link>
              <Link
                className="button-link"
                href={getVocabularyQuizHref(routeData.level, partOfSpeech, parsedSessionNumber)}
              >
                Quiz
              </Link>
            </>
          ) : null}
          <Link
            className="button-link"
            href={getVocabularyPartOfSpeechHref(routeData.level, partOfSpeech)}
          >
            Back to {label} sessions
          </Link>
        </div>
        <p className="muted-note">
          Flashcards completion rule: view all cards once in All cards filter.
        </p>
        {routeData.warnings.length > 0 ? (
          <p className="muted-note">Warning: {routeData.warnings[0]}</p>
        ) : null}
      </section>
    </PageScaffold>
  );
}
