import { useScroll, useSpring, useTransform, useVelocity } from "motion/react"

// Сенсорлы экран (телефон/планшет) ма? Онда скролл эффектін өшіреміз.
const isTouch = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches === true

// Скролл жылдамдығына қарай қисаю: тез айналдырсаң — қисаяды, тоқтасаң — серпіліп орнына келеді.
// Телефонда өшірулі: нативті инерциямен қосылғанда экран «қуып» (қисайып-серпіліп) кетеді.
export function useScrollSkew(max = 3) {
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const smooth = useSpring(velocity, { damping: 40, stiffness: 300 })
  const m = isTouch ? 0 : max
  return useTransform(smooth, [-2500, 0, 2500], [m, 0, -m], { clamp: true })
}
