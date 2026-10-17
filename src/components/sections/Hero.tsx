import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react"
import { ArrowDown, MessageCircle } from "lucide-react"
import { ClothCanvas, type RGB } from "@/components/ClothCanvas"
import { Magnetic } from "@/components/ui/magnetic"
import { business, heroPhotos } from "@/data"
import { useIntroDone } from "@/lib/intro"

// 3D перде бөлек жүктеледі — сайттың алғашқы ашылуы ауырламас үшін.
const Curtain3D = lazy(() => import("@/components/Curtain3D"))
const ArchGL = lazy(() => import("@/components/ArchGL"))

const IVORY: RGB = [242, 233, 219]
const ease = [0.22, 1, 0.36, 1] as const

// WebGL2 бар, жады жеткілікті және анимация өшірілмеген құрылғыда ғана 3D.
function canUse3D() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  if (memory !== undefined && memory < 4) return false
  try {
    return !!document.createElement("canvas").getContext("webgl2")
  } catch {
    return false
  }
}

function Curtains2D({ scale }: { scale: MotionValue<number> }) {
  return (
    <>
      <div aria-hidden className="absolute inset-x-0 top-0 z-30 h-2.5 bg-brass shadow-[0_6px_14px_-4px_rgba(30,26,22,0.4)]" />
      <motion.div style={{ scaleX: scale, originX: 0 }} className="absolute inset-y-0 left-0 z-20 w-[51%]">
        <ClothCanvas color={IVORY} folds={9} seed={0} />
      </motion.div>
      <motion.div style={{ scaleX: scale, originX: 1 }} className="absolute inset-y-0 right-0 z-20 w-[51%]">
        <ClothCanvas color={IVORY} folds={9} seed={2.7} />
      </motion.div>
    </>
  )
}

// Доғадағы слайд-шоу: үздік фотолар ақырын үлкейе отырып ауысады.
function ArchSlideshow() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % heroPhotos.length), 3800)
    return () => clearInterval(t)
  }, [])
  return (
    <AnimatePresence initial={false}>
      <motion.img
        key={heroPhotos[i]}
        src={heroPhotos[i]}
        srcSet={`${heroPhotos[i].replace(".webp", "-480.webp")} 480w, ${heroPhotos[i].replace(".webp", "-900.webp")} 900w, ${heroPhotos[i]} 1400w`}
        sizes="(max-width: 640px) 60vw, 420px"
        alt="Perde Mariam тіккен перде, интерьерде"
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ opacity: 0, scale: 1.18 }}
        animate={{ opacity: 1, scale: 1.04 }}
        exit={{ opacity: 0 }}
        transition={{ opacity: { duration: 1.4, ease: "easeInOut" }, scale: { duration: 5.5, ease: "linear" } }}
      />
    </AnimatePresence>
  )
}

function RevealLine({ children, delay, className }: { children: string; delay: number; className?: string }) {
  const ready = useIntroDone()
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        className={`block ${className ?? ""}`}
        initial={{ y: "110%" }}
        animate={ready ? { y: "0%" } : { y: "110%" }}
        transition={{ duration: 1.3, ease, delay }}
      >
        {children}
      </motion.span>
    </span>
  )
}

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] })
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 })
  const [use3D] = useState(canUse3D)
  const introDone = useIntroDone()

  const panelScale = useTransform(p, [0, 0.62], [1, 0.14])
  const titleY = useTransform(p, [0, 0.35], ["0vh", "-18vh"])
  const titleOpacity = useTransform(p, [0, 0.28], [1, 0])
  const sceneScale = useTransform(p, [0, 0.85], [1.18, 1])
  const glow = useTransform(p, [0.1, 0.7], [0.2, 1])
  const revealOpacity = useTransform(p, [0.38, 0.7], [0, 1])
  const revealY = useTransform(p, [0.38, 0.75], [80, 0])
  const hintOpacity = useTransform(p, [0, 0.08], [1, 0])

  return (
    <section ref={ref} id="top" className="relative h-[260vh]">
      <div className="sticky top-0 h-svh overflow-hidden bg-linen">
        {/* Перде артындағы сахна */}
        <motion.div style={{ scale: sceneScale }} className="absolute inset-0">
          <motion.div
            aria-hidden
            style={{ opacity: glow }}
            className="absolute top-[10vh] left-1/2 h-[70vh] w-[70vw] -translate-x-1/2 rounded-full bg-sand/70 blur-[120px]"
          />
          <div className="absolute top-[13vh] left-1/2 h-[34vh] sm:h-[58vh] w-[min(420px,58vw)] -translate-x-1/2 overflow-hidden rounded-t-full bg-linen-deep shadow-[0_60px_120px_-60px_rgba(30,26,22,0.5)]">
            {use3D ? (
              <Suspense fallback={<ArchSlideshow />}>
                <ArchGL photos={heroPhotos} />
              </Suspense>
            ) : (
              <ArchSlideshow />
            )}
          </div>
        </motion.div>

        <motion.div
          style={{ opacity: revealOpacity, y: revealY }}
          className="absolute inset-x-0 bottom-[6vh] z-10 flex flex-col items-center gap-6 px-5 text-center"
        >
          <h2 className="font-serif text-[clamp(30px,6vw,96px)] leading-[0.95] font-light tracking-[-0.03em]">
            Үйіңізге <em className="font-normal text-sage">сән</em> мен жайлылық.
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Magnetic intensity={0.2} range={120}>
              <a
                href={business.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-3 rounded-full bg-ink px-6 sm:h-14 sm:px-7 text-[15px] font-normal text-linen transition-colors hover:bg-sage"
              >
                <MessageCircle className="size-[18px]" strokeWidth={1.6} aria-hidden />
                WhatsApp-қа жазу
              </a>
            </Magnetic>
            <a
              href="#collections"
              className="inline-flex h-12 items-center rounded-full border border-ink/25 px-6 sm:h-14 sm:px-7 text-[15px] font-normal transition hover:border-ink hover:bg-ink hover:text-linen"
            >
              Коллекция
            </a>
          </div>
        </motion.div>

        {/* Перделер */}
        {use3D ? (
          <Suspense fallback={<Curtains2D scale={panelScale} />}>
            <div className="absolute inset-0 z-20">
              <Curtain3D progress={p} />
            </div>
          </Suspense>
        ) : (
          <Curtains2D scale={panelScale} />
        )}

        {/* Жабық перде үстіндегі тақырып */}
        <motion.div
          style={{ y: titleY, opacity: titleOpacity }}
          className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center px-5 text-center"
        >
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.6em" }}
            animate={introDone ? { opacity: 1, letterSpacing: "0.32em" } : { opacity: 0, letterSpacing: "0.6em" }}
            transition={{ duration: 1.6, ease, delay: 0.2 }}
            className="mb-8 text-[11px] font-normal text-ink-soft uppercase sm:text-xs"
          >
            Перде ательесі · Астана · {business.years} жыл
          </motion.p>
          <h1 className="font-serif text-[clamp(46px,11vw,190px)] leading-[0.86] font-extralight tracking-[-0.045em]">
            <RevealLine delay={0.35}>Жайлылықты</RevealLine>
            <RevealLine delay={0.5} className="italic text-sage">
              тігеміз.
            </RevealLine>
          </h1>
        </motion.div>

        <motion.div
          style={{ opacity: hintOpacity }}
          className="absolute inset-x-0 bottom-8 z-30 flex flex-col items-center gap-3 text-[11px] font-normal tracking-[0.28em] text-ink-soft uppercase"
        >
          Пердені ашыңыз
          <motion.span animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
            <ArrowDown className="size-4" strokeWidth={1.4} aria-hidden />
          </motion.span>
        </motion.div>
      </div>
    </section>
  )
}
