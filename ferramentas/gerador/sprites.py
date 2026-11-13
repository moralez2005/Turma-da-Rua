"""Gerador de pixel art: personagens da turma da rua, rua (gameplay) e cena do por do sol.
Tudo desenhado pixel a pixel com Pillow, sem fotos no resultado final."""
import random
from PIL import Image, ImageDraw, ImageFont

OUT = (34, 22, 28, 255)
WHITE = (245, 245, 245)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# ---------- paletas ----------
S_LIGHT = ((242, 200, 165), (214, 164, 128))
S_LIGHT2 = ((236, 190, 150), (204, 152, 114))
S_LT = ((228, 174, 130), (195, 138, 98))      # moreno claro
S_TAN = ((198, 138, 94), (163, 104, 68))
S_TAN2 = ((206, 148, 104), (170, 112, 74))
S_DARK = ((122, 76, 48), (92, 56, 36))
H_BLACK = ((32, 26, 26), (58, 46, 46))
H_DBROWN = ((58, 40, 30), (98, 70, 50))
H_BLOND = ((150, 108, 62), (198, 154, 100))

CHARS = [
    dict(id="cezar", nome="Cezar", skin=S_TAN, hair=H_BLACK, hs="espetado", tw=13, th=13, lh=10,
         shirt=(236, 236, 236), sleeve="long", pat="floral", shorts=(40, 48, 82), feet="descalco",
         expr="grin", item="salgadinho"),
    dict(id="kaua", nome="Kaua Henrique", skin=S_LIGHT, hair=H_BLOND, hs="franja", tw=13, th=13, lh=11,
         shirt=(62, 70, 90), sleeve="short", pat="gang", shorts=(70, 100, 150), feet=(60, 110, 200),
         expr="calm", item="copo", goleiro=True),
    dict(id="pernalonga", nome="Voce", apelido="Pernalonga", skin=S_TAN2, hair=H_BLACK, hs="topete", tw=13, th=14, lh=16,
         shirt=(240, 240, 240), sleeve="short", pat="printbox", shorts=(36, 36, 42), feet=(240, 240, 240),
         expr="smile", item="refri"),
    dict(id="pedro", nome="Pedro", apelido="Dona Juliete", skin=S_LT, hair=H_BLACK, hs="curto", hw=15, tw=16, th=13, lh=9,
         leg_w=4, shirt=(30, 30, 38), sleeve="short", pat="pedro", shorts=(112, 112, 120), feet=(30, 30, 30),
         expr="smirk", cap=(238, 238, 238), juliet=True, big_ears=True, item="copo"),
    dict(id="lucas", nome="Lucas", skin=S_LIGHT2, hair=H_DBROWN, hs="baguncado", tw=13, th=13, lh=10,
         shirt=(200, 40, 46), sleeve="tank", pat="spots", shorts="camo", feet=(60, 160, 90),
         expr="laugh", item="salgadinho"),
    dict(id="daniel", nome="Daniel", skin=S_LT, hair=H_BLACK, hs="baguncado", hw=13, tw=11, th=12, lh=8,
         shirt=(70, 150, 72), sleeve="short", pat="cube", shorts=(172, 150, 110), feet=(220, 200, 60),
         expr="smile", item="celular"),
    dict(id="gabriel", nome="Gabriel", skin=S_DARK, hair=H_BLACK, hs="zero", hw=13, tw=11, th=11, lh=7,
         shirt=(240, 150, 40), sleeve="short", pat="jersey", shorts=(30, 30, 36), feet=(200, 50, 50),
         expr="smile", item="copo", goleiro=True),
]


def dark(c, f=0.78):
    return tuple(int(v * f) for v in c[:3])


def mix(a, b, t):
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))


class Canvas:
    def __init__(self, w, h):
        self.img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        self.px = self.img.load()
        self.w, self.h = w, h

    def p(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[x, y] = c if c is None or len(c) == 4 else (*c, 255)

    def clear(self, x, y):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[x, y] = (0, 0, 0, 0)

    def r(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.p(x, y, c)

    def get(self, x, y):
        if 0 <= x < self.w and 0 <= y < self.h:
            return self.px[x, y]
        return (0, 0, 0, 0)

    def outline(self):
        src = self.img.copy().load()
        for y in range(self.h):
            for x in range(self.w):
                if src[x, y][3] == 0:
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < self.w and 0 <= ny < self.h and src[nx, ny][3] > 0 and src[nx, ny] != OUT:
                            self.px[x, y] = OUT
                            break


def camo_color(x, y):
    v = (x * 7 + y * 13 + (x * y) % 5) % 9
    return [(110, 120, 70), (160, 140, 90), (90, 70, 50), (130, 130, 80)][v % 4]


# ---------------- personagem detalhado (cena final / retrato) ----------------
def detailed(c, pose="stand", with_item=False, seed=1, frame=0, blink=False, talk=False, look=0, item=None, view="front"):
    cv = Canvas(40, 68)
    rnd = random.Random(seed)
    cx = 20
    sk, sks = c["skin"]
    hc, hl = c["hair"]
    tw, th = c["tw"], c["th"]
    bottom = 66
    tx0 = cx - tw // 2
    tx1 = tx0 + tw - 1
    leg_w = c.get("leg_w", 3)
    feet = c["feet"]

    def shorts_col(x, y):
        return camo_color(x, y) if c["shorts"] == "camo" else c["shorts"]

    def foot(x0, x1, y):
        if feet == "descalco":
            cv.r(x0, y, x1, y + 1, sk)
            cv.r(x0, y + 1, x1, y + 1, sks)
        else:
            cv.r(x0, y, x1, y, sk)
            cv.r(x0, y + 1, x1, y + 1, feet)
            cv.p((x0 + x1) // 2, y, feet)

    if pose == "stand":
        lh = c["lh"]
        lx0, lx1 = cx - 1 - leg_w, cx - 2
        rx0, rx1 = cx + 1, cx + leg_w
        la, ra = {0: (0, 0), 1: (2, 0), 2: (0, 2)}[frame]
        sh = {0: (0, 0), 1: (-1, 1), 2: (1, -1)}[frame]
        lx0, lx1, rx0, rx1 = lx0 + sh[0], lx1 + sh[0], rx0 + sh[1], rx1 + sh[1]
        foot(lx0 - 1, lx1, bottom - 1 - la)
        foot(rx0, rx1 + 1, bottom - 1 - ra)
        ly0 = bottom - 1 - lh
        cv.r(lx0, ly0, lx1, bottom - 2 - la, sk)
        cv.r(rx0, ly0, rx1, bottom - 2 - ra, sk)
        cv.r(rx1, ly0, rx1, bottom - 2 - ra, sks)
        sy1 = ly0 + 2
        sy0 = sy1 - 5
        if c.get("vestido"):
            saia = c.get("saia", 7)
            for k, y in enumerate(range(sy0, sy1 + saia)):
                abre = k // 3
                for x in range(tx0 - abre, tx1 + abre + 1):
                    cv.p(x, y, c["shirt"] if k < 2 else c["shorts"])
            cv.r(tx0 - (saia + 5) // 3, sy1 + saia - 1, tx1 + (saia + 5) // 3, sy1 + saia - 1, dark(c["shorts"], 0.8))
        else:
            for y in range(sy0, sy1 + 1):
                for x in range(tx0, tx1 + 1):
                    cv.p(x, y, shorts_col(x, y))
            cv.clear(cx - 1, sy1)
            cv.clear(cx, sy1)
    else:  # sentado no meio-fio
        lh = 6 if c["lh"] < 14 else 8
        sy1 = bottom - 2 - lh
        sy0 = sy1 - 4
        for y in range(sy0, sy1 + 1):
            for x in range(tx0 - 1, tx1 + 2):
                cv.p(x, y, shorts_col(x, y))
        # joelhos e canelas
        lx0, lx1 = tx0, tx0 + leg_w - 1
        rx0, rx1 = tx1 - leg_w + 1, tx1
        cv.r(lx0, sy1 + 1, lx1, bottom - 2, sk)
        cv.r(rx0, sy1 + 1, rx1, bottom - 2, sk)
        cv.r(rx1, sy1 + 1, rx1, bottom - 2, sks)
        cv.r(lx0, sy1 + 1, lx1, sy1 + 1, mix(sk, (255, 255, 255), 0.15))
        foot(lx0 - 1, lx1, bottom - 1)
        foot(rx0, rx1 + 1, bottom - 1)

    # tronco
    ty0 = sy0 - th
    shirt = c["shirt"]
    cv.r(tx0, ty0, tx1, sy0, shirt)
    cv.clear(tx0, ty0)
    cv.clear(tx1, ty0)

    # bracos
    swing = {0: 0, 1: 1, 2: -1}[frame] if pose == "stand" else 0
    for side, ax0 in enumerate((tx0 - 3, tx1 + 1)):
        dy = swing if side == 0 else -swing
        arm_top, arm_bot = ty0 + 1 + max(0, dy), sy0 + 2 + dy
        for y in range(arm_top, arm_bot + 1):
            for x in range(ax0, ax0 + 3):
                if c["sleeve"] == "long":
                    col = shirt if y < arm_bot - 1 else sk
                elif c["sleeve"] == "short":
                    col = shirt if y < arm_top + 4 else sk
                else:  # regata
                    col = sk
                cv.p(x, y, col)
        cv.r(ax0 + 2, arm_top, ax0 + 2, arm_bot, dark(cv.get(ax0 + 2, arm_top + 6)))
    if c["sleeve"] == "tank":
        cv.r(tx0, ty0, tx0 + 2, ty0 + 2, shirt)
        cv.r(tx1 - 2, ty0, tx1, ty0 + 2, shirt)

    # estampas
    pat = c["pat"]
    if view == "back" and pat in ("gang", "printbox", "pedro", "cube"):
        pat = None
    if pat == "floral":
        for y in range(ty0, sy0 + 1):
            for x in range(tx0 - 3, tx1 + 4):
                cur = cv.get(x, y)
                if cur[3] and cur[:3] == shirt:
                    v = rnd.random()
                    if v < 0.17:
                        cv.p(x, y, (52, 52, 58))
                    elif v < 0.27:
                        cv.p(x, y, (140, 140, 146))
    elif pat == "gang":
        cv.r(cx - 4, ty0 + 3, cx + 3, ty0 + 3, (220, 220, 225))
        cv.r(cx - 4, ty0 + 4, cx + 3, ty0 + 4, (200, 60, 60))
        cv.r(cx - 3, ty0 + 5, cx + 2, ty0 + 5, (220, 220, 225))
        cv.r(cx - 4, ty0 + 6, cx + 3, ty0 + 6, (150, 156, 170))
    elif pat == "printbox":
        cv.r(cx - 4, ty0 + 2, cx + 3, ty0 + 9, (30, 30, 34))
        cv.r(cx - 2, ty0 + 3, cx + 1, ty0 + 5, (120, 120, 126))
        cv.r(cx - 1, ty0 + 6, cx, ty0 + 9, (90, 90, 96))
        cv.p(cx + 2, ty0 + 4, (180, 180, 186))
    elif pat == "pedro":
        cv.r(cx - 5, ty0 + 3, cx + 4, ty0 + 4, (150, 90, 210))
        cv.r(cx - 4, ty0 + 5, cx + 3, ty0 + 6, (80, 160, 230))
        cv.r(cx - 2, ty0 + 7, cx + 2, ty0 + 8, (240, 240, 240))
    elif pat == "spots":
        for (dx, dy) in ((2, 3), (6, 5), (9, 2), (4, 8), (10, 9), (1, 10)):
            cv.p(tx0 + dx, ty0 + dy, (140, 24, 30))
        cv.p(tx0 + 3, ty0 + 3, (240, 240, 240))  # logo pequeno
    elif pat == "cube":
        cv.r(cx - 3, ty0 + 3, cx + 2, ty0 + 4, (130, 200, 110))
        cv.r(cx - 3, ty0 + 5, cx - 1, ty0 + 8, (50, 110, 50))
        cv.r(cx, ty0 + 5, cx + 2, ty0 + 8, (40, 90, 40))
    elif pat == "jersey":
        cv.r(cx - 1, ty0, cx, sy0, (255, 255, 255))
        cv.r(tx0, ty0, tx1, ty0, (200, 90, 20))
    # sombra lateral do tronco
    for y in range(ty0 + 1, sy0 + 1):
        cur = cv.get(tx1, y)
        if cur[3]:
            cv.p(tx1, y, dark(cur, 0.82))

    # pescoco e cabeca
    cv.r(cx - 2, ty0 - 2, cx + 1, ty0 - 1, sks)
    hw = c.get("hw", 14)
    hh = 14
    hx0 = cx - hw // 2
    hx1 = hx0 + hw - 1
    hy1 = ty0 - 2
    hy0 = hy1 - hh + 1
    cv.r(hx0, hy0, hx1, hy1, sk)
    for (x, y) in ((hx0, hy0), (hx1, hy0), (hx0, hy1), (hx0 + 1, hy1), (hx1, hy1), (hx1 - 1, hy1),
                   (hx0, hy1 - 1), (hx1, hy1 - 1)):
        cv.clear(x, y)
    cv.r(hx1 - 1, hy0 + 4, hx1 - 1, hy1 - 2, sks)
    cv.r(hx0 + 2, hy1, hx1 - 2, hy1, sks)
    ey = hy0 + 7
    if c.get("big_ears"):
        for ex, inner in ((hx0 - 2, hx0 - 1), (hx1 + 1, hx1 + 1)):
            cv.r(ex, ey - 1, ex + 1, ey + 3, sk)
            cv.p(inner, ey + 1, sks)
    else:
        cv.r(hx0 - 1, ey, hx0 - 1, ey + 2, sk)
        cv.r(hx1 + 1, ey, hx1 + 1, ey + 2, sks)

    # rosto
    eye_y = hy0 + 8
    eye_l, eye_r = cx - 4, cx + 3
    for ex in (eye_l, eye_r):
        if blink:
            cv.r(ex - 1, eye_y + 1, ex + (1 if ex == eye_r else 0), eye_y + 1, (70, 42, 40))
        elif look:
            cv.r(ex + look, eye_y, ex + look, eye_y + 1, (28, 20, 24))
            cv.p(ex, eye_y + 1, (250, 250, 250))
        else:
            cv.r(ex, eye_y, ex, eye_y + 1, (28, 20, 24))
            cv.p(ex - 1 if ex == eye_l else ex + 1, eye_y + 1, (250, 250, 250))
    by = eye_y - 2
    if c["expr"] == "grin":
        cv.r(eye_l - 1, by - 1, eye_l + 1, by - 1, hc)
    else:
        cv.r(eye_l - 1, by, eye_l + 1, by, hc)
    cv.r(eye_r - 1, by, eye_r + 1, by, hc)
    cv.p(cx, eye_y + 2, sks)
    if c["skin"] in (S_LIGHT, S_LIGHT2):
        cv.p(eye_l - 1, eye_y + 3, (236, 160, 150))
        cv.p(eye_r + 1, eye_y + 3, (236, 160, 150))
    m = eye_y + 4
    M = (90, 34, 40)
    e = c["expr"]
    if talk:
        e = {"laugh": "smile", "grin": "smile", "smile": "laugh", "calm": "smile", "smirk": "laugh"}[e]
    if e == "smile":
        cv.r(cx - 2, m, cx + 1, m, M)
        cv.p(cx - 3, m - 1, M)
        cv.p(cx + 2, m - 1, M)
        cv.r(cx - 1, m, cx, m, (250, 250, 250))
    elif e == "grin":
        cv.r(cx - 3, m, cx + 2, m, (250, 250, 250))
        cv.r(cx - 2, m + 1, cx + 1, m + 1, M)
        cv.p(cx - 4, m - 1, M)
        cv.p(cx + 3, m - 1, M)
    elif e == "calm":
        cv.r(cx - 1, m, cx, m, M)
        cv.p(cx - 2, m - 1, M)
        cv.p(cx + 1, m - 1, M)
    elif e == "smirk":
        cv.r(cx - 1, m, cx + 1, m, M)
        cv.p(cx + 2, m - 1, M)
    elif e == "laugh":
        cv.r(cx - 2, m, cx + 1, m, (250, 250, 250))
        cv.r(cx - 2, m + 1, cx + 1, m + 1, (170, 50, 60))
        cv.p(cx - 3, m - 1, M)
        cv.p(cx + 2, m - 1, M)

    # cabelo
    hs = c["hs"]
    if hs == "zero":
        cv.r(hx0, hy0 - 1, hx1, hy0 + 1, hc)
        cv.r(hx0, hy0 + 2, hx0, hy0 + 5, hc)
        cv.r(hx1, hy0 + 2, hx1, hy0 + 5, hc)
        for x in range(hx0 + 1, hx1, 2):
            cv.p(x, hy0, hl)
    else:
        cv.r(hx0, hy0 - 1, hx1, hy0 + 2, hc)
        cv.r(hx0, hy0 + 3, hx0 + 1, hy0 + 6, hc)
        cv.r(hx1 - 1, hy0 + 3, hx1, hy0 + 6, hc)
        if hs in ("curto", "espetado", "topete"):
            for x in range(hx0 + 2, hx1 - 1):
                if x % 3:
                    cv.p(x, hy0 + 3, hc)
        if hs == "espetado":
            for x in range(hx0 + 1, hx1, 3):
                cv.p(x, hy0 - 2, hc)
            cv.p(hx0 + 4, hy0 - 3, hc)
            cv.p(hx1 - 3, hy0 - 3, hc)
        if hs == "topete":
            cv.r(hx0 + 3, hy0 - 2, hx1 - 3, hy0 - 2, hc)
            cv.r(hx0 + 5, hy0 - 3, hx1 - 4, hy0 - 3, hc)
            cv.r(hx0, hy0 + 4, hx0, hy0 + 6, mix(hc, sk, 0.5))
            cv.r(hx1, hy0 + 4, hx1, hy0 + 6, mix(hc, sk, 0.5))
        if hs == "franja":
            cv.r(hx0, hy0 + 3, cx + 3, hy0 + 4, hc)
            for x in range(hx0, cx + 2):
                if x % 2 == 0:
                    cv.p(x, hy0 + 5, hc)
            cv.r(hx0, hy0 + 5, hx0 + 1, hy0 + 8, hc)
            cv.r(hx1 - 1, hy0 + 5, hx1, hy0 + 7, hc)
        if hs == "coque":   # cabelo preso pra trás, com coque no alto
            cv.r(hx0 + 4, hy0 - 4, hx1 - 4, hy0 - 2, hc)
            cv.r(hx0 + 5, hy0 - 5, hx1 - 5, hy0 - 5, hl)
        if hs == "longo":   # cabelo comprido, caindo pelos lados até o ombro
            cv.r(hx0, hy0 + 3, cx + 1, hy0 + 4, hc)
            cv.r(hx0 - 1, hy0 + 2, hx0 + 1, hy1 + 5, hc)
            cv.r(hx1 - 1, hy0 + 2, hx1 + 1, hy1 + 5, hc)
            cv.r(hx0 - 1, hy1 + 5, hx0, hy1 + 6, dark(hc, 0.9))
            cv.r(hx1, hy1 + 5, hx1 + 1, hy1 + 6, dark(hc, 0.9))
        if hs == "baguncado":
            depth = [3, 5, 4, 5, 3, 5, 4, 3, 5, 4, 5, 3, 4, 5, 4]
            for i, x in enumerate(range(hx0, hx1 + 1)):
                cv.r(x, hy0 + 3, x, hy0 + depth[i % len(depth)], hc)
            cv.p(hx0 + 2, hy0 - 2, hc)
            cv.p(hx1 - 4, hy0 - 2, hc)
        for x in range(hx0 + 3, hx0 + 5):
            cv.p(x, hy0, hl)
        cv.p(hx0 + 3, hy0 + 1, hl)

    if c.get("cap_frente") and view != "back":   # boné curvo, rente à cabeça, com a aba baixinha pra frente
        capc = c["cap_frente"]
        cv.r(hx0, hy0 - 1, hx1, hy0 + 3, capc)                 # copa colada na cabeça
        cv.r(hx0 + 2, hy0 - 2, hx1 - 2, hy0 - 2, capc)         # topo arredondado
        cv.clear(hx0, hy0 - 1); cv.clear(hx1, hy0 - 1)
        cv.r(hx0 + 3, hy0 - 1, hx0 + 5, hy0, mix(capc, (255, 255, 255), 0.2))   # brilho
        # aba curva: desce no meio, sobe nas pontas
        cv.r(hx0, hy0 + 4, hx1, hy0 + 4, dark(capc, 0.75))
        cv.r(hx0 + 2, hy0 + 5, hx1 - 2, hy0 + 5, dark(capc, 0.6))
        cv.r(hx0 + 1, hy0 + 6, hx1 - 1, hy0 + 6, dark(sk, 0.8))       # sombra da aba nos olhos
    if c.get("cap"):
        capc = c["cap"]
        cv.r(hx0 - 1, hy0 - 2, hx1 + 1, hy0 + 2, capc)
        cv.clear(hx0 - 1, hy0 - 2)
        cv.clear(hx1 + 1, hy0 - 2)
        cv.r(hx0 - 1, hy0 + 2, hx1 + 1, hy0 + 2, dark(capc, 0.85))
        cv.r(cx - 2, hy0 + 1, cx + 1, hy0 + 2, hc)        # abertura do snapback (aba pra tras)
        cv.r(cx - 2, hy0, cx + 1, hy0, (60, 60, 70))       # tirinha de ajuste
        cv.r(hx1, hy0 - 1, hx1 + 1, hy0 + 1, dark(capc, 0.85))
    if c.get("oculos") and view != "back":       # óculos de armação (vizinhas)
        oc = c["oculos"]
        for ex in (eye_l, eye_r):
            cv.r(ex - 2, eye_y - 1, ex + 2, eye_y - 1, oc); cv.r(ex - 2, eye_y + 2, ex + 2, eye_y + 2, oc)
            cv.r(ex - 2, eye_y - 1, ex - 2, eye_y + 2, oc); cv.r(ex + 2, eye_y - 1, ex + 2, eye_y + 2, oc)
        cv.r(eye_l + 3, eye_y, eye_r - 3, eye_y, oc)
    if c.get("juliet") and view != "back":
        cv.r(hx0, eye_y - 1, hx1, eye_y - 1, (40, 40, 52))
        lens = [(60, 120, 230), (90, 100, 220), (140, 80, 200), (210, 100, 120), (240, 140, 60)]
        for x in range(hx0 + 1, hx1):
            if x in (cx - 1, cx):
                cv.p(x, eye_y, (40, 40, 52))
                continue
            t = (x - hx0) / max(1, hw - 1)
            col = lens[min(len(lens) - 1, int(t * len(lens)))]
            cv.p(x, eye_y, col)
            cv.p(x, eye_y + 1, dark(col, 0.8))
        cv.p(eye_l - 1, eye_y, (255, 255, 255))
        cv.p(eye_r, eye_y, (255, 255, 255))

    if view == "back":  # nuca: cabelo cobre o rosto
        if c["hs"] == "zero":
            cv.r(hx0, hy0 - 1, hx1, hy0 + 7, hc)
            cv.r(hx0 + 1, hy0 + 8, hx1 - 1, hy1, sk)
            for x in range(hx0 + 1, hx1, 2):
                cv.p(x, hy0 + 2, hl)
        elif c["hs"] == "coque":
            cv.r(hx0, hy0 - 1, hx1, hy0 + 10, hc)
            cv.r(hx0 + 4, hy0 - 4, hx1 - 4, hy0 - 1, hc)
            cv.r(hx0 + 2, hy0 + 11, hx1 - 2, hy1, sk)
        elif c["hs"] == "longo":
            cv.r(hx0 - 1, hy0 - 1, hx1 + 1, hy1 + 6, hc)
            for x in range(hx0 + 1, hx1, 3):
                cv.r(x, hy0 + 2, x, hy1 + 4, hl)
        else:
            cv.r(hx0, hy0 - 1, hx1, hy0 + 11, hc)
            cv.r(hx0 + 2, hy0 + 12, hx1 - 2, hy1, sk)
            for x in range(hx0 + 2, hx1 - 1, 3):
                cv.r(x, hy0 + 2, x, hy0 + 8, hl)
        cv.r(hx0 + 2, hy1, hx1 - 2, hy1, sks)
        cv.clear(hx0, hy1); cv.clear(hx1, hy1); cv.clear(hx0, hy0 - 1); cv.clear(hx1, hy0 - 1)
        if c.get("cap"):
            cv.r(hx0 - 1, hy0 - 2, hx1 + 1, hy0 + 2, c["cap"])
            cv.r(cx - 3, hy0 + 2, cx + 2, hy0 + 3, dark(c["cap"], 0.8))  # aba virada pra tras
        if c.get("cap_frente"):
            cv.r(hx0, hy0 - 1, hx1, hy0 + 4, c["cap_frente"])
            cv.r(hx0 + 2, hy0 - 2, hx1 - 2, hy0 - 2, c["cap_frente"])
            cv.r(cx - 2, hy0 + 3, cx + 1, hy0 + 4, (60, 60, 70))         # regulagem atrás
    # itens na mao (cena final)
    if with_item:
        item = item or c.get("item")
        hx_r = tx1 + 1
        hand_y = sy0 + 1
        if item == "refri":
            bx = hx_r + 2
            cv.r(bx, hand_y - 8, bx + 2, hand_y + 3, (40, 140, 70))
            cv.r(bx, hand_y - 4, bx + 2, hand_y - 2, (60, 110, 200))
            cv.p(bx + 1, hand_y - 3, (240, 240, 240))
            cv.r(bx + 1, hand_y - 10, bx + 1, hand_y - 9, (40, 140, 70))
            cv.p(bx + 1, hand_y - 11, (200, 40, 40))
            cv.p(bx, hand_y - 6, (140, 220, 160))
            cv.r(hx_r, hand_y, hx_r + 2, hand_y + 1, sk)
        elif item == "copo":
            bx = hx_r + 1
            cv.r(bx, hand_y - 4, bx + 2, hand_y + 0, (235, 235, 240))
            cv.r(bx, hand_y - 3, bx + 2, hand_y - 1, (90, 40, 20))
            cv.r(hx_r, hand_y, hx_r + 2, hand_y + 1, sk)
        elif item == "salgadinho":
            bx = tx0 - 7
            cv.r(bx, hand_y - 5, bx + 4, hand_y + 1, (250, 190, 40))
            cv.r(bx, hand_y - 3, bx + 4, hand_y - 3, (220, 50, 40))
            cv.r(bx, hand_y - 6, bx + 4, hand_y - 6, (200, 150, 30))
            cv.p(bx + 2, hand_y - 1, (240, 120, 30))
            cv.r(tx0 - 3, hand_y, tx0 - 1, hand_y + 1, sk)
        elif item == "celular":
            cv.r(cx - 2, sy0 - 3, cx + 1, sy0 + 1, (30, 30, 36))
            cv.r(cx - 1, sy0 - 2, cx, sy0, (110, 200, 255))
            cv.r(cx - 4, sy0, cx - 3, sy0 + 1, sk)
            cv.r(cx + 2, sy0, cx + 3, sy0 + 1, sk)

    cv.outline()
    return cv.img


# ---------------- sprite pequeno (gameplay) ----------------
def mini(c, frame=0):
    cv = Canvas(16, 26)
    sk, sks = c["skin"]
    hc, hl = c["hair"]
    cx = 8
    bottom = 25
    lh = {7: 3, 8: 4, 16: 7}.get(c["lh"], 4 if c["lh"] < 12 else 5)
    tw = 8 if c["tw"] >= 16 else 6
    th = 6 if c["th"] >= 14 else 5
    tx0 = cx - tw // 2
    tx1 = tx0 + tw - 1
    feet = c["feet"]
    fcol = sk if feet == "descalco" else feet
    # pernas (frame 1/2 = corrida)
    offs = {0: (0, 0), 1: (-1, 1), 2: (1, -1)}[frame]
    lift = {0: (0, 0), 1: (1, 0), 2: (0, 1)}[frame]
    legs = [(cx - 3 + offs[0], lift[0]), (cx + 1 + offs[1], lift[1])]
    ly0 = bottom - lh
    for (lx, lf) in legs:
        cv.r(lx, ly0, lx + 1, bottom - 1 - lf, sk)
        cv.r(lx, bottom - lf, lx + 1, bottom - lf, fcol)
    sy1 = ly0
    sy0 = sy1 - 1
    for y in range(sy0, sy1 + 1):
        for x in range(tx0, tx1 + 1):
            cv.p(x, y, camo_color(x, y) if c["shorts"] == "camo" else c["shorts"])
    ty0 = sy0 - th
    cv.r(tx0, ty0, tx1, sy0 - 1, c["shirt"])
    if c["pat"] == "floral":
        for (x, y) in ((tx0 + 1, ty0 + 1), (tx0 + 4, ty0 + 2), (tx0 + 2, ty0 + 3), (tx0 + 5, ty0 + 4)):
            cv.p(x, y, (60, 60, 66))
    elif c["pat"] == "jersey":
        cv.r(cx - 1, ty0, cx, sy0 - 1, (255, 255, 255))
    elif c["pat"] in ("printbox", "pedro", "cube", "gang"):
        pc = {"printbox": (30, 30, 34), "pedro": (150, 90, 210), "cube": (130, 200, 110), "gang": (220, 220, 225)}[c["pat"]]
        cv.r(cx - 1, ty0 + 1, cx, ty0 + 2, pc)
    # bracos balancando
    swing = {0: 0, 1: 1, 2: -1}[frame]
    for side, ax in ((0, tx0 - 1), (1, tx1 + 1)):
        dy = swing if side == 0 else -swing
        for y in range(ty0 + 1 + dy, ty0 + th + dy):
            col = c["shirt"] if (y < ty0 + 3 + dy and c["sleeve"] != "tank") or c["sleeve"] == "long" else sk
            if y == ty0 + th - 1 + dy:
                col = (80, 200, 120) if c.get("goleiro") else sk
            cv.p(ax, y, col)
    # cabeca
    hw = 9 if c.get("hw", 14) >= 15 else 8
    hx0 = cx - hw // 2
    hx1 = hx0 + hw - 1
    hy1 = ty0 - 1
    hy0 = hy1 - 6
    cv.r(hx0, hy0, hx1, hy1, sk)
    cv.clear(hx0, hy1)
    cv.clear(hx1, hy1)
    cv.r(hx1, hy0 + 2, hx1, hy1 - 1, sks)
    if c.get("big_ears"):
        cv.r(hx0 - 1, hy0 + 2, hx0 - 1, hy0 + 4, sk)
        cv.r(hx1 + 1, hy0 + 2, hx1 + 1, hy0 + 4, sks)
    ey = hy0 + 4
    cv.p(cx - 2, ey, (28, 20, 24))
    cv.p(cx + 1, ey, (28, 20, 24))
    if c["hs"] == "zero":
        cv.r(hx0, hy0 - 1, hx1, hy0, hc)
    else:
        cv.r(hx0, hy0 - 1, hx1, hy0 + 1, hc)
        cv.r(hx0, hy0 + 2, hx0, hy0 + 3, hc)
        cv.r(hx1, hy0 + 2, hx1, hy0 + 3, hc)
        if c["hs"] == "franja":
            cv.r(hx0, hy0 + 2, cx, hy0 + 2, hc)
        if c["hs"] == "espetado":
            cv.p(hx0 + 1, hy0 - 2, hc)
            cv.p(hx0 + 4, hy0 - 2, hc)
            cv.p(hx1 - 1, hy0 - 2, hc)
        if c["hs"] == "topete":
            cv.r(hx0 + 2, hy0 - 2, hx1 - 2, hy0 - 2, hc)
        if c["hs"] == "baguncado":
            cv.p(hx0 + 2, hy0 + 2, hc)
            cv.p(hx0 + 5, hy0 + 2, hc)
        cv.p(hx0 + 2, hy0, hl)
    if c.get("cap"):
        cv.r(hx0 - 1, hy0 - 1, hx1 + 1, hy0 + 1, c["cap"])
        cv.p(cx, hy0 + 1, hc)
    if c.get("juliet"):
        cv.r(hx0 + 1, ey, hx1 - 1, ey, (80, 110, 230))
        cv.p(hx1 - 2, ey, (240, 140, 60))
    cv.outline()
    return cv.img


def up(img, s):
    return img.resize((img.width * s, img.height * s), Image.NEAREST)


def label(draw, xy, text, size, fill=(255, 255, 255), anchor="mm", stroke=(20, 14, 18)):
    f = ImageFont.truetype(FONT, size)
    draw.text(xy, text, font=f, fill=fill, anchor=anchor, stroke_width=max(2, size // 8), stroke_fill=stroke)
