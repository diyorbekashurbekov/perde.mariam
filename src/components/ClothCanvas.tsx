import { useEffect, useRef } from "react"
import { useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { isLightDevice } from "@/lib/device"

export type RGB = readonly [number, number, number]

type ClothCanvasProps = {
  color: RGB
  folds?: number
  seed?: number
  className?: string
}

// Тірі мата: бүрмелер толқиды, төменгі жағы еркін тербеледі, тышқан «жел» сияқты итереді.
export function ClothCanvas({ color, folds = 9, seed = 0, className }: ClothCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const light = isLightDevice()
    let w = 1
    let h = 1
    let dpr = 1
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, light ? 1.25 : 2)
      w = Math.max(1, Math.round(r.width * dpr))
      h = Math.max(1, Math.round(r.height * dpr))
      canvas.width = w
      canvas.height = h
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // Түс реңктерінің дайын палитрасы — әр кадрда жол құрмас үшін.
    const shades: string[] = []
    for (let i = 0; i < 96; i++) {
      const s = 0.62 + (i / 95) * 0.5
      const c = color.map((v) => Math.min(255, Math.round(v * s)))
      shades.push(`rgb(${c[0]},${c[1]},${c[2]})`)
    }

    let mx = -1
    let my = -1
    let wind = 0
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width
      const ny = (e.clientY - r.top) / r.height
      if (nx < -0.3 || nx > 1.3 || ny < -0.3 || ny > 1.3) return
      if (mx >= 0) wind = Math.max(-1.4, Math.min(1.4, wind + (nx - mx) * 9))
      mx = nx
      my = ny
    }
    window.addEventListener("pointermove", onMove, { passive: true })

    let visible = true
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting))
    io.observe(canvas)

    const start = performance.now()
    let raf = 0
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      if (!visible) return
      const t = reduce ? seed : (now - start) / 1000 + seed
      wind *= 0.965

      // Тұтас астар: тербелген жолақтардың арасынан артқы бет көрінбесін.
      ctx.fillStyle = shades[60]
      ctx.fillRect(0, 0, w, h)
      const cols = Math.min(200, Math.max(48, Math.round(w / (4.5 * dpr))))
      const rows = light ? 36 : 56
      const cw = w / cols
      const rh = h / rows
      const TAU = Math.PI * 2
      // Тар экранда бүрмелер азаяды, сонда олар тым жіңішке болмайды.
      const f = folds * Math.min(1, Math.max(0.45, w / dpr / 700))

      for (let j = 0; j < rows; j++) {
        const v = j / (rows - 1)
        const hang = v * v
        const y = j * rh
        for (let i = 0; i < cols; i++) {
          const u = i / cols
          // Бүрмелердің ені әртүрлі болу үшін бірнеше толқын қосылады.
          const phase =
            u * f * TAU +
            Math.sin(u * f * 0.41 * TAU + seed * 3) * 1.6 +
            Math.sin(u * f * 1.63 * TAU + seed) * 0.45 +
            Math.sin(t * 0.45 + u * 2.4 + seed) * 0.9 * (0.3 + hang)
          const sway = Math.sin(t * 0.8 - v * 2.4 + u * 2.2 + seed) * (0.15 + hang)
          let gust = 0
          if (mx >= 0) {
            const du = u - mx
            const dv = v - my
            gust = Math.exp(-(du * du * 7 + dv * dv * 3)) * wind
          }
          const dx = (sway * 9 + gust * 70 * (0.2 + hang) + Math.sin(phase) * 2.5) * dpr
          const lightness = Math.cos(phase + gust * 2.2 + sway * 0.5)
          const sheen = lightness > 0 ? lightness ** 6 : 0
          let s = 0.66 + lightness * 0.17 + sheen * 0.14 + (1 - v) * 0.07 - Math.abs(gust) * 0.05
          s = s < 0 ? 0 : s > 1 ? 1 : s
          ctx.fillStyle = shades[(s * 95) | 0]
          ctx.fillRect(i * cw + dx, y, cw + 1.5, rh + 1.5)
        }
      }
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener("pointermove", onMove)
    }
  }, [color, folds, seed, reduce])

  return <canvas ref={ref} aria-hidden className={cn("block h-full w-full", className)} />
}
