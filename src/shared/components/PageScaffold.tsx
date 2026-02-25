import type { ReactNode } from 'react';

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
  return (
    <main className={className}>
      {title ? <h1>{title}</h1> : null}
      {subtitle ? <p>{subtitle}</p> : null}
      {description ? <p>{description}</p> : null}
      {children}
    </main>
  );
}

export default PageScaffold;
