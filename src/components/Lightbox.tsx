import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronLeft, ChevronRight, MessageCircle, X, ZoomIn } from "lucide-react"
import { choosePhotoLink } from "@/lib/whatsapp"
import { track } from "@/lib/analytics"

type Item = { src: string; alt: string }
const ease = [0.22, 1, 0.36, 1] as const
const ZOOM = 2.5

// Каталог суретін толық экранда ашу.
// Телефонда: солға/оңға сырғыту — келесі/алдыңғы сурет, төмен сырғыту — жабу,
// екі рет басу — үлкейту (үлкейген суретті саусақпен жылжытуға болады).
// Компьютерде: көрсеткі пернелері, Esc, суретті басу — үлкейту.
// whatsapp=false — төменгі «Үйіме де осындай» батырмасыз (мысалы, пікір скриншоттары үшін).
export function Lightbox({ items, index, onIndex, onClose, whatsapp = true }: { items: Item[]; index: number; onIndex: (i: number) => void; onClose: () => void; whatsapp?: boolean }) {
  const item = items[index]
  const [zoom, setZoom] = useState(false)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const [hint, setHint] = useState(true)
  const start = useRef<{ x: number; y: number; px: number; py: number; t: number } | null>(null)
  const lastTap = useRef(0)
  const moved = useRef(false)

  const go = useCallback((d: number) => {
    setZoom(false)
    setPan({ x: 0, y: 0 })
    onIndex((index + d + items.length) % items.length)
  }, [index, items.length, onIndex])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") go(1)
      if (e.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    document.documentElement.style.overflow = "hidden"
    const t = setTimeout(() => setHint(false), 3500)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.documentElement.style.overflow = ""
      clearTimeout(t)
    }
  }, [go, onClose])

  // Көрші суреттерді алдын ала жүктеу — ауыстырғанда бірден ашылады.
  useEffect(() => {
    for (const d of [1, -1]) {
      const img = new Image()
      img.src = items[(index + d + items.length) % items.length].src
    }
  }, [index, items])

  const toggleZoom = (clientX: number, clientY: number, el: HTMLElement) => {
    if (zoom) {
      setZoom(false)
      setPan({ x: 0, y: 0 })
      return
    }
    // Басылған нүкте ортаға жақындайтындай етіп үлкейту.
    const r = el.getBoundingClientRect()
    const dx = (r.left + r.width / 2 - clientX) * (ZOOM - 1)
    const dy = (r.top + r.height / 2 - clientY) * (ZOOM - 1)
    setPan(clampPan(dx, dy, r.width, r.height))
    setZoom(true)
    setHint(false)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, t: Date.now() }
    moved.current = false
  }
  const onPointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    const s = start.current
    if (!s) return
    const dx = e.clientX - s.x, dy = e.clientY - s.y
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved.current = true
    if (zoom) {
      const r = e.currentTarget.getBoundingClientRect()
      setPan(clampPan(s.px + dx, s.py + dy, r.width / ZOOM, r.height / ZOOM))
    } else setDrag({ x: dx, y: Math.max(0, dy) })
  }
  const onPointerUp = (e: React.PointerEvent<HTMLImageElement>) => {
    const s = start.current
    start.current = null
    if (!s) return
    const dx = e.clientX - s.x, dy = e.clientY - s.y
    setDrag({ x: 0, y: 0 })
    if (!moved.current) {
      // Тышқанмен бір басу немесе телефонда екі рет басу — үлкейту/кішірейту.
      const now = Date.now()
      if (e.pointerType === "mouse" || now - lastTap.current < 320) {
        toggleZoom(e.clientX, e.clientY, e.currentTarget)
        lastTap.current = 0
      } else lastTap.current = now
      return
    }
    if (zoom) return
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
    else if (dy > 110) onClose()
  }

  const fade = 1 - Math.min(drag.y / 400, 0.6)
  const photo = item.src.match(/p\d+/)?.[0]

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Сурет ${index + 1} / ${items.length}`}
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease }}
    >
      <button type="button" aria-label="Жабу" onClick={onClose} className="absolute inset-0 bg-[#15110e]/95" style={{ opacity: fade }} />

      <div className={`relative flex h-full w-full items-center justify-center overflow-hidden px-2 pt-16 sm:px-24 sm:pt-20 ${whatsapp ? "pb-36 sm:pb-32" : "pb-24 sm:pb-12"}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={item.src}
            className="flex h-full w-full items-center justify-center"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease }}
          >
            <img
              src={item.src}
              alt={item.alt}
              draggable={false}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => { start.current = null; setDrag({ x: 0, y: 0 }) }}
              className={`max-h-full max-w-full touch-none select-none rounded-[10px] object-contain shadow-2xl sm:rounded-[16px] ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}
              style={{
                transform: `translate(${drag.x + pan.x}px, ${drag.y + pan.y}px) scale(${zoom ? ZOOM : 1 - drag.y / 2000})`,
                transition: start.current ? "none" : "transform .35s cubic-bezier(.22,1,.36,1)",
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <span className="pointer-events-none absolute top-6 left-5 text-xs tracking-[0.3em] text-linen/80 sm:left-8">
        {index + 1} / {items.length}
      </span>
      <button type="button" onClick={onClose} aria-label="Жабу" className="absolute top-3 right-3 grid size-12 place-items-center rounded-full bg-paper text-ink sm:top-5 sm:right-5">
        <X className="size-5" strokeWidth={1.5} aria-hidden />
      </button>
      <button type="button" onClick={() => go(-1)} aria-label="Алдыңғы сурет" className="absolute left-6 hidden size-12 place-items-center rounded-full bg-paper/90 text-ink sm:grid">
        <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden />
      </button>
      <button type="button" onClick={() => go(1)} aria-label="Келесі сурет" className="absolute right-6 hidden size-12 place-items-center rounded-full bg-paper/90 text-ink sm:grid">
        <ChevronRight className="size-5" strokeWidth={1.5} aria-hidden />
      </button>

      <AnimatePresence>
        {hint && !zoom && (
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`pointer-events-none absolute ${whatsapp ? "bottom-32 sm:bottom-28" : "bottom-24 sm:bottom-6"} inline-flex items-center gap-2 rounded-full bg-black/45 px-4 py-2 text-xs text-linen/90`}
          >
            <ZoomIn className="size-4" strokeWidth={1.6} aria-hidden />
            <span className="sm:hidden">Екі рет басып үлкейтіңіз · сырғытып ауыстырыңыз</span>
            <span className="hidden sm:inline">Суретті басып үлкейтіңіз · ← → пернелері</span>
          </motion.span>
        )}
      </AnimatePresence>

      {whatsapp ? (
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-4 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => go(-1)} aria-label="Алдыңғы сурет" className="grid size-12 place-items-center rounded-full bg-paper/90 text-ink sm:hidden">
            <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden />
          </button>
          <a
            href={choosePhotoLink(item.src)}
            target="_blank"
            rel="noreferrer"
            onClick={() => track("whatsapp_click", { source: "catalog_lightbox", photo })}
            className="inline-flex h-14 items-center gap-2.5 rounded-full bg-gold px-6 text-[15px] font-normal text-ink shadow-xl transition-colors hover:bg-linen sm:gap-3 sm:px-7"
          >
            <MessageCircle className="size-5 shrink-0" strokeWidth={1.6} aria-hidden />
            <span className="sm:hidden">Үйіме де осындай</span>
            <span className="hidden sm:inline">Үйіме де осындай тігіп беріңіз</span>
          </a>
          <button type="button" onClick={() => go(1)} aria-label="Келесі сурет" className="grid size-12 place-items-center rounded-full bg-paper/90 text-ink sm:hidden">
            <ChevronRight className="size-5" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
        <span className="text-xs text-linen/75">Бағасын WhatsApp-та айтамыз</span>
      </div>
      ) : (
        <div className="absolute inset-x-0 bottom-0 flex justify-center gap-3 px-4 pb-[max(24px,env(safe-area-inset-bottom))] sm:hidden">
          <button type="button" onClick={() => go(-1)} aria-label="Алдыңғы сурет" className="grid size-12 place-items-center rounded-full bg-paper/90 text-ink">
            <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Келесі сурет" className="grid size-12 place-items-center rounded-full bg-paper/90 text-ink">
            <ChevronRight className="size-5" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      )}
    </motion.div>
  )
}

// Үлкейген сурет экраннан тым шығып кетпеуі үшін жылжытуды шектеу.
function clampPan(x: number, y: number, w: number, h: number) {
  const mx = (w * (ZOOM - 1)) / 2, my = (h * (ZOOM - 1)) / 2
  return { x: Math.max(-mx, Math.min(mx, x)), y: Math.max(-my, Math.min(my, y)) }
}
