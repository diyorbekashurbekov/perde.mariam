import { useState } from "react"
import { AnimatePresence } from "motion/react"
import { Images, MessageCircle } from "lucide-react"
import { BlurFade } from "@/components/ui/blur-fade"
import { CurtainReveal } from "@/components/CurtainReveal"
import { Photo } from "@/components/Photo"
import { Lightbox } from "@/components/Lightbox"
import { fabrics, type Fabric } from "@/data"
import { fabricLink, fmtPrice } from "@/lib/whatsapp"
import { track } from "@/lib/analytics"

const GROUPS = [
  { kind: "tulle", title: "Тюль" },
  { kind: "curtain", title: "Штор маталары" },
] as const

function Card({ f, i, onOpen }: { f: Fabric; i: number; onOpen: () => void }) {
  return (
    <article className="flex h-full flex-col">
      <CurtainReveal delay={0.06 * (i % 4)} className="rounded-[14px] sm:rounded-[22px]">
        <button type="button" onClick={onOpen} aria-label={`${f.name} — суреттерін үлкейту`} className="group relative block aspect-[4/5] w-full overflow-hidden rounded-[14px] bg-ink/5 sm:rounded-[22px]">
          <Photo
            src={f.photos[0].src}
            alt={f.photos[0].alt}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
            className="transition-transform duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]"
          />
          {f.photos.length > 1 && (
            <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-paper/90 px-2.5 py-1 text-[11px] text-ink sm:top-3 sm:right-3 sm:text-xs">
              <Images className="size-3.5" strokeWidth={1.6} aria-hidden />
              {f.photos.length}
            </span>
          )}
        </button>
      </CurtainReveal>
      <div className="mt-3 flex flex-1 flex-col gap-1 px-0.5 sm:mt-4">
        <h4 className="font-serif text-[19px] leading-[1.05] font-light tracking-[-0.02em] sm:text-[26px]">{f.name}</h4>
        <p className="text-[12px] leading-snug text-ink-soft sm:text-sm">{f.note}</p>
        <p className="mt-auto pt-2 text-[18px] font-semibold tracking-[-0.01em] sm:text-[22px]">
          {fmtPrice(f.price)} ₸<span className="text-[13px] font-normal text-ink-soft sm:text-sm"> / метр</span>
        </p>
      </div>
      <a
        href={fabricLink(f.name, f.price, f.photos[0].src)}
        target="_blank"
        rel="noreferrer"
        onClick={() => track("whatsapp_click", { source: "fabric_card", collection: f.name })}
        className="mt-3 inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-ink/20 px-3 text-[12px] font-normal whitespace-nowrap transition-colors hover:border-ink hover:bg-ink hover:text-linen sm:h-11 sm:text-sm"
      >
        <MessageCircle className="size-4 shrink-0 text-sage" strokeWidth={1.8} aria-hidden />
        Осы матаны сұрау
      </a>
    </article>
  )
}

// Маталар мен бағалар: әр мата — бір карточка (бағасы бір метріне). Суретті басса — сол матаның барлық суреті ашылады.
export function Fabrics() {
  const [open, setOpen] = useState<{ f: Fabric; i: number } | null>(null)

  return (
    <section id="fabrics" className="mx-auto max-w-[1400px] px-5 pt-[12vh] pb-[6vh] sm:px-8">
      <div className="mb-[6vh] flex flex-wrap items-end justify-between gap-6">
        <BlurFade inView>
          <h2 className="font-serif text-[clamp(36px,6.4vw,104px)] leading-[0.92] font-extralight tracking-[-0.04em]">
            Маталар мен <em className="font-light text-sage">бағалар.</em>
          </h2>
        </BlurFade>
        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-xs font-normal tracking-[0.3em] text-ink-soft uppercase">(05) Маталар</p>
          <p className="max-w-sm text-sm text-ink-soft sm:text-right">Бағасы — бір метріне. Үлгілерді ательеде қолмен ұстап көруге болады.</p>
        </div>
      </div>

      {GROUPS.map((g) => {
        const list = fabrics.filter((f) => f.kind === g.kind)
        if (!list.length) return null
        return (
          <div key={g.kind} className="mb-[7vh] last:mb-0">
            <div className="mb-5 flex items-baseline gap-4 sm:mb-8">
              <h3 className="font-serif text-[26px] font-light tracking-[-0.02em] sm:text-[40px]">{g.title}</h3>
              <span className="h-px flex-1 bg-ink/15" />
              <span className="text-xs text-ink-soft">{list.length} түрі</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-4">
              {list.map((f, i) => (
                <Card key={f.name} f={f} i={i} onOpen={() => setOpen({ f, i: 0 })} />
              ))}
            </div>
          </div>
        )
      })}

      <AnimatePresence>
        {open && (
          <Lightbox
            items={open.f.photos}
            index={open.i}
            onIndex={(i) => setOpen({ f: open.f, i })}
            onClose={() => setOpen(null)}
            cta={{
              label: `«${open.f.name}» матасын сұрау`,
              short: "Осы матаны сұрау",
              note: `${open.f.name} · ${fmtPrice(open.f.price)} ₸ / метр`,
              href: (src) => fabricLink(open.f.name, open.f.price, src),
              onClick: () =>
                track("whatsapp_click", {
                  source: "fabric_lightbox",
                  collection: open.f.name,
                }),
            }}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
