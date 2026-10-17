import { useEffect, useState } from "react"
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react"
import { finishIntro } from "@/lib/intro"
import { heroPhotos } from "@/data"
import { isLightDevice } from "@/lib/device"

// Кіріспе жүріп тұрғанда доғаның алғашқы фотоларын алдын ала жүктеп, декодтап қоямыз (ең көбі 1,2 с күтеміз).
function preloadHero() {
  const urls = heroPhotos.slice(0, 2).map((s) => (isLightDevice() ? s.replace(".webp", "-900.webp") : s))
  const jobs = urls.map((u) => {
    const img = new Image()
    img.src = u
    return img.decode().catch(() => undefined)
  })
  return Promise.race([Promise.all(jobs), new Promise((r) => setTimeout(r, 1200))])
}

const ease = [0.76, 0, 0.24, 1] as const
const pleats =
  "repeating-linear-gradient(90deg, rgba(0,0,0,.10) 0 10px, rgba(255,255,255,.22) 10px 22px, rgba(0,0,0,.04) 22px 34px)"

// Кіріспе: атау + 0→100 санауыш, содан соң экран перде сияқты ортасынан ашылады.
// index.html-дегі HTML кіріспенің жалғасы — сондықтан атау бірден орнында тұрады (қайта анимацияланбайды).
export function Preloader() {
  const [stage, setStage] = useState<"count" | "open" | "gone">(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "gone" : "count",
  )
  const count = useMotionValue(0)
  const label = useTransform(count, (v) => String(Math.round(v)).padStart(3, "0"))

  useEffect(() => {
    if (stage === "gone") {
      finishIntro()
      return
    }
    if (stage !== "count") return
    document.documentElement.style.overflow = "hidden"
    const controls = animate(count, 100, { duration: 1.2, ease: [0.65, 0, 0.35, 1] })
    // Қаріптерді ең көбі 1,2 с күтеміз — баяу интернетте кіріспе созылып кетпесін.
    const fonts = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))])
    Promise.all([controls.finished, fonts, preloadHero()]).then(() => setStage("open"))
    return () => controls.stop()
  }, [stage, count])

  return (
    <AnimatePresence onExitComplete={() => setStage("gone")}>
      {stage !== "gone" && (
        <motion.div key="preloader" className="fixed inset-0 z-[200]" aria-hidden exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <motion.div
            className="absolute inset-y-0 left-0 w-1/2 bg-[#efe4d2] shadow-[20px_0_40px_rgba(42,33,27,0.18)]"
            style={{ backgroundImage: pleats }}
            animate={stage === "open" ? { x: "-100%" } : { x: "0%" }}
            transition={{ duration: 1.0, ease, delay: 0.1 }}
            onAnimationComplete={() => {
              if (stage === "open") {
                document.documentElement.style.overflow = ""
                finishIntro()
                setStage("gone")
              }
            }}
          />
          <motion.div
            className="absolute inset-y-0 right-0 w-1/2 bg-[#efe4d2] shadow-[-20px_0_40px_rgba(42,33,27,0.18)]"
            style={{ backgroundImage: pleats }}
            animate={stage === "open" ? { x: "100%" } : { x: "0%" }}
            transition={{ duration: 1.0, ease, delay: 0.1 }}
          />
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            animate={stage === "open" ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="overflow-hidden pb-2">
              <motion.p
                className="font-serif text-[clamp(44px,8vw,120px)] leading-none font-extralight tracking-[-0.04em] text-ink"
                initial={false}
              >
                Perde <em className="font-light text-sage">Mariam</em>
              </motion.p>
            </div>
            <motion.p
              className="mt-4 text-[11px] font-normal tracking-[0.36em] text-ink-soft uppercase"
              initial={false}
            >
              Перде ательесі · Астана
            </motion.p>
          </motion.div>
          <motion.span
            className="absolute right-6 bottom-6 font-serif text-[clamp(48px,7vw,96px)] leading-none font-extralight tracking-[-0.04em] text-ink sm:right-10 sm:bottom-8"
            animate={stage === "open" ? { opacity: 0 } : { opacity: 1 }}
          >
            {label}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
