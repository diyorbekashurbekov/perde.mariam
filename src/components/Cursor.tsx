import { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring } from "motion/react"

// Тышқанға ілесетін жұмсақ сақина; сілтеменің үстінде үлкейеді. Тек тышқаны бар құрылғыларда.
export function Cursor() {
  const [enabled, setEnabled] = useState(false)
  const [active, setActive] = useState(false)
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 })

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!fine || reduce) return
    setEnabled(true)
    document.documentElement.classList.add("has-cursor")
    const move = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setActive(!!(e.target as Element | null)?.closest?.("a, button, input, label"))
    }
    window.addEventListener("pointermove", move, { passive: true })
    return () => {
      window.removeEventListener("pointermove", move)
      document.documentElement.classList.remove("has-cursor")
    }
  }, [x, y])

  if (!enabled) return null
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[100] rounded-full border border-ink mix-blend-difference"
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%", borderColor: "#f6f2ec" }}
      animate={{ width: active ? 64 : 18, height: active ? 64 : 18, backgroundColor: active ? "#f6f2ec" : "rgba(246,242,236,0)" }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
    />
  )
}
