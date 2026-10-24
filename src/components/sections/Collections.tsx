import { useLayoutEffect, useRef, useState } from "react"
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react"
import { ArrowUpRight, MessageCircle } from "lucide-react"
import { PhotoSlot } from "@/components/PhotoSlot"
import { collections } from "@/data"
import { choosePhotoLink } from "@/lib/whatsapp"
import { track } from "@/lib/analytics"

type CardProps = { c: (typeof collections)[number]; i: number; progress: MotionValue<number>; x: MotionValue<number> }

function Card({ c, i, progress, x }: CardProps) {
  const ref = useRef<HTMLAnchorElement>(null)
  // Суреттің ішкі параллаксы: карточка жылжығанда сурет кері бағытта сәл қозғалады.
  const inner = useTransform(progress, [0, 1], [`${-8 + i * 2}%`, `${8 - i * 2}%`])
  // 3D Cover Flow: экран ортасынан қаншалықты алыс болса, соншалықты бұрылады.
  const dist = useTransform(x, (v) => {
    const el = ref.current
    if (!el) return 0
    const center = el.offsetLeft + el.offsetWidth / 2 + v
    return Math.max(-1.2, Math.min(1.2, (center - window.innerWidth / 2) / window.innerWidth))
  })
  const rotateY = useTransform(dist, [-1.2, 0, 1.2], [38, 0, -38])
  const scale = useTransform(dist, [-1.2, 0, 1.2], [0.82, 1, 0.82])
  const z = useTransform(dist, (d) => -Math.abs(d) * 160)
  return (
    <motion.a
      ref={ref}
      href={choosePhotoLink(c.src, c.title)}
      onClick={() => track("whatsapp_click", { source: "collection", collection: c.title })}
      target="_blank"
      rel="noreferrer"
      style={{ rotateY, scale, z }}
      className="group flex w-[min(62vw,400px)] shrink-0 flex-col gap-5 [transform-style:preserve-3d]"
    >
      <div className="relative h-[40vh] sm:h-[58vh] overflow-hidden rounded-[20px] sm:rounded-[28px]">
        <motion.div style={{ x: inner }} className="absolute inset-[-10%] transition-transform duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.05]">
          <PhotoSlot label={`${c.title} — Shtor Mariam`} src={c.src} sizes="(max-width: 640px) 75vw, 480px" />
        </motion.div>
        <span className="absolute top-3 right-3 grid size-10 sm:top-5 sm:right-5 sm:size-12 place-items-center rounded-full bg-paper/90 text-ink transition duration-500 group-hover:rotate-45 group-hover:bg-ink group-hover:text-linen">
          <ArrowUpRight className="size-5" strokeWidth={1.4} aria-hidden />
        </span>
        <span className="absolute bottom-3 left-3 inline-flex h-10 items-center gap-2 rounded-full bg-paper/92 px-4 text-[13px] font-normal text-ink shadow-[0_8px_24px_-10px_rgba(30,26,22,0.6)] transition-colors group-hover:bg-gold sm:bottom-5 sm:left-5 sm:h-11 sm:text-sm">
          <MessageCircle className="size-4 text-sage" strokeWidth={1.8} aria-hidden />
          Бағасын білу
        </span>
      </div>
      <div className="flex items-baseline gap-4 px-1">
        <span className="font-serif text-lg font-light italic text-sage">0{i + 1}</span>
        <h3 className="font-serif text-[22px] sm:text-[32px] leading-none font-light tracking-[-0.02em]">{c.title}</h3>
        <span className="ml-auto hidden text-sm font-normal text-ink-soft sm:inline">{c.note}</span>
      </div>
    </motion.a>
  )
}

// Тігінен скролл → коллекция көлденең жылжиды.
export function Collections() {
  const ref = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [distance, setDistance] = useState(0)

  useLayoutEffect(() => {
    const measure = () => {
      const track = trackRef.current
      if (track) setDistance(Math.max(0, track.scrollWidth - window.innerWidth))
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] })
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 28, mass: 0.4 })
  const x = useTransform(progress, [0, 1], [0, -distance])

  return (
    <section ref={ref} id="collections" className="relative h-[340vh]">
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden [perspective:1400px]">
        <motion.div ref={trackRef} style={{ x }} className="flex items-end gap-6 pr-[20vw] pl-5 [transform-style:preserve-3d] sm:gap-8 sm:pl-[6vw]">
          <div className="flex w-[min(84vw,520px)] shrink-0 flex-col gap-8 self-center pr-6">
            <p className="text-xs font-normal tracking-[0.3em] text-ink-soft uppercase">(02) Коллекция</p>
            <h2 className="font-serif text-[clamp(36px,6.4vw,104px)] leading-[0.92] font-extralight tracking-[-0.04em]">
              Әр бөлмеге — <em className="font-light text-sage">өз матасы.</em>
            </h2>
            <p className="max-w-xs text-base leading-relaxed text-ink-soft">Төмен айналдырыңыз — коллекция жанға қарай жылжиды.</p>
          </div>
          {collections.map((c, i) => (
            <Card key={c.title} c={c} i={i} progress={progress} x={x} />
          ))}
        </motion.div>
        <div className="absolute inset-x-5 bottom-8 h-px bg-ink/10 sm:inset-x-[6vw]">
          <motion.div style={{ scaleX: progress }} className="h-px origin-left bg-ink" />
        </div>
      </div>
    </section>
  )
}
