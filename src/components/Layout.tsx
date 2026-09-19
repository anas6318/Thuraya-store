import { useStorefrontMotion } from "./useStorefrontMotion";
import { configureAnalytics } from "../services/analytics";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  Menu,
  Heart,
  User,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";
import { useStore } from "../store";
import { t } from "../i18n";
import { config } from "../config";
import { formatNumber, localePath, variantPrice } from "../../shared/logic";
import { locales, type Locale } from "../../shared/domain";
import { Modal, MediaView, Price, Isolate, Glint } from "./ui";
import { CartContents } from "../pages/Commerce";

/** Transparent cut-outs of the supplied THURAYA mark (letterforms unchanged). */
export const markInk = "/media/thuraya-logo-ink.png";
export const markIvory = "/media/thuraya-logo-ivory.png";

const languageName = (l: Locale) =>
  l === "ar" ? "العربية" : l === "he" ? "עברית" : "English";
const languageShort = (l: Locale) =>
  l === "ar" ? "العربية" : l === "he" ? "עברית" : "EN";

export function Layout({ children }: { children: ReactNode }) {
  const s = useStore();
  const { locale, data } = s;
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [q, setQ] = useState("");
  const [consent, setConsent] = useState(true);
  const [scroll, setScroll] = useState({ top: true, compact: false });
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const languageTriggerRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const home = /^\/(ar|he|en)\/?$/.test(location.pathname);
  useStorefrontMotion(location.pathname);
  useEffect(() => {
    setMenu(false);
    setSearch(false);
    setLanguageOpen(false);
    s.setBagOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => setConsent(!!localStorage.getItem("thuraya.consent")), []);
  useEffect(() => {
    if (!search) return;
    const frame = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [search]);
  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const read = () => {
      frame = 0;
      const y = window.scrollY;
      const compact = y > 180 && y > last;
      setScroll((prev) =>
        prev.top === y < 24 && prev.compact === compact
          ? prev
          : { top: y < 24, compact },
      );
      last = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  useEffect(() => {
    if (!languageOpen) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!languageMenuRef.current?.contains(event.target as Node))
        setLanguageOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLanguageOpen(false);
        languageTriggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    languageMenuRef.current
      ?.querySelector<HTMLButtonElement>('[aria-checked="true"]')
      ?.focus();
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [languageOpen]);
  const links = [
    ["shop", "shop"],
    ["about", "story"],
    ["journal", "education"],
    ["concierge", "concierge"],
  ] as const;
  const categories = data.categories
    .filter(
      (c) => c.active && data.products.some((p) => p.categoryId === c.id),
    )
    .sort((a, b) => a.position - b.position)
    .slice(0, 5);
  const language = (l: Locale) =>
    navigate(localePath(location.pathname, l) + location.search);
  const languageControlLabel =
    locale === "ar"
      ? "تغيير اللغة"
      : locale === "he"
        ? "החלפת שפה"
        : "Change language";
  const count = s.cart.reduce((n, l) => n + l.quantity, 0);
  const results = q
    ? data.products
        .filter((p) =>
          Object.values(p.name)
            .join(" ")
            .toLowerCase()
            .includes(q.toLowerCase()),
        )
        .slice(0, 5)
    : [];
  const moveInMenu = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = [
      ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="menuitemradio"]',
      ),
    ];
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : (at + (event.key === "ArrowDown" ? 1 : -1) + items.length) %
            items.length;
    items[next]?.focus();
  };
  const night = home && scroll.top && !menu;
  return (
    <>
      <a href="#main" className="skip">
        {t(locale, "skip")}
      </a>
      {config.demo && (
        <div className="demo-banner">
          {t(locale, config.previewDemo ? "previewDemo" : "demo")}
        </div>
      )}
      <div className="announcement">{data.settings.announcement[locale]}</div>
      <header
        className={`header${night ? " is-night" : ""}${scroll.compact ? " is-compact" : ""}${home ? " is-home" : ""}`}
      >
        <div className="header-bar">
          <div className="header-side">
            <button
              className="icon mobile-menu"
              onClick={() => setMenu(true)}
              aria-label={t(locale, "menu")}
            >
              <Menu size={20} strokeWidth={1.4} />
            </button>
            <button
              className="icon"
              onClick={() => setSearch(true)}
              aria-label={t(locale, "search")}
            >
              <Search size={19} strokeWidth={1.4} />
            </button>
          </div>
          <Link to={`/${locale}`} className="brand">
            <img
              className="brand-ink"
              src={markInk}
              alt="THURAYA ثُرَيّا"
              width="560"
              height="271"
            />
            <img
              className="brand-ivory"
              src={markIvory}
              alt=""
              aria-hidden="true"
              width="560"
              height="271"
            />
          </Link>
          <div className="header-tools">
            <Link
              className="icon desktop-only"
              to={`/${locale}/account`}
              aria-label={t(locale, "account")}
            >
              <User size={19} strokeWidth={1.4} />
            </Link>
            <Link
              className="icon desktop-only"
              to={`/${locale}/wishlist`}
              aria-label={t(locale, "wishlist")}
            >
              <Heart size={19} strokeWidth={1.4} />
            </Link>
            <button
              className="icon bag-trigger"
              onClick={() => s.setBagOpen(true)}
              aria-label={t(locale, "bag")}
            >
              <ShoppingBag size={19} strokeWidth={1.4} />
              <span className={count ? "has-items" : ""}>
                <bdi>{formatNumber(count, locale)}</bdi>
              </span>
            </button>
            <div className="language-menu desktop-only" ref={languageMenuRef}>
              <button
                ref={languageTriggerRef}
                className="language-trigger"
                type="button"
                aria-label={languageControlLabel}
                aria-haspopup="menu"
                aria-controls="header-language-menu"
                aria-expanded={languageOpen}
                onClick={() => setLanguageOpen((open) => !open)}
              >
                <span lang={locale}>{languageShort(locale)}</span>
                <ChevronDown aria-hidden="true" size={11} strokeWidth={1.6} />
              </button>
              {languageOpen && (
                <div
                  className="language-popover"
                  id="header-language-menu"
                  role="menu"
                  aria-label={languageControlLabel}
                  onKeyDown={moveInMenu}
                >
                  {locales.map((l) => (
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={l === locale}
                      key={l}
                      lang={l}
                      dir={l === "en" ? "ltr" : "rtl"}
                      onClick={() => {
                        language(l);
                        setLanguageOpen(false);
                      }}
                    >
                      {languageName(l)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <nav className="header-nav" aria-label={t(locale, "menu")}>
          <NavLink end to={`/${locale}/shop`}>
            {t(locale, "shop")}
          </NavLink>
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/${locale}/shop?category=${c.id}`}
              aria-current={
                location.pathname.endsWith("/shop") &&
                new URLSearchParams(location.search).get("category") === c.id
                  ? "page"
                  : undefined
              }
            >
              {c.name[locale]}
            </Link>
          ))}
          <span className="nav-rule" aria-hidden="true" />
          {links.slice(1).map(([path, label]) => (
            <NavLink key={path} to={`/${locale}/${path}`}>
              {t(locale, label)}
            </NavLink>
          ))}
        </nav>
      </header>
      <main
        className={`storefront${home ? " is-home" : ""}`}
        id="main"
        tabIndex={-1}
      >
        {children}
      </main>
      <footer className="footer">
        <span className="horizon-rule" aria-hidden="true" />
        <div className="footer-top">
          <div className="footer-brand">
            <img
              className="footer-logo"
              src={markIvory}
              alt="THURAYA ثُرَيّا"
              width="560"
              height="271"
              loading="lazy"
            />
            <p>{t(locale, "heroBody")}</p>
          </div>
          <div>
            <h3>{t(locale, "shop")}</h3>
            <Link to={`/${locale}/shop`}>{t(locale, "all")}</Link>
            {categories.map((c) => (
              <Link key={c.id} to={`/${locale}/shop?category=${c.id}`}>
                {c.name[locale]}
              </Link>
            ))}
            <Link to={`/${locale}/wishlist`}>{t(locale, "wishlist")}</Link>
          </div>
          <div>
            <h3>{t(locale, "customerCare")}</h3>
            {(["track", "faq", "account"] as const).map((path) => (
              <Link key={path} to={`/${locale}/${path}`}>
                {t(locale, path)}
              </Link>
            ))}
            <Link to={`/${locale}/concierge`}>{t(locale, "concierge")}</Link>
            {data.pages
              .filter((p) => p.kind === "policy")
              .map((p) => (
                <Link key={p.id} to={`/${locale}/policies/${p.slug}`}>
                  {p.title[locale]}
                </Link>
              ))}
            {data.settings.contactEmail && (
              <a href={`mailto:${data.settings.contactEmail}`}>
                <bdi>{data.settings.contactEmail}</bdi>
              </a>
            )}
            {data.settings.whatsapp && (
              <a
                href={`https://wa.me/${data.settings.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp <ArrowUpRight size={13} strokeWidth={1.5} />
              </a>
            )}
          </div>
          <div>
            <h3>{t(locale, "discover")}</h3>
            <Link to={`/${locale}/about`}>{t(locale, "storyTitle")}</Link>
            <Link to={`/${locale}/journal`}>{t(locale, "education")}</Link>
            {data.settings.instagram && (
              <a
                href={`https://instagram.com/${data.settings.instagram.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
              >
                Instagram <ArrowUpRight size={13} strokeWidth={1.5} />
              </a>
            )}
            <div className="language-links">
              {locales.map((l) => (
                <button
                  key={l}
                  lang={l}
                  aria-current={l === locale ? "true" : undefined}
                  onClick={() => language(l)}
                >
                  {languageName(l)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © <bdi>{new Date().getFullYear()}</bdi> THURAYA · ثُرَيّا
          </span>
          <span>
            <bdi>ILS · ₪</bdi>
          </span>
          <button
            onClick={() => {
              localStorage.removeItem("thuraya.consent");
              configureAnalytics(data.settings.analytics);
              setConsent(false);
            }}
          >
            {t(locale, "preferences")}
          </button>
        </div>
      </footer>
      <Modal
        open={menu}
        onClose={() => setMenu(false)}
        title={t(locale, "menu")}
        drawer
        className="nav-drawer sf"
      >
        <nav className="mobile-nav">
          <Link to={`/${locale}/shop`}>{t(locale, "shop")}</Link>
          {categories.map((c) => (
            <Link
              className="mobile-category"
              key={c.id}
              to={`/${locale}/shop?category=${c.id}`}
            >
              {c.name[locale]}
            </Link>
          ))}
          {links.slice(1).map(([path, label]) => (
            <Link key={path} to={`/${locale}/${path}`}>
              {t(locale, label)}
            </Link>
          ))}
        </nav>
        <div className="mobile-utility">
          <Link to={`/${locale}/wishlist`}>
            <Heart size={17} strokeWidth={1.4} />
            {t(locale, "wishlist")}
          </Link>
          <Link to={`/${locale}/account`}>
            <User size={17} strokeWidth={1.4} />
            {t(locale, "account")}
          </Link>
          <Link to={`/${locale}/track`}>
            <ArrowUpRight size={17} strokeWidth={1.4} />
            {t(locale, "track")}
          </Link>
        </div>
        <div className="language-links" role="group" aria-label={languageControlLabel}>
          {locales.map((l) => (
            <button
              key={l}
              lang={l}
              aria-current={l === locale ? "true" : undefined}
              onClick={() => {
                language(l);
                setMenu(false);
              }}
            >
              {languageName(l)}
            </button>
          ))}
        </div>
      </Modal>
      <Modal
        open={search}
        onClose={() => setSearch(false)}
        title={t(locale, "search")}
        className="search-dialog sf"
      >
        <form
          className="search-form"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/${locale}/shop?q=${encodeURIComponent(q)}`);
            setSearch(false);
          }}
        >
          <label className="field">
            <span className="sr-only">{t(locale, "search")}</span>
            <input
              ref={searchInputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <button className="button">{t(locale, "search")}</button>
        </form>
        {results.length > 0 && (
          <div className="search-results">
            {results.map((p) => (
              <Link
                className="search-result"
                key={p.id}
                to={`/${locale}/product/${p.slug}`}
              >
                <span className="search-thumb">
                  {p.media[0] && (
                    <MediaView media={p.media[0]} sizes="80px" />
                  )}
                </span>
                <span>
                  <Isolate text={p.name[locale]} />
                </span>
                {p.basePrice !== null && p.variants.some((v) => v.active) && (
                  <Price
                    amount={Math.min(
                      ...p.variants
                        .filter((v) => v.active)
                        .map((v) => variantPrice(p, v)),
                    )}
                  />
                )}
              </Link>
            ))}
          </div>
        )}
      </Modal>
      <Modal
        open={s.bagOpen}
        onClose={() => s.setBagOpen(false)}
        title={t(locale, "bag")}
        drawer
        className="bag-drawer sf"
      >
        {s.bagOpen && <CartContents drawer />}
      </Modal>
      {s.notice && (
        <div className="toast" role="status">
          <Glint />
          {s.notice}
        </div>
      )}
      {!consent && Object.values(data.settings.analytics).some(Boolean) && (
        <aside className="consent">
          <p>{t(locale, "consent")}</p>
          {(["accept", "decline"] as const).map((k) => (
            <button
              key={k}
              onClick={() => {
                localStorage.setItem("thuraya.consent", k);
                configureAnalytics(data.settings.analytics);
                setConsent(true);
              }}
            >
              {t(locale, k)}
            </button>
          ))}
        </aside>
      )}
    </>
  );
}
