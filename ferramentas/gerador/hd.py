"""Versao 2: rua cinza, sprites maiores no jogo e close HD animado (480x270)."""
import os, sys, math, random
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw
from sprites import CHARS, detailed, up, label, mix, dark, OUT as OUTLINE
from build_scenes import put, rect, hex_pavers, baiano_wall, chinelo

OUT = "/home/claude/rua_assets_v2"
for d in ("personagens/jogo", "personagens/close_hd", "cenarios", "preview"):
    os.makedirs(f"{OUT}/{d}", exist_ok=True)
EYE = (28, 20, 24)
BY_ID = {c["id"]: c for c in CHARS}

GRAY_PAVER = (150, 150, 146)
GRAY_GROUT = (104, 104, 102)


# ---------- scale2x (EPX): dobra a resolucao arredondando diagonais ----------
def scale2x(img):
    w, h = img.size
    src = img.load()
    out = Image.new("RGBA", (w * 2, h * 2), (0, 0, 0, 0))
    o = out.load()
    g = lambda x, y: src[min(max(x, 0), w - 1), min(max(y, 0), h - 1)]
    for y in range(h):
        for x in range(w):
            P = src[x, y]
            A, B, C, D = g(x, y - 1), g(x + 1, y), g(x - 1, y), g(x, y + 1)
            e0 = A if (C == A and C != D and A != B) else P
            e1 = B if (A == B and A != C and B != D) else P
            e2 = C if (D == C and D != B and C != A) else P
            e3 = D if (B == D and B != A and D != C) else P
            o[2 * x, 2 * y], o[2 * x + 1, 2 * y], o[2 * x, 2 * y + 1], o[2 * x + 1, 2 * y + 1] = e0, e1, e2, e3
    return out


def hd_refine(img, c, rim=None):
    """Detalhes de alta resolucao: olhos com brilho, mechas no cabelo, volume
    (sombra do lado oposto ao sol), luz de borda, contorno fino e colorido."""
    w, h = img.size
    p = img.load()
    hc, hl = c["hair"]
    sk, sks = c["skin"]
    is_out = lambda c_: c_[3] > 0 and c_[:3] == OUTLINE[:3]
    edge = lambda c_: c_[3] == 0 or is_out(c_)
    seen = set()
    for y in range(h):
        for x in range(w):
            if p[x, y][:3] == EYE and p[x, y][3] and (x, y) not in seen:
                blk = [(x + dx, y + dy) for dx in range(2) for dy in range(4)
                       if x + dx < w and y + dy < h and p[x + dx, y + dy][:3] == EYE]
                seen.update(blk)
                for (bx, by) in blk:
                    if by >= y + 2:
                        p[bx, by] = (92, 56, 38, 255)
                p[x, y] = (255, 255, 255, 255)
    # mechas: tracinhos diagonais no cabelo
    for y in range(h):
        for x in range(w):
            if p[x, y][:3] == hc[:3] and (x + y) % 6 == 0 and y + 1 < h and p[x, y + 1][:3] == hc[:3]:
                p[x, y] = (*hl, 255)
    src = img.copy().load()
    for y in range(h):
        for x in range(w):
            c0 = src[x, y]
            if edge(c0):
                continue
            col = c0[:3]
            # volume: lado esquerdo (longe do sol) mais escuro
            if x - 2 >= 0 and (edge(src[x - 1, y]) or edge(src[x - 2, y])):
                col = dark(col, 0.84)
            # sombra da franja/cabelo na testa
            if col == sk[:3] and y - 1 >= 0 and src[x, y - 1][:3] in (hc[:3], hl[:3]):
                col = sks[:3]
            # luz de borda do por do sol (lado direito)
            if rim and x + 1 < w and edge(src[x + 1, y]):
                col = mix(col, rim, 0.55)
            elif rim:
                col = mix(col, (255, 150, 110), 0.07)
            p[x, y] = (*col, 255)
    # contorno fino (1px) e colorido
    src = img.copy().load()
    for y in range(h):
        for x in range(w):
            if not is_out(src[x, y]):
                continue
            neigh = [src[x + dx, y + dy] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
                     if 0 <= x + dx < w and 0 <= y + dy < h]
            colored = [n for n in neigh if n[3] > 0 and not is_out(n)]
            if not colored:
                p[x, y] = (0, 0, 0, 0)
            else:
                p[x, y] = (*mix(dark(colored[0], 0.35), OUTLINE, 0.5), 255)
    return img


def hd_sprite(c, seed, **kw):
    base = detailed(c, "sit", with_item=True, seed=seed, **kw)
    return hd_refine(scale2x(base), c, rim=(255, 176, 96))


# ================== GAMEPLAY 480x270 ==================
def rua_gameplay_v2():
    W, H = 480, 270
    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    px = img.load()
    rnd = random.Random(3)
    for y in range(0, 24):
        rect(px, W, H, 0, y, W - 1, y, mix((120, 180, 235), (196, 224, 246), y / 24))
    # arvore
    rect(px, W, H, 0, 8, 44, 80, (66, 126, 58))
    for _ in range(400):
        x, y = rnd.randint(0, 48), rnd.randint(4, 78)
        put(px, W, H, x, y, rnd.choice([(48, 100, 44), (98, 164, 82), (60, 120, 52), (120, 180, 96)]))
    # muro branco + portao de garagem
    rect(px, W, H, 44, 26, 138, 82, (232, 230, 222))
    rect(px, W, H, 42, 20, 140, 25, (176, 82, 52))
    for x in range(42, 141, 4):
        rect(px, W, H, x, 20, x, 25, (150, 66, 42))
    rect(px, W, H, 56, 38, 104, 82, (246, 246, 242))
    for x in range(57, 104, 4):
        rect(px, W, H, x, 39, x, 81, (206, 206, 202))
    rect(px, W, H, 112, 44, 132, 82, (204, 208, 214))
    for x in range(113, 132, 3):
        rect(px, W, H, x, 45, x, 82, (150, 156, 162))
    # barracao de tijolo baiano em obra
    baiano_wall(px, W, H, 140, 24, 258, 82)
    for x in range(140, 259):
        top = 24 - (5 if (x // 12) % 3 == 1 else 0)
        for y in range(top, 24):
            put(px, W, H, x, y, (190, 96, 52) if (y - top) % 5 != 4 else (150, 140, 128))
    for vx in (143, 180, 220, 255):
        rect(px, W, H, vx, 10, vx, 22, (90, 70, 60))
    rect(px, W, H, 154, 42, 176, 82, (36, 26, 26))
    rect(px, W, H, 155, 43, 158, 82, (60, 44, 40))
    rect(px, W, H, 198, 40, 238, 60, (36, 26, 26))
    rect(px, W, H, 198, 61, 238, 63, (170, 160, 150))
    # casa amarela
    rect(px, W, H, 258, 28, 376, 82, (238, 214, 140))
    rect(px, W, H, 256, 20, 378, 27, (176, 82, 52))
    for x in range(256, 379, 4):
        rect(px, W, H, x, 20, x, 27, (150, 66, 42))
    rect(px, W, H, 278, 40, 310, 64, (90, 110, 130))
    for x in range(279, 310, 4):
        rect(px, W, H, x, 41, x, 63, (240, 240, 240))
    rect(px, W, H, 334, 46, 354, 82, (130, 80, 50))
    put(px, W, H, 350, 64, (230, 200, 90))
    # casa branca com portao
    rect(px, W, H, 376, 30, 479, 82, (226, 226, 232))
    rect(px, W, H, 372, 22, 479, 29, (160, 74, 48))
    rect(px, W, H, 394, 50, 452, 82, (180, 186, 196))
    for x in range(395, 452, 4):
        rect(px, W, H, x, 51, x, 82, (120, 126, 136))
    # calcada, meio-fio
    rect(px, W, H, 0, 83, W - 1, 98, (198, 196, 190))
    for _ in range(220):
        put(px, W, H, rnd.randint(0, W - 1), rnd.randint(83, 98), (176, 174, 168))
    for x in range(0, W, 31):
        put(px, W, H, x + 4, 96, (90, 150, 70)); put(px, W, H, x + 5, 95, (100, 160, 76)); put(px, W, H, x + 6, 96, (90, 150, 70))
    rect(px, W, H, 0, 99, W - 1, 102, (226, 224, 218))
    rect(px, W, H, 0, 103, W - 1, 104, (150, 148, 144))
    # poste
    rect(px, W, H, 264, 0, 269, 94, (204, 200, 194))
    rect(px, W, H, 268, 0, 269, 94, (162, 158, 152))
    rect(px, W, H, 264, 95, 269, 96, (90, 86, 80))
    for x in range(W):
        for base, k in ((5, 0.00012), (11, 0.00016)):
            put(px, W, H, x, min(18, base + int(k * (x - 266) ** 2)), (40, 40, 40))
    # rua: bloquete sextavado CINZA
    hex_pavers(px, W, H, 0, 105, W - 1, 247, GRAY_PAVER, GRAY_GROUT, cw=14, ch=10)
    rect(px, W, H, 0, 248, W - 1, 249, (150, 148, 144))
    rect(px, W, H, 0, 250, W - 1, 253, (226, 224, 218))
    rect(px, W, H, 0, 254, W - 1, H - 1, (198, 196, 190))
    return img


def bola(px, W, H, x, y, r=3):
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy <= r * r + 1:
                put(px, W, H, x + dx, y + dy, (246, 246, 246))
    put(px, W, H, x - 1, y - 1, (220, 60, 60)); put(px, W, H, x + 1, y + 1, (60, 90, 220))
    put(px, W, H, x + 1, y - 2, (240, 200, 40)); put(px, W, H, x - 2, y + 1, (60, 170, 80))
    for dx in range(-r, r + 1):
        put(px, W, H, x + dx, y + r + 3, (100, 100, 98))


def gameplay_sheets():
    for c in CHARS:
        frames = [detailed(c, "stand", seed=3, frame=f) for f in (0, 1, 0, 2)]
        strip = Image.new("RGBA", (40 * 4, 68), (0, 0, 0, 0))
        for k, fr in enumerate(frames):
            strip.paste(fr, (40 * k, 0))
        strip.save(f"{OUT}/personagens/jogo/{c['id']}_corrida_4frames_40x68.png")


def gameplay_mock(bg, frame_set=0):
    img = bg.copy()
    px = img.load()
    W, H = img.size
    for gx in (14, 458):
        for gy in (140, 206):
            chinelo(px, W, H, gx, gy, (60, 110, 200))
            chinelo(px, W, H, gx + 4, gy, (60, 110, 200))
    pos = [("kaua", 20, 150), ("pernalonga", 210, 128), ("pedro", 150, 176), ("daniel", 112, 110),
           ("gabriel", 420, 150), ("cezar", 270, 150), ("lucas", 330, 180)]
    seq = [0, 1, 0, 2]
    for i, (cid, x, y) in enumerate(pos):
        f = seq[(frame_set + i) % 4]
        spr = detailed(BY_ID[cid], "stand", seed=3, frame=f)
        for dx in range(8, 32):
            for dy in range(2):
                xx, yy = x + dx, y + 66 + dy
                if 0 <= xx < W and 0 <= yy < H:
                    c0 = px[xx, yy]
                    px[xx, yy] = (*dark(c0, 0.78), 255)
        img.alpha_composite(spr, (x, y))
    bola(px, W, H, 252 + (frame_set % 4), 192)
    return img


def gameplay_preview(img):
    big = up(img, 2)
    d = ImageDraw.Draw(big)
    d.rounded_rectangle((330, 58, 630, 100), 8, fill=(20, 16, 24, 220))
    label(d, (480, 79), "TIME A  1 x 0  TIME B", 22)
    d.rounded_rectangle((16, 470, 520, 524), 8, fill=(20, 16, 24, 220))
    label(d, (268, 497), 'Pernalonga: "Toca a bola, Pedro!"', 20)
    # barra da radio no topo (mock)
    d.rectangle((0, 0, 960, 44), fill=(18, 16, 22, 235))
    d.rounded_rectangle((10, 6, 70, 38), 6, fill=(230, 60, 40))
    label(d, (40, 22), "JBL", 16)
    label(d, (90, 22), "JBL do Lucas  |  tocando: (titulo vem do YouTube)", 16, anchor="lm")
    label(d, (880, 22), "<<   >   >>", 18)
    return big


# ================== CENA FINAL HD 480x270 ==================
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def cena_hd_bg(t=0):
    """t = frame da animacao (nuvens, passaros, brilho do sol)."""
    W, H = 480, 270
    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    px = img.load()
    rnd = random.Random(11)
    stops = [(0, (44, 30, 84)), (50, (98, 46, 110)), (100, (190, 76, 104)), (140, (240, 128, 76)),
             (170, (255, 186, 98)), (190, (255, 222, 140))]
    for y in range(H):
        for i in range(len(stops) - 1):
            y0, c0 = stops[i]; y1, c1 = stops[i + 1]
            if y0 <= y <= y1:
                break
        tt = (y - y0) / max(1, (y1 - y0))
        lv = tt * 6
        for x in range(W):
            k = int(lv) + (1 if (lv - int(lv)) > BAYER[y % 4][x % 4] / 16 else 0)
            put(px, W, H, x, y, mix(c0, c1, min(1, k / 6)))
    # sol com brilho pulsando
    sx, sy, sr = 384, 172, 26
    glow = 8 + (t % 8 < 4) * 2
    for y in range(sy - sr - 14, sy + sr + 14):
        for x in range(sx - sr - 14, sx + sr + 14):
            dd = math.hypot(x - sx, y - sy)
            if dd <= sr - 4:
                put(px, W, H, x, y, (255, 242, 190))
            elif dd <= sr:
                put(px, W, H, x, y, (255, 220, 130))
            elif dd <= sr + glow and BAYER[y % 4][x % 4] < (10 - (dd - sr)):
                put(px, W, H, x, y, (255, 206, 124))
    # nuvens (andam devagar)
    for (cx_, cy_, ln, sp) in ((60, 40, 70, 1), (260, 64, 90, 1), (180, 24, 50, 1), (400, 96, 60, 1)):
        x0 = int((cx_ + t * sp * 0.5) % (W + 120)) - 60
        rect(px, W, H, x0, cy_, x0 + ln, cy_ + 2, (232, 128, 132))
        rect(px, W, H, x0 + 8, cy_ - 2, x0 + ln - 12, cy_ - 1, (250, 176, 156))
        rect(px, W, H, x0 + 14, cy_ - 3, x0 + ln - 26, cy_ - 3, (255, 206, 176))
        rect(px, W, H, x0 + 4, cy_ + 3, x0 + ln - 4, cy_ + 3, (196, 96, 120))
    # passaros (atravessam o ceu)
    for k, (bx0, by0) in enumerate(((0, 70), (30, 60), (60, 78))):
        bx = int((bx0 + t * 3) % (W + 60)) - 30
        by = by0 + int(2 * math.sin((t + k * 3) / 2))
        wing = (t + k) % 4 < 2
        for dx in (-3, -2, -1, 1, 2, 3):
            put(px, W, H, bx + dx, by - (abs(dx) - 1 if wing else 1 - abs(dx) // 2), (50, 26, 50))
        put(px, W, H, bx, by, (50, 26, 50))
    # silhueta dos telhados
    sil, sil2 = (70, 32, 70), (92, 42, 82)
    x = 0
    while x < W:
        wdt = rnd.randint(26, 54)
        top = rnd.randint(156, 174)
        rect(px, W, H, x, top, x + wdt, 210, sil)
        for k in range(wdt // 2):
            rect(px, W, H, x + k, top - k // 2, x + wdt - k, top - k // 2, sil)
        rect(px, W, H, x + 2, top + 8, x + 2, 210, sil2)
        if rnd.random() < 0.35:
            rect(px, W, H, x + 8, top - 20, x + 10, top, sil)
            rect(px, W, H, x + 4, top - 26, x + 16, top - 20, sil)
        if rnd.random() < 0.4:
            rect(px, W, H, x + wdt // 2, top - wdt // 4 - 10, x + wdt // 2, top - wdt // 4, sil)
        x += wdt + rnd.randint(0, 6)
    # poste e fios
    rect(px, W, H, 254, 36, 259, 214, (84, 40, 68))
    rect(px, W, H, 246, 44, 268, 47, (84, 40, 68))
    for x in range(W):
        for base, k in ((48, 0.00022), (60, 0.00030)):
            put(px, W, H, x, base + int(k * (x - 256) ** 2), (56, 28, 56))

    warm = lambda x, y, c: mix(c, (255, 150, 90), 0.20)
    # barracao de tijolo baiano
    baiano_wall(px, W, H, 0, 70, 196, 212, brick=(192, 98, 54), tint=warm)
    for x in range(0, 197):
        top = 70 - (8 if (x // 20) % 3 == 1 else 0) - (14 if 80 <= x < 100 else 0)
        for y in range(top, 70):
            put(px, W, H, x, y, warm(x, y, (192, 98, 54)) if (y - top) % 5 != 4 else (176, 132, 112))
    for vx in (6, 60, 116, 192):
        rect(px, W, H, vx, 44, vx + 1, 68, (70, 40, 40))
    rect(px, W, H, 28, 112, 66, 212, (38, 22, 30))
    rect(px, W, H, 29, 113, 34, 212, (66, 38, 44))
    rect(px, W, H, 100, 104, 164, 146, (38, 22, 30))
    rect(px, W, H, 100, 147, 164, 150, (196, 154, 134))
    # luz do sol entrando de lado no barracao
    for y in range(70, 212):
        for x in range(176, 197):
            c0 = px[x, y]
            px[x, y] = (*mix(c0, (255, 190, 120), 0.18 * (x - 176) / 20), 255)
    # calcada e meio-fio
    rect(px, W, H, 0, 212, W - 1, 232, (182, 172, 168))
    for _ in range(260):
        put(px, W, H, rnd.randint(0, W - 1), rnd.randint(212, 232), (162, 152, 148))
    rect(px, W, H, 0, 233, W - 1, 236, (232, 214, 200))
    rect(px, W, H, 0, 237, W - 1, 242, (170, 156, 150))
    hex_pavers(px, W, H, 0, 243, W - 1, H - 1, GRAY_PAVER, GRAY_GROUT, cw=16, ch=11,
               tint=lambda x, y, c: mix(c, (255, 160, 110), 0.14))
    return img


ORDER = ["cezar", "kaua", "pernalonga", "pedro", "lucas", "daniel", "gabriel"]
CENTERS = [96 + i * 50 for i in range(7)]


def cena_hd_frame(t, sprite_cache):
    img = cena_hd_bg(t)
    W, H = img.size
    px = img.load()
    for cxp in CENTERS:  # sombras longas para a esquerda
        for k in range(46):
            for dy in range(3):
                x, y = cxp - 8 - k, 252 + dy + k // 12
                if 0 <= x < W and y < H:
                    px[x, y] = (*dark(px[x, y], 0.74), 255)
    for i, cid in enumerate(ORDER):
        c = BY_ID[cid]
        blink = (t + i * 5) % 24 in (0, 1)
        talk = cid in ("lucas", "cezar", "pedro") and (t // 3 + i) % 4 == 0
        bob = 1 if ((t + i * 2) // 4) % 2 else 0
        key = (cid, blink, talk)
        if key not in sprite_cache:
            sprite_cache[key] = hd_sprite(c, seed=ORDER.index(cid) + 3, blink=blink, talk=talk)
        spr = sprite_cache[key]
        # respiracao: o tronco sobe 1px (corta a imagem na altura do quadril)
        top = spr.crop((0, 0, 80, 100))
        bot = spr.crop((0, 100, 80, 136))
        img.alpha_composite(bot, (CENTERS[i] - 40, 258 - 132 + 100))
        img.alpha_composite(top, (CENTERS[i] - 40, 258 - 132 - bob))
        if bob:
            img.alpha_composite(spr.crop((0, 99, 80, 100)), (CENTERS[i] - 40, 258 - 132 + 99))
    bola(px, W, H, 456, 254, r=5)
    return img


def build():
    gameplay_sheets()
    rua = rua_gameplay_v2()
    rua.save(f"{OUT}/cenarios/rua_gameplay_480x270.png")
    frames = [gameplay_preview(gameplay_mock(rua, f)) for f in range(4)]
    frames[0].save(f"{OUT}/preview/preview_gameplay.png")
    frames[0].save(f"{OUT}/preview/preview_gameplay_corrida.gif", save_all=True,
                   append_images=frames[1:] * 3, duration=140, loop=0)
    cena_hd_bg(0).save(f"{OUT}/cenarios/por_do_sol_fundo_480x270.png")

    # spritesheets do close (para o jogo animar): normal, piscando, falando
    for i, cid in enumerate(ORDER):
        c = BY_ID[cid]
        fr = [hd_sprite(c, seed=i + 3), hd_sprite(c, seed=i + 3, blink=True), hd_sprite(c, seed=i + 3, talk=True)]
        strip = Image.new("RGBA", (80 * 3, 136), (0, 0, 0, 0))
        for k, f in enumerate(fr):
            strip.paste(f, (80 * k, 0))
        strip.save(f"{OUT}/personagens/close_hd/{cid}_close_3frames_80x136.png")

    cache = {}
    loop = [cena_hd_frame(t, cache) for t in range(48)]
    loop[0].save(f"{OUT}/cenarios/cena_final_hd_480x270.png")
    up(loop[0], 2).save(f"{OUT}/preview/preview_cena_final_hd.png")
    # GIF: abre na cena aberta e aproxima ("close"), depois fica no loop animado
    seq = []
    for k in range(18):
        z = 1 + 0.3 * (1 - math.cos(math.pi * k / 17)) / 2
        cw, ch = int(480 / z), int(270 / z)
        cxp, cyp = 240 + int((246 - 240) * (z - 1) / 0.3), 135 + int((200 - 135) * (z - 1) / 0.3)
        box = (max(0, cxp - cw // 2), max(0, min(270 - ch, cyp - ch // 2)))
        crop = loop[k % 48].crop((box[0], box[1], box[0] + cw, box[1] + ch))
        seq.append(crop.resize((960, 540), Image.NEAREST))
    z = 1.3
    cw, ch = int(480 / z), int(270 / z)
    box = (246 - cw // 2, 270 - ch)
    for t in range(48):
        seq.append(loop[t].crop((box[0], box[1], box[0] + cw, box[1] + ch)).resize((960, 540), Image.NEAREST))
    for t in range(48):
        seq.append(up(loop[t], 2))
    seq[0].save(f"{OUT}/preview/cena_final_animada.gif", save_all=True, append_images=seq[1:],
                duration=110, loop=0, optimize=True)
    # tela da turma (close) para conferir
    sheet = Image.new("RGBA", (7 * 80 * 3 + 40, 136 * 3 + 120), (46, 38, 58, 255))
    d = ImageDraw.Draw(sheet)
    label(d, (sheet.width // 2, 34), "CLOSE HD - versao com mais pixels para a cena final", 28)
    for i, cid in enumerate(ORDER):
        spr = hd_sprite(BY_ID[cid], seed=i + 3)
        sheet.alpha_composite(up(spr, 3), (20 + i * 240, 70))
        label(d, (20 + i * 240 + 120, 70 + 136 * 3 + 20), BY_ID[cid]["nome"], 22)
    sheet.save(f"{OUT}/preview/preview_close_hd.png")
    print("ok")


if __name__ == "__main__":
    build()
