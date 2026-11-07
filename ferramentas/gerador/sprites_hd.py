"""Spritesheets HD (80x136 por quadro) dos 7 meninos para o jogo em 960x540.
Linhas: 0 frente/baixo, 1 esquerda, 2 direita, 3 costas/cima, 4 extras (agachado frente, agachado costas, piscando, falando).
Colunas: 4 quadros."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageOps
from sprites import CHARS, detailed, up, label
from sprites4 import side
from hd import scale2x, hd_refine

OUT = "/home/claude/jogo/assets/personagens"
os.makedirs(OUT, exist_ok=True)
FW, FH = 80, 136


def hd(c, img):
    return hd_refine(scale2x(img), c, rim=None)


def sheet(c, seed=3):
    s = Image.new("RGBA", (FW * 4, FH * 5), (0, 0, 0, 0))
    seq = [0, 1, 0, 2]
    for col, f in enumerate(seq):
        s.paste(hd(c, detailed(c, "stand", seed=seed, frame=f)), (col * FW, 0))
    for col, f in enumerate([0, 1, 3, 2]):
        r = hd(c, side(c, f))
        s.paste(ImageOps.mirror(r), (col * FW, FH))
        s.paste(r, (col * FW, FH * 2))
    for col, f in enumerate(seq):
        s.paste(hd(c, detailed(c, "stand", seed=seed, frame=f, view="back")), (col * FW, FH * 3))
    extras = [detailed(c, "sit", seed=seed), detailed(c, "sit", seed=seed, view="back"),
              detailed(c, "stand", seed=seed, blink=True), detailed(c, "stand", seed=seed, talk=True)]
    for col, e in enumerate(extras):
        s.paste(hd(c, e), (col * FW, FH * 4))
    return s


if __name__ == "__main__":
    prev = Image.new("RGBA", (7 * 340 + 20, FH * 5 + 60), (46, 38, 58, 255))
    for i, c in enumerate(CHARS):
        sh = sheet(c)
        sh.save(f"{OUT}/{c['id']}.png")
        prev.alpha_composite(sh, (20 + i * 340, 40))
    prev.save("/tmp/prev_hd_sheets.png")
    print("ok")
