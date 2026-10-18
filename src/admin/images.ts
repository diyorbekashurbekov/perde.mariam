// Суретті браузердің өзінде дайындау (scripts/photos.py жасайтынмен бірдей нәтиже):
//   pN.webp (ұзын жағы ≤ 1400 px), pN-900.webp, pN-480.webp, pN-share.jpg (WhatsApp превьюі),
//   және photoMeta.json үшін өлшемдері мен бұлыңғыр алдын ала көрініс (LQIP).
// Ескерту: кейбір браузерлер (Safari) WebP-ке сақтай алмайды — онда JPEG мазмұны .webp атымен сақталады;
// браузерлер суреттің түрін мазмұнынан анықтайды, сондықтан сайтта дұрыс көрінеді.

import { bytesToBase64, type FileChange } from "./github"

export type PhotoMeta = { w: number; h: number; lqip: string }
export type Prepared = { files: FileChange[]; preview: string; meta?: PhotoMeta }

async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" })
  } catch {
    // Кейбір браузерлер createImageBitmap-та HEIC/кейбір форматтарды ашпайды — <img> арқылы қайталап көреміз.
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      return await createImageBitmap(img)
    } catch {
      throw new Error(`«${file.name}» ашылмады. JPG немесе PNG сурет таңдаңыз (iPhone-да «Ең үйлесімді» форматта жіберіңіз).`)
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

function draw(src: ImageBitmap | HTMLCanvasElement, w: number, h: number) {
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  const ctx = c.getContext("2d")!
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(src, 0, 0, w, h)
  return c
}

// Сапасы жақсы болуы үшін бірден емес, екі есе қадаммен кішірейтеміз.
function resize(src: ImageBitmap, w: number, h: number) {
  let cur: ImageBitmap | HTMLCanvasElement = src
  let cw = src.width, ch = src.height
  while (cw / 2 > w) {
    cw = Math.round(cw / 2)
    ch = Math.round(ch / 2)
    cur = draw(cur, cw, ch)
  }
  return draw(cur, w, h)
}

function toBlob(c: HTMLCanvasElement, type: string, q: number): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Суретті сақтау мүмкін болмады."))), type, q))
}
async function webp(c: HTMLCanvasElement, q: number) {
  const b = await toBlob(c, "image/webp", q)
  return b.type === "image/webp" ? b : toBlob(c, "image/jpeg", Math.min(0.9, q + 0.06))
}
async function b64(blob: Blob) {
  return bytesToBase64(new Uint8Array(await blob.arrayBuffer()))
}
const fit = (w: number, h: number, max: number) => (Math.max(w, h) <= max ? { w, h } : w >= h ? { w: max, h: Math.round((h * max) / w) } : { w: Math.round((w * max) / h), h: max })
const byWidth = (w: number, h: number, width: number) => (w <= width ? { w, h } : { w: width, h: Math.round((h * width) / w) })

// Каталог/коллекция суреті: public/photos/<key>*.
export async function preparePhoto(file: File, key: string): Promise<Prepared> {
  const bmp = await decode(file)
  const main = fit(bmp.width, bmp.height, 1400)
  const full = resize(bmp, main.w, main.h)
  const files: FileChange[] = []
  const add = async (name: string, blob: Blob) => files.push({ path: `public/photos/${name}`, base64: await b64(blob) })

  const fullBlob = await webp(full, 0.8)
  await add(`${key}.webp`, fullBlob)
  for (const width of [900, 480]) {
    const s = byWidth(main.w, main.h, width)
    await add(`${key}-${width}.webp`, await webp(resize(bmp, s.w, s.h), 0.76))
  }
  const sh = byWidth(main.w, main.h, 900)
  await add(`${key}-share.jpg`, await toBlob(resize(bmp, sh.w, sh.h), "image/jpeg", 0.8))

  const tinyC = resize(bmp, 20, Math.max(1, Math.round((main.h * 20) / main.w)))
  const tiny = await webp(tinyC, 0.4)
  const lqip = `data:${tiny.type};base64,${await b64(tiny)}`
  bmp.close()
  return { files, preview: URL.createObjectURL(fullBlob), meta: { w: main.w, h: main.h, lqip } }
}

// Пікір скриншоты: public/reviews/<key>.webp (ені ≤ 720) және <key>-300.webp.
export async function prepareReview(file: File, key: string): Promise<Prepared> {
  const bmp = await decode(file)
  const m = byWidth(bmp.width, bmp.height, 720)
  const big = await webp(resize(bmp, m.w, m.h), 0.82)
  const s = byWidth(bmp.width, bmp.height, 300)
  const small = await webp(resize(bmp, s.w, s.h), 0.78)
  bmp.close()
  return {
    files: [
      { path: `public/reviews/${key}.webp`, base64: await b64(big) },
      { path: `public/reviews/${key}-300.webp`, base64: await b64(small) },
    ],
    preview: URL.createObjectURL(big),
  }
}
