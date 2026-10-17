"""WhatsApp/Instagram превьюіне арналған сурет (1200×630) және iPhone белгішесі (180×180).
Іске қосу: python -P scripts/og.py <жобаның толық жолы>"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
pub = root / "public"

src = Image.open(pub / "photos" / "p15.webp").convert("RGB")  # кең, жарық перде фотосы
w, h = src.size
th = round(w * 630 / 1200)
top = max(0, (h - th) // 2 - round(h * 0.04))
og = src.crop((0, top, w, top + th)).resize((1200, 630), Image.LANCZOS)
og.save(pub / "og-image.jpg", "JPEG", quality=86, optimize=True, progressive=True)

icon = Image.new("RGB", (180, 180), (46, 94, 78))
d = ImageDraw.Draw(icon)
try:
    font = ImageFont.truetype("C:/Windows/Fonts/georgia.ttf", 120)
except OSError:
    font = ImageFont.load_default()
d.text((90, 92), "P", font=font, fill=(247, 241, 232), anchor="mm")
icon.save(pub / "apple-touch-icon.png", "PNG", optimize=True)
print("ok", og.size)
