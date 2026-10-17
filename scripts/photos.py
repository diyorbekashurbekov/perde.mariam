"""Суреттерді жылдам жүктелетін етіп дайындау.

public/photos/pN.webp (1400 px) әр сурет үшін:
  - pN-480.webp және pN-900.webp — телефонға арналған кіші нұсқалар;
  - src/photoMeta.json — өлшемдері және бұлыңғыр алдын ала көрініс (LQIP, base64).

Іске қосу:  python -P scripts/photos.py <жобаның толық жолы>
"""
import base64
import io
import json
import re
import sys
from pathlib import Path

from PIL import Image

root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
photos = root / "public" / "photos"
meta = {}

for path in sorted(photos.glob("p*.webp")):
    m = re.fullmatch(r"(p\d+)\.webp", path.name)
    if not m:
        continue
    key = m.group(1)
    im = Image.open(path).convert("RGB")
    w, h = im.size
    for width in (480, 900):
        if w > width:
            small = im.resize((width, round(h * width / w)), Image.LANCZOS)
            small.save(photos / f"{key}-{width}.webp", "WEBP", quality=76, method=6)
        else:
            im.save(photos / f"{key}-{width}.webp", "WEBP", quality=76, method=6)
    tiny = im.resize((20, max(1, round(h * 20 / w))), Image.LANCZOS)
    buf = io.BytesIO()
    tiny.save(buf, "WEBP", quality=40)
    meta[key] = {"w": w, "h": h, "lqip": "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()}

(root / "src" / "photoMeta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=0), encoding="utf-8")
print(f"{len(meta)} сурет дайындалды")
