"""Efeitos sonoros de A Turma da Rua (WAV 32 kHz, mono). Todos originais, sintetizados por código.
Versão 2: timbres mais quentes (combinando com a trilha lofi), camadas (corpo + estalo), um pouco de ambiente
e vozes de criança estilizadas para a torcida (risada "kkkk", "uuuh", comemoração).
Rode: python3 sons.py"""
import os, wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 32000
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "sons")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(11)


def t(d):
    return np.arange(int(SR * d)) / SR


def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x)


def lp(x, f, o=2):
    return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)


def hp(x, f, o=2):
    return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)


def adsr(n, a=0.004, d=0.1, s=0.0, r=0.05):
    e = np.zeros(n); na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = max(1, min(na, n)); e[:na] = np.linspace(0, 1, na)
    k = min(n, na + nd); e[na:k] = np.linspace(1, s, k - na)
    e[k:] = s
    if s > 0 and nr < n: e[-nr:] *= np.linspace(1, 0, nr)
    return e


def dec(n, tau):
    e = np.exp(-np.arange(n) / SR / tau); e[:40] *= np.linspace(0, 1, 40); return e


def sweep(f0, f1, d, forma="sin", curva=1.0):
    tt = t(d); k = (tt / d) ** curva
    f = f0 + (f1 - f0) * k
    ph = 2 * np.pi * np.cumsum(f) / SR
    if forma == "sin": return np.sin(ph)
    if forma == "tri": return 2 / np.pi * np.arcsin(np.sin(ph))
    return lp(np.sign(np.sin(ph)), min(f1, f0) * 6 + 800)   # quadrada macia


def ruido(d):
    return rng.normal(0, 1, int(SR * d))


def mixa(*arrs):
    n = max(len(a) for a in arrs); out = np.zeros(n)
    for a in arrs: out[:len(a)] += a
    return out


def atrasa(x, s):
    return np.concatenate([np.zeros(int(s * SR)), x])


def sala(x, tam=0.35, mix=0.14):
    """ambiente de rua (reverb curtinho por convolução com ruído que decai)."""
    ir = rng.normal(0, 1, int(tam * SR)) * np.exp(-np.arange(int(tam * SR)) / SR / (tam / 4))
    ir = lp(ir, 3500)
    w = np.convolve(x, ir)[:len(x) + len(ir)] * 0.06
    return mixa(x * (1 - mix), w * mix * 8)


def tom(f, d, timbre="marimba", vol=1.0):
    """notinha de interface/jingle."""
    n = int(d * SR); tt = np.arange(n) / SR
    if timbre == "marimba":
        s = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * f * 4 * tt) * dec(n, 0.02)
        return s * dec(n, min(0.25, d * 0.6)) * vol
    if timbre == "chip":   # quadrada macia com vibrato
        ph = 2 * np.pi * f * np.cumsum(1 + 0.003 * np.sin(2 * np.pi * 6 * tt)) / SR
        s = lp(np.sign(np.sin(ph)) * 0.5 + 0.5 * np.sin(ph), 3000)
        return s * adsr(n, 0.005, d * 0.3, 0.6, d * 0.3) * vol
    if timbre == "sino":
        s = np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 2.76 * tt) * dec(n, 0.15) + 0.25 * np.sin(2 * np.pi * f * 5.4 * tt) * dec(n, 0.06)
        return s * dec(n, d * 0.5) * vol
    s = np.sin(2 * np.pi * f * tt)
    return s * dec(n, d * 0.5) * vol


def melodia(notas, passo, timbre="marimba", dur=None, vol=1.0):
    out = np.zeros(int((len(notas) * passo + (dur or passo * 3)) * SR))
    for i, f in enumerate(notas):
        if f:
            s = tom(f, dur or passo * 3, timbre, vol); k = int(i * passo * SR); out[k:k + len(s)] += s[:len(out) - k]
    return out


FORM = {"a": (800, 1200, 2500), "e": (450, 1900, 2600), "i": (320, 2300, 3000), "u": (350, 750, 2400), "o": (500, 900, 2400)}


def voz(f0, d, vogal="a", vib=6, glide=0.0, vol=1.0):
    """voz de criança estilizada: onda dente-de-serra passando por formantes."""
    n = int(d * SR); tt = np.arange(n) / SR
    f = f0 * (1 + glide * (tt / d)) * (1 + 0.02 * np.sin(2 * np.pi * vib * tt + rng.uniform(0, 6)))
    ph = np.cumsum(f) / SR
    saw = 2 * (ph % 1) - 1
    F1, F2, F3 = FORM[vogal]
    s = bp(saw, F1 * 0.8, F1 * 1.2) * 1.0 + bp(saw, F2 * 0.85, F2 * 1.15) * 0.6 + bp(saw, F3 * 0.9, F3 * 1.1) * 0.25
    s += bp(rng.normal(0, 1, n), F2 * 0.7, F2 * 1.3) * 0.05   # ar na voz
    return s * adsr(n, 0.02, 0.05, 0.85, min(0.08, d / 3)) * vol


def risada(d=1.4, pessoas=5):
    """torcida rindo: 'kkkk' (ha-ha-ha rapidinho) de várias crianças."""
    out = np.zeros(int((d + 0.4) * SR))
    for p in range(pessoas):
        f0 = rng.uniform(280, 460); ini = rng.uniform(0, 0.25); ritmo = rng.uniform(5.5, 7.5)
        k = ini
        while k < d * rng.uniform(0.7, 1.0):
            dur = 1 / ritmo * 0.55
            s = voz(f0 * rng.uniform(0.95, 1.08), dur, "a", vol=rng.uniform(0.6, 1))
            s = s + hp(rng.normal(0, 1, len(s)), 2000) * 0.08 * adsr(len(s), 0.002, 0.03, 0, 0.01)   # o "h" do ha
            i = int(k * SR); out[i:i + len(s)] += s[:len(out) - i]
            k += 1 / ritmo; f0 *= 0.985
    return out


def uuuh(d=1.2, pessoas=6):
    """torcida fazendo 'uuuuh!' (sobe e desce)."""
    out = np.zeros(int((d + 0.3) * SR))
    for p in range(pessoas):
        f0 = rng.uniform(260, 420); ini = rng.uniform(0, 0.1)
        n = int(d * SR); tt = np.arange(n) / SR
        s = voz(f0, d, "u", glide=0.0, vol=rng.uniform(0.6, 1))
        # contorno: sobe e cai no fim
        curva = np.interp(tt, [0, d * 0.4, d], [0.85, 1.25, 0.8])
        s2 = voz(f0 * 1.15, d, "o", vol=0.4)
        s = s * np.interp(tt, [0, d * 0.3, d], [0.4, 1, 0.2]) + s2 * curva * 0.2
        i = int(ini * SR); out[i:i + n] += s[:len(out) - i]
    return out


def comemora(d=1.6, pessoas=7):
    """turma gritando 'êêêê!' no gol."""
    out = np.zeros(int((d + 0.3) * SR))
    for p in range(pessoas):
        f0 = rng.uniform(320, 520); ini = rng.uniform(0, 0.15)
        s = voz(f0, d * rng.uniform(0.7, 1), rng.choice(["e", "a", "o"]), vib=rng.uniform(5, 9), glide=rng.uniform(0.05, 0.2), vol=rng.uniform(0.5, 1))
        i = int(ini * SR); out[i:i + len(s)] += s[:len(out) - i]
    return out


def save(nome, x, vol=0.6, ambiente=True):
    x = np.asarray(x, dtype=float)
    if ambiente: x = sala(x)
    x = x / (np.max(np.abs(x)) or 1)
    x = np.tanh(x * 1.2) / np.tanh(1.2) * vol
    f = min(len(x), int(0.01 * SR)); x[-f:] *= np.linspace(1, 0, f)
    with wave.open(os.path.join(OUT, nome + ".wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


N = {}
for i, nome in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]):
    for o in range(2, 8):
        N[f"{nome}{o}"] = 440 * 2 ** ((i + 12 * (o + 1) - 69) / 12)

# ---------------------------------------------------------------- bola
couro = lambda d=0.04: bp(ruido(d), 900, 3500) * dec(int(d * SR), 0.008)
save("chute", mixa(sweep(170, 48, 0.16, curva=0.4) * dec(int(0.16 * SR), 0.06), couro(0.05) * 0.7), 0.85)
save("passe", mixa(sweep(220, 90, 0.09, curva=0.5) * dec(int(0.09 * SR), 0.035), couro(0.03) * 0.4), 0.55)
save("quique", mixa(sweep(150, 85, 0.1, curva=0.5) * dec(int(0.1 * SR), 0.03), bp(ruido(0.02), 300, 1200) * 0.3), 0.5, ambiente=False)
save("arremesso", bp(ruido(0.3), 400, 2000) * np.interp(t(0.3), [0, 0.18, 0.3], [0, 1, 0]) + bp(ruido(0.3), 1500, 4000) * np.interp(t(0.3), [0, 0.2, 0.3], [0, 0.4, 0]), 0.5)
save("pegar", mixa(sweep(180, 110, 0.07) * dec(int(0.07 * SR), 0.03), atrasa(melodia([N["G5"], N["D6"]], 0.05, "marimba", 0.2, 0.35), 0.02)), 0.45)
save("queimado", mixa(sweep(200, 70, 0.12) * dec(int(0.12 * SR), 0.05), couro(0.05) * 0.8,
                      atrasa(melodia([N["E5"], N["C5"], N["G4"]], 0.07, "chip", 0.12, 0.35), 0.06)), 0.65)

# ---------------------------------------------------------------- dribles e torcida
fwip = bp(ruido(0.22), 600, 2500) * np.interp(t(0.22), [0, 0.06, 0.22], [0, 1, 0])
rolar = sweep(160, 120, 0.3, "tri") * 0.15 * np.interp(t(0.3), [0, 0.05, 0.3], [0, 1, 0])
save("caneta", mixa(fwip, rolar, atrasa(melodia([N["C6"], N["G5"], N["E5"]], 0.06, "chip", 0.1, 0.3), 0.18)), 0.6)
swoosh = bp(ruido(0.45), 500, 3000) * np.interp(t(0.45), [0, 0.15, 0.45], [0, 1, 0])
boing = sweep(300, 900, 0.18, "tri") * dec(int(0.18 * SR), 0.1) * 0.5
save("chapeu", mixa(couro(0.03), boing, swoosh * 0.7, atrasa(melodia([N["G5"], N["C6"], N["E6"]], 0.07, "marimba", 0.25, 0.4), 0.15)), 0.6)
save("zoeira", mixa(risada(1.5, 6), atrasa(uuuh(0.9, 3) * 0.4, 0.05)), 0.6)

# ---------------------------------------------------------------- jogo
tt = t(0.5)
trilo = 1 + 0.5 * (np.sin(2 * np.pi * 32 * tt) > 0)   # a bolinha do apito
ap = np.sin(2 * np.pi * 2650 * tt * (1 + 0.004 * np.sin(2 * np.pi * 32 * tt))) * trilo + bp(ruido(0.5), 2200, 3400) * 0.4
save("apito", ap * adsr(len(tt), 0.01, 0.05, 0.9, 0.08), 0.32)
fanfarra = melodia([N["C5"], N["E5"], N["G5"], N["C6"], 0, N["G5"], N["C6"]], 0.11, "chip", 0.25, 0.5)
save("gol", mixa(comemora(1.8, 8), fanfarra * 0.8, atrasa(bp(ruido(1.6), 300, 2500) * np.interp(t(1.6), [0, 0.2, 1.6], [0, 0.25, 0]), 0.1)), 0.75)
# Fusca: motor a ar "pof-pof-pof" + buzina fon-fon
d = 1.6; n = int(d * SR); tt = t(d)
pulsos = np.zeros(n)
for k in np.arange(0, d, 1 / 24): pulsos[int(k * SR)] = 1
motor = lp(np.convolve(pulsos, dec(int(0.03 * SR), 0.006))[:n] + ruido(d) * 0.05, 400) * 3
motor *= np.interp(tt, [0, d * 0.5, d], [0.2, 1, 0.15])
def buzina(d):
    tt_ = t(d); s = sum(lp(2 * ((f * tt_) % 1) - 1, 1800) for f in (370, 466))
    return s * adsr(len(tt_), 0.01, 0.02, 0.9, 0.03)
save("carro", mixa(motor, atrasa(buzina(0.16) * 0.35, 0.2), atrasa(buzina(0.26) * 0.35, 0.42)), 0.55)


# ---------------------------------------------------------------- retrô (chute, arremesso e gol no estilo 8-bit simples)
def _onepole(x, k):
    y = np.zeros_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += k * (v - acc); y[i] = acc
    return y


def _env(x, a=0.005, r=None):
    n = len(x); e = np.ones(n); na = max(1, int(SR * a)); e[:na] = np.linspace(0, 1, na)
    if r is None: e *= np.linspace(1, 0, n) ** 1.5
    else:
        nr = max(1, int(SR * r)); e[-nr:] *= np.linspace(1, 0, nr)
    return x * e


def _sweep(f0, f1, d, kind="sq"):
    f = np.linspace(f0, f1, int(SR * d)); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sign(np.sin(ph)) if kind == "sq" else np.sin(ph)


def _seq(notas, d=0.09, duty=0.5, vol=0.5):
    out = []
    for f in notas:
        tt = t(d)
        out.append(np.zeros(len(tt)) if f == 0 else _env(np.where((tt * f) % 1 < duty, 1.0, -1.0), 0.003) * vol)
    return np.concatenate(out)


_ruido = lambda d: rng.uniform(-1, 1, int(SR * d))
save("chute", mixa(_env(_sweep(180, 50, 0.12, "sin"), 0.001), 0.4 * _env(_onepole(_ruido(0.05), 0.5), 0.001)), 0.8, ambiente=False)
_w = _onepole(_ruido(0.25), 0.25)
save("arremesso", _env(_w * np.linspace(0.2, 1, len(_w)), 0.01, 0.1), 0.5, ambiente=False)
_n = _onepole(_ruido(1.6), 0.08)
_torcida = _n * (0.6 + 0.4 * np.sin(np.linspace(0, 9, len(_n))) ** 2)
_fan = _seq([N["C5"], N["E5"], N["G5"], N["C6"], 0, N["G5"], N["C6"]], 0.11, 0.25, 0.6)
save("gol", mixa(_env(_torcida, 0.05, 0.4) * 0.8, _fan), 0.7, ambiente=False)

# ---------------------------------------------------------------- interface
save("clique", tom(N["A5"], 0.12, "marimba", 1), 0.35, ambiente=False)
save("hover", tom(N["E6"], 0.06, "marimba", 1) * 0.6, 0.18, ambiente=False)
save("selecionar", melodia([N["E5"], N["A5"], N["E6"]], 0.06, "marimba", 0.25), 0.42)
save("tecla", mixa(bp(ruido(0.015), 2000, 6000) * dec(int(0.015 * SR), 0.003), tom(1250, 0.03, "sin", 0.3)), 0.18, ambiente=False)
save("bip", tom(N["B5"], 0.15, "sino"), 0.32, ambiente=False)

# ---------------------------------------------------------------- brincadeiras
save("alerta", mixa(melodia([N["A5"], 0, N["A5"], N["E6"]], 0.08, "chip", 0.14, 0.6), voz(480, 0.35, "e", glide=0.15, vol=0.5)), 0.55)
crist = mixa(*[atrasa(tom(f, 0.5, "sino", 0.5), k * 0.03) for k, f in enumerate([N["E6"], N["B6"], N["G6"], N["E7"], N["B6"]])])
save("congelar", mixa(crist, sweep(1500, 3200, 0.3) * 0.1 * dec(int(0.3 * SR), 0.15)), 0.4)
save("la_vou_eu", melodia([N["C5"], N["E5"], N["G5"], N["C6"]], 0.08, "chip", 0.18), 0.45)
save("achou", mixa(melodia([N["C6"], N["G5"], N["E5"]], 0.09, "marimba", 0.3), voz(400, 0.3, "a", glide=-0.1, vol=0.3)), 0.5)
save("salvou", melodia([N["E5"], N["G5"], N["C6"], N["E6"]], 0.08, "sino", 0.4), 0.5)
save("mato", bp(ruido(0.3), 1500, 6000) * (0.5 + 0.5 * np.abs(np.sin(np.linspace(0, 14, int(0.3 * SR))))) * np.interp(t(0.3), [0, 0.05, 0.3], [0, 1, 0]), 0.3)
save("habilidade", mixa(sweep(300, 1300, 0.22, "tri") * dec(int(0.22 * SR), 0.15) * 0.5,
                        atrasa(melodia([N["E6"], N["G6"], N["B6"]], 0.04, "sino", 0.3, 0.4), 0.1)), 0.45)
save("pulo", sweep(220, 640, 0.14, "tri") * dec(int(0.14 * SR), 0.08), 0.4)

# ---------------------------------------------------------------- abertura, vitória e derrota
save("abertura", melodia([N["C5"], N["E5"], N["G5"], N["B5"], N["A5"], N["E5"], N["C5"], N["G5"]], 0.3, "sino", 1.2, 0.6), 0.45)
save("vitoria", mixa(melodia([N["C5"], N["E5"], N["G5"], N["C6"], 0, N["A5"], N["C6"], N["E6"], N["E6"]], 0.12, "chip", 0.3),
                     atrasa(comemora(1.2, 5) * 0.5, 0.5)), 0.55)
save("derrota", melodia([N["G5"], N["E5"], N["C5"], N["G4"], N["C4"]], 0.17, "marimba", 0.5), 0.45)
print("ok", len([f for f in os.listdir(OUT) if f.endswith(".wav")]), "wavs")
