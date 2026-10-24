"""Бренд суреттері (Shtor Mariam логотипінен):
  - public/brand/logo.webp   — ашылу экранындағы толық логотип (800 px)
  - public/brand/mark.webp   — перделі «М» белгісі (мәзір, админ панель)
  - public/favicon.svg       — браузер белгішесі (ішінде 64 px PNG)
  - public/apple-touch-icon.png — iPhone «басты экранға қосу» белгішесі (180×180)
  - public/og-image.jpg      — WhatsApp/Instagram превьюі (1200×630): сол жақта логотип, оң жақта перде фотосы
Бас нұсқалар: scripts/brand/logo-master.webp, scripts/brand/mark-master.webp.
Іске қосу: python -P scripts/og.py <жобаның толық жолы>"""
import base64
import io
import sys
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
pub = root / "public"
brand = root / "scripts" / "brand"
(pub / "brand").mkdir(exist_ok=True)

logo = Image.open(brand / "logo-master.webp").convert("RGB")
mark = Image.open(brand / "mark-master.webp").convert("RGB")

logo.resize((800, 800), Image.LANCZOS).save(pub / "brand" / "logo.webp", "WEBP", quality=82, method=6)
mark.resize((192, 192), Image.LANCZOS).save(pub / "brand" / "mark.webp", "WEBP", quality=86, method=6)

# Браузер белгішесі: дөңгелек бұрышты шаршы, SVG ішіне PNG ретінде салынады.
fav = mark.resize((64, 64), Image.LANCZOS).convert("RGBA")
m = Image.new("L", (64, 64), 0)
ImageDraw.Draw(m).rounded_rectangle((0, 0, 63, 63), radius=14, fill=255)
fav.putalpha(m)
buf = io.BytesIO()
fav.save(buf, "PNG", optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()
(pub / "favicon.svg").write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><image width="64" height="64" href="data:image/png;base64,{b64}"/></svg>\n',
    encoding="utf-8",
)

mark.resize((180, 180), Image.LANCZOS).save(pub / "apple-touch-icon.png", "PNG", optimize=True)

# Превью: сол жақта логотип (630×630), оң жақта кең, жарық перде фотосы.
photo = Image.open(pub / "photos" / "p15.webp").convert("RGB")
w, h = photo.size
pw = 1200 - 630
scale = 630 / h
ph = photo.resize((round(w * scale), 630), Image.LANCZOS)
left = max(0, (ph.width - pw) // 2)
og = Image.new("RGB", (1200, 630))
og.paste(logo.resize((630, 630), Image.LANCZOS), (0, 0))
og.paste(ph.crop((left, 0, left + pw, 630)), (630, 0))
og.save(pub / "og-image.jpg", "JPEG", quality=86, optimize=True, progressive=True)
print("ok")
