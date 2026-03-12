import Link from "next/link";
import { PageScaffold } from "@/shared/components/PageScaffold";
import { CEFR_LEVELS } from "@/shared/config/cefrLevels";

export default function GrammarLevelsPage() {
  return (
    <PageScaffold className="page-main grammar-page grammar-page--overview" backdropVariant="grammar">
      <section className="page-card grammar-panel grammar-panel--hero">
        <p className="flashcard-label">Grammar Path</p>
        <h1 className="page-title">Grammar</h1>
        <p className="page-subtitle">
          Choose a CEFR level, then open a session to read the explanation before moving to
          practice.
        </p>
      </section>

      <section className="page-card grammar-panel grammar-panel--selection">
        <div className="stack-row">
          <h2 className="page-title">Available levels</h2>
          <span className="muted-note">A2 is open now</span>
        </div>
        <div className="level-grid">
          {CEFR_LEVELS.map((level) =>
            level.available ? (
              <Link
                key={level.code}
                className="level-card level-card--interactive grammar-selection-card"
                href={`/grammar/${level.code.toLowerCase()}`}
              >
                <p className="level-card__eyebrow">Grammar Level</p>
                <h3 className="level-card__title">{level.label}</h3>
                <p className="level-card__body">{level.description}</p>
                <div className="level-card__footer">
                  <span className="status-badge">Available</span>
                  <span className="level-card__cta">Open sessions</span>
                </div>
              </Link>
            ) : (
              <article
                key={level.code}
                className="level-card level-card--disabled grammar-selection-card grammar-selection-card--disabled"
              >
                <p className="level-card__eyebrow">Grammar Level</p>
                <h3 className="level-card__title">{level.label}</h3>
                <p className="level-card__body">{level.description}</p>
                <div className="level-card__footer">
                  <span className="level-card__badge">Coming soon</span>
                </div>
              </article>
            ),
          )}
        </div>
      </section>
    </PageScaffold>
  );
}
