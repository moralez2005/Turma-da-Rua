/* Coisas compartilhadas por todas as cenas: dados da turma, textos, balões, botões, sons, JBL. */
const TR = {
  W: 960,
  H: 540,
  KIDS: {
    pernalonga: { nome: 'Pernalonga', vel: 230, chute: 5, hab: 'Passada longa', habDesc: 'corre muito mais rápido por um tempo' },
    cezar: { nome: 'Cezar', vel: 245, chute: 3, hab: 'Caneta', habDesc: 'arrancada rápida, ninguém rouba a bola' },
    kaua: { nome: 'Kauã', vel: 180, chute: 2, hab: 'Paredão', habDesc: 'goleiro que pega quase tudo' },
    pedro: { nome: 'Pedro', vel: 185, chute: 4, hab: 'Bomba', habDesc: 'o próximo chute sai fortíssimo' },
    lucas: { nome: 'Lucas', vel: 225, chute: 3, hab: 'Zoeira', habDesc: 'zoa quem está perto e deixa todo mundo lento' },
    daniel: { nome: 'Daniel', vel: 205, chute: 3, hab: 'Estrategista', habDesc: 'mostra onde está o alvo' },
    gabriel: { nome: 'Gabriel', vel: 220, chute: 2, hab: 'Gato', habDesc: 'pulo de goleiro mais rápido' },
    // desbloqueáveis (novo: true). Não têm sprite na cena final (semFinal).
    matheus: { nome: 'Matheus', vel: 225, chute: 3, hab: 'Bike do nada', habDesc: 'aparece numa bike e dispara', novo: true, semFinal: true },
    guilherme: { nome: 'Guilherme', vel: 215, chute: 3, hab: 'Treta', habDesc: 'arruma treta e trava quem está perto (o Pedro mais ainda)', novo: true, semFinal: true },
    manu: { nome: 'Manu', vel: 210, chute: 2, hab: 'Pequenininha', habDesc: 'passa por baixo de todo mundo; se esconde onde ninguém cabe', novo: true, semFinal: true },
  },
  // Falas soltas de cada um (o jeitão de cada moleque)
  FRASES: {
    pedro: ['Vou embora e vou levar a bola!', 'Para de me zoar, mano!', 'Quando eu for MC compro um foguetão',
      'Ó o óculos, respeita o estilo', 'Tá tocando o meu funk? Aumenta!', 'Não é Juliete, é Pedro!',
      'Um dia vocês vão me ver no palco', 'Bola é minha, regra é minha', 'Tô de boné pra trás, tô no estilo'],
    lucas: ['Dona Juliete! kkkk', 'Relaxa, é só zoeira', 'Solta o som aí!', 'Juliete, cadê o óculos? kkk',
      'Tô nem aí, tô de boa', 'Bora que bora!', 'Olha a orelha do Pedro kkkk', 'Põe twenty one pilots aí'],
    daniel: ['Dona Juliete kkkk', 'Pera, tô terminando a partida', 'Isso aí é igual Minecraft',
      'No Brawl eu sou mestre', 'Clash Royale de noite?', 'Já calculei a jogada', 'Meu deck é imbatível',
      'Se fosse no Minecraft eu fazia uma casa ali'],
    cezar: ['Segura essa!', 'Duvido!', 'Partiu aprontar', 'Bora tocar a campainha e correr?',
      'Vida loka, mano!', 'Bora pular o muro?', 'Se a bola cair no quintal eu pulo', 'Ninguém me pega!'],
    kaua: ['Deixa comigo', 'Pegou nada', 'De boa...', 'Tranquilo, tranquilo', 'Comigo no gol não passa',
      'Calma, que dá tempo'],
    gabriel: ['Vou pro gol!', 'Ô Pedro, chorão!', 'Defendeu!', 'Dona Juliete chorou kkk', 'Eu sou pequeno mas sou rápido',
      'Daniel, me espera!'],
    matheus: ['Relaxa, sou de boa', 'Quem quer aprontar?', 'Vou ali e já volto', 'Cadê minha bike?', 'Bora, bora!'],
    guilherme: ['Pedro, sai daqui!', 'Ninguém me segura', 'O Pedro que começou!', 'Bora jogar sério', 'Passa a bola, mano!'],
    manu: ['Eu também quero jogar!', 'Ninguém me acha!', 'Vou contar pra mãe!', 'Me espera!', 'Eu caibo em qualquer lugar'],
    pernalonga: ['Calma, gente!', 'Toca a bola!', 'Não faz besteira, hein', 'Ninguém briga, é só brincadeira',
      'Cezar, nem pensa nisso', 'Pedro, volta, ninguém vai te zoar', 'Bora, turma!'],
  },
  // Reações por situação
  REACT: {
    gol: { pernalonga: ['Isso, turma!', 'Toca que é gol!'], cezar: ['CHUPA!', 'Golaço vida loka!'], lucas: ['Dona Juliete tomou! kkk', 'Que isso!'],
      pedro: ['GOL DO MC PEDRÃO!', 'Vai, foguetão!'], kaua: ['Boa.'], gabriel: ['Eu nem vi!'], daniel: ['Calculado!'] },
    sofreu: { pedro: ['Assim eu vou embora com a bola!', 'Foi falta! Não valeu!', 'Vou pra casa, acabou!'],
      kaua: ['Normal, acontece.', 'Bora virar.'], gabriel: ['Foi sem querer!', 'A bola tava rápida!'],
      cezar: ['Na próxima eu derrubo!', 'Ah, mano!'], pernalonga: ['Calma, dá pra virar!'], lucas: ['Foi zoeira, deixei.'], daniel: ['Bug no jogo!'] },
    zoa: ['Dona Juliete! kkkk', 'Ó a Juliete!', 'Olha a orelha!', 'Juliete chorou!'],
    // a treta do Guilherme com o Pedro (sem motivo nenhum)
    treta: ['Pedro, tu tá me olhando?', 'Sai da minha frente, Pedro!', 'Pedro, cala a boca!', 'Tá rindo de quê, Pedro?'],
    tretaPedro: ['Eu nem fiz nada, mano!', 'Que isso, Guilherme?!', 'Ó o Guilherme de novo...', 'Tu tem problema comigo?'],
    pedroResponde: ['Para, mano! Vou levar a bola!', 'Não é Juliete! É Pedro!', 'Vou embora, hein!', 'Fica zoando, fica...'],
    pazPernalonga: ['Calma, gente, é brincadeira.', 'Para de zoar o Pedro, vai.', 'Pedro, volta, joga com nós.'],
  },
  fala(id, ctx) {
    const pick = (a) => a && a.length ? a[Math.floor(Math.random() * a.length)] : '';
    if (ctx && TR.REACT[ctx] && TR.REACT[ctx][id]) return pick(TR.REACT[ctx][id]);
    return pick(TR.FRASES[id]);
  },
  /*
   * Conversa de fundo: de tempos em tempos alguém solta uma frase do seu jeito.
   * spr(id) devolve o sprite (ou null). Às vezes rola o clássico: zoam o Pedro, ele ameaça levar a bola
   * e o Pernalonga apazigua.
   */
  chatter(scene, spr, opts = {}) {
    const ids = opts.ids || Object.keys(TR.FRASES);
    const can = opts.can || (() => true);
    const loop = () => {
      if (!scene.sys.isActive()) return;
      if (can()) {
        const zoeiros = ['lucas', 'daniel', 'gabriel'].filter((i) => ids.includes(i) && spr(i));
        if (Math.random() < 0.4 && spr('guilherme') && spr('pedro')) {
          TR.bubble(scene, spr('guilherme'), Phaser.Utils.Array.GetRandom(TR.REACT.treta), 1.6);
          scene.time.delayedCall(1300, () => { if (spr('pedro')) TR.bubble(scene, spr('pedro'), Phaser.Utils.Array.GetRandom(TR.REACT.tretaPedro), 1.6); });
          if (spr('pernalonga')) scene.time.delayedCall(2700, () => { if (spr('pernalonga')) TR.bubble(scene, spr('pernalonga'), 'Vocês dois, parem!', 1.4); });
        } else if (Math.random() < 0.35 && zoeiros.length && spr('pedro')) {
          const z = zoeiros[Math.floor(Math.random() * zoeiros.length)];
          TR.bubble(scene, spr(z), TR.REACT.zoa[Math.floor(Math.random() * TR.REACT.zoa.length)], 1.6);
          scene.time.delayedCall(1300, () => { if (spr('pedro')) TR.bubble(scene, spr('pedro'), TR.REACT.pedroResponde[Math.floor(Math.random() * 4)], 1.8); });
          if (spr('pernalonga')) scene.time.delayedCall(2700, () => { if (spr('pernalonga')) TR.bubble(scene, spr('pernalonga'), TR.REACT.pazPernalonga[Math.floor(Math.random() * 3)], 1.6); });
        } else {
          const vivos = ids.filter((i) => spr(i));
          if (vivos.length) { const id = vivos[Math.floor(Math.random() * vivos.length)]; TR.bubble(scene, spr(id), TR.fala(id), 1.8); }
        }
      }
      scene.time.delayedCall(Phaser.Math.Between(opts.min || 7000, opts.max || 12000), loop);
    };
    scene.time.delayedCall(opts.first || 5000, loop);
  },
  DIRS: { down: 0, left: 1, right: 2, up: 3 },

  // ---------- texto pixelado ----------
  txt(scene, x, y, str, size = 1, color = 0xffffff) {
    const t = scene.add.bitmapText(x, y, 'pixel', str, 16 * size);
    t.setTint(color);
    return t;
  },

  // ---------- personagens ----------
  makeAnims(scene) {
    Object.keys(TR.KIDS).forEach((id) => {
      ['down', 'left', 'right', 'up'].forEach((d, row) => {
        const k = id + '_run_' + d;
        if (!scene.anims.exists(k)) {
          scene.anims.create({ key: k, frames: scene.anims.generateFrameNumbers(id, { start: row * 4, end: row * 4 + 3 }), frameRate: 10, repeat: -1 });
        }
      });
      const blink = id + '_idle';
      if (!scene.anims.exists(blink)) {
        scene.anims.create({ key: blink, frames: [{ key: id, frame: 0, duration: 2600 }, { key: id, frame: 18, duration: 140 }], repeat: -1 });
      }
    });
    if (!scene.anims.exists('matheus_pedala')) {
      scene.anims.create({ key: 'matheus_pedala', frames: scene.anims.generateFrameNumbers('matheus_bike', { start: 0, end: 5 }), frameRate: 14, repeat: -1 });
      ['tita', 'marido', 'vera', 'filha'].forEach((v) => {
        scene.anims.create({ key: 'viz_' + v + '_idle', frames: [{ key: 'viz_' + v, frame: 0, duration: 2200 }, { key: 'viz_' + v, frame: 18, duration: 140 }], repeat: -1 });
        scene.anims.create({ key: 'viz_' + v + '_fala', frames: [{ key: 'viz_' + v, frame: 19, duration: 140 }, { key: 'viz_' + v, frame: 0, duration: 140 }], repeat: 5 });
      });
    }
    if (!scene.anims.exists('caramelo_anda')) {
      scene.anims.create({ key: 'caramelo_anda', frames: scene.anims.generateFrameNumbers('caramelo', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
      scene.anims.create({ key: 'jbl_lucas_pulsa', frames: scene.anims.generateFrameNumbers('jbl_lucas', { start: 0, end: 1 }), frameRate: 6, repeat: -1 });
      scene.anims.create({ key: 'jbl_pedro_pulsa', frames: scene.anims.generateFrameNumbers('jbl_pedro', { start: 0, end: 1 }), frameRate: 6, repeat: -1 });
    }
  },
  kid(scene, id, x, y) {
    const s = scene.add.sprite(x, y, id, 0).setOrigin(0.5, 0.97);
    s.kidId = id;
    s.dir = 'down';
    return s;
  },
  pose(spr, dir, moving) {
    spr.dir = dir;
    const k = spr.kidId + '_run_' + dir;
    if (moving) {
      if (!spr.anims.isPlaying || spr.anims.currentAnim.key !== k) spr.play(k, true);
    } else {
      spr.stop();
      spr.setFrame(TR.DIRS[dir] * 4);
    }
  },
  dirFrom(dx, dy, fallback) {
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return fallback;
    return Math.abs(dx) > Math.abs(dy) * 0.9 ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  },

  // ---------- som ----------
  sfx(scene, key, vol = 0.6, rate = 1) {
    try { scene.sound.play(key, { volume: vol, rate }); } catch (e) { /* sem áudio */ }
  },

  // ---------- balão de fala ----------
  bubble(scene, target, msg, secs = 2, opts = {}) {
    // Cada personagem fala um balão por vez: o novo substitui o antigo.
    if (!scene._balloes) {
      scene._balloes = [];
      scene.events.once('shutdown', () => { scene._balloes = null; });
    }
    scene._balloes.filter((b) => b.alvo === target && b.c.active).forEach((b) => b.fechar());
    const t = TR.txt(scene, 0, 0, msg, 1, 0x241a2c).setOrigin(0.5, 1);
    const g = scene.add.graphics();
    const c = scene.add.container(0, 0, [g, t]).setDepth(5000);
    const w = t.width + 16, h = t.height + 10;
    g.fillStyle(0x241a2c, 1).fillRect(-w / 2 - 2, -h - 4, w + 4, h + 4);
    g.fillStyle(0xfff8ec, 1).fillRect(-w / 2, -h - 2, w, h);
    g.fillStyle(0xfff8ec, 1).fillTriangle(-6, -2, 6, -2, 0, 8);
    g.fillStyle(0x241a2c, 1).fillRect(-7, -2, 2, 2).fillRect(5, -2, 2, 2);
    t.setPosition(0, -6);
    c.setScale(0.2);
    scene.tweens.add({ targets: c, scale: 1, duration: 180, ease: 'Back.Out' });
    const offY = opts.offY || 142;
    const reg = { alvo: target, c, w, h, x: 0, y: 0 };
    const follow = () => {
      if (!c.active || !scene._balloes) return;
      const x = target.x !== undefined ? target.x : target[0];
      const y = target.y !== undefined ? target.y : target[1];
      const cam = scene.cameras.main;
      reg.x = Phaser.Math.Clamp(x, cam.scrollX + w / 2 + 6, cam.scrollX + TR.W - w / 2 - 6);
      reg.y = Math.max(cam.scrollY + h + 8, y - offY);
      // Se encostar num balão mais antigo, sobe até ficar livre (assim um não cobre o outro)
      scene._balloes.forEach((o) => {
        if (o === reg || !o.c.active || scene._balloes.indexOf(o) > scene._balloes.indexOf(reg)) return;
        const juntosX = Math.abs(o.x - reg.x) < (o.w + w) / 2 + 4;
        const juntosY = Math.abs(o.y - reg.y) < (o.h + h) / 2 + 6;
        if (juntosX && juntosY) reg.y = o.y - o.h - 8;
      });
      c.setPosition(reg.x, reg.y);
    };
    reg.fechar = () => {
      if (reg.fechado) return;
      reg.fechado = true;
      scene.events.off('postupdate', follow);
      if (scene._balloes) scene._balloes = scene._balloes.filter((b) => b !== reg);
      if (c.active) scene.tweens.add({ targets: c, alpha: 0, duration: 150, onComplete: () => c.destroy() });
    };
    scene._balloes.push(reg);
    follow();
    scene.events.on('postupdate', follow);
    scene.time.delayedCall(secs * 1000, reg.fechar);
    return c;
  },

  // ---------- botões e painéis ----------
  button(scene, x, y, label, cb, opts = {}) {
    const t = TR.txt(scene, 0, 0, label, opts.size || 1, 0xfff1d6).setOrigin(0.5);
    const w = Math.max(opts.w || 0, t.width + 28), h = t.height + 14;
    const g = scene.add.graphics();
    const draw = (hover) => {
      g.clear();
      g.fillStyle(0x120c18, 1).fillRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6);
      g.fillStyle(hover ? 0xf2b13c : 0x6b3f7a, 1).fillRect(-w / 2, -h / 2, w, h);
      g.fillStyle(hover ? 0xffd77a : 0x8a5a9a, 1).fillRect(-w / 2, -h / 2, w, 3);
      t.setTint(hover ? 0x241a2c : 0xfff1d6);
    };
    draw(false);
    const c = scene.add.container(x, y, [g, t]).setSize(w, h).setDepth(opts.depth || 6000);
    if (opts.scroll === false || opts.fixed) c.setScrollFactor(0);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', () => { draw(true); TR.sfx(scene, 'hover', 0.25); });
    c.on('pointerout', () => draw(false));
    c.on('pointerdown', () => { TR.sfx(scene, 'clique', 0.4); cb(); });
    return c;
  },
  panel(scene, x, y, w, h, depth = 5500) {
    const g = scene.add.graphics().setDepth(depth).setScrollFactor(0);
    g.fillStyle(0x0c0810, 0.92).fillRect(x - w / 2 - 4, y - h / 2 - 4, w + 8, h + 8);
    g.fillStyle(0x2a1d33, 0.96).fillRect(x - w / 2, y - h / 2, w, h);
    g.fillStyle(0xf2b13c, 1).fillRect(x - w / 2, y - h / 2, w, 4);
    return g;
  },

  // Tela de instruções antes de cada brincadeira
  instructions(scene, title, lines, onStart) {
    const items = [];
    const H = 70 + lines.length * 26 + 70;
    items.push(TR.panel(scene, 480, 270, 620, H, 7000));
    const tt = TR.txt(scene, 480, 270 - H / 2 + 22, title, 2, 0xffd36a).setOrigin(0.5, 0).setDepth(7001).setScrollFactor(0);
    items.push(tt);
    lines.forEach((l, i) => {
      items.push(TR.txt(scene, 200, 270 - H / 2 + 80 + i * 26, l, 1, 0xf4e9d8).setDepth(7001).setScrollFactor(0));
    });
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      items.forEach((o) => o.destroy());
      btn.destroy();
      scene.input.keyboard.off('keydown-ENTER', go);
      scene.input.keyboard.off('keydown-SPACE', go);
      onStart();
    };
    const btn = TR.button(scene, 480, 270 + H / 2 - 30, 'JOGAR (Enter)', go, { fixed: true, depth: 7002 });
    scene.input.keyboard.on('keydown-ENTER', go);
    scene.time.delayedCall(250, () => scene.input.keyboard.on('keydown-SPACE', go));
  },

  // Painel de fim de partida
  endPanel(scene, title, sub, onRetry) {
    TR.panel(scene, 480, 270, 460, 190, 8000);
    TR.txt(scene, 480, 210, title, 3, 0xffd36a).setOrigin(0.5).setDepth(8001).setScrollFactor(0);
    if (sub) TR.txt(scene, 480, 262, sub, 1, 0xf4e9d8).setOrigin(0.5).setDepth(8001).setScrollFactor(0);
    TR.button(scene, 380, 320, 'Jogar de novo', onRetry, { fixed: true, depth: 8002 });
    TR.button(scene, 580, 320, 'Voltar pra rua', () => TR.go(scene, 'Rua'), { fixed: true, depth: 8002 });
  },

  backButton(scene) {
    const b = TR.button(scene, 62, 22, '‹ Rua (Esc)', () => TR.go(scene, 'Rua'), { fixed: true, depth: 6500 });
    scene.input.keyboard.on('keydown-ESC', () => TR.go(scene, 'Rua'));
    return b;
  },

  go(scene, key, data) {
    if (scene._saindo) return;
    scene._saindo = true;
    scene.cameras.main.fadeOut(260, 18, 13, 24);
    scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
  },

  /*
   * As duas JBLs (Lucas e Pedro) ficam no cenário. Clique numa pra tocar a estação dela
   * (clicar de novo pausa). M liga/pausa a que estiver selecionada.
   * pos = { lucas: [x, y], pedro: [x, y] } em coordenadas do mundo.
   */
  jblHud(scene, pos) {
    pos = pos || { lucas: [600, 284], pedro: [880, 284] };
    const all = {};
    ['lucas', 'pedro'].forEach((id) => {
      const [x, y] = pos[id];
      const s = scene.add.sprite(x, y, 'jbl_' + id, 0).setScale(1.1).setOrigin(0.5, 1).setDepth(y)
        .setInteractive({ useHandCursor: true });
      const lblBg = scene.add.rectangle(x, y - 40, 96, 18, 0x0c0810, 0.78).setDepth(5899);
      const lbl = TR.txt(scene, x, y - 40, '', 1, id === 'pedro' ? 0x9ccfff : 0xffaa9c).setOrigin(0.5).setDepth(5900);
      s.on('pointerover', () => s.setTint(0xffe9a8));
      s.on('pointerout', () => s.clearTint());
      s.on('pointerdown', (ptr, lx, ly, ev) => {
        if (ev) ev.stopPropagation();
        TR.sfx(scene, 'clique', 0.4);
        if (Radio.mode === 'radio' && Radio.station === id && Radio.ready) Radio.toggle();
        else Radio.setStation(id);
      });
      all[id] = { s, lbl, lblBg };
    });
    const refresh = () => {
      ['lucas', 'pedro'].forEach((id) => {
        const o = all[id];
        if (!o.s.active) return;
        const on = Radio.mode === 'radio' && Radio.station === id;
        if (on && Radio.playing) o.s.play('jbl_' + id + '_pulsa', true); else { o.s.stop(); o.s.setFrame(0); }
        o.lbl.setText((on && Radio.playing ? '♪ ' : '') + (id === 'pedro' ? 'JBL Pedro' : 'JBL Lucas'));
        o.lblBg.setSize(o.lbl.width + 16, 18); o.lblBg.setStrokeStyle(on ? 2 : 0, id === 'pedro' ? 0x3c8cff : 0xe2453c);
      });
    };
    refresh();
    Radio.on(refresh);
    scene.events.once('shutdown', () => Radio.off(refresh));
    scene.input.keyboard.on('keydown-M', () => {
      if (Radio.mode === 'radio' && Radio.ready) Radio.toggle();
      else Radio.setStation(Radio.station || 'lucas');
    });
    return all;
  },

  // Sombra elíptica embaixo dos pés
  shadow(scene, x, y, w = 40) {
    return scene.add.ellipse(x, y, w, w * 0.28, 0x000000, 0.28);
  },

  // Grão de filme + vinheta (clima nostálgico)
  vhs(scene, strength = 1) {
    const g = scene.add.graphics().setDepth(9000).setScrollFactor(0);
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * 0.5 * strength;
      g.lineStyle(6, 0x000000, a * 0.12).strokeRect(i * 3, i * 3, TR.W - i * 6, TR.H - i * 6);
    }
    for (let y = 0; y < TR.H; y += 3) g.fillStyle(0x000000, 0.05 * strength).fillRect(0, y, TR.W, 1);
    const grain = scene.add.graphics().setDepth(9001).setScrollFactor(0);
    scene.time.addEvent({
      delay: 90, loop: true, callback: () => {
        grain.clear();
        for (let i = 0; i < 70 * strength; i++) {
          grain.fillStyle(Math.random() < 0.5 ? 0xffffff : 0x000000, 0.06).fillRect(Math.random() * TR.W, Math.random() * TR.H, 2, 2);
        }
      },
    });
  },
};
