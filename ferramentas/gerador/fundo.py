"""Música de fundo 8-bit ORIGINAL do jogo ("Tarde na Rua"): tranquila e nostálgica, composta aqui.
Não é versão de nenhuma música existente. Gera assets/sons/fundo.wav (loop de ~30 s).
Rodar: python fundo.py
"""
import os, wave
import numpy as np

SR = 22050
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "sons", "fundo.wav")
BPM = 84
BEAT = 60 / BPM


def hz(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def onda(f, d, duty=0.5, tri=False):
    t = np.arange(int(SR * d)) / SR
    if tri:
        ph = (t * f) % 1
        return 4 * np.abs(ph - 0.5) - 1
    return np.where((t * f) % 1 < duty, 1.0, -1.0)


def env(x, a=0.01, r=0.12, sustain=0.75):
    n = len(x)
    e = np.full(n, sustain)
    na, nr = max(1, int(SR * a)), max(1, int(SR * r))
    e[:na] = np.linspace(0, 1, na)
    e[na:na + nr] = np.linspace(1, sustain, min(nr, max(0, n - na)))
    e[-nr:] *= np.linspace(1, 0, nr)
    return x * e


def poe(buf, som, t):
    i = int(t * SR)
    j = min(len(buf), i + len(som))
    if i < len(buf):
        buf[i:j] += som[: j - i]


# Progressão (8 compassos de 4 tempos), em notas MIDI da fundamental de cada acorde.
# Fá maior, balanço tranquilo de fim de tarde: F - Am - Bb - C - Dm - Bb - Gm - C
ACORDES = [(53, [0, 4, 7]), (57, [0, 3, 7]), (58, [0, 4, 7]), (60, [0, 4, 7]),
           (50, [0, 3, 7]), (58, [0, 4, 7]), (55, [0, 3, 7]), (60, [0, 4, 7])]

# Melodia composta pra este jogo ("Tarde na Rua"): (nota MIDI, início em tempos, duração em tempos)
MELODIA = [
    (72, 0, 1), (69, 1, 1), (72, 2, 0.5), (74, 2.5, 1.5),
    (76, 4, 1), (72, 5, 0.5), (69, 5.5, 2.5),
    (70, 8, 0.5), (74, 8.5, 0.5), (77, 9, 2), (74, 11, 1),
    (72, 12, 2.5), (79, 14.5, 0.5), (77, 15, 1),
    (74, 16, 1), (77, 17, 1), (81, 18, 1.5), (79, 19.5, 0.5),
    (77, 20, 1), (74, 21, 1), (70, 22, 2),
    (67, 24, 1), (70, 25, 0.5), (74, 25.5, 1.5), (72, 27, 1),
    (72, 28, 1), (76, 29, 1), (77, 30, 2),
]


def main():
    compassos = len(ACORDES)
    total = compassos * 4 * BEAT
    buf = np.zeros(int(SR * total) + SR)
    for c, (raiz, forma) in enumerate(ACORDES):
        t0 = c * 4 * BEAT
        # baixo em onda triangular (macio)
        for b in (0, 2):
            poe(buf, env(onda(hz(raiz - 12), BEAT * 1.9, tri=True) * 0.28, 0.01, 0.2), t0 + b * BEAT)
        # arpejo suave em onda quadrada fininha
        notas = [raiz + 12 + k for k in forma] + [raiz + 24]
        for i in range(8):
            n = notas[[0, 1, 2, 3, 2, 1, 2, 1][i]]
            poe(buf, env(onda(hz(n), BEAT * 0.45, duty=0.125) * 0.07, 0.005, 0.08, 0.5), t0 + i * BEAT / 2)
    for n, ini, dur in MELODIA:
        som = env(onda(hz(n), dur * BEAT * 0.95, duty=0.25) * 0.13, 0.01, 0.15)
        # vibrato leve nas notas longas
        if dur >= 2:
            t = np.arange(len(som)) / SR
            som *= 1 + 0.06 * np.sin(2 * np.pi * 5 * t)
        poe(buf, som, ini * BEAT)
    buf = buf[: int(SR * total)]
    m = int(SR * 0.05)
    buf[:m] *= np.linspace(0, 1, m); buf[-m:] *= np.linspace(1, 0, m)
    buf = np.clip(buf, -1, 1)
    with wave.open(OUT, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((buf * 30000).astype(np.int16).tobytes())
    print("ok", OUT, round(total, 1), "s")


if __name__ == "__main__":
    main()
