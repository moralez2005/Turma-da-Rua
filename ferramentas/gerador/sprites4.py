"""Spritesheets de 4 direcoes (frente, esquerda, direita, costas) x 4 quadros de corrida, 40x68 cada.
Linha 0 = baixo (frente), 1 = esquerda, 2 = direita, 3 = cima (costas). Colunas = quadros 0..3."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageOps
from sprites import CHARS, Canvas, detailed, dark, mix, camo_color, up, label

OUT_DIR = "/home/claude/turma-da-rua/assets/personagens/jogo"


def side(c, frame=0):
    """Perfil olhando para a direita."""
    cv = Canvas(40, 68)
    sk, sks = c["skin"]
    hc, hl = c["hair"]
    cx, bottom = 20, 66
    lh = c["lh"]
    chubby = c["tw"] >= 16
    tw = 12 if chubby else (9 if c["tw"] <= 11 else 10)
    th = c["th"]
    feet = c["feet"]
    fcol = sk if feet == "descalco" else feet
    stride = {0: 0, 1: 4, 2: -4, 3: 0}[frame]
    lift = {0: 0, 1: 1, 2: 1, 3: 0}[frame]

    def shorts_col(x, y):
        return camo_color(x, y) if c["shorts"] == "camo" else c["shorts"]

    # perna de tras (mais escura) e da frente
    for k, (dx, col, lf) in enumerate(((-stride, sks, 0), (stride, sk, lift))):
        x0 = cx - 2 + dx // 2
        ly0 = bottom - 1 - lh
        cv.r(x0, ly0, x0 + 3, bottom - 2 - lf, col)
        cv.r(x0, bottom - 1 - lf, x0 + 6, bottom - 1 - lf, fcol if feet != "descalco" else col)
        cv.r(x0 + 1, bottom - 2 - lf, x0 + 5, bottom - 2 - lf, col)
    ly0 = bottom - 1 - lh
    sy1 = ly0 + 2
    sy0 = sy1 - 5
    tx0 = cx - tw // 2
    tx1 = tx0 + tw - 1
    for y in range(sy0, sy1 + 1):
        for x in range(tx0, tx1 + 1):
            cv.p(x, y, shorts_col(x, y))
    ty0 = sy0 - th
    shirt = c["shirt"]
    cv.r(tx0, ty0, tx1, sy0, shirt)
    if chubby:
        cv.r(tx1 + 1, ty0 + 5, tx1 + 2, sy0 - 1, shirt)  # barriga
    if c["pat"] == "floral":
        for (x, y) in ((tx0 + 2, ty0 + 2), (tx0 + 6, ty0 + 4), (tx0 + 3, ty0 + 7), (tx0 + 7, ty0 + 9), (tx0 + 1, ty0 + 11)):
            cv.p(x, y, (52, 52, 58))
    if c["pat"] == "jersey":
        cv.r(tx0 + 3, ty0, tx0 + 4, sy0, (255, 255, 255))
    cv.r(tx0, ty0 + 1, tx0, sy0, dark(shirt, 0.82))
    # braco da frente balancando
    swing = {0: 0, 1: -3, 2: 3, 3: 0}[frame]
    ax = cx - 1 + swing // 2
    for y in range(ty0 + 1, sy0 + 3):
        k = (y - ty0) / max(1, (sy0 + 2 - ty0))
        x = ax + int(swing * k)
        if c["sleeve"] == "long":
            col = shirt if y < sy0 + 1 else sk
        elif c["sleeve"] == "short":
            col = shirt if y < ty0 + 5 else sk
        else:
            col = sk
        cv.r(x, y, x + 2, y, col)
    # pescoco e cabeca (perfil)
    cv.r(cx - 1, ty0 - 2, cx + 2, ty0 - 1, sks)
    hw = 13 if chubby else 12
    hh = 14
    hx0 = cx - hw // 2 + 1
    hx1 = hx0 + hw - 1
    hy1 = ty0 - 2
    hy0 = hy1 - hh + 1
    cv.r(hx0, hy0, hx1, hy1, sk)
    for (x, y) in ((hx0, hy0), (hx1, hy0), (hx0, hy1), (hx1, hy1), (hx0 + 1, hy1)):
        cv.clear(x, y)
    cv.p(hx1 + 1, hy0 + 9, sk)            # nariz
    eye_y = hy0 + 8
    ex = hx1 - 3
    cv.r(ex, eye_y, ex, eye_y + 1, (28, 20, 24))
    cv.r(ex - 1, eye_y - 2, ex + 1, eye_y - 2, hc)
    cv.r(hx1 - 3, hy0 + 12, hx1 - 1, hy0 + 12, (90, 34, 40))  # boca
    cv.r(hx0 + 1, hy1 - 1, hx1 - 1, hy1 - 1, mix(sk, sks, 0.5))
    # orelha
    ear_x = hx0 + 4
    big = c.get("big_ears")
    cv.r(ear_x, eye_y - (1 if big else 0), ear_x + (2 if big else 1), eye_y + 3, sks)
    # cabelo: topo e nuca
    if c["hs"] == "zero":
        cv.r(hx0, hy0 - 1, hx1 - 1, hy0 + 1, hc)
        cv.r(hx0, hy0 + 2, hx0 + 2, hy0 + 6, hc)
    else:
        cv.r(hx0, hy0 - 1, hx1, hy0 + 2, hc)
        cv.r(hx0, hy0 + 3, hx0 + 3, hy0 + 9, hc)
        if c["hs"] in ("franja", "baguncado"):
            cv.r(hx1 - 5, hy0 + 3, hx1, hy0 + 4, hc)
        if c["hs"] == "espetado":
            for x in range(hx0 + 1, hx1, 3):
                cv.p(x, hy0 - 2, hc)
        if c["hs"] == "topete":
            cv.r(hx0 + 3, hy0 - 2, hx1 - 1, hy0 - 2, hc)
        if c["hs"] == "longo":
            cv.r(hx0 - 1, hy0 + 3, hx0 + 4, hy1 + 5, hc)
            cv.r(hx1 - 5, hy0 + 3, hx1, hy0 + 4, hc)
        for x in range(hx0 + 2, hx1 - 2, 3):
            cv.p(x, hy0, hl)
    cv.clear(hx1, hy0 - 1)
    if c.get("cap_frente"):
        cv.r(hx0, hy0 - 3, hx1, hy0 + 2, c["cap_frente"])
        cv.r(hx1 - 1, hy0 + 2, hx1 + 5, hy0 + 3, dark(c["cap_frente"], 0.7))   # aba pra frente
    if c.get("cap"):
        cv.r(hx0, hy0 - 2, hx1, hy0 + 2, c["cap"])
        cv.r(hx0 - 4, hy0 + 1, hx0 - 1, hy0 + 2, dark(c["cap"], 0.85))  # aba pra tras
    if c.get("juliet"):
        cv.r(ex - 2, eye_y - 1, hx1 + 1, eye_y - 1, (40, 40, 52))
        cv.r(ex - 1, eye_y, hx1, eye_y + 1, (90, 110, 230))
        cv.p(hx1, eye_y, (240, 140, 60))
    cv.outline()
    return cv.img


def sheet(c, seed=3):
    W, H = 40, 68
    img = Image.new("RGBA", (W * 4, H * 4), (0, 0, 0, 0))
    seq = [0, 1, 0, 2]
    for col, f in enumerate(seq):
        img.paste(detailed(c, "stand", seed=seed, frame=f), (col * W, 0))
    for col, f in enumerate([0, 1, 3, 2]):
        r = side(c, f)
        img.paste(ImageOps.mirror(r), (col * W, H))
        img.paste(r, (col * W, H * 2))
    for col, f in enumerate(seq):
        img.paste(detailed(c, "stand", seed=seed, frame=f, view="back"), (col * W, H * 3))
    return img


if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    big = Image.new("RGBA", (160 * 7 * 2 + 40, 272 * 2 + 60), (46, 38, 58, 255))
    for i, c in enumerate(CHARS):
        s = sheet(c)
        s.save(f"{OUT_DIR}/{c['id']}_4dir_40x68.png")
        big.alpha_composite(up(s, 2), (20 + i * 320, 40))
    big.save("/home/claude/rua_assets_v2/preview/preview_sprites_4dir.png")
    print("ok")
