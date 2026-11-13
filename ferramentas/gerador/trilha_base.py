"""Três amostras lofi originais para A Turma da Rua (tudo sintetizado aqui, sem samples de ninguém)."""
import numpy as np, subprocess, os
from scipy.signal import butter, sosfilt

SR = 44100
rng = np.random.default_rng(7)
NOTE = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}


def hz(nome):
    n, o = nome[:-1], int(nome[-1])
    return 440 * 2 ** ((NOTE[n] + 12 * (o + 1) - 69) / 12)


def lp(x, f, o=2):
    return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, o=2):
    return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)


def env(n, a=0.005, d=1.2):
    t = np.arange(n) / SR
    e = np.exp(-t / d)
    na = int(a * SR)
    e[:na] *= np.linspace(0, 1, na)
    return e


def rhodes(f, dur, vel=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    wob = 1 + 0.0025 * np.sin(2 * np.pi * 0.6 * t)          # fita meio gasta
    ph = 2 * np.pi * f * np.cumsum(wob) / SR
    s = np.sin(ph + 0.8 * env(n, 0.001, 0.25) * np.sin(2 * ph)) + 0.25 * np.sin(2 * ph) * env(n, 0.001, 0.5)
    s *= env(n, 0.004, 1.6) * (1 + 0.15 * np.sin(2 * np.pi * 4.5 * t))
    return s * vel


def caixinha(f, dur, vel=0.3):   # caixinha de música
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 4.02 * t) * env(n, 0.001, 0.15)
    return s * env(n, 0.001, 0.9) * vel


def violao(f, dur, vel=0.4):   # corda dedilhada (Karplus-Strong)
    n = int(dur * SR); p = int(SR / f)
    buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.996 * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    return lp(out, 3000) * vel


def baixo(f, dur, vel=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.2 * np.sin(4 * np.pi * f * t)) * env(n, 0.01, 0.9) * vel


def bumbo():
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 50 + 70 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.12) * 0.9


def caixa():
    n = int(0.25 * SR)
    s = lp(hp(rng.normal(0, 1, n), 900), 5000) * env(n, 0.001, 0.07) * 0.35
    return s + np.sin(2 * np.pi * 190 * np.arange(n) / SR) * env(n, 0.001, 0.04) * 0.25


def chimbal():
    n = int(0.06 * SR)
    return hp(rng.normal(0, 1, n), 7000) * env(n, 0.001, 0.015) * 0.12


def poe(mix, som, t):
    i = int(t * SR)
    if i >= len(mix): return
    m = min(len(som), len(mix) - i)
    mix[i:i + m] += som[:m]


def vinil(n):
    hiss = lp(rng.normal(0, 1, n), 6000) * 0.006
    estalo = np.zeros(n)
    for i in rng.integers(0, n, n // 2500):
        estalo[i:i + 30] += rng.uniform(0.05, 0.25) * np.exp(-np.arange(min(30, n - i)) / 4)
    return hiss + hp(estalo, 1500)


def chuva(n):
    r = lp(hp(rng.normal(0, 1, n), 400), 4000) * 0.05
    gotas = np.zeros(n)
    for i in rng.integers(0, n, n // 600):
        gotas[i:i + 200] += np.sin(np.arange(min(200, n - i)) * rng.uniform(0.15, 0.4)) * np.exp(-np.arange(min(200, n - i)) / 40) * 0.03
    return r + gotas


def faixa(nome, bpm, acordes, inst, melodia, extra=None, compassos=16, swing=0.58):
    beat = 60 / bpm; bar = 4 * beat
    total = compassos * bar + 2.5
    n = int(total * SR)
    keys = np.zeros(n); bx = np.zeros(n); dr = np.zeros(n); mel = np.zeros(n)
    for c in range(compassos):
        t0 = c * bar
        notas = acordes[c % len(acordes)]
        # acorde: arpejo leve no começo (estilo dedilhado de lofi)
        for k, nt in enumerate(notas[1:]):
            poe(keys, inst(hz(nt), bar + 0.6, 0.22), t0 + k * 0.025 + rng.uniform(0, 0.012))
        if c % 2 == 1:   # uma "resposta" no meio do compasso
            poe(keys, inst(hz(notas[-1]), beat * 2, 0.12), t0 + 2.5 * beat)
        poe(bx, baixo(hz(notas[0]), beat * 2.5, 0.55), t0)
        poe(bx, baixo(hz(notas[0]), beat * 1.2, 0.35), t0 + 2.5 * beat)
        if c >= 2 and c < compassos - 1:   # bateria entra depois de 2 compassos, sai no fim
            poe(dr, bumbo(), t0); poe(dr, bumbo() * 0.6, t0 + 2.5 * beat)
            poe(dr, caixa(), t0 + beat); poe(dr, caixa(), t0 + 3 * beat)
            for h in range(4):
                poe(dr, chimbal(), t0 + h * beat); poe(dr, chimbal() * 0.6, t0 + (h + swing) * beat)
    for (c, b, nt, d) in melodia:
        for rep in (0, len(acordes)):   # melodia volta na segunda metade
            if c + rep < compassos:
                poe(mel, (caixinha if inst is not caixinha else rhodes)(hz(nt), d * beat + 0.8, 0.16), (c + rep) * bar + b * beat)
    # sidechain suave do bumbo nas teclas (aquele "respiro")
    t = np.arange(n) / SR
    duck = 1 - 0.25 * np.exp(-((t % beat) / 0.12)) * (t > 2 * bar)
    mix = lp(keys, 2800) * duck + lp(bx, 400) + lp(dr, 6000) * 0.8 + lp(mel, 4000) * duck
    if extra is not None: mix += extra(n)
    mix += vinil(n)
    mix = np.tanh(mix * 1.3) / 1.3   # saturação de fita
    fade = int(2.5 * SR); mix[-fade:] *= np.linspace(1, 0, fade); mix[:int(0.3 * SR)] *= np.linspace(0, 1, int(0.3 * SR))
    mix = mix / np.max(np.abs(mix)) * 0.85
    est = np.stack([mix, np.roll(mix, 220) * 0.97], 1)   # estéreo bem aberto
    wav = f'/tmp/{nome}.wav'
    import wave
    with wave.open(wav, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((est * 32767).astype(np.int16).tobytes())
    out = os.path.join(os.path.dirname(__file__), nome + '.mp3')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-b:a', '160k', out], check=True)
    print(out, round(total, 1), 's')


