"""Spritesheets HD (80x136 por quadro) dos 7 meninos para o jogo em 960x540.
Linhas: 0 frente/baixo, 1 esquerda, 2 direita, 3 costas/cima, 4 extras (agachado frente, agachado costas, piscando, falando).
Colunas: 4 quadros."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageOps
from sprites import CHARS, detailed, up, label
from sprites4 import side
from hd import scale2x, hd_refine

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "personagens")
os.makedirs(OUT, exist_ok=True)
FW, FH = 80, 136


def hd(c, img):
    return hd_refine(scale2x(img), c, rim=None)


COLS, ROWS = 8, 7
BOLA_QUEIMADA = (214, 52, 52)


def _sobe(img, dy):
    """desloca o quadro pra cima (sobe-e-desce da passada)."""
    if not dy:
        return img
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(img, (0, -dy))
    return out


def sheet(c, seed=3):
    """Folha 8x7 (quadros de 80x136):
    linha 0 frente, 1 esquerda, 2 direita, 3 costas — 8 quadros de passo cada, com sobe-e-desce;
    linha 4: agachado frente, agachado costas, piscando, falando;
    linha 5: arremesso pra direita (segura, prepara, prepara+, solta, acompanha, agarra);
    linha 6: o mesmo pra esquerda."""
    import math
    s = Image.new("RGBA", (FW * COLS, FH * ROWS), (0, 0, 0, 0))
    for col in range(COLS):
        f = col / COLS
        sobe = round(abs(math.sin(2 * math.pi * f)) * 3)
        s.paste(_sobe(hd(c, detailed(c, "stand", seed=seed, fase=f)), sobe), (col * FW, 0))
        r = _sobe(hd(c, side(c, fase=f)), sobe)
        s.paste(ImageOps.mirror(r), (col * FW, FH))
        s.paste(r, (col * FW, FH * 2))
        s.paste(_sobe(hd(c, detailed(c, "stand", seed=seed, fase=f, view="back")), sobe), (col * FW, FH * 3))
    extras = [detailed(c, "sit", seed=seed), detailed(c, "sit", seed=seed, view="back"),
              detailed(c, "stand", seed=seed, blink=True), detailed(c, "stand", seed=seed, talk=True)]
    for col, e in enumerate(extras):
        s.paste(hd(c, e), (col * FW, FH * 4))
    # arremesso: (ângulo do braço, bola na mão?)
    poses = [(110, True), (165, True), (200, True), (70, False), (35, False), (95, False)]
    for col, (ang, bola) in enumerate(poses):
        r = hd(c, side(c, fase=0.12 if col in (3, 4) else 0, braco=ang, bola=BOLA_QUEIMADA if bola else None))
        s.paste(r, (col * FW, FH * 5))
        s.paste(ImageOps.mirror(r), (col * FW, FH * 6))
    return s


if __name__ == "__main__":
    prev = Image.new("RGBA", (7 * 340 + 20, FH * 5 + 60), (46, 38, 58, 255))
    for i, c in enumerate(CHARS):
        sh = sheet(c)
        sh.save(f"{OUT}/{c['id']}.png")
        prev.alpha_composite(sh, (20 + i * 340, 40))
    prev.save("/tmp/prev_hd_sheets.png")
    print("ok")
