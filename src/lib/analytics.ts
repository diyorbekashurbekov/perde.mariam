// Аналитика оқиғалары. Сайтта әзірге аналитика жоқ, сондықтан оқиғалар барлық танымал
// жүйелерге «дайын» күйде жіберіледі — index.html-ге GA4/GTM, Яндекс Метрика немесе
// Meta Pixel кодын қосқан сәттен бастап олар бірден келе бастайды.
//
// Оқиғалар:
//   whatsapp_click  { source, photo?, collection? }  — WhatsApp батырмасы басылды
//   catalog_open    { source }                       — каталогқа өтті (hero / nav / direct_link)
//   catalog_show_all                                  — каталогтың барлық суреті ашылды

type Params = Record<string, string | number | undefined>

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

// Тікелей каталог сілтемесі: …/perde.mariam/#catalog
export const isDirectCatalog = () => typeof window !== "undefined" && window.location.hash === "#catalog"
