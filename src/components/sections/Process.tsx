import { useRef } from "react"
import { motion, useScroll, useTransform, type MotionValue } from "motion/react"
import { PhotoSlot } from "@/components/PhotoSlot"
import { CurtainReveal } from "@/components/CurtainReveal"
import { steps } from "@/data"

const tones = ["bg-paper", "bg-sand-soft", "bg-sage-soft", "bg-linen-deep"]

function StepCard({ i, progress }: { i: number; progress: MotionValue<number> }) {
  const s = steps[i]
  const n = steps.length
  // Келесі карточка үстіне шыққанда алдыңғысы сәл кішірейіп, артқа кетеді.
  const scale = useTransform(progress, [i / n, 1], [1, 1 - (n - 1 - i) * 0.045])
  return (
    <div className="sticky h-[62vh] sm:h-[78vh]" style={{ top: `calc(11vh + ${i * 26}px)` }}>
      <motion.article
        style={{ scale }}
        className={`${tones[i]} grid h-[56vh] sm:h-[72vh] origin-top grid-cols-1 grid-rows-[auto_1fr] md:grid-rows-1 gap-6 overflow-hidden rounded-[26px] p-5 sm:rounded-[36px] shadow-[0_-20px_60px_-40px_rgba(30,26,22,0.35)] sm:p-10 md:grid-cols-[1fr_1.1fr] md:gap-10`}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-baseline gap-5">
            <span className="font-serif text-[clamp(28px,3vw,44px)] font-light italic text-sage">0{i + 1}</span>
            <h3 className="font-serif text-[clamp(32px,5.6vw,92px)] leading-[0.95] font-extralight tracking-[-0.035em]">{s.title}</h3>
          </div>
          <p className="max-w-sm text-sm leading-relaxed sm:text-lg text-ink-soft">{s.note}</p>
        </div>
        <CurtainReveal className="min-h-0 rounded-[24px]">
          <PhotoSlot label={s.photo} src={s.src} sizes="(max-width: 768px) 90vw, 50vw" />
        </CurtainReveal>
      </motion.article>
    </div>
  )
}

export function Process() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] })

  return (
    <section id="process" className="mx-auto max-w-[1360px] px-3 pt-[16vh] pb-[10vh] sm:px-6">
      <div className="mb-[8vh] flex flex-wrap items-end justify-between gap-6 px-2">
        <h2 className="font-serif text-[clamp(36px,6.4vw,104px)] leading-[0.92] font-extralight tracking-[-0.04em]">
          Төрт <em className="font-light text-sage">қадам.</em>
        </h2>
        <p className="text-xs font-normal tracking-[0.3em] text-ink-soft uppercase">(03) Процесс</p>
      </div>
      <div ref={ref}>
        {steps.map((s, i) => (
          <StepCard key={s.title} i={i} progress={scrollYProgress} />
        ))}
      </div>
    </section>
  )
}
