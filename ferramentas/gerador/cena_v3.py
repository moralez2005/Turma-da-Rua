"""Cena final v3: composicao mais solta (uns sentados, um em pe, olhando uns pros outros),
garrafas e salgadinho espalhados no chao, ceu dourado de fim de tarde."""
import os, sys, math, random
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw
from sprites import CHARS, detailed, up, label, mix, dark
from build_scenes import put, rect, hex_pavers, baiano_wall
from hd import scale2x, hd_refine, bola, BAYER, GRAY_PAVER, GRAY_GROUT, BY_ID

OUT = "/home/claude/rua_assets_v2"

# id, pose, centro x, base y, olhar, item
LAYOUT = [
    ("cezar", "sit", 74, 258, 1, "salgadinho"),
    ("kaua", "sit", 128, 258, 0, "copo"),
    ("pedro", "sit", 186, 258, 1, "copo"),
    ("pernalonga", "stand", 244, 236, -1, "refri"),
    ("lucas", "sit", 302, 258, -1, "salgadinho"),
    ("daniel", "sit", 358, 258, 0, "celular"),
    ("gabriel", "sit", 412, 258, -1, "copo"),
]


def hd(c, pose, seed, **kw):
    base = detailed(c, pose, with_item=True, seed=seed, **kw)
    return hd_refine(scale2x(base), c, rim=(255, 186, 104))


def bg(t=0):
    W, H = 480, 270
    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    px = img.load()
    rnd = random.Random(21)
    stops = [(0, (176, 84, 92)), (60, (226, 122, 74)), (120, (246, 160, 74)), (170, (255, 196, 100)),
             (200, (255, 222, 140))]
    for y in range(H):
        for i in range(len(stops) - 1):
            y0, c0 = stops[i]; y1, c1 = stops[i + 1]
            if y0 <= y <= y1:
                break
        lv = (y - y0) / max(1, (y1 - y0)) * 6
        for x in range(W):
            k = int(lv) + (1 if (lv - int(lv)) > BAYER[y % 4][x % 4] / 16 else 0)
            put(px, W, H, x, y, mix(c0, c1, min(1, k / 6)))
    # sol
    sx, sy, sr = 300, 176, 24
    glow = 9 + (t % 8 < 4) * 2
    for y in range(sy - sr - 14, sy + sr + 14):
        for x in range(sx - sr - 14, sx + sr + 14):
            dd = math.hypot(x - sx, y - sy)
            if dd <= sr - 4:
                put(px, W, H, x, y, (255, 246, 206))
            elif dd <= sr:
                put(px, W, H, x, y, (255, 228, 150))
            elif dd <= sr + glow and BAYER[y % 4][x % 4] < (10 - (dd - sr)):
                put(px, W, H, x, y, (255, 214, 140))
    # nuvens
    for (cx_, cy_, ln) in ((40, 36, 80), (250, 58, 100), (170, 20, 56), (390, 92, 64)):
        x0 = int((cx_ + t * 0.5) % (W + 120)) - 60
        rect(px, W, H, x0, cy_, x0 + ln, cy_ + 2, (240, 150, 110))
        rect(px, W, H, x0 + 8, cy_ - 2, x0 + ln - 12, cy_ - 1, (255, 196, 150))
        rect(px, W, H, x0 + 14, cy_ - 3, x0 + ln - 26, cy_ - 3, (255, 222, 180))
        rect(px, W, H, x0 + 4, cy_ + 3, x0 + ln - 4, cy_ + 3, (214, 110, 100))
    # passaros
    for k, (bx0, by0) in enumerate(((0, 74), (30, 64), (60, 82))):
        bx = int((bx0 + t * 3) % (W + 60)) - 30
        by = by0 + int(2 * math.sin((t + k * 3) / 2))
        wing = (t + k) % 4 < 2
        for dx in (-3, -2, -1, 1, 2, 3):
            put(px, W, H, bx + dx, by - (abs(dx) - 1 if wing else 1 - abs(dx) // 2), (90, 40, 40))
        put(px, W, H, bx, by, (90, 40, 40))
    # casas e arvores ao fundo (contraluz quente), com janelas acesas
    sil, sil2, leaf = (112, 52, 52), (132, 64, 58), (96, 58, 44)
    x = 196
    while x < W:
        if rnd.random() < 0.3:  # arvore
            r = rnd.randint(14, 22)
            cyy = rnd.randint(150, 160)
            for yy in range(cyy - r, cyy + r):
                for xx in range(x, x + 2 * r):
                    if (xx - x - r) ** 2 + (yy - cyy) ** 2 * 1.3 <= r * r:
                        put(px, W, H, xx, yy, leaf if (xx - x) < r * 1.3 or BAYER[yy % 4][xx % 4] > 6 else (150, 84, 56))
            rect(px, W, H, x + r - 1, cyy, x + r + 1, 212, leaf)
            x += 2 * r
            continue
        wdt = rnd.randint(30, 56)
        top = rnd.randint(158, 174)
        rect(px, W, H, x, top, x + wdt, 212, sil)
        for k in range(wdt // 2):
            rect(px, W, H, x + k, top - k // 2, x + wdt - k, top - k // 2, sil)
        rect(px, W, H, x + 2, top + 6, x + 2, 212, sil2)
        if rnd.random() < 0.6:
            wx = x + rnd.randint(6, max(7, wdt - 12))
            rect(px, W, H, wx, top + 14, wx + 5, top + 19, (255, 214, 130))
            rect(px, W, H, wx + 2, top + 14, wx + 2, top + 19, sil)
        if rnd.random() < 0.3:
            rect(px, W, H, x + 8, top - 20, x + 10, top, sil)
            rect(px, W, H, x + 4, top - 26, x + 16, top - 20, sil)
        x += wdt + rnd.randint(2, 8)
    # poste e fios
    rect(px, W, H, 218, 40, 223, 214, (110, 50, 50))
    rect(px, W, H, 210, 48, 232, 51, (110, 50, 50))
    for x in range(W):
        for base, k in ((52, 0.00022), (64, 0.00030)):
            put(px, W, H, x, base + int(k * (x - 220) ** 2), (96, 44, 44))
    warm = lambda x, y, c: mix(c, (255, 160, 90), 0.20)
    # barracao de tijolo baiano
    baiano_wall(px, W, H, 0, 70, 186, 212, brick=(192, 98, 54), tint=warm)
    for x in range(0, 187):
        top = 70 - (8 if (x // 20) % 3 == 1 else 0) - (14 if 80 <= x < 100 else 0)
        for y in range(top, 70):
            put(px, W, H, x, y, warm(x, y, (192, 98, 54)) if (y - top) % 5 != 4 else (176, 132, 112))
    for vx in (6, 60, 116, 182):
        rect(px, W, H, vx, 44, vx + 1, 68, (80, 40, 40))
    rect(px, W, H, 22, 112, 58, 212, (44, 24, 30))
    rect(px, W, H, 23, 113, 28, 212, (70, 40, 44))
    rect(px, W, H, 94, 104, 156, 146, (44, 24, 30))
    rect(px, W, H, 94, 147, 156, 150, (200, 160, 136))
    for y in range(70, 212):
        for x in range(166, 187):
            px[x, y] = (*mix(px[x, y], (255, 196, 120), 0.2 * (x - 166) / 20), 255)
    # calcada, meio-fio, rua (bloquete cinza)
    rect(px, W, H, 0, 212, W - 1, 232, (188, 172, 160))
    for _ in range(260):
        put(px, W, H, rnd.randint(0, W - 1), rnd.randint(212, 232), (168, 152, 142))
    for x in range(8, W, 37):  # matinho na calcada
        for (dx, dy) in ((0, 0), (1, -1), (2, 0), (-1, -1)):
            put(px, W, H, x + dx, 230 + dy, (110, 130, 60))
    rect(px, W, H, 0, 233, W - 1, 236, (236, 214, 194))
    rect(px, W, H, 0, 237, W - 1, 242, (172, 150, 140))
    hex_pavers(px, W, H, 0, 243, W - 1, H - 1, GRAY_PAVER, GRAY_GROUT, cw=16, ch=11,
               tint=lambda x, y, c: mix(c, (255, 170, 110), 0.16))
    return img


def pet(px, W, H, x, y, lying=False):
    """Garrafa PET de 2L generica (sem marca). (x, y) = base."""
    body, hi, lab = (60, 150, 86), (150, 220, 160), (220, 70, 50)
    if not lying:
        rect(px, W, H, x - 3, y - 18, x + 3, y, body)
        rect(px, W, H, x - 2, y - 22, x + 2, y - 19, body)
        rect(px, W, H, x - 1, y - 25, x + 1, y - 23, body)
        rect(px, W, H, x - 1, y - 27, x + 1, y - 26, (220, 40, 40))
        rect(px, W, H, x - 3, y - 12, x + 3, y - 8, lab)
        rect(px, W, H, x - 3, y - 10, x + 3, y - 10, (250, 240, 220))
        rect(px, W, H, x - 2, y - 17, x - 2, y - 13, hi)
        rect(px, W, H, x - 3, y + 1, x + 4, y + 1, (110, 100, 100))
    else:
        rect(px, W, H, x, y - 6, x + 18, y, body)
        rect(px, W, H, x + 19, y - 5, x + 22, y - 1, body)
        rect(px, W, H, x + 23, y - 4, x + 25, y - 2, body)
        rect(px, W, H, x + 8, y - 6, x + 12, y, lab)
        rect(px, W, H, x + 2, y - 5, x + 6, y - 5, hi)
        for k in range(14):  # refri derramado
            for dy in range(3):
                if BAYER[(y + dy) % 4][(x + 26 + k) % 4] < 12 - k // 2:
                    put(px, W, H, x + 26 + k, y - 1 + dy, (120, 60, 30))


def garrafa_vidro(px, W, H, x, y):
    glass, hi = (120, 60, 30), (190, 120, 70)
    rect(px, W, H, x - 2, y - 13, x + 2, y, glass)
    rect(px, W, H, x - 1, y - 18, x + 1, y - 14, glass)
    rect(px, W, H, x - 1, y - 19, x + 1, y - 19, (220, 200, 60))
    rect(px, W, H, x - 2, y - 8, x + 2, y - 5, (240, 230, 200))
    rect(px, W, H, x - 1, y - 12, x - 1, y - 9, hi)
    rect(px, W, H, x - 2, y + 1, x + 3, y + 1, (110, 100, 100))


def saco_salgadinho(px, W, H, x, y):
    rect(px, W, H, x, y - 10, x + 11, y, (250, 190, 40))
    rect(px, W, H, x, y - 6, x + 11, y - 5, (220, 50, 40))
    rect(px, W, H, x + 1, y - 11, x + 10, y - 11, (200, 150, 30))
    for (dx, dy) in ((13, 0), (15, -1), (17, 0), (14, -2)):
        put(px, W, H, x + dx, y + dy, (240, 150, 40))


def copo(px, W, H, x, y):
    rect(px, W, H, x, y - 6, x + 4, y, (240, 240, 244))
    rect(px, W, H, x, y - 6, x + 4, y - 6, (200, 200, 210))
    rect(px, W, H, x + 1, y - 5, x + 3, y - 3, (110, 50, 26))


def frame(t, cache):
    img = bg(t)
    W, H = img.size
    px = img.load()
    for (_, pose, cxp, by, _, _) in LAYOUT:  # sombras longas para a esquerda
        for k in range(50):
            for dy in range(3):
                x, y = cxp - 8 - k, by - 4 + dy + k // 12
                if 0 <= x < W and y < H and (y >= 243 or pose == 'stand'):
                    px[x, y] = (*dark(px[x, y], 0.74), 255)
    # objetos no chao
    pet(px, W, H, 18, 262, lying=True)
    pet(px, W, H, 152, 264)
    copo(px, W, H, 210, 266)
    garrafa_vidro(px, W, H, 274, 264)
    pet(px, W, H, 330, 265)
    saco_salgadinho(px, W, H, 378, 238)
    garrafa_vidro(px, W, H, 446, 262)
    bola(px, W, H, 466, 254, r=5)
    order = sorted(range(len(LAYOUT)), key=lambda j: LAYOUT[j][3])
    for i in order:
        cid, pose, cxp, by, look, item = LAYOUT[i]
        c = BY_ID[cid]
        blink = (t + i * 5) % 24 in (0, 1)
        talk = cid in ("lucas", "cezar", "pedro", "pernalonga") and (t // 3 + i) % 5 == 0
        lk = 0 if (cid == "daniel" and (t // 12) % 2) else look
        key = (cid, blink, talk, lk)
        if key not in cache:
            cache[key] = hd(c, pose, seed=i + 3, blink=blink, talk=talk, look=lk, item=item)
        spr = cache[key]
        bob = 1 if ((t + i * 2) // 4) % 2 else 0
        x0, y0 = cxp - 40, by - 132
        cut = 100 if pose == "sit" else 70
        img.alpha_composite(spr.crop((0, cut, 80, 136)), (x0, y0 + cut))
        img.alpha_composite(spr.crop((0, 0, 80, cut)), (x0, y0 - bob))
        if bob:
            img.alpha_composite(spr.crop((0, cut - 1, 80, cut)), (x0, y0 + cut - 1))
    return img


def build():
    cache = {}
    loop = [frame(t, cache) for t in range(48)]
    loop[0].save(f"{OUT}/cenarios/cena_final_hd_480x270.png")
    bg(0).save(f"{OUT}/cenarios/por_do_sol_fundo_480x270.png")
    up(loop[0], 2).save(f"{OUT}/preview/preview_cena_final_hd.png")
    seq = []
    for k in range(18):
        z = 1 + 0.3 * (1 - math.cos(math.pi * k / 17)) / 2
        cw, ch = int(480 / z), int(270 / z)
        cxp, cyp = 240 + int((244 - 240) * (z - 1) / 0.3), 135 + int((190 - 135) * (z - 1) / 0.3)
        bx = max(0, min(480 - cw, cxp - cw // 2)); byy = max(0, min(270 - ch, cyp - ch // 2))
        seq.append(loop[k].crop((bx, byy, bx + cw, byy + ch)).resize((960, 540), Image.NEAREST))
    cw, ch = int(480 / 1.3), int(270 / 1.3)
    bx = 244 - cw // 2
    for t in range(48):
        seq.append(loop[t].crop((bx, 270 - ch, bx + cw, 270)).resize((960, 540), Image.NEAREST))
    for t in range(48):
        seq.append(up(loop[t], 2))
    seq[0].save(f"{OUT}/preview/cena_final_animada.gif", save_all=True, append_images=seq[1:],
                duration=110, loop=0, optimize=True)
    # spritesheets do close na pose da cena (normal, piscando, falando)
    import glob
    for f in glob.glob(f"{OUT}/personagens/close_hd/*.png"):
        os.remove(f)
    for i, (cid, pose, _, _, look, item) in enumerate(LAYOUT):
        c = BY_ID[cid]
        fr = [hd(c, pose, i + 3, look=look, item=item), hd(c, pose, i + 3, blink=True, look=look, item=item),
              hd(c, pose, i + 3, talk=True, look=look, item=item)]
        strip = Image.new("RGBA", (240, 136), (0, 0, 0, 0))
        for k, f in enumerate(fr):
            strip.paste(f, (80 * k, 0))
        strip.save(f"{OUT}/personagens/close_hd/{cid}_{'sentado' if pose == 'sit' else 'em_pe'}_close_3frames_80x136.png")
    print("ok")


if __name__ == "__main__":
    build()
