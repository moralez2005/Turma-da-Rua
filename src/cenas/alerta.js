/*
 * Alerta: antes de começar a turma escolhe um TEMA (frutas, times, países...) e cada um pega uma palavra.
 * Alguém joga a bola pra cima e grita uma palavra. O dono da palavra corre pegar a bola; o resto foge.
 * O chamado pega a bola e grita ALERTA! — todos congelam. Ele dá até 3 passos e arremessa.
 * Acertou: o alvo perde uma vida. Errou: quem perde é ele. 3 vidas cada.
 */
const ALERTA_TEMAS = {
  'Frutas': ['Manga', 'Banana', 'Goiaba', 'Melancia', 'Caju', 'Uva', 'Pitanga'],
  'Times': ['Corinthians', 'Palmeiras', 'Santos', 'São Paulo', 'Flamengo', 'Grêmio', 'Vasco'],
  'Países': ['Brasil', 'Japão', 'França', 'Argentina', 'Portugal', 'México', 'Itália'],
  'Animais': ['Cachorro', 'Gato', 'Cavalo', 'Galinha', 'Macaco', 'Tatu', 'Capivara'],
  'Cores': ['Azul', 'Vermelho', 'Verde', 'Amarelo', 'Roxo', 'Preto', 'Laranja'],
  'Games': ['Minecraft', 'Brawl Stars', 'Clash Royale', 'Free Fire', 'Fortnite', 'GTA', 'Roblox'],
};
// sugestão de quem escolheria o quê (o jeitão de cada um)
const ALERTA_GOSTO = {
  Games: { daniel: 'Minecraft', gabriel: 'Brawl Stars', lucas: 'GTA', cezar: 'Free Fire', pedro: 'Roblox' },
  Times: { pedro: 'Flamengo' },
};

class Alerta extends Phaser.Scene {
  constructor() { super('Alerta'); }

  create() {
    this._saindo = false;
    this.cameras.main.fadeIn(300, 18, 13, 24);
    this.add.image(0, 0, 'rua').setOrigin(0);
    this.F = { x0: 40, x1: 920, y0: 296, y1: 496, cx: 480, cy: 396 };
    const ids = ['pernalonga', 'cezar', 'lucas', 'pedro', 'daniel', 'gabriel'];
    this.players = ids.map((id, i) => {
      const a = (i / ids.length) * Math.PI * 2;
      const x = 480 + Math.cos(a) * 120, y = 396 + Math.sin(a) * 60;
      return {
        id, x, y, spr: TR.kid(this, id, x, y), sh: TR.shadow(this, x, y, 44), dir: 'down', moving: false,
        lives: 3, out: false, spd: TR.KIDS[id].vel, boost: 0, hearts: null,
      };
    });
    this.players.forEach((p) => { p.hearts = TR.txt(this, 0, 0, '', 1, 0xff6b6b).setOrigin(0.5).setDepth(5000); });
    this.human = this.players[0];
    this.ball = { x: 480, y: 396, z: 0, vx: 0, vy: 0, vz: 0, owner: null };
    this.ballShadow = this.add.ellipse(0, 0, 20, 7, 0x000000, 0.35);
    this.ballSpr = this.add.image(0, 0, 'bola_queimada').setScale(2);
    this.big = TR.txt(this, 480, 170, '', 4, 0xffd36a).setOrigin(0.5).setDepth(6500).setVisible(false);
    this.info = TR.txt(this, 480, 52, '', 1, 0xfff1d6).setOrigin(0.5).setDepth(6001);
    const g = this.add.graphics().setDepth(6000);
    g.fillStyle(0x0c0810, 0.8).fillRect(200, 40, 560, 26);
    this.aimG = this.add.graphics().setDepth(6000);
    this.marker = this.add.triangle(0, 0, 0, 0, 14, 0, 7, 9, 0xffe066).setDepth(6000);
    TR.backButton(this);
    TR.jblHud(this, { lucas: [120, 282], pedro: [840, 282] });
    this.wordHud = TR.txt(this, 940, 512, '', 1, 0x9cff9c).setOrigin(1, 0).setDepth(6001);
    const g2 = this.add.graphics().setDepth(6000);
    g2.fillStyle(0x0c0810, 0.8).fillRect(600, 504, 350, 28);
    this.players.forEach((p) => { p.tag = TR.txt(this, 0, 0, '', 1, 0xfff1d6).setOrigin(0.5).setDepth(5000); });
    this.keys = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D,SPACE,ENTER,E,Q');
    this.input.keyboard.on('keydown', (ev) => this.onKey(ev));
    this.state = 'intro';
    this.thrower = Phaser.Utils.Array.GetRandom(this.players.slice(1));
    TR.instructions(this, 'Alerta', [
      'Primeiro a turma escolhe um TEMA e cada um pega uma palavra.',
      'A bola sobe e alguém grita uma palavra. Você SEMPRE pode andar (setas).',
      'Se gritarem a SUA palavra: corra e pegue a bola. Se não: FUJA!',
      'Quem pega grita ALERTA! e todo mundo congela.',
      'Com a bola: até 3 passos (setas), Q troca o alvo, Espaço mira.',
      'Se jogarem em você: Espaço na hora certa pra desviar.',
      'Se você jogar a bola pra cima, escolhe a palavra (números).',
    ], () => this.chooseTheme());
    const byId = {}; this.players.forEach((p) => { byId[p.id] = p; });
    TR.chatter(this, (id) => (byId[id] && !byId[id].out ? byId[id].spr : null), { can: () => this.state === 'steps' || this.state === 'scatter', first: 9000, min: 8000, max: 13000 });
  }

  // ------------------------------------------------------------ menu de tema e palavra
  menu(title, options, cb) {
    const items = [];
    const n = options.length, cols = n > 4 ? 2 : 1, rows = Math.ceil(n / cols);
    const H = 90 + rows * 44;
    items.push(TR.panel(this, 480, 270, 560, H, 7000));
    items.push(TR.txt(this, 480, 270 - H / 2 + 18, title, 2, 0xffd36a).setOrigin(0.5, 0).setDepth(7001));
    let done = false;
    const pick = (i) => {
      if (done || i < 0 || i >= n) return;
      done = true;
      items.forEach((o) => o.destroy());
      this.input.keyboard.off('keydown', keyH);
      TR.sfx(this, 'selecionar', 0.5);
      cb(options[i], i);
    };
    options.forEach((o, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const x = cols === 2 ? 480 + (c === 0 ? -130 : 130) : 480;
      items.push(TR.button(this, x, 270 - H / 2 + 80 + r * 44, (i + 1) + '. ' + o, () => pick(i), { w: 230, depth: 7002 }));
    });
    const keyH = (ev) => { const d = parseInt(ev.key, 10); if (d >= 1 && d <= 9) pick(d - 1); };
    this.time.delayedCall(150, () => this.input.keyboard.on('keydown', keyH));
  }

  chooseTheme() {
    this.state = 'menu';
    const temas = Object.keys(ALERTA_TEMAS);
    TR.bubble(this, this.players.find((p) => p.id === 'daniel').spr, 'Bora de Games!', 2);
    TR.bubble(this, this.players.find((p) => p.id === 'pedro').spr, 'Times! Eu sou Flamengo', 2);
    this.menu('Escolha o tema', temas, (t) => {
      this.tema = t;
      const pal = ALERTA_TEMAS[t].slice();
      this.menu('Sua palavra (' + t + ')', pal, (w) => {
        this.human.word = w;
        const rest = pal.filter((x) => x !== w);
        const gosto = ALERTA_GOSTO[t] || {};
        this.players.forEach((p) => {
          if (p === this.human) return;
          let w2 = gosto[p.id] && rest.includes(gosto[p.id]) ? gosto[p.id] : Phaser.Utils.Array.GetRandom(rest);
          rest.splice(rest.indexOf(w2), 1);
          p.word = w2;
        });
        this.wordHud.setText('Tema: ' + t + '  ·  Sua palavra: ' + w.toUpperCase());
        this.players.forEach((p) => { if (p !== this.human) this.time.delayedCall(Phaser.Math.Between(0, 900), () => TR.bubble(this, p.spr, 'Eu sou ' + p.word + '!', 1.6)); });
        this.time.delayedCall(2000, () => this.newRound());
      });
    });
  }

  alive() { return this.players.filter((p) => !p.out); }

  // ------------------------------------------------------------ rodadas
  newRound() {
    const al = this.alive();
    if (this.human.out) return this.endGame(false);
    if (al.length <= 1) return this.endGame(true);
    if (!this.thrower || this.thrower.out) this.thrower = Phaser.Utils.Array.GetRandom(al);
    // todo mundo volta pra roda
    al.forEach((p, i) => {
      const a = (i / al.length) * Math.PI * 2 + 0.3;
      p.x = 480 + Math.cos(a) * 110; p.y = 396 + Math.sin(a) * 58; p.moving = false; p.dir = 'down';
    });
    const t = this.thrower;
    t.x = 480; t.y = 396;
    const others = al.filter((p) => p !== t);
    this.steps = 0;
    if (t === this.human) {
      // você joga a bola: escolhe quem chamar
      this.state = 'menu';
      this.info.setText('Você joga a bola! Escolha a palavra pra gritar');
      this.menu('Gritar qual palavra?', others.map((p) => p.word), (w, i) => this.toss(others[i]));
      return;
    }
    this.state = 'ready';
    this.info.setText(TR.KIDS[t.id].nome + ' vai jogar a bola... prepara!');
    TR.bubble(this, t.spr, 'Lá vai!', 0.9);
    this.time.delayedCall(1000, () => {
      if (this.state !== 'ready') return;
      // o humano é chamado com mais frequência, pra ter ação
      this.toss(Phaser.Utils.Array.GetRandom(others.concat(others.includes(this.human) ? [this.human, this.human] : [])));
    });
  }

  toss(called) {
    const t = this.thrower;
    this.called = called;
    Object.assign(this.ball, { owner: null, x: t.x, y: t.y, z: 60, vx: Phaser.Math.Between(-110, 110), vy: Phaser.Math.Between(-50, 50), vz: 760 });
    this.state = 'scatter';
    this.scatterT = 0;
    TR.sfx(this, 'arremesso', 0.5);
    const w = called.word.toUpperCase();
    TR.bubble(this, t.spr, w + '!', 1.8);
    this.flash(w + '!', called === this.human ? 0x9cff9c : 0xffd36a);
    if (called === this.human) this.info.setText('É A SUA PALAVRA! Corre pegar a bola!');
    else this.info.setText(called.word + ' é o ' + TR.KIDS[called.id].nome + '! FOGE dele (setas)!');
    if (called !== this.human && Math.random() < 0.5) {
      const fr = { pedro: 'É meu! Sai da frente!', cezar: 'Agora vocês tão ferrados!', daniel: 'Calculando a rota...', lucas: 'Juliete, corre! kkk', gabriel: 'Peguei! Quer dizer, vou pegar!', pernalonga: 'Deixa comigo.' };
      TR.bubble(this, called.spr, fr[called.id] || 'É eu!', 1.2);
    }
  }

  onKey(ev) {
    if (ev.repeat) return;   // segurar a seta não gasta os 3 passos de uma vez
    const k = ev.code;
    if (this.state === 'steps' && this.ball.owner === this.human) {
      const dirs = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
      if (dirs[k] && this.steps < this.maxSteps) { this.step(this.human, dirs[k][0], dirs[k][1]); }
      if (k === 'KeyQ') { this.targetIdx++; TR.sfx(this, 'hover', 0.3); }
      if (k === 'Space' || k === 'Enter') { if (this.steps >= 0) this.startAim(); }
    } else if (this.state === 'aim' && this.ball.owner === this.human) {
      if (k === 'KeyQ') { this.targetIdx++; TR.sfx(this, 'hover', 0.3); }
      if (k === 'Space' || k === 'Enter') this.release();
    } else if (this.state === 'throw' && this.throwTarget === this.human && k === 'Space') {
      this.dodgeWin = 0.28;
    } else if (this.state === 'scatter' && k === 'KeyE' && !this.human.usedBoost) {
      this.human.usedBoost = true; this.human.boost = 1.2; TR.sfx(this, 'habilidade', 0.5);
      TR.bubble(this, this.human.spr, 'Passada longa!', 1);
    }
  }

  step(p, dx, dy) {
    this.steps++;
    p.dir = TR.dirFrom(dx, dy, p.dir);
    const tx = Phaser.Math.Clamp(p.x + dx * 50, this.F.x0, this.F.x1), ty = Phaser.Math.Clamp(p.y + dy * 34, this.F.y0, this.F.y1);
    this.tweens.add({ targets: p, x: tx, y: ty, duration: 180 });
    TR.sfx(this, 'bip', 0.3, 0.8 + this.steps * 0.15);
    TR.bubble(this, p.spr, this.steps + '!', 0.5);
    if (this.steps >= this.maxSteps && p === this.human) this.time.delayedCall(250, () => this.startAim());
  }

  freeze(caller) {
    this.state = 'steps';
    this.maxSteps = caller.id === 'pernalonga' ? 4 : 3;   // Pernalonga tem a passada longa
    this.steps = 0;
    this.targetIdx = 0;
    TR.sfx(this, 'alerta', 0.7);
    this.time.delayedCall(250, () => TR.sfx(this, 'congelar', 0.4));
    TR.bubble(this, caller.spr, 'ALERTA!', 1.5);
    this.flash('ALERTA!', 0xff8a5a);
    this.players.forEach((p) => { p.moving = false; });
    if (caller === this.human) this.info.setText('Até ' + this.maxSteps + ' passos com as setas · Q troca o alvo · Espaço mira');
    else {
      this.info.setText(TR.KIDS[caller.id].nome + ' está andando... fica esperto!');
      // IA: mira num dos dois mais perto (assim não é sempre em você)
      const perto = this.targets(caller).slice(0, 2);
      const tgt = Phaser.Utils.Array.GetRandom(perto);
      let n = 0;
      const ev = this.time.addEvent({
        delay: 420, repeat: 2, callback: () => {
          n++;
          if (!tgt) return;
          const dx = tgt.x - caller.x, dy = tgt.y - caller.y, d = Math.hypot(dx, dy) || 1;
          if (d > 90) this.step(caller, Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : 0, Math.abs(dy) >= Math.abs(dx) ? Math.sign(dy) : 0);
          if (n >= 3) this.time.delayedCall(350, () => this.aiThrow(caller, tgt));
        },
      });
    }
  }

  nearestTarget(p) {
    const c = this.alive().filter((q) => q !== p);
    return c.reduce((a, q) => (Math.hypot(q.x - p.x, q.y - p.y) < Math.hypot(a.x - p.x, a.y - p.y) ? q : a), c[0]);
  }

  targets(p) {
    const c = this.alive().filter((q) => q !== p);
    c.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    return c;
  }

  startAim() {
    if (this.state !== 'steps') return;
    this.state = 'aim';
    this.aimT = 0;
    this.info.setText('Espaço quando o marcador estiver no VERDE!');
  }

  release() {
    const acc = 1 - Math.abs(Math.sin(this.aimT * 3.2));   // 1 = centro
    const tgt = this.targets(this.human)[this.targetIdx % this.targets(this.human).length];
    this.doThrow(this.human, tgt, acc > 0.72 ? 0.9 : acc > 0.45 ? 0.5 : 0.12);
  }

  aiThrow(p, tgt) {
    if (this.state !== 'steps') return;
    this.doThrow(p, tgt, Phaser.Math.FloatBetween(0.35, 0.8));
  }

  doThrow(p, tgt, chance) {
    this.state = 'throw';
    this.throwTarget = tgt;
    this.dodgeWin = 0;
    this.hitChance = chance;
    const b = this.ball;
    b.owner = null;
    const dx = tgt.x - p.x, dy = tgt.y - p.y, d = Math.hypot(dx, dy) || 1, sp = 640;
    const miss = Math.random() > chance;
    const ang = miss ? Phaser.Math.FloatBetween(0.25, 0.45) * (Math.random() < 0.5 ? -1 : 1) : 0;
    const vx = dx / d * sp, vy = dy / d * sp;
    Object.assign(b, { x: p.x, y: p.y, z: 50, vx: vx * Math.cos(ang) - vy * Math.sin(ang), vy: vx * Math.sin(ang) + vy * Math.cos(ang), vz: 80, thrower: p, miss });
    TR.sfx(this, 'arremesso', 0.6);
    this.info.setText(tgt === this.human ? 'É em você! Espaço pra desviar!' : '');
  }

  resolve(hit) {
    this.state = 'result';
    this.info.setText('');
    const thrower = this.ball.thrower, tgt = this.throwTarget;
    const loser = hit ? tgt : thrower;
    loser.lives--;
    TR.sfx(this, hit ? 'queimado' : 'derrota', 0.5);
    this.flash(hit ? 'ACERTOU!' : 'ERROU!', hit ? 0xff7a7a : 0x9cff9c);
    const ai = { pedro: 'Ai! Vou embora com a bola!', lucas: 'Ai kkkk nem doeu', cezar: 'Doeu nada!', daniel: 'Lag! Foi lag!', gabriel: 'Ai! Pega leve!', kaua: 'Tranquilo...', pernalonga: 'Boa, essa foi boa.' };
    TR.bubble(this, loser.spr, hit ? (ai[loser.id] || 'Ai!') : 'Errei...', 1.4);
    if (hit && loser.id === 'pedro') {
      const z = this.alive().find((p) => p.id === 'lucas' || p.id === 'gabriel');
      if (z) this.time.delayedCall(900, () => TR.bubble(this, z.spr, 'Chora não, Dona Juliete!', 1.4));
    }
    if (loser.lives <= 0) {
      loser.out = true;
      TR.bubble(this, loser.spr, 'Tô fora!', 1.4);
      this.tweens.add({ targets: loser, y: 270, x: Phaser.Math.Between(80, 880), duration: 900 });
    }
    this.thrower = loser.out ? null : loser;
    this.time.delayedCall(1500, () => this.newRound());
  }

  // ------------------------------------------------------------ loop
  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    const b = this.ball, F = this.F;
    if (this.state === 'ready') {
      const k = this.keys, p = this.human;
      if (!p.out && p !== this.thrower) {
        const mx = (k.RIGHT.isDown || k.D.isDown ? 1 : 0) - (k.LEFT.isDown || k.A.isDown ? 1 : 0);
        const my = (k.DOWN.isDown || k.S.isDown ? 1 : 0) - (k.UP.isDown || k.W.isDown ? 1 : 0);
        if (mx || my) { const l = Math.hypot(mx, my); p.x += mx / l * p.spd * 0.5 * dt; p.y += my / l * p.spd * 0.4 * dt; p.dir = TR.dirFrom(mx, my, p.dir); p.moving = true; } else p.moving = false;
        p.x = Phaser.Math.Clamp(p.x, F.x0, F.x1); p.y = Phaser.Math.Clamp(p.y, F.y0, F.y1);
      }
    }
    if (this.state === 'scatter') {
      this.scatterT += dt;
      // bola no ar
      b.x += b.vx * dt; b.y += b.vy * dt; b.vz -= 760 * dt; b.z += b.vz * dt;
      if (b.z <= 0) { b.z = 0; if (b.vz < -100) { b.vz = -b.vz * 0.4; TR.sfx(this, 'quique', 0.35); } else b.vz = 0; }
      const fr = Math.pow(b.z > 0 ? 0.95 : 0.3, dt); b.vx *= fr; b.vy *= fr;
      b.x = Phaser.Math.Clamp(b.x, F.x0, F.x1); b.y = Phaser.Math.Clamp(b.y, F.y0, F.y1);
      // movimento
      const k = this.keys;
      this.alive().forEach((p) => {
        p.boost = Math.max(0, p.boost - dt);
        const spd = p.spd * (p.boost > 0 ? 1.6 : 1);
        let mx = 0, my = 0;
        if (p === this.human) {
          mx = (k.RIGHT.isDown || k.D.isDown ? 1 : 0) - (k.LEFT.isDown || k.A.isDown ? 1 : 0);
          my = (k.DOWN.isDown || k.S.isDown ? 1 : 0) - (k.UP.isDown || k.W.isDown ? 1 : 0);
        } else if (p === this.called) {
          mx = b.x - p.x; my = b.y - p.y;
          if (b.z > 120 && Math.hypot(mx, my) < 40) { mx = 0; my = 0; }   // espera a bola cair
        } else {
          // foge do chamado (e da bola), com um pouco de desvio pros lados
          const c = this.called;
          mx = (p.x - c.x) + (p.x - b.x) * 0.5; my = (p.y - c.y) + (p.y - b.y) * 0.5;
          if (Math.hypot(p.x - c.x, p.y - c.y) > 360) { mx = 0; my = 0; }
          // perto da parede: escorrega pro lado
          if (p.x < F.x0 + 30 || p.x > F.x1 - 30) my += (p.y < F.cy ? -1 : 1) * 80;
        }
        const len = Math.hypot(mx, my);
        // setas valem 1 (ou 1,4 na diagonal); os outros miram em pixels, por isso a folga de 4 só vale pra eles
        const minimo = p === this.human ? 0 : 4;
        if (len > minimo) { p.x += mx / len * spd * dt; p.y += my / len * spd * dt * 0.8; p.dir = TR.dirFrom(mx, my, p.dir); p.moving = true; } else p.moving = false;
        p.x = Phaser.Math.Clamp(p.x, F.x0, F.x1); p.y = Phaser.Math.Clamp(p.y, F.y0, F.y1);
      });
      // ninguém fica empilhado em cima do outro
      const al = this.alive();
      for (let i = 0; i < al.length; i++) for (let j = i + 1; j < al.length; j++) {
        const p = al[i], q = al[j], dx = q.x - p.x, dy = (q.y - p.y) * 1.6, d = Math.hypot(dx, dy);
        if (d > 0 && d < 46) { const push = (46 - d) / 2; p.x -= dx / d * push; q.x += dx / d * push; p.y -= dy / d * push * 0.4; q.y += dy / d * push * 0.4; }
      }
      al.forEach((p) => { p.x = Phaser.Math.Clamp(p.x, F.x0, F.x1); p.y = Phaser.Math.Clamp(p.y, F.y0, F.y1); });
      // o chamado pega a bola quando ela está baixa
      const c = this.called;
      if (this.scatterT > 9) {   // demorou demais pra pegar: perde uma vida
        this.state = 'result';
        c.lives--; TR.sfx(this, 'derrota', 0.5);
        this.flash('DEMOROU!', 0xff7a7a);
        TR.bubble(this, c.spr, 'Ah, não vi a bola!', 1.3);
        if (c.lives <= 0) { c.out = true; this.tweens.add({ targets: c, y: 270, duration: 900 }); }
        this.thrower = c.out ? null : c;
        this.time.delayedCall(1500, () => this.newRound());
        return this.render(time);
      }
      if (Math.hypot(c.x - b.x, (c.y - b.y) * 1.3) < 34 && b.z < 40) {
        b.owner = c; b.z = 0; b.vx = b.vy = b.vz = 0;
        TR.sfx(this, 'pegar', 0.5);
        this.freeze(c);
      }
    } else if (this.state === 'throw') {
      this.dodgeWin = Math.max(0, this.dodgeWin - dt);
      b.x += b.vx * dt; b.y += b.vy * dt; b.vz -= 300 * dt; b.z = Math.max(8, b.z + b.vz * dt);
      const t = this.throwTarget;
      if (!b.miss && Math.hypot(t.x - b.x, (t.y - b.y) * 1.3) < 30) {
        let dodged = false;
        if (t === this.human && this.dodgeWin > 0) dodged = Math.random() < 0.65;
        if (t !== this.human) dodged = Math.random() < (t.id === 'cezar' ? 0.25 : 0.1);
        if (dodged) {
          b.miss = true; TR.bubble(this, t.spr, 'Desviei!', 1); TR.sfx(this, 'pulo', 0.5);
          this.tweens.add({ targets: t.spr, angle: 18, yoyo: true, duration: 140 });
        } else { b.vx *= -0.2; b.vy *= -0.2; return this.resolve(true); }
      }
      if (b.x < F.x0 - 40 || b.x > F.x1 + 40 || b.y < F.y0 - 60 || b.y > F.y1 + 40 || Math.hypot(b.x - b.thrower.x, b.y - b.thrower.y) > 900) {
        return this.resolve(false);
      }
      if (b.miss && Math.hypot(b.x - t.x, b.y - t.y) > 260 && Math.hypot(b.vx, b.vy) < 1) return this.resolve(false);
    } else if (this.state === 'aim') {
      this.aimT += dt;
    }
    if (b.owner) { b.x = b.owner.x + 18; b.y = b.owner.y + 2; b.z = 44; }
    this.render(time);
    if (this.state === 'throw' && b.miss && (Math.abs(b.x - this.throwTarget.x) > 300 || Math.abs(b.y - this.throwTarget.y) > 200)) this.resolve(false);
  }

  render(time) {
    this.players.forEach((p) => {
      p.spr.setPosition(Math.round(p.x), Math.round(p.y)).setDepth(p.y);
      p.sh.setPosition(Math.round(p.x), Math.round(p.y)).setDepth(2).setVisible(!p.out);
      p.spr.setAlpha(p.out ? 0.6 : 1);
      const frozen = this.state === 'steps' || this.state === 'aim' || this.state === 'throw';
      TR.pose(p.spr, p.dir, p.moving && !frozen && this.state === 'scatter');
      if (frozen && !p.out && p !== this.ball.owner && p !== this.ball.thrower) p.spr.setTint(0xcfe8ff); else p.spr.clearTint();
      p.hearts.setText(p.out ? 'fora' : '♥'.repeat(p.lives)).setPosition(Math.round(p.x), Math.round(p.y) - 148);
      p.tag.setText(p.word && !p.out ? p.word : '').setPosition(Math.round(p.x), Math.round(p.y) + 12)
        .setTint(p === this.human ? 0x9cff9c : (p === this.called && this.state === 'scatter' ? 0xffd36a : 0xfff1d6));
    });
    const b = this.ball;
    this.ballShadow.setPosition(Math.round(b.x), Math.round(b.y)).setDepth(3).setScale(Math.max(0.3, 1 - b.z / 400));
    this.ballSpr.setPosition(Math.round(b.x), Math.round(b.y - 8 - b.z)).setDepth(b.y + 2);
    this.marker.setPosition(Math.round(this.human.x), Math.round(this.human.y) - 168).setAngle(180).setVisible(!this.human.out);
    this.aimG.clear();
    if ((this.state === 'steps' || this.state === 'aim') && this.ball.owner === this.human) {
      const ts = this.targets(this.human);
      const t = ts[this.targetIdx % ts.length];
      if (t) this.aimG.lineStyle(3, 0xff5a3c, 1).strokeEllipse(t.x, t.y, 64, 20);
      if (this.state === 'aim') {
        const x0 = 380, w = 200, y = 92;
        this.aimG.fillStyle(0x0c0810, 0.9).fillRect(x0 - 4, y - 4, w + 8, 22);
        this.aimG.fillStyle(0xd94a3c, 1).fillRect(x0, y, w, 14);
        this.aimG.fillStyle(0xf2b13c, 1).fillRect(x0 + w * 0.2, y, w * 0.6, 14);
        this.aimG.fillStyle(0x6fd06f, 1).fillRect(x0 + w * 0.38, y, w * 0.24, 14);
        const pos = (Math.sin(this.aimT * 3.2) + 1) / 2;
        this.aimG.fillStyle(0xffffff, 1).fillRect(x0 + pos * w - 2, y - 4, 4, 22);
      }
    }
  }

  flash(msg, color) {
    this.big.setText(msg).setTint(color).setVisible(true).setScale(0.3);
    this.tweens.add({ targets: this.big, scale: 1, duration: 250, ease: 'Back.Out' });
    this.time.delayedCall(1000, () => this.big.setVisible(false));
  }

  endGame(won) {
    if (this.state === 'end') return;
    this.state = 'end';
    const pos = this.alive().length + (this.human.out ? 1 : 0);
    TR.sfx(this, won ? 'vitoria' : 'derrota', 0.6);
    TR.endPanel(this, won ? 'VOCÊ GANHOU!' : 'VOCÊ SAIU!', won ? 'Último na roda: é o rei do Alerta' : 'Ficou em ' + pos + 'º lugar', () => this.scene.restart());
  }
}
