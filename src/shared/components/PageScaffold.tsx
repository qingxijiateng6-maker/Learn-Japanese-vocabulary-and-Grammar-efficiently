import type { ReactNode } from "react";
import { BottomPageNav } from "@/shared/components/BottomPageNav";

type PageScaffoldProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  backdropVariant?: "grammar";
};

export function PageScaffold({
  title,
  subtitle,
  description,
  children,
  className,
  backdropVariant,
}: PageScaffoldProps) {
  const hasHero = Boolean(title || subtitle || description);

  return (
    <main className={className}>
      {backdropVariant ? (
        <div className={`page-backdrop page-backdrop--${backdropVariant}`} aria-hidden="true" />
      ) : null}
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
