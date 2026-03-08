import Link from "next/link";
import { loadA2VocabularyLevelGroup } from "@/content/loaders";
import {
  VOCABULARY_LEVELS,
  getVocabularyLevelHref,
} from "@/domain/vocabulary/meta";
import { PageScaffold } from "@/shared/components/PageScaffold";

export default async function VocabularyLevelsPage() {
  const { level, warnings } = await loadA2VocabularyLevelGroup();
  const a2SessionCount = level?.totalSessionCount ?? 0;
  const a2ItemCount = level?.totalItemCount ?? 0;

  return (
    <PageScaffold
      className="page-main"
      title="Vocabulary"
      description="Choose a level, then a part of speech, then a session."
    >
      <section className="page-card">
        <h2 className="page-title">Available levels</h2>
        <p className="page-subtitle">
          A2 is ready now. B1, B2, and C1 stay visible as upcoming levels.
        </p>
        <div className="selection-grid">
          {VOCABULARY_LEVELS.map((entry) => {
            const hasContent = entry === "A2" && Boolean(level);

            if (!hasContent) {
              return (
                <div
                  key={entry}
                  className="selection-card selection-card--disabled"
                  aria-disabled="true"
                >
                  <p className="selection-card__eyebrow">Level</p>
                  <h3 className="selection-card__title">{entry}</h3>
                  <p className="selection-card__description">Coming soon</p>
                  <p className="selection-card__meta">No vocabulary sessions yet</p>
                </div>
              );
            }

            return (
              <Link
                key={entry}
                className="selection-card selection-card--interactive"
                href={getVocabularyLevelHref(entry)}
              >
                <p className="selection-card__eyebrow">Level</p>
                <h3 className="selection-card__title">{entry}</h3>
                <p className="selection-card__description">
                  Browse vocabulary by part of speech
                </p>
                <p className="selection-card__meta">
                  {a2SessionCount} sessions • {a2ItemCount} items
                </p>
              </Link>
            );
          })}
        </div>
        {warnings.length > 0 ? <p className="muted-note">Warning: {warnings[0]}</p> : null}
      </section>
    </PageScaffold>
  );
}
