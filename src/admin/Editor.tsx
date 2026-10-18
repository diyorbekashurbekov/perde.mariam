import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import bundledContent from "@/content.json"
import bundledMeta from "@/photoMeta.json"
import { GhError, TOKEN_URL, checkToken, commitFiles, deployState, getToken, readText, setToken, utf8ToBase64, type DeployState, type FileChange } from "./github"
import { preparePhoto, prepareReview, type PhotoMeta } from "./images"

/* ================= Мазмұн қоймасы ================= */

type Content = typeof bundledContent
type Review = { img: string; quote: string; who: string; date: string; via: string; note?: string }
type Upload = { files: FileChange[]; preview: string; meta?: PhotoMeta }
type Meta = Record<string, PhotoMeta>

const BASE = import.meta.env.BASE_URL
const CONTENT_PATH = "src/content.json"
const META_PATH = "src/photoMeta.json"
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

type Store = {
  ready: boolean
  canSave: boolean
  draft: Content
  meta: Meta
  uploads: Record<string, Upload>
  changes: number
  set: (fn: (d: Content) => void) => void
  addPhotos: (files: FileList | File[]) => Promise<string[]>
  addReviewShot: (file: File) => Promise<string>
  photoSrc: (key: string) => string
  reviewSrc: (key: string) => string
  discard: () => void
  save: () => Promise<void>
  saving: boolean
  status: { sha: string; state: DeployState } | null
  error: string
  setError: (e: string) => void
  busy: string
  token: string
  connect: (t: string) => Promise<void>
  disconnect: () => void
  reload: () => Promise<void>
}
const Ctx = createContext<Store | null>(null)
const useStore = () => useContext(Ctx)!

export function EditorProvider({ children }: { children: ReactNode }) {
  const [token, setTok] = useState(getToken)
  const [base, setBase] = useState<{ content: Content; meta: Meta; sha: string }>({ content: clone(bundledContent), meta: clone(bundledMeta) as Meta, sha: "" })
  const [draft, setDraft] = useState<Content>(() => clone(bundledContent))
  const [uploads, setUploads] = useState<Record<string, Upload>>({})
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const [status, setStatus] = useState<{ sha: string; state: DeployState } | null>(null)

  // Ең соңғы мазмұнды GitHub-тан аламыз (сайт әлі қайта жиналмаса да, соңғы сақталған нұсқа көрінеді).
  const reload = useCallback(async () => {
    if (!getToken()) { setReady(true); return }
    try {
      const [c, m] = await Promise.all([
        // content.json GitHub-та әлі жоқ болса (404), сайттың өзіндегі нұсқамен жұмыс істейміз — алғашқы сақтау оны жасайды.
        readText(CONTENT_PATH).catch((e) => { if (e instanceof GhError && e.status === 404) return null; throw e }),
        readText(META_PATH),
      ])
      const content = c ? (JSON.parse(c.text) as Content) : clone(bundledContent)
      setBase({ content, meta: JSON.parse(m.text) as Meta, sha: c?.sha ?? "" })
      setDraft(clone(content))
      setUploads({})
      setError("")
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setReady(true)
    }
  }, [])
  useEffect(() => { reload() }, [reload, token])

  const meta = useMemo(() => {
    const m: Meta = { ...base.meta }
    for (const [k, u] of Object.entries(uploads)) if (u.meta) m[k] = u.meta
    return m
  }, [base.meta, uploads])

  const used = useMemo(() => {
    const s = new Set<string>([...draft.gallery, ...draft.heroPhotos, ...draft.collections.map((c) => c.img), ...draft.steps.map((x) => x.img), ...draft.reviews.map((r) => r.img)])
    return s
  }, [draft])
  const liveUploads = Object.keys(uploads).filter((k) => used.has(k))
  const changes = (JSON.stringify(draft) !== JSON.stringify(base.content) ? 1 : 0) + liveUploads.length

  const set = useCallback((fn: (d: Content) => void) => setDraft((d) => { const n = clone(d); fn(n); return n }), [])

  const nextNum = (prefix: "p" | "r", keys: string[]) =>
    Math.max(0, ...keys.filter((k) => k.startsWith(prefix)).map((k) => Number(k.slice(1)) || 0)) + 1

  const addPhotos = async (files: FileList | File[]) => {
    const list = Array.from(files)
    const added: string[] = []
    let n = nextNum("p", [...Object.keys(base.meta), ...Object.keys(uploads)])
    for (const [i, f] of list.entries()) {
      setBusy(`Сурет дайындалуда… ${i + 1}/${list.length}`)
      try {
        const key = `p${n++}`
        const u = await preparePhoto(f, key)
        setUploads((x) => ({ ...x, [key]: u }))
        added.push(key)
      } catch (e) {
        setError((e as Error).message)
      }
    }
    setBusy("")
    return added
  }
  const addReviewShot = async (file: File) => {
    setBusy("Скриншот дайындалуда…")
    try {
      const key = `r${nextNum("r", [...base.content.reviews.map((r) => r.img), ...draft.reviews.map((r) => r.img), ...Object.keys(uploads)])}`
      const u = await prepareReview(file, key)
      setUploads((x) => ({ ...x, [key]: u }))
      return key
    } finally {
      setBusy("")
    }
  }

  const photoSrc = (key: string) => uploads[key]?.preview ?? `${BASE}photos/${key}-480.webp`
  const reviewSrc = (key: string) => uploads[key]?.preview ?? `${BASE}reviews/${key}-300.webp`

  const discard = () => {
    Object.values(uploads).forEach((u) => URL.revokeObjectURL(u.preview))
    setUploads({})
    setDraft(clone(base.content))
    setError("")
  }

  const save = async () => {
    if (!changes) return
    const problem = validate(draft)
    if (problem) { setError(problem); return }
    setSaving(true)
    setError("")
    try {
      const files: FileChange[] = liveUploads.flatMap((k) => uploads[k].files)
      const newMeta: Meta = { ...base.meta }
      for (const k of liveUploads) if (uploads[k].meta) newMeta[k] = uploads[k].meta!
      files.push({ path: CONTENT_PATH, base64: utf8ToBase64(JSON.stringify(draft, null, 2) + "\n") })
      if (liveUploads.some((k) => uploads[k].meta)) files.push({ path: META_PATH, base64: utf8ToBase64(JSON.stringify(newMeta, null, 0) + "\n") })
      const sha = await commitFiles(files, `Админ панель: сайт мазмұны жаңартылды (${changes} өзгеріс)`, base.sha ? { path: CONTENT_PATH, sha: base.sha } : undefined)
      setStatus({ sha, state: "queued" })
      setBase((b) => ({ content: clone(draft), meta: newMeta, sha: b.sha }))
      setUploads({})
      // Келесі сақтау үшін файлдың жаңа нұсқасын аламыз.
      readText(CONTENT_PATH).then((c) => setBase((b) => ({ ...b, sha: c.sha }))).catch(() => {})
    } catch (e) {
      setError(e instanceof GhError || e instanceof Error ? e.message : "Сақтау сәтсіз аяқталды.")
    } finally {
      setSaving(false)
    }
  }

  // Сайттың жаңаруын бақылау.
  useEffect(() => {
    if (!status || status.state === "done" || status.state === "failed") return
    const id = setTimeout(async () => {
      const state = await deployState(status.sha)
      setStatus((s) => (s && s.sha === status.sha ? { ...s, state: state === "unknown" ? s.state : state } : s))
    }, 8000)
    return () => clearTimeout(id)
  }, [status])

  const connect = async (t: string) => {
    await checkToken(t.trim())
    setToken(t.trim())
    setTok(t.trim())
  }
  const disconnect = () => { setToken(""); setTok("") }

  // Сақталмаған өзгеріс болса, бетті жапқанда ескерту.
  useEffect(() => {
    if (!changes) return
    const on = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener("beforeunload", on)
    return () => window.removeEventListener("beforeunload", on)
  }, [changes])

  return (
    <Ctx.Provider value={{ ready, canSave: !!token, draft, meta, uploads, changes, set, addPhotos, addReviewShot, photoSrc, reviewSrc, discard, save, saving, status, error, setError, busy, token, connect, disconnect, reload }}>
      {children}
    </Ctx.Provider>
  )
}

function validate(d: Content): string {
  if (!d.gallery.length) return "Каталогта кемінде бір фото болуы керек."
  if (!d.heroPhotos.length) return "Басты слайдта кемінде бір фото болуы керек."
  if (d.collections.some((c) => !c.title.trim())) return "Әр коллекцияның атауы болуы керек."
  if (d.steps.some((s) => !s.title.trim())) return "Әр қадамның атауы болуы керек."
  if (d.reviews.some((r) => !r.quote.trim())) return "Әр пікірдің мәтіні болуы керек."
  const digits = d.business.phone.replace(/\D/g, "")
  if (digits.length < 10) return "Телефон нөмірі толық емес."
  return ""
}

/* ================= Ортақ бөлшектер ================= */

const move = <T,>(arr: T[], i: number, d: number) => {
  const j = i + d
  if (j < 0 || j >= arr.length) return
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
}

function Ico({ d }: { d: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>
}
const I = {
  up: "M12 19V5M5 12l7-7 7 7",
  down: "M12 5v14M19 12l-7 7-7-7",
  left: "M19 12H5M12 19l-7-7 7-7",
  right: "M5 12h14M12 5l7 7-7 7",
  del: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  plus: "M12 5v14M5 12h14",
  img: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.5a1.5 1.5 0 1 0 0-.01",
}

function IconBtn({ d, label, onClick, disabled, danger }: { d: string; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button type="button" className={`ibtn${danger ? " danger" : ""}`} onClick={onClick} disabled={disabled} aria-label={label} title={label}>
      <Ico d={d} />
    </button>
  )
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}

function UploadButton({ label, multiple, onFiles, primary }: { label: string; multiple?: boolean; onFiles: (f: FileList) => void; primary?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <button type="button" className={`btn${primary ? " primary" : ""}`} onClick={() => ref.current?.click()}>
        <Ico d={I.plus} />{label}
      </button>
      <input ref={ref} type="file" accept="image/*" multiple={multiple} hidden onChange={(e) => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = "" }} />
    </>
  )
}

// Бар суреттен таңдау немесе жаңасын жүктеу.
function PhotoPicker({ onPick, onClose, title }: { onPick: (key: string) => void; onClose: () => void; title: string }) {
  const s = useStore()
  const keys = useMemo(() => {
    const order = [...s.draft.gallery, ...Object.keys(s.meta).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))]
    return [...new Set(order)].filter((k) => s.meta[k])
  }, [s.draft.gallery, s.meta])
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="modal-bg" aria-label="Жабу" onClick={onClose} />
      <div className="modal-card">
        <div className="card-h"><h2>{title}</h2><button type="button" className="btn" onClick={onClose}>Жабу</button></div>
        <div className="row-actions">
          <UploadButton label="Жаңа фото жүктеу" primary onFiles={async (f) => { const [k] = await s.addPhotos([f[0]]); if (k) onPick(k) }} />
          <span className="note">немесе төмендегі фотолардың бірін таңдаңыз</span>
        </div>
        <div className="pick-grid">
          {keys.map((k) => (
            <button type="button" key={k} onClick={() => onPick(k)} className="pick">
              <img src={s.photoSrc(k)} alt="" loading="lazy" />
              <span>№{k.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Thumb({ k, onChange, label = "Фотоны ауыстыру" }: { k: string; onChange: (k: string) => void; label?: string }) {
  const s = useStore()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="thumb-btn" onClick={() => setOpen(true)} title={label}>
        <img src={s.photoSrc(k)} alt="" />
        <span><Ico d={I.img} />Ауыстыру</span>
      </button>
      {open && <PhotoPicker title={label} onClose={() => setOpen(false)} onPick={(nk) => { onChange(nk); setOpen(false) }} />}
    </>
  )
}

/* ================= Кілт (токен) және сақтау жолағы ================= */

export function ConnectCard() {
  const s = useStore()
  const [t, setT] = useState("")
  const [err, setErr] = useState("")
  const [busy, setBusy] = useState(false)
  if (s.canSave) return null
  return (
    <section className="card connect">
      <div className="card-h"><h2>Сайтты өзгертуге рұқсат қосу</h2><span className="note">бір рет, осы құрылғыда</span></div>
      <p>Өзгерістерді сайтқа сақтау үшін GitHub-тағы <b>кілт (токен)</b> керек. Оны сайт иесі жасайды да, осы жерге бір рет қояды. Кілт тек осы құрылғыда сақталады.</p>
      <ol className="steps-list">
        <li><a href={TOKEN_URL} target="_blank" rel="noreferrer">GitHub-та жаңа кілт жасау бетін ашыңыз ↗</a></li>
        <li><b>Repository access</b> → <b>Only select repositories</b> → <code>perde.mariam</code></li>
        <li><b>Permissions</b> → <b>Contents</b>: Read and write, <b>Actions</b>: Read-only</li>
        <li><b>Generate token</b> басып, шыққан кілтті төменге қойыңыз.</li>
      </ol>
      <div className="connect-row">
        <input type="password" value={t} onChange={(e) => setT(e.target.value)} placeholder="github_pat_…" autoComplete="off" aria-label="GitHub кілті" />
        <button type="button" className="btn primary" disabled={!t.trim() || busy} onClick={async () => {
          setBusy(true); setErr("")
          try { await s.connect(t) } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
        }}>{busy ? "Тексерілуде…" : "Қосу"}</button>
      </div>
      {err && <p className="err">{err}</p>}
      <p className="note">Кілтсіз де бәрін көріп, өзгертіп көруге болады, тек сайтқа сақталмайды.</p>
    </section>
  )
}

export function SaveBar() {
  const s = useStore()
  const st = s.status
  const deployText = !st ? "" : st.state === "done" ? "Сайт жаңарды ✓ — өзгерістер сайтта көрінеді" : st.state === "failed" ? "Сайтты жинау кезінде қате шықты — Claude-қа хабарлаңыз" : "Сақталды. Сайт жаңаруда… (1–2 минут)"
  if (!s.changes && !st && !s.error && !s.busy) return null
  return (
    <div className={`savebar${s.changes ? " dirty" : ""}`} role="status">
      <div className="savebar-in">
        <div className="savebar-text">
          {s.busy ? <b>{s.busy}</b>
            : s.error ? <span className="err">{s.error}</span>
            : s.changes ? <b>{s.changes} сақталмаған өзгеріс</b>
            : <span className={st?.state === "done" ? "ok" : st?.state === "failed" ? "err" : ""}>{deployText}</span>}
          {!s.canSave && s.changes > 0 && <small>Сақтау үшін алдымен GitHub кілтін қосыңыз (жоғарыда).</small>}
        </div>
        <div className="savebar-actions">
          {s.error && !s.changes && <button type="button" className="btn" onClick={() => s.setError("")}>Жабу</button>}
          {s.changes > 0 && <button type="button" className="btn" onClick={s.discard} disabled={s.saving}>Болдырмау</button>}
          {s.changes > 0 && <button type="button" className="btn primary" onClick={s.save} disabled={!s.canSave || s.saving || !!s.busy}>{s.saving ? "Сақталуда…" : "Сайтқа шығару"}</button>}
        </div>
      </div>
    </div>
  )
}

/* ================= Беттер ================= */

export function PhotosPage() {
  const s = useStore()
  const g = s.draft.gallery
  return (
    <div className="page">
      <ConnectCard />
      <section className="card">
        <div className="card-h">
          <h2>Каталог фотолары · {g.length}</h2>
          <UploadButton label="Фото қосу" multiple primary onFiles={async (f) => { const keys = await s.addPhotos(f); if (keys.length) s.set((d) => { d.gallery.unshift(...keys) }) }} />
        </div>
        <p className="note">Жаңа фото каталогтың басына қосылады. Ретін көрсеткілермен өзгертіңіз. Сайтта алғашқы 12 фото бірден көрінеді.</p>
        <div className="ed-grid">
          {g.map((k, i) => (
            <figure key={k} className={`ed-tile${s.uploads[k] ? " new" : ""}`}>
              <img src={s.photoSrc(k)} alt="" loading="lazy" />
              <figcaption>
                <span>{i + 1}. №{k.slice(1)}{s.uploads[k] && <em> жаңа</em>}</span>
                <span className="tile-actions">
                  <IconBtn d={I.left} label="Алға жылжыту" onClick={() => s.set((d) => move(d.gallery, i, -1))} disabled={i === 0} />
                  <IconBtn d={I.right} label="Артқа жылжыту" onClick={() => s.set((d) => move(d.gallery, i, 1))} disabled={i === g.length - 1} />
                  <IconBtn d={I.del} label="Каталогтан алып тастау" danger onClick={() => s.set((d) => { d.gallery.splice(i, 1) })} />
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  )
}

export function CollectionsPage() {
  const s = useStore()
  const cs = s.draft.collections
  return (
    <div className="page">
      <ConnectCard />
      <section className="card">
        <div className="card-h">
          <h2>Коллекциялар · {cs.length}</h2>
          <button type="button" className="btn primary" onClick={() => s.set((d) => { d.collections.push({ title: "Жаңа коллекция", note: "", photo: "", img: d.gallery[0] }) })}><Ico d={I.plus} />Коллекция қосу</button>
        </div>
        <div className="ed-list">
          {cs.map((c, i) => (
            <div key={i} className="ed-row">
              <Thumb k={c.img} onChange={(k) => s.set((d) => { d.collections[i].img = k })} />
              <div className="ed-fields">
                <Field label="Атауы"><input value={c.title} onChange={(e) => s.set((d) => { d.collections[i].title = e.target.value; d.collections[i].photo = e.target.value })} /></Field>
                <Field label="Қысқа сипаттама"><input value={c.note} onChange={(e) => s.set((d) => { d.collections[i].note = e.target.value })} placeholder="Мысалы: Жеңіл, мөлдір" /></Field>
              </div>
              <div className="ed-side">
                <IconBtn d={I.up} label="Жоғары" onClick={() => s.set((d) => move(d.collections, i, -1))} disabled={i === 0} />
                <IconBtn d={I.down} label="Төмен" onClick={() => s.set((d) => move(d.collections, i, 1))} disabled={i === cs.length - 1} />
                <IconBtn d={I.del} label="Өшіру" danger onClick={() => s.set((d) => { d.collections.splice(i, 1) })} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

const VIA = ["WhatsApp", "Instagram", "2GIS", "Telegram", "Ауызша"]

export function ReviewsPage() {
  const s = useStore()
  const rs = s.draft.reviews as Review[]
  return (
    <div className="page">
      <ConnectCard />
      <section className="card">
        <div className="card-h">
          <h2>Пікірлер · {rs.length}</h2>
          <UploadButton label="Пікір қосу (скриншот)" primary onFiles={async (f) => {
            try {
              const key = await s.addReviewShot(f[0])
              s.set((d) => { (d.reviews as Review[]).unshift({ img: key, quote: "", who: "Клиент", date: "", via: "WhatsApp" }) })
            } catch (e) { s.setError((e as Error).message) }
          }} />
        </div>
        <p className="warn">Скриншот жүктемес бұрын клиенттің <b>телефон нөмірі мен толық атын</b> жасырыңыз (телефонда «Өңдеу → Белгілеу» арқылы бояуға болады). Пікір мәтінін скриншоттағыдай жазыңыз.</p>
        <div className="ed-list">
          {rs.map((r, i) => (
            <div key={r.img} className="ed-row">
              <img className="review-thumb" src={s.reviewSrc(r.img)} alt="" />
              <div className="ed-fields">
                <Field label="Пікір мәтіні (скриншоттан)"><textarea rows={3} value={r.quote} onChange={(e) => s.set((d) => { (d.reviews as Review[])[i].quote = e.target.value })} /></Field>
                <div className="ed-fields-row">
                  <Field label="Кім"><input value={r.who} onChange={(e) => s.set((d) => { (d.reviews as Review[])[i].who = e.target.value })} placeholder="Клиент / Айгүл, Есіл" /></Field>
                  <Field label="Қашан"><input value={r.date} onChange={(e) => s.set((d) => { (d.reviews as Review[])[i].date = e.target.value })} placeholder="Қазан 2026" /></Field>
                  <Field label="Қайдан">
                    <select value={r.via} onChange={(e) => s.set((d) => { (d.reviews as Review[])[i].via = e.target.value })}>{VIA.map((v) => <option key={v}>{v}</option>)}</select>
                  </Field>
                </div>
                <Field label="Мата / жұмыс түрі (міндетті емес)"><input value={r.note ?? ""} onChange={(e) => s.set((d) => { const rv = (d.reviews as Review[])[i]; if (e.target.value) rv.note = e.target.value; else delete rv.note })} placeholder="Мысалы: Блэкаут, тюль «ёлочка»" /></Field>
              </div>
              <div className="ed-side">
                <IconBtn d={I.up} label="Жоғары" onClick={() => s.set((d) => move(d.reviews, i, -1))} disabled={i === 0} />
                <IconBtn d={I.down} label="Төмен" onClick={() => s.set((d) => move(d.reviews, i, 1))} disabled={i === rs.length - 1} />
                <IconBtn d={I.del} label="Өшіру" danger onClick={() => s.set((d) => { d.reviews.splice(i, 1) })} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

const SITE = "https://diyorbekashurbekov.github.io/perde.mariam/"
function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return <button type="button" className="copy" onClick={() => navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500) })}>{done ? "Көшірілді" : "Көшіру"}</button>
}

const formatPhone = (digits: string) => {
  const d = digits.replace(/\D/g, "").replace(/^8(?=\d{10}$)/, "7")
  return d.length === 11 ? `+${d[0]} ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}` : `+${d}`
}

export function InfoPage() {
  const s = useStore()
  const b = s.draft.business
  const [heroPick, setHeroPick] = useState(false)
  return (
    <div className="page">
      <ConnectCard />
      <section className="card">
        <div className="card-h"><h2>Сілтемелер</h2><span className="note">клиентке жіберу үшін</span></div>
        <dl className="info">
          <div><dt>Сайт</dt><dd><a href={SITE} target="_blank" rel="noreferrer">diyorbekashurbekov.github.io/perde.mariam</a></dd><Copy text={SITE} /></div>
          <div><dt>Каталогқа тікелей</dt><dd><a href={SITE + "#catalog"} target="_blank" rel="noreferrer">…/perde.mariam/#catalog</a></dd><Copy text={SITE + "#catalog"} /></div>
          <div><dt>Пікірлерге тікелей</dt><dd><a href={SITE + "#reviews"} target="_blank" rel="noreferrer">…/perde.mariam/#reviews</a></dd><Copy text={SITE + "#reviews"} /></div>
        </dl>
      </section>
      <section className="card">
        <div className="card-h"><h2>Байланыс</h2></div>
        <div className="ed-fields-row">
          <Field label="Телефон / WhatsApp" hint={`Сайтта: ${formatPhone(b.phone)} · WhatsApp батырмалары осы нөмірге ашылады`}>
            <input inputMode="tel" value={b.phone} onChange={(e) => s.set((d) => { d.business.phone = e.target.value; d.business.phoneDisplay = formatPhone(e.target.value) })} />
          </Field>
          <Field label="Instagram"><input value={b.instagramHandle} onChange={(e) => s.set((d) => { const v = e.target.value.trim(); d.business.instagramHandle = v.startsWith("@") ? v : `@${v}` })} /></Field>
          <Field label="Тәжірибе (жыл)"><input type="number" min={1} max={99} value={b.years} onChange={(e) => s.set((d) => { d.business.years = Number(e.target.value) || 1 })} /></Field>
        </div>
        <Field label="Мекенжай"><input value={b.address} onChange={(e) => s.set((d) => { d.business.address = e.target.value })} /></Field>
      </section>

      <section className="card">
        <div className="card-h"><h2>Ателье туралы мәтін</h2><span className="note">«(01) Ателье» бөлімі</span></div>
        <Field label="Мәтін" hint="*Жұлдызшамен* қоршалған сөз сайтта курсивпен (жасыл) ерекшеленеді.">
          <textarea rows={3} value={s.draft.statement} onChange={(e) => s.set((d) => { d.statement = e.target.value })} />
        </Field>
      </section>

      <section className="card">
        <div className="card-h">
          <h2>Басты слайд-шоу · {s.draft.heroPhotos.length}</h2>
          <button type="button" className="btn primary" onClick={() => setHeroPick(true)}><Ico d={I.plus} />Фото қосу</button>
        </div>
        <p className="note">Сайттың бірінші экранындағы ауысып тұратын фотолар. Біріншісі ең алдымен көрінеді.</p>
        <div className="ed-grid small">
          {s.draft.heroPhotos.map((k, i) => (
            <figure key={`${k}-${i}`} className="ed-tile">
              <img src={s.photoSrc(k)} alt="" />
              <figcaption>
                <span>{i + 1}. №{k.slice(1)}</span>
                <span className="tile-actions">
                  <IconBtn d={I.left} label="Алға" onClick={() => s.set((d) => move(d.heroPhotos, i, -1))} disabled={i === 0} />
                  <IconBtn d={I.right} label="Артқа" onClick={() => s.set((d) => move(d.heroPhotos, i, 1))} disabled={i === s.draft.heroPhotos.length - 1} />
                  <IconBtn d={I.del} label="Алып тастау" danger onClick={() => s.set((d) => { d.heroPhotos.splice(i, 1) })} disabled={s.draft.heroPhotos.length <= 1} />
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
        {heroPick && <PhotoPicker title="Слайдқа фото таңдау" onClose={() => setHeroPick(false)} onPick={(k) => { s.set((d) => { d.heroPhotos.push(k) }); setHeroPick(false) }} />}
      </section>

      <section className="card">
        <div className="card-h"><h2>Жұмыс қадамдары · {s.draft.steps.length}</h2><span className="note">«(03) Процесс» бөлімі</span></div>
        <div className="ed-list">
          {s.draft.steps.map((st, i) => (
            <div key={i} className="ed-row">
              <Thumb k={st.img} onChange={(k) => s.set((d) => { d.steps[i].img = k })} />
              <div className="ed-fields">
                <Field label={`${i + 1}-қадам атауы`}><input value={st.title} onChange={(e) => s.set((d) => { d.steps[i].title = e.target.value })} /></Field>
                <Field label="Сипаттама"><textarea rows={2} value={st.note} onChange={(e) => s.set((d) => { d.steps[i].note = e.target.value })} /></Field>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
