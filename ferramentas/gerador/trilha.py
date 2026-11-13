"""Trilha sonora original de A Turma da Rua: uma música para cada momento do jogo.
Tudo sintetizado aqui (piano elétrico, caixinha de música, violão, baixo, bateria e chiado de vinil).
As faixas de cena tocam em loop sem emenda; a do final tem começo, meio e fim.
Saída: assets/sons/m_*.mp3  (rode: python3 trilha.py)"""
import os, subprocess, wave
import numpy as np
from trilha_base import (SR, rng, hz, lp, hp, env, rhodes, caixinha, violao, baixo, bumbo, caixa, chimbal, poe, vinil, chuva)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "sons")


def chip(f, dur, vel=0.18):
    """lead de videogame, mas macio (quadrada filtrada com vibrato)."""
    n = int(dur * SR); t = np.arange(n) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t * 3, 0, 1)
    ph = 2 * np.pi * f * np.cumsum(vib) / SR
    s = np.sign(np.sin(ph)) * 0.5 + 0.5 * np.sin(ph)
    return lp(s * env(n, 0.01, 0.6), 2400) * vel


def pizz(f, dur, vel=0.35):
    """pizzicato curtinho: passo de quem está se escondendo."""
    n = int(min(dur, 0.5) * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(4 * np.pi * f * t) * env(n, 0.001, 0.05)
    return lp(s * env(n, 0.002, 0.12), 2500) * vel


def salvar(nome, mix):
    mix = np.tanh(mix * 1.3) / 1.3
    mix = mix / np.max(np.abs(mix)) * 0.82
    est = np.stack([mix, np.roll(mix, 220) * 0.97], 1)
    wav = f"/tmp/{nome}.wav"
    with wave.open(wav, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((est * 32767).astype(np.int16).tobytes())
    out = os.path.join(OUT, nome + ".mp3")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-b:a", "128k", out], check=True)
    print(out, round(len(mix) / SR, 1), "s")


def musica(bpm, acordes, inst, melodia, lead=None, compassos=16, loop=True, bateria="lofi", extra=None,
           arpejo=False, baixo_andando=False, vol=dict(keys=1, bx=1, dr=0.8, mel=1)):
    """Monta a música. Em loop, o rabo que passa do fim volta pro começo (emenda perfeita)."""
    beat = 60 / bpm; bar = 4 * beat
    total = compassos * bar
    n = int(total * SR); cauda = int(3 * SR)
    keys, bx, dr, mel = (np.zeros(n + cauda) for _ in range(4))
    for c in range(compassos):
        t0 = c * bar
        notas = acordes[c % len(acordes)]
        if arpejo:   # dedilhado em colcheias
            for k in range(8):
                nt = notas[1:][[0, 1, 2, 3, 2, 1, 2, 3][k] % (len(notas) - 1)]
                poe(keys, inst(hz(nt), beat * 1.2, 0.16 if k % 2 else 0.2), t0 + k * beat / 2)
        else:
            for k, nt in enumerate(notas[1:]):
                poe(keys, inst(hz(nt), bar + 0.6, 0.22), t0 + k * 0.025 + rng.uniform(0, 0.012))
            if c % 2 == 1:
                poe(keys, inst(hz(notas[-1]), beat * 2, 0.12), t0 + 2.5 * beat)
        if baixo_andando:
            raiz = hz(notas[0])
            for k, mult in enumerate([1, 1.5, 2 ** (7 / 12) * 1, 1.5 * 2 ** (-2 / 12)]):
                poe(bx, baixo(raiz * [1, 2 ** (3 / 12), 2 ** (7 / 12), 2 ** (5 / 12)][k], beat * 0.9, 0.45), t0 + k * beat)
        else:
            poe(bx, baixo(hz(notas[0]), beat * 2.5, 0.55), t0)
            poe(bx, baixo(hz(notas[0]), beat * 1.2, 0.35), t0 + 2.5 * beat)
        if bateria == "lofi" and (loop or 2 <= c < compassos - 1):
            poe(dr, bumbo(), t0); poe(dr, bumbo() * 0.6, t0 + 2.5 * beat)
            poe(dr, caixa(), t0 + beat); poe(dr, caixa(), t0 + 3 * beat)
            for h in range(4):
                poe(dr, chimbal(), t0 + h * beat); poe(dr, chimbal() * 0.6, t0 + (h + 0.58) * beat)
        elif bateria == "jogo":   # mais animada: bumbo em 1 e 3, caixa 2 e 4, chimbal em colcheias retas
            for h in range(4):
                if h % 2 == 0: poe(dr, bumbo(), t0 + h * beat)
                else: poe(dr, caixa() * 1.1, t0 + h * beat)
                poe(dr, chimbal(), t0 + h * beat); poe(dr, chimbal() * 0.7, t0 + (h + 0.5) * beat)
            if c % 4 == 3: poe(dr, bumbo() * 0.7, t0 + 3.5 * beat)
        elif bateria == "leve":   # só um tique-taque
            for h in range(4):
                poe(dr, chimbal() * (1 if h % 2 == 0 else 0.5), t0 + h * beat)
            poe(dr, bumbo() * 0.5, t0)
    voz = lead or caixinha
    for (c, b, nt, d) in melodia:
        if c < compassos:
            poe(mel, voz(hz(nt), d * beat + 0.4, 0.2), c * bar + b * beat)
    t = np.arange(n + cauda) / SR
    duck = 1 - 0.22 * np.exp(-((t % beat) / 0.12)) if bateria in ("lofi", "jogo") else 1
    mix = lp(keys, 2800) * duck * vol["keys"] + lp(bx, 420) * vol["bx"] + lp(dr, 6500) * vol["dr"] + lp(mel, 4200) * duck * vol["mel"]
    if extra is not None: mix = mix + extra(n + cauda)
    if loop:
        mix[:cauda] += mix[n:n + cauda]
        mix = mix[:n]
        mix += vinil(n)
    else:
        mix += vinil(n + cauda)
        f = int(4 * SR); mix[-f:] *= np.linspace(1, 0, f) ** 1.5
    return mix


# melodias são escritas como (compasso, tempo, nota, duração em tempos)
def repete(m, vezes, passo):
    return [(c + k * passo, b, nt, d) for k in range(vezes) for (c, b, nt, d) in m]


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    # Menu da rua: hora dourada, piano elétrico morno
    A1 = [['F2', 'A3', 'C4', 'E4', 'G4'], ['E2', 'G3', 'B3', 'D4', 'F#4'], ['D2', 'F3', 'A3', 'C4', 'E4'], ['C2', 'E3', 'G3', 'B3', 'D4']]
    M1 = [(0, 1, 'C5', 1), (0, 2.5, 'A4', 1.5), (1, 1, 'B4', 1), (1, 2.5, 'G4', 2), (2, 1.5, 'A4', 1), (2, 3, 'E4', 1), (3, 2, 'G4', 3)]
    salvar("m_rua", musica(74, A1, rhodes, repete(M1, 2, 8), compassos=16))

    # Partida (futebol, queimada, alerta): animada, mas ainda com cara de fim de tarde
    A2 = [['C2', 'E3', 'G3', 'B3', 'D4'], ['A1', 'C3', 'E3', 'G3', 'B3'], ['F1', 'A2', 'C3', 'E3', 'G3'], ['G1', 'B2', 'D3', 'F3', 'A3']]
    M2 = [(0, 0, 'E5', 0.5), (0, 0.5, 'G5', 0.5), (0, 1, 'A5', 1), (0, 2.5, 'G5', 0.5), (0, 3, 'E5', 1),
          (1, 0.5, 'D5', 0.5), (1, 1, 'E5', 0.5), (1, 1.5, 'C5', 1.5), (1, 3, 'A4', 1),
          (2, 0, 'C5', 0.5), (2, 0.5, 'D5', 0.5), (2, 1, 'E5', 1), (2, 2.5, 'G5', 1.5),
          (3, 0, 'F5', 0.5), (3, 0.5, 'E5', 0.5), (3, 1, 'D5', 2), (3, 3, 'B4', 1)]
    M2b = [(c + 4, b, nt, d) for (c, b, nt, d) in [(0, 0, 'G5', 1), (0, 1.5, 'E5', 1), (0, 3, 'C5', 1), (1, 0, 'E5', 2), (1, 2.5, 'D5', 1.5),
                                                    (2, 0, 'A4', 0.5), (2, 0.5, 'C5', 0.5), (2, 1, 'E5', 1), (2, 2.5, 'A5', 1.5), (3, 0, 'G5', 3)]]
    salvar("m_jogo", musica(96, A2, rhodes, repete(M2 + M2b, 2, 8), lead=chip, compassos=16, bateria="jogo", arpejo=True))

    # Barracão na chuva: caixinha de música e chuva no telhado
    A3 = [['A1', 'C4', 'E4', 'G4', 'B4'], ['F1', 'A3', 'C4', 'E4', 'G4'], ['C2', 'E3', 'G3', 'B3', 'D4'], ['G1', 'B3', 'D4', 'E4', 'A4']]
    M3 = [(0, 0, 'E5', 2), (0, 2, 'G5', 2), (1, 0, 'A5', 3), (2, 1, 'G5', 1), (2, 2, 'E5', 2), (3, 0, 'D5', 4)]
    salvar("m_chuva", musica(66, A3, rhodes, repete(M3, 2, 8), compassos=8 * 2, extra=lambda n: chuva(n) * 1.4, vol=dict(keys=0.9, bx=1, dr=0.6, mel=1)))

    # Esconde-esconde: em menor, na ponta do pé (pizzicato, baixo andando e tique-taque)
    A4 = [['D2', 'F3', 'A3', 'C4'], ['D2', 'F3', 'A3', 'C4'], ['A#1', 'D3', 'F3', 'A3'], ['A1', 'C#3', 'E3', 'G3']]
    M4 = [(0, 0.5, 'A4', 0.5), (0, 1.5, 'A4', 0.5), (0, 2, 'C5', 0.5), (0, 3, 'A4', 0.5),
          (1, 0.5, 'F4', 0.5), (1, 1.5, 'E4', 0.5), (1, 2.5, 'D4', 1),
          (2, 0.5, 'F4', 0.5), (2, 1.5, 'A#4', 0.5), (2, 2, 'A4', 0.5), (2, 3, 'F4', 0.5),
          (3, 0.5, 'E4', 0.5), (3, 1.5, 'C#5', 0.5), (3, 2.5, 'A4', 1)]
    salvar("m_esconde", musica(88, A4, pizz, repete(M4, 4, 4), lead=caixinha, compassos=16, bateria="leve", arpejo=True, baixo_andando=True,
                               vol=dict(keys=1.2, bx=0.9, dr=1, mel=0.8)))

    # Encerramento "Até amanhã, turma": a música do fim, com começo, meio e fim
    A5 = [['F2', 'A3', 'C4', 'E4', 'G4'], ['A1', 'C4', 'E4', 'G4'], ['D2', 'F3', 'A3', 'C4', 'E4'], ['G1', 'B3', 'D4', 'F4'],
          ['A#1', 'D4', 'F4', 'A4'], ['A1', 'C4', 'E4', 'G4'], ['D2', 'F3', 'A3', 'C4'], ['G1', 'F3', 'A3', 'B3', 'D4']]
    M5 = [(1, 0, 'E5', 1.5), (1, 1.5, 'D5', 0.5), (1, 2, 'C5', 2), (2, 0, 'A4', 1), (2, 1, 'C5', 1), (2, 2, 'D5', 2),
          (3, 0, 'B4', 3), (4, 0, 'D5', 1.5), (4, 1.5, 'F5', 0.5), (4, 2, 'E5', 2), (5, 0, 'C5', 1), (5, 1, 'E5', 1), (5, 2, 'G5', 2),
          (6, 0, 'F5', 1.5), (6, 1.5, 'E5', 0.5), (6, 2, 'D5', 2), (7, 0, 'B4', 2), (7, 2, 'C5', 2)]
    fim = M5 + [(c + 8, b, nt, d) for (c, b, nt, d) in M5] + [(17, 0, 'C5', 4), (18, 0, 'A4', 4), (19, 0, 'F4', 6)]
    acordes_fim = A5 + A5 + [['F2', 'A3', 'C4', 'E4', 'G4'], ['D2', 'F3', 'A3', 'C4', 'E4'], ['G1', 'B3', 'D4', 'F4'], ['F2', 'A3', 'C4', 'E4', 'G4']]
    salvar("m_fim", musica(68, acordes_fim, rhodes, fim, compassos=20, loop=False))
