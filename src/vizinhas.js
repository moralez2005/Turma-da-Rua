/*
 * As vizinhas da rua: o que acontece quando a bola cai no quintal de cada uma.
 * Os nomes são inventados (inspirados nas vizinhas de verdade). Pra mudar nome, cor ou fala, mexa só aqui.
 *
 * Como funciona: a cena chama TR.bolaNaCasa(scene, 'tita' | 'vera', { volta, furou }).
 *   - volta(x, y): a vizinha devolveu a bola, que sai da porta (x, y) de volta pra rua.
 *   - furou(): a bola furou. Fim de jogo.
 *
 * TR.vizinhaEspia(scene, 'tita' | 'vera', 'portao' | 'agua', depois)
 *   A vizinha aparece um instante na porta, fala e some. O jogo não para.
 */
TR.VIZINHAS = {
  tita: {
    nome: 'Dona Tita',
    pessoa: 'tita',
    casa: 'a casa rosa',
    porta: [698, 232],          // onde ela aparece (coordenadas da rua 960x540)
    faixaX: [596, 790],         // pedaço da rua em frente à casa
    demora: [1800, 3000],       // milissegundos até devolver
    chanceFurar: () => 0,       // a Dona Tita nunca fura
    falas: {
      chega: ['Já vai, já vai!', 'Ô, meninos...', 'Peraí que eu pego!'],
      devolve: ['Toma! Cuidado com a janela, hein!', 'Aqui, ó. Joguem direitinho!', 'Pega! E nada de briga, viu?'],
      marido: ['(devolveu sem falar nada)', 'Hm.', '...toma.'],
      portao: ['Olha a minha janela, hein!', 'Devagar com essa bola, meninos!'],
      agua: ['Meninos, querem água gelada?', 'Tá quente, hein! Vem pegar água!'],
      respostaAgua: ['Valeu, Dona Tita!', 'Opa, quero!', 'Já vou, Dona Tita!'],
    },
  },
  vera: {
    nome: 'Dona Vera',
    pessoa: 'vera',
    casa: 'a casa lilás',
    porta: [878, 232],
    faixaX: [790, 960],
    demora: [4500, 7000],       // ela demora, impaciente
    // quanto mais vezes a bola cai lá, maior a chance da filha furar
    chanceFurar: (vezes) => Math.min(0.6, 0.12 + (vezes - 1) * 0.18),
    falas: {
      chega: ['DE NOVO?!', 'Toda vez isso!', 'Vocês não cansam, não?!'],
      devolve: ['Última vez, ouviram?!', 'Próxima eu não devolvo!', 'Vai, toma! E some daqui!'],
      filha: ['A filha da Dona Vera pegou a bola...', 'Ih... ela tá com uma faca na mão...'],
      portao: ['MEU PORTÃO!', 'Vai amassar o portão!', 'Já falei pra jogar longe daqui!'],
    },
  },
};

TR.vizinhaDaFaixa = (x) => Object.keys(TR.VIZINHAS).find((k) => x >= TR.VIZINHAS[k].faixaX[0] && x <= TR.VIZINHAS[k].faixaX[1]);

// Como cada um é (desenhado por código, em pixel art)
TR.PESSOAS = {
  // Dona Tita: uns 60 anos, morena, de óculos, gordinha, cabelo preto preso, vestido florido
  tita: { pele: 0xb07850, cabelo: 0x1e1614, penteado: 'coque', oculos: 0x2a2a2a, largura: 40, altura: 92, roupa: 0xe86a9a, detalhe: 0xffd0e0, perna: 0xb07850 },
  // o marido da Dona Tita: uns 70, magro, branco, grisalho, calado
  marido: { pele: 0xf0c8a8, cabelo: 0xc8c8c8, penteado: 'curto', oculos: null, largura: 24, altura: 106, roupa: 0xd8d0b8, detalhe: 0xb8b098, perna: 0x6a5a48 },
  // Dona Vera: quarenta e poucos, morena, óculos de armação roxa, sem paciência
  vera: { pele: 0xa86e48, cabelo: 0x3a2418, penteado: 'solto', oculos: 0x9a3ad8, largura: 30, altura: 98, roupa: 0x8a5ac8, detalhe: 0xb08ae0, perna: 0x3a4a6a },
  // a filha da Dona Vera: uns 30, branca, gordinha, quieta... e fura a bola
  filha: { pele: 0xf2c8a8, cabelo: 0x8a5a30, penteado: 'coque', oculos: null, largura: 38, altura: 96, roupa: 0x5a5a64, detalhe: 0x76767e, perna: 0x2a2a34, brava: true },
};

// Cada pessoa é um sprite feito pelo mesmo gerador dos meninos (ferramentas/gerador/vizinhas_hd.py)
TR.desenhaPessoa = (scene, quem, x, y) => {
  const spr = scene.add.sprite(x, y, 'viz_' + quem, 0).setOrigin(0.5, 0.97).setDepth(y + 1).setScale(1.06, 0.1);
  spr.play('viz_' + quem + '_idle');
  scene.tweens.add({ targets: spr, scaleY: 1.06, duration: 260, ease: 'Back.Out' });
  spr.fala = () => { if (spr.active) { spr.play('viz_' + quem + '_fala'); spr.once('animationcomplete', () => { if (spr.active) spr.play('viz_' + quem + '_idle'); }); } };
  scene.time.delayedCall(280, () => spr.fala());
  return spr;
};
// compatibilidade: a vizinha "dona da casa"
TR.desenhaVizinha = (scene, v, x, y, quem) => TR.desenhaPessoa(scene, quem || v.pessoa, x, y);

TR.vizinhaEspia = (scene, id, tipo, depois) => {
  const v = TR.VIZINHAS[id];
  const falas = v.falas[tipo];
  if (!falas) return false;
  const agora = scene.time.now;
  scene._espiaAte = scene._espiaAte || {};
  if (agora < (scene._espiaAte[id] || 0)) return false;   // espera um pouco entre uma bronca e outra
  scene._espiaAte[id] = agora + 12000;
  const [px, py] = v.porta;
  const dona = TR.desenhaVizinha(scene, v, px, py);
  TR.bubble(scene, [px, py], Phaser.Utils.Array.GetRandom(falas), 2, { offY: 112 });
  scene.time.delayedCall(2200, () => scene.tweens.add({ targets: dona, alpha: 0, duration: 300, onComplete: () => dona.destroy() }));
  if (depois) scene.time.delayedCall(900, depois);
  return true;
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
  const vaiFurar = Math.random() < v.chanceFurar(vezes);
  const veioMarido = !vaiFurar && v.falas.marido && Math.random() < 0.4;
  scene.time.delayedCall(Math.min(1200, espera / 2), () => {
    // o marido da Dona Tita é calado: ele só aparece e devolve. A filha da Dona Vera aparece quando é pra furar.
    dona = TR.desenhaPessoa(scene, veioMarido ? 'marido' : (vaiFurar && id === 'vera' ? 'filha' : v.pessoa), px, py);
    TR.bubble(scene, [px, py], veioMarido ? '...' : (vaiFurar && id === 'vera' ? '...' : pick(v.falas.chega)), 1.6, { offY: 112 });
  });
  scene.time.delayedCall(espera, () => {
    if (scene.state === 'end') return;
    if (vaiFurar) {
      TR.bubble(scene, [px, py], pick(v.falas.filha), 2.2, { offY: 112 });
      scene.time.delayedCall(2000, () => {
        TR.sfx(scene, 'queimado', 0.7, 0.6);
        scene.cameras.main.shake(220, 0.01);
        if (dona) dona.destroy();
        cb.furou();
      });
      return;
    }
    const fala = veioMarido ? pick(v.falas.marido) : pick(v.falas.devolve);
    TR.bubble(scene, [px, py], fala, 1.8, { offY: 112 });
    scene.time.delayedCall(400, () => {
      cb.volta(px, py + 30);
      scene.time.delayedCall(900, () => {
        if (dona) scene.tweens.add({ targets: dona, alpha: 0, duration: 300, onComplete: () => dona.destroy() });
      });
    });
  });
};
