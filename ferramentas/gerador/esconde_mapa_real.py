"""Mapa do esconde-esconde (1920x1440) inspirado no quarteirão de verdade, sem nomes de rua nem números.

Desenho da turma (de cima pra baixo):
  - Duas ruas sobem a partir da rua principal. Na da direita ficam o Cezar e o Lucas.
  - Lado de cima da rua principal: Pedro, Dona Tita (esquina), Dona Vera e os gêmeos.
  - Lado de baixo: a oficina (futuro: Geraldo), o barracão inacabado e a casa do Kauã.
  - Uma rua desce do canto esquerdo até a rua do Pernalonga.
Rodar: python esconde_mapa_real.py  (gera assets/esconde/chao.png, obj_*.png e mapa.json)
"""
import os, json
from PIL import Image
from bg960 import (Pic, roof, wall, window, door, gate, baiano, poste, wires, sidewalk, curb, pavers, plant_pot,
                   mix, dark, tree_back)
import esconde_hd as E

OUT = E.OUT
W, H = 1920, 1440
rnd = E.rnd
grass, dirt, cement, low_wall = E.grass, E.dirt, E.cement, E.low_wall

SOLIDS = []


def solid(x, y, w, h):
    SOLIDS.append([int(x), int(y), int(w), int(h)])


# ---- medidas principais ----
FY0, FY1 = 400, 620          # fachadas do lado de cima
SW0, SW1 = 620, 660          # calçada de cima
ST0, ST1 = 672, 958          # rua principal
SS0, SS1 = 970, 1012         # calçada de baixo
LOT = 1013                   # lotes de baixo começam aqui
UP_L = (860, 980)            # rua que sobe (esquerda)
UP_R = (1380, 1500)          # rua que sobe (direita): Cezar e Lucas
DOWN = (180, 320)            # rua que desce até a do Pernalonga
RED = (1300, 1439)           # rua do Pernalonga (embaixo, à esquerda)


def telhado(p, x0, y0, x1, y1, parede, telha=(176, 84, 54)):
    """Casa vista de cima: parede aparecendo na borda + telhado de duas águas."""
    p.rect(x0 - 8, y0 - 8, x1 + 8, y1 + 8, parede)
    p.rect(x0, y0, x1, y1, telha)
    for y in range(y0, y1, 8):
        p.rect(x0, y + 6, x1, y + 7, dark(telha, 0.85))
    mx = (x0 + x1) // 2
    p.rect(x0, y0, x1, y0 + 6, mix(telha, (255, 255, 255), 0.18)); p.rect(mx - 4, y0, mx + 4, y1, dark(telha, 0.74))
    p.shade(x1 + 8, y0, x1 + 22, y1 + 22, 0.8); p.shade(x0, y1 + 8, x1 + 22, y1 + 22, 0.8)


def muro_v(p, x, y0, y1, c=(214, 208, 198)):
    low_wall(p, x, y0, x + 14, y1, c)


def ground():
    p = Pic(W, H)
    # ---------------- parte de cima (vista de cima): quintais e as duas ruas que sobem ----------------
    grass(p, 0, 0, W - 1, FY0 - 1, (112, 150, 78))
    tree_back(p, 0, UP_L[0], 60, (96, 140, 92))
    # casinhas genéricas à esquerda
    for x0 in (40, 330, 600):
        telhado(p, x0, 150, x0 + 200, 330, (226, 220, 206))
        solid(x0 - 8, 142, 216, 196)
    # quintal do Pedro (atrás da casa)
    dirt(p, UP_L[1], 0, 1180, FY0 - 1); grass(p, 1000, 20, 1160, 140, (118, 150, 70))
    # Lucas (em cima) e Cezar (embaixo), de frente pra rua da direita
    cement(p, 1180, 0, UP_R[0] - 1, FY0 - 1)
    telhado(p, 1200, 24, 1330, 150, (232, 150, 176))                 # casa rosa do Lucas
    low_wall(p, 1180, 170, UP_R[0] - 1, 184, (124, 86, 60))           # muro marrom
    muro_v(p, UP_R[0] - 14, 0, 60, (124, 86, 60)); muro_v(p, UP_R[0] - 14, 120, 184, (124, 86, 60))   # portão y 60..120
    p.rect(UP_R[0] - 14, 60, UP_R[0] - 1, 120, (150, 110, 80))
    solid(1192, 16, 146, 142); solid(1180, 170, 200, 14); solid(UP_R[0] - 14, 0, 14, 60); solid(UP_R[0] - 14, 120, 14, 64)
    telhado(p, 1200, 220, 1330, 350, (240, 214, 138))                # casa amarela do Cezar
    for gy in (236, 296):                                              # portões marrons virados pra rua
        p.rect(UP_R[0] - 18, gy, UP_R[0] - 1, gy + 50, (124, 78, 46))
        for k in range(gy, gy + 50, 6):
            p.rect(UP_R[0] - 18, k, UP_R[0] - 1, k, (92, 56, 32))
    solid(1192, 212, 146, 146)
    # quintais à direita (atrás da Dona Vera e dos gêmeos)
    grass(p, UP_R[1] + 1, 0, W - 1, FY0 - 1, (116, 156, 80))
    telhado(p, 1560, 60, 1700, 200, (176, 146, 214))
    telhado(p, 1770, 80, 1900, 220, (236, 228, 206))
    solid(1552, 52, 156, 156); solid(1762, 72, 146, 156)
    # ruas que sobem (até a rua principal)
    for (a, b) in (UP_L, UP_R):
        pavers(p, a, 0, b, ST0, cw=26, ch=18)
        p.rect(a, 0, a + 3, ST0, (170, 166, 160)); p.rect(b - 3, 0, b, ST0, (170, 166, 160))

    # ---------------- fachadas do lado de cima ----------------
    def fachada(x0, x1, cor, top=FY0 + 20):
        wall(p, x0, top, x1, FY1, cor); roof(p, x0, x1, top - 18)
        solid(x0, FY0 - 20, x1 - x0, FY1 - FY0 + 20)
    fachada(0, 280, (236, 234, 226)); window(p, 40, 480); window(p, 200, 480); door(p, 120, 550, 38, 70)
    fachada(280, 560, (240, 220, 196)); window(p, 320, 480); gate(p, 420, 530, 110, 90)
    fachada(560, UP_L[0], (206, 222, 236)); window(p, 600, 480); window(p, 780, 480); door(p, 700, 550, 38, 70)
    # Pedro: portão de madeira
    fachada(UP_L[1], 1180, (226, 232, 214)); window(p, 1006, 470); window(p, 1126, 470)
    p.rect(1050, 540, 1120, 620, (120, 78, 44))
    for gx in range(1050, 1120, 12):
        p.rect(gx, 540, gx + 1, 620, (88, 56, 32)); p.rect(gx + 3, 540, gx + 3, 620, (156, 108, 66))
    p.rect(1050, 562, 1120, 565, (88, 56, 32)); p.rect(1050, 596, 1120, 599, (88, 56, 32))
    # Dona Tita: casa rosa de 2 andares, na esquina
    wall(p, 1180, FY0 - 10, UP_R[0], FY1, (232, 160, 168)); roof(p, 1180, UP_R[0], FY0 - 28)
    window(p, 1206, 420); window(p, 1320, 420); window(p, 1206, 516); door(p, 1310, 550, 36, 70)
    p.rect(1190, 476, UP_R[0] - 10, 482, (210, 210, 206))
    solid(1180, FY0 - 28, UP_R[0] - 1180, FY1 - FY0 + 28)
    # Dona Vera: casa lilás
    fachada(UP_R[1], 1720, (176, 146, 214)); window(p, 1530, 480); window(p, 1650, 480)
    door(p, 1600, 550, 38, 70, (110, 80, 120))
    # gêmeos
    fachada(1720, W, (240, 232, 214)); window(p, 1750, 480); window(p, 1860, 480); gate(p, 1790, 540, 60, 80, (120, 124, 136), 6)

    # ---------------- calçadas e rua principal ----------------
    sidewalk(p, 0, SW0, W - 1, SW1)
    for (a, b) in (UP_L, UP_R):                       # a calçada é cortada pelas ruas que sobem
        pavers(p, a, SW0, b, ST0, cw=26, ch=18)
    curb(p, 0, SW1, W - 1)
    for (a, b) in (UP_L, UP_R):
        pavers(p, a, SW1, b, ST0, cw=26, ch=18)
    pavers(p, 0, ST0, W - 1, ST1, cw=26, ch=18)
    curb(p, 0, ST1, W - 1)
    sidewalk(p, 0, SS0, W - 1, SS1, (196, 192, 184))
    pavers(p, DOWN[0], ST1, DOWN[1], H - 1, cw=26, ch=18)   # rua que desce
    poste(p, 1120, 430, 650)
    wires(p, 0, W, FY0 + 6, 22)

    # ---------------- lotes de baixo ----------------
    # Pernalonga: casa amarela na rua de baixo
    grass(p, 0, LOT, DOWN[0] - 1, RED[0] - 1, (118, 150, 70))
    telhado(p, 24, 1060, 150, 1210, (240, 206, 110))
    low_wall(p, 0, RED[0] - 16, DOWN[0] - 1, RED[0] - 2); p.rect(70, RED[0] - 16, 120, RED[0] - 2, (118, 150, 70))
    solid(16, 1052, 142, 166); solid(0, RED[0] - 16, 70, 14); solid(120, RED[0] - 16, 60, 14)
    pavers(p, 0, RED[0], DOWN[0], H - 1, cw=26, ch=18)
    p.rect(0, RED[0], DOWN[0], RED[0] + 3, (170, 166, 160))
    # terreno baldio
    dirt(p, DOWN[1] + 1, LOT, 1000, H - 1)
    grass(p, 360, 1080, 560, 1240, (118, 150, 70)); grass(p, 700, 1260, 980, 1420, (118, 150, 70))
    for x in range(DOWN[1] + 1, 1000, 40):
        if (x // 40) % 3 != 1:
            p.rect(x, LOT, x + 3, LOT + 18, (140, 110, 80))
    # oficina (fechada por enquanto; um dia o Geraldo aparece aqui)
    cement(p, 1000, LOT, 1180, H - 1)
    telhado(p, 1016, 1120, 1164, 1300, (200, 200, 196), (120, 120, 126))
    muro_v(p, 1000, LOT, H - 1); solid(1000, LOT, 14, H - LOT); solid(1008, 1112, 164, 196)
    # barracão inacabado: tijolo baiano sem telhado, abertura pra rua
    dirt(p, 1180, LOT, 1400, H - 1)
    bx0, by0, bx1, by1 = 1200, 1060, 1380, 1260
    p.rect(bx0 + 14, by0 + 14, bx1 - 14, by1 - 14, (120, 108, 96)); p.noise(bx0 + 14, by0 + 14, bx1 - 14, by1 - 14, 0.08)
    for (x0, y0, x1, y1) in ((bx0, by0, bx0 + 60, by0 + 14), (bx0 + 120, by0, bx1, by0 + 14),       # parede de cima com vão
                             (bx0, by0, bx0 + 14, by1), (bx1 - 14, by0, bx1, by1), (bx0, by1 - 14, bx1, by1)):
        baiano(p, x0, y0, x1, y1)
        solid(x0, y0, x1 - x0, y1 - y0)
    # casa do Kauã: entrada de meio tijolo com escadinha descendo pro quintal (e a torneira!)
    grass(p, 1400, LOT, 1640, H - 1, (116, 156, 80))
    telhado(p, 1420, 1150, 1620, 1330, (226, 214, 190))
    solid(1412, 1142, 216, 196)
    baiano(p, 1400, LOT, 1480, LOT + 16); baiano(p, 1540, LOT, 1640, LOT + 16)
    solid(1400, LOT, 80, 16); solid(1540, LOT, 100, 16)
    for k, y in enumerate(range(LOT + 18, LOT + 90, 12)):           # escadinha descendo
        c = mix((170, 160, 150), (90, 80, 72), k / 6)
        p.rect(1484, y, 1536, y + 9, c); p.rect(1484, y + 10, 1536, y + 11, dark(c, 0.7))
    p.rect(1560, 1100, 1570, 1106, (170, 170, 176)); p.rect(1563, 1106, 1566, 1116, (170, 170, 176))   # torneira
    p.ellipse(1565, 1122, 10, 4, (90, 130, 170))
    # último lote
    cement(p, 1640, LOT, W - 1, H - 1)
    muro_v(p, 1640, LOT + 60, H - 1); solid(1640, LOT + 60, 14, H - LOT - 60)
    telhado(p, 1700, 1180, 1880, 1360, (214, 222, 230))
    solid(1692, 1172, 196, 196)
    return p.image()


CASAS = [("Pedro", 1080, 448), ("Dona Tita", 1280, 396), ("Dona Vera", 1610, 448), ("Gêmeos", 1820, 448),
         ("Lucas", 1265, 88), ("Cezar", 1265, 284), ("Barracão", 1290, 1160), ("Kauã", 1520, 1240),
         ("Pernalonga", 88, 1134)]

# (tipo, x da base (centro), y da base, nome, pé sólido, cobre)
OBJECTS = [
    ("kombi", 520, 760, "Atrás da Kombi", (180, 30), True),
    ("carro", 1820, 760, "Atrás do Celta branco", (170, 26), True),
    ("carro_vermelho", 700, 940, "Atrás do carro vermelho", (170, 26), True),
    ("lixeira", 200, 654, "Atrás da lixeira", (26, 10), True),
    ("arbusto", 380, 654, "No arbusto da calçada", (90, 12), True),
    ("tambor", 820, 654, "Atrás do tambor azul", (32, 10), True),
    ("orelhao", 1350, 656, "Atrás do orelhão", (20, 10), True),
    ("engradados", 1560, 654, "Atrás dos engradados da Dona Vera", (96, 12), True),
    ("mesa", 1700, 656, "Debaixo da mesa da varanda", (100, 10), True),
    ("arbusto", 1440, 120, "No arbusto da subida", (90, 12), False),
    ("caixa", 1060, 380, "Atrás da caixa d'água do Pedro", (64, 10), True),
    ("varal", 1100, 160, "Atrás dos lençóis do Pedro", (190, 6), True),
    ("manga", 1640, 380, "Debaixo do pé de manga", (24, 12), True),
    ("casinha", 1850, 330, "Atrás da casinha do cachorro", (70, 14), True),
    ("bananeira", 760, 120, "Na bananeira", (16, 10), True),
    ("mato", 460, 1240, "No mato alto (1)", None, True),
    ("mato", 840, 1420, "No mato alto (2)", None, True),
    ("entulho", 640, 1140, "Atrás do entulho", (120, 18), True),
    ("cacamba", 420, 1400, "Atrás da caçamba", (160, 20), True),
    ("pneus", 940, 1100, "Atrás dos pneus", (56, 12), True),
    ("tanque", 1800, 1420, "Atrás do tanque de lavar roupa", (60, 12), True),
    ("arbusto", 1590, 1420, "No arbusto do Kauã", (90, 12), True),
]
EXTRA_SPOTS = [
    {"id": "barracao", "nome": "Dentro do barracão inacabado", "x": 1290, "y": 1200, "raio": 30, "escuro": True},
    {"id": "escada_kaua", "nome": "Na escadinha do Kauã", "x": 1510, "y": 1090, "raio": 24, "escuro": True},
]


def build():
    g = ground()
    g.save(f"{OUT}/chao.png")
    sizes = {}
    for k, mk in E.OBJ_MAKERS.items():
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
    data = {"tamanho": [W, H], "pique": {"x": 1120, "y": 652}, "solidos": SOLIDS, "objetos": objs,
            "esconderijos_extra": EXTRA_SPOTS, "inicio": {"x": 1120, "y": 760},
            "casas": [{"nome": n, "x": x, "y": y} for n, x, y in CASAS]}
    with open(f"{OUT}/mapa.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    prev = g.copy()
    for o in sorted(objs, key=lambda o: o["y"]):
        im = Image.open(f"{OUT}/obj_{o['tipo']}.png")
        prev.alpha_composite(im, (o["x"] - o["w"] // 2, o["y"] - o["h"]))
    prev.save("/tmp/esconde_prev.png")
    print("ok", len(objs), "objetos", len(SOLIDS), "sólidos")


if __name__ == "__main__":
    build()
