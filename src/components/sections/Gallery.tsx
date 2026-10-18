import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { MessageCircle } from "lucide-react"
import { BlurFade } from "@/components/ui/blur-fade"
import { CurtainReveal } from "@/components/CurtainReveal"
import { Photo } from "@/components/Photo"
import { Lightbox } from "@/components/Lightbox"
import { useScrollSkew } from "@/lib/useScrollSkew"
import { choosePhotoLink } from "@/lib/whatsapp"
import { CATALOG_EVENT, isDirectCatalog, track } from "@/lib/analytics"
import { gallery } from "@/data"

const FIRST = 18

// 9500 → «9 500» (мыңдықтарды бос орынмен бөлу).
const fmtPrice = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")

// Портфолио: тор → суретті басқанда толық экранда ашылады (Lightbox: сырғыту, үлкейту).
export function Gallery() {
  const [open, setOpen] = useState<number | null>(null)
  // Тікелей сілтемемен немесе «Каталогты көру» арқылы келсе — барлық сурет бірден ашық.
  const [showAll, setShowAll] = useState(isDirectCatalog)
  useEffect(() => {
    const on = () => setShowAll(true)
    window.addEventListener(CATALOG_EVENT, on)
    return () => window.removeEventListener(CATALOG_EVENT, on)
  }, [])
  const visible = showAll ? gallery : gallery.slice(0, FIRST)
  const skew = useScrollSkew(2.5)


  return (
    <section id="catalog" className="mx-auto max-w-[1400px] px-5 pt-[14vh] pb-[6vh] sm:px-8">
      <div className="mb-[7vh] flex flex-wrap items-end justify-between gap-6">
        <BlurFade inView>
          <h2 className="font-serif text-[clamp(36px,6.4vw,104px)] leading-[0.92] font-extralight tracking-[-0.04em]">
            Жұмыстары<em className="font-light text-sage">мыз.</em>
          </h2>
        </BlurFade>
        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-xs font-normal tracking-[0.3em] text-ink-soft uppercase">(04) Каталог</p>
          <p className="text-sm text-ink-soft">Ұнағанын таңдаңыз — бағасын WhatsApp-та айтамыз.</p>
        </div>
      </div>

      <motion.div style={{ skewY: skew }} className="columns-2 gap-3 sm:gap-5 lg:columns-3">
        {visible.map((g, i) => (
          <CurtainReveal key={g.src} delay={0.06 * (i % 3)} className="mb-3 break-inside-avoid rounded-[14px] sm:mb-5 sm:rounded-[22px]">
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={`Суретті үлкейту, ${i + 1}/${gallery.length}`}
                className="group block w-full overflow-hidden rounded-[14px] sm:rounded-[22px]"
              >
                <Photo
                  src={g.src}
                  alt={g.alt}
                  sizes="(max-width: 640px) 160px, (max-width: 1024px) 50vw, 33vw"
                  className="block h-auto transition-transform duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]"
                />
              </button>
              {/* Мата үлгісінің бағасы — метрлеп (тек бағасы бар суреттерде) */}
              {g.price && (
                <span className="pointer-events-none absolute top-2 left-2 flex flex-col rounded-xl bg-ink/82 px-2.5 py-1.5 leading-tight text-paper backdrop-blur-sm sm:top-4 sm:left-4 sm:px-3 sm:py-2">
                  <span className="text-[9px] font-normal tracking-[0.08em] text-paper/70 uppercase sm:text-[10px]">{g.price.name}</span>
                  <span className="text-[13px] font-semibold sm:text-[16px]">
                    {fmtPrice(g.price.price)} ₸<span className="font-normal text-paper/75">/{g.price.unit}</span>
                  </span>
                </span>
              )}
              {/* Әр суретте тұрақты көрінетін батырма — суретті ашпай-ақ WhatsApp-қа жазу */}
              <a
                href={choosePhotoLink(g.src)}
                target="_blank"
                rel="noreferrer"
                onClick={() => track("whatsapp_click", { source: "catalog_card", photo: g.src.match(/p\d+/)?.[0] })}
                className="absolute inset-x-2 bottom-2 inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-paper px-2.5 text-[11px] font-normal text-ink shadow-[0_8px_24px_-10px_rgba(30,26,22,0.6)] transition-colors hover:bg-gold sm:inset-x-auto sm:bottom-4 sm:left-4 sm:h-11 sm:gap-2 sm:px-5 sm:text-sm"
              >
                <MessageCircle className="size-4 shrink-0 text-sage" strokeWidth={1.8} aria-hidden />
                Үйіме де осындай
              </a>
            </div>
          </CurtainReveal>
        ))}
      </motion.div>

      {!showAll && gallery.length > FIRST && (
        <div className="mt-8 flex justify-center sm:mt-12">
          <button
            type="button"
            onClick={() => {
              setShowAll(true)
              track("catalog_show_all")
            }}
            className="inline-flex h-12 items-center gap-3 rounded-full border border-ink/25 px-7 text-sm font-normal transition hover:border-ink hover:bg-ink hover:text-linen sm:h-14 sm:text-[15px]"
          >
            Тағы көрсету
            <span className="text-ink-soft">+{gallery.length - FIRST}</span>
          </button>
        </div>
      )}

      <AnimatePresence>
        {open !== null && <Lightbox items={gallery} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </section>
  )
}
