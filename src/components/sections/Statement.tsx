import { useRef } from "react"
import { motion, useScroll, useTransform, type MotionValue } from "motion/react"
import { statement } from "@/data"

function Word({ word, range, progress }: { word: string; range: [number, number]; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, range, [0.12, 1])
  const y = useTransform(progress, range, [14, 0])
  const accent = word.startsWith("*")
  const text = word.replace(/\*/g, "")
  return (
    <motion.span style={{ opacity, y }} className={accent ? "inline-block italic text-sage" : "inline-block"}>
      {text}&nbsp;
    </motion.span>
  )
}

// Скролл жасаған сайын сөздер бірінен соң бірі «жанады».
export function Statement() {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] })
  const words = statement.split(" ")

  return (
    <section aria-label="Біз туралы" className="mx-auto max-w-6xl px-5 py-[14vh] sm:py-[22vh] sm:px-8">
      <p className="mb-10 text-xs font-normal tracking-[0.3em] text-ink-soft uppercase">(01) Ателье</p>
      <p ref={ref} className="font-serif text-[clamp(25px,4.6vw,72px)] leading-[1.12] font-light tracking-[-0.025em]">
        {words.map((w, i) => (
          <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
        ))}
      </p>
    </section>
  )
}
