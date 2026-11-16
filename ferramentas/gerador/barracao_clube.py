"""O barracão virou o clube da turma: o esconderijo com TV de tubo e videogame, puffs, sofá velho,
estante de gibis, mural com troféus, JBL e pisca-pisca.
Gera assets/cenarios/barracao_clube.png (960x540) e barracao_clube.json (onde fica cada coisa e onde dá pra andar).
Rodar: python barracao_clube.py
"""
import os, json, random
import numpy as np
from PIL import Image
from bg960 import Pic, baiano, mix, dark

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "cenarios")
W, H = 960, 540
rnd = random.Random(21)
p = Pic(W, H, (40, 34, 36))

# ---------------------------------------------------------------- paredes, teto, chão
baiano(p, 0, 0, W - 1, 330, tint=((70, 46, 40), 0.2))
p.rect(0, 0, W - 1, 30, (150, 146, 140)); p.noise(0, 0, W - 1, 30, 0.08)
for x in (0, 330, 930):
    p.rect(x, 0, x + 30, 330, (160, 156, 150)); p.noise(x, 0, x + 30, 330, 0.07)
    p.rect(x + 26, 0, x + 30, 330, (120, 116, 112))
JANELA = [370, 86, 530, 200]
PORTA = [740, 126, 880, 330]
for (x0, y0, x1, y1) in (JANELA, PORTA):   # lá fora: tarde de sol
    p.rect(x0 - 6, y0 - 6, x1 + 6, y1 + 6, (110, 100, 96))
    p.rect(x0, y0, x1, y1, (150, 196, 236))
    p.rect(x0, y0 + (y1 - y0) // 2, x1, y1, (190, 214, 232))
    p.rect(x0, y1 - 40, x1, y1, (150, 148, 144)); p.rect(x0, y1 - 46, x1, y1 - 40, (204, 200, 192))
    p.noise(x0, y0, x1, y1, 0.03)
p.rect(PORTA[0], PORTA[3] - 2, PORTA[2], 336, (120, 116, 110))
# chão de cimento queimado, mais limpinho (a turma varreu)
p.rect(0, 330, W - 1, H - 1, (134, 128, 120)); p.noise(0, 330, W - 1, H - 1, 0.07)
for _ in range(260):
    x, y = rnd.randint(0, W - 1), rnd.randint(334, H - 1)
    p.rect(x, y, x + rnd.randint(1, 3), y, (118, 112, 104))
p.rect(0, 330, W - 1, 334, (96, 92, 88))
# luz do sol entrando pela porta, no chão
for k in range(60):
    y = 336 + k * 2
    x0 = PORTA[0] - k * 1.6; x1 = PORTA[2] - k * 0.4
    p.tint(int(x0), y, int(x1), y + 1, (255, 226, 160), 0.18 * (1 - k / 60))

# tapete listrado no meio
for i, c in enumerate([(178, 58, 52), (230, 190, 90), (60, 110, 160), (230, 190, 90), (178, 58, 52)]):
    p.rect(400, 392 + i * 14, 640, 405 + i * 14, c)
p.noise(400, 392, 640, 461, 0.06)
for x in range(400, 641, 6):
    p.rect(x, 462, x + 2, 466, (220, 210, 190)); p.rect(x, 388, x + 2, 391, (220, 210, 190))

# ---------------------------------------------------------------- canto do videogame
# caixote de feira de suporte, TV de tubo em cima e o videogame dentro do caixote
p.rect(90, 268, 220, 330, (170, 120, 66)); p.noise(90, 268, 220, 330, 0.06)
for y in (268, 288, 308):
    p.rect(90, y, 220, y + 3, (130, 88, 46))
p.rect(104, 292, 206, 326, (60, 42, 30))                           # vão do caixote
p.rect(118, 304, 192, 318, (30, 30, 34)); p.rect(118, 304, 192, 306, (60, 60, 68))   # console preto
p.rect(124, 311, 132, 312, (60, 140, 230))                          # luz azul do console
p.rect(98, 176, 214, 268, (190, 184, 174)); p.noise(98, 176, 214, 268, 0.03)          # carcaça da TV
p.rect(98, 176, 214, 180, (214, 208, 198)); p.rect(208, 176, 214, 268, (150, 146, 138))
TELA = [108, 186, 190, 252]
p.rect(*TELA, (28, 36, 44))
p.rect(112, 190, 126, 194, (70, 84, 96))                             # reflexo
p.rect(194, 196, 204, 200, (90, 86, 80)); p.rect(194, 206, 204, 210, (90, 86, 80))    # botões
p.rect(196, 230, 202, 244, (60, 58, 56))                             # alto-falante
p.rect(140, 160, 142, 176, (60, 60, 64)); p.rect(160, 158, 162, 176, (60, 60, 64))    # antena
p.rect(126, 156, 140, 158, (60, 60, 64)); p.rect(162, 154, 178, 156, (60, 60, 64))
# controle no chão com o fio
p.rect(150, 326, 152, 372, (24, 24, 28))
p.ellipse(150, 378, 14, 7, (40, 40, 46)); p.rect(144, 376, 146, 378, (200, 60, 60)); p.rect(154, 376, 156, 378, (60, 120, 220))

# puffs (um vermelho e um azul), com amassado de quem senta
def puff(cx, cy, c):
    p.ellipse(cx, cy + 6, 46, 14, (60, 50, 52))
    p.ellipse(cx, cy - 8, 42, 26, dark(c, 0.8))
    p.ellipse(cx - 4, cy - 12, 36, 20, c)
    p.ellipse(cx - 12, cy - 22, 12, 6, mix(c, (255, 255, 255), 0.25))
    p.rect(cx - 2, cy - 30, cx + 2, cy + 8, dark(c, 0.7))
puff(110, 440, (196, 58, 58))
puff(232, 452, (58, 102, 186))

# ---------------------------------------------------------------- estante de gibis (caixotes empilhados)
for k, y0 in enumerate((282, 232)):
    p.rect(244, y0, 318, y0 + 48, (176, 126, 70)); p.noise(244, y0, 318, y0 + 48, 0.06)
    p.rect(250, y0 + 4, 312, y0 + 44, (70, 48, 34))
    x = 252
    while x < 308:
        w = rnd.choice((3, 4, 5)); h = rnd.randint(28, 38)
        c = rnd.choice([(220, 60, 60), (240, 200, 60), (60, 120, 220), (70, 170, 90), (240, 240, 230), (200, 100, 200)])
        p.rect(x, y0 + 44 - h, x + w - 1, y0 + 43, c); p.rect(x, y0 + 44 - h, x + w - 1, y0 + 45 - h, mix(c, (255, 255, 255), 0.4))
        x += w + 1
# gibis em cima, abertos
p.rect(250, 222, 286, 232, (240, 236, 220)); p.rect(268, 222, 269, 232, (150, 150, 150))
p.rect(252, 224, 264, 228, (220, 80, 70)); p.rect(272, 224, 284, 230, (80, 140, 220))
# pôster de futebol na parede (inventado: bola e listras)
p.rect(244, 70, 318, 196, (236, 232, 220)); p.rect(244, 70, 318, 74, (200, 40, 40)); p.rect(244, 192, 318, 196, (200, 40, 40))
p.ellipse(281, 128, 22, 22, (250, 250, 250)); p.ellipse(281, 128, 8, 8, (30, 30, 30))
for (dx, dy) in ((-14, -10), (12, -12), (-12, 12), (14, 10)):
    p.ellipse(281 + dx, 128 + dy, 4, 4, (30, 30, 30))
p.rect(256, 162, 306, 166, (40, 90, 170)); p.rect(262, 172, 300, 175, (40, 90, 170))

# ---------------------------------------------------------------- sofá velho embaixo da janela
S0, S1 = 352, 548
p.rect(S0, 252, S1, 300, (96, 120, 84)); p.noise(S0, 252, S1, 300, 0.05)                 # encosto
p.rect(S0, 250, S1, 254, (120, 146, 104))
p.rect(S0 - 10, 270, S0 + 14, 330, (84, 106, 72)); p.rect(S1 - 14, 270, S1 + 10, 330, (84, 106, 72))   # braços
p.rect(S0 + 14, 296, S1 - 14, 318, (108, 134, 94)); p.noise(S0 + 14, 296, S1 - 14, 318, 0.05)         # assento
p.rect(S0 + 14, 316, S1 - 14, 330, (70, 90, 60))
p.rect(450, 298, 452, 316, (80, 100, 70))                            # divisão das almofadas
p.rect(400, 262, 426, 280, (150, 110, 70)); p.rect(402, 264, 424, 266, (170, 130, 86))  # remendo
p.rect(S0 - 6, 330, S0, 336, (50, 40, 34)); p.rect(S1, 330, S1 + 6, 336, (50, 40, 34))

# ---------------------------------------------------------------- mural de cortiça + prateleira de troféus
M = [566, 78, 712, 196]
p.rect(M[0] - 6, M[1] - 6, M[2] + 6, M[3] + 6, (110, 72, 40))
p.rect(*M, (186, 138, 88)); p.noise(*M, 0.1)
for k in range(9):
    x = M[0] + 8 + (k % 3) * 46 + rnd.randint(-3, 3); y = M[1] + 8 + (k // 3) * 36 + rnd.randint(-2, 2)
    c = rnd.choice([(250, 248, 236), (250, 236, 150), (240, 200, 210), (210, 230, 250)])
    p.rect(x, y, x + 34, y + 26, c)
    if k % 2 == 0:   # "foto" polaroide
        p.rect(x + 3, y + 3, x + 31, y + 19, (100, 150, 190)); p.rect(x + 3, y + 13, x + 31, y + 19, (110, 150, 90))
    else:
        for l in range(3): p.rect(x + 4, y + 6 + l * 6, x + 28 - l * 5, y + 7 + l * 6, (120, 120, 130))
    p.rect(x + 16, y - 2, x + 18, y, rnd.choice([(220, 40, 40), (40, 120, 220), (40, 170, 70)]))
PRAT = [566, 232, 712, 238]
p.rect(*PRAT, (150, 104, 60)); p.rect(PRAT[0], PRAT[3], PRAT[2], PRAT[3] + 3, (100, 70, 40))
p.rect(PRAT[0] + 8, PRAT[3], PRAT[0] + 10, PRAT[3] + 12, (90, 90, 96)); p.rect(PRAT[2] - 10, PRAT[3], PRAT[2] - 8, PRAT[3] + 12, (90, 90, 96))

# ventilador de pé ao lado da porta
p.rect(902, 236, 904, 326, (200, 200, 204)); p.ellipse(903, 328, 14, 4, (70, 70, 76))
p.ellipse(903, 222, 24, 24, (60, 60, 66)); p.ellipse(903, 222, 20, 20, (200, 204, 210)); p.ellipse(903, 222, 4, 4, (60, 60, 66))
# bola murcha e um chinelo perdido
p.ellipse(690, 470, 14, 9, (240, 240, 236)); p.ellipse(686, 468, 4, 3, (40, 40, 40)); p.ellipse(696, 472, 3, 2, (40, 40, 40))
p.rect(330, 498, 350, 504, (60, 110, 200)); p.rect(338, 496, 340, 500, (240, 240, 240))
# lâmpada acesa e varal de pisca-pisca
p.rect(489, 30, 490, 60, (30, 30, 30)); p.ellipse(490, 66, 7, 9, (255, 240, 190))
LUZINHAS = []
for x in range(40, 921, 22):
    y = int(46 + 12 * np.sin((x - 40) / 880 * np.pi * 3) ** 2)
    LUZINHAS.append([x, y + 4])
    p.rect(x, y, x + 22, y + 1, (40, 40, 40))
    p.ellipse(x, y + 4, 3, 4, [(240, 80, 80), (250, 210, 80), (90, 200, 120), (90, 160, 250)][(x // 22) % 4])

# ---------------------------------------------------------------- luz quente e vinheta
img = p.image()
a = np.array(img).astype(float)
yy, xx = np.mgrid[0:H, 0:W]
luz = np.exp(-(((xx - 490) / 360) ** 2 + ((yy - 120) / 300) ** 2))
a[..., 0] *= 0.92 + 0.14 * luz; a[..., 1] *= 0.9 + 0.1 * luz; a[..., 2] *= 0.86 + 0.06 * luz
v = 1 - 0.3 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 1.6)) ** 2)
a[..., :3] *= np.clip(v, 0.6, 1)[..., None]
Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA").save(os.path.join(OUT, "barracao_clube.png"))

# coisas com que dá pra interagir: ponto onde a pessoa para (x, y no chão) e texto do botão
json.dump({
    "andar": [30, 352, 930, 524],
    "tela": TELA, "luzinhas": LUZINHAS, "prateleira": PRAT, "janela": JANELA, "porta": PORTA,
    "coisas": [
        {"id": "videogame", "x": 160, "y": 392, "rotulo": "jogar videogame", "alvo": [154, 220]},
        {"id": "puff", "x": 110, "y": 448, "rotulo": "sentar no puff", "alvo": [110, 420]},
        {"id": "gibis", "x": 282, "y": 372, "rotulo": "ler os gibis", "alvo": [282, 250]},
        {"id": "sofa", "x": 450, "y": 368, "rotulo": "sentar no sofá", "alvo": [450, 300]},
        {"id": "jbl", "x": 560, "y": 372, "rotulo": "ligar a JBL", "alvo": [560, 330]},
        {"id": "mural", "x": 640, "y": 372, "rotulo": "ver o mural e os troféus", "alvo": [640, 150]},
        {"id": "porta", "x": 810, "y": 368, "rotulo": "voltar pra rua", "alvo": [810, 230]},
    ],
}, open(os.path.join(OUT, "barracao_clube.json"), "w"))
print("ok")
