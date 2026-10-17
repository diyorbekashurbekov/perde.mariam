// Сурет мекенжайы: сайт қай папкада тұрса да (мысалы, GitHub Pages-тегі /perde.mariam/) дұрыс ашылады.
const photo = (n: number) => `${import.meta.env.BASE_URL}photos/p${n}.webp`

// Бизнес туралы ақпарат — @perde.mariam Instagram парақшасынан алынған.
export const business = {
  name: "Perde Mariam",
  years: 17,
  phoneDisplay: "+7 707 268 50 21",
  phoneHref: "tel:+77072685021",
  whatsapp: "https://wa.me/77072685021",
  instagram: "https://www.instagram.com/perde.mariam/",
  instagramHandle: "@perde.mariam",
  address: "Астана, «Артем» сауда үйі, 5-қабат, 199-бутик",
}

// *жұлдызшамен* белгіленген сөздер курсивпен ерекшеленеді.
export const statement =
  "17 жыл бойы Астанадағы үйлерге *жарық* пен *жайлылық* тігіп келеміз. Тек сапалы мата, заманауи дизайн — әр терезеге өз өлшемі."

// Hero доғасындағы слайд-шоу.
export const heroPhotos = [photo(7), photo(35), photo(31), photo(44), photo(12)]

export const collections = [
  { title: "Тюль", note: "Жеңіл, мөлдір", photo: "Тюль", src: photo(12) },
  { title: "Классика", note: "Ламбрекенмен", photo: "Классика", src: photo(8) },
  { title: "Блэкаут", note: "Жарық өткізбейді", photo: "Блэкаут", src: photo(17) },
  { title: "Люкс", note: "Өрнекті маталар", photo: "Люкс", src: photo(21) },
  { title: "Ұстағышпен", note: "Сәнді бекіткіш", photo: "Ұстағыш", src: photo(22) },
  { title: "Минимализм", note: "Таза сызықтар", photo: "Минимализм", src: photo(4) },
  { title: "Римдік перде", note: "Ықшам, жинақы", photo: "Римдік перде", src: photo(41) },
]

export const steps = [
  { title: "Хабарласу", note: "WhatsApp-қа жазасыз немесе бутикке келесіз.", photo: "Интерьер", src: photo(14) },
  { title: "Өлшеу", note: "Терезеңізді дәл өлшеп, матаны бірге таңдаймыз.", photo: "Терезе", src: photo(5) },
  { title: "Тігу", note: "Өз ательемізде, сіздің өлшеміңізге қарай.", photo: "Мата", src: photo(6) },
  { title: "Орнату", note: "Іліп, әр бүрмесін түзеп береміз.", photo: "Дайын перде", src: photo(19) },
]

// Портфолио — Мариямның нақты жұмыстары.
// Алғашқы 12-сі бірден көрінеді, қалғаны «Тағы көрсету» батырмасымен ашылады.
export const gallery = [
  35, 31, 32, 44, 30, 34, 25, 28, 1, 15, 40, 9, 3, 29, 33, 36, 37, 38, 39, 42, 43, 45, 46, 26, 27, 10, 11, 18,
  20, 23, 24,
].map((n) => ({
  src: photo(n),
  alt: "Perde Mariam тіккен перде, интерьерде",
}))
