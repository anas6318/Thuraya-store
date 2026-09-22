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
  Search,
  ChevronDown,
} from "lucide-react";
import {
  EditorialLoop,
  editorialLoop,
} from "../components/EditorialLoop";
import { useStore } from "../store";
import { t } from "../i18n";
import { initialMedia, siteMedia } from "../seed";
import { MediaView, ProductCard, Empty, Modal, Price, Isolate, Glint } from "../components/ui";
import { formatNumber, variantPrice } from "../../shared/logic";
import { shopProducts, sectionProducts } from "../../shared/catalog-selection";
import { galleryMedia } from "../../shared/media-roles";
import { rememberHistory } from "../../shared/local-history";
export function Home() {
  const { data, locale } = useStore();
  const products = data.products.filter((p) => p.featured);
  const lead = (
    <bdi>
      {formatNumber(data.settings.leadMin, locale)}–
      {formatNumber(data.settings.leadMax, locale)}
    </bdi>
  );
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
              <section data-layout={s.layout} className="section vitrine" key={s.id}>
                <div className="section-head">
                  <div>
                    <span className="overline">{t(locale, "vitrine")}</span>
                    <h2>{s.title[locale]}</h2>
                  </div>
                </div>
                <div className="collection-cards">
                  {data.collections
                    .filter(
                      (c) =>
                        c.active && s.selection.includes("collection:" + c.id),
                    )
                    .map((c) => (
                      <article key={c.id} className="collection-card">
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
                        <div>
                          <h3>
                            <Link to={`/${locale}/collection/${c.slug}`}>
                              <Isolate text={c.name[locale]} />
                            </Link>
                          </h3>
                          <p>{c.description[locale]}</p>
                        </div>
                      </article>
                    ))}
                </div>
                <div className="product-grid vitrine-row">
                  {sectionProducts(data.products, s).map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            );
          if (s.kind === "hero")
            return (
              <section data-layout={s.layout} key={s.id} className="hero">
                <div className="hero-art" aria-hidden="true">
                  <MediaView
                    media={
                      s.imageMedia ||
                      initialMedia.find((m) => m.src === s.image) || {
                        ...initialMedia[4],
                        src: s.image,
                      }
                    }
                    sizes="(max-width:820px) 100vw, 60vw"
                    eager
                  />
                </div>
                <div className="hero-horizon" aria-hidden="true">
                  <Glint />
                </div>
                <div className="hero-copy">
                  <div className="hero-above">
                    <span className="overline">
                      {t(locale, "made")} · {lead} {t(locale, "days")}
                    </span>
                    <h1>{s.title[locale]}</h1>
                  </div>
                  <div className="hero-below">
                    <p>{s.body[locale]}</p>
                    <div className="hero-actions">
                      <Link className="button ice" to={`/${locale}${s.href}`}>
                        {s.cta[locale]}
                        <ArrowUpRight size={16} strokeWidth={1.5} />
                      </Link>
                      <Link className="text-link" to={`/${locale}/about`}>
                        {t(locale, "discover")}
                      </Link>
                    </div>
                  </div>
                </div>
                <ul className="hero-facts">
                  <li>{t(locale, "deliveryIsrael")}</li>
                  <li>
                    {t(locale, "preparedIn")} {lead} {t(locale, "days")}
                  </li>
                  <li>{t(locale, "personalConcierge")}</li>
                </ul>
              </section>
            );
          if (s.kind === "collections")
            return (
              s.selection.length
                ? data.products.some((p) => s.selection.includes(p.id))
                : products.length
            ) ? (
              <section data-layout={s.layout} key={s.id} className="section vitrine">
                <div className="section-head">
                  <div>
                    <span className="overline">{t(locale, "vitrine")}</span>
                    <h2>{s.title[locale]}</h2>
                  </div>
                  <Link className="text-link" to={`/${locale}/shop`}>
                    {t(locale, "all")}
                    <ArrowUpRight size={15} strokeWidth={1.5} />
                  </Link>
                </div>
                <div className="product-grid vitrine-row">
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
                <span className="overline">{t(locale, "vitrine")}</span>
                <h2>{t(locale, "noProducts")}</h2>
                <p>{t(locale, "noProductsBody")}</p>
                <div className="editorial-pair vitrine-row">
                  {[initialMedia[0], initialMedia[3]].map((m) => (
                    <div className="card-media" key={m.id}>
                      <MediaView media={m} />
                      <span className="horizon" aria-hidden="true" />
                    </div>
                  ))}
                </div>
              </section>
            );
          // The category directory was removed from the homepage: header, footer
          // and catalog rail already carry category navigation at this catalog size.
          if (s.kind === "categories") return null;
          if (s.kind === "standard")
            return (
              <section
                data-layout={s.layout}
                key={s.id}
                className="standard section"
              >
                <div className="standard-intro">
                  <h2>{s.title[locale]}</h2>
                  <p>{s.body[locale]}</p>
                </div>
                <ol className="standard-grid">
                  <li>
                    <h3>{t(locale, "stepChoose")}</h3>
                    <p>{t(locale, "stepChooseBody")}</p>
                  </li>
                  <li>
                    <h3>
                      {t(locale, "made")}
                      <span className="standard-figure">
                        {lead} {t(locale, "days")}
                      </span>
                    </h3>
                    <p>{t(locale, "stepMadeBody")}</p>
                  </li>
                  <li>
                    <h3>{t(locale, "concierge")}</h3>
                    <p>{t(locale, "inquiryBody")}</p>
                  </li>
                </ol>
              </section>
            );
          if (s.kind === "editorial") {
            const still =
              s.imageMedia ||
              siteMedia.find((m) => m.src === s.image) || {
                ...initialMedia[5],
                src: s.image,
              };
            const loop = editorialLoop(still.src);
            return (
              <section data-layout={s.layout} key={s.id} className="editorial">
                <div className="editorial-image">
                  <MediaView
                    media={still}
                    sizes="(max-width:820px) 100vw, 55vw"
                  />
                  {loop && <EditorialLoop src={loop} />}
                  <span className="horizon" aria-hidden="true" />
                </div>
                <div className="editorial-copy">
                  <h2>{s.title[locale]}</h2>
                  <div className="editorial-below">
                    <p>{s.body[locale]}</p>
                    <Link className="button outline" to={`/${locale}${s.href}`}>
                      {s.cta[locale]}
                      <ArrowUpRight size={16} strokeWidth={1.5} />
                    </Link>
                  </div>
                </div>
              </section>
            );
          }
          if (s.kind === "story")
            return (
              <section
                data-layout={s.layout}
                key={s.id}
                className="story-block section"
              >
                <p className="story-name" aria-hidden="true" lang="ar" dir="rtl">
                  ثُرَيّا
                </p>
                <div>
                  <span className="overline">{t(locale, "nameOrigin")}</span>
                  <h2>{s.title[locale]}</h2>
                  <p>{s.body[locale]}</p>
                  <Link className="text-link" to={`/${locale}/about`}>
                    {t(locale, "discover")}
                    <ArrowUpRight size={15} strokeWidth={1.5} />
                  </Link>
                </div>
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
                  <span className="overline">{s.title[locale]}</span>
                  <h2>{t(locale, "twoStones")}</h2>
                  <Link className="text-link" to={`/${locale}${s.href}`}>
                    {s.cta[locale]}
                    <ArrowUpRight size={15} strokeWidth={1.5} />
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
                        <Glint />
                        <h3>
                          <Link to={`/${locale}/journal/${page.slug}`}>
                            {page.title[locale]}
                          </Link>
                        </h3>
                        <p>{page.body[locale]}</p>
                        <span className="read-more" aria-hidden="true">
                          {t(locale, "read")}
                          <ArrowUpRight size={14} strokeWidth={1.5} />
                        </span>
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
                className="section note-block"
              >
                <h2>{s.title[locale]}</h2>
                <div>
                  <p>{s.body[locale]}</p>
                  <Link className="text-link" to={`/${locale}${s.href}`}>
                    {s.cta[locale]}
                    <ArrowUpRight size={15} strokeWidth={1.5} />
                  </Link>
                </div>
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
  const railCategories = data.categories
    .filter((c) => c.active && data.products.some((p) => p.categoryId === c.id))
    .sort((a, b) => a.position - b.position);
  const activeFilters = ["gemstone", "metal", "shape", "min", "max"].filter(
    (k) => params.get(k),
  ).length;
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
      <div className="filter-actions">
        <button className="button" type="button" onClick={() => setFilters(false)}>
          {t(locale, "piecesLabel")} · <bdi>{formatNumber(products.length, locale)}</bdi>
        </button>
        <button className="text-link" type="button" onClick={() => setParams({})}>
          {t(locale, "clear")}
        </button>
      </div>
    </>
  );
  if (slug && !collection && !loading)
    return <Empty title={t(locale, "notFound")} />;
  return (
    <section className="section shop">
      <div className="page-heading">
        <span className="overline">
          {isWish ? "THURAYA" : t(locale, "vitrine")}
        </span>
        <h1>
          {isWish ? (
            t(locale, "wishlist")
          ) : (
            <Isolate
              text={
                collection?.name[locale] ||
                data.categories.find((c) => c.id === category)?.name[locale] ||
                t(locale, "shop")
              }
            />
          )}
        </h1>
        <p>{collection?.description[locale] || t(locale, "heroBody")}</p>
      </div>
      {!isWish && !slug && railCategories.length > 1 && (
        <nav className="category-rail" aria-label={t(locale, "category")}>
          <button
            type="button"
            aria-pressed={!category}
            onClick={() => set("category", "")}
          >
            {t(locale, "all")}
          </button>
          {railCategories.map((c) => (
            <button
              type="button"
              key={c.id}
              aria-pressed={category === c.id}
              onClick={() => set("category", c.id)}
            >
              {c.name[locale]}
            </button>
          ))}
        </nav>
      )}
      <div className="catalog-toolbar">
        <label className="catalog-search">
          <span className="sr-only">{t(locale, "search")}</span>
          <Search size={16} strokeWidth={1.4} aria-hidden="true" />
          <input
            placeholder={t(locale, "search")}
            value={q}
            onChange={(e) => set("q", e.target.value)}
          />
        </label>
        <span className="catalog-count">
          {t(locale, "piecesLabel")}{" "}
          <bdi>{formatNumber(products.length, locale)}</bdi>
        </span>
        <button className="toolbar-button" onClick={() => setFilters(true)}>
          <SlidersHorizontal size={16} strokeWidth={1.4} />
          {t(locale, "filter")}
          {activeFilters > 0 && (
            <span className="filter-count">
              <bdi>{formatNumber(activeFilters, locale)}</bdi>
            </span>
          )}
        </button>
        <label className="sort-control">
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
          <ChevronDown size={13} strokeWidth={1.5} aria-hidden="true" />
        </label>
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
  const media = galleryMedia(
    p.media.filter(
      (m) => !variant?.mediaIds.length || variant.mediaIds.includes(m.id),
    ),
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
          <dt>{specLabel(k, locale)}</dt>
          <dd>
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
          </dd>
        </div>
      ));
  const specGroups = (
    [
      ["stone", gem],
      ["metal", metal],
      ["measurements", measurements],
    ] as const
  ).filter(([, obj]) =>
    Object.values(obj).some((v) => v !== undefined && v !== null && v !== ""),
  );
  const selectedLabels = p.axes
    .map((axis) => {
      const id = options[axis.id] || axis.values[0]?.id;
      return axis.values.find((v) => v.id === id)?.label[locale];
    })
    .filter(Boolean);
  const category = data.categories.find((c) => c.id === p.categoryId);
  const unavailable =
    !variant || (variant.stock !== null && variant.stock < quantity);
  const leadMin = p.leadMin ?? data.settings.leadMin;
  const leadMax = p.leadMax ?? data.settings.leadMax;
  const related = data.products
    .filter(
      (x) =>
        x.id !== p.id &&
        (x.categoryId === p.categoryId ||
          x.collectionIds.some((c) => p.collectionIds.includes(c))),
    )
    .slice(0, 4);
  const reviews = data.reviews.filter(
    (r) => r.productId === p.id && r.status === "approved",
  );
  return (
    <>
      <nav className="breadcrumbs section" aria-label="Breadcrumb">
        <Link to={`/${locale}`}>THURAYA</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/${locale}/shop`}>{t(locale, "shop")}</Link>
        {category && (
          <>
            <span aria-hidden="true">/</span>
            <Link to={`/${locale}/shop?category=${category.id}`}>
              {category.name[locale]}
            </Link>
          </>
        )}
      </nav>
      <section className="product-detail section">
        <div className="gallery" aria-label={t(locale, "gallery")}>
          <div className="gallery-main">
            {selected && <MediaView key={selected.id} media={selected} eager sizes="(max-width:820px) 100vw, 56vw" />}
            <button
              className="icon zoom"
              aria-label={t(locale, "zoom")}
              onClick={() => setZoom(true)}
            >
              <Maximize2 size={17} strokeWidth={1.4} />
            </button>
            {media.length > 1 && (
              <span className="gallery-count" aria-hidden="true">
                <bdi>
                  {formatNumber(index + 1, locale)} / {formatNumber(media.length, locale)}
                </bdi>
              </span>
            )}
          </div>
          {media.length > 1 && (
            <div className="thumbnails">
              {media.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setIndex(i)}
                  aria-label={`${t(locale, "image")} ${formatNumber(i + 1, locale)}`}
                  aria-pressed={i === index}
                >
                  <MediaView media={m} sizes="96px" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="product-copy">
          <span className="overline">
            {category?.name[locale]}
            {p.isDemo && (
              <span className="demo-tag">{t(locale, "demoProduct")}</span>
            )}
          </span>
          <h1>
            <Isolate text={p.name[locale]} />
          </h1>
          <div className="product-price">
            {variant && <Price amount={variantPrice(p, variant)} />}
            <button
              className="icon wish-inline"
              aria-label={t(locale, "wishlist")}
              aria-pressed={s.wishlist.includes(p.id)}
              onClick={() => s.toggleWish(p.id)}
            >
              <Heart
                fill={s.wishlist.includes(p.id) ? "currentColor" : "none"}
                size={19}
                strokeWidth={1.4}
              />
            </button>
          </div>
          {p.shortDescription[locale] && (
            <p className="product-lede">{p.shortDescription[locale]}</p>
          )}
          <div className="variant-options">
            {p.axes.map((axis) => (
              <fieldset key={axis.id}>
                <legend>{axis.label[locale]}</legend>
                <div className="option-set">
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
                      <Isolate text={value.label[locale]} />
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <button className="text-link guide-standalone" onClick={() => setGuide(true)}>
            {t(locale, "size")}
          </button>
          <div className="purchase-row">
            <div className="stepper">
              <button
                aria-label={`${t(locale, "quantity")} −`}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus size={14} strokeWidth={1.5} />
              </button>
              <span aria-live="polite"><bdi>{formatNumber(quantity, locale)}</bdi></span>
              <button
                aria-label={`${t(locale, "quantity")} +`}
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
              >
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </div>
            <button className="button" disabled={unavailable} onClick={add}>
              {t(locale, "add")}
            </button>
          </div>
          {selectedLabels.length > 0 && (
            <p className="selection-summary">
              <span>{t(locale, "yourSelection")}</span>
              <Isolate text={selectedLabels.join(" · ")} />
            </p>
          )}
          <div className="delivery-note">
            <div>
              <strong>{t(locale, p.madeToOrder ? "made" : "ready")}</strong>
              <p>{t(locale, "journeyBody")}</p>
            </div>
            <p className="delivery-figure">
              <span>{t(locale, "eta")}</span>
              <bdi>
                {formatNumber(leadMin, locale)}–{formatNumber(leadMax, locale)}
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
              <ArrowUpRight size={15} strokeWidth={1.5} />
            </Link>
          )}
          {specGroups.length > 0 && (
            <div className="spec-plate">
              <h2>{t(locale, "specifications")}</h2>
              {specGroups.map(([key, obj]) => (
                <dl key={key}>
                  <div className="spec-group">{t(locale, key)}</div>
                  {specs(obj)}
                </dl>
              ))}
            </div>
          )}
          <div className="accordions">
            <details open>
              <summary>{t(locale, "piece")}</summary>
              <p>{p.description[locale]}</p>
            </details>
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
      {related.length > 0 && (
        <section className="section vitrine related">
          <div className="section-head">
            <h2>{t(locale, "related")}</h2>
          </div>
          <div className="product-grid vitrine-row">
            {related.map((x) => (
              <ProductCard product={x} key={x.id} />
            ))}
          </div>
        </section>
      )}
      <section className="section reviews">
        {reviews.map((r) => (
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
          <ArrowUpRight size={15} strokeWidth={1.5} />
        </Link>
      </section>
      <div className="sticky-purchase">
        <span>
          <small>
            <Isolate text={p.name[locale]} />
          </small>
          {variant && <Price amount={variantPrice(p, variant)} />}
        </span>
        <button className="button" disabled={unavailable} onClick={add}>
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
            <div key={a.id} className="guide-table">
              <h3>{a.label[locale]}</h3>
              <ul>
                {a.values.map((v) => (
                  <li key={v.id}>
                    <Isolate text={v.label[locale]} />
                    {v.numericValue !== undefined && (
                      <bdi>{formatNumber(v.numericValue, locale)}</bdi>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        <div className="row">
          <Link
            className="text-link"
            to={`/${locale}/journal/${p.categoryId === "rings" ? "ring-size" : p.categoryId === "necklaces" ? "necklace-length" : "bracelet-size"}`}
          >
            {t(locale, "education")}
          </Link>
          <Link className="button" to={`/${locale}/concierge`}>
            {t(locale, "concierge")}
          </Link>
        </div>
      </Modal>
      <Modal open={zoom} onClose={() => setZoom(false)} title={p.name[locale]} className="zoom-dialog">
        {selected && <MediaView media={selected} className="full-image" sizes="100vw" />}
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
