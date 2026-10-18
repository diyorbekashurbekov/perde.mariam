import { useRef, useState } from "react"
import { AnimatePresence } from "motion/react"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { BlurFade } from "@/components/ui/blur-fade"
import { Lightbox } from "@/components/Lightbox"
import { reviews } from "@/data"

// Клиенттердің нақты пікірлері: скриншоттар саусақпен сырғытылады, басқанда толық экранда ашылады.
export function Reviews() {
  const [open, setOpen] = useState<number | null>(null)
  const row = useRef<HTMLDivElement>(null)
  const scroll = (d: number) => row.current?.scrollBy({ left: d * row.current.clientWidth * 0.8, behavior: "smooth" })
  const items = reviews.map((r) => ({ src: r.src, alt: `Клиент пікірі: ${r.quote}` }))

  return (
    <section id="reviews" className="overflow-hidden pt-[12vh] pb-[8vh]">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="mb-[6vh] flex flex-wrap items-end justify-between gap-6">
          <BlurFade inView>
            <h2 className="font-serif text-[clamp(36px,6.4vw,104px)] leading-[0.92] font-extralight tracking-[-0.04em]">
              Клиенттер <em className="font-light text-sage">айтады.</em>
            </h2>
          </BlurFade>
          <div className="flex flex-col gap-2 sm:items-end">
            <p className="text-xs font-normal tracking-[0.3em] text-ink-soft uppercase">(05) Пікірлер</p>
            <p className="text-sm text-ink-soft">{reviews.length} нақты хат · Instagram мен WhatsApp-тан</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          ref={row}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-4 [scrollbar-width:none] sm:gap-6 sm:px-8 [&::-webkit-scrollbar]:hidden"
          style={{ scrollPaddingInline: "20px" }}
          data-lenis-prevent-wheel
        >
          {reviews.map((r, i) => (
            <article key={r.src} className="flex w-[78vw] max-w-[320px] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] bg-paper shadow-[0_24px_60px_-40px_rgba(30,26,22,0.45)] sm:w-[320px]">
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={`Пікірді үлкейту, ${i + 1}/${reviews.length}`}
                className="group relative block h-[300px] overflow-hidden bg-linen-deep sm:h-[340px]"
              >
                <img
                  src={r.src.replace(".webp", "-300.webp")}
                  srcSet={`${r.src.replace(".webp", "-300.webp")} 300w, ${r.src} 590w`}
                  sizes="320px"
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover object-top transition-transform duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03]"
                />
                <span className="absolute right-3 bottom-3 rounded-full bg-ink/70 px-3 py-1 text-[11px] text-linen">Толық көру</span>
              </button>
              <div className="flex flex-1 flex-col gap-4 p-5">
                <Quote className="size-5 text-gold" strokeWidth={1.6} aria-hidden />
                <p className="line-clamp-5 font-serif text-[19px] leading-snug font-light italic">«{r.quote}»</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
                  <span className="font-normal text-ink">{r.who}</span>
                  <span>{r.date} · {r.via}</span>
                </div>
                {r.note && <span className="-mt-2 text-xs text-sage">{r.note}</span>}
              </div>
            </article>
          ))}
        </div>
        <div className="mx-auto mt-4 hidden max-w-[1400px] justify-end gap-3 px-8 sm:flex">
          <button type="button" onClick={() => scroll(-1)} aria-label="Алдыңғы пікірлер" className="grid size-12 place-items-center rounded-full border border-ink/20 transition hover:border-ink hover:bg-ink hover:text-linen">
            <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label="Келесі пікірлер" className="grid size-12 place-items-center rounded-full border border-ink/20 transition hover:border-ink hover:bg-ink hover:text-linen">
            <ChevronRight className="size-5" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open !== null && <Lightbox items={items} index={open} onIndex={setOpen} onClose={() => setOpen(null)} whatsapp={false} />}
      </AnimatePresence>
    </section>
  )
}
