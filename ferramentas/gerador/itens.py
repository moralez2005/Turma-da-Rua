"""JBLs, ícones das brincadeiras, logo, pipa, vira-lata caramelo, nuvem de balão, bola."""
import os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from bg960 import Pic, mix, dark
from esconde_hd import to_rgba, outline, obj_canvas

OUT = "/home/claude/jogo/assets/itens"
os.makedirs(OUT, exist_ok=True)


def save2(im, name, k=2):
    im.resize((im.width * k, im.height * k), Image.NEAREST).save(f"{OUT}/{name}.png")


def jbl(body, accent, frames=2):
    sheet = Image.new("RGBA", (36 * frames, 26), (0, 0, 0, 0))
    for f in range(frames):
        p = obj_canvas(36, 26)
        p.rect(2, 4, 33, 22, body)
        p.ellipse(2, 13, 3, 9, dark(body, 0.8)); p.ellipse(33, 13, 3, 9, dark(body, 0.8))
        r = 6 + f
        for cx in (11, 25):
            p.ellipse(cx, 13, r, r, (30, 30, 34)); p.ellipse(cx, 13, r - 2, r - 2, (60, 60, 66))
            p.ellipse(cx, 13, 2, 2, accent)
        p.rect(14, 2, 22, 4, (220, 220, 220)); p.rect(15, 3, 21, 3, accent)
        p.rect(4, 22, 32, 23, dark(body, 0.6))
        im = outline(to_rgba(p))
        sheet.alpha_composite(im, (36 * f, 0))
    return sheet


def token(kind):
    p = obj_canvas(28, 28)
    if kind == "futebol":
        p.ellipse(14, 14, 12, 12, (246, 246, 246))
        for (x, y) in ((14, 14), (7, 9), (21, 9), (8, 20), (20, 20)):
            p.ellipse(x, y, 3, 3, (30, 30, 34))
        p.ellipse(10, 9, 3, 2, (255, 255, 255))
    elif kind == "esconde":
        p.ellipse(14, 14, 12, 8, (250, 250, 250)); p.ellipse(14, 14, 6, 6, (70, 120, 60)); p.ellipse(14, 14, 3, 3, (20, 20, 20))
        p.ellipse(12, 12, 1, 1, (255, 255, 255))
        for k in range(-10, 11, 4):
            p.rect(14 + k, 3 + abs(k) // 3, 14 + k, 5 + abs(k) // 3, (40, 30, 30))
    elif kind == "queimada":
        p.ellipse(14, 14, 12, 12, (220, 60, 50))
        p.rect(2, 13, 26, 14, (255, 220, 200)); p.ellipse(10, 9, 4, 3, (255, 140, 120))
    elif kind == "alerta":
        p.ellipse(14, 14, 12, 12, (250, 200, 40))
        p.rect(12, 5, 16, 17, (40, 30, 30)); p.rect(12, 20, 16, 23, (40, 30, 30))
    elif kind == "fim":
        p.ellipse(14, 18, 12, 12, (250, 150, 60)); p.rect(1, 18, 27, 27, (255, 0, 255))
        p.ellipse(14, 18, 8, 8, (255, 214, 120)); p.rect(1, 18, 27, 27, (255, 0, 255))
        for y, w in ((20, 24), (23, 18), (26, 12)):
            p.rect(14 - w // 2, y, 14 + w // 2, y + 1, (240, 120, 70))
    return outline(to_rgba(p))


def pipa():
    p = obj_canvas(40, 70)
    pts = [(20, 2), (36, 20), (20, 44), (4, 20)]
    for y in range(2, 45):
        for x in range(4, 37):
            # dentro do losango
            if abs(x - 20) / 16 + abs(y - 20) / (18 if y < 20 else 24) <= 1:
                p.px(x, y, (230, 60, 60) if x < 20 else (250, 210, 50))
    p.rect(20, 2, 20, 44, (90, 60, 30)); p.rect(4, 20, 36, 20, (90, 60, 30))
    for k in range(25):
        x = 20 + int(4 * math.sin(k / 3))
        p.px(x, 45 + k, (90, 60, 30))
        if k % 6 == 3:
            p.rect(x - 2, 45 + k, x + 2, 46 + k, (60, 140, 220))
    return outline(to_rgba(p))


def caramelo(frames=4):
    sheet = Image.new("RGBA", (40 * frames, 30), (0, 0, 0, 0))
    for f in range(frames):
        p = obj_canvas(40, 30)
        c, cd = (206, 146, 74), (170, 112, 52)
        p.rect(8, 10, 30, 20, c)
        p.rect(28, 6, 37, 15, c); p.rect(30, 3, 33, 7, cd); p.px(34, 9, (30, 20, 20)); p.rect(37, 11, 38, 12, (40, 30, 30))
        p.rect(3, 7 - (f % 2), 8, 10, c)  # rabo
        legs = [(10, 20), (14, 20), (24, 20), (28, 20)]
        for i, (lx, ly) in enumerate(legs):
            off = (1 if (i + f) % 2 else -1) if f in (1, 3) else 0
            p.rect(lx + off, ly, lx + off + 2, ly + 7, cd)
        p.rect(14, 18, 24, 20, (240, 220, 190))
        sheet.alpha_composite(outline(to_rgba(p)), (40 * f, 0))
    return sheet


def bola():
    p = obj_canvas(12, 12)
    p.ellipse(6, 6, 5, 5, (246, 246, 246))
    p.px(4, 4, (220, 60, 60)); p.px(7, 7, (60, 90, 220)); p.px(7, 3, (240, 200, 40)); p.px(3, 7, (60, 170, 80))
    return outline(to_rgba(p))


def bola_queimada():
    p = obj_canvas(14, 14)
    p.ellipse(7, 7, 6, 6, (226, 64, 52)); p.rect(1, 6, 13, 7, (255, 220, 200)); p.px(4, 4, (255, 160, 140))
    return outline(to_rgba(p))


def logo():
    txt1, txt2 = "A TURMA", "DA RUA"
    f = ImageFont.truetype("/usr/share/fonts/opentype/unifont/unifont_sample.otf", 16)
    W, H = 200, 60
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im); d.fontmode = "1"
    for (txt, y, size) in ((txt1, 2, 1), (txt2, 26, 1)):
        tw = d.textlength(txt, font=f)
        x = (W - tw * 1) / 2
        d.text((x, y), txt, font=f, fill=(255, 255, 255, 255))
    a = np.array(im)
    # escala x2 por linha de texto e aplica degradê amarelo->laranja
    im2 = Image.fromarray(a); im2 = im2.crop(im2.getbbox())
    big = im2.resize((im2.width * 4, im2.height * 4), Image.NEAREST)
    b = np.array(big).astype(np.float32)
    mask = b[:, :, 3] > 0
    ys = np.arange(b.shape[0])[:, None].repeat(b.shape[1], 1)
    t = ((ys % 96) / 96.0)
    col = np.stack([255 - 10 * t, 228 - 120 * t, 90 - 70 * t], -1)
    b[mask, :3] = col[mask]
    big = Image.fromarray(b.astype(np.uint8), "RGBA")
    # contorno grosso + sombra
    out = Image.new("RGBA", (big.width + 20, big.height + 22), (0, 0, 0, 0))
    al = np.array(big)[:, :, 3] > 0
    shadow = Image.new("RGBA", big.size, (60, 20, 40, 255)); shadow.putalpha(Image.fromarray((al * 255).astype(np.uint8)))
    ol = Image.new("RGBA", big.size, (30, 16, 30, 255)); ol.putalpha(Image.fromarray((al * 255).astype(np.uint8)))
    out.alpha_composite(shadow, (10, 14))
    for dx in (-4, 0, 4):
        for dy in (-4, 0, 4):
            out.alpha_composite(ol, (8 + dx, 8 + dy))
    out.alpha_composite(big, (8, 8))
    return out


if __name__ == "__main__":
    jbl((200, 40, 46), (255, 210, 80)).save(f"{OUT}/jbl_lucas.png")      # vermelha
    jbl((34, 34, 40), (70, 160, 255)).save(f"{OUT}/jbl_pedro.png")       # preta com led azul
    for k in ("futebol", "esconde", "queimada", "alerta", "fim"):
        save2(token(k), f"token_{k}")
    save2(pipa(), "pipa")
    caramelo().save(f"{OUT}/caramelo.png")
    bola().save(f"{OUT}/bola.png")
    bola_queimada().save(f"{OUT}/bola_queimada.png")
    logo().save(f"{OUT}/logo.png")
    prev = Image.new("RGBA", (640, 260), (60, 50, 70, 255))
    prev.alpha_composite(Image.open(f"{OUT}/logo.png"), (10, 10))
    x = 10
    for n in ("token_futebol", "token_esconde", "token_queimada", "token_alerta", "token_fim", "pipa"):
        im = Image.open(f"{OUT}/{n}.png"); prev.alpha_composite(im, (x, 150)); x += im.width + 10
    prev.alpha_composite(Image.open(f"{OUT}/jbl_lucas.png").resize((144, 52), Image.NEAREST), (430, 20))
    prev.alpha_composite(Image.open(f"{OUT}/jbl_pedro.png").resize((144, 52), Image.NEAREST), (430, 80))
    prev.alpha_composite(Image.open(f"{OUT}/caramelo.png").resize((320, 60), Image.NEAREST), (300, 190))
    prev.save("/tmp/itens_prev.png")
    print("ok")
