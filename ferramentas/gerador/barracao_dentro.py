"""Lado de dentro do barracão inacabado (tijolo baiano aparente, sem janela nem porta), pra quando chove.
Gera assets/cenarios/barracao_dentro.png (960x540) e barracao_dentro.json (onde a chuva aparece e onde fica a goteira).
Rodar: python barracao_dentro.py
"""
import os, json, random
import numpy as np
from bg960 import Pic, baiano, mix, dark

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "cenarios")
W, H = 960, 540
rnd = random.Random(12)

p = Pic(W, H, (40, 34, 36))
# parede do fundo e laterais em perspectiva simples
baiano(p, 0, 0, W - 1, 330, tint=((60, 40, 40), 0.25))
# vigas e laje de concreto por cima (o barracão tem teto, mas nada de acabamento)
p.rect(0, 0, W - 1, 34, (150, 146, 140)); p.noise(0, 0, W - 1, 34, 0.08)
for x in (0, 300, 640, W - 30):
    p.rect(x, 0, x + 30, 330, (160, 156, 150)); p.noise(x, 0, x + 30, 330, 0.07)   # pilares de concreto
    p.rect(x + 26, 0, x + 30, 330, (120, 116, 112))
# vão da janela (sem janela) e vão da porta (sem porta): lá fora está chovendo
JANELA = [400, 90, 580, 220]
PORTA = [700, 120, 860, 330]
for (x0, y0, x1, y1) in (JANELA, PORTA):
    p.rect(x0 - 6, y0 - 6, x1 + 6, y1 + 6, (110, 100, 96))          # reboco quebrado em volta
    p.rect(x0, y0, x1, y1, (70, 84, 108))                            # céu cinza de chuva
    p.rect(x0, y1 - 40, x1, y1, (90, 96, 104))                       # rua lá fora
    p.rect(x0, y1 - 46, x1, y1 - 40, (150, 150, 150))                # meio-fio
    p.noise(x0, y0, x1, y1, 0.05)
p.rect(PORTA[0], PORTA[3] - 2, PORTA[2], 336, (120, 116, 110))       # soleira
# chão de cimento grosso, com mancha de umidade e poça perto da porta
p.rect(0, 330, W - 1, H - 1, (128, 124, 118)); p.noise(0, 330, W - 1, H - 1, 0.1)
for _ in range(500):
    x, y = rnd.randint(0, W - 1), rnd.randint(332, H - 1)
    p.rect(x, y, x + rnd.randint(1, 4), y, (112, 108, 102))
p.ellipse(760, 372, 90, 14, (96, 104, 116))
p.ellipse(760, 370, 70, 9, (120, 132, 146))
p.rect(0, 330, W - 1, 334, (96, 92, 88))                             # rodapé de sombra
# coisas de obra: sacos de cimento, tijolos empilhados, carrinho de mão, balde na goteira
for k, x in enumerate((40, 96, 70)):
    y = 300 - (k == 2) * 26
    p.rect(x, y, x + 60, y + 30, (200, 196, 180)); p.noise(x, y, x + 60, y + 30, 0.05)
    p.rect(x + 6, y + 8, x + 54, y + 14, (60, 110, 170))
for r_ in range(4):
    for c_ in range(4 - r_ % 2):
        x, y = 200 + c_ * 22 + (r_ % 2) * 11, 316 - r_ * 12
        p.rect(x, y, x + 20, y + 10, (194, 100, 54)); p.rect(x, y + 4, x + 20, y + 5, (150, 74, 40))
p.rect(560, 296, 640, 320, (90, 110, 70)); p.rect(556, 292, 644, 298, (70, 90, 56))   # carrinho de mão
p.ellipse(640, 324, 10, 10, (40, 40, 44))
BALDE = [470, 360]
p.rect(BALDE[0] - 16, BALDE[1] - 26, BALDE[0] + 16, BALDE[1], (70, 130, 190))
p.rect(BALDE[0] - 18, BALDE[1] - 28, BALDE[0] + 18, BALDE[1] - 24, (50, 100, 160))
p.rect(BALDE[0] - 12, BALDE[1] - 26, BALDE[0] + 12, BALDE[1] - 22, (120, 170, 220))
# lâmpada pendurada (apagada) e fio
p.rect(299, 34, 300, 80, (30, 30, 30)); p.ellipse(300, 86, 6, 8, (200, 196, 170))
# vinheta suave pra dar clima
img = p.image()
a = np.array(img).astype(float)
yy, xx = np.mgrid[0:H, 0:W]
v = 1 - 0.35 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 1.6)) ** 2)
a[..., :3] *= np.clip(v, 0.55, 1)[..., None]
from PIL import Image
Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA").save(os.path.join(OUT, "barracao_dentro.png"))
json.dump({"janela": JANELA, "porta": PORTA, "goteira": [BALDE[0], 34], "balde": BALDE,
           "lugares": [[160, 420], [250, 440], [340, 410], [430, 450], [540, 420], [620, 450], [180, 500], [380, 500], [560, 500], [700, 470]]},
          open(os.path.join(OUT, "barracao_dentro.json"), "w"))
print("ok")
