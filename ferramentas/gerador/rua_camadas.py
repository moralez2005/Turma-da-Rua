"""Separa a rua em camadas pro ciclo do dia: rua sem o céu (o jogo desenha o céu e o sol atrás das casas)
e a posição de cada janela (pra acender uma por uma). Gera assets/cenarios/rua_sem_ceu.png e rua_luzes.json.
Rodar: python rua_camadas.py
"""
import os, json
from PIL import Image

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "cenarios")
im = Image.open(os.path.join(R, "rua.png")).convert("RGBA")
px = im.load(); W, H = im.size
vidro = set()
for y in range(H):
    for x in range(W):
        r, g, b, a = px[x, y]
        if y < 75 and ((b > 200 and b > r + 50) or (r > 235 and g > 235 and b > 235)):
            px[x, y] = (0, 0, 0, 0)                      # céu vira transparente
        elif abs(r - 84) < 8 and abs(g - 110) < 8 and abs(b - 140) < 8:
            vidro.add((x, y))
im.save(os.path.join(R, "rua_sem_ceu.png"))
# agrupa o vidro em janelas (retângulos)
janelas, vis = [], set()
for p in sorted(vidro):
    if p in vis:
        continue
    pilha, pts = [p], []
    while pilha:
        q = pilha.pop()
        if q in vis or q not in vidro:
            continue
        vis.add(q); pts.append(q)
        x, y = q
        pilha += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1), (x + 2, y), (x, y + 2)]
    if len(pts) > 30:
        xs = [a for a, _ in pts]; ys = [b for _, b in pts]
        janelas.append([min(xs), min(ys), max(xs), max(ys)])
# junta pedaços da mesma janela (a grade divide o vidro)
mud = True
while mud:
    mud = False
    for i in range(len(janelas)):
        for j in range(i + 1, len(janelas)):
            a, b = janelas[i], janelas[j]
            if a[0] - 6 <= b[2] and b[0] - 6 <= a[2] and a[1] - 6 <= b[3] and b[1] - 6 <= a[3]:
                janelas[i] = [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]; janelas.pop(j); mud = True; break
        if mud:
            break
json.dump({"janelas": janelas, "poste": [584, 46]}, open(os.path.join(R, "rua_luzes.json"), "w"))
print("ok", len(janelas), "janelas")
