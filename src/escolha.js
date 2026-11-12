/*
 * Telas de escolha antes das brincadeiras.
 *
 * TR.escolherTimes(scene, chave, cfg, cb)
 *   Monta dois times com qualquer um da turma. Clique num moleque (ou aperte 1 a 7) pra mudar:
 *   fora → time azul → time vermelho → fora. O primeiro do time azul é você.
 *   cfg = { titulo, porTime: 3, papeis: ['Atacante', 'Defesa', 'Goleiro'] (opcional), padrao: { azul: [...], vermelho: [...] } }
 *   cfg.opcoes (opcional): botões de partida que mudam a cada clique, ex.:
 *     [{ chave: 'tempo', rotulo: 'Tempo', tecla: 'T', valores: [[120, '2 min'], [180, '3 min']], padrao: 180 }]
 *   cb({ azul: [ids], vermelho: [ids], fora: [ids], opcoes: { tempo: 180, ... } })
 *
 * TR.escolherVoce(scene, chave, cfg, cb)
 *   Escolhe só com quem você vai jogar. cfg = { titulo, padrao: 'pernalonga', dica }
 *
 * A última escolha fica guardada (TR.escolhas[chave]) e já vem marcada da próxima vez.
 */
TR.ORDEM = ['pernalonga', 'cezar', 'kaua', 'pedro', 'lucas', 'daniel', 'gabriel', 'matheus', 'guilherme', 'manu'];
// tecla de cada carta: 1 a 9 e o 0 pra décima
TR.teclaCarta = (i) => (i === 9 ? '0' : String(i + 1));
TR.cartaDaTecla = (key) => { const d = parseInt(key, 10); if (isNaN(d)) return null; return TR.ORDEM[d === 0 ? 9 : d - 1] || null; };
TR.escolhas = {};

TR._telaEscolha = (scene, titulo, alturaExtra) => {
  const itens = [];
  const add = (o) => { itens.push(o); return o; };
  add(TR.panel(scene, 480, 270 + (alturaExtra || 0) / 2, 880, 420 + (alturaExtra || 0), 7000));
  add(TR.txt(scene, 480, 78, titulo, 2, 0xffd36a).setOrigin(0.5).setScrollFactor(0).setDepth(7001));
  return { itens, add, fechar: () => itens.forEach((o) => o.destroy()) };
};

TR._cartas = (scene, tela, onClick) => {
  const cartas = {};
  TR.ORDEM.forEach((id, i) => {
    const x = 84 + i * 88, y = 250;
    const fundo = tela.add(scene.add.rectangle(x, y - 40, 80, 170, 0x1a1222, 1).setScrollFactor(0).setDepth(7001)
      .setStrokeStyle(3, 0x5b4466).setInteractive({ useHandCursor: true }));
    const spr = tela.add(scene.add.sprite(x, y + 30, id, 0).setOrigin(0.5, 1).setScale(0.85).setScrollFactor(0).setDepth(7002));
    spr.play(id + '_idle');
    const nome = tela.add(TR.txt(scene, x, y + 36, TR.teclaCarta(i) + '.' + TR.KIDS[id].nome, 1, 0xfff1d6).setOrigin(0.5, 0).setScrollFactor(0).setDepth(7002));
    if (nome.width > 84) nome.setScale(84 / nome.width);
    const tag = tela.add(TR.txt(scene, x, y - 118, '', 1, 0xffffff).setOrigin(0.5).setScrollFactor(0).setDepth(7002));
    if (TR.KIDS[id].novo) tela.add(TR.txt(scene, x, y - 100, 'NOVO', 1, 0x7cf27c).setOrigin(0.5).setScrollFactor(0).setDepth(7002));
    fundo.on('pointerdown', () => onClick(id));
    fundo.on('pointerover', () => TR.sfx(scene, 'hover', 0.2));
    cartas[id] = { fundo, spr, nome, tag };
  });
  return cartas;
};

TR.escolherTimes = (scene, chave, cfg, cb) => {
  const n = cfg.porTime || 3;
  const salvo = TR.escolhas[chave] || cfg.padrao;
  let azul = salvo.azul.slice(), vermelho = salvo.vermelho.slice();
  const tela = TR._telaEscolha(scene, cfg.titulo || 'Monte os times', cfg.opcoes ? 50 : 0);
  const ops = cfg.opcoes || [];
  const escolhidas = Object.assign({}, ...ops.map((o) => ({ [o.chave]: o.padrao })), (salvo.opcoes || {}));
  tela.add(TR.txt(scene, 480, 108, 'Clique (ou 1 a 0) pra trocar: fora → AZUL → VERMELHO. O 1º do azul é você.', 1, 0xc9b8d8)
    .setOrigin(0.5).setScrollFactor(0).setDepth(7001));
  const yOp = 392, yBot = ops.length ? 466 : 450;
  const resumo = tela.add(TR.txt(scene, 480, 326, '', 1, 0xfff1d6).setOrigin(0.5, 0).setScrollFactor(0).setDepth(7001));
  const aviso = tela.add(TR.txt(scene, 480, ops.length ? 422 : 396, '', 1, 0xff9a7a).setOrigin(0.5, 0).setScrollFactor(0).setDepth(7001));
  // botões de partida (tempo, gols, clima...): cada clique passa pro próximo valor
  const rotuloOp = (o) => o.rotulo + ': ' + (o.valores.find((v) => v[0] === escolhidas[o.chave]) || o.valores[0])[1] + ' (' + o.tecla + ')';
  const proxOp = (o) => {
    const i = o.valores.findIndex((v) => v[0] === escolhidas[o.chave]);
    escolhidas[o.chave] = o.valores[(i + 1) % o.valores.length][0];
    TR.sfx(scene, 'clique', 0.3);
    redesenhaOps();
  };
  let botoesOp = [];
  const redesenhaOps = () => {
    botoesOp.forEach((b) => b.destroy());
    botoesOp = ops.map((o, i) => TR.button(scene, 480 + (i - (ops.length - 1) / 2) * 250, yOp, rotuloOp(o), () => proxOp(o), { fixed: true, depth: 7003, w: 220 }));
  };
  redesenhaOps();

  const ciclo = (id) => {
    TR.sfx(scene, 'clique', 0.3);
    if (azul.includes(id)) { azul = azul.filter((x) => x !== id); if (vermelho.length < n) vermelho.push(id); }
    else if (vermelho.includes(id)) vermelho = vermelho.filter((x) => x !== id);
    else if (azul.length < n) azul.push(id);
    else if (vermelho.length < n) vermelho.push(id);
    desenha();
  };
  const cartas = TR._cartas(scene, tela, ciclo);
  const nomeDe = (lista, i) => (lista[i] ? TR.KIDS[lista[i]].nome : '___');
  const linha = (rot, lista) => rot + ': ' + Array.from({ length: n }, (_, i) => (cfg.papeis ? cfg.papeis[i] + ' ' : '') + nomeDe(lista, i)).join('  ·  ');
  const desenha = () => {
    TR.ORDEM.forEach((id) => {
      const c = cartas[id];
      const ia = azul.indexOf(id), iv = vermelho.indexOf(id);
      if (ia >= 0) { c.fundo.setStrokeStyle(4, 0x5ab0ff); c.tag.setText(ia === 0 ? 'VOCÊ' : 'AZUL').setTint(0x9ccfff); c.spr.clearTint(); }
      else if (iv >= 0) { c.fundo.setStrokeStyle(4, 0xff6a5a); c.tag.setText('VERMELHO').setTint(0xffaa9c); c.spr.clearTint(); }
      else { c.fundo.setStrokeStyle(3, 0x5b4466); c.tag.setText('fora').setTint(0x8a7a96); c.spr.setTint(0x777777); }
    });
    resumo.setText(linha('AZUL', azul) + '\n' + linha('VERMELHO', vermelho));
    aviso.setText(azul.length === n && vermelho.length === n ? '' : 'Cada time precisa de ' + n + ' jogadores.');
  };
  const sortear = () => {
    const todos = Phaser.Utils.Array.Shuffle(TR.ORDEM.slice());
    azul = todos.slice(0, n); vermelho = todos.slice(n, n * 2);
    TR.sfx(scene, 'selecionar', 0.4); desenha();
  };
  const jogar = () => {
    if (azul.length !== n || vermelho.length !== n) { TR.sfx(scene, 'derrota', 0.3); return; }
    TR.escolhas[chave] = { azul: azul.slice(), vermelho: vermelho.slice(), opcoes: Object.assign({}, escolhidas) };
    scene.input.keyboard.off('keydown', teclas);
    tela.fechar();
    botoesOp.forEach((b) => b.destroy());
    // espera um instante: o mesmo Enter não pode pular a tela de instruções que vem depois
    scene.time.delayedCall(60, () => cb({ azul, vermelho, fora: TR.ORDEM.filter((id) => !azul.includes(id) && !vermelho.includes(id)), opcoes: escolhidas }));
  };
  const teclas = (ev) => {
    const id = TR.cartaDaTecla(ev.key);
    if (id) ciclo(id);
    if (ev.code === 'KeyR') sortear();
    if (ev.code === 'Enter') jogar();
    ops.forEach((o) => { if (ev.code === 'Key' + o.tecla) proxOp(o); });
  };
  tela.add(TR.button(scene, 300, yBot, 'Sortear (R)', sortear, { fixed: true, depth: 7003, w: 170 }));
  tela.add(TR.button(scene, 480, yBot, 'Padrão', () => { azul = cfg.padrao.azul.slice(); vermelho = cfg.padrao.vermelho.slice(); desenha(); }, { fixed: true, depth: 7003, w: 170 }));
  tela.add(TR.button(scene, 660, yBot, 'Jogar (Enter)', jogar, { fixed: true, depth: 7003, w: 170 }));
  scene.time.delayedCall(200, () => scene.input.keyboard.on('keydown', teclas));
  desenha();
};

TR.escolherVoce = (scene, chave, cfg, cb) => {
  let voce = TR.escolhas[chave] || cfg.padrao;
  const tela = TR._telaEscolha(scene, cfg.titulo || 'Com quem você vai jogar?');
  tela.add(TR.txt(scene, 480, 108, cfg.dica || 'Clique em alguém da turma (ou 1 a 0) e aperte Enter.', 1, 0xc9b8d8)
    .setOrigin(0.5).setScrollFactor(0).setDepth(7001));
  const info = tela.add(TR.txt(scene, 480, 350, '', 1, 0xfff1d6).setOrigin(0.5, 0).setScrollFactor(0).setDepth(7001));
  const marca = (id) => { voce = id; TR.sfx(scene, 'clique', 0.3); desenha(); };
  const cartas = TR._cartas(scene, tela, marca);
  const desenha = () => {
    TR.ORDEM.forEach((id) => {
      const c = cartas[id], on = id === voce;
      c.fundo.setStrokeStyle(on ? 4 : 3, on ? 0xffd36a : 0x5b4466);
      c.tag.setText(on ? 'VOCÊ' : '').setTint(0xffd36a);
      if (on) c.spr.clearTint(); else c.spr.setTint(0x999999);
    });
    const k = TR.KIDS[voce];
    info.setText(k.nome + ' · ' + (cfg.habilidade ? cfg.habilidade(voce) : k.hab + ': ' + k.habDesc));
  };
  const jogar = () => {
    TR.escolhas[chave] = voce;
    scene.input.keyboard.off('keydown', teclas);
    tela.fechar();
    scene.time.delayedCall(60, () => cb(voce));
  };
  const teclas = (ev) => {
    const id = TR.cartaDaTecla(ev.key);
    if (id) marca(id);
    if (ev.code === 'Enter') jogar();
  };
  tela.add(TR.button(scene, 480, 450, 'Jogar (Enter)', jogar, { fixed: true, depth: 7003, w: 200 }));
  scene.time.delayedCall(200, () => scene.input.keyboard.on('keydown', teclas));
  desenha();
};
