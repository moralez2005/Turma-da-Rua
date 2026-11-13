"""Sprites das vizinhas e da família (mesmo gerador e mesmo acabamento dos meninos).
Rodar: python vizinhas_hd.py  (gera assets/vizinhas/tita.png, marido.png, vera.png e filha.png)
Os nomes no jogo são inventados; o visual veio da descrição do Kauã.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sprites_hd

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "vizinhas")
os.makedirs(OUT, exist_ok=True)

MORENA = ((198, 138, 94), (163, 104, 68))
MORENA2 = ((186, 126, 86), (150, 96, 62))
BRANCO = ((244, 206, 176), (214, 170, 140))
BRANCA_ROSADA = ((240, 196, 168), (208, 160, 132))
PRETO = ((30, 24, 24), (58, 46, 46))
GRISALHO = ((176, 176, 180), (214, 214, 218))
CASTANHO = ((96, 62, 40), (132, 92, 62))

PESSOAS = [
    # Dona Tita: uns 60, morena, de óculos, gordinha, cabelo ainda preto, preso; vestido florido
    dict(id="tita", skin=MORENA, hair=PRETO, hs="coque", hw=15, tw=17, th=15, lh=13, leg_w=3,
         shirt=(226, 100, 140), shorts=(214, 92, 130), vestido=True, saia=8, sleeve="short", pat="floral",
         feet=(120, 80, 60), expr="smile", oculos=(40, 30, 30)),
    # o marido: uns 70, magro, branco, grisalho, calado; camisa de botão e calça
    dict(id="marido", skin=BRANCO, hair=GRISALHO, hs="curto", hw=13, tw=11, th=16, lh=17, leg_w=2,
         shirt=(214, 206, 180), shorts=(92, 82, 66), sleeve="short", pat="",
         feet=(60, 46, 40), expr="calm"),
    # Dona Vera: quarenta e poucos, morena, óculos de armação roxa, sem paciência
    dict(id="vera", skin=MORENA2, hair=CASTANHO, hs="longo", hw=14, tw=14, th=15, lh=15, leg_w=3,
         shirt=(146, 98, 206), shorts=(58, 70, 110), sleeve="short", pat="",
         feet=(230, 230, 230), expr="smirk", oculos=(150, 60, 220)),
    # a filha da Dona Vera: uns 30, branca, gordinha, quieta... e fura a bola
    dict(id="filha", skin=BRANCA_ROSADA, hair=CASTANHO, hs="coque", hw=15, tw=16, th=15, lh=14, leg_w=3,
         shirt=(86, 86, 96), shorts=(44, 44, 54), sleeve="short", pat="",
         feet=(30, 30, 30), expr="calm"),
]

if __name__ == "__main__":
    for c in PESSOAS:
        sprites_hd.sheet(c).save(os.path.join(OUT, c["id"] + ".png"))
    print("ok")
