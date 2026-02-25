import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/vocabulary", label: "Vocabulary" },
  { href: "/grammar", label: "Grammar" },
  { href: "/history", label: "History" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand">
          Japanese Learning App
        </Link>
        <nav aria-label="Main navigation" className="site-nav">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="site-nav__link">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
