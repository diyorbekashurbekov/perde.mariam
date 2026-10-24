import { useCallback, useEffect, useState, type ReactNode } from "react"
import { collections } from "@/data"
import { AccessError, AuthError, CLIENT_ID, RANGES, clearToken, loadLive, loadStats, savedToken, signIn, signOut, type Live, type RangeKey, type Stats } from "./ga"
import { BarChart, Donut, Empty, LineChart, Share } from "./charts"
import { DEVICE, SOURCE, city, dayMonth, fmt, pct } from "./labels"
import { CollectionsPage, ConnectCard, EditorProvider, FabricsPage, InfoPage, PhotosPage, ReviewsPage, SaveBar } from "./Editor"

type Page = "home" | "requests" | "catalog" | "visitors" | "photos" | "fabrics" | "collections" | "reviews" | "info" | "site"
const EDIT_PAGES: Page[] = ["photos", "fabrics", "collections", "reviews", "info", "site"]
const STAT_PAGES: Page[] = ["requests", "catalog", "visitors"]
type Group = "Статистика" | "Сайтты басқару"
// tint — iOS «Баптаулар»-дағыдай түрлі түсті белгіше-шаршының түсі.
const PAGES: { key: Page; label: string; icon: ReactNode; group: Group; tint: string }[] = [
  { key: "home", label: "Басты бет", group: "Статистика", tint: "#34C759", icon: <path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10" /> },
  { key: "requests", label: "Өтінімдер", group: "Статистика", tint: "#25A65A", icon: <path d="M20 11.6a8 8 0 0 1-11.8 7L4 20l1.4-4A8 8 0 1 1 20 11.6Z" /> },
  { key: "catalog", label: "Каталог", group: "Статистика", tint: "#FF9500", icon: <path d="M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z" /> },
  { key: "visitors", label: "Келушілер", group: "Статистика", tint: "#5856D6", icon: <path d="M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.8a3.4 3.4 0 0 1 0 6.4M18.5 14.8c1.6.8 2.6 2.6 3 5.2" /> },
  { key: "photos", label: "Каталог фотолары", group: "Сайтты басқару", tint: "#FF2D55", icon: <path d="M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.5a1.5 1.5 0 1 0 0-.01" /> },
  { key: "fabrics", label: "Маталар мен бағалар", group: "Сайтты басқару", tint: "#AF52DE", icon: <path d="M3.5 12V4.5h7.5l9.5 9.5-7.5 7.5L3.5 12ZM8 8.5a.5.5 0 1 0 0-.01" /> },
  { key: "collections", label: "Коллекциялар", group: "Сайтты басқару", tint: "#007AFF", icon: <path d="M4 7h16M4 12h16M4 17h10" /> },
  { key: "reviews", label: "Пікірлер", group: "Сайтты басқару", tint: "#FF9F0A", icon: <path d="M7 9h10M7 13h6M5 4h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4 3v-3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" /> },
  { key: "info", label: "Ақпарат пен мәтін", group: "Сайтты басқару", tint: "#8E8E93", icon: <path d="M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17ZM12 11v6M12 7.5v.01" /> },
]
const GROUPS: Group[] = ["Статистика", "Сайтты басқару"]
// Телефондағы төменгі таб-бар
const TABS: { key: "home" | "stats" | "site"; label: string; to: Page; icon: ReactNode }[] = [
  { key: "home", label: "Басты", to: "home", icon: <path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10" /> },
  { key: "stats", label: "Статистика", to: "requests", icon: <path d="M5 20V11M12 20V5M19 20v-6" /> },
  { key: "site", label: "Сайт", to: "site", icon: <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" /> },
]

const CITY_NOTE = "Қаланы Google интернет мекенжайы (IP) бойынша анықтайды. Мобильді интернетте (Beeline, Kcell, Tele2, Altel) көрші үлкен қала көрсетілуі немесе қала анықталмауы жиі болады — мысалы, Түркістан Шымкент болып көрінуі мүмкін."
const SITE_URL = "https://diyorbekashurbekov.github.io/perde.mariam/"
const thumbOf = (src: string) => src.replace(/\.webp$/, "-480.webp")
const photoSrc = (key: string) => `${import.meta.env.BASE_URL}photos/${key}-480.webp`
const COLLECTION_THUMB = Object.fromEntries(collections.map((c) => [c.title, thumbOf(c.src)]))

function Icon({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>
}

function readPage(): Page {
  const h = location.hash.slice(1) as Page
  return h === "site" || PAGES.some((p) => p.key === h) ? h : "home"
}
function readRange(): RangeKey {
  try {
    const r = localStorage.getItem("pm-admin-range") as RangeKey | null
    return r && RANGES.some((x) => x.key === r) ? r : "7d"
  } catch {
    return "7d"
  }
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => savedToken())
  const [page, setPage] = useState<Page>(readPage)
  const [range, setRange] = useState<RangeKey>(readRange)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ kind: "access" | "other"; text: string } | null>(null)
  const [signingIn, setSigningIn] = useState(false)
  const [live, setLive] = useState<Live | null>(null)

  useEffect(() => {
    const on = () => setPage(readPage())
    window.addEventListener("hashchange", on)
    return () => window.removeEventListener("hashchange", on)
  }, [])

  const login = useCallback(async () => {
    setSigningIn(true)
    setError(null)
    try {
      setToken(await signIn("select_account"))
    } catch (e) {
      setError({ kind: "other", text: (e as Error).message })
    } finally {
      setSigningIn(false)
    }
  }, [])

  const logout = useCallback(() => {
    signOut()
    setToken(null)
    setStats(null)
  }, [])

  const load = useCallback(async (t: string, r: RangeKey, retry = true): Promise<void> => {
    setLoading(true)
    try {
      setStats(await loadStats(t, r))
      setError(null)
    } catch (e) {
      if (e instanceof AuthError && retry) {
        clearToken()
        try {
          const nt = await signIn("")
          setToken(nt)
          return load(nt, r, false)
        } catch {
          setToken(null)
        }
      } else if (e instanceof AccessError) setError({ kind: "access", text: e.message })
      else setError({ kind: "other", text: (e as Error).message || "Белгісіз қате" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (token) load(token, range)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, range])

  // «Қазір сайтта» блогы әр 30 секунд сайын жаңарады (GA4 тікелей есебі, соңғы 30 минут).
  useEffect(() => {
    if (!token) return
    let stop = false
    const tick = () => { if (document.visibilityState === "visible") loadLive(token).then((l) => { if (!stop) setLive(l) }).catch(() => {}) }
    tick()
    const id = setInterval(tick, 30_000)
    const onVis = () => { if (document.visibilityState === "visible") tick() }
    document.addEventListener("visibilitychange", onVis)
    return () => { stop = true; clearInterval(id); document.removeEventListener("visibilitychange", onVis) }
  }, [token])

  // Бет ашық тұрғанда әр 5 минут сайын өзі жаңарады.
  useEffect(() => {
    if (!token) return
    const id = setInterval(() => { if (document.visibilityState === "visible") load(token, range) }, 5 * 60_000)
    return () => clearInterval(id)
  }, [token, range, load])

  const go = (p: Page) => {
    location.hash = p
    setPage(p)
    window.scrollTo(0, 0)
  }
  const pickRange = (r: RangeKey) => {
    setRange(r)
    try { localStorage.setItem("pm-admin-range", r) } catch { /* ignore */ }
  }

  if (!CLIENT_ID) return <Gate title="Кіру әлі бапталмаған" text="Админ панельге Google арқылы кіру үшін GitHub-та GOOGLE_CLIENT_ID айнымалысы қосылуы керек." />
  if (!token) return <Gate title="Админ панель" text="Статистиканы көру үшін GA4-ке рұқсаты бар Google аккаунтымен кіріңіз." action={<button className="btn primary" onClick={login} disabled={signingIn}>{signingIn ? "Кіру…" : "Google арқылы кіру"}</button>} error={error?.text} />

  const title = page === "site" ? "Сайт" : PAGES.find((p) => p.key === page)!.label
  const editing = EDIT_PAGES.includes(page)
  const tab = page === "home" ? "home" : STAT_PAGES.includes(page) ? "stats" : "site"
  return (
    <EditorProvider>
    <div className="app">
      <aside className="side">
        <div className="logo"><div className="mark">PM</div><div><b>Perde Mariam</b><span>Админ панель</span></div></div>
        <nav className="nav" aria-label="Бөлімдер">
          {GROUPS.map((g) => (
            <div className="nav-sec" key={g}>
              <span className="nav-group">{g}</span>
              <div className="nav-list">
                {PAGES.filter((p) => p.group === g).map((p) => (
                  <button key={p.key} onClick={() => go(p.key)} aria-current={page === p.key ? "page" : undefined}><span className="tile" style={{ background: p.tint }}><Icon>{p.icon}</Icon></span>{p.label}</button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <span className="ga"><i />GA4-пен байланыс бар</span>
          <a href={SITE_URL} target="_blank" rel="noreferrer">Сайтты ашу ↗</a>
          <button className="linkish" onClick={logout}>Шығу</button>
        </div>
      </aside>

      <main>
        <div className="top">
          {editing && page !== "site" && <button className="back" onClick={() => go("site")}><Icon><path d="M15 5l-7 7 7 7" /></Icon>Сайт</button>}
          <h1>{title}</h1>
          <div className="top-right">
            {page === "site" ? null : editing ? (
              <a className="pill" href={SITE_URL} target="_blank" rel="noreferrer">Сайтты ашу ↗</a>
            ) : (
              <>
                <div className="seg" role="group" aria-label="Кезең">
                  {RANGES.map((r) => <button key={r.key} aria-pressed={range === r.key} onClick={() => pickRange(r.key)}>{r.label}</button>)}
                </div>
                <button className="pill" onClick={() => load(token, range)} disabled={loading} title="Қазір жаңарту">
                  <Icon><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5" /></Icon>
                  {loading ? "Жүктелуде…" : stats ? `Жаңартылды ${new Date(stats.fetchedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : "Жаңарту"}
                </button>
              </>
            )}
          </div>
        </div>

        {STAT_PAGES.includes(page) && (
          <div className="seg seg-wide only-m" role="group" aria-label="Статистика бөлімі">
            {STAT_PAGES.map((k) => <button key={k} aria-pressed={page === k} onClick={() => go(k)}>{PAGES.find((p) => p.key === k)!.label}</button>)}
          </div>
        )}

        {error && !editing && (
          <div className="alert">
            <p><b>{error.kind === "access" ? "Рұқсат жоқ." : "Деректер жүктелмеді."}</b> {error.text}</p>
            <div className="alert-actions">
              <button className="btn" onClick={() => load(token, range)}>Қайталау</button>
              {error.kind === "access" && <button className="btn" onClick={logout}>Басқа аккаунтпен кіру</button>}
            </div>
          </div>
        )}

        {page === "site" ? <SiteMenu go={go} logout={logout} />
          : page === "photos" ? <PhotosPage />
          : page === "fabrics" ? <FabricsPage />
          : page === "collections" ? <CollectionsPage />
          : page === "reviews" ? <ReviewsPage />
          : page === "info" ? <InfoPage />
          : !stats ? (
          <div className="card"><Empty>{loading ? "GA4-тен деректер жүктелуде…" : "Деректер әлі жүктелмеді"}</Empty></div>
        ) : (
          <>
            <PeriodNote stats={stats} />
            {page === "home" && <LiveCard live={live} />}
            {page === "home" && <Home s={stats} go={go} />}
            {page === "requests" && <Requests s={stats} />}
            {page === "catalog" && <Catalog s={stats} />}
            {page === "visitors" && <Visitors s={stats} />}
          </>
        )}
      </main>
      <SaveBar />
      <nav className="tabbar" aria-label="Негізгі бөлімдер">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => go(t.to)} aria-current={tab === t.key ? "page" : undefined}><Icon>{t.icon}</Icon>{t.label}</button>
        ))}
      </nav>
    </div>
    </EditorProvider>
  )
}

// Телефондағы «Сайт» беті: iOS «Баптаулар» сияқты тізім.
function SiteMenu({ go, logout }: { go: (p: Page) => void; logout: () => void }) {
  const chev = <svg className="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
  return (
    <div className="page">
      <ConnectCard />
      <span className="ios-head">Сайтты басқару</span>
      <div className="ios-group">
        {PAGES.filter((p) => p.group === "Сайтты басқару").map((p) => (
          <button key={p.key} className="ios-row" onClick={() => go(p.key)}>
            <span className="tile" style={{ background: p.tint }}><Icon>{p.icon}</Icon></span>
            <span>{p.label}</span>
            {chev}
          </button>
        ))}
      </div>
      <div className="ios-group">
        <a className="ios-row" href={SITE_URL} target="_blank" rel="noreferrer">
          <span className="tile" style={{ background: "#007AFF" }}><Icon><path d="M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17ZM3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5S9.7 5.9 12 3.5Z" /></Icon></span>
          <span>Сайтты ашу</span>
          {chev}
        </a>
      </div>
      <div className="ios-group">
        <button className="ios-row danger" onClick={logout}>Шығу</button>
      </div>
      <p className="ios-foot">GA4-пен байланыс бар · өзгерістер «Сайтқа шығару» батырмасымен сақталады</p>
    </div>
  )
}

function Gate({ title, text, action, error }: { title: string; text: string; action?: ReactNode; error?: string }) {
  return (
    <div className="gate">
      <div className="gate-card">
        <div className="mark big">PM</div>
        <h1>{title}</h1>
        <p>{text}</p>
        {action}
        {error && <p className="gate-err">{error}</p>}
        <a href={SITE_URL}>← Сайтқа оралу</a>
      </div>
    </div>
  )
}

function PeriodNote({ stats }: { stats: Stats }) {
  const p = stats.period
  return (
    <div className="period">
      <span>{p.from === p.to ? dayMonth(p.from) : `${dayMonth(p.from)} – ${dayMonth(p.to)}`}</span>
      <span className="muted">Бүгінгі сандар GA4-те бірнеше сағат кешігіп толуы мүмкін.</span>
    </div>
  )
}

/* ---------- Беттер ---------- */

function Kpi({ label, value, icon, tone, cur, prev }: { label: string; value: string; icon: ReactNode; tone: string; cur?: number; prev?: number | null }) {
  let delta: ReactNode = null
  if (prev != null && cur != null) {
    if (prev > 0) {
      const ch = ((cur - prev) / prev) * 100
      delta = <><b className={ch >= 0 ? "up" : "down"}>{ch >= 0 ? "+" : ""}{pct(ch)}</b>алдыңғы кезеңмен салыстырғанда</>
    } else delta = "алдыңғы кезеңде дерек жоқ"
  }
  return (
    <div className="kpi">
      <span className="lab">{label}</span>
      <span className="val">{value}</span>
      <span className={`ico ${tone}`}><Icon>{icon}</Icon></span>
      {delta && <span className="delta">{delta}</span>}
    </div>
  )
}

const ICONS = {
  wa: <path d="M20 11.6a8 8 0 0 1-11.8 7L4 20l1.4-4A8 8 0 1 1 20 11.6Z" />,
  user: <path d="M12 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6" />,
  grid: <path d="M3.5 3.5h7v7h-7zM13.5 3.5h7v7h-7zM3.5 13.5h7v7h-7zM13.5 13.5h7v7h-7z" />,
  trend: <path d="M4 16.5 9.5 11l4 4L20 8.5M15 8.5h5v5" />,
  eye: <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12ZM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
}

function Kpis({ s }: { s: Stats }) {
  const t = s.totals, p = s.prev
  const conv = t.users ? (t.whatsapp / t.users) * 100 : 0
  return (
    <div className="kpis">
      <Kpi label="WhatsApp өтінімдері" value={fmt(t.whatsapp)} icon={ICONS.wa} tone="t-em" cur={t.whatsapp} prev={p?.whatsapp ?? null} />
      <Kpi label="Келушілер" value={fmt(t.users)} icon={ICONS.user} tone="t-gold" cur={t.users} prev={p?.users ?? null} />
      <Kpi label="Каталог ашылды" value={fmt(t.catalog)} icon={ICONS.grid} tone="t-clay" cur={t.catalog} prev={p?.catalog ?? null} />
      <Kpi label="Конверсия" value={t.users ? pct(conv) : "—"} icon={ICONS.trend} tone="t-sage" cur={conv} prev={p && p.users ? (p.whatsapp / p.users) * 100 : p ? 0 : null} />
    </div>
  )
}

function Card({ title, note, children, more }: { title: string; note?: string; children: ReactNode; more?: ReactNode }) {
  return (
    <section className="card">
      <div className="card-h"><h2>{title}</h2>{note && <span className="note">{note}</span>}</div>
      {children}
      {more}
    </section>
  )
}

type Col<R> = { h: string; n?: boolean; v: (r: R) => ReactNode }
function Table<R>({ cols, rows, foot }: { cols: Col<R>[]; rows: R[]; foot?: ReactNode[] }) {
  if (!rows.length) return <Empty />
  return (
    <div className="tw">
      <table>
        <thead><tr>{cols.map((c) => <th key={c.h} className={c.n ? "n" : undefined}>{c.h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{cols.map((c) => <td key={c.h} className={c.n ? "n" : undefined}>{c.v(r)}</td>)}</tr>)}</tbody>
        {foot && <tfoot><tr>{foot.map((f, i) => <td key={i} className={cols[i].n ? "n" : undefined}>{f}</td>)}</tr></tfoot>}
      </table>
    </div>
  )
}

const sorted = <R,>(rows: R[], k: keyof R) => rows.filter((r) => Number(r[k]) > 0).sort((a, b) => Number(b[k]) - Number(a[k]))
const total = <R,>(rows: R[], k: keyof R) => rows.reduce((s, r) => s + Number(r[k]), 0)
const Thumb = ({ src, label }: { src?: string; label: string }) => (
  <span className="cell">{src && <img className="thumb" src={src} alt="" loading="lazy" />}<span>{label}</span></span>
)

function SourceTable({ rows, unit }: { rows: { key: string; count: number }[]; unit: string }) {
  const r = sorted(rows, "count"), t = total(r, "count")
  return <Table cols={[{ h: "Қай жерден", v: (x) => SOURCE[x.key] ?? x.key }, { h: unit, n: true, v: (x) => fmt(x.count) }, { h: "Үлесі", n: true, v: (x) => <Share v={x.count} total={t} /> }]} rows={r} foot={r.length > 1 ? ["Барлығы", fmt(t), "100%"] : undefined} />
}
function CollectionTable({ rows }: { rows: Stats["collections"] }) {
  const r = sorted(rows, "count"), t = total(r, "count")
  return <Table cols={[{ h: "Коллекция", v: (x) => <Thumb src={COLLECTION_THUMB[x.name]} label={x.name} /> }, { h: "Өтінім", n: true, v: (x) => fmt(x.count) }, { h: "Үлесі", n: true, v: (x) => <Share v={x.count} total={t} /> }]} rows={r} />
}
const devicesOf = (s: Stats) => s.devices.map((d) => ({ label: DEVICE[d.key] ?? d.key, v: d.users }))

function Home({ s, go }: { s: Stats; go: (p: Page) => void }) {
  return (
    <div className="page">
      <Kpis s={s} />
      <div className="row2">
        <Card title="Қалалар бойынша келушілер" note="шамамен, интернет бойынша"><BarChart label="Қалалар бойынша келушілер" rows={sorted(s.cities, "users").map((c) => ({ label: city(c.name), v: c.users }))} /></Card>
        <Card title="Күн сайынғы динамика" note="келушілер мен өтінімдер"><LineChart rows={s.daily} series={[{ key: "users", color: "var(--emerald)", label: "Келушілер" }, { key: "whatsapp", color: "var(--gold)", label: "Өтінімдер" }]} /></Card>
      </div>
      <div className="row3">
        <Card title="Қай батырмадан жазды" note="WhatsApp өтінімдері" more={<button className="more" onClick={() => go("requests")}>Барлық өтінімдер →</button>}><SourceTable rows={s.whatsappBySource} unit="Өтінім" /></Card>
        <Card title="Құрылғылар"><Donut rows={devicesOf(s)} unit="келуші" /></Card>
        <Card title="Коллекциялар" more={<button className="more" onClick={() => go("requests")}>Толығырақ →</button>}><CollectionTable rows={s.collections.slice(0, 5)} /></Card>
      </div>
      <Card title="Күндер бойынша есеп"><DaysTable s={s} /></Card>
    </div>
  )
}

function DaysTable({ s }: { s: Stats }) {
  const rows = [...s.daily].reverse()
  const t = { users: s.totals.users, catalog: total(s.daily, "catalog"), whatsapp: total(s.daily, "whatsapp") }
  const conv = (u: number, w: number) => (u ? pct((w / u) * 100) : "—")
  if (!rows.some((r) => r.users || r.whatsapp || r.catalog)) return <Empty />
  return <Table
    cols={[
      { h: "Күн", v: (r) => dayMonth(r.date) },
      { h: "Келушілер", n: true, v: (r) => fmt(r.users) },
      { h: "Каталог ашылды", n: true, v: (r) => fmt(r.catalog) },
      { h: "Өтінімдер", n: true, v: (r) => fmt(r.whatsapp) },
      { h: "Конверсия", n: true, v: (r) => <span className={`badge ${r.users && r.whatsapp / r.users >= 0.08 ? "b-em" : "b-gold"}`}>{conv(r.users, r.whatsapp)}</span> },
    ]}
    rows={rows}
    foot={["Барлығы", fmt(t.users), fmt(t.catalog), fmt(t.whatsapp), conv(t.users, t.whatsapp)]}
  />
}

function Requests({ s }: { s: Stats }) {
  const ph = sorted(s.photos, "count")
  return (
    <div className="page">
      <Card title="Өтінімдер күн сайын"><LineChart rows={s.daily} series={[{ key: "whatsapp", color: "var(--gold)", label: "Өтінімдер" }]} /></Card>
      <div className="row2">
        <Card title="Батырмалар бойынша" note="клиент қай жерден жазды"><SourceTable rows={s.whatsappBySource} unit="Өтінім" /></Card>
        <Card title="Коллекциялар бойынша" note="«Бағасын білу» басылған карточка"><CollectionTable rows={s.collections} /></Card>
      </div>
      <Card title="Ең көп сұралған фотолар" note="каталогтағы «Үйіме де осындай»">
        <Table cols={[{ h: "Фото", v: (x) => <Thumb src={photoSrc(x.key)} label={`Фото №${x.key.slice(1)}`} /> }, { h: "Өтінім", n: true, v: (x) => fmt(x.count) }]} rows={ph.slice(0, 12)} />
      </Card>
    </div>
  )
}

function Catalog({ s }: { s: Stats }) {
  const t = s.totals, top = Math.max(t.users, 1)
  const steps: [string, number][] = [["Сайтқа кірді", t.users], ["Каталогты ашты", t.catalog], ["WhatsApp-қа жазды", t.whatsapp]]
  return (
    <div className="page">
      <Card title="Келушіден өтінімге дейін">
        {!t.users ? <Empty /> : (
          <div className="funnel">
            {steps.map(([name, v], i) => (
              <div className="fs" key={name}>
                <span>{name}</span>
                <div className="ft"><div className="fb" style={{ width: `${v ? Math.max(1.5, (v / top) * 100) : 0}%` }} /></div>
                <span>{fmt(v)}{i > 0 && <small>{pct((v / top) * 100)}</small>}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
      <div className="row2">
        <Card title="Каталогқа қайдан кірді"><SourceTable rows={s.catalogBySource} unit="Рет" /></Card>
        <Card title="Каталог күн сайын"><LineChart rows={s.daily} series={[{ key: "catalog", color: "var(--clay)", label: "Каталог ашылды" }]} /></Card>
      </div>
    </div>
  )
}

function Visitors({ s }: { s: Stats }) {
  const t = s.totals
  const cs = sorted(s.cities, "users"), ct = total(cs, "users")
  return (
    <div className="page">
      <div className="kpis">
        <Kpi label="Келушілер" value={fmt(t.users)} icon={ICONS.user} tone="t-gold" />
        <Kpi label="Бет қаралды" value={fmt(t.pageviews)} icon={ICONS.eye} tone="t-em" />
        <Kpi label="«Барлығын көрсету» басылды" value={fmt(t.showAll)} icon={ICONS.grid} tone="t-clay" />
        <Kpi label="Бір келушіге бет" value={t.users ? (t.pageviews / t.users).toFixed(1).replace(".", ",") : "—"} icon={ICONS.trend} tone="t-sage" />
      </div>
      <div className="row2">
        <Card title="Келушілер күн сайын"><LineChart rows={s.daily} series={[{ key: "users", color: "var(--emerald)", label: "Келушілер" }]} /></Card>
        <Card title="Құрылғылар"><Donut rows={devicesOf(s)} unit="келуші" /></Card>
      </div>
      <Card title="Қалалар" note={CITY_NOTE}>
        <Table cols={[{ h: "Қала", v: (x) => city(x.name) }, { h: "Келушілер", n: true, v: (x) => fmt(x.users) }, { h: "Үлесі", n: true, v: (x) => <Share v={x.users} total={ct} /> }]} rows={cs} foot={cs.length > 1 ? ["Барлығы", fmt(ct), "100%"] : undefined} />
      </Card>
    </div>
  )
}


function LiveCard({ live }: { live: Live | null }) {
  if (!live) return <section className="card live-card"><Empty>Тікелей деректер жүктелуде…</Empty></section>
  const peak = Math.max(1, ...live.minutes)
  const devices = live.devices.filter((d) => d.users > 0).sort((a, b) => b.users - a.users)
  return (
    <section className="card live-card" aria-labelledby="live-h">
      <div className="card-h">
        <h2 id="live-h"><span className="dot" />Қазір сайтта</h2>
        <span className="note">соңғы 30 минут · {new Date(live.fetchedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} жаңарды</span>
      </div>
      <div className="live-grid">
        <div className="live-big"><b>{fmt(live.users)}</b><span>адам</span></div>
        <div className="live-facts">
          <div><b>{fmt(live.whatsapp)}</b><span>WhatsApp басу</span></div>
          <div><b>{fmt(live.catalog)}</b><span>каталог ашылды</span></div>
          <div><b>{fmt(live.pageviews)}</b><span>бет қаралды</span></div>
        </div>
        <div className="live-list">
          <span className="lbl">Құрылғы</span>
          {devices.length ? devices.map((d) => <div key={d.key}><span>{DEVICE[d.key] ?? d.key}</span><b>{fmt(d.users)}</b></div>) : <span className="muted">—</span>}
        </div>
        <div className="live-list">
          <span className="lbl">Қала <small>(шамамен)</small></span>
          {live.cities.length ? live.cities.slice(0, 4).map((c) => <div key={c.name}><span>{c.name === "(not set)" ? "Анықталмады" : city(c.name)}</span><b>{fmt(c.users)}</b></div>) : <span className="muted">—</span>}
        </div>
      </div>
      <div className="minutes" aria-label="Соңғы 30 минуттағы белсенділік">
        {[...live.minutes].reverse().map((v, i) => <i key={i} style={{ height: `${v ? Math.max(12, (v / peak) * 100) : 4}%` }} title={`${29 - i} минут бұрын: ${v}`} className={v ? "on" : undefined} />)}
      </div>
      <div className="minutes-axis"><span>30 мин бұрын</span><span>қазір</span></div>
    </section>
  )
}
