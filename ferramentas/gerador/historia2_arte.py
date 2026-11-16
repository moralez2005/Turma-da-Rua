"""Arte dos capítulos 6, 7 e 8 e da jogada do Kauã:
cidade comprida pro passeio de bike (3840x540), quintal cheio de bola velha, professor, bikes do Pernalonga e do Kauã,
caminhão de lixo, máquina de lavar sem tampa do Geraldo, bolas (a branca e a azul) e o monte de areia.
Rodar: python historia2_arte.py"""
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image, ImageDraw
from bg960 import Pic, sky, cloud, tree_back, wall, roof, window, door, gate, sidewalk, curb, pavers, poste, wires, big_tree, plant_pot, baiano, mix, dark
import sprites_hd
from sprites import CHARS
from vizinhas_hd import MORENA, BRANCO, PRETO, GRISALHO, CASTANHO

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets")
C, P, V, I = (os.path.join(BASE, d) for d in ("cenarios", "personagens", "vizinhas", "itens"))
rnd = random.Random(8)
LET = {"A": ["111", "101", "111", "101", "101"], "C": ["111", "100", "100", "100", "111"], "D": ["110", "101", "101", "101", "110"],
       "E": ["111", "100", "110", "100", "111"], "I": ["111", "010", "010", "010", "111"], "M": ["101", "111", "111", "101", "101"],
       "N": ["111", "101", "101", "101", "101"], "O": ["111", "101", "101", "101", "111"], "P": ["111", "101", "111", "100", "100"],
       "R": ["111", "101", "110", "101", "101"], "S": ["111", "100", "111", "001", "111"], "T": ["111", "010", "010", "010", "010"],
       "F": ["111", "100", "110", "100", "100"], "L": ["100", "100", "100", "100", "111"], "Ç": ["111", "100", "100", "111", "010"], "H": ["101", "101", "111", "101", "101"]}


def letreiro(p, x, y, txt, cor=(250, 246, 230), t=4):
    for ch in txt:
        if ch == " ": x += t * 3; continue
        for r, linha in enumerate(LET[ch]):
            for c_, v in enumerate(linha):
                if v == "1": p.rect(x + c_ * t, y + r * t, x + c_ * t + t - 1, y + r * t + t - 1, cor)
        x += t * 4


# ---------------------------------------------------------------- cidade (4 telas de largura)
W, H = 3840, 540
p = Pic(W, H)
sky(p, 0, 120, [(0, (110, 170, 232)), (0.7, (178, 214, 244)), (1, (214, 232, 248))])
for k in range(10): cloud(p, 120 + k * 380 + rnd.randint(-40, 40), 24 + rnd.randint(0, 26), rnd.randint(90, 150))
tree_back(p, 0, W, 80, (104, 150, 98))
x = 0
def casa(x0, x1, cor, telhado=(176, 84, 52), y0=74):
    wall(p, x0, y0, x1, 230, cor); roof(p, x0, x1, y0 - 18, c=telhado)
    window(p, x0 + 20, y0 + 42);
    if x1 - x0 > 170: window(p, x1 - 66, y0 + 42)
    door(p, (x0 + x1) // 2 - 18, 160, 36, 70)
# trecho 1: casas
casa(0, 200, (236, 200, 170)); casa(200, 400, (170, 200, 230)); casa(400, 600, (240, 220, 150), (150, 70, 46))
# padaria
wall(p, 600, 60, 900, 230, (246, 236, 210)); roof(p, 600, 900, 42, c=(140, 70, 50))
p.rect(612, 90, 888, 120, (190, 60, 50)); letreiro(p, 664, 96, "PADARIA")
for k in range(10): p.rect(612 + k * 28, 124, 625 + k * 28, 140, (250, 250, 250) if k % 2 else (200, 60, 50))     # toldo listrado
p.rect(630, 150, 870, 230, (90, 70, 56)); p.rect(640, 156, 760, 226, (170, 200, 220)); p.rect(780, 156, 860, 230, (60, 44, 34))
# praça
p.rect(900, 120, 1380, 230, (120, 166, 92)); p.noise(900, 120, 1380, 230, 0.08)
for tx in (960, 1120, 1300): big_tree(p, tx, 120, 56, 110)
for bx in (1020, 1200):
    p.rect(bx, 200, bx + 60, 206, (150, 100, 60)); p.rect(bx + 4, 206, bx + 8, 222, (90, 90, 96)); p.rect(bx + 52, 206, bx + 56, 222, (90, 90, 96))
p.rect(900, 222, 1380, 230, (200, 196, 186))
# escola
wall(p, 1380, 110, 1820, 230, (236, 226, 196)); p.rect(1380, 190, 1820, 226, (70, 140, 96))
p.rect(1460, 122, 1740, 160, (40, 70, 130)); letreiro(p, 1500, 130, "ESCOLA", t=5)
gate(p, 1560, 170, 110, 60, (90, 120, 160))
# mercadinho
wall(p, 1820, 70, 2140, 230, (210, 236, 210)); roof(p, 1820, 2140, 52, c=(160, 80, 50))
p.rect(1834, 96, 2126, 124, (40, 130, 70)); letreiro(p, 1870, 102, "MERCADO")
p.rect(1850, 140, 2110, 230, (200, 200, 196)); gate(p, 1850, 140, 260, 90, (170, 176, 186), 4)
# muro grafitado e terreno
wall(p, 2140, 96, 2700, 150, (196, 186, 170)); roof(p, 2140, 2700, 80, c=(160, 84, 56))
for wx in range(2170, 2690, 90): window(p, wx, 108, 36, 26)
p.rect(2140, 150, 2460, 230, (200, 196, 190)); p.noise(2140, 150, 2460, 230, 0.05)
for k in range(9):
    cx, cy = 2160 + k * 34, 180 + (k % 3) * 10
    p.ellipse(cx, cy, 22, 16, [(230, 80, 120), (80, 180, 230), (250, 200, 60), (120, 220, 120)][k % 4])
    p.ellipse(cx, cy, 12, 8, (40, 40, 60))
p.rect(2460, 150, 2700, 230, (150, 130, 96)); p.noise(2460, 150, 2700, 230, 0.12)       # terreno baldio
for k in range(14): p.rect(2470 + k * 17, 200 - rnd.randint(0, 22), 2472 + k * 17, 230, (100, 140, 70))
# oficina
wall(p, 2700, 80, 2980, 230, (200, 200, 206)); roof(p, 2700, 2980, 62, c=(110, 110, 120))
p.rect(2712, 98, 2968, 126, (230, 160, 40)); letreiro(p, 2744, 104, "OFICINA", (40, 30, 30))
p.rect(2730, 140, 2950, 230, (50, 50, 56)); p.rect(2734, 144, 2946, 150, (80, 80, 90))
casa(2980, 3180, (240, 190, 200)); casa(3180, 3400, (200, 210, 160))
# casa do Kauã (azul, com portão) no fim
wall(p, 3400, 70, 3840, 230, (130, 170, 220)); roof(p, 3400, 3840, 52, c=(150, 70, 46))
window(p, 3440, 112, 50, 40); window(p, 3760, 112, 50, 40)
p.rect(3540, 150, 3740, 230, (206, 204, 198)); gate(p, 3560, 150, 160, 80, (110, 118, 130), 6)
sidewalk(p, 0, 231, W - 1, 262)
for px_ in range(300, W, 640): poste(p, px_, 40, 252)
wires(p, 0, W, 52, 18)
curb(p, 0, 263, W - 1); pavers(p, 0, 277, W - 1, 503); curb(p, 0, 500, W - 1); sidewalk(p, 0, 512, W - 1, 539, (196, 192, 184))
p.image().save(os.path.join(C, "cidade.png"))

# ---------------------------------------------------------------- quintal cheio de bola velha
p = Pic(960, 540)
sky(p, 0, 90, [(0, (120, 176, 230)), (1, (206, 228, 244))])
wall(p, 0, 40, 960, 210, (214, 200, 176)); roof(p, 0, 960, 24, c=(150, 74, 50))
window(p, 140, 90, 60, 44); window(p, 700, 90, 60, 44); door(p, 420, 130, 40, 80)
p.rect(0, 210, 960, 540, (128, 104, 72)); p.noise(0, 210, 960, 540, 0.12)                    # terra batida
for _ in range(90):
    gx, gy = rnd.randint(0, 950), rnd.randint(220, 530)
    p.rect(gx, gy, gx + rnd.randint(6, 20), gy + 3, (96, 140, 70))                            # mato
for _ in range(16):                                                                            # bolas murchas de enfeite
    bx, by = rnd.randint(30, 860), rnd.randint(230, 520); c = rnd.choice([(220, 220, 214), (200, 80, 60), (90, 120, 200), (230, 200, 80)])
    p.ellipse(bx, by, 10, 6, dark(c, 0.8)); p.ellipse(bx - 2, by - 2, 7, 4, c)
p.rect(0, 210, 960, 214, (90, 74, 52))
# portão de saída (direita) e muro baixo
p.rect(930, 210, 960, 540, (190, 186, 178)); gate(p, 930, 300, 30, 160, (110, 118, 130), 5)
p.image().save(os.path.join(C, "quintal.png"))

# ---------------------------------------------------------------- pessoas e bikes
prof = dict(id="professor", skin=BRANCO, hair=CASTANHO, hs="curto", hw=14, tw=14, th=16, lh=16, leg_w=3,
            shirt=(220, 226, 236), shorts=(60, 64, 80), sleeve="short", pat="", feet=(40, 30, 26), expr="smile", oculos=(30, 30, 30))
sprites_hd.sheet(prof).save(os.path.join(V, "professor.png"))
import bike_hd as B
for cid, cores in (("pernalonga", ((230, 200, 40), (170, 140, 20))), ("kaua", ((60, 170, 90), (40, 120, 60)))):
    ch = next(c for c in CHARS if c["id"] == cid)
    B.M = ch; B.SK, B.SKS = ch["skin"]; B.SHORTS = ch["shorts"]
    B.TENIS = ch["feet"] if ch["feet"] != "descalco" else ch["skin"][1]
    B.QUADRO, B.QUADRO_SOMBRA = cores
    folha = Image.new("RGBA", (B.FW * B.N, B.FH * 3), (0, 0, 0, 0))
    for n in range(B.N):
        folha.alpha_composite(B.quadro(n), (n * B.FW, 0))
        folha.alpha_composite(B.quadro_frente_costas(n, True), (n * B.FW, B.FH))
        folha.alpha_composite(B.quadro_frente_costas(n, False), (n * B.FW, B.FH * 2))
    folha.save(os.path.join(P, cid + "_bike.png"))

O = (34, 22, 28)
# caminhão de lixo
c = Image.new("RGBA", (320, 170), (0, 0, 0, 0)); d = ImageDraw.Draw(c)
d.rectangle([4, 30, 214, 140], fill=O); d.rectangle([7, 33, 211, 137], fill=(236, 236, 230))
d.rectangle([7, 100, 211, 137], fill=(230, 120, 30)); d.polygon([(4, 30), (40, 30), (4, 70)], fill=O)
for k in range(5): d.rectangle([30 + k * 36, 44, 46 + k * 36, 90], fill=(210, 210, 204))
d.rectangle([210, 62, 312, 142], fill=O); d.rectangle([213, 65, 309, 139], fill=(236, 236, 230))
d.rectangle([250, 72, 302, 104], fill=(150, 200, 236)); d.rectangle([300, 118, 312, 130], fill=(255, 240, 160))
for x_ in (60, 160, 266):
    d.ellipse([x_ - 24, 118, x_ + 24, 166], fill=O); d.ellipse([x_ - 19, 123, x_ + 19, 161], fill=(40, 40, 44)); d.ellipse([x_ - 8, 134, x_ + 8, 150], fill=(170, 170, 176))
c.save(os.path.join(I, "caminhao_lixo.png"))
# máquina de lavar sem tampa (tanquinho velho) do Geraldo
m = Image.new("RGBA", (54, 66), (0, 0, 0, 0)); d = ImageDraw.Draw(m)
d.rectangle([2, 8, 51, 64], fill=O); d.rectangle([5, 11, 48, 61], fill=(236, 236, 232))
d.rectangle([5, 11, 48, 22], fill=(210, 212, 216)); d.ellipse([10, 4, 43, 18], fill=O); d.ellipse([13, 6, 40, 16], fill=(70, 90, 110))   # boca aberta
d.rectangle([38, 26, 44, 32], fill=(90, 160, 220)); d.rectangle([8, 56, 48, 60], fill=(190, 190, 194))
for y_ in (34, 42): d.line([(10, y_), (30, y_)], fill=(200, 200, 204))
m.save(os.path.join(I, "maquina_lavar.png"))
# bolas especiais (a branca e a azul), 14x14 como as outras
def bola(nome, base, faixa):
    im = Image.new("RGBA", (14, 14), (0, 0, 0, 0)); px = im.load()
    for y_ in range(14):
        for x_ in range(14):
            dx, dy = x_ - 6.5, y_ - 6.5; r = math.hypot(dx, dy)
            if r <= 6.6:
                c_ = faixa if abs(dx + dy * 0.3) < 1.6 else base
                luz = 1.15 - 0.35 * ((dx + 3) ** 2 + (dy + 3) ** 2) ** 0.5 / 9
                px[x_, y_] = tuple(int(max(0, min(255, v * luz))) for v in c_) + (255,)
            elif r <= 7.4: px[x_, y_] = O + (255,)
    im.save(os.path.join(I, nome + ".png"))
bola("bola_branca", (244, 244, 240), (214, 180, 70))
bola("bola_azul", (30, 44, 110), (210, 40, 50))
print("ok")
