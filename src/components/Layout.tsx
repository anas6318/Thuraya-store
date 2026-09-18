import { useStorefrontMotion } from "./useStorefrontMotion";
import { configureAnalytics } from "../services/analytics";
import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  Menu,
  Heart,
  User,
  ArrowUpRight,
} from "lucide-react";
import { useStore } from "../store";
import { t } from "../i18n";
import { config } from "../config";
import { logoLight, logoDark } from "../seed";
import { formatNumber, localePath } from "../../shared/logic";
import { locales, type Locale } from "../../shared/domain";
import { Modal } from "./ui";
import { CartContents } from "../pages/Commerce";
export function Layout({ children }: { children: ReactNode }) {
  const s = useStore();
  const { locale, data } = s;
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  const [consent, setConsent] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  useStorefrontMotion(location.pathname);
  useEffect(() => {
    setMenu(false);
    setSearch(false);
    s.setBagOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => setConsent(!!localStorage.getItem("thuraya.consent")), []);
  const links = [
    ["shop", "shop"],
    ["about", "story"],
    ["journal", "education"],
    ["concierge", "concierge"],
  ] as const;
  const language = (l: Locale) =>
    navigate(localePath(location.pathname, l) + location.search);
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
      <header className="header">
        <div className="header-side">
          <button
            className="icon mobile-menu"
            onClick={() => setMenu(true)}
            aria-label={t(locale, "menu")}
          >
            <Menu />
          </button>
          <nav className="desktop-nav">
            {links.slice(0, 2).map(([path, label]) => (
              <Link key={path} to={`/${locale}/${path}`}>
                {t(locale, label)}
              </Link>
            ))}
          </nav>
        </div>
        <Link to={`/${locale}`} className="brand">
          <img
            src={logoLight}
            alt="THURAYA ثُرَيّا"
            width="2048"
            height="1020"
          />
        </Link>
        <div className="header-tools">
          <button
            className="icon"
            onClick={() => setSearch(true)}
            aria-label={t(locale, "search")}
          >
            <Search size={20} />
          </button>
          <Link
            className="icon desktop-only"
            to={`/${locale}/account`}
            aria-label={t(locale, "account")}
          >
            <User size={20} />
          </Link>
          <Link
            className="icon desktop-only"
            to={`/${locale}/wishlist`}
            aria-label={t(locale, "wishlist")}
          >
            <Heart size={20} />
          </Link>
          <button
            className="icon bag-trigger"
            onClick={() => s.setBagOpen(true)}
            aria-label={t(locale, "bag")}
          >
            <ShoppingBag size={20} />
            <span><bdi>{formatNumber(s.cart.reduce((n, l) => n + l.quantity, 0), locale)}</bdi></span>
          </button>
          <select
            className="language desktop-only"
            aria-label="Language"
            value={locale}
            onChange={(e) => language(e.target.value as Locale)}
          >
            <option value="ar">العربية</option>
            <option value="he">עברית</option>
            <option value="en">English</option>
          </select>
        </div>
      </header>
      <main className="storefront" id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="footer">
        <div className="footer-top">
          <div>
            <img
              className="footer-logo"
              src={logoDark}
              alt="THURAYA ثُرَيّا"
              width="2044"
              height="1020"
            />
            <p>{t(locale, "heroBody")}</p>
          </div>
          <div>
            <h3>{t(locale, "explore")}</h3>
            {links.map(([path, label]) => (
              <Link key={path} to={`/${locale}/${path}`}>
                {t(locale, label)}
              </Link>
            ))}
          </div>
          <div>
            <h3>{t(locale, "customerCare")}</h3>
            {(["track", "faq", "account"] as const).map((path) => (
              <Link key={path} to={`/${locale}/${path}`}>
                {t(locale, path)}
              </Link>
            ))}
            {data.pages
              .filter((p) => p.kind === "policy")
              .map((p) => (
                <Link key={p.id} to={`/${locale}/policies/${p.slug}`}>
                  {p.title[locale]}
                </Link>
              ))}
            {data.settings.contactEmail && (
              <a href={`mailto:${data.settings.contactEmail}`}>
                {data.settings.contactEmail}
              </a>
            )}
            {data.settings.whatsapp && (
              <a
                href={`https://wa.me/${data.settings.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp <ArrowUpRight size={14} />
              </a>
            )}
          </div>
          <div>
            <h3>{t(locale, "discover")}</h3>
            <Link to={`/${locale}/about`}>{t(locale, "storyTitle")}</Link>
            {data.settings.instagram && (
              <a
                href={`https://instagram.com/${data.settings.instagram.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
              >
                Instagram <ArrowUpRight size={14} />
              </a>
            )}
            <div className="language-links">
              {locales.map((l) => (
                <button
                  key={l}
                  aria-current={l === locale ? "true" : undefined}
                  onClick={() => language(l)}
                >
                  {l === "ar" ? "العربية" : l === "he" ? "עברית" : "English"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} THURAYA</span>
          <span>ILS · ₪</span>
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
      >
        <nav className="mobile-nav">
          {links.map(([path, label]) => (
            <Link key={path} to={`/${locale}/${path}`}>
              {t(locale, label)}
            </Link>
          ))}
          <Link to={`/${locale}/wishlist`}>{t(locale, "wishlist")}</Link>
          <Link to={`/${locale}/account`}>{t(locale, "account")}</Link>
          <Link to={`/${locale}/track`}>{t(locale, "track")}</Link>
        </nav>
        <div className="language-links">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => {
                language(l);
                setMenu(false);
              }}
            >
              {l === "ar" ? "العربية" : l === "he" ? "עברית" : "English"}
            </button>
          ))}
        </div>
      </Modal>
      <Modal
        open={search}
        onClose={() => setSearch(false)}
        title={t(locale, "search")}
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
            <span>{t(locale, "search")}</span>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <button className="button">{t(locale, "search")}</button>
        </form>
        {q &&
          data.products
            .filter((p) =>
              Object.values(p.name)
                .join(" ")
                .toLowerCase()
                .includes(q.toLowerCase()),
            )
            .slice(0, 5)
            .map((p) => (
              <Link
                className="search-result"
                key={p.id}
                to={`/${locale}/product/${p.slug}`}
              >
                {p.name[locale]}
              </Link>
            ))}
      </Modal>
      <Modal
        open={s.bagOpen}
        onClose={() => s.setBagOpen(false)}
        title={t(locale, "bag")}
        drawer
      >
        <CartContents drawer />
      </Modal>
      {s.notice && (
        <div className="toast" role="status">
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
