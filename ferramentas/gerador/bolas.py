"""Bolas redondas com 8 quadros de giro (14x14 cada). No jogo elas aparecem ampliadas 2x.
Rodar: python bolas.py  (gera assets/itens/bola.png e bola_queimada.png)
"""
import os, math
from PIL import Image

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "itens")
S, N, R = 14, 8, 6.2
CONT = (34, 22, 28, 255)


def bola(desenha_superficie):
    folha = Image.new("RGBA", (S * N, S), (0, 0, 0, 0))
    for f in range(N):
        im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); px = im.load()
        giro = f / N * 2 * math.pi
        for y in range(S):
            for x in range(S):
                dx, dy = x + 0.5 - S / 2, y + 0.5 - S / 2
                d = math.hypot(dx, dy)
                if d <= R:
                    # ponto na esfera (z pra frente), girando em torno do eixo vertical inclinado
                    nz = math.sqrt(max(0, R * R - d * d)) / R
                    nx, ny = dx / R, dy / R
                    lon = math.atan2(nx, nz) + giro
                    lat = math.asin(max(-1, min(1, ny)))
                    cor = desenha_superficie(lon, lat)
                    luz = 0.62 + 0.38 * max(0, (-nx * 0.5 - ny * 0.6 + nz * 0.6))   # luz do alto à esquerda
                    px[x, y] = (min(255, int(cor[0] * luz)), min(255, int(cor[1] * luz)), min(255, int(cor[2] * luz)), 255)
                elif d <= R + 1.1:
                    px[x, y] = CONT
        px[4, 3] = (255, 255, 255, 255)   # brilho
        folha.alpha_composite(im, (f * S, 0))
    return folha


def futebol(lon, lat):
    # gomos escuros espalhados (pentágonos simplificados)
    for clon, clat in ((0, 0), (math.pi * 0.66, 0.5), (math.pi * 1.33, -0.5), (math.pi, 0.9), (math.pi * 0.33, -0.9), (math.pi * 1.66, 0.2)):
        dl = (lon - clon + math.pi) % (2 * math.pi) - math.pi
        if math.hypot(dl * math.cos(lat), lat - clat) < 0.42:
            return (40, 40, 46)
    return (246, 246, 240)


def queimada(lon, lat):
    # bola de borracha vermelha com uma faixa branca
    dl = (lon + math.pi) % (math.pi) - math.pi / 2
    if abs(dl) < 0.16:
        return (250, 236, 220)
    return (214, 52, 52)


if __name__ == "__main__":
    bola(futebol).save(os.path.join(OUT, "bola.png"))
    bola(queimada).save(os.path.join(OUT, "bola_queimada.png"))
    print("ok")
