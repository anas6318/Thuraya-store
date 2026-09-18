import { productGemstones, gemstoneLabel } from "../../shared/gemstones";
import { useEffect, useState } from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import {
  ArrowUpRight,
  Heart,
  Plus,
  Minus,
  SlidersHorizontal,
  Maximize2,
} from "lucide-react";
import { useStore } from "../store";
import { t } from "../i18n";
import { initialMedia } from "../seed";
import { MediaView, ProductCard, Empty, Modal, Price } from "../components/ui";
import { formatNumber, variantPrice } from "../../shared/logic";
import { shopProducts, sectionProducts } from "../../shared/catalog-selection";
import { rememberHistory } from "../../shared/local-history";
export function Home() {
  const { data, locale } = useStore();
  const products = data.products.filter((p) => p.featured);
  return (
    <>
      {data.sections
        .filter((s) => s.enabled)
        .sort((a, b) => a.position - b.position)
        .map((s) => {
          if (
            s.kind === "collections" &&
            s.selection.some((id) => id.startsWith("collection:"))
          )
            return (
              <section data-layout={s.layout} className="section" key={s.id}>
                <h2>{s.title[locale]}</h2>
                <div className="product-grid">
                  {data.collections
                    .filter(
                      (c) =>
                        c.active && s.selection.includes("collection:" + c.id),
                    )
                    .map((c) => (
                      <article key={c.id}>
                        {c.image && (
                          <MediaView
                            media={
                              c.imageMedia ||
                              initialMedia.find((m) => m.src === c.image) || {
                                id: "collection-" + c.id,
                                src: c.image,
                                alt: c.name,
                                kind: "image",
                                width: 320,
                                height: 400,
                                mime: "image/jpeg",
                                position: 0,
                              }
                            }
                          />
                        )}
                        <h3>
                          <Link to={`/${locale}/collection/${c.slug}`}>
                            {c.name[locale]}
                          </Link>
                        </h3>
                        <p>{c.description[locale]}</p>
                      </article>
                    ))}
                  {sectionProducts(data.products, s).map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            );
          if (s.kind === "hero")
            return (
              <section data-layout={s.layout} key={s.id} className="hero">
                <div className="hero-copy">
                  <span className="overline">THURAYA · ثُرَيّا</span>
                  <h1>{s.title[locale]}</h1>
                  <p>{s.body[locale]}</p>
                  <Link className="button ice" to={`/${locale}${s.href}`}>
                    {s.cta[locale]}
                    <ArrowUpRight size={18} />
                  </Link>
                  <Link className="text-link" to={`/${locale}/about`}>
                    {t(locale, "discover")}
                  </Link>
                  <span className="hero-number">01 / THURAYA</span>
                </div>
                <div className="hero-art">
                  <MediaView
                    media={
                      s.imageMedia ||
                      initialMedia.find((m) => m.src === s.image) || {
                        ...initialMedia[4],
                        src: s.image,
                      }
                    }
                    eager
                  />
                </div>
              </section>
            );
          if (s.kind === "collections")
            return (
              s.selection.length
                ? data.products.some((p) => s.selection.includes(p.id))
                : products.length
            ) ? (
              <section data-layout={s.layout} key={s.id} className="section">
                <div className="section-head">
                  <div>
                    <span className="overline">THURAYA</span>
                    <h2>{s.title[locale]}</h2>
                  </div>
                  <Link className="text-link" to={`/${locale}/shop`}>
                    {t(locale, "all")}
                    <ArrowUpRight size={17} />
                  </Link>
                </div>
                <div className="product-grid">
                  {sectionProducts(data.products, s).map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            ) : (
              <section
                data-layout={s.layout}
                key={s.id}
                className="section collection-intro"
              >
                <h2>{s.title[locale]}</h2>
                <p>{t(locale, "noProductsBody")}</p>
                <div className="editorial-pair">
                  {[initialMedia[0], initialMedia[3]].map((m) => (
                    <MediaView media={m} key={m.id} />
                  ))}
                </div>
              </section>
            );
          if (
            s.kind === "categories" &&
            !data.categories.some(
              (c) =>
                c.active && data.products.some((p) => p.categoryId === c.id),
            )
          )
            return null;
          if (s.kind === "categories")
            return (
              <section
                data-layout={s.layout}
                key={s.id}
                className="category-strip section"
              >
                <h2>{s.title[locale]}</h2>
                <div>
                  {data.categories
                    .filter(
                      (c) =>
                        c.active &&
                        data.products.some((p) => p.categoryId === c.id),
                    )
                    .map((c) => (
                      <Link to={`/${locale}/shop?category=${c.id}`} key={c.id}>
                        {c.name[locale]}
                        <ArrowUpRight size={20} />
                      </Link>
                    ))}
                </div>
              </section>
            );
          if (s.kind === "standard")
            return (
              <section
                data-layout={s.layout}
                key={s.id}
                className="standard section"
              >
                <span className="overline">THURAYA</span>
                <h2>{s.title[locale]}</h2>
                <p>{s.body[locale]}</p>
                <div className="standard-grid">
                  <article>
                    <span>01</span>
                    <h3>{t(locale, "piece")}</h3>
                    <p>{t(locale, "standardBody")}</p>
                  </article>
                  <article>
                    <span>02</span>
                    <h3>{t(locale, "made")}</h3>
                    <p>{t(locale, "journeyBody")}</p>
                  </article>
                  <article>
                    <span>03</span>
                    <h3>{t(locale, "concierge")}</h3>
                    <p>{t(locale, "inquiryBody")}</p>
                  </article>
                </div>
              </section>
            );
          if (s.kind === "editorial")
            return (
              <section data-layout={s.layout} key={s.id} className="editorial">
                <div className="editorial-image">
                  <MediaView
                    media={
                      s.imageMedia ||
                      initialMedia.find((m) => m.src === s.image) || {
                        ...initialMedia[5],
                        src: s.image,
                      }
                    }
                  />
                </div>
                <div className="editorial-copy">
                  <span className="overline">THURAYA</span>
                  <h2>{s.title[locale]}</h2>
                  <p>{s.body[locale]}</p>
                  <Link className="button outline" to={`/${locale}${s.href}`}>
                    {s.cta[locale]}
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              </section>
            );
          if (s.kind === "story")
            return (
              <section
                data-layout={s.layout}
                key={s.id}
                className="story-block section"
              >
                <span className="overline">THURAYA · ثُرَيّا</span>
                <h2>{s.title[locale]}</h2>
                <p>{s.body[locale]}</p>
                <Link className="text-link" to={`/${locale}/about`}>
                  {t(locale, "discover")}
                  <ArrowUpRight size={18} />
                </Link>
              </section>
            );
          if (s.kind === "education")
            return (
              <section
                data-layout={s.layout}
                key={s.id}
                className="section journal-preview"
              >
                <div className="journal-heading">
                  <div>
                    <span className="overline">THURAYA</span>
                    <h2>{s.title[locale]}</h2>
                    <p>{s.body[locale]}</p>
                  </div>
                  <Link className="text-link" to={`/${locale}${s.href}`}>
                    {s.cta[locale]}
                    <ArrowUpRight size={20} />
                  </Link>
                </div>
                <div className="stone-journal">
                  {data.pages
                    .filter(
                      (page) =>
                        page.kind === "education" &&
                        ["moissanite", "lab-grown-diamonds"].includes(
                          page.slug,
                        ),
                    )
                    .map((page) => (
                      <article key={page.id}>
                        <h3>
                          <Link to={`/${locale}/journal/${page.slug}`}>
                            {page.title[locale]}
                            <ArrowUpRight size={18} />
                          </Link>
                        </h3>
                        <p>{page.body[locale]}</p>
                      </article>
                    ))}
                </div>
              </section>
            );
          if (s.kind === "journey" || s.kind === "packaging")
            return (
              <section
                data-layout={s.layout}
                key={s.id}
                className="section story-block"
              >
                <h2>{s.title[locale]}</h2>
                <p>{s.body[locale]}</p>
                <Link className="text-link" to={`/${locale}${s.href}`}>
                  {s.cta[locale]}
                </Link>
              </section>
            );
          return null;
        })}
    </>
  );
}
export function Shop() {
  const { data, locale, wishlist, loading } = useStore();
  const [params, setParams] = useSearchParams();
  const { slug } = useParams();
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const sort = params.get("sort") || "featured";
  const isWish = useLocation().pathname.endsWith("/wishlist");
  const [filters, setFilters] = useState(false);
  const collection = slug
    ? data.collections.find((c) => c.active && c.slug === slug)
    : null;
  const set = (key: string, value: string) => {
    const n = new URLSearchParams(params);
    if (value) n.set(key, value);
    else n.delete(key);
    setParams(n);
  };
  const products = shopProducts(
    data.products,
    params,
    slug ? (collection?.id ?? null) : undefined,
    isWish ? wishlist : undefined,
  );
  useEffect(() => {
    if (q) {
      rememberHistory("thuraya.searches", q, 6);
    }
  }, [q]);
  const controls = (
    <>
      <label className="field">
        <span>{t(locale, "category")}</span>
        <select
          value={category}
          onChange={(e) => set("category", e.target.value)}
        >
          <option value="">{t(locale, "all")}</option>
          {data.categories
            .filter((c) => data.products.some((p) => p.categoryId === c.id))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name[locale]}
              </option>
            ))}
        </select>
      </label>
      {(["gemstone", "metal", "shape"] as const).map((k) => {
        const values = [
          ...new Set(
            data.products
              .flatMap((p) =>
                k === "gemstone"
                  ? productGemstones(p)
                  : [k === "metal" ? p.metal.color : p.gem.shape],
              )
              .filter(Boolean),
          ),
        ];
        return values.length ? (
          <label className="field" key={k}>
            <span>{t(locale, k === "metal" ? "metal" : "stone")}</span>
            <select
              value={params.get(k) || ""}
              onChange={(e) => set(k, e.target.value)}
            >
              <option value="">{t(locale, "all")}</option>
              {values.map((v) => (
                <option key={v} value={v}>
                  {k === "gemstone" ? gemstoneLabel(v!, locale) : v}
                </option>
              ))}
            </select>
          </label>
        ) : null;
      })}
      <label className="field">
        <span>{t(locale, "price")} · ₪</span>
        <div className="two-col">
          <input
            type="number"
            min="0"
            placeholder="0"
            aria-label={`${t(locale, "price")} min`}
            value={params.get("min") || ""}
            onChange={(e) => set("min", e.target.value)}
          />
          <input
            type="number"
            min="0"
            placeholder="∞"
            aria-label={`${t(locale, "price")} max`}
            value={params.get("max") || ""}
            onChange={(e) => set("max", e.target.value)}
          />
        </div>
      </label>
      <button className="text-link" onClick={() => setParams({})}>
        {t(locale, "clear")}
      </button>
    </>
  );
  if (slug && !collection && !loading)
    return <Empty title={t(locale, "notFound")} />;
  return (
    <section className="section shop">
      <div className="page-heading">
        <span className="overline">THURAYA</span>
        <h1>
          {isWish
            ? t(locale, "wishlist")
            : collection?.name[locale] || t(locale, "shop")}
        </h1>
        <p>{collection?.description[locale] || t(locale, "heroBody")}</p>
      </div>
      <div className="catalog-toolbar">
        <label className="catalog-search">
          <span className="sr-only">{t(locale, "search")}</span>
          <input
            placeholder={t(locale, "search")}
            value={q}
            onChange={(e) => set("q", e.target.value)}
          />
        </label>
        <button className="text-link" onClick={() => setFilters(true)}>
          <SlidersHorizontal size={18} />
          {t(locale, "filter")}
        </button>
        <label>
          <span className="sr-only">{t(locale, "sort")}</span>
          <select
            aria-label={t(locale, "sort")}
            value={sort}
            onChange={(e) => set("sort", e.target.value)}
          >
            <option value="featured">{t(locale, "curated")}</option>
            <option value="new">{t(locale, "newest")}</option>
            <option value="low">{t(locale, "low")}</option>
            <option value="high">{t(locale, "high")}</option>
          </select>
        </label>
        <span><bdi>{formatNumber(products.length, locale)}</bdi></span>
      </div>
      {products.length ? (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard product={p} key={p.id} />
          ))}
        </div>
      ) : (
        <Empty
          title={t(locale, data.products.length ? "noResults" : "noProducts")}
          body={t(locale, "noProductsBody")}
        />
      )}
      <Modal
        open={filters}
        onClose={() => setFilters(false)}
        title={t(locale, "filter")}
        drawer
      >
        <div className="stack">{controls}</div>
      </Modal>
    </section>
  );
}
export function ProductPage() {
  const { slug } = useParams();
  const s = useStore();
  const { locale, data } = s;
  const p = data.products.find((p) => p.slug === slug);
  const [options, setOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [guide, setGuide] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setOptions({});
    setIndex(0);
    setQuantity(1);
    if (p) {
      rememberHistory("thuraya.recent", p.id, 8);
    }
  }, [p?.id]);
  if (!p) return <Empty title={t(locale, "notFound")} />;
  const variant = p.variants.find(
    (v) =>
      v.active &&
      p.axes.every(
        (a) => v.options[a.id] === (options[a.id] || a.values[0]?.id),
      ),
  );
  const media = p.media.filter(
    (m) => !variant?.mediaIds.length || variant.mediaIds.includes(m.id),
  );
  const selected = media[index] || media[0];
  const gem = { ...p.gem, ...variant?.gem };
  const metal = { ...p.metal, ...variant?.metal };
  const measurements = { ...p.measurements, ...variant?.measurements };
  const add = () => {
    if (variant) s.add({ productId: p.id, variantId: variant.id, quantity });
  };
  const specs = (obj: object) =>
    Object.entries(obj)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => (
        <div className="spec-row" key={k}>
          <span>{specLabel(k, locale)}</span>
          <bdi>
            {typeof v === "boolean"
              ? v
                ? "✓"
                : "—"
              : k === "type"
                ? gemstoneLabel(String(v), locale)
                : typeof v === "number"
                  ? formatNumber(v, locale)
                  : String(v)}
          </bdi>
        </div>
      ));
  return (
    <>
      <div className="breadcrumbs section">
        <Link to={`/${locale}`}>THURAYA</Link>
        <span>/</span>
        <Link to={`/${locale}/shop`}>{t(locale, "shop")}</Link>
        <span>/</span>
        <span>{p.name[locale]}</span>
      </div>
      <section className="product-detail section">
        <div className="gallery">
          <div className="gallery-main">
            {selected && <MediaView key={selected.id} media={selected} eager />}
            <button
              className="icon zoom"
              aria-label={t(locale, "zoom")}
              onClick={() => setZoom(true)}
            >
              <Maximize2 size={19} />
            </button>
          </div>
          {media.length > 1 && (
            <div className="thumbnails">
              {media.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setIndex(i)}
                    aria-label={`${t(locale, "piece")} ${formatNumber(i + 1, locale)}`}
                  aria-pressed={i === index}
                >
                  <MediaView media={m} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="product-copy">
          <span className="overline">
            {p.isDemo
              ? t(locale, "demoProduct")
              : data.categories.find((c) => c.id === p.categoryId)?.name[
                  locale
                ]}
          </span>
          <h1>{p.name[locale]}</h1>
          <div className="product-price">
            {variant && <Price amount={variantPrice(p, variant)} />}
            <button
              className="icon"
              aria-label={t(locale, "wishlist")}
              aria-pressed={s.wishlist.includes(p.id)}
              onClick={() => s.toggleWish(p.id)}
            >
              <Heart
                fill={s.wishlist.includes(p.id) ? "currentColor" : "none"}
                size={20}
              />
            </button>
          </div>
          <p>{p.shortDescription[locale]}</p>
          <div className="variant-options">
            {p.axes.map((axis) => (
              <fieldset key={axis.id}>
                <legend>{axis.label[locale]}</legend>
                {axis.values.map((value) => (
                  <button
                    key={value.id}
                    type="button"
                    className={`option ${(options[axis.id] || axis.values[0]?.id) === value.id ? "active" : ""}`}
                    aria-pressed={
                      (options[axis.id] || axis.values[0]?.id) === value.id
                    }
                    onClick={() =>
                      setOptions({ ...options, [axis.id]: value.id })
                    }
                  >
                    {value.label[locale]}
                  </button>
                ))}
              </fieldset>
            ))}
          </div>
          <button className="text-link" onClick={() => setGuide(true)}>
            {t(locale, "size")}
          </button>
          <div className="purchase-row">
            <div className="stepper">
              <button
                aria-label={`${t(locale, "quantity")} −`}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus size={16} />
              </button>
              <span aria-live="polite"><bdi>{formatNumber(quantity, locale)}</bdi></span>
              <button
                aria-label={`${t(locale, "quantity")} +`}
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              className="button"
              disabled={
                !variant || (variant.stock !== null && variant.stock < quantity)
              }
              onClick={add}
            >
              {t(locale, "add")}
            </button>
          </div>
          <div className="delivery-note">
            <strong>{t(locale, p.madeToOrder ? "made" : "ready")}</strong>
            <p>
              {t(locale, "eta")}:{" "}
              <bdi>
                {formatNumber(p.leadMin ?? data.settings.leadMin, locale)}–
                {formatNumber(p.leadMax ?? data.settings.leadMax, locale)}
              </bdi>{" "}
              {t(locale, "days")}
            </p>
          </div>
          {p.customization && (
            <Link
              className="text-link"
              to={`/${locale}/concierge?product=${p.id}`}
            >
              {t(locale, "custom")}
              <ArrowUpRight size={16} />
            </Link>
          )}
          <div className="accordions">
            <details open>
              <summary>{t(locale, "piece")}</summary>
              <p>{p.description[locale]}</p>
            </details>
            {Object.keys(gem).length > 0 && (
              <details>
                <summary>{t(locale, "stone")}</summary>
                {specs(gem)}
              </details>
            )}
            {Object.keys(metal).length > 0 && (
              <details>
                <summary>{t(locale, "metal")}</summary>
                {specs(metal)}
              </details>
            )}
            {Object.keys(measurements).length > 0 && (
              <details>
                <summary>{t(locale, "measurements")}</summary>
                {specs(measurements)}
              </details>
            )}
            <details>
              <summary>{t(locale, "delivery")}</summary>
              <p>{t(locale, "journeyBody")}</p>
            </details>
            {p.care[locale] && (
              <details>
                <summary>{t(locale, "care")}</summary>
                <p>{p.care[locale]}</p>
              </details>
            )}
            {(p.included[locale] || data.settings.included[locale]) && (
              <details>
                <summary>{t(locale, "included")}</summary>
                <p>{p.included[locale] || data.settings.included[locale]}</p>
              </details>
            )}
          </div>
        </div>
      </section>
      <section className="section">
        <h2>{t(locale, "related")}</h2>
        <div className="product-grid">
          {data.products
            .filter(
              (x) =>
                x.id !== p.id &&
                (x.categoryId === p.categoryId ||
                  x.collectionIds.some((c) => p.collectionIds.includes(c))),
            )
            .slice(0, 4)
            .map((x) => (
              <ProductCard product={x} key={x.id} />
            ))}
        </div>
        {data.reviews
          .filter((r) => r.productId === p.id && r.status === "approved")
          .map((r) => (
            <blockquote key={r.id}>
              <p>{r.text}</p>
              <div className="review-photos">
                {r.media.map((src, i) => (
                  <a href={src} key={src} target="_blank" rel="noreferrer">
                    <img
                      src={
                        src + (src.includes("/media-delivery?") ? "&w=320" : "")
                      }
                      alt={`${t(locale, "review")} ${i + 1}`}
                      width="160"
                      height="200"
                      loading="lazy"
                      style={{ objectFit: "contain" }}
                    />
                  </a>
                ))}
              </div>
              {r.rating !== null && (
                <span aria-label={`${t(locale, "rating")}: ${r.rating}/5`}>
                  {"★".repeat(r.rating)}
                </span>
              )}
              <cite>{r.name}</cite>
            </blockquote>
          ))}
        <Link className="text-link" to={`/${locale}/review?product=${p.id}`}>
          {t(locale, "review")}
        </Link>
      </section>
      <div className="sticky-purchase">
        <span>{variant && <Price amount={variantPrice(p, variant)} />}</span>
        <button
          className="button"
          disabled={
            !variant || (variant.stock !== null && variant.stock < quantity)
          }
          onClick={add}
        >
          {t(locale, "add")}
        </button>
      </div>
      <Modal
        open={guide}
        onClose={() => setGuide(false)}
        title={t(locale, "size")}
      >
        <p>{t(locale, "sizeBody")}</p>
        {p.axes
          .filter((a) =>
            ["ring_size", "necklace_length", "bracelet_length"].includes(
              a.kind,
            ),
          )
          .map((a) => (
            <div key={a.id}>
              <h3>{a.label[locale]}</h3>
              <ul>
                {a.values.map((v) => (
                  <li key={v.id}>
                    {v.label[locale]}
                    {v.numericValue !== undefined && (
                      <bdi> · {formatNumber(v.numericValue, locale)}</bdi>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        <Link
          className="text-link"
          to={`/${locale}/journal/${p.categoryId === "rings" ? "ring-size" : p.categoryId === "necklaces" ? "necklace-length" : "bracelet-size"}`}
        >
          {t(locale, "education")}
        </Link>
        <Link className="button" to={`/${locale}/concierge`}>
          {t(locale, "concierge")}
        </Link>
      </Modal>
      <Modal open={zoom} onClose={() => setZoom(false)} title={p.name[locale]}>
        {selected && <MediaView media={selected} className="full-image" />}
      </Modal>
    </>
  );
}
function specLabel(k: string, l: "ar" | "he" | "en") {
  const labels: Record<string, [string, string, string]> = {
    carat: ["Carat weight", "الوزن بالقيراط", "משקל בקראט"],
    caratEquivalent: ["Carat equivalent", "مكافئ القيراط", "מקביל לקראט"],
    totalCaratWeight: [
      "Total carat weight",
      "إجمالي وزن القيراط",
      "משקל כולל בקראט",
    ],
    count: ["Stone count", "عدد الأحجار", "מספר אבנים"],
    cutGrade: ["Cut grade", "درجة القطع", "דירוג חיתוך"],
    certificateReference: [
      "Certificate reference",
      "مرجع الشهادة",
      "מספר תעודה",
    ],
    widthMm: ["Width · mm", "العرض · مم", "רוחב · מ״מ"],
    thicknessMm: ["Thickness · mm", "السماكة · مم", "עובי · מ״מ"],
    chainWidthMm: ["Chain width · mm", "عرض السلسلة · مم", "רוחב שרשרת · מ״מ"],
    stoneDiameterMm: [
      "Stone diameter · mm",
      "قطر الحجر · مم",
      "קוטר אבן · מ״מ",
    ],
    necklaceLengthCm: [
      "Necklace length · cm",
      "طول القلادة · سم",
      "אורך שרשרת · ס״מ",
    ],
    braceletLengthCm: [
      "Bracelet length · cm",
      "طول السوار · سم",
      "אורך צמיד · ס״מ",
    ],
    ringSize: ["Ring size", "مقاس الخاتم", "מידת טבעת"],
    earringDimensions: ["Earring dimensions", "أبعاد القرط", "מידות עגיל"],
    weightGrams: ["Weight · g", "الوزن · غ", "משקל · גרם"],
    clasp: ["Clasp", "القفل", "סוגר"],
    setting: ["Setting", "التثبيت", "שיבוץ"],
    type: ["Gemstone", "الحجر", "אבן"],
    shape: ["Shape", "الشكل", "צורה"],
    sizeMm: ["Size · mm", "الحجم · مم", "גודל · מ״מ"],
    color: ["Color", "اللون", "צבע"],
    clarity: ["Clarity", "النقاء", "ניקיון"],
    metal: ["Metal", "المعدن", "מתכת"],
    purity: ["Purity", "العيار", "טוהר"],
    finish: ["Finish", "التشطيب", "גימור"],
    plating: ["Plating", "الطلاء", "ציפוי"],
    certificationIncluded: [
      "Certificate included",
      "الشهادة مشمولة",
      "תעודה כלולה",
    ],
    certificationType: ["Certificate type", "نوع الشهادة", "סוג תעודה"],
  };
  return labels[k]?.[l === "en" ? 0 : l === "ar" ? 1 : 2] || k;
}
