import Image from "next/image";
import Link from "next/link";

const NAV_ITEMS = [
  {
    key: "home",
    href: "/",
    label: "Home",
    imageSrc: "/nav/home.png",
  },
  {
    key: "vocabulary",
    href: "/vocabulary",
    label: "Vocabulary",
    imageSrc: "/nav/vocabulary.png",
  },
  {
    key: "grammar",
    href: "/grammar",
    label: "Grammar",
    imageSrc: "/nav/grammar.png",
  },
  {
    key: "history",
    href: "/history",
    label: "History",
    imageSrc: "/nav/history.png",
  },
] as const;

type PageNavLinksProps = {
  variant: "home" | "compact";
  ariaLabel: string;
};

export function PageNavLinks({ variant, ariaLabel }: PageNavLinksProps) {
  const gridClassName = variant === "home" ? "home-nav-grid" : "compact-nav-grid";
  const buttonClassName = variant === "home" ? "home-nav-button" : "compact-nav-button";
  const iconClassName =
    variant === "home" ? "nav-button__icon nav-button__icon--home" : "nav-button__icon nav-button__icon--compact";
  const sizes =
    variant === "home"
      ? "(max-width: 639px) 44px, 52px"
      : "(max-width: 639px) 16px, 22px";

  return (
    <nav className={gridClassName} aria-label={ariaLabel}>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.key}
          className={`${buttonClassName} ${buttonClassName}--${item.key}`}
          href={item.href}
        >
          <span className={`nav-button__content nav-button__content--${variant}`}>
            <Image
              className={iconClassName}
              src={item.imageSrc}
              alt=""
              aria-hidden="true"
              width={96}
              height={96}
              sizes={sizes}
            />
            <span className="nav-button__label">{item.label}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}

export default PageNavLinks;
