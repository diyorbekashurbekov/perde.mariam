import { business } from "@/data"

// WhatsApp-ты дайын мәтінмен ашатын сілтеме.
export function whatsappLink(text: string) {
  return `${business.whatsapp}?text=${encodeURIComponent(text)}`
}

// Жалпы сұрақ (жүзіп жүретін батырма үшін).
export const generalLink = () =>
  whatsappLink("Сәлеметсіз бе! 👋\nСайтыңызды көрдім, перде тіктіргім келеді.\nКеңес беріп, бағасын айтып жібересіз бе?")

// Нақты сурет бойынша хабарлама: фото нөмірі + суреттің толық сілтемесі (WhatsApp превью көрсетеді).
export function choosePhotoLink(src: string, collection?: string) {
  const num = src.match(/p(\d+)\.webp$/)?.[1]
  const shareUrl = new URL(src.replace(/\.webp$/, "-share.jpg"), window.location.href).href
  const seen = collection
    ? `Сайттан «${collection}» коллекциясындағы мына пердені көрдім — қатты ұнады 😍`
    : "Сайттан мына пердені көрдім — қатты ұнады 😍"
  const lines = ["Сәлеметсіз бе! 👋", seen, "Маған да дәл осындай керек.", num ? `Фото №${num}` : "", shareUrl, "", "Бағасы қанша болады?"]
  return whatsappLink(lines.filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n"))
}
