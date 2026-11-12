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
