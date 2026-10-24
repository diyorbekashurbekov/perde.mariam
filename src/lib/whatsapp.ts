import { business } from "@/data"

// WhatsApp-ты дайын мәтінмен ашатын сілтеме.
export function whatsappLink(text: string) {
  return `${business.whatsapp}?text=${encodeURIComponent(text)}`
}

// Жалпы сұрақ (жүзіп жүретін батырма үшін).
export const generalLink = () =>
  whatsappLink("Сәлеметсіз бе! 👋\nСайтыңызды көрдім, перде тіктіргім келеді.\nКеңес беріп, бағасын айтып жібересіз бе?")

// 9500 → «9 500» (мыңдықтарды бос орынмен бөлу).
export const fmtPrice = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")

// Мата бойынша хабарлама: атауы, бағасы және суреттің сілтемесі.
export function fabricLink(name: string, price: number, src: string) {
  const shareUrl = new URL(src.replace(/\.webp$/, "-share.jpg"), window.location.href).href
  const lines = ["Сәлеметсіз бе! 👋", `Сайттан «${name}» матасын көрдім (${fmtPrice(price)} ₸/м).`, "Осы матадан перде тіктіргім келеді.", shareUrl, "", "Толығырақ айтып жібересіз бе?"]
  return whatsappLink(lines.join("\n"))
}

// Нақты сурет бойынша хабарлама: фото нөмірі + суреттің толық сілтемесі (WhatsApp превью көрсетеді).
export function choosePhotoLink(src: string, collection?: string) {
  const num = src.match(/p(\d+)\.webp$/)?.[1]
  const shareUrl = new URL(src.replace(/\.webp$/, "-share.jpg"), window.location.href).href
  const seen = collection
    ? `Сайттан «${collection}» коллекциясындағы мына пердені көрдім — қатты ұнады 😍`
    : "Сайттан мына пердені көрдім — қатты ұнады 😍"
  const lines = ["Сәлеметсіз бе! 👋", seen, "Үйіме де дәл осындай тігіп берсеңіз деймін.", num ? `Фото №${num}` : "", shareUrl, "", "Бағасы қанша болады?"]
  return whatsappLink(lines.filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n"))
}
