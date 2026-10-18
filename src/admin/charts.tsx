import { useEffect, useRef, useState, type ReactNode } from "react"
import { dayMonth, dayMonthShort, fmt, pct } from "./labels"

// Контейнердің енін бақылап, графикті сол енге сызу.
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(600)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

export function Empty({ children = "Бұл кезеңде дерек жоқ" }: { children?: ReactNode }) {
  return <div className="empty">{children}</div>
}

function niceMax(v: number) {
  if (v <= 5) return 5
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const m = v / p
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p
}

type Series<R> = { key: keyof R & string; color: string; label: string }

export function LineChart<R extends { date: string }>({ rows, series }: { rows: R[]; series: Series<R>[] }) {
  const [ref, W] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const val = (r: R, k: string) => Number((r as Record<string, unknown>)[k] ?? 0)
  const has = rows.some((r) => series.some((s) => val(r, s.key) > 0))
  const H = 230, L = 40, R = 12, T = 14, B = 28
  const mx = niceMax(Math.max(1, ...rows.flatMap((r) => series.map((s) => val(r, s.key)))))
  const n = rows.length
  const x = (i: number) => (n === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (n - 1))
  const y = (v: number) => T + (H - T - B) * (1 - v / mx)
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor((W - L - R) / 72))))

  return (
    <div className="chart" ref={ref}>
      {!has ? <Empty /> : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={series.map((s) => s.label).join(", ") + " күн сайын"}
            onPointerMove={(e) => {
              const rc = e.currentTarget.getBoundingClientRect()
              const px = ((e.clientX - rc.left) * W) / rc.width
              setHover(n === 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round(((px - L) * (n - 1)) / (W - L - R)))))
            }}
            onPointerLeave={() => setHover(null)}>
            {[0, 1, 2, 3, 4].map((g) => {
              const v = (mx * g) / 4
              return (
                <g key={g}>
                  <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" />
                  <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{fmt(v)}</text>
                </g>
              )
            })}
            {rows.map((r, i) => (i % every === 0 ? <text key={r.date} x={x(i)} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--muted)">{dayMonthShort(r.date)}</text> : null))}
            {series.map((s, si) => {
              const d = rows.map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(val(r, s.key)).toFixed(1)}`).join(" ")
              return (
                <g key={s.key}>
                  {si === 0 && n > 1 && <path d={`${d} L${x(n - 1)} ${y(0)} L${x(0)} ${y(0)} Z`} fill={s.color} fillOpacity={0.12} />}
                  <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
                  <circle cx={x(n - 1)} cy={y(val(rows[n - 1], s.key))} r={3.5} fill={s.color} />
                </g>
              )
            })}
            {hover != null && (
              <g>
                <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="var(--muted)" strokeDasharray="3 3" opacity={0.5} />
                {series.map((s) => <circle key={s.key} cx={x(hover)} cy={y(val(rows[hover], s.key))} r={4} fill={s.color} stroke="var(--panel)" strokeWidth={2} />)}
              </g>
            )}
          </svg>
          {hover != null && (
            <div className="tip" style={{ left: `${Math.min(Math.max((x(hover) / W) * 100, 12), 88)}%`, top: 8 }}>
              <b>{dayMonth(rows[hover].date)}</b>
              {series.map((s) => <div key={s.key}>{s.label}: {fmt(val(rows[hover], s.key))}</div>)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function BarChart({ rows, label }: { rows: { label: string; v: number }[]; label: string }) {
  const [ref, W] = useWidth<HTMLDivElement>()
  const data = rows.filter((r) => r.v > 0).slice(0, 7)
  const H = 230, L = 40, R = 8, T = 22, B = 30
  const mx = niceMax(Math.max(1, ...data.map((r) => r.v)))
  const y = (v: number) => T + (H - T - B) * (1 - v / mx)
  const bw = (W - L - R) / Math.max(data.length, 1)
  const w = Math.min(46, bw * 0.55)
  return (
    <div className="chart" ref={ref}>
      {!data.length ? <Empty /> : (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label}>
          {[0, 1, 2, 3, 4].map((g) => {
            const v = (mx * g) / 4
            return (
              <g key={g}>
                <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" />
                <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{fmt(v)}</text>
              </g>
            )
          })}
          {data.map((r, i) => {
            const cx = L + bw * i + bw / 2
            return (
              <g key={r.label}>
                <rect x={cx - w / 2} y={y(r.v)} width={w} height={Math.max(y(0) - y(r.v), 1)} rx={6} fill={i === 0 ? "var(--emerald)" : "var(--emerald-mid)"} />
                <text x={cx} y={y(r.v) - 7} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--fg)">{fmt(r.v)}</text>
                <text x={cx} y={H - 9} textAnchor="middle" fontSize={11} fill="var(--muted)">{r.label.length > 10 ? r.label.slice(0, 9) + "…" : r.label}</text>
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}

const DONUT_COLORS = ["var(--emerald)", "var(--gold)", "var(--clay)", "var(--sage)"]
export function Donut({ rows, unit }: { rows: { label: string; v: number }[]; unit: string }) {
  const data = rows.filter((r) => r.v > 0).sort((a, b) => b.v - a.v)
  const sum = data.reduce((s, r) => s + r.v, 0)
  if (!sum) return <Empty />
  const S = 160, r = 62, sw = 22, c = 2 * Math.PI * r
  let off = 0
  return (
    <div className="donut">
      <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S} role="img" aria-label="Үлестер">
        <circle cx={S / 2} cy={S / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={sw} />
        {data.map((d, i) => {
          const len = (d.v / sum) * c
          const el = <circle key={d.label} cx={S / 2} cy={S / 2} r={r} fill="none" stroke={DONUT_COLORS[i % 4]} strokeWidth={sw}
            strokeDasharray={`${Math.max(len - (data.length > 1 ? 2 : 0), 0.5)} ${c}`} strokeDashoffset={-off} transform={`rotate(-90 ${S / 2} ${S / 2})`} />
          off += len
          return el
        })}
        <text x={S / 2} y={S / 2 + 2} textAnchor="middle" fontSize={24} fontWeight={600} fill="var(--fg)">{fmt(sum)}</text>
        <text x={S / 2} y={S / 2 + 20} textAnchor="middle" fontSize={11} fill="var(--muted)">{unit}</text>
      </svg>
      <div className="donut-l">
        {data.map((d, i) => (
          <div key={d.label}><i style={{ background: DONUT_COLORS[i % 4] }} /><span>{d.label}</span><span>{pct((d.v / sum) * 100)} ({fmt(d.v)})</span></div>
        ))}
      </div>
    </div>
  )
}

export function Share({ v, total }: { v: number; total: number }) {
  return (
    <span className="share">
      <span>{total ? pct((v / total) * 100) : "—"}</span>
      <i style={{ ["--w" as string]: `${total ? (v / total) * 100 : 0}%` }} />
    </span>
  )
}
