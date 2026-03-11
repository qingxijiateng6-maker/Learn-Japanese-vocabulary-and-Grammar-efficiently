import type { ReactNode } from "react";
import { BottomPageNav } from "@/shared/components/BottomPageNav";

type PageScaffoldProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function PageScaffold({
  title,
  subtitle,
  description,
  children,
  className,
}: PageScaffoldProps) {
  const hasHero = Boolean(title || subtitle || description);

  return (
    <main className={className}>
      {hasHero ? (
        <section className="page-hero">
          {subtitle ? <p className="page-hero__subtitle">{subtitle}</p> : null}
          {title ? <h1 className="page-hero__title">{title}</h1> : null}
          {description ? <p className="page-hero__description">{description}</p> : null}
        </section>
      ) : null}
      {children}
      <BottomPageNav />
    </main>
  );
}

export default PageScaffold;
