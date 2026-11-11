/*
 * Eventos da rua que aparecem em várias cenas.
 *
 * TR.fusca(scene, { y, kids, voce, depth })
 *   Passa um Fusca azul (opções: y, depth, semCarro). Quem apertar F primeiro grita "FUSCA AZUL!" e dá um peteleco no mais perto.
 *   Se você demorar, alguém da turma grita antes e o peteleco é em você.
 *   kids() devolve os sprites da turma na cena; voce() devolve o seu sprite.
 *
 * TR.orelhao(scene, falante)
 *   O orelhão toca um toque 8-bit original (assets/sons/orelhao.wav, feito por ferramentas/gerador/orelhao.py).
 *   Se a JBL estiver tocando, ela pausa enquanto o orelhão toca.
 */
TR.placar = TR.placar || { petelecosDados: 0, petelecosLevados: 0 };

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
  let resolvido = false;
  const terminar = (vocePrimeiro) => {
    if (resolvido) return;
    resolvido = true;
    scene.input.keyboard.off('keydown-F', apertou);
    aviso.destroy(); fundo.destroy();
    const voce = o.voce();
    const outros = o.kids().filter((s) => s && s !== voce && s.active);
    if (!voce || !outros.length) return;
    const perto = (a) => outros.slice().sort((p, q) => Phaser.Math.Distance.Between(a.x, a.y, p.x, p.y) - Phaser.Math.Distance.Between(a.x, a.y, q.x, q.y))[0];
    if (vocePrimeiro) {
      const alvo = perto(voce);
      TR.placar.petelecosDados++;
      TR.bubble(scene, voce, 'FUSCA AZUL! Peteleco!', 1.4);
      TR.peteleco(scene, alvo);
      scene.time.delayedCall(500, () => TR.bubble(scene, alvo, Phaser.Utils.Array.GetRandom(['AI!', 'Ô, não vi!', 'Vale nada, não valeu!']), 1.3));
    } else {
      const quem = Phaser.Utils.Array.GetRandom(outros);
      TR.placar.petelecosLevados++;
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
