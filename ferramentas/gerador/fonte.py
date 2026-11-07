"""Fonte bitmap pixelada (Unifont 16px, sem suavizacao) no formato AngelCode XML para o Phaser."""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = "/home/claude/jogo/assets/fonte"
os.makedirs(OUT, exist_ok=True)
FONT = "/usr/share/fonts/opentype/unifont/unifont_sample.otf"
chars = [chr(c) for c in range(32, 127)] + list("áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ°ºª…–—“”‘’•♪★←→↑↓♥♫▶◀▲▼●○✓✗·")
f = ImageFont.truetype(FONT, 16)
cols = 16
cw, ch = 18, 20
rows = (len(chars) + cols - 1) // cols
img = Image.new("RGBA", (cols * cw, rows * ch), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
d.fontmode = "1"
entries = []
for i, c in enumerate(chars):
    x, y = (i % cols) * cw, (i // cols) * ch
    try:
        adv = int(round(f.getlength(c)))
    except Exception:
        adv = 8
    # sombra de 1px (retro) + texto branco (o Phaser pinta com setTint)
    d.text((x + 1, y + 1 + 1), c, font=f, fill=(40, 24, 40, 255))
    d.text((x + 1, y + 1), c, font=f, fill=(255, 255, 255, 255))
    entries.append((ord(c), x, y, adv))
img.save(f"{OUT}/pixel.png")
lines = ['<?xml version="1.0"?>', "<font>",
         '<info face="pixel" size="16" bold="0" italic="0" charset="" unicode="1" stretchH="100" smooth="0" aa="0" padding="0,0,0,0" spacing="0,0"/>',
         f'<common lineHeight="18" base="15" scaleW="{img.width}" scaleH="{img.height}" pages="1" packed="0"/>',
         '<pages><page id="0" file="pixel.png"/></pages>', f'<chars count="{len(entries)}">']
for code, x, y, adv in entries:
    lines.append(f'<char id="{code}" x="{x}" y="{y}" width="{max(adv, 1) + 2}" height="{ch - 1}" xoffset="-1" yoffset="-1" xadvance="{adv}" page="0" chnl="15"/>')
lines += ["</chars>", "</font>"]
open(f"{OUT}/pixel.xml", "w", encoding="utf-8").write("\n".join(lines))
print("ok", img.size, len(entries))
