import { PageNavLinks } from "@/shared/components/PageNavLinks";

export function BottomPageNav() {
  return (
    <section className="page-card compact-nav-section">
      <PageNavLinks variant="compact" ariaLabel="Page navigation" />
    </section>
  );
}

export default BottomPageNav;
