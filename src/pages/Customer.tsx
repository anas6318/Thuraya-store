import { contentAt } from "../../shared/public-content";
import { newId } from "../../shared/id";
import { useEffect, useState } from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useStore } from "../store";
import { t } from "../i18n";
import { Field, Empty } from "../components/ui";
import { config } from "../config";
import * as api from "../services/api";
import type { Address, Order } from "../../shared/domain";
import { Timeline } from "./Commerce";
export function Account() {
  const s = useStore();
  const { locale, customer } = s;
  const location = useLocation();
  const [mode, setMode] = useState<"signIn" | "register" | "reset">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<
    "profile" | "addresses" | "orders" | "preferences"
  >("profile");
  useEffect(() => {
    if (customer) {
      void api
        .customerOrders()
        .then(setOrders)
        .catch(() => {});
      void api
        .addresses()
        .then(setAddresses)
        .catch(() => {});
    }
  }, [customer?.id]);
  if (location.pathname.endsWith("/reset"))
    return (
      <section className="section narrow">
        <h1>{t(locale, "reset")}</h1>
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api.updatePassword(password);
              s.notify(t(locale, "saved"));
            } catch {
              setError(t(locale, "error"));
            }
          }}
        >
          <Field
            label={t(locale, "password")}
            name="newPassword"
            type="password"
            minLength={12}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="button">{t(locale, "save")}</button>
          {error && <p role="alert">{error}</p>}
        </form>
      </section>
    );
  if (!customer)
    return (
      <section className="section narrow">
        <div className="page-heading">
          <span className="overline">THURAYA</span>
          <h1>{t(locale, mode)}</h1>
        </div>
        {config.demo && (
          <div className="demo-note">
            <strong>{t(locale, "demo")}</strong>
            <p dir="ltr">
              {demoCredentials.customer} / {demoCredentials.password}
            </p>
          </div>
        )}
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              if (mode === "signIn") {
                await api.signIn(email, password);
                await s.refreshSession();
              } else if (mode === "register") {
                await api.register(email, password, name);
                s.notify(t(locale, "emailReset"));
              } else {
                await api.resetPassword(email);
                s.notify(t(locale, "emailReset"));
              }
            } catch {
              setError(t(locale, "error"));
            } finally {
              setBusy(false);
            }
          }}
        >
          {mode === "register" && (
            <Field
              name="name"
              label={t(locale, "name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <Field
            name="email"
            label={t(locale, "email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            dir="ltr"
          />
          {mode !== "reset" && (
            <Field
              name="password"
              label={t(locale, "password")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              minLength={mode === "register" ? 12 : 1}
            />
          )}
          <button className="button" disabled={busy}>
            {t(locale, busy ? "loading" : mode)}
          </button>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </form>
        <div className="auth-links">
          {(["signIn", "register", "reset"] as const)
            .filter((m) => m !== mode)
            .map((m) => (
              <button key={m} onClick={() => setMode(m)}>
                {t(locale, m)}
              </button>
            ))}
        </div>
      </section>
    );
  return (
    <section className="section account">
      <div className="page-heading">
        <h1>{t(locale, "account")}</h1>
        <p>{customer.name}</p>
      </div>
      <div className="tabs">
        {(["profile", "addresses", "orders", "preferences"] as const).map(
          (k) => (
            <button key={k} aria-pressed={tab === k} onClick={() => setTab(k)}>
              {t(locale, k)}
            </button>
          ),
        )}
        <button
          onClick={async () => {
            await api.signOut();
            await s.refreshSession();
          }}
        >
          {t(locale, "signOut")}
        </button>
      </div>
      {tab === "orders" &&
        (orders.length ? (
          orders.map((o) => <Timeline order={o} key={o.id} />)
        ) : (
          <Empty />
        ))}
      {tab === "profile" && (
        <form
          className="stack narrow"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              await api.saveProfile({
                ...customer,
                name: String(f.get("name")),
                phone: String(f.get("phone")),
              });
              await s.refreshSession();
              s.notify(t(locale, "saved"));
            } catch {
              s.notify(t(locale, "error"));
            }
          }}
        >
          <Field
            name="name"
            label={t(locale, "name")}
            defaultValue={customer.name}
            required
          />
          <Field
            name="phone"
            label={t(locale, "phone")}
            defaultValue={customer.phone}
          />
          <Field label={t(locale, "email")} value={customer.email} readOnly />
          <button className="button">{t(locale, "save")}</button>
        </form>
      )}
      {tab === "preferences" && (
        <form
          className="stack narrow"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              await api.saveProfile({
                ...customer,
                emailUpdates: f.has("emailUpdates"),
                whatsappUpdates: f.has("whatsappUpdates"),
                marketingConsent: f.has("marketing"),
              });
              await s.refreshSession();
              s.notify(t(locale, "saved"));
            } catch {
              s.notify(t(locale, "error"));
            }
          }}
        >
          <p className="muted">{t(locale, "transactionNotice")}</p>
          {(["emailUpdates", "whatsappUpdates", "marketing"] as const).map(
            (k) => (
              <label className="check" key={k}>
                <input
                  type="checkbox"
                  name={k}
                  defaultChecked={
                    k === "marketing" ? customer.marketingConsent : customer[k]
                  }
                />
                {t(locale, k)}
              </label>
            ),
          )}
          <button className="button">{t(locale, "save")}</button>
        </form>
      )}
      {tab === "addresses" && (
        <AddressBook
          customerId={customer.id}
          locale={locale}
          addresses={addresses}
          onChange={setAddresses}
          notify={s.notify}
        />
      )}
    </section>
  );
}

function AddressBook({
  customerId,
  locale,
  addresses,
  onChange,
  notify,
}: {
  customerId: string;
  locale: ReturnType<typeof useStore>["locale"];
  addresses: Address[];
  onChange: (addresses: Address[]) => void;
  notify: (message: string) => void;
}) {
  const [editing, setEditing] = useState<Address | null>(null);
  const refresh = async () => onChange(await api.addresses());
  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.saveAddress({
        id: editing?.id || newId(),
        customerId,
        country: "IL",
        isDefault: editing?.isDefault === true,
        ...Object.fromEntries(
          [
            "firstName",
            "lastName",
            "phone",
            "city",
            "street",
            "postalCode",
          ].map((k) => [k, String(f.get(k) || "")]),
        ),
      } as Address);
      setEditing(null);
      await refresh();
      notify(t(locale, "saved"));
    } catch {
      notify(t(locale, "error"));
    }
  };
  return (
    <div className="two-col">
      {addresses.map((address) => (
        <article key={address.id} className="panel stack">
          <div className="row between">
            <h3>
              {address.firstName} {address.lastName}
            </h3>
            {address.isDefault && (
              <span className="status">{t(locale, "defaultAddress")}</span>
            )}
          </div>
          <p>
            {address.street}, {address.city}
          </p>
          <bdi>{address.phone}</bdi>
          <div className="row">
            <button onClick={() => setEditing(address)}>
              {t(locale, "edit")}
            </button>
            <button
              disabled={address.isDefault}
              onClick={() =>
                void api
                  .saveAddress({ ...address, isDefault: true })
                  .then(refresh)
                  .then(() => notify(t(locale, "saved")))
                  .catch(() => notify(t(locale, "error")))
              }
            >
              {t(locale, "setDefault")}
            </button>
            <button
              onClick={() => {
                if (window.confirm(t(locale, "deleteAddress")))
                  void api
                    .deleteAddress(address.id)
                    .then(refresh)
                    .then(() => notify(t(locale, "saved")))
                    .catch(() => notify(t(locale, "error")));
              }}
            >
              {t(locale, "remove")}
            </button>
          </div>
        </article>
      ))}
      <form key={editing?.id || "new"} className="stack panel" onSubmit={save}>
        <h3>{editing ? t(locale, "edit") : t(locale, "addAddress")}</h3>
        {(
          [
            "firstName",
            "lastName",
            "phone",
            "city",
            "street",
            "postalCode",
          ] as const
        ).map((k) => (
          <Field
            key={k}
            name={k}
            label={t(locale, k)}
            defaultValue={editing?.[k] || ""}
            required={k !== "postalCode"}
          />
        ))}
        <div className="row">
          <button className="button">{t(locale, "save")}</button>
          {editing && (
            <button type="button" onClick={() => setEditing(null)}>
              {t(locale, "close")}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
export function Concierge() {
  const { locale, notify, data } = useStore();
  const [params] = useSearchParams();
  const [turnstileToken, setToken] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="section concierge">
      <div>
        <span className="overline">THURAYA</span>
        <h1>{t(locale, "concierge")}</h1>
        <p>{t(locale, "inquiryBody")}</p>
        <p className="muted">{t(locale, "customNote")}</p>
        {data.settings.whatsapp && (
          <a
            className="text-link"
            href={`https://wa.me/${data.settings.whatsapp.replace(/\D/g, "")}`}
          >
            WhatsApp
          </a>
        )}
      </div>
      {sent ? (
        <p role="status">{t(locale, "inquirySent")}</p>
      ) : (
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const f = new FormData(e.currentTarget);
            try {
              await api.submitInquiry({
                productId: params.get("product"),
                name: String(f.get("name")),
                email: String(f.get("email")),
                phone: String(f.get("phone")),
                message: String(f.get("message")),
                locale,
                turnstileToken,
              });
              setSent(true);
              notify(t(locale, "inquirySent"));
            } catch {
              setError(t(locale, "error"));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label={t(locale, "name")} name="name" minLength={2} required />
          <Field
            label={t(locale, "email")}
            name="email"
            type="email"
            required
            dir="ltr"
          />
          <Field label={t(locale, "phone")} name="phone" type="tel" dir="ltr" />
          <label className="field">
            <span>{t(locale, "message")}</span>
            <textarea
              name="message"
              minLength={5}
              maxLength={2000}
              required
              rows={6}
            />
          </label>
          <AntiAbuse onToken={setToken} />
          <button className="button" disabled={busy}>
            {t(locale, busy ? "loading" : "send")}
          </button>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
export function ReviewForm() {
  const { locale, notify } = useStore();
  const [params] = useSearchParams();
  const [turnstileToken, setToken] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [photoWarning, setPhotoWarning] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="section narrow">
      <h1>{t(locale, "review")}</h1>
      <p>{t(locale, "reviewNote")}</p>
      {done ? (
        <p role="status">
          {t(locale, photoWarning ? "reviewPhotosFailed" : "reviewSent")}
        </p>
      ) : (
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            const f = new FormData(e.currentTarget);
            try {
              const result = await api.submitReview(
                {
                  productId: params.get("product") || "",
                  name: String(f.get("name")),
                  rating: f.get("rating") ? Number(f.get("rating")) : null,
                  text: String(f.get("text")),
                  media: [],
                  turnstileToken,
                },
                photos,
              );
              setPhotoWarning(result.failedPhotos > 0);
              setDone(true);
              notify(t(locale, "reviewSent"));
            } catch {
              setError(t(locale, "error"));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field name="name" label={t(locale, "name")} required />
          <label className="field">
            <span>{t(locale, "rating")}</span>
            <select name="rating">
              <option value="">—</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t(locale, "review")}</span>
            <textarea name="text" maxLength={2000} />
          </label>
          <label className="field">
            <span>{t(locale, "reviewPhotos")}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              onChange={(e) => setPhotos(Array.from(e.target.files || []))}
            />
          </label>
          <AntiAbuse onToken={setToken} />
          <button className="button" disabled={busy}>
            {t(locale, busy ? "loading" : "send")}
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
      )}
    </section>
  );
}
export function Content() {
  const { locale, data } = useStore();
  const { slug } = useParams();
  const path = useLocation().pathname;
  const page = contentAt(data.pages, slug, path);
  if (path.endsWith("/about"))
    return (
      <section className="section prose">
        <span className="overline">THURAYA · ثُرَيّا</span>
        <h1>{t(locale, "storyTitle")}</h1>
        <p className="lede">{data.settings.story[locale]}</p>
        <h2>{t(locale, "journey")}</h2>
        <p>{t(locale, "journeyBody")}</p>
        <h2>{t(locale, "packaging")}</h2>
        <p>{data.settings.packaging[locale]}</p>
        <Link className="button" to={`/${locale}/shop`}>
          {t(locale, "explore")}
        </Link>
      </section>
    );
  if (slug)
    return (
      <section className="section prose">
        <h1>{page?.title[locale] || t(locale, "customerCare")}</h1>
        <div className="prose-body">
          {page?.body[locale] || t(locale, "policyUnavailable")}
        </div>
      </section>
    );
  const faq = path.endsWith("/faq");
  return (
    <section className="section prose">
      <span className="overline">THURAYA</span>
      <h1>{t(locale, faq ? "faq" : "education")}</h1>
      {data.pages
        .filter((p) => p.kind === (faq ? "faq" : "education"))
        .map((p) =>
          faq ? (
            <details key={p.id}>
              <summary>{p.title[locale]}</summary>
              <p>{p.body[locale]}</p>
            </details>
          ) : (
            <article className="journal-card" key={p.id}>
              <h2>
                <Link to={`/${locale}/journal/${p.slug}`}>
                  {p.title[locale]}
                </Link>
              </h2>
              <p className="journal-excerpt">{p.body[locale]}</p>
            </article>
          ),
        )}
      {faq && (
        <>
          <details>
            <summary>{t(locale, "made")}</summary>
            <p>{t(locale, "journeyBody")}</p>
          </details>
          <details>
            <summary>{t(locale, "size")}</summary>
            <p>{t(locale, "sizeBody")}</p>
          </details>
        </>
      )}
      <Link className="text-link" to={`/${locale}/concierge`}>
        {t(locale, "concierge")}
      </Link>
    </section>
  );
}
import { demoCredentials } from "../demoCredentials";
import { AntiAbuse } from "../components/AntiAbuse";
