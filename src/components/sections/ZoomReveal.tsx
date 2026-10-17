import { useRef } from "react"
import { photoKey } from "@/components/Photo"
import meta from "@/photoMeta.json"
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "motion/react"

const PHOTO = `${import.meta.env.BASE_URL}photos/p35.webp`

// Алып «ПЕРДЕ» жазуының әріптері арқылы ғана фото көрінеді.
// Скроллда жазу үлкейіп, көрермен әріптің ішіне «ұшып кіреді» — соңында толық экранды фото.
export function ZoomReveal() {
  const ref = useRef<HTMLElement>(null)
  const wordRef = useRef<SVGGElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] })
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 28, mass: 0.4 })

  const textScale = useTransform(p, [0, 0.72], [1, 16])
  const veil = useTransform(p, [0.5, 0.78], [1, 0])
  const photoScale = useTransform(p, [0, 1], [1.3, 1])
  const hintOpacity = useTransform(p, [0, 0.12], [1, 0])
  const capOpacity = useTransform(p, [0.78, 0.93], [0, 1])
  const capY = useTransform(p, [0.78, 0.95], [50, 0])

  // <mask> ішінде CSS transform-origin сенімсіз, сондықтан SVG transform атрибутын өзіміз құрамыз.
  const applyScale = (s: number) => {
    const g = wordRef.current
    if (!g) return
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    g.setAttribute("transform", `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`)
  }
  useMotionValueEvent(textScale, "change", applyScale)

  return (
    <section ref={ref} aria-label="Перде әлемі" className="relative h-[240vh] sm:h-[280vh]">
      <div className="sticky top-0 h-svh overflow-hidden">
        <motion.img
          src={PHOTO}
          srcSet={`${PHOTO.replace(".webp", "-900.webp")} 900w, ${PHOTO} 1400w`}
          sizes="100vw"
          alt="Perde Mariam тіккен перделер, қонақ бөлмеде"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ scale: photoScale, backgroundImage: `url(${(meta as Record<string, { lqip: string }>)[photoKey(PHOTO) ?? ""]?.lqip})`, backgroundSize: "cover" }}
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/70 to-transparent" />

        <motion.svg aria-hidden style={{ opacity: veil }} className="absolute inset-0 h-full w-full">
          <defs>
            <mask id="zoom-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
              <rect width="100%" height="100%" fill="white" />
              <g ref={(el) => { wordRef.current = el; applyScale(textScale.get()) }}>
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="black"
                  style={{
                    fontFamily: "'Noto Serif Display', Georgia, serif",
                    fontWeight: 400,
                    fontSize: "min(25vw, 34vh)",
                    letterSpacing: "-0.04em",
                  }}
                >
                  ПЕРДЕ
                </text>
              </g>
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="#f7f1e8" mask="url(#zoom-mask)" />
        </motion.svg>

        <motion.p
          style={{ opacity: hintOpacity }}
          className="absolute inset-x-0 top-[18vh] text-center text-[11px] font-normal tracking-[0.32em] text-ink-soft uppercase sm:text-xs"
        >
          Әріптің ішіне кіріңіз ↓
        </motion.p>

        <motion.div
          style={{ opacity: capOpacity, y: capY }}
          className="absolute inset-x-0 bottom-[8vh] flex flex-col gap-3 px-5 text-linen sm:bottom-[10vh] sm:px-[6vw]"
        >
          <p className="text-[11px] font-normal tracking-[0.3em] text-linen/80 uppercase sm:text-xs">Perde Mariam · Астана</p>
          <h2 className="font-serif max-w-3xl text-[clamp(34px,6vw,96px)] leading-[0.95] font-extralight tracking-[-0.035em]">
            Әр терезеге — <em className="font-light text-gold">өз сұлулығы.</em>
          </h2>
        </motion.div>
      </div>
    </section>
  )
}
