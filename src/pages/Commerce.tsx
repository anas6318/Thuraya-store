import { shipsTo, shippingEta, quoteKey } from "../../shared/shipping";
import { newId } from "../../shared/id";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useStore } from "../store";
import { t } from "../i18n";
import { Empty, Field, Price } from "../components/ui";
import { cartPrice, formatDate, formatMoney, formatNumber } from "../../shared/logic";
import { checkoutSchema } from "../../shared/validation";
import type { CheckoutInput, Order } from "../../shared/domain";
import * as api from "../services/api";
export function CartContents({ drawer = false }: { drawer?: boolean }) {
  const s = useStore();
  const { locale, data, cart } = s;
  if (!cart.length) return <Empty />;
  let subtotal = 0;
  return (
    <div className="cart-contents">
      {cart.map((line, i) => {
        const p = data.products.find((x) => x.id === line.productId);
        const v = p?.variants.find((x) => x.id === line.variantId);
        if (p && v) subtotal += (p.basePrice! + v.adjustment) * line.quantity;
        return (
          <article className="cart-line" key={`${line.variantId}-${i}`}>
            {p?.media[0] && (
              <img
                src={p.media[0].src}
                alt=""
                width="80"
                height="100"
                loading="lazy"
              />
            )}
            <div>
              <h3>{p?.name[locale] || t(locale, "unavailable")}</h3>
              {p?.axes.map((a) => (
                <p key={a.id}>
                  {a.label[locale]}:{" "}
                  {
                    a.values.find((x) => x.id === v?.options[a.id])?.label[
                      locale
                    ]
                  }
                </p>
              ))}
              <label className="quantity-label">
                {t(locale, "quantity")}
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={line.quantity}
                  onChange={(e) =>
                    s.setCart(
                      cart.map((l, j) =>
                        j === i
                          ? {
                              ...l,
                              quantity: Math.max(
                                1,
                                Math.min(10, Number(e.target.value) || 1),
                              ),
                            }
                          : l,
                      ),
                    )
                  }
                />
              </label>
              <div className="line-actions">
                <button
                  onClick={() => s.setCart(cart.filter((_, j) => j !== i))}
                >
                  {t(locale, "remove")}
                </button>
                {p && (
                  <label>
                    <span className="sr-only">{t(locale, "edit")}</span>
                    <select
                      aria-label={`${t(locale, "edit")} ${p.name[locale]}`}
                      value={line.variantId}
                      onChange={(e) =>
                        s.setCart(
                          cart.map((l, j) =>
                            j === i ? { ...l, variantId: e.target.value } : l,
                          ),
                        )
                      }
                    >
                      {p.variants
                        .filter((v) => v.active)
                        .map((v) => (
                          <option key={v.id} value={v.id}>
                            {p.axes
                              .map(
                                (a) =>
                                  a.values.find((x) => x.id === v.options[a.id])
                                    ?.label[locale],
                              )
                              .join(" · ") || p.name[locale]}{" "}
                            · {formatMoney(p.basePrice! + v.adjustment, locale)}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
              </div>
            </div>
            <span>
              {p && v && (
                <Price amount={(p.basePrice! + v.adjustment) * line.quantity} />
              )}
            </span>
          </article>
        );
      })}
      <div className="cart-total">
        <span>{t(locale, "subtotal")}</span>
        <Price amount={subtotal} />
      </div>
      <p className="muted">
        {t(locale, "delivery")}: {t(locale, "checkout")}
      </p>
      <Link className="button block" to={`/${locale}/checkout`}>
        {t(locale, "buy")}
      </Link>
      {drawer && (
        <Link className="text-link" to={`/${locale}/cart`}>
          {t(locale, "bag")}
        </Link>
      )}
    </div>
  );
}
export function CartPage() {
  const { locale } = useStore();
  return (
    <section className="section narrow">
      <div className="page-heading">
        <h1>{t(locale, "bag")}</h1>
      </div>
      <CartContents />
    </section>
  );
}
export function Checkout() {
  const s = useStore();
  const { locale, data, cart } = s;
  const navigate = useNavigate();
  const [turnstileToken, setToken] = useState("");
  const [fields, setFields] = useState({
    firstName: "",
    lastName: "",
    email: s.customer?.email || "",
    phone: s.customer?.phone || "",
    city: "",
    street: "",
    postalCode: "",
    notes: "",
    giftNote: "",
  });
  const [zoneId, setZone] = useState("");
  const [paymentMethod, setMethod] =
    useState<CheckoutInput["paymentMethod"]>("bank_transfer");
  const [marketingConsent, setMarketing] = useState(false);
  const [whatsappUpdates, setWhats] = useState(false);
  const [discountCode, setCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [quote, setQuote] = useState<{ key: string; discount: number } | null>(
    null,
  );
  const currentQuoteKey = quoteKey(cart, zoneId, fields.city, discountCode);
  const discount = quote?.key === currentQuoteKey ? quote.discount : 0;
  const [idem] = useState(() =>
    typeof sessionStorage === "undefined"
      ? ""
      : sessionStorage.getItem("thuraya.checkout.idempotency") || newId(),
  );
  useEffect(() => {
    sessionStorage.setItem("thuraya.checkout.idempotency", idem);
  }, [idem]);
  const zone = data.zones.find(
    (z) => z.id === zoneId && shipsTo(z, "IL", fields.city),
  );
  const eta = shippingEta(cart, data.products, data.settings, zone);
  let totals = { subtotal: 0, shipping: zone?.price || 0, discount, total: 0 };
  try {
    totals = { ...cartPrice(cart, data.products, zone?.price || 0), discount };
    if (
      data.settings.freeShippingThreshold !== null &&
      totals.subtotal >= data.settings.freeShippingThreshold
    )
      totals.shipping = 0;
    totals.total = totals.subtotal + totals.shipping - discount;
  } catch {
    /* unavailable cart remains blocked on submit */
  }
  const methods = data.settings.paymentMethods.filter(
    (m) => m.enabled && m.ready,
  );
  if (!cart.length) return <Empty />;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    const input = {
      ...fields,
      idempotencyKey: idem,
      locale,
      country: "IL" as const,
      zoneId,
      paymentMethod,
      discountCode,
      marketingConsent,
      whatsappUpdates,
      lines: cart,
      turnstileToken,
    };
    const checked = checkoutSchema.safeParse(input);
    if (!checked.success) {
      setErrors(
        Object.fromEntries(
          checked.error.issues.map((i) => [i.path[0], t(locale, "invalid")]),
        ),
      );
      return;
    }
    if (!zone) {
      setErrors({ zoneId: t(locale, "invalid") });
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      analytics("add_payment_info", { item_ids: cart.map((l) => l.productId) });
      const order = await api.placeOrder(checked.data);
      sessionStorage.setItem(
        `thuraya.confirmation.${order.number}`,
        JSON.stringify(order),
      );
      sessionStorage.removeItem("thuraya.checkout.idempotency");
      s.setCart([]);
      navigate(`/${locale}/order/${order.number}`);
    } catch {
      setError(t(locale, "error"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="section">
      <div className="page-heading">
        <h1>{t(locale, "checkout")}</h1>
      </div>
      <form className="checkout-grid" onSubmit={submit} noValidate>
        <div className="checkout-fields">
          <h2>{t(locale, "contact")}</h2>
          <div className="two-col">
            {(["firstName", "lastName", "email", "phone"] as const).map((k) => (
              <Field
                key={k}
                name={k}
                label={t(locale, k)}
                value={fields[k]}
                onChange={(e) => setFields({ ...fields, [k]: e.target.value })}
                error={errors[k]}
                type={k === "email" ? "email" : k === "phone" ? "tel" : "text"}
                dir={k === "email" || k === "phone" ? "ltr" : undefined}
                autoComplete={
                  k === "firstName"
                    ? "given-name"
                    : k === "lastName"
                      ? "family-name"
                      : k === "phone"
                        ? "tel"
                        : "email"
                }
              />
            ))}
          </div>
          <h2>{t(locale, "address")}</h2>
          <div className="two-col">
            {(["city", "street", "postalCode"] as const).map((k) => (
              <Field
                key={k}
                name={k}
                label={t(locale, k)}
                value={fields[k]}
                onChange={(e) => setFields({ ...fields, [k]: e.target.value })}
                error={errors[k]}
                autoComplete={
                  k === "city"
                    ? "address-level2"
                    : k === "street"
                      ? "street-address"
                      : "postal-code"
                }
              />
            ))}
          </div>
          <label className="field">
            <span>{t(locale, "shipping")}</span>
            <select
              name="zoneId"
              value={zone?.id || ""}
              onChange={(e) => {
                setZone(e.target.value);
                analytics("add_shipping_info", {
                  item_ids: cart.map((l) => l.productId),
                });
              }}
              aria-invalid={!!errors.zoneId}
            >
              <option value="">{t(locale, "select")}</option>
              {data.zones
                .filter((z) => shipsTo(z, "IL", fields.city))
                .map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name[locale]} · {formatMoney(z.price, locale)}
                  </option>
                ))}
            </select>
            {errors.zoneId && <span className="error">{errors.zoneId}</span>}
          </label>
          <Field
            label={t(locale, "notes")}
            name="notes"
            value={fields.notes}
            onChange={(e) => setFields({ ...fields, notes: e.target.value })}
          />
          {data.settings.giftNote && (
            <Field
              label={t(locale, "giftNote")}
              name="giftNote"
              value={fields.giftNote}
              onChange={(e) =>
                setFields({ ...fields, giftNote: e.target.value })
              }
            />
          )}
          <h2>{t(locale, "payment")}</h2>
          {methods.length ? (
            methods.map((m) => (
              <label className="payment-option" key={m.id}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={m.id}
                  checked={paymentMethod === m.id}
                  onChange={() => {
                    setMethod(m.id);
                    analytics("add_payment_info");
                  }}
                />
                <span>
                  {m.id === "bank_transfer" ? t(locale, "bank") : m.id}
                </span>
              </label>
            ))
          ) : (
            <p>{t(locale, "unconfigured")}</p>
          )}
          <label className="check">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketing(e.target.checked)}
            />
            {t(locale, "marketing")}
          </label>
          {data.settings.whatsappEnabled && (
            <label className="check">
              <input
                type="checkbox"
                checked={whatsappUpdates}
                onChange={(e) => setWhats(e.target.checked)}
              />
              {t(locale, "whatsappUpdates")}
            </label>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <AntiAbuse onToken={setToken} />
          <button
            className="button block"
            disabled={busy || !methods.length || !data.settings.checkoutEnabled}
          >
            {t(locale, busy ? "loading" : "place")}
          </button>
        </div>
        <aside className="order-summary">
          <h2>{t(locale, "bag")}</h2>
          {cart.map((l) => {
            const p = data.products.find((p) => p.id === l.productId);
            const v = p?.variants.find((v) => v.id === l.variantId);
            return (
              <div className="summary-item" key={l.variantId}>
                <img src={p?.media[0]?.src} alt="" width="64" height="80" />
                <div>
                  <strong>{p?.name[locale]}</strong>
                  <p>
                    {p?.axes
                      .map(
                        (a) =>
                          a.values.find((x) => x.id === v?.options[a.id])
                            ?.label[locale],
                      )
                      .join(" · ")}
                  </p>
                  <span>
                    {t(locale, "quantity")}: {l.quantity}
                  </span>
                </div>
              </div>
            );
          })}
          <div className="promo">
            <Field
              label={t(locale, "code")}
              name="discountCode"
              value={discountCode}
              onChange={(e) => {
                setCode(e.target.value);
                setQuote(null);
              }}
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  const q = await api.quote(
                    cart,
                    zoneId,
                    discountCode,
                    fields.city,
                  );
                  setQuote({ key: currentQuoteKey, discount: q.discount });
                  setError("");
                } catch {
                  setError(t(locale, "error"));
                }
              }}
            >
              {t(locale, "apply")}
            </button>
          </div>
          {(["subtotal", "shipping", "discount", "total"] as const).map((k) => (
            <div
              className={`summary-row ${k === "total" ? "grand" : ""}`}
              key={k}
            >
              <span>{t(locale, k)}</span>
              <Price amount={totals[k]} />
            </div>
          ))}
          <p>
            {t(locale, "made")} ·{" "}
            <bdi>
              {formatNumber(eta.etaMin, locale)}–{formatNumber(eta.etaMax, locale)}
            </bdi>{" "}
            {t(locale, "days")}
          </p>
          <p className="muted">{t(locale, "journeyBody")}</p>
        </aside>
      </form>
    </section>
  );
}
export function Timeline({ order }: { order: Order }) {
  const { locale, data } = useStore();
  useEffect(() => {
    if (order.isDemo || order.paymentStatus !== "paid") return;
    const key = "thuraya.analytics.purchase." + order.id;
    if (
      !localStorage.getItem(key) &&
      analytics(
        "purchase",
        {
          transaction_id: order.number,
          value: order.total / 100,
          item_ids: order.items.map((i) => i.productId),
        },
        () => localStorage.setItem(key, "1"),
      )
    )
      localStorage.setItem(key, "1");
  }, [order.id, order.paymentStatus]);
  return (
    <div className="order-view">
      <div className="order-overview">
        <span>{t(locale, "orderNumber")}</span>
        <bdi>{order.number}</bdi>
        <strong>
          <Price amount={order.total} />
        </strong>
      </div>
      <ol className="timeline">
        {order.events.map((e, i) => (
          <li
            key={e.id}
            className={i === order.events.length - 1 ? "current" : ""}
          >
            <span className="timeline-dot" />
            <div>
              <strong>{data.settings.statusLabels[e.status][locale]}</strong>
              <time><bdi>{formatDate(e.at, locale)}</bdi></time>
            </div>
          </li>
        ))}
      </ol>
      {order.safeTrackingUrl && (
        <a
          className="text-link"
          href={order.safeTrackingUrl}
          target="_blank"
          rel="noreferrer"
        >
          {t(locale, "track")}
        </a>
      )}
      <div>
        {order.items.map((i) => (
          <div className="summary-row" key={i.variantId}>
            <span>
              {i.name[locale]} × <bdi>{formatNumber(i.quantity, locale)}</bdi>
            </span>
            <Price amount={i.lineTotal} />
          </div>
        ))}
      </div>
    </div>
  );
}
export function Confirmation() {
  const { number } = useParams();
  const { locale, data } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  useEffect(() => {
    try {
      setOrder(
        JSON.parse(
          sessionStorage.getItem(`thuraya.confirmation.${number}`) || "null",
        ),
      );
    } catch {
      /* no guest contact stored */
    }
  }, [number]);
  return (
    <section className="section narrow">
      <div className="page-heading">
        <span className="overline">THURAYA</span>
        <h1>{t(locale, order ? "confirmation" : "track")}</h1>
        {order && <p>{t(locale, "unpaid")}</p>}
      </div>
      {order ? (
        <>
          <Timeline order={order} />
          <p>
            {
              data.settings.paymentMethods.find(
                (m) => m.id === order.paymentMethod,
              )?.instructions[locale]
            }
          </p>
        </>
      ) : (
        <p>
          <bdi>{number}</bdi>
        </p>
      )}
      <Link className="button" to={`/${locale}/track`}>
        {t(locale, "track")}
      </Link>
    </section>
  );
}
export function Tracking() {
  const { locale } = useStore();
  const [number, setNumber] = useState("");
  const [contact, setContact] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <section className="section narrow">
      <div className="page-heading">
        <span className="overline">THURAYA</span>
        <h1>{t(locale, "track")}</h1>
        <p>{t(locale, "journeyBody")}</p>
      </div>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const o = await api.trackOrder(number, contact);
            setOrder(o);
            setError(!o);
          } catch {
            setOrder(null);
            setError(true);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field
          label={t(locale, "orderNumber")}
          name="orderNumber"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          dir="ltr"
          required
        />
        <Field
          label={t(locale, "trackingContact")}
          name="contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          dir="ltr"
          required
        />
        <button className="button" disabled={busy}>
          {t(locale, busy ? "loading" : "track")}
        </button>
        {error && (
          <p className="error" role="alert">
            {t(locale, "trackError")}
          </p>
        )}
      </form>
      {order && <Timeline order={order} />}
    </section>
  );
}
import { AntiAbuse } from "../components/AntiAbuse";
import { analytics } from "../services/analytics";
