import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Layers,
  Flag,
  Scale,
  ShieldCheck,
  ChartNoAxesCombined,
  LogOut,
  ArrowRight,
  RefreshCw,
  Search,
  X,
  Check,
  Menu,
  Landmark,
} from "lucide-react";
import { api } from "./services/api";
import type {
  Analytics,
  Audit,
  Dispute,
  Listing,
  Page,
  Report,
  Staff,
} from "./services/api";

type View =
  | "dashboard"
  | "users"
  | "listings"
  | "reports"
  | "disputes"
  | "analytics"
  | "verification";
const navigation = [
  ["dashboard", "Overview", LayoutDashboard],
  ["users", "User management", Users],
  ["listings", "Listing moderation", Layers],
  ["reports", "Reported content", Flag],
  ["disputes", "Disputes", Scale],
  ["analytics", "Analytics", ChartNoAxesCombined],
  ["verification", "Certificate reviews", ShieldCheck],
] as const;
const label = (s?: string) =>
  (s || "Unknown").toLowerCase().replaceAll("_", " ");
const money = (s: string | number) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
  }).format(Number(s));
const message = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong. Please retry.";
function Badge({ value }: { value?: string }) {
  return (
    <span className={`badge ${value?.toLowerCase()}`}>{label(value)}</span>
  );
}
function Empty() {
  return (
    <div className="empty">
      <ShieldCheck size={32} />
      <h3>All clear here</h3>
      <p>No records match this queue or filter.</p>
    </div>
  );
}
function Pager({
  meta,
  setPage,
}: {
  meta: Page<unknown>["meta"];
  setPage: (p: number) => void;
}) {
  return (
    <div className="pager">
      <span>
        {meta.total} records · Page {meta.page} of {meta.totalPages}
      </span>
      <div>
        <button
          disabled={meta.page <= 1}
          onClick={() => setPage(meta.page - 1)}
        >
          Previous
        </button>
        <button
          disabled={meta.page >= meta.totalPages}
          onClick={() => setPage(meta.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
function useLoad<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    loader()
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(message(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loader, version]);
  return {
    data,
    setData,
    error,
    loading,
    reload: () => setVersion((v) => v + 1),
  };
}
function State({
  loading,
  error,
  retry,
  children,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
  children: ReactNode;
}) {
  return loading ? (
    <div className="empty" role="status">
      <RefreshCw className="spin" />
      Loading workspace…
    </div>
  ) : error ? (
    <div className="error" role="alert">
      {error}
      <button onClick={retry}>Retry</button>
    </div>
  ) : (
    <>{children}</>
  );
}
interface Decision {
  title: string;
  description: string;
  min?: number;
  submit: (note: string) => Promise<unknown>;
}
function DecisionModal({
  decision,
  close,
  done,
}: {
  decision: Decision;
  close: () => void;
  done: () => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => previous?.focus();
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await decision.submit(note.trim());
      done();
    } catch (e) {
      setError(message(e));
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) close();
      }}
    >
      <form onSubmit={submit}>
        <div className="section-head">
          <h2>{decision.title}</h2>
          <button
            type="button"
            aria-label="Close"
            disabled={busy}
            onClick={close}
          >
            <X size={18} />
          </button>
        </div>
        <p>{decision.description}</p>
        <label>
          Decision notes
          {(decision.min ?? 5) > 0 ? " (required)" : " (optional)"}
          <textarea
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            minLength={decision.min ?? 5}
            maxLength={500}
            required={(decision.min ?? 5) > 0}
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="actions">
          <button type="button" disabled={busy} onClick={close}>
            Cancel
          </button>
          <button
            className="primary"
            disabled={busy || note.trim().length < (decision.min ?? 5)}
          >
            {busy ? "Saving…" : "Confirm decision"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
function Login({ signedIn }: { signedIn: (u: Staff) => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const { user } = await api.login(
        String(f.get("email")),
        String(f.get("password")),
      );
      if (!["ADMIN", "APPRAISER"].includes(user.role)) {
        await api.logout();
        throw new Error(
          "This workspace is for administrators and appraisers. Use the marketplace to access your account.",
        );
      }
      signedIn(user);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login">
      <section className="login-story">
        <div className="brand">
          <Landmark /> collective<span>STAFF WORKSPACE</span>
        </div>
        <div>
          <span className="eyebrow">PRESERVING VALUE. BUILDING TRUST.</span>
          <h1>
            A trusted home
            <br />
            for timeless finds.
          </h1>
          <p>
            Protect Sri Lanka’s collecting community.
            <br />
            Every review makes the marketplace stronger.
          </p>
          <div className="coin">
            ශ්‍රී ලංකා<span>CEYLON · 1957</span>
          </div>
        </div>
        <small>Administration & expert verification</small>
      </section>
      <section className="login-form">
        <form onSubmit={submit}>
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Sign in to your workspace</h2>
          <p>Use your administrator or appraiser account.</p>
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="username"
              placeholder="you@marketplace.lk"
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
            <ArrowRight size={17} />
          </button>
          <small>
            Staff accounts are issued by your platform administrator.
          </small>
        </form>
      </section>
    </main>
  );
}
function Overview({
  analyticsOnly,
  go,
}: {
  analyticsOnly: boolean;
  go: (v: View) => void;
}) {
  const loader = useCallback(
    () => Promise.all([api.analytics(), api.audit()]),
    [],
  );
  const state = useLoad<[Analytics, Audit[]]>(loader);
  const a = state.data?.[0];
  const cards = a
    ? [
        ["Active listings", a.listings.active, "Currently on the marketplace"],
        [
          "Pending reviews",
          a.listings.underReview,
          "Awaiting a moderation decision",
        ],
        ["Open reports", a.moderation.openReports, "Flagged by the community"],
        [
          "Open disputes",
          a.moderation.openDisputes,
          "Transactions needing attention",
        ],
      ]
    : [];
  return (
    <State {...state} retry={state.reload}>
      {a && (
        <>
          <div className="stats">
            {cards.map(([title, value, sub]) => (
              <article key={title}>
                <span>{title}</span>
                <strong>{value}</strong>
                <small>{sub}</small>
              </article>
            ))}
          </div>
          {!analyticsOnly && (
            <section className="callout">
              <div>
                <span className="eyebrow">YOUR NEXT REVIEW MATTERS</span>
                <h2>Keep the collection moving.</h2>
                <p>
                  Review new submissions and help authentic collectibles find
                  their next keeper.
                </p>
              </div>
              <button className="primary" onClick={() => go("verification")}>
                Open review queue
                <ArrowRight size={16} />
              </button>
            </section>
          )}
          <div className="two-col">
            <section className="panel">
              <div className="section-head">
                <h2>Active listings by category</h2>
                <span className="subtle">Live snapshot</span>
              </div>
              {a.listings.byCategory.length ? (
                a.listings.byCategory.map((c) => (
                  <div className="chart-row" key={c.category}>
                    <div>
                      <span>{label(c.category)}</span>
                      <b>{c.count}</b>
                    </div>
                    <meter
                      min={0}
                      max={Math.max(
                        1,
                        ...a.listings.byCategory.map((x) => x.count),
                      )}
                      value={c.count}
                    >
                      {c.count}
                    </meter>
                  </div>
                ))
              ) : (
                <Empty />
              )}
            </section>
            <section className="panel">
              <h2>Marketplace at a glance</h2>
              {[
                ["Registered collectors", a.users.total],
                ["New users this month", a.users.newThisMonth],
                ["Suspended accounts", a.users.suspended],
                ["Live auctions", a.auctions.live],
                ["Completed sales", a.sales.completed],
                ["Gross sales value", money(a.sales.grossValue)],
              ].map(([k, v]) => (
                <div className="metric" key={k}>
                  <span>{k}</span>
                  <b>{v}</b>
                </div>
              ))}
              <p className="subtle">
                The API provides current totals; historical trend data is not
                available.
              </p>
            </section>
          </div>
          <section className="panel">
            <h2>Recent staff activity</h2>
            {state.data?.[1].length ? (
              state.data[1].map((log) => (
                <div className="activity" key={log.id}>
                  <span className="activity-icon">
                    <Check size={16} />
                  </span>
                  <div>
                    <b>{label(log.action)}</b>
                    <small>
                      {log.actor?.name || "System"} · {log.entityType}
                    </small>
                  </div>
                  <time>{new Date(log.createdAt).toLocaleString()}</time>
                </div>
              ))
            ) : (
              <Empty />
            )}
          </section>
        </>
      )}
    </State>
  );
}
function UsersPage({
  decide,
  revision,
}: {
  decide: (d: Decision) => void;
  revision: number;
}) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const loader = useCallback(
    () => api.users(page, search, status),
    [page, search, status, revision],
  );
  const state = useLoad(loader);
  return (
    <>
      <div className="toolbar">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(q);
            setPage(1);
          }}
        >
          <Search size={18} />
          <input
            aria-label="Search users"
            placeholder="Search name or email…"
            value={q}
            maxLength={100}
            onChange={(e) => setQ(e.target.value)}
          />
          <button>Search</button>
        </form>
        <select
          aria-label="Account status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All account statuses</option>
          {["ACTIVE", "SUSPENDED", "PENDING_VERIFICATION"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      <State {...state} retry={state.reload}>
        <section className="panel table-panel">
          {state.data?.data.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Collector</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {state.data.data.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <b>{u.name}</b>
                        <small>{u.email}</small>
                      </td>
                      <td>{label(u.role)}</td>
                      <td>
                        <Badge value={u.status} />
                      </td>
                      <td>
                        {u.createdAt &&
                          new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        {u.role !== "ADMIN" && (
                          <button
                            onClick={() =>
                              decide(
                                u.status === "SUSPENDED"
                                  ? {
                                      title: "Reinstate account",
                                      description: `${u.name} will regain access. Removed listings remain removed.`,
                                      min: 0,
                                      submit: () => api.reinstate(u.id),
                                    }
                                  : {
                                      title: "Suspend account",
                                      description: `${u.name} will lose access immediately and their active listings will be removed.`,
                                      min: 10,
                                      submit: (note) => api.suspend(u.id, note),
                                    },
                              )
                            }
                          >
                            {u.status === "SUSPENDED" ? "Reinstate" : "Suspend"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty />
          )}
          {state.data && <Pager meta={state.data.meta} setPage={setPage} />}
        </section>
      </State>
    </>
  );
}
function VerificationHistory({ listingId }: { listingId: string }) {
  const loader = useCallback(
    () => api.verificationHistory(listingId),
    [listingId],
  );
  const state = useLoad(loader);
  return (
    <section
      className="history"
      aria-label="Appraisal and verification history"
    >
      <h3>Appraisal & verification history</h3>
      <p className="subtle">
        Expert valuations are recorded separately from the seller's price and
        auction bids.
      </p>
      <State {...state} retry={state.reload}>
        {state.data?.length ? (
          state.data.map((record) => (
            <article className="history" key={record.id}>
              <Badge value={record.decision} />
              <div className="metric">
                <span>Appraised value</span>
                <b>
                  {record.appraisedValue != null
                    ? money(record.appraisedValue)
                    : "Not provided"}
                </b>
              </div>
              {record.comments && <p>{record.comments}</p>}
              {record.certificate && (
                <small>Certificate: {record.certificate.fileName}</small>
              )}
              <small>
                {record.appraiser.name} ?{" "}
                {new Date(record.verifiedAt).toLocaleString()}
              </small>
            </article>
          ))
        ) : (
          <p className="subtle">No expert decisions recorded yet.</p>
        )}
      </State>
    </section>
  );
}
function ListingsPage({
  verification,
  decide,
  revision,
}: {
  verification: boolean;
  decide: (d: Decision) => void;
  revision: number;
}) {
  const [page, setPage] = useState(1);
  const [review, setReview] = useState(true);
  const [selected, setSelected] = useState<Listing>();
  const [certificateId, setCertificateId] = useState("");
  const [value, setValue] = useState("");
  const loader = useCallback(
    () => api.listings(page, verification || review),
    [page, verification, review, revision],
  );
  const state = useLoad(loader);
  useEffect(() => {
    setSelected(undefined);
    setCertificateId("");
    setValue("");
  }, [page, review, revision]);
  function action(item: Listing, result: string) {
    const expert = verification;
    decide({
      title: label(result),
      description: expert
        ? `Record an expert decision for ?${item.title}?. Approval publishes the listing with a verified badge.`
        : `Change the marketplace status of ?${item.title}?. Approved listings leave Pending review and remain in Published listings. Moderation approval does not grant an authenticity badge.`,
      min: result === "ACTIVE" || result === "APPROVED" ? 0 : 5,
      submit: async (note) => {
        const response = expert
          ? await api.verify(item.id, {
              decision: result,
              comments: note,
              ...(certificateId ? { certificateId } : {}),
              ...(value ? { appraisedValue: Number(value) } : {}),
            })
          : await api.moderate(item.id, result, note);
        const leavesQueue =
          (verification || review) &&
          !["UNDER_REVIEW", "MORE_EVIDENCE_REQUESTED"].includes(result);
        if (leavesQueue) {
          state.setData((current) => {
            if (!current || !current.data.some((row) => row.id === item.id))
              return current;
            const total = current.meta.total - 1;
            return {
              data: current.data.filter((row) => row.id !== item.id),
              meta: {
                ...current.meta,
                total,
                totalPages: Math.max(1, Math.ceil(total / current.meta.limit)),
              },
            };
          });
          if (state.data?.data.length === 1 && page > 1) setPage(page - 1);
        }
        setSelected(undefined);
        return response;
      },
    });
  }

  return (
    <>
      {!verification && (
        <div className="tabs">
          <button
            className={review ? "selected" : ""}
            onClick={() => {
              setReview(true);
              setPage(1);
            }}
          >
            Pending review
          </button>
          <button
            className={!review ? "selected" : ""}
            onClick={() => {
              setReview(false);
              setPage(1);
            }}
          >
            Published listings
          </button>
        </div>
      )}
      {!verification && (
        <p className="subtle" role="status">
          {review
            ? "Only listings awaiting review appear here. Approved listings move to Published listings."
            : "These listings have already been published (active or sold). They are not awaiting approval."}
        </p>
      )}
      <State {...state} retry={state.reload}>
        <div className={selected ? "review-layout" : ""}>
          <section className="panel">
            {state.data?.data.length ? (
              state.data.data.map((item) => (
                <button
                  className={`listing-row ${selected?.id === item.id ? "chosen" : ""}`}
                  key={item.id}
                  onClick={() => {
                    setSelected(item);
                    setCertificateId("");
                    setValue("");
                    if (!verification && !review)
                      api
                        .listing(item.id)
                        .then(setSelected)
                        .catch((e) =>
                          decide({
                            title: "Unable to load details",
                            description: message(e),
                            min: 0,
                            submit: () =>
                              api.listing(item.id).then(setSelected),
                          }),
                        );
                  }}
                >
                  <span className="item-thumb">
                    {item.images[0] ? (
                      <img src={safeUrl(item.images[0].url)} alt="" />
                    ) : (
                      <Landmark />
                    )}
                  </span>
                  <span>
                    <b>{item.title}</b>
                    <small>
                      {label(item.category)} · {item.seller.name}
                    </small>
                  </span>
                  <span className="row-price">
                    {money(item.startingPrice)}
                    <small>View details →</small>
                  </span>
                </button>
              ))
            ) : (
              <Empty />
            )}
            {state.data && <Pager meta={state.data.meta} setPage={setPage} />}
          </section>
          {selected && (
            <section className="panel detail">
              <div className="section-head">
                <span className="eyebrow">
                  {verification ? "EXPERT REVIEW" : "LISTING DETAILS"}
                </span>
                <button
                  aria-label="Close details"
                  onClick={() => setSelected(undefined)}
                >
                  <X size={16} />
                </button>
              </div>
              <h2>{selected.title}</h2>
              <p>{selected.description}</p>
              <div className="gallery">
                {selected.images.map((i) => (
                  <a
                    key={i.url}
                    href={safeUrl(i.url)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img src={safeUrl(i.url)} alt={selected.title} />
                  </a>
                ))}
              </div>
              <p>
                {label(selected.condition)} · {money(selected.startingPrice)}
              </p>
              <p>Seller: {selected.seller.name}</p>
              <Badge value={selected.status || "UNDER_REVIEW"} />
              {verification && (
                <>
                  <h3>Supporting certificates</h3>
                  {selected.certificates?.length ? (
                    <>
                      <label>
                        Certificate to associate
                        <select
                          value={certificateId}
                          onChange={(e) => setCertificateId(e.target.value)}
                        >
                          <option value="">Listing decision only</option>
                          {selected.certificates.map((c) => (
                            <option value={c.id} key={c.id}>
                              {c.fileName}
                            </option>
                          ))}
                        </select>
                      </label>
                      {selected.certificates.map((c) => (
                        <p key={c.id}>
                          <a
                            href={safeUrl(c.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {c.fileName} ↗
                          </a>
                          <small>
                            {c.issuer || "Issuer not provided"} ·{" "}
                            {label(c.status)}
                          </small>
                        </p>
                      ))}
                    </>
                  ) : (
                    <p className="subtle">
                      No certificates attached. Request evidence if needed.
                    </p>
                  )}
                  <label>
                    Appraised value (LKR, optional)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  </label>
                </>
              )}
              <VerificationHistory key={selected.id} listingId={selected.id} />
              <div className="actions wrap">
                {(verification
                  ? ["APPROVED", "REJECTED", "MORE_EVIDENCE_REQUESTED"]
                  : ["ACTIVE", "REMOVED", "UNDER_REVIEW"]
                ).map((s, i) => (
                  <button
                    className={i === 0 ? "primary" : ""}
                    disabled={
                      (!verification &&
                        selected.status === "ACTIVE" &&
                        s === "ACTIVE") ||
                      (!verification &&
                        selected.status === "SOLD" &&
                        s !== "REMOVED") ||
                      (verification &&
                        !!value &&
                        (!Number.isFinite(Number(value)) ||
                          Number(value) < 0 ||
                          !/^\d+(\.\d{1,2})?$/.test(value)))
                    }
                    key={s}
                    onClick={() => action(selected, s)}
                  >
                    {verification
                      ? ["Approve", "Reject", "Request evidence"][i]
                      : ["Approve", "Remove", "Flag for review"][i]}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </State>
    </>
  );
}
function safeUrl(url: string) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol)
      ? parsed.href
      : undefined;
  } catch {
    return undefined;
  }
}
function CasesPage({
  kind,
  decide,
  revision,
}: {
  kind: "reports" | "disputes";
  decide: (d: Decision) => void;
  revision: number;
}) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [orderAction, setOrderAction] = useState("NONE");
  const reports = kind === "reports";
  const loader = useCallback(
    () => (reports ? api.reports(page, status) : api.disputes(page, status)),
    [reports, page, status, revision],
  );
  const state = useLoad<Page<Report> | Page<Dispute>>(loader);
  return (
    <>
      <div className="toolbar">
        <span className="subtle">Oldest cases first</span>
        <select
          aria-label="Case status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Awaiting action</option>
          {(reports
            ? ["OPEN", "REVIEWING", "ACTIONED", "DISMISSED"]
            : ["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"]
          ).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <State {...state} retry={state.reload}>
        <div className="case-grid">
          {state.data?.data.length ? (
            state.data.data.map((row) => {
              const r = row as Report;
              const d = row as Dispute;
              const closed = [
                "ACTIONED",
                "DISMISSED",
                "RESOLVED",
                "REJECTED",
              ].includes(row.status);
              return (
                <section className="panel" key={row.id}>
                  <div className="section-head">
                    <span className="eyebrow">CASE {row.id.slice(0, 8)}</span>
                    <Badge value={row.status} />
                  </div>
                  <h2>
                    {reports
                      ? r.reportedListing?.title ||
                        r.reportedUser?.name ||
                        "Reported content"
                      : d.order.listing.title}
                  </h2>
                  <p>{row.reason}</p>
                  <p>{reports ? r.details : d.details}</p>
                  {reports ? (
                    <p className="subtle">
                      Reported by {r.reporter.name}. Target status:{" "}
                      {label(
                        r.reportedListing?.status || r.reportedUser?.status,
                      )}
                      . Actioning a report records its outcome; use listing or
                      user management to apply moderation.
                    </p>
                  ) : (
                    <>
                      <p>
                        Buyer: {d.order.buyer.name}
                        <br />
                        Seller: {d.order.seller.name}
                        <br />
                        Raised by: {d.raisedBy.name}
                      </p>
                      <p>
                        {money(d.order.amount)} · Order {label(d.order.status)}
                        <br />
                        Payment: {label(d.order.payment?.status)}
                      </p>
                      {!closed && (
                        <label>
                          Order outcome on resolution
                          <select
                            value={orderAction}
                            onChange={(e) => setOrderAction(e.target.value)}
                          >
                            <option value="NONE">Record decision only</option>
                            <option value="REFUND_BUYER">
                              Mark buyer refund in records
                            </option>
                            <option value="COMPLETE_ORDER">
                              Complete order for seller
                            </option>
                          </select>
                          <small>
                            A refund updates records; funds must be returned
                            through the payment provider.
                          </small>
                        </label>
                      )}
                    </>
                  )}
                  {!closed && (
                    <div className="actions">
                      {(reports
                        ? ["ACTIONED", "DISMISSED"]
                        : ["RESOLVED", "REJECTED"]
                      ).map((s) => (
                        <button
                          key={s}
                          onClick={() =>
                            decide({
                              title: label(s),
                              description: reports
                                ? "Record the report outcome and the action you have taken."
                                : `Record the dispute outcome. Order action: ${s === "RESOLVED" ? label(orderAction) : "none"}.`,
                              submit: (note) =>
                                reports
                                  ? api.resolveReport(row.id, s, note)
                                  : api.resolveDispute(
                                      row.id,
                                      s,
                                      note,
                                      orderAction,
                                    ),
                            })
                          }
                        >
                          {label(s)}
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              );
            })
          ) : (
            <Empty />
          )}
        </div>
        {state.data && <Pager meta={state.data.meta} setPage={setPage} />}
      </State>
    </>
  );
}
export default function App() {
  const [user, setUser] = useState<Staff>();
  const [boot, setBoot] = useState(true);
  const [view, setView] = useState<View>(() => {
    const v = window.location.hash.slice(1);
    return navigation.some((n) => n[0] === v) ? (v as View) : "dashboard";
  });
  const [decision, setDecision] = useState<Decision>();
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    api
      .me()
      .then((u) => {
        if (["ADMIN", "APPRAISER"].includes(u.role)) setUser(u);
      })
      .catch(() => {})
      .finally(() => setBoot(false));
    const expire = () => {
      setUser(undefined);
      setDecision(undefined);
    };
    window.addEventListener("session-expired", expire);
    return () => window.removeEventListener("session-expired", expire);
  }, []);
  useEffect(() => {
    const change = () => {
      const v = location.hash.slice(1);
      if (navigation.some((n) => n[0] === v)) setView(v as View);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 5000);
      return () => clearTimeout(t);
    }
  }, [notice]);
  const go = (v: View) => {
    setView(v);
    location.hash = v;
    setMobile(false);
  };
  if (boot)
    return (
      <div className="empty" role="status">
        Connecting to your workspace…
      </div>
    );
  if (!user)
    return (
      <Login
        signedIn={(u) => {
          setUser(u);
          go(u.role === "APPRAISER" ? "verification" : "dashboard");
        }}
      />
    );
  const current = user.role === "APPRAISER" ? "verification" : view;
  return (
    <div className="workspace">
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <a className="brand" href="#dashboard">
          <Landmark />
          collective<span>STAFF WORKSPACE</span>
        </a>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          {navigation
            .filter((n) => user.role === "ADMIN" || n[0] === "verification")
            .map(([id, title, Icon]) => (
              <a
                className={current === id ? "active" : ""}
                key={id}
                href={`#${id}`}
                onClick={() => go(id)}
              >
                <Icon size={18} />
                {title}
              </a>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <ShieldCheck size={23} />
          <p>
            A little care.
            <br />A lot of trust.
          </p>
          <small>Sri Lankan Collectible Marketplace</small>
        </div>
      </aside>
      <div className="main">
        <header>
          <button
            className="mobile-toggle"
            aria-label="Toggle navigation"
            onClick={() => setMobile(!mobile)}
          >
            <Menu />
          </button>
          <span>
            Marketplace <span className="subtle">/ Staff workspace</span>
          </span>
          <div className="profile">
            <span className="avatar">
              {(user.name || user.email).slice(0, 1).toUpperCase()}
            </span>
            <span>
              <b>{user.name || user.email}</b>
              <small>{label(user.role)}</small>
            </span>
            <button
              title="Sign out"
              aria-label="Sign out"
              onClick={async () => {
                try {
                  await api.logout();
                  setUser(undefined);
                } catch (e) {
                  setNotice(message(e));
                }
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">COLLECTIVE · TRUST & OPERATIONS</span>
              <h1>{navigation.find((n) => n[0] === current)?.[1]}</h1>
              <p>
                {current === "dashboard"
                  ? "A clear view of your marketplace, and what needs your attention."
                  : current === "verification"
                    ? "Inspect the evidence. Record a decision. Protect the collection."
                    : "Manage marketplace activity with care and a clear record."}
              </p>
            </div>
            <button onClick={() => setRevision((v) => v + 1)}>
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
          {notice && (
            <div className="notice" role="status">
              {notice}
            </div>
          )}
          <div key={current}>
            {current === "dashboard" || current === "analytics" ? (
              <Overview
                key={revision}
                analyticsOnly={current === "analytics"}
                go={go}
              />
            ) : current === "users" ? (
              <UsersPage decide={setDecision} revision={revision} />
            ) : current === "listings" || current === "verification" ? (
              <ListingsPage
                verification={current === "verification"}
                decide={setDecision}
                revision={revision}
              />
            ) : (
              <CasesPage
                kind={current}
                decide={setDecision}
                revision={revision}
              />
            )}
          </div>
          <footer>
            Collective staff workspace
            <span>Thoughtful reviews. A trusted marketplace.</span>
          </footer>
        </main>
      </div>
      {decision && (
        <DecisionModal
          decision={decision}
          close={() => setDecision(undefined)}
          done={() => {
            setDecision(undefined);
            setRevision((v) => v + 1);
            setNotice("Decision saved successfully.");
          }}
        />
      )}
    </div>
  );
}
