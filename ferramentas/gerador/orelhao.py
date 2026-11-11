"""Toque do orelhão: trim-trim de telefone antigo + uma musiquinha 8-bit ORIGINAL (composta aqui, não é cópia de música nenhuma).
Gera assets/sons/orelhao.wav. Rodar: python orelhao.py
"""
import os, wave
import numpy as np

SR = 22050
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "sons", "orelhao.wav")


def t(d):
    return np.linspace(0, d, int(SR * d), endpoint=False)


def sq(f, d, duty=0.5):
    tt = t(d)
    return np.where((tt * f) % 1 < duty, 1.0, -1.0)


def env(x, a=0.004, r=0.04):
    e = np.ones(len(x))
    na, nr = max(1, int(SR * a)), max(1, int(SR * r))
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return x * e


def nota(n):  # número MIDI -> Hz
    return 440.0 * 2 ** ((n - 69) / 12)


def trim(d=0.9):
    """Campainha de telefone antigo: dois tons alternando bem rápido."""
    tt = t(d)
    f = np.where((tt * 22) % 1 < 0.5, 1180, 1380)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return env(np.sign(np.sin(ph)) * 0.35, 0.01, 0.05)


def bumbo(d=0.18):
    tt = t(d)
    f = 140 * np.exp(-tt * 22) + 45
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-tt * 14) * 0.9


def caixa(d=0.12):
    rng = np.random.default_rng(3)
    tt = t(d)
    return rng.uniform(-1, 1, len(tt)) * np.exp(-tt * 30) * 0.45


def mix_em(buf, som, pos):
    i = int(pos * SR)
    j = min(len(buf), i + len(som))
    buf[i:j] += som[: j - i]


def main():
    total = 7.6
    buf = np.zeros(int(SR * total))
    # 1) trim-trim... trim-trim
    mix_em(buf, trim(), 0.0)
    mix_em(buf, trim(), 1.3)
    # 2) musiquinha original: 2 compassos de batida + melodia pentatônica inventada
    ini, bpm = 2.6, 128
    s16 = 60 / bpm / 4                      # duração de uma semicolcheia
    batida_bumbo = [0, 3, 6, 8, 11, 14]     # posições (em semicolcheias) num compasso de 16
    batida_caixa = [4, 12]
    for c in range(2):
        base = ini + c * 16 * s16
        for k in batida_bumbo:
            mix_em(buf, bumbo(), base + k * s16)
        for k in batida_caixa:
            mix_em(buf, caixa(), base + k * s16)
    # melodia (nota MIDI, início em semicolcheias, duração em semicolcheias) — composta pra este jogo
    melodia = [(72, 0, 2), (75, 2, 2), (77, 4, 3), (75, 8, 1), (72, 9, 2), (70, 12, 4),
               (67, 16, 2), (70, 18, 2), (72, 20, 3), (75, 24, 2), (77, 26, 2), (79, 28, 4)]
    for n, k, dur in melodia:
        som = env(sq(nota(n), dur * s16 * 0.92, 0.25) * 0.22, 0.003, 0.03)
        mix_em(buf, som, ini + k * s16)
    # baixo simples acompanhando
    for k, n in ((0, 48), (8, 46), (16, 43), (24, 46)):
        som = env(sq(nota(n), 8 * s16 * 0.9, 0.5) * 0.16, 0.005, 0.06)
        mix_em(buf, som, ini + k * s16)
    buf = buf[: int(SR * (ini + 32 * s16 + 0.4))]
    buf = np.clip(buf, -1, 1)
    pcm = (buf * 32000).astype(np.int16)
    with wave.open(OUT, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("ok", OUT, round(len(buf) / SR, 2), "s")


if __name__ == "__main__":
    main()
