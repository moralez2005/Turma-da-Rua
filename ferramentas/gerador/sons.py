"""Efeitos sonoros retro sintetizados (WAV 22 kHz, mono). Todos originais, gerados por codigo."""
import os, wave
import numpy as np

SR = 22050
OUT = "/home/claude/jogo/assets/sons"
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def t(d):
    return np.linspace(0, d, int(SR * d), endpoint=False)


def env(x, a=0.005, r=None):
    n = len(x)
    e = np.ones(n)
    na = max(1, int(SR * a))
    e[:na] = np.linspace(0, 1, na)
    if r is None:
        e *= np.linspace(1, 0, n) ** 1.5
    else:
        nr = max(1, int(SR * r))
        e[-nr:] *= np.linspace(1, 0, nr)
    return x * e


def sq(f, d, duty=0.5):
    tt = t(d)
    return np.where((tt * f) % 1 < duty, 1.0, -1.0)


def sweep(f0, f1, d, kind="sq"):
    tt = t(d)
    f = np.linspace(f0, f1, len(tt))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sign(np.sin(ph)) if kind == "sq" else np.sin(ph)


def noise(d):
    return rng.uniform(-1, 1, int(SR * d))


def lp(x, k=0.2):
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += k * (v - acc)
        y[i] = acc
    return y


def seq(notes, d=0.09, duty=0.5, vol=0.5):
    out = []
    for n in notes:
        if n == 0:
            out.append(np.zeros(int(SR * d)))
        else:
            out.append(env(sq(n, d, duty), 0.003) * vol)
    return np.concatenate(out)


def mixa(*arrs):
    n = max(len(a) for a in arrs)
    out = np.zeros(n)
    for a in arrs:
        out[:len(a)] += a
    return out


def save(name, x, vol=0.6):
    x = np.asarray(x, dtype=float)
    m = np.max(np.abs(x)) or 1
    x = np.clip(x / m * vol, -1, 1)
    data = (x * 32767).astype(np.int16)
    with wave.open(f"{OUT}/{name}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())


N = {"C4": 262, "D4": 294, "E4": 330, "F4": 349, "G4": 392, "A4": 440, "B4": 494,
     "C5": 523, "D5": 587, "E5": 659, "F5": 698, "G5": 784, "A5": 880, "B5": 988, "C6": 1047}

# chute: batida grave + estalo
save("chute", mixa(env(sweep(180, 50, 0.12, "sin"), 0.001), 0.4 * env(lp(noise(0.05), 0.5), 0.001)), 0.8)
# passe: toque leve
save("passe", mixa(env(sweep(260, 120, 0.07, "sin"), 0.001), 0.2 * env(lp(noise(0.03), 0.6), 0.001)), 0.5)
# quique da bola
save("quique", env(sweep(140, 70, 0.08, "sin"), 0.001), 0.45)
# apito
tt = t(0.45)
ap = np.sin(2 * np.pi * (2800 + 120 * np.sin(2 * np.pi * 28 * tt)) * tt)
save("apito", env(ap, 0.01, 0.08), 0.35)
# gol: torcida (ruido filtrado) + fanfarra
_n = lp(noise(1.6), 0.08)
crowd = _n * (0.6 + 0.4 * np.sin(np.linspace(0, 9, len(_n))) ** 2)
fan = seq([N["C5"], N["E5"], N["G5"], N["C6"], 0, N["G5"], N["C6"]], 0.11, 0.25, 0.6)
mix_len = max(len(crowd), len(fan))
g = np.zeros(mix_len)
g[:len(crowd)] += env(crowd, 0.05, 0.4) * 0.8
g[:len(fan)] += fan
save("gol", g, 0.7)
# carro: motor + buzina
eng = sq(55, 1.4, 0.3) * 0.3 + lp(noise(1.4), 0.1) * 0.4
eng *= np.interp(np.arange(len(eng)), [0, len(eng) / 2, len(eng)], [0.2, 1, 0.1])
horn = np.concatenate([np.zeros(int(SR * 0.15)), env(sq(415, 0.18, 0.5) + sq(330, 0.18, 0.5), 0.005, 0.03),
                       np.zeros(int(SR * 0.05)), env(sq(415, 0.25, 0.5) + sq(330, 0.25, 0.5), 0.005, 0.05)])
c = np.zeros(len(eng)); c[:len(horn)] += horn * 0.5; c += eng
save("carro", c, 0.55)
# selecionar / clique / passar o mouse
save("clique", env(sq(880, 0.05, 0.25), 0.001) * 0.6, 0.4)
save("hover", env(sq(1320, 0.03, 0.5), 0.001) * 0.4, 0.25)
save("selecionar", seq([N["E5"], N["A5"], N["E5"] * 2], 0.06, 0.25), 0.45)
# maquina de escrever (balao)
save("tecla", mixa(env(lp(noise(0.02), 0.7), 0.001), 0.3 * env(sq(1800, 0.012), 0.001)), 0.25)
# pegar a bola
save("pegar", seq([N["G5"], N["C6"]], 0.05, 0.5), 0.4)
# arremesso (whoosh)
save("arremesso", env(lp(noise(0.25), 0.25) * np.linspace(0.2, 1, len(noise(0.25))), 0.01, 0.1), 0.5)
# queimado (acerto)
save("queimado", mixa(env(sweep(400, 90, 0.25), 0.002) * 0.7, 0.4 * env(lp(noise(0.08), 0.5), 0.001)), 0.6)
# alerta! (grito estilizado)
save("alerta", seq([N["A5"], 0, N["A5"], N["E5"] * 2], 0.08, 0.25, 0.7), 0.55)
# congelar
save("congelar", env(sweep(1500, 3000, 0.2, "sin") * np.sin(2 * np.pi * 30 * t(0.2))[:len(sweep(1500, 3000, 0.2, 'sin'))], 0.005), 0.4)
# contagem (bip) e "lá vou eu"
save("bip", env(sq(988, 0.08, 0.5), 0.002), 0.35)
save("la_vou_eu", seq([N["C5"], N["E5"], N["G5"], N["C6"]], 0.07, 0.5), 0.45)
# achou alguém / salvou
save("achou", seq([N["C6"], N["G5"], N["E5"]], 0.09, 0.25), 0.5)
save("salvou", seq([N["E5"], N["G5"], N["C6"], N["E5"] * 2], 0.08, 0.5), 0.5)
# passos agachado/mato (farfalhar)
save("mato", env(lp(noise(0.25), 0.35) * (0.5 + 0.5 * np.sin(np.linspace(0, 30, len(noise(0.25))))), 0.02, 0.1), 0.35)
# vitória e derrota
save("vitoria", seq([N["C5"], N["E5"], N["G5"], N["C6"], 0, N["A5"], N["C6"], N["E5"] * 2, N["E5"] * 2], 0.12, 0.25), 0.55)
save("derrota", seq([N["G4"] * 2, N["E5"], N["C5"], N["G4"], N["C4"]], 0.16, 0.5), 0.5)
# abertura: arpejo nostálgico lento (triangulo)
notes = [N["C5"], N["E5"], N["G5"], N["B5"], N["A5"], N["E5"], N["C5"], N["G4"] * 2]
out = []
for n in notes:
    tt = t(0.32)
    tri = 2 * np.abs(2 * ((tt * n) % 1) - 1) - 1
    out.append(env(tri, 0.01) * 0.6)
save("abertura", np.concatenate(out), 0.45)
# pulo do goleiro / dash / habilidade
save("habilidade", env(sweep(300, 1400, 0.18), 0.002) * 0.5, 0.45)
save("pulo", env(sweep(200, 700, 0.12), 0.002) * 0.5, 0.4)
print(sorted(os.listdir(OUT)))
