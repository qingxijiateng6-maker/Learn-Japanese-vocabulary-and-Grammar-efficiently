import Link from "next/link";
import { PageScaffold } from "@/shared/components/PageScaffold";

export default function VocabularyLevelsPage() {
  return (
    <PageScaffold
      title="Vocabulary"
      description="Choose a level. MVP includes A2 only, but the route structure is ready for additional levels later."
    >
      <section className="page-card">
        <h2 className="page-title">Available levels</h2>
        <p className="page-subtitle">
          Content is preparing. For now, use the A2 route placeholder.
        </p>
        <div className="button-row">
          <Link className="button-link button-link--primary" href="/vocabulary/a2">
            A2 Vocabulary
          </Link>
        </div>
      </section>
    </PageScaffold>
  );
}
