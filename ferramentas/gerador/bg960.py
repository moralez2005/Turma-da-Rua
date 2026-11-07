"""Cenarios em alta resolucao (960x540 e mapa 1920x1080) com numpy + Pillow."""
import math, random
import numpy as np
from PIL import Image

rnd = random.Random(42)
nrng = np.random.default_rng(42)
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0


class Pic:
    def __init__(self, w, h, color=(0, 0, 0)):
        self.w, self.h = w, h
        self.a = np.zeros((h, w, 3), dtype=np.float32)
        self.a[:] = color

    def rect(self, x0, y0, x1, y1, c):
        x0, y0 = max(0, int(x0)), max(0, int(y0))
        x1, y1 = min(self.w - 1, int(x1)), min(self.h - 1, int(y1))
        if x1 >= x0 and y1 >= y0:
            self.a[y0:y1 + 1, x0:x1 + 1] = c

    def px(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.a[int(y), int(x)] = c

    def shade(self, x0, y0, x1, y1, f):
        x0, y0 = max(0, int(x0)), max(0, int(y0))
        x1, y1 = min(self.w - 1, int(x1)), min(self.h - 1, int(y1))
        if x1 >= x0 and y1 >= y0:
            self.a[y0:y1 + 1, x0:x1 + 1] *= f

    def tint(self, x0, y0, x1, y1, c, t):
        x0, y0 = max(0, int(x0)), max(0, int(y0))
        x1, y1 = min(self.w - 1, int(x1)), min(self.h - 1, int(y1))
        if x1 >= x0 and y1 >= y0:
            reg = self.a[y0:y1 + 1, x0:x1 + 1]
            reg[:] = reg * (1 - t) + np.array(c, dtype=np.float32) * t

    def noise(self, x0, y0, x1, y1, amt=0.04):
        x0, y0 = max(0, int(x0)), max(0, int(y0))
        x1, y1 = min(self.w - 1, int(x1)), min(self.h - 1, int(y1))
        if x1 >= x0 and y1 >= y0:
            n = nrng.uniform(1 - amt, 1 + amt, (y1 - y0 + 1, x1 - x0 + 1, 1)).astype(np.float32)
            self.a[y0:y1 + 1, x0:x1 + 1] *= n

    def ellipse(self, cx, cy, rx, ry, c, dither=None):
        y0, y1 = int(cy - ry), int(cy + ry)
        for y in range(max(0, y0), min(self.h, y1 + 1)):
            dy = (y - cy) / ry
            if abs(dy) > 1:
                continue
            half = rx * math.sqrt(1 - dy * dy)
            for x in range(max(0, int(cx - half)), min(self.w, int(cx + half) + 1)):
                if dither is None or BAYER[y % 4, x % 4] < dither:
                    self.a[y, x] = c

    def image(self):
        return Image.fromarray(np.clip(self.a, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


def mix(a, b, t):
    return tuple(a[i] * (1 - t) + b[i] * t for i in range(3))


def dark(c, f=0.8):
    return tuple(v * f for v in c)


# ---------------- elementos ----------------
def sky(p, y0, y1, stops):
    """stops: lista de (fração, cor). Degradê com dithering ordenado."""
    H = y1 - y0
    ys = np.arange(H)[:, None]
    xs = np.arange(p.w)[None, :]
    fr = ys / max(1, H - 1)
    out = np.zeros((H, p.w, 3), dtype=np.float32)
    for i in range(len(stops) - 1):
        f0, c0 = stops[i]
        f1, c1 = stops[i + 1]
        m = ((fr >= f0) & (fr <= f1))[:, :, None]
        t = ((fr - f0) / max(1e-6, f1 - f0))
        lv = t * 8
        q = np.floor(lv) + (lv - np.floor(lv) > BAYER[(ys + y0) % 4, xs % 4])
        q = np.clip(q / 8, 0, 1)[:, :, None]
        col = np.array(c0, dtype=np.float32) * (1 - q) + np.array(c1, dtype=np.float32) * q
        out = np.where(m, col, out)
    p.a[y0:y1] = out


def cloud(p, cx, cy, w, base=(255, 255, 255), shade_c=(214, 226, 240)):
    for k in range(5):
        rx = w * (0.22 + 0.1 * rnd.random())
        ox = cx - w / 2 + k * w / 4
        oy = cy - (8 if k in (1, 2, 3) else 0) - rnd.randint(0, 6)
        p.ellipse(ox, oy, rx, rx * 0.55, base)
    p.ellipse(cx, cy + 6, w * 0.55, 8, shade_c)


def tree_back(p, x0, x1, ybase, col=(96, 140, 92)):
    x = x0
    while x < x1:
        r = rnd.randint(16, 30)
        p.ellipse(x, ybase - r * 0.6, r, r * 0.8, col)
        p.ellipse(x - r * 0.3, ybase - r * 0.9, r * 0.5, r * 0.4, mix(col, (255, 255, 255), 0.12), dither=0.5)
        x += r * 1.2


def roof(p, x0, x1, y0, h=18, c=(176, 84, 52)):
    p.rect(x0 - 4, y0, x1 + 4, y0 + h, c)
    for y in range(y0, y0 + h, 6):
        p.rect(x0 - 4, y + 4, x1 + 4, y + 5, dark(c, 0.78))
        off = 0 if (y // 6) % 2 else 6
        for x in range(x0 - 4 + off, x1 + 4, 12):
            p.rect(x, y, x + 1, y + 3, mix(c, (255, 220, 190), 0.18))
            p.rect(x + 10, y, x + 11, y + 4, dark(c, 0.85))
    p.rect(x0 - 4, y0 + h, x1 + 4, y0 + h + 2, dark(c, 0.5))
    p.noise(x0 - 4, y0, x1 + 4, y0 + h, 0.05)


def wall(p, x0, y0, x1, y1, c):
    p.rect(x0, y0, x1, y1, c)
    p.noise(x0, y0, x1, y1, 0.025)
    p.rect(x0, y1 - 10, x1, y1, dark(c, 0.86))            # rodapé
    p.rect(x0, y1 - 11, x1, y1 - 11, dark(c, 0.7))
    p.shade(x0, y0, x1, y0 + 5, 0.78)                     # sombra do beiral
    for _ in range((x1 - x0) // 20):                       # manchas de umidade
        sx, sy = rnd.randint(x0, x1 - 10), rnd.randint(y1 - 30, y1 - 12)
        p.tint(sx, sy, sx + rnd.randint(4, 14), y1 - 12, (120, 110, 90), 0.12)


def window(p, x, y, w=44, h=36, frame=(240, 240, 236), glass=(84, 110, 140), grade=(70, 70, 76)):
    p.rect(x - 3, y - 3, x + w + 3, y + h + 3, frame)
    p.rect(x, y, x + w, y + h, glass)
    p.tint(x, y, x + w // 2, y + h // 3, (200, 225, 245), 0.35)
    for gx in range(x + 4, x + w, 7):
        p.rect(gx, y, gx + 1, y + h, grade)
    p.rect(x, y + h // 2, x + w, y + h // 2 + 1, grade)
    p.rect(x - 5, y + h + 4, x + w + 5, y + h + 7, (214, 210, 202))
    p.rect(x - 5, y + h + 8, x + w + 5, y + h + 9, (150, 146, 140))


def door(p, x, y, w=36, h=70, c=(128, 78, 48)):
    p.rect(x - 3, y - 3, x + w + 3, y + h, (226, 222, 214))
    p.rect(x, y, x + w, y + h, c)
    p.noise(x, y, x + w, y + h, 0.05)
    for py in (y + 6, y + h // 2 + 3):
        p.rect(x + 5, py, x + w - 5, py + h // 2 - 12, dark(c, 0.86))
        p.rect(x + 5, py, x + w - 5, py, mix(c, (255, 230, 200), 0.2))
    p.rect(x + w - 8, y + h // 2, x + w - 5, y + h // 2 + 2, (230, 200, 90))


def gate(p, x, y, w, h, c=(186, 192, 202), step=5):
    p.rect(x, y, x + w, y + h, c)
    for gx in range(x + 2, x + w, step):
        p.rect(gx, y, gx + 1, y + h, dark(c, 0.72))
        p.rect(gx + 2, y, gx + 2, y + h, mix(c, (255, 255, 255), 0.35))
    p.rect(x, y, x + w, y + 3, dark(c, 0.6))
    p.rect(x, y + h // 2, x + w, y + h // 2 + 2, dark(c, 0.75))


def baiano(p, x0, y0, x1, y1, brick=(194, 100, 54), mortar=(158, 148, 136), tint=None):
    bw, bh = 18, 9
    ys = np.arange(y0, y1 + 1)
    for y in ys:
        row = (y - y0) // bh
        ly = (y - y0) % bh
        off = bw // 2 if row % 2 else 0
        for x in range(x0, x1 + 1):
            lx = (x - x0 + off) % bw
            if ly == bh - 1 or lx == bw - 1:
                col = mortar
            else:
                seed = ((x - x0 + off) // bw * 31 + row * 17) % 9
                col = mix(brick, (120, 50, 30), 0.04 * seed)
                if ly in (3, 5):
                    col = dark(col, 0.85)             # frisos do tijolo baiano
                if ly == 0:
                    col = mix(col, (255, 210, 160), 0.2)
                if lx == 0:
                    col = mix(col, (255, 210, 160), 0.1)
            if tint:
                col = mix(col, tint[0], tint[1])
            p.a[y, x] = col
    p.noise(x0, y0, x1, y1, 0.04)


def poste(p, x, ytop, ybase, lamp=True):
    p.rect(x - 4, ytop, x + 4, ybase, (208, 204, 198))
    p.rect(x + 2, ytop, x + 4, ybase, (166, 162, 156))
    p.rect(x - 4, ytop, x - 3, ybase, (230, 228, 224))
    for yy in range(ytop + 20, ybase, 26):
        p.rect(x - 4, yy, x + 4, yy, (180, 176, 170))
    p.rect(x - 16, ytop + 10, x + 16, ytop + 13, (120, 116, 110))   # cruzeta
    if lamp:
        p.rect(x + 4, ytop + 24, x + 30, ytop + 26, (110, 110, 110))
        p.rect(x + 24, ytop + 26, x + 34, ytop + 30, (90, 90, 96))
        p.rect(x + 26, ytop + 30, x + 32, ytop + 31, (255, 244, 200))
    p.rect(x - 7, ybase - 3, x + 7, ybase, (110, 106, 100))


def wires(p, x0, x1, yA, sag, col=(38, 38, 42)):
    for k, base in enumerate((0, 8, 15)):
        for x in range(x0, x1):
            t = ((x - x0) % 480) / 480
            y = yA + base + sag * 4 * t * (1 - t)
            p.px(x, y, col)


def sidewalk(p, x0, y0, x1, y1, c=(204, 200, 192)):
    p.rect(x0, y0, x1, y1, c)
    p.noise(x0, y0, x1, y1, 0.035)
    for x in range(x0 + rnd.randint(0, 40), x1, 48):
        p.rect(x, y0, x, y1, dark(c, 0.8))
        if rnd.random() < 0.6:
            for k in range(3):
                p.px(x + k - 1, y1 - 2 - k, (96, 150, 72))
                p.px(x + k, y1 - 3 - k * 2, (120, 170, 86))
    for _ in range((x1 - x0) // 60):              # rachaduras
        cx, cy = rnd.randint(x0, x1), rnd.randint(y0 + 2, y1 - 2)
        for k in range(rnd.randint(6, 16)):
            p.px(cx + k, cy + int(math.sin(k * 0.9) * 2), dark(c, 0.72))
    for _ in range((x1 - x0) // 120):             # manchas
        cx, cy = rnd.randint(x0, x1), rnd.randint(y0, y1)
        p.tint(cx, cy, cx + rnd.randint(6, 18), cy + rnd.randint(2, 5), (120, 116, 108), 0.15)


def curb(p, x0, y, x1, top=4, face=7):
    p.rect(x0, y, x1, y + top, (232, 230, 224))
    p.rect(x0, y + top + 1, x1, y + top + face, (170, 166, 160))
    p.rect(x0, y + top, x1, y + top, (250, 250, 248))
    p.noise(x0, y, x1, y + top + face, 0.03)
    p.rect(x0, y + top + face + 1, x1, y + top + face + 3, (90, 90, 90))   # sombra na rua


def pavers(p, x0, y0, x1, y1, base=(148, 148, 144), grout=(98, 98, 96), cw=26, ch=18, tint=None):
    H, W = y1 - y0 + 1, x1 - x0 + 1
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    best = np.full((H, W), 1e9, np.float32)
    second = np.full((H, W), 1e9, np.float32)
    bcx = np.zeros((H, W), np.float32)
    bcy = np.zeros((H, W), np.float32)
    bid = np.zeros((H, W), np.int64)
    j0 = np.floor(ys / ch).astype(int)
    for dj in (-1, 0, 1, 2):
        j = j0 + dj
        off = (j % 2) * (cw / 2)
        i0 = np.floor((xs - off) / cw).astype(int)
        for di in (-1, 0, 1):
            i = i0 + di
            cx = i * cw + off
            cy = j * ch
            d = np.hypot(xs - cx, (ys - cy) * 1.2)
            m1 = d < best
            second = np.where(m1, best, np.minimum(second, d))
            bcx = np.where(m1, cx, bcx)
            bcy = np.where(m1, cy, bcy)
            bid = np.where(m1, i * 7919 + j * 104729, bid)
            best = np.where(m1, d, best)
    edge = (second - best) < 1.4
    var = ((bid * 2654435761) % 1000) / 1000.0
    v = 0.9 + 0.16 * var
    col = np.array(base, np.float32)[None, None, :] * v[:, :, None]
    # bisel: luz em cima-esquerda, sombra embaixo-direita
    dx, dy = xs - bcx, ys - bcy
    near = (second - best) < 3.2
    lit = near & (dx + dy < 0)
    col = np.where(lit[:, :, None], col * 1.12, col)
    shd = near & (dx + dy > 0)
    col = np.where(shd[:, :, None], col * 0.86, col)
    col = np.where(edge[:, :, None], np.array(grout, np.float32)[None, None, :], col)
    col *= nrng.uniform(0.96, 1.04, (H, W, 1)).astype(np.float32)
    if tint:
        col = col * (1 - tint[1]) + np.array(tint[0], np.float32) * tint[1]
    p.a[y0:y1 + 1, x0:x1 + 1] = col
    for _ in range(W // 40):          # manchas de óleo/sujeira
        cx, cy = rnd.randint(x0, x1), rnd.randint(y0, y1)
        p.tint(cx, cy, cx + rnd.randint(10, 30), cy + rnd.randint(4, 10), (70, 70, 70), 0.12)


def plant_pot(p, x, y):
    p.rect(x, y - 10, x + 12, y, (170, 80, 50))
    p.rect(x, y - 10, x + 12, y - 9, (200, 110, 70))
    p.ellipse(x + 6, y - 16, 10, 9, (70, 140, 64))
    p.ellipse(x + 3, y - 19, 4, 3, (110, 180, 90))


def big_tree(p, cx, cy, r, trunk_h=60):
    p.rect(cx - 6, cy, cx + 6, cy + trunk_h, (110, 74, 48))
    p.rect(cx + 2, cy, cx + 6, cy + trunk_h, (86, 56, 36))
    p.ellipse(cx, cy - r * 0.2, r, r * 0.8, (54, 108, 50))
    p.ellipse(cx - r * 0.25, cy - r * 0.45, r * 0.7, r * 0.55, (70, 132, 60))
    p.ellipse(cx - r * 0.4, cy - r * 0.6, r * 0.35, r * 0.28, (110, 172, 90), dither=0.6)


# ---------------- a rua (960x540) ----------------
def rua(golden=0.0):
    W, H = 960, 540
    p = Pic(W, H)
    sky(p, 0, 120, [(0, (110, 170, 232)), (0.7, (178, 214, 244)), (1, (214, 232, 248))])
    for cx, cy, w in ((120, 30, 110), (420, 46, 150), (760, 26, 120)):
        cloud(p, cx, cy, w)
    tree_back(p, 0, 960, 80, (104, 150, 98))
    # casa branca com portão (0..240)
    p.rect(0, 120, 90, 230, (120, 160, 84)); p.noise(0, 120, 90, 230, 0.08)
    wall(p, 0, 176, 90, 230, (214, 208, 198))
    for x in range(4, 90, 14):
        p.rect(x, 168, x + 8, 176, (214, 208, 198))
    big_tree(p, 46, 110, 52, 110)
    wall(p, 90, 70, 300, 230, (236, 234, 226)); roof(p, 90, 300, 52)
    gate(p, 108, 130, 120, 100)
    window(p, 246, 116, 38, 34)
    p.rect(240, 160, 252, 172, (90, 90, 90)); p.rect(242, 162, 250, 168, (200, 200, 120))   # relógio de luz
    # barracão de tijolo baiano em obra (300..560)
    baiano(p, 300, 64, 560, 230)
    for x in range(300, 561):
        top = 64 - (9 if (x // 27) % 3 == 1 else 0) - (18 if 400 <= x < 436 else 0)
        if top < 64:
            p.rect(x, top, x, 63, (194, 100, 54) if (64 - top) % 9 else (158, 148, 136))
    for vx in (304, 372, 448, 520, 556):
        p.rect(vx, 30, vx + 1, 62, (92, 70, 60))
    p.rect(330, 132, 386, 230, (34, 24, 26)); p.rect(332, 134, 340, 230, (58, 42, 40))
    p.tint(330, 132, 386, 230, (20, 14, 18), 0.2)
    p.rect(440, 120, 530, 172, (34, 24, 26)); p.rect(440, 173, 530, 176, (176, 166, 156))
    # beco (560..600)
    p.rect(560, 60, 600, 230, (66, 62, 62))
    p.noise(560, 60, 600, 230, 0.08)
    p.shade(560, 60, 600, 230, 0.9)
    # casa amarela (600..790)
    wall(p, 600, 74, 790, 230, (240, 214, 138)); roof(p, 600, 790, 56)
    window(p, 618, 116); window(p, 728, 116)
    door(p, 680, 160, 36, 70)
    plant_pot(p, 662, 230); plant_pot(p, 722, 230)
    p.rect(698, 146, 714, 154, (60, 60, 60)); p.rect(700, 148, 712, 152, (250, 250, 250))  # número
    # casa verde-água (790..960)
    wall(p, 790, 80, 960, 230, (150, 208, 192)); roof(p, 790, 960, 62, c=(160, 74, 48))
    window(p, 812, 120); window(p, 900, 120, 40, 34)
    p.rect(790, 186, 960, 230, (206, 204, 198)); p.noise(790, 186, 960, 230, 0.03)
    gate(p, 846, 182, 64, 48, (110, 118, 130), 6)
    # calçada, meio-fio e rua
    sidewalk(p, 0, 231, 959, 262)
    for x0, x1 in ((90, 300), (600, 960)):             # sombra das casas (sol à direita)
        p.shade(x0 - 12, 231, x1 - 12, 238, 0.9)
    poste(p, 584, 40, 252)
    wires(p, 0, 960, 52, 18)
    curb(p, 0, 263, 959)
    pavers(p, 0, 277, 959, 503)
    curb(p, 0, 500, 959)
    sidewalk(p, 0, 512, 959, 539, (196, 192, 184))
    if golden:
        p.a = p.a * (1 - golden) + (p.a * np.array([1.12, 0.92, 0.72], np.float32)) * golden
    return p.image()


if __name__ == "__main__":
    import os, time
    os.makedirs("/home/claude/jogo/assets/cenarios", exist_ok=True)
    t0 = time.time()
    rua().save("/home/claude/jogo/assets/cenarios/rua.png")
    rua(golden=0.55).save("/home/claude/jogo/assets/cenarios/rua_tarde.png")
    print("ok", round(time.time() - t0, 1))
