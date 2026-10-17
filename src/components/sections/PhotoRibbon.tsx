import { useRef } from "react"
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react"
import { gallery } from "@/data"
import { useScrollSkew } from "@/lib/useScrollSkew"
import { Photo } from "@/components/Photo"

const rowA = gallery.slice(0, 8)
const rowB = gallery.slice(8, 16)

function Row({ items, x, skew }: { items: typeof gallery; x: MotionValue<string>; skew: MotionValue<number> }) {
  return (
    <motion.div style={{ x, skewX: skew }} className="flex w-max gap-3 sm:gap-5">
      {items.map((g) => (
        <div key={g.src} className="h-[26vh] w-[19vh] shrink-0 overflow-hidden rounded-[16px] sm:h-[42vh] sm:w-[31vh] sm:rounded-[24px]">
          <Photo src={g.src} alt="" sizes="(max-width: 640px) 160px, 320px" />
        </div>
      ))}
    </motion.div>
  )
}

// Нақты жұмыстардан тұратын қисық фото-лента: скроллда екі қатар қарама-қарсы жылжиды.
export function PhotoRibbon() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 26, mass: 0.4 })
  const xA = useTransform(p, [0, 1], ["4%", "-38%"])
  const xB = useTransform(p, [0, 1], ["-38%", "4%"])
  const skew = useScrollSkew(4)

  return (
    <section ref={ref} aria-label="Біздің жұмыстардан" className="relative overflow-hidden py-[10vh] sm:py-[14vh]">
      <div className="flex -rotate-[4deg] flex-col gap-3 sm:gap-5">
        <Row items={rowA} x={xA} skew={skew} />
        <Row items={rowB} x={xB} skew={skew} />
      </div>
    </section>
  )
}
