import Link from "next/link";
import { notFound } from "next/navigation";
import { getVocabularyPartOfSpeechStaticParams } from "@/content/staticParams";
import {
  getVocabularyPartOfSpeechLabel,
  normalizeVocabularyPartOfSpeechParam,
} from "@/domain/vocabulary/meta";
import { VocabularySessionList } from "@/features/vocabulary/components/VocabularySessionList";
import { loadVocabularyRouteData } from "@/features/vocabulary/vocabularyRouteData";
import { PageScaffold } from "@/shared/components/PageScaffold";

type VocabularySessionsPageProps = {
  params: Promise<{
    level: string;
    partOfSpeech: string;
  }>;
};

export async function generateStaticParams() {
  return getVocabularyPartOfSpeechStaticParams();
}

export default async function VocabularySessionsPage({
  params,
}: VocabularySessionsPageProps) {
  const { level: levelParam, partOfSpeech: partOfSpeechParam } = await params;
  const routeData = await loadVocabularyRouteData(levelParam);
  const partOfSpeech = normalizeVocabularyPartOfSpeechParam(partOfSpeechParam);

  if (!routeData || !partOfSpeech) {
    notFound();
  }

  const group =
    routeData.levelGroup?.partsOfSpeech.find((entry) => entry.partOfSpeech === partOfSpeech) ?? null;
  const label = getVocabularyPartOfSpeechLabel(partOfSpeech);

  return (
    <PageScaffold
      className="page-main"
      title={`Vocabulary • ${routeData.level} • ${label}`}
      description="Choose a session for this part of speech."
    >
      <VocabularySessionList
        level={routeData.level}
        partOfSpeech={partOfSpeech}
        sessions={(group?.sessions ?? []).map((session) => ({
          sessionNumber: session.sessionNumber,
          itemCount: session.items.length,
          sessionKey: session.sessionKey,
        }))}
        warning={routeData.warnings[0]}
      />
      <section className="page-card">
        <h2 className="page-title">Modes</h2>
        <p className="muted-note">
          Use each session page to choose Flashcards or Quiz. Flashcards completion is tracked per
          part of speech session.
        </p>
        <div className="button-row">
          <Link className="button-link" href={`/vocabulary/${routeData.level.toLowerCase()}`}>
            Back to parts of speech
          </Link>
        </div>
      </section>
    </PageScaffold>
  );
}
