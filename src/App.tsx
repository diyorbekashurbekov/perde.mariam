import { useEffect } from "react"
import Lenis from "lenis"
import { Nav } from "@/components/Nav"
import { Cursor } from "@/components/Cursor"
import { Hero } from "@/components/sections/Hero"
import { Statement } from "@/components/sections/Statement"
import { PhotoRibbon } from "@/components/sections/PhotoRibbon"
import { ZoomReveal } from "@/components/sections/ZoomReveal"
import { Preloader } from "@/components/Preloader"
import { Swatches } from "@/components/sections/Swatches"
import { Collections } from "@/components/sections/Collections"
import { Process } from "@/components/sections/Process"
import { Gallery } from "@/components/sections/Gallery"
import { Contact } from "@/components/sections/Contact"
import { business } from "@/data"

export default function App() {
  // Lenis — скроллды жұмсақ, «майдай» етеді.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const lenis = new Lenis({ lerp: 0.09 })
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href^="#"]')
      const id = link?.getAttribute("href")
      if (!id || id === "#") return
      e.preventDefault()
      lenis.scrollTo(id === "#top" ? 0 : id, { duration: 1.6 })
    }
    document.addEventListener("click", onClick)
    let raf = 0
    const loop = (t: number) => {
      lenis.raf(t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener("click", onClick)
      lenis.destroy()
    }
  }, [])

  return (
    <>
      <Preloader />
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <Statement />
        <PhotoRibbon />
        <Swatches />
        <ZoomReveal />
        <Collections />
        <Process />
        <Gallery />
        <Contact />
      </main>
      <footer className="overflow-hidden px-5 pt-10 sm:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-wrap justify-between gap-4 text-sm font-normal text-ink-soft">
          <span>{business.address}</span>
          <a href={business.phoneHref}>{business.phoneDisplay}</a>
          <a href={business.instagram} target="_blank" rel="noreferrer">
            Instagram ↗
          </a>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <p aria-hidden className="font-serif mt-8 -mb-[0.2em] text-center text-[clamp(52px,17vw,300px)] leading-[0.9] font-extralight tracking-[-0.06em] whitespace-nowrap">
          Perde <em className="text-sage">Mariam</em>
        </p>
      </footer>
    </>
  )
}
