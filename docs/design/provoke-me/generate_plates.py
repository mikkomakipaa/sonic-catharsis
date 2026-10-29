"""Generate Provoke Me stimulus plates (art only, light-only) in the house style.

Usage (from the repo root):
  node docs/design/provoke-me/generate_stimuli_md.mjs --json src/lib/provocations.ts > /tmp/stimuli.json
  python3 docs/design/provoke-me/generate_plates.py /tmp/stimuli.json public/provocations

Each drawing is a function in DRAW keyed by stimulus id; files are written
as fig-<fig>-<id>.svg. Fig. 14, 22 and 31 were hand-drawn and are not in DRAW.
Same look as the hand-drawn fig-14/22/31: ink line art, one rust accent,
A/B/C labels, typewriter-ish lettering. 400x258 canvas, caption lives in HTML.
"""
import json, math, sys
from html import escape

STYLE = (
    ".ink{stroke:#211e1a;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}"
    ".thin{stroke-width:1}.acc{stroke:#a3352a;fill:none;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}"
    ".dash{stroke-dasharray:4 4}.dot{stroke-dasharray:1.5 4}"
    ".t{fill:#211e1a;font-family:'Special Elite','Courier New',monospace;font-size:11px}"
    ".lbl{font-size:14px}.ta{fill:#a3352a}.solid{fill:#211e1a}.accfill{fill:#a3352a}"
    ".wash{fill:rgba(163,53,42,0.18)}.paper{fill:#f1ece0}"
)


class P:
    def __init__(self):
        self.parts = []

    def raw(self, s):
        self.parts.append(s)

    def line(self, x1, y1, x2, y2, c="ink"):
        self.raw(f'<line class="{c}" x1="{x1:g}" y1="{y1:g}" x2="{x2:g}" y2="{y2:g}"/>')

    def poly(self, pts, c="ink", closed=True):
        tag = "polygon" if closed else "polyline"
        self.raw(f'<{tag} class="{c}" points="{" ".join(f"{x:g},{y:g}" for x, y in pts)}"/>')

    def rect(self, x, y, w, h, c="ink", rx=0, extra=""):
        r = f' rx="{rx}"' if rx else ""
        self.raw(f'<rect class="{c}" x="{x:g}" y="{y:g}" width="{w:g}" height="{h:g}"{r}{extra}/>')

    def circle(self, x, y, r, c="ink"):
        self.raw(f'<circle class="{c}" cx="{x:g}" cy="{y:g}" r="{r:g}"/>')

    def path(self, d, c="ink"):
        self.raw(f'<path class="{c}" d="{d}"/>')

    def text(self, x, y, s, c="t", size=None, extra=""):
        sz = f' font-size="{size}"' if size else ""
        self.raw(f'<text class="{c}" x="{x:g}" y="{y:g}"{sz}{extra}>{escape(s)}</text>')

    # --- house-style helpers ---
    def label(self, letter, x, y, tx=None, ty=None, acc=False):
        self.text(x, y, letter, "t lbl ta" if acc else "t lbl")
        if tx is not None:
            self.line(x + 5, y + 3 if ty > y else y - 12, tx, ty, "acc thin" if acc else "ink thin")

    def measure(self, x1, x2, y, s, below=True):
        self.line(x1, y, x2, y, "acc")
        self.line(x1, y - 6, x1, y + 6, "acc")
        self.line(x2, y - 6, x2, y + 6, "acc")
        self.text((x1 + x2) / 2 - len(s) * 3.2, y + 15 if below else y - 6, s, "t ta")

    def head(self, x, y, r=9):
        self.circle(x, y, r)

    def stand(self, x, y, s=1.0, arms="down"):
        """Standing figure, head centre at (x, y)."""
        r = 9 * s
        self.head(x, y, r)
        neck, hip, foot = y + r, y + 50 * s, y + 88 * s
        self.line(x, neck, x, hip)
        self.line(x, hip, x - 10 * s, foot)
        self.line(x, hip, x + 10 * s, foot)
        sh = y + 20 * s
        if arms == "down":
            self.line(x, sh, x - 13 * s, y + 42 * s)
            self.line(x, sh, x + 13 * s, y + 42 * s)
        return sh

    def motion(self, x, y, n=3, gap=10, length=14, left=False):
        for i in range(n):
            dx = -length if left else length
            self.line(x, y + i * gap, x + dx + (i % 2) * (4 if not left else -4), y + i * gap, "ink thin")

    def svg(self, title, desc):
        body = "\n  ".join(self.parts)
        return (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 258" role="img" aria-labelledby="t d">\n'
            f'  <title id="t">{escape(title)}</title>\n  <desc id="d">{escape(desc)}</desc>\n'
            f'  <style>{STYLE}</style>\n  {body}\n</svg>\n'
        )


def arc_pt(cx, cy, r, deg):
    a = math.radians(deg)
    return cx + r * math.sin(a), cy - r * math.cos(a)


def sector(cx, cy, r, d1, d2):
    x1, y1 = arc_pt(cx, cy, r, d1)
    x2, y2 = arc_pt(cx, cy, r, d2)
    large = 1 if (d2 - d1) % 360 > 180 else 0
    return f"M{cx:g},{cy:g} L{x1:.1f},{y1:.1f} A{r} {r} 0 {large} 1 {x2:.1f},{y2:.1f} Z"


def clock(p, cx, cy, r, hh, mm, ticks=12):
    p.circle(cx, cy, r)
    for i in range(ticks):
        x1, y1 = arc_pt(cx, cy, r - 4, i * 360 / ticks)
        x2, y2 = arc_pt(cx, cy, r - 1, i * 360 / ticks)
        p.line(x1, y1, x2, y2, "ink thin")
    hx, hy = arc_pt(cx, cy, r * 0.5, (hh % 12 + mm / 60) * 30)
    mx, my = arc_pt(cx, cy, r * 0.78, mm * 6)
    p.line(cx, cy, hx, hy)
    p.line(cx, cy, mx, my, "ink thin")


def car_top(p, x, y, w=28, h=20):
    p.rect(x, y, w, h, rx=3)
    p.line(x + w - 8, y + 3, x + w - 8, y + h - 3, "ink thin")


# ------------------------------------------------------------------ plates
def late_merge(p):
    p.line(15, 110, 385, 110)
    p.line(15, 190, 290, 190)
    p.line(290, 190, 330, 150)
    p.line(330, 150, 385, 150)
    p.line(15, 150, 330, 150, "ink thin dash")
    for i in range(9):
        car_top(p, 20 + i * 32, 120)
    car_top(p, 340, 120)
    # merger in lane 2 + its run past the queue
    car_top(p, 250, 160)
    p.line(30, 170, 245, 170, "acc dash")
    p.path("M280,170 C305,168 312,150 318,134", "acc")
    p.poly([(318, 134), (312, 141), (321, 142)], "acc")
    p.label("A", 92, 100, 100, 118)
    p.label("B", 286, 100, 290, 118)
    p.label("C", 228, 214, 258, 182, acc=True)
    p.text(30, 245, "14 vehicles, stationary", "t", 9)


def lift_door(p):
    p.rect(220, 60, 120, 155)
    p.rect(220, 60, 32, 155, "ink thin")
    p.rect(308, 60, 32, 155, "ink thin")
    p.rect(266, 42, 28, 14, "ink thin")
    p.text(275, 53, "3", "t", 10)
    p.poly([(236, 140), (246, 140)], "acc", closed=False)
    p.poly([(241, 135), (247, 140), (241, 145)], "acc", closed=False)
    p.poly([(324, 140), (314, 140)], "acc", closed=False)
    p.poly([(319, 135), (313, 140), (319, 145)], "acc", closed=False)
    # occupant, finger on CLOSE
    p.head(282, 108)
    p.line(282, 117, 282, 165)
    p.line(282, 165, 274, 213)
    p.line(282, 165, 290, 213)
    p.line(282, 130, 300, 128)
    p.rect(300, 120, 6, 16, "ink thin")
    # subject running
    p.head(95, 112)
    p.line(97, 121, 88, 162)
    p.line(88, 162, 70, 182)
    p.line(70, 182, 66, 212)
    p.line(88, 162, 108, 186)
    p.line(108, 186, 122, 210)
    p.line(94, 135, 116, 128)
    p.line(94, 135, 74, 146)
    p.motion(48, 120, left=True)
    p.measure(122, 220, 232, "1.5 m")
    p.label("A", 70, 92, 88, 104)
    p.label("B", 262, 92, 278, 101)
    p.label("C", 228, 236, None, None, acc=True)


def usb(p):
    for i, (top, ok) in enumerate([(True, False), (False, False), (True, True)]):
        px = 20 + i * 125
        p.rect(px, 35, 110, 160, "ink thin")
        p.text(px + 8, 52, str(i + 1), "t", 11)
        p.rect(px + 78, 100, 24, 16)
        p.rect(px + 82, 104, 16, 8, "ink thin")
        p.line(px + 6, 108, px + 28, 108)
        p.rect(px + 28, 100, 26, 16)
        p.rect(px + 54, 102, 12, 12, "ink thin")
        p.rect(px + 57, 103 if top else 110, 4, 3, "solid")
        p.path(f"M{px + 30},90 A14 10 0 1 1 {px + 54},90", "acc")
        p.poly([(px + 54, 90), (px + 49, 86), (px + 57, 84)], "acc")
        p.text(px + 47, 172, "✓" if ok else "✕", "t ta", 22)
    p.label("A", 50, 140, 63, 118)
    p.label("B", 108, 140, 110, 118)
    p.label("C", 326, 80, 312, 102, acc=True)


def toast(p):
    p.line(20, 90, 130, 90)
    p.line(20, 96, 130, 96, "ink thin")
    p.line(118, 96, 118, 215)
    p.line(20, 215, 385, 215)
    p.path("M125,80 Q225,55 268,203", "ink thin dot")
    for cx, cy, a in [(125, 82, 0), (182, 78, 55), (222, 104, 115), (250, 150, 160), (268, 208, 180)]:
        p.raw(f'<g transform="translate({cx} {cy}) rotate({a})">'
              '<rect class="ink" x="-15" y="-4" width="30" height="8" rx="2"/>'
              '<line class="acc" x1="-13" y1="-5.5" x2="13" y2="-5.5" stroke-width="3"/></g>')
    for dx, dy in [(-22, -6), (22, -6), (-14, -14), (14, -14)]:
        p.line(268 + dx * 0.6, 212 + dy * 0.6, 268 + dx, 212 + dy, "acc thin")
    p.label("A", 92, 76, 116, 89)
    p.label("B", 200, 60, 190, 72)
    p.label("C", 300, 240, 276, 214, acc=True)


def flatpack(p):
    p.raw('<g transform="rotate(3 200 215)">')
    p.rect(150, 45, 100, 170)
    for y in (88, 130, 172):
        p.line(150, y, 250, y)
    p.line(156, 45, 156, 215, "ink thin")
    p.line(244, 45, 244, 215, "ink thin")
    p.raw("</g>")
    p.line(20, 215, 385, 215)
    p.poly([(40, 212), (75, 200), (75, 188), (40, 198)])
    p.poly([(75, 200), (112, 212), (112, 200), (75, 188)])
    for i in range(3):
        p.line(46, 201 - i * 4 + 2, 70, 193 - i * 4 + 2, "ink thin")
    p.text(80, 232, "31 / 31", "t", 9)
    p.line(304, 209, 318, 209)
    p.line(303, 205, 303, 213)
    for x in (307, 311, 315):
        p.line(x, 206, x + 2, 212, "ink thin")
    p.circle(311, 209, 18, "acc dash")
    p.label("A", 270, 40, 250, 52)
    p.label("B", 40, 175, 55, 192)
    p.label("C", 338, 186, 326, 198, acc=True)


def pen(p):
    p.rect(40, 25, 320, 215, "ink thin")
    for y in (50, 64, 78, 92, 106):
        p.line(60, y, 300 - (y % 3) * 20, y, "ink thin")
    p.line(80, 175, 330, 175)
    p.text(80, 189, "Signature", "t", 9)
    p.path("M90,168 c6,-26 16,-6 18,-2 s6,-22 16,-10 s4,14 12,4 s12,-18 18,-6 s8,10 16,2 s10,-8 14,0", "ink")
    p.path("M184,166 c6,-6 10,2 16,-2 s8,-4 14,0 s8,2 12,0", "ink thin dash")
    p.line(232, 160, 318, 102)
    p.line(238, 164, 324, 106)
    p.line(232, 160, 226, 168)
    p.line(238, 164, 226, 168)
    p.line(318, 102, 324, 106)
    p.line(88, 205, 186, 205, "acc")
    p.line(88, 199, 88, 205, "acc")
    p.line(186, 199, 186, 205, "acc")
    p.text(125, 222, "40%", "t ta")
    p.label("A", 368, 44, 360, 52)
    p.label("B", 300, 140, 290, 126)
    p.label("C", 60, 222, 86, 206, acc=True)


def armrest(p):
    p.text(188, 30, "23", "t", 10)
    for x in (70, 220):
        p.rect(x, 40, 110, 125, rx=12)
        p.line(x + 6, 165, x + 6, 215, "ink thin")
        p.line(x + 104, 165, x + 104, 215, "ink thin")
    p.line(20, 215, 385, 215)
    p.rect(180, 135, 40, 10, rx=3)
    # subject: arms tucked in
    p.head(125, 72)
    p.line(125, 81, 125, 150)
    p.line(125, 96, 112, 128)
    p.line(112, 128, 122, 142)
    p.line(125, 96, 138, 128)
    p.line(138, 128, 128, 142)
    # neighbour: elbow owns the armrest
    p.head(275, 72)
    p.line(275, 81, 275, 150)
    p.line(275, 98, 222, 120)
    p.line(222, 120, 198, 133)
    p.line(275, 98, 290, 135)
    p.measure(180, 220, 182, "0 cm")
    p.label("A", 90, 64, 115, 70)
    p.label("B", 230, 104, 214, 124)
    p.label("C", 228, 204, None, None, acc=True)


def thermostat(p):
    p.circle(200, 62, 32)
    p.circle(200, 62, 24, "ink thin")
    for d in range(-120, 121, 30):
        x1, y1 = arc_pt(200, 62, 27, d)
        x2, y2 = arc_pt(200, 62, 31, d)
        p.line(x1, y1, x2, y2, "ink thin")
    x, y = arc_pt(200, 62, 20, 40)
    p.line(200, 62, x, y)
    p.text(192, 84, "21°", "t", 9)
    p.line(60, 58, 162, 62)
    p.circle(166, 62, 5)
    p.line(340, 72, 238, 66)
    p.circle(234, 66, 5)
    p.line(70, 112, 70, 205)
    p.line(70, 205, 345, 205)
    p.text(34, 135, "23°", "t", 9)
    p.text(34, 194, "19°", "t", 9)
    xs = [70, 125, 180, 235, 290, 345]
    d = "M70,190"
    for i in range(5):
        y = 132 if i % 2 == 0 else 190
        d += f" L{xs[i]},{y} L{xs[i + 1]},{y}"
    p.path(d, "acc")
    for i, day in enumerate("MTWTF"):
        p.text(xs[i] + 24, 220, day, "t", 9)
    p.label("A", 60, 44, 70, 56)
    p.label("B", 244, 30, 228, 40)
    p.label("C", 360, 160, 344, 175, acc=True)


def fridge_note(p):
    p.rect(150, 20, 120, 195)
    p.poly([(150, 20), (92, 36), (92, 200), (150, 215)])
    for y in (80, 140):
        p.line(150, y, 270, y, "ink thin")
    p.raw('<g transform="rotate(-6 117 78)">')
    p.rect(100, 62, 36, 32, "paper")
    p.rect(100, 62, 36, 32, "ink thin")
    for y in (70, 76, 82):
        p.line(104, y, 132, y, "ink thin")
    p.line(104, 88, 128, 88)
    p.line(104, 91, 126, 91, "ink thin")
    p.raw("</g>")
    p.poly([(200, 138), (200, 106), (207, 98), (222, 98), (229, 106), (229, 138)])
    p.line(200, 136, 229, 136, "acc dot")
    p.text(204, 124, "MILK", "t", 6)
    p.line(20, 215, 385, 215)
    p.text(282, 140, "0 ml", "t ta", 10)
    p.label("A", 70, 50, 100, 66)
    p.label("B", 214, 70, 214, 96)
    p.line(278, 136, 232, 134, "acc thin")
    p.label("C", 316, 141, None, None, acc=True)


def sauna(p):
    p.line(20, 215, 385, 215)
    p.line(200, 170, 385, 170)
    p.line(200, 170, 200, 215, "ink thin")
    p.line(260, 120, 385, 120)
    p.line(260, 120, 260, 170, "ink thin")
    p.rect(35, 145, 60, 70)
    for x in range(42, 92, 10):
        p.circle(x, 140, 5)
    for x in (48, 72):
        p.path(f"M{x},128 c-8,-10 8,-16 0,-26 s8,-16 0,-26", "ink thin")
    # pourer
    p.head(150, 112)
    p.line(150, 121, 150, 168)
    p.line(150, 168, 140, 214)
    p.line(150, 168, 160, 214)
    p.line(150, 134, 118, 128)
    p.line(118, 128, 98, 128)
    p.path("M92,124 a6 6 0 0 0 12,0 z", "ink")
    p.text(112, 116, "×4", "t ta", 10)
    # subject, top bench, hunched
    p.head(318, 74)
    p.line(320, 83, 326, 118)
    p.line(326, 118, 300, 118)
    p.line(300, 118, 300, 168)
    p.line(320, 92, 304, 112)
    # thermometer
    p.rect(222, 25, 16, 66, rx=8)
    p.circle(230, 96, 7)
    p.line(230, 90, 230, 18, "acc")
    p.poly([(225, 22), (230, 12), (235, 22)], "acc")
    p.text(244, 30, "110°", "t ta", 10)
    p.label("A", 345, 66, 328, 72)
    p.label("B", 84, 104, 96, 120)
    p.label("C", 196, 56, 220, 52, acc=True)


def progress_bar(p):
    p.rect(60, 40, 200, 130, rx=4)
    p.rect(68, 48, 184, 114, "ink thin")
    p.poly([(40, 170), (280, 170), (295, 185), (25, 185)])
    p.line(20, 215, 385, 215)
    p.text(96, 82, "Installing update…", "t", 9)
    p.rect(85, 95, 150, 16)
    p.rect(87, 97, 145, 12, "solid")
    p.text(146, 134, "99%", "t", 11)
    clock(p, 330, 100, 40, 3, 0)
    p.path(sector(330, 100, 40, 0, 240), "acc wash")
    p.label("A", 66, 126, 86, 112)
    p.label("B", 372, 52, 356, 68)
    p.text(298, 160, "40 min", "t ta")
    p.label("C", 352, 160, None, None, acc=True)


def hold_music(p):
    p.line(20, 215, 385, 215)
    p.line(60, 160, 120, 160)
    p.line(64, 160, 64, 215, "ink thin")
    p.line(116, 160, 116, 215, "ink thin")
    p.line(60, 160, 56, 105)
    p.head(98, 100)
    p.path("M96,109 Q84,132 92,158", "ink")
    p.line(92, 158, 132, 162)
    p.line(132, 162, 136, 212)
    p.line(90, 120, 108, 104)
    p.rect(106, 88, 7, 18, "ink", rx=2, extra=' transform="rotate(20 109 97)"')
    for i, (x, y) in enumerate([(124, 86), (146, 74), (170, 66), (192, 60)]):
        p.text(x, y, "♪" if i % 2 == 0 else "♫", "t", 13)
    for y, t in [(34, "00:01  caller 12"), (112, "00:47  caller 12")]:
        p.rect(220, y, 140, 38, rx=8)
        p.poly([(230, y + 38), (226, y + 50), (242, y + 38)])
        p.text(232, y + 23, t, "t", 10.5)
    p.line(372, 53, 372, 131, "acc")
    p.line(366, 53, 372, 53, "acc")
    p.line(366, 131, 372, 131, "acc")
    p.label("A", 66, 88, 88, 96)
    p.label("B", 106, 66, 110, 84)
    p.label("C", 378, 98, None, None, acc=True)


def parking_fine(p):
    p.line(20, 215, 385, 215)
    p.poly([(40, 200), (40, 168), (82, 162), (112, 130), (196, 130), (226, 162), (262, 168), (262, 200)])
    p.line(112, 130, 120, 162, "ink thin")
    p.line(150, 130, 150, 162, "ink thin")
    p.line(120, 162, 226, 162, "ink thin")
    p.circle(90, 202, 13)
    p.circle(214, 202, 13)
    p.raw('<g transform="rotate(-38 104 150)">')
    p.rect(96, 142, 18, 14, "paper")
    p.rect(96, 142, 18, 14, "ink thin")
    p.line(99, 147, 111, 147, "ink thin")
    p.line(99, 151, 108, 151, "ink thin")
    p.raw("</g>")
    p.line(86, 158, 116, 140, "ink thin")
    # subject running in with coffee
    p.head(330, 120)
    p.line(328, 129, 336, 168)
    p.line(336, 168, 320, 190)
    p.line(320, 190, 318, 214)
    p.line(336, 168, 352, 188)
    p.line(352, 188, 362, 212)
    p.line(331, 142, 306, 150)
    p.rect(298, 146, 9, 12, "ink thin")
    p.line(331, 142, 352, 152)
    p.motion(356, 116, n=3, length=14)
    # disc + watch
    p.rect(242, 22, 46, 46)
    p.text(250, 40, "P", "t", 14)
    p.text(248, 60, "10:00", "t", 9)
    p.circle(330, 45, 20)
    p.text(313, 49, "10:01", "t", 9)
    p.text(292, 84, "+1 min", "t ta", 10)
    p.label("A", 368, 108, 340, 116)
    p.label("B", 76, 118, 98, 140)
    p.label("C", 348, 86, None, None, acc=True)


def headphone_knot(p):
    p.path("M30,55 L135,55 L135,140 Q82,172 30,140 Z")
    p.path("M38,63 L127,63 L127,136 Q82,162 38,136 Z", "ink thin dash")
    p.path("M92,55 C96,30 130,40 140,70 C150,100 120,118 150,124 C180,130 196,96 170,92 "
           "C142,88 156,134 186,128 C214,122 190,82 168,104 C150,124 196,150 204,118", "ink")
    p.path("M204,118 C210,96 230,110 236,92", "ink")
    p.circle(239, 88, 5)
    p.path("M92,55 C84,40 70,40 66,30", "ink")
    p.circle(64, 26, 5)
    p.circle(300, 140, 70, "ink")
    p.line(186, 104, 240, 84, "ink thin dash")
    p.line(190, 132, 236, 186, "ink thin dash")
    p.path("M250,140 C250,90 340,90 330,130 C320,170 260,160 280,120 C300,80 360,120 340,160 "
           "C320,200 250,190 262,150 C274,110 330,110 320,150 C310,190 270,170 290,130 "
           "C300,110 330,124 310,160", "ink")
    p.text(352, 80, "×4", "t ta", 13)
    p.label("A", 12, 100, 30, 100)
    p.label("B", 120, 26, 128, 44)
    p.label("C", 366, 214, 344, 194, acc=True)


def inbox(p):
    p.line(30, 170, 370, 170)
    p.line(40, 170, 40, 215, "ink thin")
    p.line(360, 170, 360, 215, "ink thin")
    p.line(20, 215, 385, 215)
    p.poly([(140, 70), (262, 70), (262, 158), (140, 158)])
    p.poly([(130, 158), (272, 158), (282, 168), (120, 168)])
    p.rect(176, 98, 50, 32)
    p.poly([(176, 98), (201, 118), (226, 98)], "ink", closed=False)
    p.circle(228, 96, 15, "accfill")
    p.text(216, 100, "147", "t", 10, extra=' style="fill:#f1ece0"')
    # subject
    p.head(84, 96)
    p.line(84, 105, 84, 150)
    p.line(84, 120, 126, 160)
    p.line(84, 150, 112, 160)
    p.line(112, 160, 112, 212)
    p.path("M100,78 q4,8 0,12 q-4,-4 0,-12 z", "ink thin")
    for i in range(4):
        p.rect(298 + i, 150 - i * 7, 50, 6, "ink thin")
    p.label("A", 52, 84, 74, 92)
    p.label("B", 148, 56, 160, 70)
    p.label("C", 262, 60, 240, 84, acc=True)


def reply_all(p):
    p.rect(178, 28, 44, 28)
    p.poly([(178, 28), (200, 44), (222, 28)], "ink", closed=False)
    p.text(232, 46, "“thanks!”", "t", 10)
    xs = [40 + i * 29 for i in range(12)]
    for x in xs:
        p.line(200, 56, x + 9, 128, "ink thin")
    for row, y in enumerate((130, 156, 182)):
        for x in xs:
            p.rect(x, y, 18, 12, "ink thin")
            p.poly([(x, y), (x + 9, y + 6), (x + 18, y)], "ink thin", closed=False)
    for x in (69, 156, 243, 330):
        p.path(f"M{x + 9},128 C{x + 9},90 {(x + 200) / 2},70 {200 + (x - 200) * 0.15:.0f},60", "acc")
    p.text(320, 215, "×214", "t", 10)
    p.label("A", 158, 24, 176, 34)
    p.label("B", 20, 232, 40, 196)
    p.label("C", 370, 100, 352, 112, acc=True)


def open_office(p):
    speakers = [(70, 48), (330, 48), (330, 212)]
    for sx, sy in speakers:
        for r in (28, 56, 84):
            p.circle(sx, sy, r, "acc thin dash")
    for sx, sy in speakers:
        p.rect(sx - 22, sy - 13, 44, 26, "paper")
        p.rect(sx - 22, sy - 13, 44, 26)
        p.circle(sx, sy, 5)
    p.rect(176, 108, 48, 30, "paper")
    p.rect(176, 108, 48, 30)
    p.circle(200, 152, 9, "paper")
    p.circle(200, 152, 9)
    p.circle(200, 152, 4)
    p.label("A", 238, 168, 210, 156)
    p.label("B", 20, 92, 52, 58)
    p.label("C", 250, 104, 236, 118, acc=True)


def snooze(p):
    times = [(6, 0), (6, 9), (6, 18), (6, 27), (6, 36)]
    for i, (h, m) in enumerate(times):
        cx = 50 + i * 75
        clock(p, cx, 52, 22, h, m)
        p.path(f"M{cx - 22},34 a8 8 0 0 1 12,-8", "ink")
        p.path(f"M{cx + 10},26 a8 8 0 0 1 12,8", "ink")
        p.text(cx - 16, 92, f"0{h}:{m:02d}", "t", 9)
    p.line(50, 108, 350, 150, "acc")
    p.poly([(350, 150), (340, 143), (339, 153)], "acc")
    p.text(250, 120, "alertness", "t ta", 9)
    p.line(110, 180, 110, 228)
    p.rect(110, 196, 190, 16)
    p.line(300, 196, 300, 228, "ink thin")
    p.path("M128,196 C130,176 170,178 172,192", "ink")
    p.path("M172,192 C200,184 260,186 296,196", "ink")
    p.line(20, 228, 385, 228)
    p.label("A", 82, 176, 124, 186)
    p.label("B", 12, 96, 30, 70)
    p.label("C", 356, 166, None, None, acc=True)


def lift_out_of_order(p):
    p.line(15, 215, 385, 215)
    p.rect(25, 70, 80, 145)
    p.line(65, 70, 65, 215, "ink thin")
    p.raw('<g transform="rotate(-4 65 122)">')
    p.rect(32, 104, 66, 36, "paper")
    p.rect(32, 104, 66, 36, "ink thin")
    p.text(52, 119, "POIS", "t", 9)
    p.text(38, 133, "KÄYTÖSTÄ", "t", 9)
    p.raw("</g>")
    d = "M155,215"
    x, y = 155, 215
    for _ in range(14):
        y -= 12
        d += f" L{x},{y}"
        x += 12
        d += f" L{x},{y}"
    p.path(d)
    p.path(f"M165,198 L{x - 2},{y - 18}", "acc dot")
    p.text(x + 4, y + 2, "7", "t", 22)
    p.head(130, 136)
    p.line(130, 145, 130, 182)
    p.line(130, 182, 122, 214)
    p.line(130, 182, 138, 214)
    p.line(130, 155, 114, 178)
    p.line(130, 155, 146, 178)
    for bx, by in [(106, 178), (140, 178)]:
        p.rect(bx, by, 14, 18, "ink thin")
    p.rect(110, 200, 14, 15, "ink thin")
    p.label("A", 150, 120, 138, 132)
    p.label("B", 40, 100, 50, 108)
    p.label("C", 318, 30, None, None, acc=True)


def mosquito(p):
    p.line(15, 215, 385, 215)
    p.line(40, 140, 40, 215)
    p.rect(40, 190, 220, 18)
    p.line(256, 190, 256, 215, "ink thin")
    p.ellipse = None
    p.raw('<ellipse class="ink thin" cx="72" cy="184" rx="22" ry="7"/>')
    p.head(76, 174, 10)
    p.circle(73, 172, 1.2, "solid")
    p.circle(80, 172, 1.2, "solid")
    p.path("M88,186 C120,174 200,176 250,186", "ink")
    p.path("M110,150 C60,120 70,90 110,110 C150,130 170,80 130,74 C90,68 120,140 170,120 "
           "C220,100 210,60 250,70 C300,82 320,40 372,34", "ink thin dot")
    p.line(168, 121, 176, 119)
    p.path("M171,120 q-6,-8 -2,-10 M173,120 q2,-10 6,-8", "ink thin")
    p.rect(300, 150, 70, 28, rx=3)
    p.text(310, 169, "03:12", "t", 12)
    p.text(366, 52, "?", "t ta", 16)
    p.label("A", 104, 160, 88, 170)
    p.label("B", 186, 142, 176, 126)
    p.label("C", 350, 30, None, None, acc=True)


def delivery_window(p):
    cx, cy, r = 130, 122, 72
    p.circle(cx, cy, r)
    for h in range(24):
        x1, y1 = arc_pt(cx, cy, r - (7 if h % 6 == 0 else 4), h * 15)
        x2, y2 = arc_pt(cx, cy, r - 1, h * 15)
        p.line(x1, y1, x2, y2, "ink thin")
    for h, (dx, dy) in {0: (-5, 4), 6: (-10, 4), 12: (-6, 4), 18: (-6, 4)}.items():
        x, y = arc_pt(cx, cy, r - 16, h * 15)
        p.text(x + dx, y + dy, str(h), "t", 9)
    p.path(sector(cx, cy, r, 8 * 15, 21 * 15), "acc wash")
    for h in (8, 21):
        x, y = arc_pt(cx, cy, r + 12, h * 15)
        p.text(x - 7, y + 4, f"{h:02d}", "t ta", 10)
    p.rect(250, 30, 120, 120)
    p.line(310, 30, 310, 150, "ink thin")
    p.line(250, 90, 370, 90, "ink thin")
    p.line(244, 150, 376, 150)
    p.head(312, 132)
    p.circle(309, 130, 1.2, "solid")
    p.circle(315, 130, 1.2, "solid")
    p.line(296, 150, 300, 142)
    p.line(328, 150, 324, 142)
    p.circle(300, 196, 9)
    p.circle(300, 196, 3)
    p.text(316, 204, "?", "t ta", 20)
    p.label("A", 340, 118, 322, 128)
    p.label("B", 26, 50, 70, 80)
    p.label("C", 336, 200, None, None, acc=True)


def small_person(p, x, y, s=0.62):
    p.stand(x, y, s)


def queue_choice(p):
    for row, (gy, people) in enumerate([(122, 4), (226, 2)]):
        p.line(15, gy, 300, gy)
        p.rect(24, gy - 26, 44, 26)
        p.rect(30, gy - 38, 16, 12, "ink thin")
        p.text(6, gy - 8, str(row + 1), "t", 10)
        for i in range(people):
            small_person(p, 100 + i * 46, gy - 55)
    for x in (138, 184):
        p.line(x + 20, 162, x - 4, 162, "acc")
        p.poly([(x + 2, 157), (x - 6, 162), (x + 2, 167)], "acc", closed=False)
    p.line(320, 186, 385, 186, "ink thin")
    p.rect(330, 182, 16, 4, "accfill")
    p.rect(358, 96, 16, 90, "accfill")
    p.text(334, 200, "1", "t", 9)
    p.text(362, 200, "2", "t", 9)
    p.label("A", 254, 44, 240, 60)
    p.label("B", 212, 156, 192, 170)
    p.label("C", 326, 110, None, None, acc=True)


def seen(p):
    p.rect(70, 22, 120, 214, rx=16)
    p.rect(80, 44, 100, 172, "ink thin")
    p.line(118, 32, 142, 32, "ink thin")
    p.rect(108, 92, 66, 34, rx=9)
    p.poly([(164, 126), (172, 134), (172, 120)], "ink thin", closed=False)
    for y in (104, 114):
        p.line(116, y, 164, y, "ink thin")
    p.text(98, 142, "Seen 14:02", "t", 6.5)
    clock(p, 300, 92, 46, 18, 40)
    p.path("M178,140 C220,150 240,130 254,108", "acc dash")
    p.text(198, 186, "4 h 38 min", "t ta", 10)
    p.label("A", 92, 82, 108, 96)
    p.label("B", 92, 170, 108, 145)
    p.label("C", 230, 206, None, None, acc=True)


def push_door(p):
    p.line(15, 215, 385, 215)
    p.rect(150, 25, 140, 190)
    p.rect(165, 40, 110, 160, "ink thin")
    p.rect(182, 60, 76, 24)
    p.text(198, 77, "PUSH", "t", 13)
    p.path("M258,112 Q282,112 282,136 Q282,160 258,160", "ink")
    p.line(258, 112, 252, 112)
    p.line(258, 160, 252, 160)
    p.circle(270, 136, 32, "acc dash")
    p.head(100, 98)
    p.line(100, 107, 104, 150)
    p.line(104, 150, 92, 214)
    p.line(104, 150, 116, 214)
    p.line(101, 118, 148, 118)
    p.line(148, 110, 148, 126, "ink thin")
    for i in range(3):
        p.path(f"M{80 - i * 8},{100 + i * 14} q-6,8 0,16", "ink thin")
    p.label("A", 70, 80, 92, 92)
    p.label("B", 210, 112, 220, 86)
    p.label("C", 316, 104, 298, 116, acc=True)


def captcha(p):
    for i in range(4):
        p.line(60 + i * 60, 25, 60 + i * 60, 205, "ink thin")
        p.line(60, 25 + i * 60, 240, 25 + i * 60, "ink thin")
    p.rect(100, 55, 40, 72, rx=6)
    for y in (70, 91, 112):
        p.circle(120, y, 7)
    p.line(120, 127, 120, 198)
    p.line(104, 198, 186, 198)
    p.rect(180, 145, 60, 60, "acc", extra=' stroke-width="2.4"')
    p.raw('<g transform="rotate(-12 316 110)">')
    p.rect(262, 92, 108, 32, "acc")
    p.text(272, 114, "TRY AGAIN", "t ta", 13)
    p.raw("</g>")
    p.text(282, 160, "attempt 3", "t", 10)
    p.label("A", 36, 30, 58, 36)
    p.label("B", 150, 52, 140, 66)
    p.label("C", 262, 84, None, None, acc=True)


def crossing_button(p):
    p.line(15, 215, 385, 215)
    p.line(150, 80, 150, 215)
    p.rect(130, 28, 40, 52, rx=3)
    p.head(150, 42, 4)
    p.line(150, 46, 150, 60, "acc")
    p.line(150, 60, 145, 70, "acc")
    p.line(150, 60, 155, 70, "acc")
    p.line(150, 50, 144, 56, "acc")
    p.line(150, 50, 156, 56, "acc")
    p.rect(136, 120, 28, 40, rx=3)
    p.circle(150, 140, 7)
    p.head(80, 108)
    p.line(80, 117, 80, 160)
    p.line(80, 160, 72, 212)
    p.line(80, 160, 88, 212)
    p.line(80, 128, 140, 140)
    tx = 190
    for g in range(2):
        for i in range(5):
            p.line(tx + i * 5, 100, tx + i * 5, 118, "ink thin")
        p.line(tx - 3, 116, tx + 23, 102, "ink thin")
        tx += 34
    p.line(tx, 100, tx, 118, "ink thin")
    p.path("M164,150 C220,150 260,190 330,186", "acc dash")
    p.text(334, 190, "?", "t ta", 16)
    p.label("A", 48, 96, 70, 104)
    p.label("B", 118, 182, 138, 160)
    p.label("C", 184, 40, 172, 48, acc=True)


def printer(p):
    p.line(15, 215, 385, 215)
    p.rect(110, 90, 180, 80)
    p.poly([(110, 90), (128, 40), (272, 40), (290, 90)], "ink thin")
    p.rect(206, 98, 76, 20)
    p.text(212, 112, "PAPER JAM", "t", 9)
    p.poly([(120, 170), (280, 170), (300, 196), (100, 196)])
    p.line(290, 108, 322, 96)
    p.line(322, 96, 322, 150)
    p.line(322, 150, 290, 160)
    p.circle(200, 66, 14, "acc dash")
    p.text(195, 72, "?", "t ta", 15)
    p.head(66, 150)
    p.line(70, 158, 46, 186)
    p.line(46, 186, 62, 214)
    p.line(62, 214, 30, 214)
    p.line(64, 166, 104, 186)
    p.label("A", 296, 84, 282, 100)
    p.label("B", 196, 236, 200, 198)
    p.label("C", 228, 40, 212, 56, acc=True)


DRAW = {
    "late-merge": late_merge, "lift-door": lift_door, "usb": usb, "toast": toast,
    "flatpack": flatpack, "pen": pen, "armrest": armrest, "thermostat": thermostat,
    "fridge-note": fridge_note, "sauna": sauna, "progress-bar": progress_bar,
    "hold-music": hold_music, "parking-fine": parking_fine, "headphone-knot": headphone_knot,
    "inbox": inbox, "reply-all": reply_all, "open-office": open_office, "snooze": snooze,
    "lift-out-of-order": lift_out_of_order, "mosquito": mosquito,
    "delivery-window": delivery_window, "queue-choice": queue_choice, "seen": seen,
    "push-door": push_door, "captcha": captcha, "crossing-button": crossing_button,
    "printer": printer,
}

if __name__ == "__main__":
    stimuli = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    for s in stimuli:
        if s["id"] not in DRAW:
            continue
        p = P()
        DRAW[s["id"]](p)
        title = f"Fig. {s['fig']} — {s['stimulus'].rstrip('.')}"
        name = f"fig-{s['fig']}-{s['id']}.svg"
        open(f"{out}/{name}", "w", encoding="utf-8").write(p.svg(title, s["legend"]))
        print(name)
