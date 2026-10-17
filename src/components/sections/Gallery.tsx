import { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronLeft, ChevronRight, MessageCircle, X } from "lucide-react"
import { BlurFade } from "@/components/ui/blur-fade"
import { CurtainReveal } from "@/components/CurtainReveal"
import { Photo } from "@/components/Photo"
import { useScrollSkew } from "@/lib/useScrollSkew"
import { choosePhotoLink } from "@/lib/whatsapp"
import { gallery } from "@/data"

const ease = [0.22, 1, 0.36, 1] as const
const FIRST = 12

// Портфолио: тор → суретті басқанда толық экранда ашылады.
export function Gallery() {
  const [open, setOpen] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? gallery : gallery.slice(0, FIRST)
  const skew = useScrollSkew(2.5)

  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? null : (i + d + gallery.length) % gallery.length)),
    [],
  )

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null)
      if (e.key === "ArrowRight") step(1)
      if (e.key === "ArrowLeft") step(-1)
    }
    window.addEventListener("keydown", onKey)
    document.documentElement.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.documentElement.style.overflow = ""
    }
  }, [open, step])

  return (
    <section id="works" className="mx-auto max-w-[1400px] px-5 pt-[14vh] pb-[6vh] sm:px-8">
      <div className="mb-[7vh] flex flex-wrap items-end justify-between gap-6">
        <BlurFade inView>
          <h2 className="font-serif text-[clamp(36px,6.4vw,104px)] leading-[0.92] font-extralight tracking-[-0.04em]">
            Жұмыстары<em className="font-light text-sage">мыз.</em>
          </h2>
        </BlurFade>
        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-xs font-normal tracking-[0.3em] text-ink-soft uppercase">(04) Портфолио</p>
          <p className="text-sm text-ink-soft">Ұнаған суретті басыңыз — WhatsApp-қа бірден жібересіз.</p>
        </div>
      </div>

      <motion.div style={{ skewY: skew }} className="columns-2 gap-3 sm:gap-5 lg:columns-3">
        {visible.map((g, i) => (
          <CurtainReveal key={g.src} delay={0.06 * (i % 3)} className="mb-3 break-inside-avoid rounded-[14px] sm:mb-5 sm:rounded-[22px]">
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Суретті үлкейту, ${i + 1}/${gallery.length}`}
              className="group block w-full overflow-hidden rounded-[14px] sm:rounded-[22px]"
            >
              <Photo
                src={g.src}
                alt={g.alt}
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="block h-auto transition-transform duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]"
              />
            </button>
          </CurtainReveal>
        ))}
      </motion.div>

      {!showAll && gallery.length > FIRST && (
        <div className="mt-8 flex justify-center sm:mt-12">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex h-12 items-center gap-3 rounded-full border border-ink/25 px-7 text-sm font-normal transition hover:border-ink hover:bg-ink hover:text-linen sm:h-14 sm:text-[15px]"
          >
            Тағы көрсету
            <span className="text-ink-soft">+{gallery.length - FIRST}</span>
          </button>
        </div>
      )}

      <AnimatePresence>
        {open !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Сурет"
            className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-5 p-4 sm:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease }}
          >
            <button type="button" aria-label="Жабу" onClick={() => setOpen(null)} className="absolute inset-0 bg-ink/85 backdrop-blur-sm" />
            <AnimatePresence mode="wait">
              <motion.img
                key={gallery[open].src}
                src={gallery[open].src}
                srcSet={`${gallery[open].src.replace(".webp", "-900.webp")} 900w, ${gallery[open].src} 1400w`}
                sizes="90vw"
                alt={gallery[open].alt}
                className="relative max-h-[70vh] max-w-[88vw] rounded-[18px] object-contain shadow-2xl sm:max-h-[74vh]"
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.5, ease }}
              />
            </AnimatePresence>
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label="Жабу"
              className="absolute top-5 right-5 grid size-12 place-items-center rounded-full bg-paper text-ink"
            >
              <X className="size-5" strokeWidth={1.5} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Алдыңғы сурет"
              className="absolute left-4 grid size-12 place-items-center rounded-full bg-paper/90 text-ink sm:left-8"
            >
              <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Келесі сурет"
              className="absolute right-4 grid size-12 place-items-center rounded-full bg-paper/90 text-ink sm:right-8"
            >
              <ChevronRight className="size-5" strokeWidth={1.5} aria-hidden />
            </button>
            <a
              href={choosePhotoLink(gallery[open].src)}
              target="_blank"
              rel="noreferrer"
              className="relative inline-flex h-14 items-center gap-3 rounded-full bg-gold px-7 text-[15px] font-normal text-ink shadow-xl transition-colors hover:bg-linen"
            >
              <MessageCircle className="size-5" strokeWidth={1.6} aria-hidden />
              Осы пердені таңдадым
            </a>
            <span className="absolute top-7 left-6 text-xs tracking-[0.3em] text-linen/80">
              {open + 1} / {gallery.length}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
