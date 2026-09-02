#!/usr/bin/env python3
"""
Agarwal Packers Movers India — content illustrations.

    python _build/make-illustrations.py

Writes flat vector illustrations to images/illustrations/.

WHY SVG AND NOT PHOTOS: these are drawings, so they cannot misrepresent the
business the way stock photography of someone else's crew and trucks would.
They also beat WebP/AVIF on weight (2-4 KB each) and stay sharp on every screen.
Replace them with real photographs of your own crew, vehicles and warehouses as
soon as you have them — see images/README.md for the naming convention.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "images", "illustrations")
os.makedirs(OUT, exist_ok=True)

# shared palette (matches css/style.css tokens)
NAVY, NAVY_L, ORANGE, ORANGE_L = "#0b2a52", "#1d4e88", "#ef6820", "#f9a978"
PAPER, KRAFT, KRAFT_D, SKY, LINE = "#ffffff", "#d9a441", "#b8862c", "#e8f0f8", "#c9d7e6"

HEAD = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" width="640" '
        'height="420" role="img" aria-label="{label}">'
        '<rect width="640" height="420" rx="16" fill="{bg}"/>')
FOOT = "</svg>"


def carton(x, y, w, h, flap=True, band=True):
    """A kraft carton with a taped seam."""
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" fill="{KRAFT}"/>'
    s += f'<rect x="{x}" y="{y}" width="{w}" height="{h*0.22:.0f}" rx="3" fill="{KRAFT_D}"/>'
    if band:
        s += f'<rect x="{x + w/2 - 5:.0f}" y="{y}" width="10" height="{h}" fill="#f0e2c4" opacity=".9"/>'
    if flap:
        s += (f'<path d="M{x} {y + h*0.22:.0f} H{x + w}" stroke="{KRAFT_D}" '
              f'stroke-width="2" fill="none"/>')
    return s


def write(name, label, body, bg=SKY):
    svg = HEAD.format(label=label, bg=bg) + body + FOOT
    path = os.path.join(OUT, name)
    with open(path, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"  images/illustrations/{name}  {len(svg)//1024 or 1} KB")


print("Generated illustrations:")

# ── 1. household packing ────────────────────────────────────────────────────
b = f'<rect x="0" y="300" width="640" height="120" fill="#dbe6f2"/>'
b += f'<rect x="40" y="292" width="560" height="8" rx="4" fill="{LINE}"/>'
# wardrobe carton
b += carton(60, 150, 110, 150)
b += f'<rect x="88" y="186" width="54" height="16" rx="3" fill="{PAPER}"/>'
b += f'<rect x="88" y="212" width="34" height="8" rx="3" fill="#f0e2c4"/>'
# stack
b += carton(190, 215, 96, 85)
b += carton(200, 140, 76, 75)
b += carton(300, 240, 84, 60)
# bubble wrap roll
b += (f'<rect x="404" y="196" width="104" height="104" rx="12" fill="{PAPER}" '
      f'stroke="{LINE}" stroke-width="3"/>')
for r in range(3):
    for c in range(4):
        b += (f'<circle cx="{424 + c*22}" cy="{218 + r*30}" r="7" fill="{SKY}" '
              f'stroke="{LINE}" stroke-width="2"/>')
# armchair wrapped in stretch film, ready to load
b += f'<path d="M520 300 v-70 a26 26 0 0 1 26-26 h34 a26 26 0 0 1 26 26 v70z" fill="#cfe0f0"/>'
b += f'<path d="M520 300 v-70 a26 26 0 0 1 26-26 h34 a26 26 0 0 1 26 26 v70z" fill="none" stroke="{NAVY_L}" stroke-width="3"/>'
b += f'<path d="M520 252 h86 M520 276 h86" stroke="#9dbcda" stroke-width="3"/>'
# inventory label on the top carton
b += f'<rect x="205" y="152" width="44" height="26" rx="4" fill="{PAPER}"/>'
b += f'<path d="M212 162h30M212 170h20" stroke="{NAVY_L}" stroke-width="3" stroke-linecap="round"/>'
write("household-goods-packing.svg",
      "Household goods boxed, labelled and wrapped before loading", b)

# ── 2. truck loading ────────────────────────────────────────────────────────
b = f'<rect x="0" y="318" width="640" height="102" fill="#dbe6f2"/>'
b += f'<path d="M0 318h640" stroke="{LINE}" stroke-width="4"/>'
# cargo body
b += f'<rect x="56" y="120" width="330" height="198" rx="8" fill="{PAPER}" stroke="{LINE}" stroke-width="4"/>'
b += f'<rect x="56" y="120" width="330" height="34" rx="8" fill="{NAVY}"/>'
b += f'<path d="M120 154v164M240 154v164M320 154v164" stroke="{LINE}" stroke-width="3"/>'
# cab
b += f'<path d="M392 178h96a18 18 0 0 1 14.6 7.5l40 56A18 18 0 0 1 546 252v66H392z" fill="{ORANGE}"/>'
b += f'<path d="M410 196h74v46h-74z" fill="{SKY}"/>'
b += f'<rect x="392" y="252" width="162" height="12" fill="{ORANGE_L}"/>'
# wheels
for cx in (140, 300, 500):
    b += f'<circle cx="{cx}" cy="322" r="30" fill="{NAVY}"/><circle cx="{cx}" cy="322" r="12" fill="{PAPER}"/>'
# ramp + carton going up
b += f'<path d="M56 318 L-4 344 h70z" fill="{NAVY_L}" opacity=".3"/>'
b += carton(150, 190, 74, 66)
b += carton(246, 200, 62, 56)
b += f'<rect x="70" y="206" width="60" height="50" rx="3" fill="{KRAFT}"/>'
write("moving-truck-loading.svg",
      "Household cartons being loaded into a closed moving truck", b)

# ── 3. office relocation ────────────────────────────────────────────────────
b = f'<rect x="0" y="330" width="640" height="90" fill="#dbe6f2"/>'
# desk
b += f'<rect x="52" y="238" width="230" height="12" rx="4" fill="{NAVY_L}"/>'
b += f'<rect x="70" y="250" width="12" height="80" fill="{NAVY_L}" opacity=".7"/>'
b += f'<rect x="252" y="250" width="12" height="80" fill="{NAVY_L}" opacity=".7"/>'
# monitor wrapped
b += f'<rect x="96" y="150" width="140" height="88" rx="6" fill="{PAPER}" stroke="{LINE}" stroke-width="4"/>'
b += f'<path d="M96 178h140M96 208h140" stroke="{LINE}" stroke-width="3"/>'
b += f'<rect x="152" y="238" width="28" height="10" fill="{LINE}"/>'
# server rack / crate
b += f'<rect x="332" y="138" width="132" height="192" rx="8" fill="{NAVY}"/>'
for i in range(5):
    b += f'<rect x="346" y="{154 + i*34}" width="104" height="22" rx="3" fill="{NAVY_L}"/>'
    b += f'<circle cx="{436}" cy="{165 + i*34}" r="4" fill="{ORANGE}"/>'
# document crate on dolly
b += f'<rect x="492" y="222" width="108" height="86" rx="5" fill="{ORANGE}" opacity=".9"/>'
b += f'<rect x="506" y="238" width="80" height="14" rx="3" fill="{PAPER}" opacity=".85"/>'
b += f'<path d="M486 310h124" stroke="{NAVY}" stroke-width="8" stroke-linecap="round"/>'
b += f'<circle cx="508" cy="326" r="12" fill="{NAVY}"/><circle cx="590" cy="326" r="12" fill="{NAVY}"/>'
b += f'<path d="M486 310V196" stroke="{NAVY}" stroke-width="8" stroke-linecap="round"/>'
write("office-relocation-equipment.svg",
      "Office monitors, server rack and document crates staged for an office move", b)

# ── 4. car carrier ──────────────────────────────────────────────


def car(x, base, w, body, glass="#dbe6f2"):
    """Side-view car resting on `base` (the deck line it stands on)."""
    b = w * 0.20                      # body depth
    roof = w * 0.18                   # cabin depth
    y0 = base - 14                    # sill
    y1 = y0 - b                        # belt line
    y2 = y1 - roof                     # roof
    s = (f'<path d="M{x} {y0:.0f} V{y1:.0f} L{x + w*0.16:.0f} {y1:.0f} '
         f'L{x + w*0.30:.0f} {y2:.0f} H{x + w*0.66:.0f} L{x + w*0.82:.0f} {y1:.0f} '
         f'H{x + w} V{y0:.0f} Z" fill="{body}"/>')
    s += (f'<path d="M{x + w*0.22:.0f} {y1 - 3:.0f} L{x + w*0.33:.0f} {y2 + 5:.0f} '
          f'H{x + w*0.63:.0f} L{x + w*0.76:.0f} {y1 - 3:.0f} Z" fill="{glass}"/>')
    s += f'<path d="M{x + w*0.49:.0f} {y2 + 5:.0f} V{y1 - 3:.0f}" stroke="{body}" stroke-width="5"/>'
    for cx in (x + w * 0.24, x + w * 0.76):
        s += (f'<circle cx="{cx:.0f}" cy="{base - 16:.0f}" r="19" fill="{NAVY}"/>'
              f'<circle cx="{cx:.0f}" cy="{base - 16:.0f}" r="7" fill="{PAPER}"/>')
    return s


UPPER, LOWER, ROAD = 190, 320, 352
b = f'<rect x="0" y="{ROAD}" width="640" height="68" fill="#dbe6f2"/>'
b += f'<path d="M0 {ROAD}h640" stroke="{LINE}" stroke-width="4"/>'
# trailer frame: two decks and the end posts that carry them
b += f'<rect x="40" y="{UPPER}" width="352" height="9" rx="4" fill="{NAVY}"/>'
b += f'<rect x="40" y="{LOWER}" width="352" height="11" rx="5" fill="{NAVY}"/>'
b += f'<rect x="42" y="{UPPER}" width="10" height="{LOWER - UPPER}" fill="{NAVY}"/>'
b += f'<rect x="378" y="{UPPER}" width="10" height="{LOWER - UPPER}" fill="{NAVY}"/>'
b += f'<rect x="40" y="150" width="352" height="9" rx="4" fill="{NAVY_L}"/>'
b += f'<rect x="42" y="150" width="10" height="44" fill="{NAVY_L}"/>'
b += f'<rect x="378" y="150" width="10" height="44" fill="{NAVY_L}"/>'
# cars on both decks
b += car(76, UPPER, 280, ORANGE)
b += car(76, LOWER, 280, NAVY_L)
# tractor unit
b += f'<path d="M400 {LOWER} v-96 h74 v50 h32 l38 46 v0 z" fill="{ORANGE}"/>'
b += f'<path d="M414 236 h46 v40 h-46 z" fill="{SKY}"/>'
b += f'<rect x="400" y="{LOWER - 14}" width="144" height="14" fill="{ORANGE_L}"/>'
b += f'<rect x="392" y="228" width="10" height="{LOWER - 228}" fill="{NAVY}"/>'
# wheels
for cx in (112, 178, 436, 516):
    b += (f'<circle cx="{cx}" cy="{ROAD - 22}" r="26" fill="{NAVY}"/>'
          f'<circle cx="{cx}" cy="{ROAD - 22}" r="10" fill="{PAPER}"/>')
write("car-carrier-transport.svg",
      "Cars secured on the upper and lower decks of a car carrier trailer", b)

# ── 5. bike packing ─────────────────────────────────────────────────────────
b = f'<rect x="0" y="330" width="640" height="90" fill="#dbe6f2"/>'
# crate
b += f'<rect x="70" y="120" width="500" height="212" rx="10" fill="{PAPER}" stroke="{LINE}" stroke-width="5"/>'
b += f'<path d="M70 120 570 332M570 120 70 332" stroke="{LINE}" stroke-width="4" opacity=".5"/>'
# bike
b += f'<circle cx="196" cy="272" r="52" fill="none" stroke="{NAVY}" stroke-width="10"/>'
b += f'<circle cx="440" cy="272" r="52" fill="none" stroke="{NAVY}" stroke-width="10"/>'
b += f'<path d="M196 272 262 186h84l50 86M262 186l40 86h138" fill="none" stroke="{NAVY_L}" stroke-width="9" stroke-linejoin="round"/>'
b += f'<path d="M246 172h48M400 190l28-22" stroke="{NAVY}" stroke-width="9" stroke-linecap="round"/>'
b += f'<path d="M300 200h96l14 34h-118z" fill="{ORANGE}"/>'
# ratchet straps holding the bike against the crate frame
b += f'<path d="M170 150 L206 318M470 150 L432 318" stroke="{ORANGE}" stroke-width="10" stroke-linecap="round"/>'
b += f'<rect x="168" y="236" width="34" height="30" rx="5" fill="{ORANGE_L}" stroke="{ORANGE}" stroke-width="3"/>'
b += f'<rect x="440" y="236" width="34" height="30" rx="5" fill="{ORANGE_L}" stroke="{ORANGE}" stroke-width="3"/>'
b += f'<rect x="70" y="120" width="500" height="26" rx="10" fill="{KRAFT}"/>'
write("bike-transport-packing.svg",
      "Motorcycle wrapped and braced inside a wooden transport crate", b)

# ── 6. warehouse storage ────────────────────────────────────────────────────
b = f'<rect x="0" y="342" width="640" height="78" fill="#dbe6f2"/>'
for bay in range(3):
    x = 48 + bay * 190
    b += f'<rect x="{x}" y="86" width="10" height="256" fill="{NAVY}"/>'
    b += f'<rect x="{x+150}" y="86" width="10" height="256" fill="{NAVY}"/>'
    for shelf in range(3):
        y = 132 + shelf * 74
        b += f'<rect x="{x}" y="{y}" width="160" height="10" fill="{NAVY_L}"/>'
        b += carton(x + 14, y - 52, 60, 52)
        b += carton(x + 84, y - 44, 58, 44)
    b += f'<rect x="{x}" y="86" width="160" height="10" fill="{NAVY}"/>'
b += f'<rect x="40" y="352" width="560" height="8" rx="4" fill="{LINE}"/>'
write("storage-warehouse-racking.svg",
      "Labelled household cartons stored on racking inside a warehouse bay", b)

print("Done.")
