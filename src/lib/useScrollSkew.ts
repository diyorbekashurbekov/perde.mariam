import { useScroll, useSpring, useTransform, useVelocity } from "motion/react"

// Скролл жылдамдығына қарай қисаю: тез айналдырсаң — қисаяды, тоқтасаң — серпіліп орнына келеді.
export function useScrollSkew(max = 3) {
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const smooth = useSpring(velocity, { damping: 40, stiffness: 300 })
  return useTransform(smooth, [-2500, 0, 2500], [max, 0, -max], { clamp: true })
}
