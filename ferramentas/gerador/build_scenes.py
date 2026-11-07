import os, sys, math, random
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw
from sprites import CHARS, detailed, mini, up, label, mix, dark

OUT = "/home/claude/rua_assets"
os.makedirs(f"{OUT}/cenarios", exist_ok=True)
rnd = random.Random(7)


def put(px, w, h, x, y, c):
    if 0 <= x < w and 0 <= y < h:
        px[x, y] = (*c[:3], 255)


def rect(px, w, h, x0, y0, x1, y1, c):
    for y in range(max(0, y0), min(h, y1 + 1)):
        for x in range(max(0, x0), min(w, x1 + 1)):
            px[x, y] = (*c[:3], 255)


def hex_pavers(px, w, h, x0, y0, x1, y1, base, grout, cw=10, ch=7, tint=None):
    """Bloquete sextavado: Voronoi num reticulado hexagonal."""
    centers = []
    for j in range(-1, (y1 - y0) // ch + 3):
        for i in range(-1, (x1 - x0) // cw + 3):
            cxp = x0 + i * cw + (cw // 2 if j % 2 else 0)
            cyp = y0 + j * ch
            v = rnd.uniform(-0.12, 0.10)
            centers.append((cxp, cyp, v))
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            best = [(1e9, None), (1e9, None)]
            for (cxp, cyp, v) in centers:
                if abs(cxp - x) > cw * 1.5 or abs(cyp - y) > ch * 1.5:
                    continue
                dd = math.hypot((x - cxp) * 1.0, (y - cyp) * 1.25)
                if dd < best[0][0]:
                    best = [(dd, v), best[0]]
                elif dd < best[1][0]:
                    best[1] = (dd, v)
            if best[1][0] - best[0][0] < 1.1:
                col = grout
            else:
                col = tuple(max(0, min(255, int(c * (1 + best[0][1])))) for c in base)
            if tint:
                col = tint(x, y, col)
            put(px, w, h, x, y, col)


def baiano_wall(px, w, h, x0, y0, x1, y1, brick=(190, 96, 52), mortar=(150, 140, 128), tint=None):
    """Parede de tijolo baiano (sem reboco), com frisos no meio de cada tijolo."""
    bw, bh = 10, 5
    for y in range(y0, y1 + 1):
        row = (y - y0) // bh
        off = (bw // 2) if row % 2 else 0
        for x in range(x0, x1 + 1):
            ly = (y - y0) % bh
            lx = (x - x0 + off) % bw
            if ly == bh - 1 or lx == bw - 1:
                col = mortar
            else:
                seed = ((x - x0 + off) // bw * 31 + row * 17) % 7
                col = mix(brick, (120, 50, 30), 0.06 * seed)
                if ly == 2:
                    col = dark(col, 0.86)  # friso do tijolo
                if ly == 0:
                    col = mix(col, (255, 200, 150), 0.18)
            if tint:
                col = tint(x, y, col)
            put(px, w, h, x, y, col)


# =================== RUA (gameplay) ===================
def rua_gameplay():
    W, H = 320, 180
    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    px = img.load()
    # ceu atras das casas
    for y in range(0, 14):
        rect(px, W, H, 0, y, W - 1, y, mix((120, 180, 235), (190, 220, 245), y / 14))
    # casas ao fundo
    # arvore
    rect(px, W, H, 0, 6, 30, 52, (70, 130, 60))
    for _ in range(140):
        x, y = rnd.randint(0, 32), rnd.randint(4, 50)
        put(px, W, H, x, y, rnd.choice([(50, 105, 45), (95, 160, 80), (60, 120, 52)]))
    # muro branco + portao de garagem
    rect(px, W, H, 30, 18, 92, 54, (232, 230, 222))
    rect(px, W, H, 30, 14, 92, 17, (176, 82, 52))  # telhado
    rect(px, W, H, 40, 26, 70, 54, (245, 245, 240))
    for x in range(41, 70, 3):
        rect(px, W, H, x, 27, x, 53, (205, 205, 200))
    rect(px, W, H, 76, 30, 88, 54, (200, 205, 210))
    for x in range(77, 88, 2):
        rect(px, W, H, x, 31, x, 54, (150, 155, 160))
    # BARRACAO de tijolo baiano em construcao
    baiano_wall(px, W, H, 92, 16, 172, 54)
    for x in range(92, 173):  # topo irregular (obra parada)
        top = 16 - (3 if (x // 10) % 3 == 1 else 0)
        rect(px, W, H, x, top, x, 16, (190, 96, 52) if top < 16 else (150, 140, 128))
    for vx in (95, 120, 146, 170):  # vergalhoes
        rect(px, W, H, vx, 8, vx, 15, (90, 70, 60))
    rect(px, W, H, 102, 28, 116, 54, (36, 26, 26))   # porta aberta
    rect(px, W, H, 103, 29, 105, 54, (60, 44, 40))
    rect(px, W, H, 132, 26, 158, 40, (36, 26, 26))   # janela aberta
    rect(px, W, H, 132, 41, 158, 42, (170, 160, 150))
    # casa amarela
    rect(px, W, H, 172, 18, 250, 54, (238, 214, 140))
    rect(px, W, H, 170, 13, 252, 17, (176, 82, 52))
    rect(px, W, H, 186, 26, 206, 42, (90, 110, 130))
    for x in range(187, 206, 3):
        rect(px, W, H, x, 27, x, 41, (240, 240, 240))
    rect(px, W, H, 222, 30, 236, 54, (130, 80, 50))
    # casa branca com portao
    rect(px, W, H, 250, 20, 319, 54, (226, 226, 232))
    rect(px, W, H, 248, 15, 319, 19, (160, 74, 48))
    rect(px, W, H, 262, 34, 300, 54, (180, 186, 196))
    for x in range(263, 300, 3):
        rect(px, W, H, x, 35, x, 54, (120, 126, 136))
    # calcada e meio-fio
    rect(px, W, H, 0, 55, W - 1, 65, (196, 192, 184))
    for _ in range(90):
        put(px, W, H, rnd.randint(0, W - 1), rnd.randint(55, 65), (170, 166, 158))
    for x in range(0, W, 23):
        put(px, W, H, x + 4, 63, (90, 150, 70)); put(px, W, H, x + 5, 62, (90, 150, 70))
    rect(px, W, H, 0, 66, W - 1, 68, (222, 220, 212))
    rect(px, W, H, 0, 69, W - 1, 69, (150, 146, 140))
    # poste
    rect(px, W, H, 176, 0, 179, 62, (200, 196, 190))
    rect(px, W, H, 179, 0, 179, 62, (160, 156, 150))
    rect(px, W, H, 176, 63, 179, 64, (90, 86, 80))
    for x in range(0, W):
        y = 4 + int(((x - 178) / 160) ** 2 * 3)
        put(px, W, H, x, min(y, 12), (40, 40, 40))
    # rua: bloquete sextavado
    hex_pavers(px, W, H, 0, 70, W - 1, 165, (176, 106, 82), (120, 80, 66))
    rect(px, W, H, 0, 166, W - 1, 166, (150, 146, 140))
    rect(px, W, H, 0, 167, W - 1, 169, (222, 220, 212))
    rect(px, W, H, 0, 170, W - 1, H - 1, (196, 192, 184))
    return img


def chinelo(px, W, H, x, y, col):
    rect(px, W, H, x, y, x + 2, y + 6, col)
    rect(px, W, H, x, y + 6, x + 2, y + 6, dark(col, 0.7))
    put(px, W, H, x + 1, y + 1, (240, 240, 240))
    put(px, W, H, x, y + 2, (240, 240, 240)); put(px, W, H, x + 2, y + 2, (240, 240, 240))


def bola(px, W, H, x, y):
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            if dx * dx + dy * dy <= 5:
                put(px, W, H, x + dx, y + dy, (245, 245, 245))
    put(px, W, H, x - 1, y - 1, (220, 60, 60)); put(px, W, H, x + 1, y + 1, (60, 90, 220))
    put(px, W, H, x + 1, y - 1, (240, 200, 40))
    for dx in range(-2, 3):
        put(px, W, H, x + dx, y + 4, (110, 70, 56))


def gameplay_mock(bg):
    img = bg.copy()
    px = img.load()
    W, H = img.size
    for gx in (10, 306):
        for gy in (92, 136):
            chinelo(px, W, H, gx, gy, (60, 110, 200))
            chinelo(px, W, H, gx + 4, gy, (60, 110, 200))
    bola(px, W, H, 168, 122)
    by_id = {c["id"]: c for c in CHARS}
    pos = [("kaua", 26, 108, 0), ("pernalonga", 150, 98, 1), ("pedro", 110, 128, 2), ("daniel", 90, 88, 0),
           ("gabriel", 284, 108, 0), ("cezar", 182, 112, 2), ("lucas", 218, 132, 1)]
    for cid, x, y, f in pos:
        spr = mini(by_id[cid], f)
        for dx in range(3, 13):  # sombra
            put(px, W, H, x + dx, y + 26, (120, 76, 60))
        img.alpha_composite(spr, (x, y))
    big = up(img, 3)
    d = ImageDraw.Draw(big)
    d.rounded_rectangle((372, 10, 588, 58), 8, fill=(20, 16, 24, 220))
    label(d, (480, 34), "TIME A  1 x 0  TIME B", 22)
    d.rounded_rectangle((12, 470, 470, 528), 8, fill=(20, 16, 24, 220))
    label(d, (241, 499), 'Pernalonga: "Toca a bola, Pedro!"', 20, anchor="mm")
    return big


# =================== CENA FINAL: POR DO SOL ===================
def cena_final():
    W, H = 240, 135
    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    px = img.load()
    stops = [(0, (52, 36, 92)), (30, (120, 52, 112)), (58, (214, 92, 96)), (78, (246, 150, 70)), (92, (255, 206, 110))]
    bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]

    def sky(y):
        for i in range(len(stops) - 1):
            y0, c0 = stops[i]; y1, c1 = stops[i + 1]
            if y0 <= y <= y1:
                return c0, c1, (y - y0) / (y1 - y0)
        return stops[-1][1], stops[-1][1], 0

    for y in range(H):
        c0, c1, t = sky(y)
        for x in range(W):
            # dithering em bandas, estilo 16 bits
            q = round(t * 4) / 4
            thr = bayer[y % 4][x % 4] / 16
            col = c1 if (t * 4 - int(t * 4)) > thr and q < 1 else (mix(c0, c1, int(t * 4) / 4))
            if (t * 4 - int(t * 4)) > thr:
                col = mix(c0, c1, min(1, (int(t * 4) + 1) / 4))
            put(px, W, H, x, y, col)
    # sol
    sx, sy, sr = 196, 86, 13
    for y in range(sy - sr - 6, sy + sr + 6):
        for x in range(sx - sr - 6, sx + sr + 6):
            dd = math.hypot(x - sx, y - sy)
            if dd <= sr:
                put(px, W, H, x, y, (255, 236, 170) if dd < sr - 2 else (255, 214, 120))
            elif dd <= sr + 4 and bayer[y % 4][x % 4] < 6:
                put(px, W, H, x, y, (255, 200, 120))
    # nuvenzinhas
    for (cx_, cy_, ln) in ((40, 22, 30), (150, 34, 40), (100, 14, 22)):
        rect(px, W, H, cx_, cy_, cx_ + ln, cy_ + 1, (236, 140, 140))
        rect(px, W, H, cx_ + 4, cy_ - 1, cx_ + ln - 6, cy_ - 1, (250, 180, 160))
    # silhueta dos telhados ao longe
    sil = (70, 34, 70)
    x = 0
    while x < W:
        wdt = rnd.randint(14, 30)
        top = rnd.randint(78, 88)
        rect(px, W, H, x, top, x + wdt, 100, sil)
        for k in range(wdt // 2):  # telhado em duas aguas
            rect(px, W, H, x + k, top - k // 2, x + wdt - k, top - k // 2, sil)
        if rnd.random() < 0.3:
            rect(px, W, H, x + 4, top - 10, x + 5, top, sil)  # caixa d'agua/antena
            rect(px, W, H, x + 2, top - 12, x + 8, top - 10, sil)
        x += wdt + rnd.randint(0, 3)
    # poste e fios
    rect(px, W, H, 128, 18, 130, 104, (88, 44, 70))
    rect(px, W, H, 124, 22, 134, 23, (88, 44, 70))
    for x in range(W):
        for base, k in ((24, 0.0009), (30, 0.0012)):
            y = base + int(k * (x - 129) ** 2)
            put(px, W, H, x, y, (60, 30, 60))

    warm = lambda x, y, c: mix(c, (255, 150, 90), 0.22)
    # barracao de tijolo baiano (luz quente)
    baiano_wall(px, W, H, 0, 34, 98, 104, tint=warm)
    for x in range(0, 99):
        top = 34 - (4 if (x // 10) % 3 == 1 else 0) - (8 if 40 <= x < 50 else 0)
        for y in range(top, 34):
            put(px, W, H, x, y, warm(x, y, (190, 96, 52)) if (y - top) % 5 != 4 else (170, 130, 110))
    for vx in (3, 30, 58, 96):
        rect(px, W, H, vx, 22, vx, 33, (70, 40, 40))
    rect(px, W, H, 14, 56, 32, 104, (40, 24, 30))     # porta aberta (onde a gente fugia da chuva)
    rect(px, W, H, 15, 57, 17, 104, (70, 40, 44))
    rect(px, W, H, 50, 52, 82, 72, (40, 24, 30))      # janela aberta
    rect(px, W, H, 50, 73, 82, 74, (190, 150, 130))
    # sombra do barracao sobre a calcada
    # calcada
    rect(px, W, H, 0, 105, W - 1, 117, (196, 150, 130))
    for _ in range(60):
        put(px, W, H, rnd.randint(0, W - 1), rnd.randint(105, 117), (176, 130, 112))
    rect(px, W, H, 0, 118, W - 1, 120, (236, 196, 170))   # topo do meio-fio
    rect(px, W, H, 0, 121, W - 1, 123, (186, 140, 120))   # face do meio-fio
    hex_pavers(px, W, H, 0, 124, W - 1, H - 1, (180, 102, 76), (120, 70, 60),
               tint=lambda x, y, c: mix(c, (255, 160, 100), 0.12))
    return img


def rim_light(spr, col=(255, 170, 90), side=1, amt=0.55):
    s = spr.copy()
    p = s.load()
    src = spr.load()
    w, h = s.size
    for y in range(h):
        for x in range(w):
            c = src[x, y]
            if c[3] == 0 or c[:3] == (34, 22, 28):
                continue
            nx = x + side
            n = src[nx, y] if 0 <= nx < w else (0, 0, 0, 0)
            if n[3] == 0 or n[:3] == (34, 22, 28):
                p[x, y] = (*mix(c, col, amt), 255)
            else:
                p[x, y] = (*mix(c, (255, 140, 100), 0.12), 255)
    return s


def cena_com_turma(bg):
    img = bg.copy()
    W, H = img.size
    px = img.load()
    order = ["cezar", "kaua", "pernalonga", "pedro", "lucas", "daniel", "gabriel"]
    by_id = {c["id"]: c for c in CHARS}
    centers = [44 + i * 27 for i in range(7)]
    # sombras longas pra esquerda (sol a direita)
    for cxp in centers:
        for k in range(26):
            for dy in range(2):
                x = cxp - 4 - k
                y = 127 + dy + k // 9
                if 0 <= x < W and y < H:
                    c = px[x, y]
                    px[x, y] = (*dark(c, 0.72), 255)
    for i, cid in enumerate(order):
        spr = detailed(by_id[cid], "sit", with_item=True, seed=i + 3)
        spr = rim_light(spr)
        img.alpha_composite(spr, (centers[i] - 20, 128 - 66 + 0))
    bola(px, W, H, 228, 127)
    return img


if __name__ == "__main__":
    rua = rua_gameplay()
    rua.save(f"{OUT}/cenarios/rua_gameplay_320x180.png")
    gameplay_mock(rua).save(f"{OUT}/preview_gameplay.png")
    fim = cena_final()
    fim.save(f"{OUT}/cenarios/por_do_sol_fundo_240x135.png")
    cena = cena_com_turma(fim)
    cena.save(f"{OUT}/cenarios/cena_final_240x135.png")
    up(cena, 4).save(f"{OUT}/preview_cena_final.png")
    print("ok")
