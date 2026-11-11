"""Primeiro mapa do esconde-esconde (1920x1080) e os desenhos dos objetos.
O mapa atual é gerado por esconde_mapa_real.py, que usa os objetos daqui. Rodar este arquivo sozinho volta pro mapa antigo."""
import os, json, math, random
import numpy as np
from PIL import Image
from bg960 import (Pic, sky, cloud, tree_back, roof, wall, window, door, gate, baiano, poste, wires,
                   sidewalk, curb, pavers, plant_pot, mix, dark, BAYER)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "esconde")
os.makedirs(OUT, exist_ok=True)
rnd = random.Random(9)
W, H = 1920, 1080


def grass(p, x0, y0, x1, y1, base=(116, 156, 80)):
    p.rect(x0, y0, x1, y1, base)
    p.noise(x0, y0, x1, y1, 0.1)
    for _ in range((x1 - x0) * (y1 - y0) // 90):
        x, y = rnd.randint(x0, x1), rnd.randint(y0, y1)
        p.px(x, y, mix(base, (210, 230, 150), 0.4))
        p.px(x, y + 1, dark(base, 0.75))


def dirt(p, x0, y0, x1, y1):
    p.rect(x0, y0, x1, y1, (150, 120, 84))
    p.noise(x0, y0, x1, y1, 0.12)
    for _ in range((x1 - x0) * (y1 - y0) // 400):
        x, y = rnd.randint(x0, x1), rnd.randint(y0, y1)
        p.rect(x, y, x + 2, y + 1, (120, 96, 66))


def cement(p, x0, y0, x1, y1):
    p.rect(x0, y0, x1, y1, (184, 180, 172))
    p.noise(x0, y0, x1, y1, 0.04)
    for x in range(x0, x1, 60):
        p.rect(x, y0, x, y1, (160, 156, 150))
    for y in range(y0, y1, 60):
        p.rect(x0, y, x1, y, (160, 156, 150))


def low_wall(p, x0, y0, x1, y1, c=(214, 208, 198)):
    p.rect(x0, y0, x1, y1, c)
    p.noise(x0, y0, x1, y1, 0.03)
    p.rect(x0, y0, x1, y0 + 2, mix(c, (255, 255, 255), 0.3))
    p.rect(x0, y1 - 2, x1, y1, dark(c, 0.75))


SOLIDS = []      # retângulos sólidos (x, y, w, h)


def solid(x, y, w, h):
    SOLIDS.append([int(x), int(y), int(w), int(h)])


def ground():
    p = Pic(W, H)
    sky(p, 0, 70, [(0, (120, 176, 234)), (1, (196, 224, 246))])
    for cx, cy, w in ((200, 24, 120), (760, 30, 160), (1300, 20, 130), (1780, 34, 110)):
        cloud(p, cx, cy, w)
    tree_back(p, 0, 1920, 64, (104, 150, 98))
    # ---- fileira de cima ----
    # casa do Kauã: sem portão, uma entrada de meio tijolo com escadinha descendo pro quintal (e a torneira!)
    wall(p, 0, 92, 240, 300, (226, 214, 190)); roof(p, 0, 240, 72)
    window(p, 24, 160, 40, 34); window(p, 186, 160, 40, 34)
    baiano(p, 80, 220, 96, 300); baiano(p, 154, 220, 170, 300)
    p.rect(96, 200, 154, 300, (70, 56, 50))
    for k, y in enumerate(range(236, 300, 12)):
        p.rect(96, y, 154, y + 3, (150, 140, 128)); p.rect(96, y + 4, 154, y + 11, (104, 92, 84))
    p.rect(140, 212, 146, 216, (170, 170, 176)); p.rect(142, 216, 144, 222, (170, 170, 176))   # torneira
    solid(0, 60, 96, 240); solid(154, 60, 86, 240); solid(96, 60, 58, 160)   # entrada aberta até y 220
    baiano(p, 240, 84, 520, 300)
    for x in range(240, 521):
        top = 84 - (10 if (x // 30) % 3 == 1 else 0)
        if top < 84:
            p.rect(x, top, x, 83, (194, 100, 54))
    for vx in (244, 330, 420, 516):
        p.rect(vx, 50, vx + 1, 82, (92, 70, 60))
    p.rect(290, 196, 352, 300, (30, 20, 24)); p.rect(292, 198, 300, 300, (54, 38, 38))
    p.rect(400, 170, 500, 230, (30, 20, 24)); p.rect(400, 231, 500, 234, (176, 166, 156))
    solid(240, 60, 50, 240); solid(352, 60, 168, 240); solid(290, 60, 62, 150)   # porta aberta: entra até y 210
    # beco
    p.rect(520, 60, 600, 300, (92, 88, 84)); p.noise(520, 60, 600, 300, 0.1)
    for y in range(60, 300, 14):
        p.rect(520, y, 600, y, (80, 76, 72))
    p.rect(520, 60, 524, 300, (60, 56, 56)); p.rect(596, 60, 600, 300, (60, 56, 56))
    grass(p, 528, 66, 592, 120, (108, 140, 70))
    solid(520, 40, 80, 26)
    # casa amarela
    wall(p, 600, 96, 860, 300, (240, 214, 138)); roof(p, 600, 860, 76)
    window(p, 622, 170); window(p, 790, 170)
    gate(p, 664, 222, 64, 78, (124, 78, 46), 6); gate(p, 732, 222, 64, 78, (124, 78, 46), 6)   # portões marrons do Cezar
    solid(600, 60, 260, 240)
    # casa verde-água com muro e portão
    wall(p, 860, 100, 1120, 300, (150, 208, 192)); roof(p, 860, 1120, 80, c=(160, 74, 48))
    window(p, 886, 170); window(p, 1050, 170)
    p.rect(860, 240, 1120, 300, (206, 204, 198)); p.noise(860, 240, 1120, 300, 0.03)
    # portão de madeira do Pedro
    p.rect(950, 226, 1036, 300, (120, 78, 44))
    for gx in range(950, 1036, 12):
        p.rect(gx, 226, gx + 1, 300, (88, 56, 32)); p.rect(gx + 3, 226, gx + 3, 300, (156, 108, 66))
    p.rect(950, 248, 1036, 251, (88, 56, 32)); p.rect(950, 280, 1036, 283, (88, 56, 32))
    solid(860, 60, 260, 240)
    # casa rosa de 2 andares (Dona Tita)
    wall(p, 1120, 70, 1360, 300, (232, 160, 168)); roof(p, 1120, 1360, 50, c=(150, 70, 50))
    window(p, 1146, 100); window(p, 1290, 100); window(p, 1146, 200); door(p, 1272, 230, 36, 70)
    p.rect(1130, 150, 1350, 156, (210, 210, 206))
    solid(1120, 40, 240, 260)
    # casa lilás da Dona Vera (com varandinha)
    wall(p, 1360, 96, 1660, 300, (176, 146, 214)); roof(p, 1360, 1660, 76)
    window(p, 1392, 160); window(p, 1590, 160); door(p, 1480, 230, 38, 70, (110, 80, 120))
    p.rect(1360, 240, 1660, 300, (206, 200, 210)); p.noise(1360, 240, 1660, 300, 0.03)
    gate(p, 1470, 236, 60, 64, (120, 110, 140), 6)
    solid(1360, 60, 300, 240)
    wall(p, 1660, 96, 1700, 300, (214, 208, 198)); roof(p, 1660, 1700, 76, c=(150, 70, 50)); solid(1660, 60, 40, 240)
    # rua transversal (direita) e lote da esquina
    pavers(p, 1700, 0, 1859, 1079, cw=26, ch=18)
    sidewalk(p, 1860, 0, 1880, 1079)
    grass(p, 1880, 0, 1919, 1079)
    low_wall(p, 1888, 70, 1919, 300); solid(1880, 0, 40, 300)
    # calçadas, meios-fios e rua principal
    sidewalk(p, 0, 300, 1699, 340)
    poste(p, 960, 110, 330)
    wires(p, 0, 1700, 92, 22)
    curb(p, 0, 340, 1699)
    pavers(p, 0, 352, 1699, 640, cw=26, ch=18)
    curb(p, 0, 638, 1699)
    sidewalk(p, 0, 650, 1699, 692, (196, 192, 184))
    # ---- lotes de baixo ----
    dirt(p, 0, 693, 430, 1079)
    grass(p, 20, 760, 200, 900, (118, 150, 70)); grass(p, 230, 940, 420, 1070, (118, 150, 70))
    for x in range(0, 430, 40):                                   # cerquinha com buracos
        if (x // 40) % 3 != 1:
            p.rect(x, 694, x + 3, 712, (140, 110, 80))
    low_wall(p, 430, 693, 446, 1079); solid(430, 693, 16, 180); solid(430, 950, 16, 130)  # vão y 873..950
    grass(p, 446, 693, 920, 1079)
    low_wall(p, 446, 693, 920, 708)
    p.rect(640, 693, 700, 708, (116, 156, 80))                  # abertura do portão
    solid(446, 693, 194, 15); solid(700, 693, 220, 15)
    low_wall(p, 920, 693, 936, 1079, (124, 86, 60)); solid(920, 693, 16, 70); solid(920, 830, 16, 250)  # vão y 763..830
    cement(p, 936, 693, 1699, 1079)
    low_wall(p, 936, 693, 1699, 708, (124, 86, 60)); solid(936, 693, 140, 15); solid(1136, 693, 563, 15)  # portão x 1076..1136
    p.rect(936, 699, 1699, 700, (226, 150, 176))   # faixa rosa no muro marrom (casa do Lucas)
    p.rect(1076, 693, 1136, 708, (184, 180, 172))
    # casa de baixo (vista de cima: telhado)
    p.rect(1052, 782, 1508, 1018, (226, 150, 176))   # paredes rosa aparecendo embaixo do telhado
    p.rect(1060, 790, 1500, 1010, (176, 84, 54))
    for y in range(790, 1010, 8):
        p.rect(1060, y + 6, 1500, y + 7, (150, 66, 42))
    p.rect(1060, 790, 1500, 796, (204, 110, 74)); p.rect(1276, 790, 1284, 1010, (130, 58, 38))
    p.shade(1500, 800, 1520, 1020, 0.8); p.shade(1070, 1010, 1520, 1026, 0.8)
    solid(1060, 760, 440, 250)
    return p.image()


# ---------------- objetos ----------------
def obj_canvas(w, h):
    return Pic(w, h, (255, 0, 255))


def to_rgba(p):
    im = p.image()
    a = np.array(im)
    mask = (a[:, :, 0] == 255) & (a[:, :, 1] == 0) & (a[:, :, 2] == 255)
    a[mask] = (0, 0, 0, 0)
    return Image.fromarray(a, "RGBA")


def outline(im):
    a = np.array(im)
    al = a[:, :, 3] > 0
    sh = np.zeros_like(al)
    sh[1:, :] |= al[:-1, :]; sh[:-1, :] |= al[1:, :]; sh[:, 1:] |= al[:, :-1]; sh[:, :-1] |= al[:, 1:]
    edge = sh & ~al
    a[edge] = (36, 24, 30, 255)
    return Image.fromarray(a, "RGBA")


def shadow(p, cx, cy, rx, ry):
    p.ellipse(cx, cy, rx, ry, (60, 60, 60), dither=0.55)


def mk_carro(color=(236, 236, 240)):
    p = obj_canvas(190, 96)
    shadow(p, 95, 88, 92, 8)
    p.rect(6, 40, 184, 80, color)
    p.rect(40, 12, 146, 42, mix(color, (0, 0, 0), 0.05))
    p.rect(48, 16, 90, 40, (84, 116, 146)); p.rect(96, 16, 138, 40, (84, 116, 146))
    p.tint(48, 16, 70, 24, (220, 240, 255), 0.4)
    p.rect(6, 58, 184, 59, dark(color, 0.8))
    p.rect(180, 46, 184, 54, (250, 220, 120)); p.rect(6, 46, 10, 54, (200, 40, 40))
    for wx in (30, 140):
        p.rect(wx, 70, wx + 28, 92, (30, 30, 34)); p.rect(wx + 8, 76, wx + 20, 86, (150, 150, 156))
    p.rect(100, 50, 112, 52, dark(color, 0.6))
    return outline(to_rgba(p))


def mk_kombi():
    p = obj_canvas(200, 120)
    shadow(p, 100, 112, 96, 8)
    p.rect(8, 20, 192, 104, (226, 228, 220))
    p.rect(8, 20, 192, 62, (70, 130, 170))
    p.rect(8, 60, 192, 64, (240, 240, 236))
    for wx in range(20, 180, 36):
        p.rect(wx, 28, wx + 28, 52, (180, 210, 230))
    p.ellipse(100, 80, 16, 8, (200, 200, 200))
    for wx in (24, 150):
        p.rect(wx, 92, wx + 28, 116, (30, 30, 34)); p.rect(wx + 9, 99, wx + 19, 109, (160, 160, 166))
    return outline(to_rgba(p))


def mk_arbusto():
    p = obj_canvas(110, 70)
    shadow(p, 55, 64, 52, 6)
    p.ellipse(55, 38, 52, 30, (52, 118, 54))
    p.ellipse(40, 30, 30, 20, (70, 140, 64)); p.ellipse(72, 34, 26, 18, (62, 130, 60))
    for _ in range(18):
        p.ellipse(rnd.randint(14, 96), rnd.randint(14, 50), 2, 2, (232, 96, 140))
    return outline(to_rgba(p))


def mk_tambor():
    p = obj_canvas(44, 64)
    shadow(p, 22, 60, 20, 4)
    p.rect(4, 6, 40, 58, (40, 92, 172)); p.ellipse(22, 6, 18, 5, (70, 124, 206))
    for y in (22, 40):
        p.rect(4, y, 40, y + 2, (28, 66, 130))
    p.rect(32, 8, 38, 56, (30, 72, 144))
    return outline(to_rgba(p))


def mk_engradados():
    p = obj_canvas(110, 84)
    shadow(p, 55, 80, 52, 5)
    for (x, y, c) in ((4, 44, (220, 60, 40)), (38, 44, (240, 190, 40)), (72, 44, (220, 60, 40)),
                      (20, 6, (240, 190, 40)), (54, 6, (220, 60, 40))):
        p.rect(x, y, x + 32, y + 36, c)
        p.rect(x + 3, y + 3, x + 29, y + 8, dark(c, 0.55))
        for gx in range(x + 4, x + 30, 7):
            p.rect(gx, y + 12, gx + 4, y + 32, (50, 120, 70))
    return outline(to_rgba(p))


def mk_mesa():
    p = obj_canvas(120, 70)
    shadow(p, 60, 64, 54, 6)
    p.rect(30, 20, 90, 28, (210, 48, 40)); p.rect(34, 28, 38, 64, (170, 36, 30)); p.rect(82, 28, 86, 64, (170, 36, 30))
    for cx in (6, 96):
        p.rect(cx, 14, cx + 18, 30, (210, 48, 40)); p.rect(cx, 30, cx + 3, 64, (170, 36, 30)); p.rect(cx + 15, 30, cx + 18, 64, (170, 36, 30))
    p.rect(52, 10, 58, 20, (40, 140, 70)); p.rect(53, 6, 57, 10, (40, 140, 70))
    return outline(to_rgba(p))


def mk_lixeira():
    p = obj_canvas(40, 60)
    shadow(p, 20, 56, 18, 4)
    p.rect(6, 10, 34, 54, (60, 120, 70)); p.rect(4, 6, 36, 12, (50, 100, 60))
    p.rect(10, 22, 30, 24, (230, 230, 230))
    return outline(to_rgba(p))


def mk_orelhao():
    p = obj_canvas(60, 120)
    shadow(p, 30, 114, 22, 5)
    p.rect(27, 60, 33, 114, (90, 90, 96))
    p.ellipse(30, 40, 26, 32, (240, 170, 40)); p.ellipse(30, 44, 18, 22, (30, 40, 70))
    p.rect(22, 44, 38, 64, (70, 70, 76)); p.rect(24, 48, 36, 52, (200, 220, 120))
    return outline(to_rgba(p))


def mk_mato(w=150, h=100):
    p = obj_canvas(w, h)
    for _ in range(w * 5):
        x = rnd.randint(4, w - 4)
        hh = rnd.randint(int(h * 0.4), h - 4)
        col = rnd.choice([(84, 130, 52), (120, 160, 70), (100, 146, 60), (150, 176, 84), (70, 112, 44)])
        lean = rnd.choice([-1, 0, 1])
        for k in range(hh):
            y = h - 2 - k
            p.px(x + (k * lean) // 6, y, col)
    return outline(to_rgba(p))


def mk_entulho():
    p = obj_canvas(140, 80)
    shadow(p, 70, 74, 66, 6)
    p.ellipse(70, 58, 64, 22, (196, 172, 124)); p.ellipse(64, 44, 44, 18, (186, 160, 112))
    for _ in range(70):
        x, y = rnd.randint(14, 124), rnd.randint(30, 70)
        p.rect(x, y, x + 9, y + 4, rnd.choice([(194, 100, 54), (170, 84, 46), (150, 146, 140), (120, 120, 120)]))
    return outline(to_rgba(p))


def mk_cacamba():
    p = obj_canvas(170, 90)
    shadow(p, 85, 84, 82, 6)
    p.rect(10, 26, 160, 80, (240, 186, 30)); p.rect(0, 20, 170, 30, (220, 166, 20))
    for x in range(20, 160, 20):
        p.rect(x, 30, x + 2, 80, (200, 150, 20))
    for _ in range(30):
        x = rnd.randint(10, 150); p.rect(x, 12 + rnd.randint(0, 8), x + 10, 22, rnd.choice([(150, 146, 140), (194, 100, 54), (110, 80, 50)]))
    return outline(to_rgba(p))


def mk_pneus():
    p = obj_canvas(70, 76)
    shadow(p, 35, 70, 32, 5)
    for k in range(4):
        y = 62 - k * 14
        p.ellipse(35, y, 30, 10, (30, 30, 32)); p.ellipse(35, y - 2, 14, 4, (70, 70, 74))
    return outline(to_rgba(p))


def mk_manga():
    p = obj_canvas(260, 280)
    shadow(p, 130, 268, 110, 12)
    p.rect(120, 150, 140, 268, (110, 74, 48)); p.rect(132, 150, 140, 268, (86, 56, 36))
    p.ellipse(130, 110, 126, 100, (48, 100, 46))
    p.ellipse(104, 86, 90, 70, (62, 124, 56)); p.ellipse(86, 64, 50, 36, (96, 160, 80), dither=0.6)
    for _ in range(40):
        a, r = rnd.random() * 6.28, rnd.random() * 100
        x, y = 130 + math.cos(a) * r, 110 + math.sin(a) * r * 0.8
        p.rect(x, y, x + 3, y + 5, (236, 170, 50))
    return outline(to_rgba(p))


def mk_varal():
    p = obj_canvas(190, 120)
    shadow(p, 95, 114, 90, 5)
    p.rect(4, 10, 8, 114, (140, 110, 80)); p.rect(182, 10, 186, 114, (140, 110, 80))
    for x in range(8, 182):
        p.px(x, 16 + int(6 * math.sin(math.pi * (x - 8) / 174)), (230, 230, 230))
    for (x0, x1, c) in ((20, 70, (250, 250, 250)), (76, 122, (120, 180, 230)), (128, 176, (240, 200, 210))):
        p.rect(x0, 20, x1, 96, c)
        for x in range(x0, x1, 8):
            p.rect(x, 20, x + 1, 96, dark(c, 0.92))
        p.rect(x0, 92, x1, 96, dark(c, 0.85))
    return outline(to_rgba(p))


def mk_casinha():
    p = obj_canvas(84, 76)
    shadow(p, 42, 72, 40, 5)
    p.rect(8, 30, 76, 70, (180, 120, 70))
    for k in range(20):
        p.rect(4 + k * 2, 30 - k, 80 - k * 2, 30 - k, (150, 60, 40))
    p.ellipse(42, 56, 14, 14, (40, 26, 20)); p.rect(28, 56, 56, 70, (40, 26, 20))
    return outline(to_rgba(p))


def mk_bananeira():
    p = obj_canvas(120, 160)
    shadow(p, 60, 154, 30, 5)
    p.rect(54, 70, 66, 154, (120, 150, 70)); p.rect(62, 70, 66, 154, (96, 124, 54))
    for ang in (-150, -110, -70, -30, 10):
        a = math.radians(ang)
        for k in range(60):
            x = 60 + math.cos(a) * k
            y = 70 + math.sin(a) * k * 0.7 + (k * k) / 140
            for w in range(-5, 6):
                p.px(x + w * math.sin(a) * 0.5, y + w * 0.6, (78, 150, 60) if w < 2 else (60, 120, 50))
    return outline(to_rgba(p))


def mk_caixa():
    p = obj_canvas(80, 150)
    shadow(p, 40, 144, 34, 5)
    for x in (12, 64):
        p.rect(x, 60, x + 4, 144, (110, 110, 116))
    p.rect(12, 100, 68, 102, (110, 110, 116))
    p.rect(6, 14, 74, 60, (60, 120, 190)); p.ellipse(40, 14, 34, 8, (90, 150, 220))
    p.rect(60, 16, 70, 58, (44, 96, 160))
    return outline(to_rgba(p))


def mk_tanque():
    p = obj_canvas(70, 64)
    shadow(p, 35, 60, 32, 4)
    p.rect(6, 14, 64, 56, (200, 200, 196)); p.rect(10, 18, 60, 34, (150, 170, 180))
    p.rect(40, 4, 44, 14, (160, 160, 166))
    return outline(to_rgba(p))


OBJ_MAKERS = {
    "carro": mk_carro, "kombi": mk_kombi, "arbusto": mk_arbusto, "tambor": mk_tambor, "engradados": mk_engradados,
    "mesa": mk_mesa, "lixeira": mk_lixeira, "orelhao": mk_orelhao, "mato": mk_mato, "entulho": mk_entulho,
    "cacamba": mk_cacamba, "pneus": mk_pneus, "manga": mk_manga, "varal": mk_varal, "casinha": mk_casinha,
    "bananeira": mk_bananeira, "caixa": mk_caixa, "tanque": mk_tanque,
    "carro_vermelho": lambda: mk_carro((200, 50, 46)),
}

# (tipo, x da base (centro), y da base, nome do esconderijo, pé sólido (largura, altura), cobre quem fica atrás?)
OBJECTS = [
    ("kombi", 330, 430, "Atrás da Kombi", (180, 30), True),
    ("carro", 670, 640, "Atrás do Celta branco dos gêmeos", (170, 26), True),
    ("lixeira", 160, 334, "Atrás da lixeira", (26, 10), True),
    ("arbusto", 830, 332, "No arbusto do Cezar", (90, 12), True),
    ("tambor", 1040, 334, "Atrás do tambor azul", (32, 10), True),
    ("orelhao", 1220, 334, "Atrás do orelhão", (20, 10), True),
    ("engradados", 1410, 334, "Atrás dos engradados da Dona Vera", (96, 12), True),
    ("mesa", 1590, 336, "Debaixo da mesa da varanda", (100, 10), True),
    ("mato", 110, 900, "No mato alto (1)", None, True),
    ("mato", 330, 1060, "No mato alto (2)", None, True),
    ("mato", 820, 1060, "No mato do quintal", None, True),
    ("entulho", 300, 820, "Atrás do entulho", (120, 18), True),
    ("cacamba", 140, 1040, "Atrás da caçamba", (160, 20), True),
    ("pneus", 390, 720, "Atrás dos pneus", (56, 12), True),
    ("manga", 560, 900, "Debaixo do pé de manga", (24, 12), True),
    ("varal", 760, 820, "Atrás dos lençóis do varal", (190, 6), True),
    ("casinha", 860, 960, "Atrás da casinha do cachorro", (70, 14), True),
    ("bananeira", 500, 1050, "Na bananeira", (16, 10), True),
    ("caixa", 990, 900, "Atrás da caixa d'água", (64, 10), True),
    ("tanque", 1560, 1040, "Atrás do tanque de lavar roupa", (60, 12), True),
    ("carro_vermelho", 1600, 880, "Atrás do carro do Lucas", (170, 26), True),
    ("arbusto", 1900, 900, "No arbusto da esquina", (90, 12), True),
    ("tanque", 560, 116, "No fundo do beco", (56, 12), True),
]
# placas com o nome de cada casa (aparecem no jogo)
CASAS = [("Kauã", 120, 112), ("Barracão", 380, 108), ("Cezar", 730, 118), ("Pedro", 990, 122),
         ("Dona Tita", 1240, 82), ("Dona Vera", 1510, 118), ("Gêmeos", 683, 724), ("Lucas", 1280, 724)]
EXTRA_SPOTS = [  # esconderijos sem objeto (escuro)
    {"id": "barracao", "nome": "Dentro do barracão inacabado", "x": 321, "y": 222, "raio": 28, "escuro": True},
    {"id": "escada_kaua", "nome": "Na escadinha do Kauã", "x": 125, "y": 232, "raio": 24, "escuro": True},
]


def build():
    g = ground()
    g.save(f"{OUT}/chao.png")
    sizes = {}
    for k, mk in OBJ_MAKERS.items():
        im = mk()
        im.save(f"{OUT}/obj_{k}.png")
        sizes[k] = im.size
    objs = []
    for i, (tipo, x, y, nome, foot, cover) in enumerate(OBJECTS):
        w, h = sizes[tipo]
        o = {"id": f"o{i}", "tipo": tipo, "x": x, "y": y, "w": w, "h": h, "nome": nome, "cobre": cover}
        if foot:
            fw, fh = foot
            solid(x - fw // 2, y - fh, fw, fh)
            o["pe"] = [fw, fh]
        else:
            o["pe"] = [0, 0]
        o["mato"] = tipo == "mato"
        o["copa"] = tipo == "manga"
        objs.append(o)
    data = {"tamanho": [W, H], "pique": {"x": 960, "y": 338}, "solidos": SOLIDS, "objetos": objs,
            "esconderijos_extra": EXTRA_SPOTS,
            "inicio": {"x": 900, "y": 420},
            "casas": [{"nome": n, "x": x, "y": y} for n, x, y in CASAS]}
    with open(f"{OUT}/mapa.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    # prévia
    prev = g.copy()
    for o in sorted(objs, key=lambda o: o["y"]):
        im = Image.open(f"{OUT}/obj_{o['tipo']}.png")
        prev.alpha_composite(im, (o["x"] - o["w"] // 2, o["y"] - o["h"]))
    prev.save("/tmp/esconde_prev.png")
    print("ok", len(objs), "objetos", len(SOLIDS), "sólidos")


if __name__ == "__main__":
    build()
