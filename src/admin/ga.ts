// Google арқылы кіру және GA4 Data API-ден сандарды алу.
// Кіру Google-дың өз терезесінде өтеді; панель тек «оқу» рұқсатын сұрайды (analytics.readonly).
// Токен (уақытша кілт) ~1 сағат жарамды, тек осы браузер қойындысында сақталады.

export const GA4_PROPERTY = "559450462" // «Perde Mariam сайты» ресурсы
export const TRACKING_START = "2026-10-17" // GA4 сайтты осы күннен бастап санайды
export const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ""

const SCOPES = "https://www.googleapis.com/auth/analytics.readonly"
const TOKEN_KEY = "pm-admin-token"

type TokenResponse = { access_token?: string; expires_in?: number; error?: string; error_description?: string }
type TokenClient = { requestAccessToken: (o?: { prompt?: string }) => void }
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (c: {
            client_id: string
            scope: string
            callback: (r: TokenResponse) => void
            error_callback?: (e: { type: string; message?: string }) => void
          }) => TokenClient
          revoke: (token: string, done?: () => void) => void
        }
      }
    }
  }
}

export class AuthError extends Error {}
export class AccessError extends Error {}

let gisLoading: Promise<void> | null = null
function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  gisLoading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script")
    s.src = "https://accounts.google.com/gsi/client"
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error("Google кіру жүйесі жүктелмеді. Интернетті тексеріп, бетті жаңартыңыз."))
    document.head.appendChild(s)
  })
  return gisLoading
}

export function savedToken(): string | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const t = JSON.parse(raw) as { value: string; exp: number }
    return t.exp > Date.now() + 60_000 ? t.value : null
  } catch {
    return null
  }
}

function saveToken(value: string, seconds: number) {
  try {
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ value, exp: Date.now() + seconds * 1000 }))
  } catch {
    /* жеке режимде сақталмаса да жұмыс істейді */
  }
}

export function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

// prompt: "" — үнсіз қайта кіру (бұрын рұқсат берген болса), "select_account" — аккаунт таңдау терезесі
export async function signIn(prompt: "" | "select_account" = "select_account"): Promise<string> {
  if (!CLIENT_ID) throw new Error("Google кіру әлі бапталмаған (GOOGLE_CLIENT_ID жоқ).")
  await loadGis()
  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (r) => {
        if (r.error || !r.access_token) return reject(new AuthError(r.error_description || "Кіру тоқтатылды."))
        saveToken(r.access_token, r.expires_in ?? 3600)
        resolve(r.access_token)
      },
      error_callback: (e) =>
        reject(new AuthError(e.type === "popup_closed" ? "Кіру терезесі жабылды." : "Кіру терезесі ашылмады. Браузерде қалқымалы терезелерге рұқсат беріңіз.")),
    })
    client.requestAccessToken({ prompt })
  })
}

export function signOut() {
  const t = savedToken()
  clearToken()
  if (t) window.google?.accounts.oauth2.revoke(t)
}

async function call<T>(token: string, method: string, body: unknown): Promise<T> {
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY}:${method}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (r.status === 401) throw new AuthError("Кіру мерзімі өтті, қайта кіріңіз.")
  if (r.status === 403) {
    const j = await r.json().catch(() => ({}))
    const msg: string = j?.error?.message || ""
    if (/has not been used|is disabled/i.test(msg)) throw new AccessError("Google Cloud-та «Google Analytics Data API» қосылмаған.")
    throw new AccessError("Бұл Google аккаунтында «Perde Mariam сайты» GA4 ресурсына рұқсат жоқ. GA4-ке қосылған аккаунтпен кіріңіз.")
  }
  if (!r.ok) {
    const j = await r.json().catch(() => ({}))
    throw new Error(j?.error?.message || `GA4 қатесі (${r.status})`)
  }
  return r.json() as Promise<T>
}

/* ---------- Есептер ---------- */

export type RangeKey = "today" | "7d" | "30d" | "all"
export const RANGES: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Бүгін" },
  { key: "7d", label: "7 күн" },
  { key: "30d", label: "30 күн" },
  { key: "all", label: "Барлығы" },
]

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

export type Period = { from: string; to: string; prevFrom?: string; prevTo?: string }
export function periodOf(key: RangeKey, now = new Date()): Period {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const start = new Date(TRACKING_START + "T00:00:00")
  const len = key === "today" ? 1 : key === "7d" ? 7 : key === "30d" ? 30 : 0
  let from = len ? addDays(today, 1 - len) : start
  if (from < start) from = start
  const days = Math.round((today.getTime() - from.getTime()) / 864e5) + 1
  const prevTo = addDays(from, -1)
  const prevFrom = addDays(prevTo, 1 - days)
  // Санау басталмай тұрған кезеңмен салыстырмаймыз — ол жерде дерек жоқ.
  const hasPrev = key !== "all" && prevTo >= start
  return { from: ymd(from), to: ymd(today), ...(hasPrev ? { prevFrom: ymd(prevFrom < start ? start : prevFrom), prevTo: ymd(prevTo) } : {}) }
}

type Row = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }
type Report = { rows?: Row[] }

export type Stats = {
  period: Period
  totals: { users: number; pageviews: number; sessions: number; whatsapp: number; catalog: number; showAll: number }
  prev: { users: number; whatsapp: number; catalog: number } | null
  daily: { date: string; users: number; whatsapp: number; catalog: number }[]
  whatsappBySource: { key: string; count: number }[]
  catalogBySource: { key: string; count: number }[]
  collections: { name: string; count: number }[]
  photos: { key: string; count: number }[]
  devices: { key: string; users: number }[]
  cities: { name: string; users: number }[]
  fetchedAt: number
}

const EVENTS = ["whatsapp_click", "catalog_open", "catalog_show_all"]
const inList = (values: string[]) => ({ filter: { fieldName: "eventName", inListFilter: { values } } })
const isEvent = (value: string) => ({ filter: { fieldName: "eventName", stringFilter: { value } } })
const num = (r: Row, i = 0) => Number(r.metricValues?.[i]?.value ?? 0)
const dim = (r: Row, i = 0) => r.dimensionValues?.[i]?.value ?? ""
const NOT_SET = (v: string) => !v || v === "(not set)"

export async function loadStats(token: string, key: RangeKey): Promise<Stats> {
  const p = periodOf(key)
  const cur = { startDate: p.from, endDate: p.to }
  const ranges = p.prevFrom ? [cur, { startDate: p.prevFrom, endDate: p.prevTo }] : [cur]

  const [a, b] = await Promise.all([
    call<{ reports: Report[] }>(token, "batchRunReports", {
      requests: [
        { dateRanges: ranges, metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }, { name: "sessions" }] },
        { dateRanges: ranges, dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }], dimensionFilter: inList(EVENTS) },
        { dateRanges: [cur], dimensions: [{ name: "date" }], metrics: [{ name: "activeUsers" }] },
        { dateRanges: [cur], dimensions: [{ name: "date" }, { name: "eventName" }], metrics: [{ name: "eventCount" }], dimensionFilter: inList(EVENTS.slice(0, 2)) },
        { dateRanges: [cur], dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "activeUsers" }] },
      ],
    }),
    call<{ reports: Report[] }>(token, "batchRunReports", {
      requests: [
        { dateRanges: [cur], dimensions: [{ name: "eventName" }, { name: "customEvent:source" }], metrics: [{ name: "eventCount" }], dimensionFilter: inList(EVENTS.slice(0, 2)) },
        { dateRanges: [cur], dimensions: [{ name: "customEvent:collection" }], metrics: [{ name: "eventCount" }], dimensionFilter: isEvent("whatsapp_click") },
        { dateRanges: [cur], dimensions: [{ name: "customEvent:photo" }], metrics: [{ name: "eventCount" }], dimensionFilter: isEvent("whatsapp_click") },
        { dateRanges: [cur], dimensions: [{ name: "city" }], metrics: [{ name: "activeUsers" }], orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }], limit: 12 },
      ],
    }),
  ])

  const [rTotals, rEvents, rDailyUsers, rDailyEvents, rDevices] = a.reports
  const [rSources, rCollections, rPhotos, rCities] = b.reports

  // Екі кезең сұралса, әр жолдың соңында "date_range_0" / "date_range_1" өлшемі келеді.
  const twoRanges = ranges.length > 1
  const rangeOf = (r: Row) => (twoRanges ? dim(r, (r.dimensionValues?.length ?? 1) - 1) : "date_range_0")

  const totals = { users: 0, pageviews: 0, sessions: 0, whatsapp: 0, catalog: 0, showAll: 0 }
  const prev = { users: 0, whatsapp: 0, catalog: 0 }
  for (const r of rTotals.rows ?? []) {
    if (rangeOf(r) === "date_range_0") Object.assign(totals, { users: num(r, 0), pageviews: num(r, 1), sessions: num(r, 2) })
    else prev.users = num(r, 0)
  }
  for (const r of rEvents.rows ?? []) {
    const t = rangeOf(r) === "date_range_0" ? totals : null
    const e = dim(r, 0)
    if (t) {
      if (e === "whatsapp_click") t.whatsapp = num(r)
      if (e === "catalog_open") t.catalog = num(r)
      if (e === "catalog_show_all") t.showAll = num(r)
    } else {
      if (e === "whatsapp_click") prev.whatsapp = num(r)
      if (e === "catalog_open") prev.catalog = num(r)
    }
  }

  // Күндер: бос күндер де 0 болып көрінуі үшін кезеңнің әр күнін толтырамыз.
  const days: Stats["daily"] = []
  for (let d = new Date(p.from + "T00:00:00"); ymd(d) <= p.to; d = addDays(d, 1)) days.push({ date: ymd(d), users: 0, whatsapp: 0, catalog: 0 })
  const byDate = new Map(days.map((d) => [d.date.replace(/-/g, ""), d]))
  for (const r of rDailyUsers.rows ?? []) { const d = byDate.get(dim(r)); if (d) d.users = num(r) }
  for (const r of rDailyEvents.rows ?? []) {
    const d = byDate.get(dim(r, 0))
    if (!d) continue
    if (dim(r, 1) === "whatsapp_click") d.whatsapp = num(r)
    else d.catalog = num(r)
  }

  const whatsappBySource: Stats["whatsappBySource"] = []
  const catalogBySource: Stats["catalogBySource"] = []
  for (const r of rSources.rows ?? []) {
    const row = { key: NOT_SET(dim(r, 1)) ? "(not set)" : dim(r, 1), count: num(r) }
    ;(dim(r, 0) === "whatsapp_click" ? whatsappBySource : catalogBySource).push(row)
  }

  return {
    period: p,
    totals,
    prev: p.prevFrom ? prev : null,
    daily: days,
    whatsappBySource,
    catalogBySource,
    collections: (rCollections.rows ?? []).filter((r) => !NOT_SET(dim(r))).map((r) => ({ name: dim(r), count: num(r) })),
    photos: (rPhotos.rows ?? []).filter((r) => /^p\d+$/.test(dim(r))).map((r) => ({ key: dim(r), count: num(r) })),
    devices: (rDevices.rows ?? []).map((r) => ({ key: dim(r), users: num(r) })),
    cities: (rCities.rows ?? []).map((r) => ({ name: dim(r), users: num(r) })),
    fetchedAt: Date.now(),
  }
}

/* ---------- Тікелей (соңғы 30 минут) ---------- */

export type Live = {
  users: number
  devices: { key: string; users: number }[]
  cities: { name: string; users: number }[]
  whatsapp: number
  catalog: number
  pageviews: number
  minutes: number[] // 30 ұяшық: [0] — қазіргі минут, [29] — 29 минут бұрын
  fetchedAt: number
}

export async function loadLive(token: string): Promise<Live> {
  const rt = (body: unknown) => call<Report>(token, "runRealtimeReport", body)
  const [tot, dev, cty, ev, min] = await Promise.all([
    rt({ metrics: [{ name: "activeUsers" }] }),
    rt({ dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "activeUsers" }] }),
    rt({ dimensions: [{ name: "city" }], metrics: [{ name: "activeUsers" }], limit: 10 }),
    rt({ dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }] }),
    rt({ dimensions: [{ name: "minutesAgo" }], metrics: [{ name: "activeUsers" }] }),
  ])
  const events = new Map((ev.rows ?? []).map((r) => [dim(r), num(r)]))
  const minutes = Array.from({ length: 30 }, () => 0)
  for (const r of min.rows ?? []) { const m = Number(dim(r)); if (m >= 0 && m < 30) minutes[m] = num(r) }
  return {
    users: (tot.rows ?? []).reduce((s, r) => s + num(r), 0),
    devices: (dev.rows ?? []).map((r) => ({ key: dim(r), users: num(r) })),
    cities: (cty.rows ?? []).map((r) => ({ name: NOT_SET(dim(r)) ? "(not set)" : dim(r), users: num(r) })).sort((a, b) => b.users - a.users),
    whatsapp: events.get("whatsapp_click") ?? 0,
    catalog: events.get("catalog_open") ?? 0,
    pageviews: events.get("page_view") ?? 0,
    minutes,
    fetchedAt: Date.now(),
  }
}
