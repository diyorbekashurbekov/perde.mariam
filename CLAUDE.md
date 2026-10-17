# Perde Mariam — сайт

Астанадағы перде ательесінің сайты (@perde.mariam). React + Vite + Tailwind + Motion, 3D перде — Three.js.

## Іске қосу

- `npm install`, содан кейін `npm run dev -- --port 5174`
- Тексеру: `npm run build`

## Жаңа сурет қосу

Клиент суреттерді Telegram арқылы жібереді; олар әдетте `C:\Users\asus\Downloads\Telegram Desktop` папкасына `photo_N_<күн>.jpg` болып түседі.

1. Суреттерді қарап шығу: скриншот, интерфейсі көрінетін, жазуы бар немесе қайталанатын суреттерді алмау.
2. WebP-ке айналдыру (ені/биіктігі ≤ 1400 px, quality 80) да `public/photos/pN.webp` деп сақтау — нөмірлер жалғасып кетеді (қазір p1–p46 бар, p2, p13, p16 жоқ; келесісі — p47).
3. Кіші нұсқалар мен бұлыңғыр алдын ала көріністі жасау: `python -P scripts/photos.py "C:/Users/asus/Documents/perde-mariam"` (pN-480/900.webp, WhatsApp превьюіне pN-share.jpg және src/photoMeta.json жаңарады).
4. `src/data.ts` ішінде қажетті жерге қосу:
   - `gallery` — «Жұмыстарымыз» галереясы (көбіне осында),
   - `collections` — коллекция карточкалары,
   - `steps` — процесс карточкалары,
   - `heroPhotos` — hero ортасындағы доғадағы слайд-шоу.
5. `npm run build` және браузерде компьютер мен телефон өлшемінде тексеру.

Суреттер сайтта `Photo` компоненті арқылы шығады (src/components/Photo.tsx): телефонға кіші нұсқа, жүктелгенше бұлыңғыр көрініс, экранға 1500 px қалғанда алдын ала жүктеу.

Ескерту: Windows Store Python `AppData\Roaming` ішіндегі жолдарды басқаша көреді — суреттерді өңдегенде жобаның өз папкасындағы толық жолдарды қолдану керек.

## Каталог және WhatsApp

- Тікелей каталог сілтемесі (WhatsApp-та клиентке жіберуге): `https://diyorbekashurbekov.github.io/perde.mariam/#catalog` — кіріспе мен анимациялар өткізіледі, бет бірден каталогтан (галерея, `id="catalog"`) ашылады, барлық сурет көрінеді.
- WhatsApp хабарламалары: `src/lib/whatsapp.ts`.

## Аналитика

`src/lib/analytics.ts` — `track(event, params)`. Оқиғалар: `whatsapp_click {source, photo?, collection?}`, `catalog_open {source}`, `catalog_show_all`. Олар `dataLayer` (GTM), `gtag` (GA4), `ym` (Яндекс Метрика, `window.YM_ID` керек), `fbq` (Meta Pixel) және `perde:track` оқиғасына жіберіледі. Аналитиканы қосу үшін тек index.html-ге сол жүйенің кодын қою жеткілікті.
