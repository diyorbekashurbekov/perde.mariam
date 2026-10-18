// Сайттың барлық өзгертілетін мазмұны src/content.json файлында тұрады.
// Оны админ панель өзгертеді (…/perde.mariam/admin/ → «Сайтты басқару»), сайт осы жерден оқиды.
import content from "@/content.json"

export type Content = typeof content

// Сурет мекенжайы: сайт қай папкада тұрса да (мысалы, GitHub Pages-тегі /perde.mariam/) дұрыс ашылады.
const base = import.meta.env.BASE_URL
export const photoUrl = (key: string) => `${base}photos/${key}.webp`
export const reviewUrl = (key: string) => `${base}reviews/${key}.webp`

const b = content.business
// «8 707 …» деп жазылса да халықаралық «7 707 …» пішініне келтіреміз (WhatsApp сілтемесі үшін).
const digits = b.phone.replace(/\D/g, "").replace(/^8(?=\d{10}$)/, "7")
export const business = {
  name: b.name,
  years: b.years,
  phoneDisplay: b.phoneDisplay,
  phoneHref: `tel:+${digits}`,
  whatsapp: `https://wa.me/${digits}`,
  instagram: `https://www.instagram.com/${b.instagramHandle.replace(/^@/, "")}/`,
  instagramHandle: b.instagramHandle,
  address: b.address,
}

// *жұлдызшамен* белгіленген сөздер курсивпен ерекшеленеді.
export const statement = content.statement

// Hero доғасындағы слайд-шоу.
export const heroPhotos = content.heroPhotos.map(photoUrl)

export const collections = content.collections.map((c) => ({ title: c.title, note: c.note, photo: c.photo, src: photoUrl(c.img) }))

export const steps = content.steps.map((s) => ({ title: s.title, note: s.note, photo: s.photo, src: photoUrl(s.img) }))

// Портфолио — ательенің нақты жұмыстары. Алғашқы 12-сі бірден көрінеді, қалғаны «Тағы көрсету» батырмасымен ашылады.
export const gallery = content.gallery.map((k) => ({ src: photoUrl(k), alt: "Perde Mariam тіккен перде, интерьерде" }))

// Клиенттердің нақты пікірлері (скриншоттарда телефон нөмірі, толық аты, аватар жасырылған).
export const reviews = content.reviews.map((r) => ({
  src: reviewUrl(r.img),
  quote: r.quote,
  who: r.who,
  date: r.date,
  via: r.via,
  note: "note" in r ? (r.note as string) : undefined,
}))
