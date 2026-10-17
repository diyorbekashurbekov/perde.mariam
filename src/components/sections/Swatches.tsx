import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react"
import { business } from "@/data"

type Sample = {
  name: string
  color: string
  left: string
  top: string
  w: number
  h: number
  speed: number
  rz: [number, number]
  rx: [number, number]
  ry: [number, number]
}

// Мата үлгілерінің кітапшасындағыдай карточкалар — скроллда 3D кеңістікте ұшады.
const samples: Sample[] = [
  { name: "No. 01 · Лён", color: "#d8c6ac", left: "4%", top: "8%", w: 170, h: 210, speed: 260, rz: [-18, 6], rx: [20, -10], ry: [-25, 10] },
  { name: "No. 02 · Барқыт", color: "#7b7f5a", left: "78%", top: "4%", w: 150, h: 190, speed: 420, rz: [14, -10], rx: [-15, 20], ry: [30, -5] },
  { name: "No. 03 · Тюль", color: "#efe6d8", left: "84%", top: "52%", w: 190, h: 230, speed: 180, rz: [-8, 12], rx: [10, -20], ry: [-20, 15] },
  { name: "No. 04 · Мақта", color: "#c98b6b", left: "8%", top: "60%", w: 140, h: 170, speed: 520, rz: [22, -4], rx: [-20, 10], ry: [15, -30] },
  { name: "No. 05 · Блэкаут", color: "#4a4541", left: "64%", top: "78%", w: 120, h: 150, speed: 340, rz: [-12, 16], rx: [25, -5], ry: [-10, 25] },
  { name: "No. 06 · Жібек", color: "#e3c3b5", left: "24%", top: "86%", w: 130, h: 160, speed: 600, rz: [10, -18], rx: [-10, 25], ry: [20, -15] },
  { name: "No. 07 · Гранде", color: "#a9b7c2", left: "28%", top: "-2%", w: 120, h: 150, speed: 480, rz: [-6, 14], rx: [15, -15], ry: [-30, 5] },
]

function SampleCard({ s, progress, small }: { s: Sample; progress: MotionValue<number>; small: boolean }) {
  // Телефонда үлгілер кішірейіп, мәтінді жаппас үшін шеттерге ығысады.
  const x = parseFloat(s.left)
  const left = small ? (x < 50 ? `${Math.min(x, 6) - 14}%` : `${Math.max(x, 86)}%`) : s.left
  const k = small ? 0.48 : 1
  const y = useTransform(progress, [0, 1], [s.speed, -s.speed])
  const rotate = useTransform(progress, [0, 1], s.rz)
  const rotateX = useTransform(progress, [0, 1], s.rx)
  const rotateY = useTransform(progress, [0, 1], s.ry)
  return (
    <motion.div
      aria-hidden
      className="absolute rounded-[18px] bg-paper p-2 pb-0 shadow-[0_40px_70px_-30px_rgba(30,26,22,0.45)]"
      style={{ left, top: s.top, width: s.w * k, y, rotate, rotateX, rotateY }}
    >
      <div
        className="rounded-[12px]"
        style={{
          height: s.h * k,
          backgroundColor: s.color,
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(0,0,0,.12) 0 3px, rgba(255,255,255,.14) 3px 7px, rgba(0,0,0,0) 7px 12px), linear-gradient(180deg, rgba(255,255,255,.12), rgba(0,0,0,.12))",
        }}
      />
      <div className="px-1 py-2.5 text-[10px] font-normal tracking-[0.16em] text-ink-soft uppercase">{s.name}</div>
    </motion.div>
  )
}

export function Swatches() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const progress = useSpring(scrollYProgress, { stiffness: 70, damping: 22, mass: 0.5 })
  const years = useTransform(progress, [0.15, 0.48], [0, business.years])
  const yearsText = useTransform(years, (v) => Math.round(v).toString())
  const numberScale = useTransform(progress, [0.1, 0.5], [0.7, 1])
  const [small, setSmall] = useState(() => window.matchMedia("(max-width: 640px)").matches)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)")
    const on = () => setSmall(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])

  return (
    <section ref={ref} className="relative mx-auto min-h-[110vh] sm:min-h-[150vh] max-w-[1400px] overflow-hidden px-5 [perspective:1200px]">
      {samples.map((s) => (
        <SampleCard key={s.name} s={s} progress={progress} small={small} />
      ))}

      <div className="relative z-10 flex min-h-[110vh] sm:min-h-[150vh] flex-col items-center justify-center text-center">
        <motion.div style={{ scale: numberScale }} className="flex items-start">
          <motion.span className="font-serif text-[clamp(110px,26vw,400px)] leading-[0.8] font-extralight tracking-[-0.06em]">
            {yearsText}
          </motion.span>
        </motion.div>
        <p className="font-serif -mt-2 text-[clamp(22px,3.4vw,52px)] font-light italic text-sage">жыл перде әлемінде</p>
        <blockquote className="mt-14 max-w-md">
          <p className="font-serif text-lg leading-snug font-light sm:text-2xl">«Үйіңізге сән мен жайлылық қосыңыз!»</p>
          <footer className="mt-3 text-xs font-normal tracking-[0.28em] text-ink-soft uppercase">— Мариям</footer>
        </blockquote>
        <ul className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-normal text-ink-soft">
          <li>Тек сапалы маталар</li>
          <li aria-hidden>·</li>
          <li>Заманауи дизайн</li>
          <li aria-hidden>·</li>
          <li>Өлшеммен тігу</li>
        </ul>
      </div>
    </section>
  )
}
