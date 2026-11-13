/*
 * Eventos da rua que aparecem em várias cenas.
 *
 * TR.fusca(scene, { y, kids, voce, depth })
 *   Passa um Fusca azul (opções: y, depth, semCarro). Quem apertar F primeiro grita "FUSCA AZUL!" e dá um peteleco no mais perto.
 *   Se você demorar, alguém da turma grita antes e o peteleco é em você.
 *   kids() devolve os sprites da turma na cena; voce() devolve o seu sprite.
 *
 * TR.chuva(scene, segundos, fim)
 *   Escurece a tela, cai chuva com som e, depois de alguns segundos, para e chama fim().
 *
 * TR.anoitecer(scene, progresso, falar)
 *   Conforme a partida passa (progresso() vai de 0 a 1), o céu fica alaranjado, depois escurece e o poste acende.
 *   falar(texto) é chamado uma vez, quando começa a escurecer.
 *
 * TR.orelhao(scene, falante)
 *   O orelhão toca um toque 8-bit original (assets/sons/orelhao.wav, feito por ferramentas/gerador/orelhao.py).
 *   Se a JBL estiver tocando, ela pausa enquanto o orelhão toca.
 */
// Placar dos petelecos: fica guardado no navegador (localStorage), então não zera ao fechar o jogo
TR.placar = { petelecosDados: 0, petelecosLevados: 0 };
try { Object.assign(TR.placar, JSON.parse(localStorage.getItem('turma_placar') || '{}')); } catch (e) { /* navegador sem armazenamento */ }
TR.salvarPlacar = () => { try { localStorage.setItem('turma_placar', JSON.stringify(TR.placar)); } catch (e) { /* ok */ } };
TR.textoPlacar = () => 'Petelecos: ' + TR.placar.petelecosDados + ' dados · ' + TR.placar.petelecosLevados + ' levados';

TR._texturaFusca = (scene) => {
  if (scene.textures.exists('fusca')) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const azul = 0x3c7ed8, escuro = 0x285a9e, contorno = 0x241a2c;
  g.fillStyle(contorno, 1).fillEllipse(80, 44, 160, 70);
  g.fillStyle(azul, 1).fillEllipse(80, 44, 154, 64);                    // corpo arredondado
  g.fillStyle(contorno, 1).fillEllipse(78, 26, 92, 44);
  g.fillStyle(azul, 1).fillEllipse(78, 26, 86, 40);                     // teto
  g.fillStyle(0xa8d4f0, 1).fillRect(48, 14, 26, 18).fillRect(80, 14, 26, 18);   // janelas
  g.fillStyle(escuro, 1).fillRect(6, 52, 148, 6);                       // faixa de baixo
  g.fillStyle(0xfff2b0, 1).fillCircle(150, 44, 5);                      // farol
  g.fillStyle(0xd04040, 1).fillRect(4, 40, 5, 8);                       // lanterna
  [36, 122].forEach((x) => {                                            // rodas
    g.fillStyle(contorno, 1).fillCircle(x, 70, 13);
    g.fillStyle(0xb0b0b8, 1).fillCircle(x, 70, 5);
  });
  g.generateTexture('fusca', 160, 86);
  g.destroy();
};

TR.fusca = (scene, o) => {
  TR._texturaFusca(scene);
  // semCarro: a cena já desenha o Fusca (o futebol usa o carro dele)
  if (!o.semCarro) {
    const car = scene.add.image(-120, o.y, 'fusca').setOrigin(0.5, 1).setDepth(o.depth || o.y);
    TR.sfx(scene, 'carro', 0.4, 1.3);
    scene.tweens.add({ targets: car, x: 1100, duration: 3600, onComplete: () => car.destroy() });
  }
  const aviso = TR.txt(scene, 480, 120, 'FUSCA AZUL! Aperta F!', 2, 0x9ccfff).setOrigin(0.5).setDepth(6601).setScrollFactor(0);
  const fundo = scene.add.rectangle(480, 120, aviso.width + 30, aviso.height + 14, 0x0c0810, 0.85).setDepth(6600).setScrollFactor(0)
    .setStrokeStyle(3, 0x3c7ed8);
  scene.tweens.add({ targets: aviso, alpha: 0.4, yoyo: true, repeat: -1, duration: 160 });
  // no celular: tocar no aviso vale como apertar F
  fundo.setInteractive({ useHandCursor: true }).on('pointerdown', () => apertou());
  const avisoTxt = document.body.classList.contains('toque') ? 'FUSCA AZUL! Toca aqui!' : null;
  if (avisoTxt) { aviso.setText(avisoTxt); fundo.setSize(aviso.width + 30, aviso.height + 14); }
  let resolvido = false;
  const terminar = (vocePrimeiro) => {
    if (resolvido) return;
    resolvido = true;
    scene.input.keyboard.off('keydown-F', apertou);
    aviso.destroy(); fundo.destroy();
    scene.time.delayedCall(10, () => scene.events.emit('peteleco'));
    const voce = o.voce();
    const outros = o.kids().filter((s) => s && s !== voce && s.active);
    if (!voce || !outros.length) return;
    const perto = (a) => outros.slice().sort((p, q) => Phaser.Math.Distance.Between(a.x, a.y, p.x, p.y) - Phaser.Math.Distance.Between(a.x, a.y, q.x, q.y))[0];
    if (vocePrimeiro) {
      const alvo = perto(voce);
      TR.placar.petelecosDados++; TR.salvarPlacar();
      TR.bubble(scene, voce, 'FUSCA AZUL! Peteleco!', 1.4);
      TR.peteleco(scene, alvo);
      scene.time.delayedCall(500, () => TR.bubble(scene, alvo, Phaser.Utils.Array.GetRandom(['AI!', 'Ô, não vi!', 'Vale nada, não valeu!']), 1.3));
    } else {
      const quem = Phaser.Utils.Array.GetRandom(outros);
      TR.placar.petelecosLevados++; TR.salvarPlacar();
      TR.bubble(scene, quem, 'FUSCA AZUL! Peteleco em você!', 1.4);
      TR.peteleco(scene, voce);
      scene.time.delayedCall(500, () => TR.bubble(scene, voce, 'AI! Tava distraído!', 1.3));
    }
  };
  const apertou = () => terminar(true);
  scene.input.keyboard.on('keydown-F', apertou);
  // a turma reage entre 0,9 e 1,6 s; se você não apertar antes, perdeu
  scene.time.delayedCall(Phaser.Math.Between(900, 1600), () => terminar(false));
};

TR.peteleco = (scene, alvo) => {
  if (!alvo) return;
  TR.sfx(scene, 'pegar', 0.6, 1.6);
  scene.tweens.add({ targets: alvo, angle: { from: -8, to: 8 }, yoyo: true, repeat: 2, duration: 60, onComplete: () => { alvo.angle = 0; } });
  const estrela = TR.txt(scene, alvo.x + 10, alvo.y - 120, '✦', 2, 0xffe066).setOrigin(0.5).setDepth(6000);
  scene.tweens.add({ targets: estrela, y: estrela.y - 30, alpha: 0, duration: 600, onComplete: () => estrela.destroy() });
};

TR.chuva = (scene, segundos, fim) => {
  const escuro = scene.add.rectangle(480, 270, 960, 540, 0x1c2a44, 0).setDepth(5800).setScrollFactor(0);
  scene.tweens.add({ targets: escuro, fillAlpha: 0.38, duration: 1200 });
  const gotas = scene.add.graphics().setDepth(5801).setScrollFactor(0);
  const lista = Array.from({ length: 140 }, () => ({ x: Math.random() * 1000, y: Math.random() * 540, v: 700 + Math.random() * 300 }));
  let som = null;
  try { som = scene.sound.add('chuva', { loop: true, volume: 0 }); som.play(); scene.tweens.add({ targets: som, volume: 0.5, duration: 1200 }); } catch (e) { /* sem áudio */ }
  let intensidade = 0;
  const desenha = (t, dms) => {
    const dt = dms / 1000;
    intensidade = Math.min(1, intensidade + dt * 0.8);
    gotas.clear().lineStyle(1, 0xbcd4ff, 0.55 * intensidade);
    lista.forEach((g) => {
      g.y += g.v * dt; g.x -= g.v * 0.18 * dt;
      if (g.y > 540) { g.y = -10; g.x = Math.random() * 1000; }
      gotas.lineBetween(g.x, g.y, g.x - 3, g.y + 12);
    });
  };
  scene.events.on('update', desenha);
  scene.time.delayedCall(segundos * 1000, () => {
    scene.tweens.add({ targets: escuro, fillAlpha: 0, duration: 1200, onComplete: () => escuro.destroy() });
    if (som) scene.tweens.add({ targets: som, volume: 0, duration: 1200, onComplete: () => som.destroy() });
    scene.tweens.add({ targets: gotas, alpha: 0, duration: 1200, onComplete: () => { scene.events.off('update', desenha); gotas.destroy(); } });
    if (fim) fim();
  });
  scene.events.once('shutdown', () => { scene.events.off('update', desenha); if (som) som.destroy(); });
};

TR.anoitecer = (scene, progresso, falar, poste) => {
  const camada = scene.add.rectangle(480, 270, 960, 540, 0xff9a4a, 0).setDepth(4800).setScrollFactor(0);
  const luz = poste ? scene.add.circle(poste[0], poste[1], 70, 0xffe08a, 0).setDepth(4801) : null;
  const laranja = Phaser.Display.Color.ValueToColor(0xff9a4a), noite = Phaser.Display.Color.ValueToColor(0x1c2a5a);
  let avisou = false;
  const passo = () => {
    if (!camada.active) return;
    const p = Phaser.Math.Clamp(progresso(), 0, 1);
    if (p < 0.5) {
      camada.setFillStyle(0xff9a4a, (p / 0.5) * 0.16);           // fim de tarde: tudo mais dourado
    } else {
      const k = (p - 0.5) / 0.5;
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(laranja, noite, 100, k * 100);
      camada.setFillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 0.16 + k * 0.42);   // vai escurecendo
    }
    if (luz) luz.setFillStyle(0xffe08a, p > 0.7 ? Math.min(0.3, (p - 0.7) * 1.2) : 0);   // o poste acende
    if (!avisou && p > 0.72 && falar) { avisou = true; falar(Phaser.Utils.Array.GetRandom(['Tá escurecendo...', 'Mais 5 minutos, mãe!', 'Já vai acender o poste!'])); }
  };
  scene.events.on('update', passo);
  scene.events.once('shutdown', () => scene.events.off('update', passo));
};

// Bike do Matheus: aparece do nada embaixo dele e some depois de alguns segundos
// Bike do nada (Matheus): o sprite dele some e aparece ele pedalando (assets/personagens/matheus_bike.png)
TR.bike = (scene, spr, segundos) => {
  const bike = scene.add.sprite(spr.x, spr.y, 'matheus_bike', 0).setOrigin(0.5, 0.97).setDepth(spr.depth);
  bike.play('matheus_pedala');
  spr.setVisible(false);
  let ultX = spr.x, ultY = spr.y;
  const segue = () => {
    if (!spr.active || !bike.active) return;
    bike.setPosition(spr.x, spr.y).setDepth(spr.depth);
    const dx = spr.x - ultX, dy = spr.y - ultY, andou = Math.hypot(dx, dy);
    // de lado, de costas (subindo) ou de frente (descendo), conforme pra onde ele vai
    let vista = bike.vista || 'lado';
    if (andou > 0.3) vista = Math.abs(dy) > Math.abs(dx) * 1.2 ? (dy < 0 ? 'costas' : 'frente') : 'lado';
    else if (spr.dir === 'up') vista = 'costas'; else if (spr.dir === 'down') vista = 'frente'; else if (spr.dir === 'left' || spr.dir === 'right') vista = 'lado';
    if (vista !== bike.vista) { bike.vista = vista; bike.play(vista === 'lado' ? 'matheus_pedala' : 'matheus_pedala_' + vista); }
    if (vista === 'lado') {
      if (dx < -0.5) bike.setFlipX(true); else if (dx > 0.5) bike.setFlipX(false);
      else if (spr.dir === 'left') bike.setFlipX(true); else if (spr.dir === 'right') bike.setFlipX(false);
    } else bike.setFlipX(false);
    // pedala quando anda, para quando para
    if (andou > 0.3) bike.anims.resume(); else bike.anims.pause();
    ultX = spr.x; ultY = spr.y;
  };
  scene.events.on('postupdate', segue);
  const nuvem = TR.txt(scene, spr.x, spr.y - 120, 'POF!', 2, 0xffffff).setOrigin(0.5).setDepth(5000);
  scene.tweens.add({ targets: nuvem, y: nuvem.y - 30, alpha: 0, duration: 600, onComplete: () => nuvem.destroy() });
  TR.sfx(scene, 'pulo', 0.5, 1.3);
  const acaba = () => {
    scene.events.off('postupdate', segue);
    if (bike.active) bike.destroy();
    if (spr.active) spr.setVisible(true);
  };
  scene.time.delayedCall(segundos * 1000, acaba);
  scene.events.once('shutdown', acaba);
};

/*
 * Ciclo do dia na rua: tarde -> hora dourada -> pôr do sol -> crepúsculo azul -> noite.
 * TR.ruaComCeu(scene) troca o fundo pela rua sem céu + um céu desenhado (o sol se põe atrás dos telhados).
 * TR.cicloDoDia(scene, progresso, falar) atualiza tudo a cada quadro; progresso() vai de 0 (tarde) a 1 (noite).
 */
TR.CICLO = {
  topo: [[0, 0x60a0e4], [0.35, 0x6e80c8], [0.58, 0x564288], [0.78, 0x222056], [1, 0x0a0c22]],
  meio: [[0, 0x96c4ee], [0.35, 0xeca07c], [0.58, 0xd66868], [0.78, 0x4e4280], [1, 0x161a3e]],
  hori: [[0, 0xd2e4f2], [0.35, 0xffd088], [0.58, 0xffa056], [0.78, 0xc47476], [1, 0x2c2a54]],
  luz: [[0, 0xffffff], [0.35, 0xffe2c2], [0.58, 0xf0b096], [0.78, 0x8c82be], [1, 0x465088]],
};
TR.corNoTempo = (chaves, p) => {
  for (let i = 0; i < chaves.length - 1; i++) {
    const [p0, c0] = chaves[i], [p1, c1] = chaves[i + 1];
    if (p >= p0 && p <= p1) {
      const a = Phaser.Display.Color.ValueToColor(c0), b = Phaser.Display.Color.ValueToColor(c1);
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, 100, ((p - p0) / (p1 - p0)) * 100);
      return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
    }
  }
  return chaves[chaves.length - 1][1];
};
TR.ruaComCeu = (scene) => {
  scene._ceu = scene.add.graphics().setDepth(-10);
  scene.add.image(0, 0, 'rua_sem_ceu').setOrigin(0).setDepth(-5);
  TR.desenhaCeu(scene, 0, 0);
};
TR.desenhaCeu = (scene, p, t) => {
  const g = scene._ceu; if (!g) return;
  g.clear();
  const topo = TR.corNoTempo(TR.CICLO.topo, p), meio = TR.corNoTempo(TR.CICLO.meio, p), hori = TR.corNoTempo(TR.CICLO.hori, p);
  const mix = (a, b, k) => { const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(a), Phaser.Display.Color.ValueToColor(b), 100, k * 100); return Phaser.Display.Color.GetColor(c.r, c.g, c.b); };
  for (let y = 0; y < 90; y += 3) {
    const k = y / 89;
    g.fillStyle(k < 0.55 ? mix(topo, meio, k / 0.55) : mix(meio, hori, (k - 0.55) / 0.45), 1).fillRect(0, y, 960, 3);
  }
  // sol descendo até sumir atrás das casas
  const sy = 18 + p * 125, sx = 700 + p * 60;
  const corSol = p < 0.35 ? 0xfffadc : p < 0.6 ? 0xffd078 : 0xff9a50;
  g.fillStyle(corSol, 0.25).fillCircle(sx, sy, 34);
  g.fillStyle(corSol, 1).fillCircle(sx, sy, 16);
  // nuvens
  const nuv = mix(hori, 0xffffff, p < 0.5 ? 0.35 : 0.1);
  [[120, 22, 120], [420, 14, 90], [860, 30, 110]].forEach(([cx, cy, w]) => {
    const x = ((cx + t * 0.006) % 1160) - 100;
    g.fillStyle(nuv, 0.9).fillEllipse(x + w / 2, cy + 8, w, 16);
  });
  // estrelas e lua no fim
  if (p > 0.68) {
    const a = Math.min(1, (p - 0.68) / 0.25);
    for (let k = 0; k < 60; k++) {
      const x = (k * 157) % 960, y = (k * 37) % 46;
      g.fillStyle(0xfff8dc, a * (0.5 + 0.5 * Math.sin(t / 400 + k))).fillRect(x, y, 2, 2);
    }
    g.fillStyle(0xfaf4dc, a).fillCircle(194, 26, 13);
    g.fillStyle(topo, a).fillCircle(201, 22, 12);
  }
};
TR.cicloDoDia = (scene, progresso, falar) => {
  const L = scene.cache.json.get('rua_luzes');
  const luz = scene.add.rectangle(480, 270, 960, 540, 0xffffff, 1).setDepth(4790).setBlendMode(Phaser.BlendModes.MULTIPLY);
  const brilho = scene.add.graphics().setDepth(4795).setBlendMode(Phaser.BlendModes.ADD);
  const liga = L.janelas.map((_, i) => 0.62 + ((i * 0.37) % 1) * 0.26);   // cada janela acende num momento
  let avisou = false, n = 0;
  const passo = (t) => {
    const p = Phaser.Math.Clamp(progresso(), 0, 1);
    if (n++ % 3 === 0) TR.desenhaCeu(scene, p, t);
    luz.setFillStyle(TR.corNoTempo(TR.CICLO.luz, p), 1);
    brilho.clear();
    L.janelas.forEach(([x0, y0, x1, y1], i) => {
      if (p < liga[i]) return;
      const a = Math.min(1, (p - liga[i]) / 0.05);
      brilho.fillStyle(0xffc860, 0.75 * a).fillRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
      brilho.fillStyle(0xffb040, 0.18 * a).fillRect(x0 - 8, y0 - 8, x1 - x0 + 17, y1 - y0 + 17);
    });
    const poste = Phaser.Math.Clamp((p - 0.66) / 0.08, 0, 1);
    if (poste > 0) {
      const [px, py] = L.poste;
      brilho.fillStyle(0xffe8a8, 0.9 * poste).fillCircle(px, py, 7);
      brilho.fillStyle(0xffd890, 0.22 * poste).fillCircle(px, py, 22);
      brilho.fillStyle(0xffd080, 0.1 * poste).fillTriangle(px - 6, py + 6, px - 120, 300, px + 120, 300);
      brilho.fillStyle(0xffd080, 0.12 * poste).fillEllipse(px, 300, 280, 50);
    }
    if (p > 0.82) {   // vaga-lumes
      for (let k = 0; k < 10; k++) {
        const a = 0.5 + 0.5 * Math.sin(t / 300 + k * 1.7);
        brilho.fillStyle(0xc8ff8c, 0.6 * a).fillRect((k * 97 + t * 0.01 * (k % 3 + 1)) % 960, 300 + ((k * 53) % 180) + Math.sin(t / 700 + k) * 6, 2, 2);
      }
    }
    if (!avisou && p > 0.72 && falar) { avisou = true; falar(Phaser.Utils.Array.GetRandom(['Tá escurecendo...', 'Mais 5 minutos, mãe!', 'Já acendeu o poste!'])); }
  };
  scene.events.on('update', passo);
  scene.events.once('shutdown', () => scene.events.off('update', passo));
};

// Orelhão: toca o toque 8-bit do jogo, sem precisar do YouTube
TR.orelhao = (scene, falante) => {
  if (scene._orelhaoTocando) return;
  scene._orelhaoTocando = true;
  const jblTocando = Radio.playing;
  if (jblTocando) Radio.pause();
  TR.sfx(scene, 'orelhao', 0.7);
  TR.bubble(scene, falante, 'Trim-trim... o orelhão tá tocando!', 1.8);
  scene.time.delayedCall(2600, () => TR.bubble(scene, falante, 'Alô? Quem tá falando?', 1.8));
  scene.time.delayedCall(7400, () => {
    scene._orelhaoTocando = false;
    if (jblTocando && Radio.mode === 'radio') Radio.toggle();   // a JBL volta a tocar
  });
};
