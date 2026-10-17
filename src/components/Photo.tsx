import { useEffect, useRef, useState } from "react"
import meta from "@/photoMeta.json"
import { cn } from "@/lib/utils"

type Meta = Record<string, { w: number; h: number; lqip: string }>

// Жүктелгенше орнында тұратын мөлдір 1×1 сурет (alt мәтіні көрінбеуі үшін).
const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"

type PhotoProps = {
  src: string
  alt: string
  // Браузерге сурет экранда қандай енде көрінетінін айтады — соған қарай кіші нұсқаны таңдайды.
  sizes?: string
  priority?: boolean
  className?: string
}

export function photoKey(src: string) {
  return src.match(/(p\d+)\.webp$/)?.[1]
}

// Барлық суретке ортақ бір бақылаушы: сурет экранға 1500 px қалғанда жүктеле бастайды,
// сондықтан көрермен жеткенде ол дайын тұрады (браузердің lazy-іне тәуелді емеспіз).
const waiting = new Map<Element, () => void>()
let observer: IntersectionObserver | null = null
function watch(el: Element, onNear: () => void) {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        waiting.get(e.target)?.()
        waiting.delete(e.target)
        observer?.unobserve(e.target)
      }
    },
    { rootMargin: "1500px 1500px" },
  )
  waiting.set(el, onNear)
  observer.observe(el)
  return () => {
    waiting.delete(el)
    observer?.unobserve(el)
  }
}

// Жылдам сурет: телефонға 480/900 px нұсқа, жүктелгенше — бұлыңғыр алдын ала көрініс.
export function Photo({ src, alt, sizes = "100vw", priority, className }: PhotoProps) {
  const ref = useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [near, setNear] = useState(!!priority)
  const key = photoKey(src)
  const m = key ? (meta as Meta)[key] : undefined
  const base = src.replace(/\.webp$/, "")

  useEffect(() => {
    if (near || !ref.current) return
    return watch(ref.current, () => setNear(true))
  }, [near])

  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth) setLoaded(true)
  }, [near])

  return (
    <img
      ref={ref}
      // Ретіне мән бар: Safari src-ті srcset-тен бұрын алса, үлкен (1400 px) нұсқаны да жүктеп қояды.
      sizes={near && m ? sizes : undefined}
      srcSet={near && m ? `${base}-480.webp 480w, ${base}-900.webp 900w, ${src} ${m.w}w` : undefined}
      src={near ? src : BLANK}
      width={m?.w}
      height={m?.h}
      alt={alt}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      draggable={false}
      onLoad={() => near && setLoaded(true)}
      style={m && !loaded ? { backgroundImage: `url(${m.lqip})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      className={cn("h-full w-full object-cover", className)}
    />
  )
}
