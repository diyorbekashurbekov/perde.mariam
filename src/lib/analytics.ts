// Аналитика оқиғалары. Сайтта әзірге аналитика жоқ, сондықтан оқиғалар барлық танымал
// жүйелерге «дайын» күйде жіберіледі — index.html-ге GA4/GTM, Яндекс Метрика немесе
// Meta Pixel кодын қосқан сәттен бастап олар бірден келе бастайды.
//
// Оқиғалар:
//   whatsapp_click  { source, photo?, collection? }  — WhatsApp батырмасы басылды
//   catalog_open    { source }                       — каталогқа өтті (hero / nav / direct_link)
//   catalog_show_all                                  — каталогтың барлық суреті ашылды

type Params = Record<string, string | number | undefined>

function addScript(src: string) {
  const s = document.createElement("script")
  s.async = true
  s.src = src
  document.head.appendChild(s)
}

// GA4 мен Meta Pixel тек build кезінде нақты ID берілсе ғана қосылады (жалған ID жоқ).
// ID-лер GitHub Actions арқылы VITE_GA4_ID / VITE_META_PIXEL_ID болып келеді (.github/workflows/deploy.yml).
export function initAnalytics() {
  const ga = import.meta.env.VITE_GA4_ID?.trim()
  if (ga && /^G-[A-Z0-9]+$/.test(ga)) {
    addScript(`https://www.googletagmanager.com/gtag/js?id=${ga}`)
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments)
    }
    window.gtag("js", new Date())
    window.gtag("config", ga)
  }
  const px = import.meta.env.VITE_META_PIXEL_ID?.trim()
  if (px && /^\d{6,20}$/.test(px) && !window.fbq) {
    type Fbq = ((...args: unknown[]) => void) & { queue: unknown[][]; callMethod?: (...a: unknown[]) => void; loaded: boolean; version: string; push: unknown }
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args)
      else fbq.queue.push(args)
    } as Fbq
    fbq.queue = []
    fbq.loaded = true
    fbq.version = "2.0"
    fbq.push = fbq
    window.fbq = fbq
    addScript("https://connect.facebook.net/en_US/fbevents.js")
    window.fbq("init", px)
    window.fbq("track", "PageView")
  }
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    ym?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    YM_ID?: number
  }
}

export function track(event: string, params: Params = {}) {
  try {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event, ...params }) // Google Tag Manager
    window.gtag?.("event", event, params) // Google Analytics 4
    if (window.ym && window.YM_ID) window.ym(window.YM_ID, "reachGoal", event, params) // Яндекс Метрика
    window.fbq?.("trackCustom", event, params) // Meta (Instagram) Pixel
    window.dispatchEvent(new CustomEvent("perde:track", { detail: { event, ...params } }))
    if (import.meta.env.DEV) console.debug("[track]", event, params)
  } catch {
    // аналитика ешқашан сайтты бұзбауы керек
  }
}

// Каталогтың барлық суретін ашу туралы сигнал (hero батырмасы, тікелей сілтеме).
export const CATALOG_EVENT = "perde:catalog"
export function openCatalog(source: string) {
  track("catalog_open", { source })
  window.dispatchEvent(new Event(CATALOG_EVENT))
}

// Тікелей каталог сілтемесі: …/perde.mariam/#catalog (ескі #works сілтемесі де жұмыс істейді)
export const isDirectCatalog = () =>
  typeof window !== "undefined" && (window.location.hash === "#catalog" || window.location.hash === "#works")
