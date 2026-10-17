import { business } from "@/data"

// WhatsApp-ты дайын мәтінмен ашатын сілтеме.
export function whatsappLink(text: string) {
  return `${business.whatsapp}?text=${encodeURIComponent(text)}`
}

// «Осы пердені таңдадым» хабарламасы: фото нөмірі + суреттің толық сілтемесі (WhatsApp превью көрсетеді).
export function choosePhotoLink(src: string, collection?: string) {
  const num = src.match(/p(\d+)\.webp$/)?.[1]
  const shareUrl = new URL(src.replace(/\.webp$/, "-share.jpg"), window.location.href).href
  const intro = collection ? `«${collection}» коллекциясынан мына пердені таңдадым` : "Сайттан мына пердені таңдадым"
  const lines = [
    "Сәлеметсіз бе! 👋",
    `${intro} 👇`,
    num ? `Фото №${num}` : "",
    shareUrl,
    "",
    "Бағасы мен тігу мерзімін айтып жібересіз бе?",
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "")
  return whatsappLink(lines.join("\n"))
}
