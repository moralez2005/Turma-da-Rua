"""Som de chuva (ruído filtrado + pingos), gerado por código. Gera assets/sons/chuva.wav (dá pra tocar em loop).
Rodar: python chuva.py
"""
import os, wave
import numpy as np

SR = 22050
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "sons", "chuva.wav")


def main():
    rng = np.random.default_rng(11)
    d = 4.0
    n = int(SR * d)
    x = rng.uniform(-1, 1, n)
    # passa-baixa simples (média móvel) pro chiado ficar macio
    k = 6
    x = np.convolve(x, np.ones(k) / k, mode="same")
    x *= 0.35 + 0.08 * np.sin(np.linspace(0, 2 * np.pi * 3, n))   # chuva que vai e volta
    # pingos curtos espalhados
    for _ in range(140):
        i = rng.integers(0, n - 400)
        f = rng.uniform(1800, 3200)
        tt = np.arange(300) / SR
        x[i:i + 300] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 90) * rng.uniform(0.05, 0.15)
    # emenda suave pro loop não dar estalo
    m = int(SR * 0.15)
    x[:m] *= np.linspace(0, 1, m); x[-m:] *= np.linspace(1, 0, m)
    x = np.clip(x, -1, 1)
    with wave.open(OUT, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 30000).astype(np.int16).tobytes())
    print("ok", OUT)


if __name__ == "__main__":
    main()
