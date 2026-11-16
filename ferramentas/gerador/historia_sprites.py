"""Sprites do modo história: o Pernalonga de gesso, a beudinha, o Geraldo, o Cezar de bike,
a máquina do Geraldo, o caminhão de mudança e o celular de botão.
Rodar: python historia_sprites.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
import sprites_hd
from sprites import CHARS
from vizinhas_hd import MORENA, MORENA2, BRANCO, PRETO, GRISALHO, CASTANHO

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets")
P, V, I = (os.path.join(BASE, d) for d in ("personagens", "vizinhas", "itens"))

# você de gesso no pé esquerdo (skin desbloqueada no capítulo 2)
eu = dict(next(c for c in CHARS if c["id"] == "pernalonga")); eu["gesso"] = True
sprites_hd.sheet(eu).save(os.path.join(P, "pernalonga_gesso.png"))

PESSOAS = [
    # a beudinha: cabelo bagunçado, regata desbotada, bermuda, chinelo; nome inventado, ninguém sabia o nome dela
    dict(id="beudinha", skin=MORENA2, hair=CASTANHO, hs="longo", hw=14, tw=14, th=15, lh=15, leg_w=3,
         shirt=(196, 176, 120), shorts=(70, 80, 110), sleeve="tank", pat="", feet=(60, 120, 200), expr="smirk"),
    # Geraldo: tiozão da rua que vivia consertando alguma máquina na calçada
    dict(id="geraldo", skin=MORENA, hair=GRISALHO, hs="zero", hw=14, tw=15, th=16, lh=15, leg_w=3,
         shirt=(70, 100, 150), shorts=(80, 74, 66), sleeve="short", pat="", feet=(50, 40, 34), expr="calm"),
]
for c in PESSOAS:
    sprites_hd.sheet(c).save(os.path.join(V, c["id"] + ".png"))

# Cezar de bike (bike azul), usando o mesmo gerador da bike do Matheus
import bike_hd as B
cz = next(c for c in CHARS if c["id"] == "cezar")
B.M = cz; B.SK, B.SKS = cz["skin"]; B.SHORTS = cz["shorts"]; B.TENIS = cz["skin"][1]
B.QUADRO, B.QUADRO_SOMBRA = (54, 110, 210), (34, 70, 150)
folha = Image.new("RGBA", (B.FW * B.N, B.FH * 3), (0, 0, 0, 0))
for n in range(B.N):
    folha.alpha_composite(B.quadro(n), (n * B.FW, 0))
    folha.alpha_composite(B.quadro_frente_costas(n, True), (n * B.FW, B.FH))
    folha.alpha_composite(B.quadro_frente_costas(n, False), (n * B.FW, B.FH * 2))
folha.save(os.path.join(P, "cezar_bike.png"))

O = (34, 22, 28)
# máquina do Geraldo: um motor velho (de cortador de grama) em cima de um caixote, com ferramentas
m = Image.new("RGBA", (96, 64), (0, 0, 0, 0)); d = ImageDraw.Draw(m)
d.rectangle([8, 36, 88, 62], fill=O); d.rectangle([10, 38, 86, 60], fill=(170, 120, 66))
d.line([(10, 48), (86, 48)], fill=(130, 88, 46), width=2)
d.rectangle([20, 10, 76, 38], fill=O); d.rectangle([22, 12, 74, 36], fill=(200, 60, 50))
d.rectangle([26, 16, 50, 30], fill=(60, 60, 64)); d.rectangle([54, 14, 72, 22], fill=(220, 210, 80))
for x in range(28, 48, 4): d.line([(x, 17), (x, 29)], fill=(110, 110, 116))
d.ellipse([60, 24, 72, 36], fill=(40, 40, 44)); d.line([(66, 22), (82, 6)], fill=(40, 40, 44), width=3)
d.rectangle([2, 56, 22, 60], fill=(150, 150, 160)); d.rectangle([74, 58, 94, 61], fill=(200, 60, 40))   # chave e alicate
m.save(os.path.join(I, "maquina.png"))
# caminhão de mudança
c = Image.new("RGBA", (300, 170), (0, 0, 0, 0)); d = ImageDraw.Draw(c)
d.rectangle([4, 20, 206, 142], fill=O); d.rectangle([7, 23, 203, 139], fill=(232, 228, 214))
d.rectangle([7, 120, 203, 139], fill=(200, 196, 182))
d.rectangle([200, 58, 292, 142], fill=O); d.rectangle([203, 61, 289, 139], fill=(220, 120, 40))
d.rectangle([236, 68, 282, 98], fill=(150, 200, 236)); d.rectangle([252, 104, 266, 107], fill=(60, 40, 30))
d.rectangle([16, 34, 190, 56], fill=(60, 110, 170)); d.text((52, 38), "MUDANCAS", fill=(240, 240, 240))
for x in (52, 240):
    d.ellipse([x - 24, 120, x + 24, 168], fill=O); d.ellipse([x - 19, 125, x + 19, 163], fill=(40, 40, 44)); d.ellipse([x - 8, 136, x + 8, 152], fill=(170, 170, 176))
c.save(os.path.join(I, "caminhao.png"))
# celular de botão (tijolinho) e pedaço de pau
cel = Image.new("RGBA", (12, 22), (0, 0, 0, 0)); d = ImageDraw.Draw(cel)
d.rectangle([0, 0, 11, 21], fill=O); d.rectangle([1, 1, 10, 20], fill=(70, 70, 80)); d.rectangle([2, 2, 9, 8], fill=(150, 210, 150))
for y in (11, 14, 17):
    for x in (2, 5, 8): d.point((x, y), fill=(200, 200, 210)); d.point((x + 1, y), fill=(200, 200, 210))
cel.save(os.path.join(I, "celular.png"))
pau = Image.new("RGBA", (14, 70), (0, 0, 0, 0)); d = ImageDraw.Draw(pau)
d.polygon([(4, 0), (10, 0), (11, 69), (3, 69)], fill=O); d.polygon([(5, 1), (9, 1), (10, 68), (4, 68)], fill=(140, 96, 54))
d.line([(6, 6), (6, 60)], fill=(170, 124, 76)); d.rectangle([2, 30, 5, 33], fill=(140, 96, 54))
pau.save(os.path.join(I, "pau.png"))
print("ok")
