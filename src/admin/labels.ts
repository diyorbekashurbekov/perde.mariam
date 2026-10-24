// GA4-тегі техникалық атауларды адамға түсінікті қазақша атауға айналдыру.

export const SOURCE: Record<string, string> = {
  hero: "Бірінші экран",
  nav: "Жоғарғы мәзір",
  nav_mobile: "Телефондағы мәзір",
  floating: "«Бағасын білу» (жүзгіш)",
  collection: "Коллекция карточкасы",
  catalog_card: "Каталогтағы фото",
  catalog_lightbox: "Үлкейтілген фото",
  contact: "Байланыс бөлімі",
  fabric_card: "Маталар: карточка",
  fabric_lightbox: "Маталар: үлкейтілген фото",
  direct_link: "Тікелей сілтеме (#catalog)",
  hero_button: "«Каталогты көру» батырмасы",
  hero_reveal: "Бірінші экрандағы сілтеме",
  "(not set)": "Белгісіз",
}

export const DEVICE: Record<string, string> = { mobile: "Телефон", desktop: "Компьютер", tablet: "Планшет", smart_tv: "Теледидар" }

const CITY: Record<string, string> = {
  Astana: "Астана", "Nur-Sultan": "Астана", Almaty: "Алматы", Karaganda: "Қарағанды", Shymkent: "Шымкент",
  Kosshy: "Қосшы", Aktobe: "Ақтөбе", Pavlodar: "Павлодар", Kokshetau: "Көкшетау", Taraz: "Тараз",
  Atyrau: "Атырау", Oral: "Орал", Uralsk: "Орал", Semey: "Семей", "Ust-Kamenogorsk": "Өскемен",
  Kostanay: "Қостанай", Petropavl: "Петропавл", Turkistan: "Түркістан", Kyzylorda: "Қызылорда", Aktau: "Ақтау",
  Taldykorgan: "Талдықорған", Ekibastuz: "Екібастұз", Temirtau: "Теміртау", Moscow: "Мәскеу", Tashkent: "Ташкент",
  "(not set)": "Белгісіз",
}
export const city = (n: string) => CITY[n] ?? n

export const MONTHS = ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"]
export const dayMonth = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number)
  return `${d} ${MONTHS[m - 1]}`
}
export const dayMonthShort = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number)
  return `${d} ${MONTHS[m - 1].slice(0, 3)}`
}

export const fmt = (n: number) => Math.round(n || 0).toLocaleString("ru-RU")
export const pct = (x: number) => `${(Math.round(x * 10) / 10).toString().replace(".", ",")}%`
