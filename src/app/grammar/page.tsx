import Link from "next/link";
import { PageScaffold } from "@/shared/components/PageScaffold";

export default function GrammarLevelsPage() {
  return (
    <PageScaffold
      title="Grammar"
      description="Choose a level. MVP includes A2 only, with route structure prepared for future levels."
    >
      <section className="page-card">
        <h2 className="page-title">Available levels</h2>
        <p className="page-subtitle">
          A2 is the current placeholder route. Grammar explanations and practice will load later.
        </p>
        <div className="button-row">
          <Link className="button-link button-link--primary" href="/grammar/a2">
            A2 Grammar
          </Link>
        </div>
      </section>
    </PageScaffold>
  );
}
