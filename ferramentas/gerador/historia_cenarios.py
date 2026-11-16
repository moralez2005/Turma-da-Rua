"""Cenários do modo história: a frente da escola (de manhã) e a sala do Cezar (de noite, filme de terror).
Rodar: python historia_cenarios.py  (gera assets/cenarios/escola.png e sala_cezar.png, 960x540)"""
import os, random
import numpy as np
from PIL import Image
from bg960 import Pic, sky, cloud, wall, window, gate, sidewalk, curb, pavers, big_tree, mix, dark, baiano

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "cenarios")
W, H = 960, 540
rnd = random.Random(5)

# ---------------------------------------------------------------- escola (de manhã)
p = Pic(W, H)
sky(p, 0, 200, [(0, (120, 176, 230)), (1, (206, 228, 244))])
cloud(p, 160, 60, 140); cloud(p, 700, 40, 110)
big_tree(p, 860, 150, 70, 70)
wall(p, 0, 120, W - 1, 330, (236, 226, 196))                  # muro da escola
p.rect(0, 250, W - 1, 320, (70, 140, 96)); p.noise(0, 250, W - 1, 320, 0.03)   # faixa verde
p.rect(0, 246, W - 1, 249, (50, 110, 74))
p.rect(0, 112, W - 1, 120, (200, 190, 160))
# letreiro (sem nome de escola de verdade): placa com "ESCOLA" em blocos
p.rect(330, 132, 630, 190, (40, 70, 130)); p.rect(334, 136, 626, 186, (60, 100, 170))
LET = {"E": ["111", "100", "110", "100", "111"], "S": ["111", "100", "111", "001", "111"], "C": ["111", "100", "100", "100", "111"],
       "O": ["111", "101", "101", "101", "111"], "L": ["100", "100", "100", "100", "111"], "A": ["111", "101", "111", "101", "101"]}
x = 372
for ch in "ESCOLA":
    for r, linha in enumerate(LET[ch]):
        for c_, v in enumerate(linha):
            if v == "1": p.rect(x + c_ * 6, 146 + r * 6, x + c_ * 6 + 5, 146 + r * 6 + 5, (250, 246, 230))
    x += 36
gate(p, 420, 200, 140, 130, (90, 120, 160))                    # portão aberto pela metade
p.rect(560, 200, 566, 330, (60, 80, 110))
for k in range(3): window(p, 80 + k * 100, 150, 50, 40)
for k in range(2): window(p, 690 + k * 100, 150, 50, 40)
sidewalk(p, 0, 330, W - 1, 400); curb(p, 0, 400, W - 1)
pavers(p, 0, 411, W - 1, H - 1)
p.image().save(os.path.join(OUT, "escola.png"))

# ---------------------------------------------------------------- sala do Cezar (de noite, só a luz da TV)
p = Pic(W, H, (30, 30, 46))
p.rect(0, 0, W - 1, 340, (74, 78, 104)); p.noise(0, 0, W - 1, 340, 0.03)        # parede
p.rect(0, 300, W - 1, 340, (62, 64, 88))
JANELA = [620, 70, 800, 210]
p.rect(JANELA[0] - 8, JANELA[1] - 8, JANELA[2] + 8, JANELA[3] + 8, (200, 200, 196))
p.rect(*JANELA, (18, 22, 44))
for _ in range(30):
    sx, sy = rnd.randint(JANELA[0], JANELA[2]), rnd.randint(JANELA[1], JANELA[3] - 30)
    p.rect(sx, sy, sx, sy, (230, 230, 200))
p.ellipse(760, 100, 12, 12, (240, 236, 200)); p.ellipse(766, 96, 11, 11, (18, 22, 44))   # lua
p.rect(JANELA[0], JANELA[3] - 30, JANELA[2], JANELA[3], (30, 34, 50))                      # muro lá fora
for gx in range(JANELA[0] + 10, JANELA[2], 20): p.rect(gx, JANELA[1], gx + 2, JANELA[3], (40, 40, 46))   # grade
p.rect((JANELA[0] + JANELA[2]) // 2 - 1, JANELA[1], (JANELA[0] + JANELA[2]) // 2 + 1, JANELA[3], (200, 200, 196))
p.rect(JANELA[0] - 12, JANELA[3] + 8, JANELA[2] + 12, JANELA[3] + 14, (170, 170, 166))
# cortina
p.rect(JANELA[0] - 30, JANELA[1] - 18, JANELA[0] - 4, JANELA[3] + 20, (130, 50, 60)); p.rect(JANELA[2] + 4, JANELA[1] - 18, JANELA[2] + 30, JANELA[3] + 20, (130, 50, 60))
for x in range(JANELA[0] - 28, JANELA[0] - 4, 6): p.rect(x, JANELA[1] - 18, x + 1, JANELA[3] + 20, (100, 36, 46))
# estante com porta-retratos e um quadro
p.rect(90, 120, 270, 128, (110, 76, 50)); p.rect(90, 190, 270, 198, (110, 76, 50))
for k, c in enumerate([(200, 160, 100), (170, 200, 220), (220, 180, 190)]):
    p.rect(104 + k * 56, 92, 140 + k * 56, 120, (60, 50, 40)); p.rect(108 + k * 56, 96, 136 + k * 56, 116, c)
p.rect(110, 160, 170, 190, (160, 60, 60)); p.rect(180, 150, 200, 190, (60, 100, 160)); p.rect(206, 170, 250, 190, (200, 190, 120))
p.rect(380, 70, 520, 160, (120, 90, 60)); p.rect(386, 76, 514, 154, (90, 130, 110)); p.ellipse(450, 116, 30, 22, (120, 160, 120))
# chão e tapete
p.rect(0, 340, W - 1, H - 1, (92, 70, 56)); p.noise(0, 340, W - 1, H - 1, 0.05)
for y in range(348, H, 22): p.rect(0, y, W - 1, y, (78, 58, 46))
p.ellipse(480, 470, 300, 50, (110, 50, 60)); p.ellipse(480, 470, 280, 42, (140, 66, 74))
# sofá de frente pra TV (a TV fica do lado da câmera)
S0, S1 = 250, 710
p.rect(S0, 250, S1, 330, (90, 70, 120)); p.noise(S0, 250, S1, 330, 0.04)
p.rect(S0, 246, S1, 252, (110, 88, 146))
p.rect(S0 - 30, 290, S0 + 6, 400, (78, 60, 106)); p.rect(S1 - 6, 290, S1 + 30, 400, (78, 60, 106))
p.rect(S0 + 6, 330, S1 - 6, 372, (104, 82, 138)); p.rect(S0 + 6, 370, S1 - 6, 400, (70, 54, 96))
for x in (S0 + 160, S0 + 310): p.rect(x, 332, x + 2, 368, (80, 62, 108))
p.rect(S0 - 26, 400, S0 - 16, 410, (40, 30, 30)); p.rect(S1 + 16, 400, S1 + 26, 410, (40, 30, 30))
# vasilha de pipoca no chão
p.ellipse(480, 448, 34, 12, (220, 60, 60)); p.ellipse(480, 442, 30, 9, (250, 240, 200))
for _ in range(20):
    x, y = 480 + rnd.randint(-26, 26), 440 + rnd.randint(-6, 3); p.rect(x, y, x + 2, y + 2, (255, 250, 230))
img = p.image()
a = np.array(img).astype(float)
yy, xx = np.mgrid[0:H, 0:W]
v = 1 - 0.45 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H * 0.65) / (H / 1.4)) ** 2)
a[..., :3] *= np.clip(v, 0.4, 1)[..., None]
Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA").save(os.path.join(OUT, "sala_cezar.png"))
print("ok")
