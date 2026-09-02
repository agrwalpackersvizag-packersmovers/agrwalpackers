#!/usr/bin/env python3
"""
Agarwal Packers Movers India — social/icon image generator.

    python _build/make-images.py

Generates:
  images/apple-touch-icon.png          180x180 brand mark
  images/og/*.png                      1200x630 Open Graph cards

These are BRAND graphics (type + logo mark on a solid ground), not photographs.
They are safe to publish because they claim nothing about the business.
Replace them with real site photography when it is available — see images/README.md
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OG_DIR = os.path.join(ROOT, "images", "og")
os.makedirs(OG_DIR, exist_ok=True)

NAVY = (11, 42, 82)
NAVY_LIGHT = (29, 78, 136)
ORANGE = (239, 104, 32)
WHITE = (255, 255, 255)
MIST = (207, 220, 236)

FONT_DIR = r"C:\Windows\Fonts"
def font(name, size):
    for candidate in (name, "arialbd.ttf", "arial.ttf"):
        path = os.path.join(FONT_DIR, candidate)
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()

BOLD = "arialbd.ttf"
REG = "arial.ttf"


def draw_mark(d, x, y, s):
    """Brand mark: truck silhouette, matching the SVG logo."""
    r = int(s * 0.23)
    d.rounded_rectangle([x, y, x + s, y + s], radius=r, fill=NAVY)
    u = s / 48.0
    def px(*pts):
        return [(x + a * u, y + b * u) for a, b in pts]
    d.rectangle(px((7, 17.5), (26, 31.5)), fill=WHITE)
    d.polygon(px((26, 22), (33.6, 22), (38, 28.5), (38, 31.5), (26, 31.5)), fill=ORANGE)
    d.rounded_rectangle(px((27.8, 23.9), (33.2, 27.9)), radius=int(1 * u) or 1, fill=NAVY)
    d.rounded_rectangle(px((6, 31.5), (41, 33.9)), radius=int(1.2 * u) or 1, fill=ORANGE)
    for cx in (15, 32.5):
        rr = 3.6 * u
        c = (x + cx * u, y + 35.6 * u)
        d.ellipse([c[0] - rr, c[1] - rr, c[0] + rr, c[1] + rr], fill=NAVY, outline=WHITE,
                  width=max(1, int(2 * u)))
    d.rectangle(px((11.5, 20.5), (20.5, 27.5)), fill=(219, 230, 242))


def wrap(d, text, fnt, max_w):
    words, lines, line = text.split(), [], ""
    for w in words:
        trial = (line + " " + w).strip()
        if d.textlength(trial, font=fnt) <= max_w:
            line = trial
        else:
            if line:
                lines.append(line)
            line = w
    if line:
        lines.append(line)
    return lines


def og_card(filename, headline, kicker="AGARWAL PACKERS MOVERS INDIA", footer=None):
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)

    # diagonal wash so the card is not a flat block of colour
    for i in range(H):
        t = i / H
        d.line([(0, i), (W, i)],
               fill=(int(NAVY[0] + (NAVY_LIGHT[0] - NAVY[0]) * t),
                     int(NAVY[1] + (NAVY_LIGHT[1] - NAVY[1]) * t),
                     int(NAVY[2] + (NAVY_LIGHT[2] - NAVY[2]) * t)))
    d.polygon([(W, 0), (W, H), (W - 300, H)], fill=(15, 52, 99))
    d.rectangle([0, H - 14, W, H], fill=ORANGE)

    draw_mark(d, 72, 66, 96)

    f_kicker = font(BOLD, 26)
    d.text((190, 92), kicker, font=f_kicker, fill=MIST)
    d.text((190, 126), "agarwalpackersmoversindia.com", font=font(REG, 24), fill=(150, 176, 209))

    size = 66
    while size > 38:
        f_head = font(BOLD, size)
        lines = wrap(d, headline, f_head, W - 150)
        if len(lines) <= 3:
            break
        size -= 4
    f_head = font(BOLD, size)
    lines = wrap(d, headline, f_head, W - 150)
    line_h = int(size * 1.28)
    block_h = len(lines) * line_h + (72 if footer else 24)
    y = max(232, int((H - 40 - block_h) / 2) + 40)
    for ln in lines:
        d.text((72, y), ln, font=f_head, fill=WHITE)
        y += int(size * 1.28)

    d.rectangle([72, y + 18, 148, y + 24], fill=ORANGE)
    if footer:
        d.text((72, y + 48), footer, font=font(REG, 27), fill=MIST)

    out = os.path.join(OG_DIR, filename)
    img.save(out, "PNG", optimize=True)
    print("  " + os.path.relpath(out, ROOT) + "  " + str(os.path.getsize(out) // 1024) + " KB")


# ── apple touch icon ────────────────────────────────────────────────────────
icon = Image.new("RGB", (180, 180), NAVY)
draw_mark(ImageDraw.Draw(icon), 0, 0, 180)
icon.save(os.path.join(ROOT, "images", "apple-touch-icon.png"), "PNG", optimize=True)
print("Generated images:")
print("  images/apple-touch-icon.png")

# ── Open Graph cards ────────────────────────────────────────────────────────
CARDS = [
    ("agarwal-packers-movers-india-relocation-services.png",
     "Professional Packers & Movers for Safe, Reliable Relocation",
     "Household shifting · Office relocation · Vehicle transport"),
    ("packers-and-movers-jodhpur.png",
     "Packers and Movers in Jodhpur",
     "Sardarpura · Ratanada · Pal Road · Shastri Nagar · Basni"),
    ("packers-and-movers-noida.png",
     "Packers and Movers in Noida",
     "Sector 62 · Sector 76 · Sector 137 · Greater Noida West"),
    ("packers-and-movers-visakhapatnam.png",
     "Packers and Movers in Visakhapatnam",
     "MVP Colony · Madhurawada · Gajuwaka · Dwaraka Nagar"),
    ("house-shifting-services.png",
     "House Shifting Services You Can Plan Around",
     "1 BHK to villa moves, packed and unpacked by one crew"),
    ("office-relocation-services.png",
     "Office Relocation With a Weekend Cutover Plan",
     "Workstations · IT equipment · Records · Reinstallation"),
    ("car-transportation-services.png",
     "Car Transportation, Door to Door",
     "Inspection report · Covered carrier · Delivery handover"),
    ("bike-transportation-services.png",
     "Bike Transportation Packed for the Road",
     "Fuel drained · Frame wrapped · Crated where needed"),
    ("moving-cost-guide.png",
     "What Actually Decides Your Moving Cost",
     "Distance, volume, access, packing and vehicle size explained"),
    ("moving-tips-blog.png",
     "Moving Guides From People Who Do This Daily",
     "Checklists, packing methods and city-specific advice"),
]
for name, head, foot in CARDS:
    og_card(name, head, footer=foot)

print("Done.")
