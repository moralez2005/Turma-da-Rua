/*
 * As vizinhas da rua: o que acontece quando a bola cai no quintal de cada uma.
 * Os nomes são inventados (inspirados nas vizinhas de verdade). Pra mudar nome, cor ou fala, mexa só aqui.
 *
 * Como funciona: a cena chama TR.bolaNaCasa(scene, 'tita' | 'vera', { volta, furou }).
 *   - volta(x, y): a vizinha devolveu a bola, que sai da porta (x, y) de volta pra rua.
 *   - furou(): a bola furou. Fim de jogo.
 */
TR.VIZINHAS = {
  tita: {
    nome: 'Dona Tita',
    casa: 'a casa rosa',
    porta: [698, 232],          // onde ela aparece (coordenadas da rua 960x540)
    faixaX: [596, 790],         // pedaço da rua em frente à casa
    roupa: 0xe86a9a, cabelo: 0x3a2a26, pele: 0xc98d62,
    demora: [1800, 3000],       // milissegundos até devolver
    chanceFurar: () => 0,       // a Dona Tita nunca fura
    falas: {
      chega: ['Já vai, já vai!', 'Ô, meninos...', 'Peraí que eu pego!'],
      devolve: ['Toma! Cuidado com a janela, hein!', 'Aqui, ó. Joguem direitinho!', 'Pega! E nada de briga, viu?'],
      marido: ['O marido dela jogou de volta!', 'Seu marido devolveu na hora!'],
    },
  },
  vera: {
    nome: 'Dona Vera',
    casa: 'a casa lilás',
    porta: [878, 232],
    faixaX: [790, 960],
    roupa: 0x8a5ac8, cabelo: 0x6a3a22, pele: 0xd8a27a,
    demora: [4500, 7000],       // ela demora, impaciente
    // quanto mais vezes a bola cai lá, maior a chance da filha furar
    chanceFurar: (vezes) => Math.min(0.6, 0.12 + (vezes - 1) * 0.18),
    falas: {
      chega: ['DE NOVO?!', 'Toda vez isso!', 'Vocês não cansam, não?!'],
      devolve: ['Última vez, ouviram?!', 'Próxima eu não devolvo!', 'Vai, toma! E some daqui!'],
      filha: ['A filha da Dona Vera pegou a bola...', 'Ih... a filha dela tá com uma faca...'],
    },
  },
};

TR.vizinhaDaFaixa = (x) => Object.keys(TR.VIZINHAS).find((k) => x >= TR.VIZINHAS[k].faixaX[0] && x <= TR.VIZINHAS[k].faixaX[1]);

// Bonequinha simples desenhada por código (dá pra trocar por um sprite depois)
TR.desenhaVizinha = (scene, v, x, y) => {
  const g = scene.add.graphics().setDepth(y + 1);
  const o = 0x241a2c;
  g.fillStyle(o, 1).fillRect(-17, -98, 34, 98);                       // contorno
  g.fillStyle(v.roupa, 1).fillRect(-15, -60, 30, 52);                 // vestido
  g.fillStyle(v.pele, 1).fillRect(-12, -88, 24, 26);                  // rosto
  g.fillStyle(v.cabelo, 1).fillRect(-15, -96, 30, 12).fillRect(-15, -84, 5, 22).fillRect(10, -84, 5, 22);
  g.fillStyle(o, 1).fillRect(-6, -78, 3, 3).fillRect(3, -78, 3, 3).fillRect(-4, -69, 8, 2);
  g.fillStyle(v.pele, 1).fillRect(-21, -56, 6, 22).fillRect(15, -56, 6, 22); // braços
  g.fillStyle(v.pele, 1).fillRect(-10, -8, 7, 8).fillRect(3, -8, 7, 8);       // pernas
  g.setPosition(x, y);
  g.setScale(1, 0.1);
  scene.tweens.add({ targets: g, scaleY: 1, duration: 260, ease: 'Back.Out' });
  return g;
};

TR.bolaNaCasa = (scene, id, cb) => {
  const v = TR.VIZINHAS[id];
  scene._vezesNaCasa = scene._vezesNaCasa || {};
  const vezes = scene._vezesNaCasa[id] = (scene._vezesNaCasa[id] || 0) + 1;
  const [px, py] = v.porta;
  const pick = (a) => Phaser.Utils.Array.GetRandom(a);
  TR.sfx(scene, 'quique', 0.5, 0.7);
  if (scene.flash) scene.flash('Caiu na ' + v.casa + '!');
  const espera = Phaser.Math.Between(v.demora[0], v.demora[1]);
  let dona = null;
  scene.time.delayedCall(Math.min(1200, espera / 2), () => {
    dona = TR.desenhaVizinha(scene, v, px, py);
    TR.bubble(scene, [px, py], pick(v.falas.chega), 1.6, { offY: 104 });
  });
  scene.time.delayedCall(espera, () => {
    if (scene.state === 'end') return;
    if (Math.random() < v.chanceFurar(vezes)) {
      TR.bubble(scene, [px, py], pick(v.falas.filha), 2.2, { offY: 104 });
      scene.time.delayedCall(2000, () => {
        TR.sfx(scene, 'queimado', 0.7, 0.6);
        scene.cameras.main.shake(220, 0.01);
        if (dona) dona.destroy();
        cb.furou();
      });
      return;
    }
    const fala = v.falas.marido && Math.random() < 0.4 ? pick(v.falas.marido) : pick(v.falas.devolve);
    TR.bubble(scene, [px, py], fala, 1.8, { offY: 104 });
    scene.time.delayedCall(400, () => {
      cb.volta(px, py + 30);
      scene.time.delayedCall(900, () => {
        if (dona) scene.tweens.add({ targets: dona, alpha: 0, duration: 300, onComplete: () => dona.destroy() });
      });
    });
  });
};
