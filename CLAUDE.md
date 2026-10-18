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
4. `src/content.json` ішінде қажетті жерге қосу (немесе жай ғана админ панель → Фотолар → «Фото қосу»):
   - `gallery` — каталог (`"pN"` кілттері),
   - `collections` — коллекция карточкалары (`img: "pN"`),
   - `steps` — процесс карточкалары,
   - `heroPhotos` — hero ортасындағы слайд-шоу.
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

**Админ панель** (әдемі нұсқа): https://claude.ai/artifact/TZHCKnGyAjAj3yafgZqLPp — жеке Artifact, сандар беттегі `<script id="data" type="application/json">` блогында тұрады (өздігінен жаңармайды). «Панельді жаңарт» десе: Artifact `read` арқылы бетті алу → GA4-тен (ішкі браузер, ресурс a412390098p559450462) 17 қазаннан бергі нақты сандарын жинау: `totals {users, whatsapp, catalog, catalogShowAll, pageviews}`, `prevTotals {users, whatsapp, catalog}` (тең ұзындықтағы алдыңғы кезең, жоқ болса `null`), `daily [{date, users, whatsapp, catalog}]`, `whatsappBySource [{key, count}]` (Батырма орны × Ключевые события), `catalogBySource [{key, count}]` (catalog_open × Батырма орны), `collections [{name, count}]`, `photos [{key: "p35", count}]` (GA4 «Фото» өлшемі = `photo` параметрі, 2026-10-18 тіркелді), `devices [{key: mobile|desktop|tablet, users}]`, `cities [{name, users}]` (GA4 ағылшынша атауы, бет өзі аударады), `updatedUtc`, `period`. Үлгі/мысал сандар КӨРСЕТІЛМЕЙДІ (пайдаланушы талабы): дерек жоқ болса «әлі дерек жоқ»; кезең — GA4 санай бастаған 17 қазаннан бері → тек data блогын ауыстырып, сол `url`-ге қайта жариялау. Сандарды ойдан қоспау: дерек жоқ болса бос қалдыру (бет өзі «әзірге дерек жоқ» көрсетеді).

## Админ панель (сайт ішінде)

- Мекенжайы: `https://diyorbekashurbekov.github.io/perde.mariam/admin/` (жергілікті: `http://localhost:5174/admin/`). Коды: `admin/index.html` + `src/admin/` (`ga.ts` — Google кіру және GA4 Data API, `App.tsx` — беттер, `charts.tsx`, `labels.ts`, `admin.css`). Vite екі бет жинайды (`vite.config.ts` → `rollupOptions.input`).
- Кіру: Google Identity Services (тек оқу рұқсаты `analytics.readonly`). Google Cloud жобасы **perde-mariam-admin** (Google Auth Platform: External, Testing режимі). Кіре алатындар — **Audience → Test users** тізіміндегілер (қазір samandarashurbekov@gmail.com және клиент bolatbekperizat10@gmail.com; GA4-те клиентке «Читатель» рөлі берілген, 2026-10-18); жаңа адам қосу үшін сол тізімге және GA4 ресурсына қосу керек.
- Client ID құпия емес: GitHub Variables → `GOOGLE_CLIENT_ID` (build-та `VITE_GOOGLE_CLIENT_ID`), жергілікті — `.env.local`. Рұқсат етілген origins: `https://diyorbekashurbekov.github.io`, `http://localhost:5174`.
- Деректер тек GA4-тен: күндік есептер әр ашылғанда және 5 минут сайын, «Қазір сайтта» (runRealtimeReport, соңғы 30 мин: құрылғы, қала, WhatsApp, минуттық график) — 30 секунд сайын; үлгі/ойдан сан көрсетілмейді. Қала IP бойынша шамамен (мобильді интернетте Түркістан → Шымкент т.б.), панельде солай жазылған. Кезеңдер: Бүгін / 7 күн / 30 күн / Барлығы (17 қазаннан).
- **Сайтты басқару** (Фотолар, Коллекциялар, Пікірлер, Ақпарат пен мәтін): барлық өзгертілетін мазмұн `src/content.json`-да (data.ts одан оқиды). Панель өзгерістерді жинап, «Сайтқа шығару» батырмасымен GitHub-қа бір commit жасайды (Git Data API, `src/admin/github.ts`), сосын Actions сайтты 1–2 минутта шығарады — панель күйін көрсетеді. Суретті браузер өзі дайындайды (`src/admin/images.ts`: pN.webp ≤1400, -900, -480, -share.jpg, photoMeta.json LQIP; Safari-де WebP орнына JPEG мазмұны .webp атымен). Пікір скриншоттары — `public/reviews/rN.webp` + `-300.webp`.
- Жазу рұқсаты — GitHub fine-grained token (тек perde.mariam: Contents RW, Actions R), әр құрылғыда бір рет панельге қойылады (localStorage `pm-gh-token`, сайт мекенжайы бойынша бөлек). Токенді Claude жасамайды/енгізбейді.
- Каталогтан алынған фото файлы өшірілмейді (тек тізімнен шығады). Телефон `8…` деп енгізілсе де `7…`-ге келтіріледі. index.html-дегі JSON-LD/OG телефоны мен мекенжайы статикалық — панельден өзгермейді.

## Сілтеме превьюі

Open Graph тегтері index.html-де. Превью суреті: `public/og-image.jpg` (1200×630, `scripts/og.py` жасайды). WhatsApp превьюді кэштейді — өзгерген соң жаңасы бірнеше сағаттан кейін көрінуі мүмкін.
