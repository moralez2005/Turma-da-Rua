"""Sprites dos personagens desbloqueáveis (Matheus, Guilherme e Manu), no mesmo formato da turma.
Rodar: python novos_hd.py  (gera assets/personagens/matheus.png, guilherme.png e manu.png)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sprites import S_LIGHT, S_LIGHT2, S_LT, H_DBROWN, H_BLOND, H_BLACK
import sprites_hd

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "personagens")

NOVOS = [
    # Matheus: altura do Lucas, boné preto pra frente, camiseta preta
    dict(id="matheus", nome="Matheus", skin=S_LIGHT2, hair=H_DBROWN, hs="curto", tw=13, th=13, lh=10,
         shirt=(34, 34, 40), sleeve="short", pat="", shorts=(52, 64, 96), feet=(230, 230, 230),
         expr="smirk", cap_frente=(26, 26, 34)),
    # Guilherme: altura do Lucas, orelhas grandes, cabelo castanho curto, camiseta cinza
    dict(id="guilherme", nome="Guilherme", skin=S_LIGHT, hair=H_DBROWN, hs="baguncado", tw=13, th=13, lh=10,
         shirt=(96, 100, 108), sleeve="short", pat="", shorts=(56, 96, 170), feet=(40, 40, 46),
         expr="smile", big_ears=True),
    # Manu: a menor da turma (menor que o Gabriel), loira de cabelo comprido, roupa rosa de manga comprida
    dict(id="manu", nome="Manu", skin=S_LIGHT, hair=H_BLOND, hs="longo", hw=12, tw=10, th=10, lh=5,
         shirt=(236, 130, 170), sleeve="long", pat="", shorts=(226, 120, 160), feet=(250, 200, 220),
         expr="smile"),
]

if __name__ == "__main__":
    for c in NOVOS:
        sprites_hd.sheet(c).save(os.path.join(OUT, c["id"] + ".png"))
    print("ok")
