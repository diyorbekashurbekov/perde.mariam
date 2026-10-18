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

`src/lib/analytics.ts` — `track(event, params)`. Оқиғалар: `whatsapp_click {source, photo?, collection?}`, `catalog_open {source}`, `catalog_show_all`. Олар `dataLayer` (GTM), `gtag` (GA4), `ym` (Яндекс Метрика, `window.YM_ID` керек), `fbq` (Meta Pixel) және `perde:track` оқиғасына жіберіледі. GA4 және Meta Pixel: GitHub → Settings → Secrets and variables → Actions → **Variables** бөліміне `GA4_ID` (мысалы `G-…`) және/немесе `META_PIXEL_ID` (сандар) қосып, сайтты қайта шығару жеткілікті — `initAnalytics()` (src/lib/analytics.ts) оларды өзі жүктейді. ID жоқ болса, ештеңе жүктелмейді. Ескі `#works` сілтемесі де каталогқа апарады.

GA4-те `whatsapp_click` **Key event** ретінде тіркелген (Admin → Events → «Создать событие» → «Создать с кодом», 2026-10-18). Көмекші/қосымша оқиға жасамау керек — сұраулар екі рет есептеліп кетеді.

Статистика панелі: GA4 → Отчеты → сол жақ мәзірдегі **Perde Mariam → Тапсырыстар → «WhatsApp өтінімдері»** (Библиотекада жасалған подробный отчет, 2026-10-18). Параметрлері: Батырма орны, Коллекция, Тип устройства, Город; көрсеткіштері: Ключевые события (= WhatsApp басулар), Количество событий, Активные пользователи. Looker Studio Claude-тың ішкі браузерінде ашылмайды (Google `invalid_scope` қатесімен бұғаттайды).

**Админ панель** (әдемі нұсқа): https://claude.ai/artifact/TZHCKnGyAjAj3yafgZqLPp — жеке Artifact, сандар беттегі `<script id="data" type="application/json">` блогында тұрады (өздігінен жаңармайды). «Панельді жаңарт» десе: Artifact `read` арқылы бетті алу → GA4-тен (ішкі браузер, ресурс a412390098p559450462) соңғы 28 күннің сандарын жинау: `totals {users, whatsapp, catalog, catalogShowAll, pageviews}`, `prevTotals {users, whatsapp, catalog}` (алдыңғы 28 күн, жоқ болса `null`), `daily [{date, users, whatsapp, catalog}]`, `whatsappBySource [{key, count}]` (Батырма орны × Ключевые события), `catalogBySource [{key, count}]` (catalog_open × Батырма орны), `collections [{name, count}]`, `photos [{key: "p35", count}]` (GA4 «Фото» өлшемі = `photo` параметрі, 2026-10-18 тіркелді), `devices [{key: mobile|desktop|tablet, users}]`, `cities [{name, users}]` (GA4 ағылшынша атауы, бет өзі аударады), `updatedUtc`, `period`. Нақты дерек жоқ кезде бет анық белгіленген «үлгі» сандарды көрсетеді; `totals.users > 0` болғанда үлгі өзі жоғалады → тек data блогын ауыстырып, сол `url`-ге қайта жариялау. Сандарды ойдан қоспау: дерек жоқ болса бос қалдыру (бет өзі «әзірге дерек жоқ» көрсетеді).

## Сілтеме превьюі

Open Graph тегтері index.html-де. Превью суреті: `public/og-image.jpg` (1200×630, `scripts/og.py` жасайды). WhatsApp превьюді кэштейді — өзгерген соң жаңасы бірнеше сағаттан кейін көрінуі мүмкін.
