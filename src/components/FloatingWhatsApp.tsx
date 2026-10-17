import { useEffect, useState } from "react"
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react"
import { MessageCircle } from "lucide-react"
import { generalLink } from "@/lib/whatsapp"
import { track } from "@/lib/analytics"
import { isLightDevice } from "@/lib/device"
import { useIntroDone } from "@/lib/intro"

// «Бағасын білу» батырмасы: телефонда бірінші экраннан (кіріспе біткен соң) бастап көрінеді,
// компьютерде hero-дан кейін; Байланыс бөлімінде жасырынады.
export function FloatingWhatsApp() {
  const { scrollY } = useScroll()
  const [past, setPast] = useState(false)
  const [atContact, setAtContact] = useState(false)
  const [light] = useState(isLightDevice)
  const introDone = useIntroDone()

  useMotionValueEvent(scrollY, "change", (v) => setPast(v > window.innerHeight * 2.4))

  useEffect(() => {
    const el = document.getElementById("contact")
    if (!el) return
    const io = new IntersectionObserver(([e]) => setAtContact(e.isIntersecting), { rootMargin: "0px 0px -30% 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <AnimatePresence>
      {introDone && (light || past) && !atContact && (
        <motion.a
          href={generalLink()}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("whatsapp_click", { source: "floating" })}
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="fixed right-4 bottom-4 z-[60] inline-flex h-14 items-center gap-2.5 rounded-full bg-sage pr-6 pl-5 text-[15px] font-normal text-linen shadow-[0_18px_40px_-14px_rgba(46,94,78,0.8)] sm:right-8 sm:bottom-8"
        >
          <span className="relative grid size-6 place-items-center">
            <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-gold/50" />
            <MessageCircle className="relative size-5" strokeWidth={1.8} aria-hidden />
          </span>
          Бағасын білу
        </motion.a>
      )}
    </AnimatePresence>
  )
}
