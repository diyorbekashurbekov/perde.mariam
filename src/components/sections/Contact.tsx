import { useRef } from "react"
import { motion, useInView } from "motion/react"
import { MessageCircle, Phone } from "lucide-react"
import { ClothCanvas, type RGB } from "@/components/ClothCanvas"
import { Magnetic } from "@/components/ui/magnetic"
import { business } from "@/data"
import { track } from "@/lib/analytics"

const EMERALD: RGB = [40, 88, 72]
const ease = [0.22, 1, 0.36, 1] as const

export function Contact() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-20%" })

  const info = [
    { label: "Мекенжай", value: business.address, href: undefined },
    { label: "Телефон", value: business.phoneDisplay, href: business.phoneHref },
    { label: "Instagram · пікірлер", value: business.instagramHandle, href: business.instagram },
  ]

  return (
    <section id="contact" className="px-3 py-[10vh] sm:px-6">
      <div ref={ref} className="relative mx-auto min-h-[70vh] sm:min-h-[88vh] max-w-[1360px] overflow-hidden rounded-[40px]">
        <div className="absolute inset-0">
          <ClothCanvas color={EMERALD} folds={14} seed={1.3} />
        </div>
        <div className="relative z-10 flex min-h-[70vh] sm:min-h-[88vh] flex-col justify-between gap-16 p-6 sm:p-12 lg:p-16">
          <p className="text-xs font-normal tracking-[0.3em] text-linen/75 uppercase">(05) Байланыс<span className="hidden sm:inline"> · тышқанмен матаны тербетіп көріңіз</span></p>

          <h2 className="font-serif text-[clamp(38px,8.4vw,150px)] leading-[0.9] font-extralight tracking-[-0.045em] text-linen">
            {["Пердеңізді", "бірге", "таңдайық."].map((w, i) => (
              <span key={w} className="inline-block overflow-hidden pr-[0.25em] pb-[0.08em] align-bottom">
                <motion.span
                  className={i === 2 ? "inline-block italic text-gold" : "inline-block"}
                  initial={{ y: "110%" }}
                  animate={inView ? { y: "0%" } : {}}
                  transition={{ duration: 1.2, ease, delay: i * 0.12 }}
                >
                  {w}
                </motion.span>
              </span>
            ))}
          </h2>

          <div className="flex flex-col gap-10">
            <div className="flex flex-wrap gap-3">
              <Magnetic intensity={0.2} range={140}>
                <a
                  href={business.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track("whatsapp_click", { source: "contact" })}
                  className="inline-flex h-13 items-center gap-3 rounded-full bg-gold px-6 text-sm sm:h-16 sm:px-8 sm:text-base font-normal text-ink transition-colors hover:bg-linen"
                >
                  <MessageCircle className="size-5" strokeWidth={1.6} aria-hidden />
                  WhatsApp-қа жазу
                </a>
              </Magnetic>
              <a
                href={business.phoneHref}
                className="inline-flex h-13 items-center gap-3 rounded-full border border-linen/40 px-6 text-sm sm:h-16 sm:px-8 sm:text-base font-normal text-linen transition hover:bg-linen/10"
              >
                <Phone className="size-[18px]" strokeWidth={1.6} aria-hidden />
                Қоңырау шалу
              </a>
            </div>
            <dl className="grid gap-6 border-t border-linen/20 pt-8 text-linen md:grid-cols-3">
              {info.map((it) => (
                <div key={it.label} className="flex flex-col gap-2">
                  <dt className="text-[11px] font-normal tracking-[0.24em] text-linen/70 uppercase">{it.label}</dt>
                  <dd className="font-serif text-lg leading-snug font-light sm:text-2xl">
                    {it.href ? (
                      <a href={it.href} target={it.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="underline-offset-4 hover:underline">
                        {it.value}
                      </a>
                    ) : (
                      it.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
