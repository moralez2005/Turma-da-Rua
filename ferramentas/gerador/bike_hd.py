"""Matheus pedalando a bike (6 quadros, virado pra direita; o jogo espelha pra esquerda).
As pernas acompanham os pedais (cinemática de duas juntas) e as rodas giram.
Rodar: python bike_hd.py  (gera assets/personagens/matheus_bike.png, quadros de 128x136)
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
from novos_hd import NOVOS
from sprites4 import side
import sprites_hd

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "personagens", "matheus_bike.png")
M = next(c for c in NOVOS if c["id"] == "matheus")
FW, FH, N = 128, 136, 6
CONTORNO = (34, 22, 28, 255)
QUADRO = (210, 54, 60)          # bike vermelha
QUADRO_SOMBRA = (150, 34, 40)
PNEU = (36, 32, 36)
ARO = (196, 196, 204)
SK, SKS = M["skin"]
SHORTS = M["shorts"]
TENIS = M["feet"]

# geometria (em pixels do quadro final); chão em y=132
RODA_T, RODA_F, R_RODA = (26, 112), (100, 112), 19
PEDIVELA, R_PED = (60, 112), 9
SELIM, GUIDAO = (50, 76), (90, 72)
QUADRIL = (52, 70)
COXA, CANELA = 24, 24


def ik(hip, pe, l1, l2):
    """joelho a partir do quadril e do pé (joelho pra frente)."""
    dx, dy = pe[0] - hip[0], pe[1] - hip[1]
    d = min(math.hypot(dx, dy), l1 + l2 - 0.01)
    a = math.atan2(dy, dx)
    b = math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))
    ang = a - b
    return (hip[0] + l1 * math.cos(ang), hip[1] + l1 * math.sin(ang))


def linha(d, a, b, cor, larg):
    d.line([a, b], fill=cor, width=larg)
    for p in (a, b):
        d.ellipse([p[0] - larg / 2 + 0.5, p[1] - larg / 2 + 0.5, p[0] + larg / 2 - 0.5, p[1] + larg / 2 - 0.5], fill=cor)


def contorno(im):
    px = im.load(); src = im.copy().load()
    for y in range(im.height):
        for x in range(im.width):
            if src[x, y][3] == 0 and any(0 <= x + dx < im.width and 0 <= y + dy < im.height and src[x + dx, y + dy][3] and src[x + dx, y + dy] != CONTORNO
                                          for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                px[x, y] = CONTORNO


def roda(d, c, ang):
    x, y = c
    d.ellipse([x - R_RODA, y - R_RODA, x + R_RODA, y + R_RODA], outline=PNEU, width=5)
    d.ellipse([x - R_RODA + 5, y - R_RODA + 5, x + R_RODA - 5, y + R_RODA - 5], outline=ARO, width=1)
    for k in range(3):   # raios girando
        a = ang + k * math.pi / 3
        d.line([(x - math.cos(a) * 13, y - math.sin(a) * 13), (x + math.cos(a) * 13, y + math.sin(a) * 13)], fill=(150, 150, 160), width=1)
    d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(90, 90, 100))


def quadro(n):
    ang = n / N * 2 * math.pi
    im = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    ped = [(PEDIVELA[0] + math.cos(ang + k * math.pi) * R_PED, PEDIVELA[1] + math.sin(ang + k * math.pi) * R_PED) for k in (0, 1)]
    # perna de trás (mais escura), atrás da bike
    pe_t = ped[1]
    jt = ik(QUADRIL, pe_t, COXA, CANELA)
    linha(d, QUADRIL, jt, tuple(int(v * 0.75) for v in SHORTS), 7)
    linha(d, jt, pe_t, SKS, 6)
    linha(d, (pe_t[0] - 3, pe_t[1] + 2), (pe_t[0] + 6, pe_t[1] + 2), tuple(int(v * 0.75) for v in TENIS), 5)
    # bike
    roda(d, RODA_T, -ang * 1.6); roda(d, RODA_F, -ang * 1.6)
    for a, b in ((RODA_T, PEDIVELA), (PEDIVELA, SELIM), (RODA_T, SELIM), (SELIM, (86, 80)), (PEDIVELA, (86, 80)), ((86, 80), RODA_F)):
        linha(d, a, b, QUADRO, 5)
    linha(d, (86, 80), (88, 70), QUADRO_SOMBRA, 4)
    linha(d, (84, 68), GUIDAO, (60, 60, 66), 4)                        # guidão
    linha(d, (SELIM[0] - 7, SELIM[1] - 2), (SELIM[0] + 6, SELIM[1] - 2), (40, 36, 40), 5)   # selim
    linha(d, ped[0], ped[1], (90, 90, 100), 3)                         # pedivela
    d.ellipse([PEDIVELA[0] - 5, PEDIVELA[1] - 5, PEDIVELA[0] + 5, PEDIVELA[1] + 5], fill=(120, 120, 130))
    # corpo: cabeça e tronco do sprite de lado do Matheus, levemente inclinado pra frente
    corpo = sprites_hd.hd(M, side(M, 0))
    px = corpo.load()
    corte = next(y for y in range(corpo.height) if any(px[x, y][:3] == tuple(SHORTS) and px[x, y][3] for x in range(corpo.width)))
    tronco = corpo.crop((0, 0, corpo.width, corte + 4)).rotate(-8, resample=Image.NEAREST, expand=True)
    bb = tronco.getbbox()
    tronco = tronco.crop(bb)
    im.alpha_composite(tronco, (int(QUADRIL[0] - tronco.width / 2 + 4), int(QUADRIL[1] - tronco.height + 6)))
    # braço até o guidão
    ombro = (QUADRIL[0] + 8, QUADRIL[1] - 30)
    linha(d, ombro, (ombro[0] + 10, ombro[1] + 10), M["shirt"], 6)
    linha(d, (ombro[0] + 10, ombro[1] + 10), (GUIDAO[0] - 2, GUIDAO[1]), SK, 5)
    # perna da frente, na frente da bike
    pe_f = ped[0]
    jf = ik(QUADRIL, pe_f, COXA, CANELA)
    linha(d, QUADRIL, jf, SHORTS, 7)
    linha(d, jf, pe_f, SK, 6)
    linha(d, (pe_f[0] - 3, pe_f[1] + 2), (pe_f[0] + 6, pe_f[1] + 2), TENIS, 5)
    contorno(im)
    return im


if __name__ == "__main__":
    folha = Image.new("RGBA", (FW * N, FH), (0, 0, 0, 0))
    for n in range(N):
        folha.alpha_composite(quadro(n), (n * FW, 0))
    folha.save(OUT)
    folha.resize((FW * N * 2, FH * 2), Image.NEAREST).save("/tmp/bike_prev.png")
    print("ok")
