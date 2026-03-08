import Link from "next/link";
import { notFound } from "next/navigation";
import {
  VOCABULARY_PARTS_OF_SPEECH,
  getVocabularyPartOfSpeechHref,
  getVocabularyPartOfSpeechLabel,
} from "@/domain/vocabulary/meta";
import { loadVocabularyRouteData } from "@/features/vocabulary/vocabularyRouteData";
import { PageScaffold } from "@/shared/components/PageScaffold";

type VocabularyPartOfSpeechPageProps = {
  params: Promise<{
    level: string;
  }>;
};

export default async function VocabularyLevelPage({
  params,
}: VocabularyPartOfSpeechPageProps) {
  const { level: levelParam } = await params;
  const routeData = await loadVocabularyRouteData(levelParam);

  if (!routeData) {
    notFound();
  }

  const { level, levelGroup, warnings } = routeData;

  return (
    <PageScaffold
      className="page-main"
      title={`Vocabulary • ${level}`}
      description="Choose a part of speech."
    >
      <section className="page-card">
        <h2 className="page-title">Parts of speech</h2>
        <p className="page-subtitle">
          Select a category to browse vocabulary sessions for this level.
        </p>
        <div className="selection-grid">
          {VOCABULARY_PARTS_OF_SPEECH.map((partOfSpeech) => {
            const group =
              levelGroup?.partsOfSpeech.find((entry) => entry.partOfSpeech === partOfSpeech) ?? null;
            const label = getVocabularyPartOfSpeechLabel(partOfSpeech);

            if (!group) {
              return (
                <div
                  key={partOfSpeech}
                  className="selection-card selection-card--disabled"
                  aria-disabled="true"
                >
                  <p className="selection-card__eyebrow">Part of speech</p>
                  <h3 className="selection-card__title">{label}</h3>
                  <p className="selection-card__description">Coming soon</p>
                  <p className="selection-card__meta">No sessions yet</p>
                </div>
              );
            }

            return (
              <Link
                key={partOfSpeech}
                className="selection-card selection-card--interactive"
                href={getVocabularyPartOfSpeechHref(level, partOfSpeech)}
              >
                <p className="selection-card__eyebrow">Part of speech</p>
                <h3 className="selection-card__title">{label}</h3>
                <p className="selection-card__description">
                  {group.sessions.length} session{group.sessions.length === 1 ? "" : "s"} available
                </p>
                <p className="selection-card__meta">{group.totalItemCount} items</p>
              </Link>
            );
          })}
        </div>
        {warnings.length > 0 ? <p className="muted-note">Warning: {warnings[0]}</p> : null}
        <div className="button-row">
          <Link className="button-link" href="/vocabulary">
            Back to level list
          </Link>
        </div>
      </section>
    </PageScaffold>
  );
}
