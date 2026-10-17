import { useState } from "react"
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react"
import { Menu, X } from "lucide-react"
import { business } from "@/data"
import { cn } from "@/lib/utils"

const links = [
  { href: "#collections", label: "Коллекция" },
  { href: "#process", label: "Процесс" },
  { href: "#works", label: "Жұмыстар" },
  { href: "#contact", label: "Байланыс" },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, "change", (v) => {
    const prev = scrollY.getPrevious() ?? 0
    setScrolled(v > 40)
    setHidden(v > prev && v > 400 && !open)
  })

  return (
    <motion.header
      animate={{ y: hidden ? "-110%" : "0%" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled ? "bg-linen/95 sm:bg-linen/80 sm:backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between gap-6 px-5 sm:px-8">
        <a href="#top" className="font-serif text-2xl font-light tracking-[-0.02em]">
          Perde <em className="text-sage">Mariam</em>
        </a>
        <nav aria-label="Негізгі мәзір" className="hidden items-center gap-10 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="group relative text-sm font-normal">
              {l.label}
              <span className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-ink transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" />
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href={business.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="hidden h-11 items-center rounded-full bg-ink px-5 text-sm font-normal text-linen transition-colors hover:bg-sage sm:inline-flex"
          >
            Жазу
          </a>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Мәзірді жабу" : "Мәзірді ашу"}
            aria-expanded={open}
            className="grid size-11 place-items-center rounded-full border border-ink/20 md:hidden"
          >
            {open ? <X className="size-5" strokeWidth={1.4} aria-hidden /> : <Menu className="size-5" strokeWidth={1.4} aria-hidden />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="Мобильді мәзір"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-4 mb-4 flex flex-col rounded-3xl bg-paper p-3 shadow-xl md:hidden"
          >
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="font-serif rounded-2xl px-4 py-3 text-2xl font-light hover:bg-linen">
                {l.label}
              </a>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
