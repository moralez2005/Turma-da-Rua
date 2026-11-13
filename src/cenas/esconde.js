/*
 * Esconde-esconde no quarteirão inteiro (1920x1080), câmera seguindo o jogador.
 * Modo ESCONDER: você escolhe quem se esconde e o Daniel procura. Modo PROCURAR: você escolhe quem procura.
 * Setas andam · Shift corre (faz barulho) · Espaço agacha/levanta (ou "Achei!" quando procura) · E habilidade
 */
class EscondeEsconde extends Phaser.Scene {
  constructor() { super('EscondeEsconde'); }

  init(data) { this.modo = (data && data.modo) || null; this.quem = (data && data.quem) || null; }

  create() {
    this._saindo = false;
    this.kids = null; this.human = null; this.seeker = null;   // ao jogar de novo, a cena reaproveita o objeto: limpa o que sobrou da partida anterior
    this.cameras.main.fadeIn(300, 18, 13, 24);
    TR.musicaFundo.tocar(this, 'm_esconde');
    const M = this.cache.json.get('esc_mapa');
    this.M = M;
    this.WW = M.tamanho[0]; this.WH = M.tamanho[1];
    this.add.image(0, 0, 'esc_chao').setOrigin(0).setDepth(0);
    this.solids = M.solidos.map(([x, y, w, h]) => new Phaser.Geom.Rectangle(x, y, w, h));
    this.objs = M.objetos.map((o) => {
      const img = this.add.image(o.x, o.y, 'obj_' + o.tipo).setOrigin(0.5, 1).setDepth(o.y);
      return Object.assign({}, o, { img });
    });
    // placas com o nome de quem mora em cada casa
    (M.casas || []).forEach((c) => {
      const t = TR.txt(this, c.x, c.y, c.nome, 1, 0xffe9b0).setOrigin(0.5).setDepth(7);
      this.add.rectangle(c.x, c.y, t.width + 14, t.height + 6, 0x241a2c, 0.75).setDepth(6);
    });
    this.pique = M.pique;
    this.piqueMark = this.add.ellipse(this.pique.x, this.pique.y + 4, 70, 20).setStrokeStyle(3, 0xffd36a).setDepth(5);
    this.tweens.add({ targets: this.piqueMark, alpha: 0.3, yoyo: true, repeat: -1, duration: 700 });
    TR.txt(this, this.pique.x, this.pique.y + 18, 'PIQUE', 1, 0xffd36a).setOrigin(0.5, 0).setDepth(6);
    this.buildGrid();
    this.spots = this.makeSpots();

    this.cameras.main.setBounds(0, 0, this.WW, this.WH);
    this.hudBg = this.add.graphics().setScrollFactor(0).setDepth(6000);
    this.hudBg.fillStyle(0x0c0810, 0.85).fillRect(250, 0, 460, 40);
    this.hud = TR.txt(this, 480, 12, '', 1, 0xfff1d6).setOrigin(0.5, 0).setScrollFactor(0).setDepth(6001);
    this.tip = TR.txt(this, 480, 516, '', 1, 0xffd36a).setOrigin(0.5).setScrollFactor(0).setDepth(6001);
    this.tipBg = this.add.graphics().setScrollFactor(0).setDepth(6000);
    this.big = TR.txt(this, 480, 200, '', 3, 0xffd36a).setOrigin(0.5).setScrollFactor(0).setDepth(6500).setVisible(false);
    this.cone = this.add.graphics().setDepth(4);
    this.arrow = this.add.triangle(0, 0, 0, 0, 22, 10, 0, 20, 0x7cf27c).setDepth(6000).setVisible(false);
    this.makeMinimap();
    TR.backButton(this);
    TR.jblHud(this, { lucas: [620, 652], pedro: [1000, 652] });
    this.keys = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D,SHIFT,SPACE,E,C');
    this.input.keyboard.on('keydown-SPACE', () => this.onSpace());
    this.input.keyboard.on('keydown-C', () => this.onSpace());
    this.input.keyboard.on('keydown-E', () => this.ability());
    this.input.keyboard.on('keydown-T', () => this.atenderOrelhao());
    this.state = 'menu';
    if (this.modo) this.escolher(this.modo); else this.chooseMode();
  }

  // ------------------------------------------------------------ mapa / navegação
  buildGrid() {
    this.cell = 24;
    this.gw = Math.ceil(this.WW / this.cell); this.gh = Math.ceil(this.WH / this.cell);
    this.block = new Uint8Array(this.gw * this.gh);
    for (let gy = 0; gy < this.gh; gy++) for (let gx = 0; gx < this.gw; gx++) {
      const cx = gx * this.cell + this.cell / 2, cy = gy * this.cell + this.cell / 2;
      if (cy < 62 || this.blockedPoint(cx, cy, 10)) this.block[gy * this.gw + gx] = 1;
    }
  }

  blockedPoint(x, y, r) {
    if (y < 60 || x < 8 || x > this.WW - 8 || y > this.WH - 6) return true;
    for (const s of this.solids) if (x + r > s.x && x - r < s.right && y + r * 0.5 > s.y && y - r * 0.5 < s.bottom) return true;
    return false;
  }

  path(x0, y0, x1, y1) {
    const c = this.cell, W = this.gw, H = this.gh;
    const sx = Phaser.Math.Clamp(Math.floor(x0 / c), 0, W - 1), sy = Phaser.Math.Clamp(Math.floor(y0 / c), 0, H - 1);
    let tx = Phaser.Math.Clamp(Math.floor(x1 / c), 0, W - 1), ty = Phaser.Math.Clamp(Math.floor(y1 / c), 0, H - 1);
    if (this.block[ty * W + tx]) { // procura a célula livre mais próxima do alvo
      let best = null, bd = 1e9;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const nx = tx + dx, ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || this.block[ny * W + nx]) continue;
        const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = [nx, ny]; }
      }
      if (!best) return [[x1, y1]];
      [tx, ty] = best;
    }
    const start = sy * W + sx, goal = ty * W + tx;
    const g = new Float32Array(W * H).fill(1e9), from = new Int32Array(W * H).fill(-1), closed = new Uint8Array(W * H);
    const open = [start]; g[start] = 0;
    const h = (i) => Math.hypot((i % W) - tx, Math.floor(i / W) - ty);
    let iter = 0;
    while (open.length && iter++ < 6000) {
      let bi = 0, bf = 1e9;
      for (let k = 0; k < open.length; k++) { const f = g[open[k]] + h(open[k]); if (f < bf) { bf = f; bi = k; } }
      const cur = open.splice(bi, 1)[0];
      if (cur === goal) break;
      closed[cur] = 1;
      const cx = cur % W, cy = Math.floor(cur / W);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const ni = ny * W + nx;
        if (closed[ni] || this.block[ni]) continue;
        if (dx && dy && (this.block[cy * W + nx] || this.block[ny * W + cx])) continue;
        const ng = g[cur] + (dx && dy ? 1.414 : 1);
        if (ng < g[ni]) { g[ni] = ng; from[ni] = cur; if (!open.includes(ni)) open.push(ni); }
      }
    }
    const pts = [];
    let cur = goal;
    if (from[cur] === -1 && cur !== start) return [[x1, y1]];
    while (cur !== -1 && cur !== start) { pts.push([(cur % W) * c + c / 2, Math.floor(cur / W) * c + c / 2]); cur = from[cur]; }
    pts.reverse();
    pts.push([x1, y1]);
    return pts;
  }

  // posições de esconderijo (atrás de cada objeto que cobre)
  makeSpots() {
    const spots = [];
    this.objs.forEach((o) => {
      if (!o.cobre) return;
      let y = o.y - o.pe[1] - 16;
      if (o.mato) y = o.y - 24;
      const xs = o.w > 140 ? [o.x - o.w / 4, o.x + o.w / 4] : [o.x];
      xs.forEach((x) => { if (!this.blockedPoint(x, y, 8)) spots.push({ x, y, obj: o, nome: o.nome, used: false }); });
    });
    (this.M.esconderijos_extra || []).forEach((e) => spots.push({ x: e.x, y: e.y, escuro: true, raio: e.raio, nome: e.nome, used: false }));
    return spots;
  }

  // ------------------------------------------------------------ escolha do modo
  chooseMode() {
    TR.panel(this, 480, 270, 560, 230, 7000);
    TR.txt(this, 480, 182, 'Esconde-esconde', 2, 0xffd36a).setOrigin(0.5).setScrollFactor(0).setDepth(7001);
    TR.txt(this, 480, 222, 'O quarteirão inteiro é seu. Escolha:', 1, 0xf4e9d8).setOrigin(0.5).setScrollFactor(0).setDepth(7001);
    this.cameras.main.centerOn(this.pique.x, this.pique.y + 100);
    TR.button(this, 360, 290, 'Esconder', () => this.scene.restart({ modo: 'esconder' }), { fixed: true, depth: 7002, w: 200 });
    TR.button(this, 600, 290, 'Procurar', () => this.scene.restart({ modo: 'procurar' }), { fixed: true, depth: 7002, w: 200 });
    TR.txt(this, 360, 318, 'alguém da turma procura', 1, 0xc9b8d8).setOrigin(0.5, 0).setScrollFactor(0).setDepth(7001);
    TR.txt(this, 600, 318, 'você procura a turma', 1, 0xc9b8d8).setOrigin(0.5, 0).setScrollFactor(0).setDepth(7001);
  }

  // escolhe com quem você joga (no modo procurar, você é quem procura)
  escolher(modo) {
    if (this.quem) return this.setup(modo);
    this.cameras.main.centerOn(this.pique.x, this.pique.y + 100);
    TR.escolherVoce(this, 'esconde_' + modo, {
      titulo: modo === 'esconder' ? 'Quem vai se esconder?' : 'Quem vai procurar?',
      padrao: modo === 'esconder' ? 'pernalonga' : 'daniel',
      habilidade: () => (modo === 'esconder' ? 'E: corrida rápida pra chegar no pique' : 'E: uma seta mostra o escondido mais perto'),
    }, (id) => { this.quem = id; this.setup(modo); });
  }

  setup(modo) {
    const P = this.pique;
    this.found = 0; this.saved = 0;
    this.timeLeft = modo === 'esconder' ? 150 : 170;
    const total = this.timeLeft;
    TR.anoitecer(this, () => (this.state === 'search' || this.state === 'end' ? 1 - this.timeLeft / total : 0), null, [1120, 440]);
    this.kids = [];
    const mk = (id, x, y, role) => {
      const spr = TR.kid(this, id, x, y);
      const k = { id, x, y, spr, sh: TR.shadow(this, x, y, 44).setDepth(1), role, dir: 'down', moving: false, crouch: false,
        state: 'idle', path: null, spot: null, seenT: 0, spd: TR.KIDS[id].vel * 0.9, boost: 0, lastNoise: 0 };
      this.kids.push(k);
      return k;
    };
    const quem = this.quem;
    if (modo === 'esconder') {
      const quemProcura = quem === 'daniel' ? 'gabriel' : 'daniel';
      this.human = mk(quem, P.x - 60, P.y + 70, 'hider');
      this.seeker = mk(quemProcura, P.x, P.y + 12, 'seeker');
      TR.ORDEM.filter((id) => id !== quem && id !== quemProcura).forEach((id, i) => mk(id, P.x - 120 + i * 50, P.y + 110, 'hider'));
    } else {
      this.human = this.seeker = mk(quem, P.x, P.y + 12, 'seeker');
      TR.ORDEM.filter((id) => id !== quem).forEach((id, i) => mk(id, P.x - 150 + i * 60, P.y + 110, 'hider'));
    }
    const N = this.nomeSeeker = TR.KIDS[this.seeker.id].nome;
    this.hiders = this.kids.filter((k) => k.role === 'hider');
    this.aiHiders = this.hiders.filter((k) => k !== this.human);
    this.cameras.main.startFollow(this.human.spr, true, 0.12, 0.12, 0, 60);
    this.habCd = 0;
    const linhas = modo === 'esconder' ? [
      'O ' + N + ' conta até 20 no poste (PIQUE). Corre se esconder!',
      'Setas ...... andar          Shift ...... correr (faz barulho)',
      'Espaço ..... agachar (atrás de algo, ninguém te vê)',
      'No mato o capim balança se você se mexer. Cuidado!',
      'Se o ' + N + ' te ver, corre pro PIQUE: 1, 2, 3 salve eu!',
      'Chegou no pique sem ser pego = SALVO (você ganha).',
      'E .......... corrida rápida      T ...... atender o orelhão',
    ] : [
      'Você procura. Conta até 12 enquanto a turma se esconde.',
      'Setas ...... andar          Shift ...... correr',
      'Chegue perto e aperte Espaço pra gritar "ACHEI!"',
      'Depois corre pro PIQUE antes do escondido!',
      'Os escondidos tentam se salvar quando você se afasta.',
      'E .......... seta pro escondido mais perto     T ... orelhão',
      'Ganha se achar mais gente do que se salvar.',
    ];
    TR.instructions(this, modo === 'esconder' ? 'Esconder' : 'Procurar', linhas, () => this.startCount());
  }

  startCount() {
    this.state = 'count';
    this.count = this.modo === 'esconder' ? 20 : 12;
    // cada escondido escolhe um esconderijo livre
    const free = Phaser.Utils.Array.Shuffle(this.spots.slice());
    // a Manu escolhe primeiro: a casinha do cachorro é dela
    this.aiHiders.slice().sort((a, b) => (b.id === 'manu') - (a.id === 'manu')).forEach((k) => {
      // a Manu (IA) prefere a casinha do cachorro, que só ela cabe
      const casinha = free.find((s) => !s.used && s.obj && s.obj.tipo === 'casinha');
      if (k.id === 'manu' && casinha) { casinha.used = true; k.spot = casinha; k.state = 'going'; k.path = this.path(k.x, k.y, casinha.x, casinha.y); return; }
      const far = free.filter((s) => !s.used).sort((a, b) => this.d2(b, this.pique) - this.d2(a, this.pique));
      const pick = far[Phaser.Math.Between(0, Math.min(8, far.length - 1))];
      if (!pick) return;
      pick.used = true; k.spot = pick; k.state = 'going';
      k.path = this.path(k.x, k.y, pick.x, pick.y);
    });
    this.seeker.dir = 'up';
    this.countEv = this.time.addEvent({ delay: 1000, repeat: this.count - 1, callback: () => {
      this.count--;
      TR.sfx(this, 'bip', 0.3, this.count <= 3 ? 1.4 : 1);
      if (this.count <= 0) this.startSearch();
    } });
    TR.bubble(this, this.seeker.spr, 'Vou contar até ' + this.count + '!', 2);
  }

  startSearch() {
    this.state = 'search';
    TR.sfx(this, 'la_vou_eu', 0.5);
    TR.bubble(this, this.seeker.spr, 'Lá vou eu!', 1.8);
    // escondidos atrasados se agacham onde estão / chegam no lugar
    this.aiHiders.forEach((k) => {
      if (k.state === 'going' && k.spot) { k.x = k.spot.x; k.y = k.spot.y; }
      k.state = 'hidden'; k.crouch = true; k.path = null;
    });
    if (this.seeker !== this.human) { this.seeker.state = 'patrol'; this.seeker.checked = new Set(); this.seeker.path = null; this.seeker.guardT = 0; }
  }

  // ------------------------------------------------------------ comandos
  onSpace() {
    if (this.state !== 'search' && this.state !== 'count') return;
    const h = this.human;
    if (this.modo === 'esconder') {
      if (h.state === 'run') return;
      h.crouch = !h.crouch;
      TR.sfx(this, 'hover', 0.3, h.crouch ? 0.8 : 1.2);
    } else if (this.state === 'search') {
      // procurar: achar quem estiver perto e visível
      const cand = this.aiHiders.filter((k) => k.state === 'hidden' && this.canSee(h, k, true));
      if (!cand.length) { TR.bubble(this, h.spr, 'Hmm... ninguém aqui', 1); return; }
      const k = cand.reduce((a, b) => (this.d2(a, h) < this.d2(b, h) ? a : b));
      this.spotted(k);
    }
  }

  // T perto do orelhão: ele toca a música do orelhão na Rádio da Rua
  atenderOrelhao() {
    const h = this.human;
    if (!h || !this.objs) return;
    const o = this.objs.find((q) => q.tipo === 'orelhao' && Math.hypot(q.x - h.x, q.y - h.y) < 110);
    if (o) TR.orelhao(this, h.spr);
  }

  ability() {
    if (this.state !== 'search' || this.habCd > 0) return;
    this.habCd = this.modo === 'esconder' ? 8 : 15;
    TR.sfx(this, 'habilidade', 0.5);
    if (this.modo === 'esconder') {
      const h = this.human;
      if (h.id === 'matheus') { h.boost = 3; h.bike = true; TR.bike(this, h.spr, 3); TR.bubble(this, h.spr, 'Bike do nada!', 1.2); this.time.delayedCall(3000, () => { h.bike = false; }); }
      else { h.boost = 1.6; TR.bubble(this, h.spr, h.id === 'manu' ? 'Ninguém me acha!' : 'Corre!', 1); }
    }
    else {
      const t = this.aiHiders.filter((k) => k.state === 'hidden').sort((a, b) => this.d2(a, this.human) - this.d2(b, this.human))[0];
      if (t) { this.arrowTarget = t; this.arrowT = 2.5; TR.bubble(this, this.human.spr, this.human.id === 'daniel' ? 'Estrategista!' : 'Achei a pista!', 1); }
    }
  }

  // ------------------------------------------------------------ visão
  hiddenAmount(k) {
    if (k.state === 'run') return 0;
    // a Manu é pequena: agachada atrás de objeto baixo (casinha, caixa d'água, tanque, pneus...) ninguém vê
    if (k.id === 'manu' && k.crouch) {
      const baixo = this.objs.find((o) => ['casinha', 'tanque', 'pneus', 'caixa', 'lixeira', 'tambor'].includes(o.tipo) && Math.abs(k.x - o.x) < o.w / 2 + 6 && k.y < o.y + 6 && k.y > o.y - o.h - 10);
      if (baixo) return 1;
    }
    for (const s of this.spots) if (s.escuro && Math.hypot(k.x - s.x, k.y - s.y) < s.raio + 10) return 1;
    let best = 0;
    for (const o of this.objs) {
      if (!o.cobre) continue;
      const inX = k.x > o.x - o.w / 2 + 8 && k.x < o.x + o.w / 2 - 8;
      if (!inX) continue;
      if (o.mato) {
        if (k.y < o.y + 4 && k.y > o.y - o.h + 30) best = Math.max(best, k.crouch ? 1 : 0.5);
        continue;
      }
      if (k.y < o.y && k.y > o.y - o.h - 10) {
        const need = k.crouch ? 60 : 118;
        best = Math.max(best, Math.min(1, o.h / need));
      }
    }
    return best;
  }

  losBlocked(a, b) {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 18);
    for (let i = 1; i < n; i++) {
      const x = a.x + (b.x - a.x) * i / n, y = a.y - 40 + (b.y - 40 - a.y + 40) * i / n;
      for (const s of this.solids) if (s.width > 60 && s.height > 60 && Phaser.Geom.Rectangle.Contains(s, x, y + 40)) return true;
    }
    return false;
  }

  canSee(seeker, k, manual) {
    const dx = k.x - seeker.x, dy = k.y - seeker.y, d = Math.hypot(dx, dy);
    const hid = this.hiddenAmount(k);
    if (hid >= 0.95 && d > (manual ? 70 : 46)) return false;
    const range = manual ? 150 : (k.crouch ? 230 : 330) * (1 - hid * 0.5);
    if (d > range) return false;
    if (!manual && d > 60) {
      const fx = seeker.face ? seeker.face.x : 0, fy = seeker.face ? seeker.face.y : 1;
      const cos = (dx * fx + dy * fy) / (d || 1);
      if (cos < Math.cos(Phaser.Math.DegToRad(40))) return false;
    }
    return !this.losBlocked(seeker, k);
  }

  spotted(k) {
    k.state = 'race';
    this.found++;
    TR.sfx(this, 'achou', 0.6);
    TR.bubble(this, this.seeker.spr, 'Achei ' + TR.KIDS[k.id].nome + '! 1, 2, 3!', 1.8);
    this.flash('ACHOU ' + TR.KIDS[k.id].nome.toUpperCase() + '!', 0xff9a6a);
    k.crouch = false;
    if (k.spot) k.spot.used = false;
    if (k !== this.human) k.path = this.path(k.x, k.y, this.pique.x, this.pique.y + 20);
    if (this.seeker !== this.human) { this.seeker.state = 'race'; this.seeker.path = this.path(this.seeker.x, this.seeker.y, this.pique.x, this.pique.y + 10); }
    if (k === this.human) this.tipSet('O ' + this.nomeSeeker + ' te viu! CORRE PRO PIQUE!');
  }

  // ------------------------------------------------------------ loop
  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    if (!this.kids) return;
    if (this.state === 'search') {
      this.timeLeft -= dt;
      this.habCd = Math.max(0, this.habCd - dt);
      if (this.timeLeft <= 0) return this.endGame(this.modo === 'esconder' ? 'tempo' : null);
    }
    if (this.state === 'count' || this.state === 'search') {
      this.humanMove(dt);
      this.kids.forEach((k) => { if (k !== this.human) this.aiMove(k, dt); });
      if (this.state === 'search') this.checkRules(dt);
    }
    this.render(dt);
  }

  humanMove(dt) {
    const h = this.human, k = this.keys;
    const counting = this.state === 'count' && this.modo === 'procurar';
    let mx = (k.RIGHT.isDown || k.D.isDown ? 1 : 0) - (k.LEFT.isDown || k.A.isDown ? 1 : 0);
    let my = (k.DOWN.isDown || k.S.isDown ? 1 : 0) - (k.UP.isDown || k.W.isDown ? 1 : 0);
    if (counting) { mx = 0; my = 0; }
    if ((mx || my) && h.crouch && this.modo === 'esconder') { h.crouch = false; }
    const run = k.SHIFT.isDown;
    h.boost = Math.max(0, (h.boost || 0) - dt);
    const spd = h.spd * (run ? 1.35 : 1) * (h.boost > 0 ? (h.bike ? 2.3 : 1.6) : 1);
    this.moveBody(h, mx, my, spd, dt);
    if ((mx || my) && run) h.lastNoise = 0.4;
    h.lastNoise = Math.max(0, h.lastNoise - dt);
    // capim balança
    if (mx || my) for (const o of this.objs) if (o.mato && Math.abs(h.x - o.x) < o.w / 2 && h.y < o.y && h.y > o.y - o.h + 20) {
      if (!this.rustle || this.rustle < time()) {
        this.rustle = time() + 450; TR.sfx(this, 'mato', 0.35); h.lastNoise = 0.6;
        this.tweens.add({ targets: o.img, scaleX: 1.04, yoyo: true, duration: 120 });
      }
    }
    function time() { return performance.now(); }
  }

  moveBody(k, mx, my, spd, dt) {
    const len = Math.hypot(mx, my);
    if (len > 0) {
      mx /= len; my /= len;
      const nx = k.x + mx * spd * dt, ny = k.y + my * spd * dt * 0.85;
      if (!this.blockedPoint(nx, k.y, 12)) k.x = nx;
      if (!this.blockedPoint(k.x, ny, 12)) k.y = ny;
      k.face = { x: mx, y: my };
      k.dir = TR.dirFrom(mx, my, k.dir);
      k.moving = true;
    } else k.moving = false;
  }

  followPath(k, spd, dt) {
    if (!k.path || !k.path.length) { k.moving = false; return true; }
    const [tx, ty] = k.path[0];
    const dx = tx - k.x, dy = ty - k.y, d = Math.hypot(dx, dy);
    if (d < 10) { k.path.shift(); return !k.path.length; }
    const len = d;
    k.x += dx / len * Math.min(spd * dt, d); k.y += dy / len * Math.min(spd * dt, d);
    k.face = { x: dx / len, y: dy / len };
    k.dir = TR.dirFrom(dx, dy, k.dir);
    k.moving = true;
    return false;
  }

  aiMove(k, dt) {
    const P = this.pique;
    if (k.role === 'seeker') {
      if (this.state === 'count') { k.moving = false; k.dir = 'up'; return; }
      if (k.state === 'race') {
        if (this.followPath(k, k.spd * 1.3, dt)) {
          k.state = 'patrol';
          // chegou primeiro no pique: bate o 1, 2, 3 de quem estava correndo
          this.hiders.filter((h) => h.state === 'race').forEach((h) => this.caught(h));
        }
        return;
      }
      // ouviu barulho? vai checar
      const h = this.human;
      if (this.modo === 'esconder' && h.lastNoise > 0 && Math.hypot(h.x - k.x, h.y - k.y) < 380 && k.state !== 'investigate') {
        k.state = 'investigate'; k.path = this.path(k.x, k.y, h.x, h.y + 40);
        TR.bubble(this, k.spr, 'Ouvi alguma coisa...', 1.2);
      }
      k.guardT = (k.guardT || 0) - dt;
      if (!k.path || !k.path.length) {
        if (k.state === 'investigate') k.state = 'patrol';
        // às vezes volta pra perto do pique pra vigiar
        if (k.guardT <= 0 && Math.random() < 0.45) {
          k.guardT = 9;
          k.path = this.path(k.x, k.y, P.x + Phaser.Math.Between(-80, 80), P.y + 80);
        } else {
          const cand = this.spots.filter((s) => !k.checked.has(s));
          if (!cand.length) k.checked.clear();
          const list = (cand.length ? cand : this.spots).slice().sort((a, b) => this.d2(a, k) - this.d2(b, k));
          const s = list[Math.floor(Math.random() * Math.min(3, list.length))];
          k.checked.add(s);
          const vx = s.obj && !s.obj.mato ? s.x : s.x + 40;
          const vy = s.obj && !s.obj.mato ? s.obj.y + 46 : s.y + 30;
          k.path = this.path(k.x, k.y, vx, vy);
          k.lookAt = s;
          k.peeked = false;
        }
      }
      const arrived = this.followPath(k, k.spd * (k.state === 'investigate' ? 1.15 : 1.0), dt);
      if (arrived && !k.peeked) {
        k.peeked = true;
        const at = k.state === 'investigate' || !k.lookAt ? { x: k.x, y: k.y - 40 } : k.lookAt;
        this.peek(at, k.state === 'investigate' ? 150 : 115);
      }
      if (!k.path.length && k.lookAt) { k.face = { x: k.lookAt.x - k.x, y: k.lookAt.y - k.y }; const l = Math.hypot(k.face.x, k.face.y) || 1; k.face.x /= l; k.face.y /= l; k.dir = TR.dirFrom(k.face.x, k.face.y, 'up'); }
      return;
    }
    // escondidos (IA)
    if (k.state === 'going') { this.followPath(k, k.spd * 1.25, dt); if (!k.path.length) { k.state = 'hidden'; k.crouch = true; } return; }
    if (k.state === 'hidden') {
      k.moving = false;
      // tentar se salvar quando o procurador está longe do pique
      const s = this.seeker;
      const far = Math.hypot(s.x - P.x, s.y - P.y) > 650 && Math.hypot(s.x - k.x, s.y - k.y) > 380;
      if (this.state === 'search' && far && Math.random() < dt * 0.022) {
        k.state = 'sneak'; k.crouch = false; k.path = this.path(k.x, k.y, P.x, P.y + 20);
        if (k.spot) k.spot.used = false;
      }
      return;
    }
    if (k.state === 'sneak' || k.state === 'race') {
      const done = this.followPath(k, k.spd * (k.state === 'race' ? 1.1 : 1), dt);
      if (done || Math.hypot(k.x - P.x, k.y - P.y) < 46) this.reachPique(k);
    }
  }

  // o procurador espia atrás de um esconderijo
  peek(at, radius) {
    const cand = this.hiders.filter((h) => ['hidden', 'idle', 'sneak'].includes(h.state) && Math.hypot(h.x - at.x, h.y - at.y) < radius);
    cand.forEach((h) => {
      const chance = h === this.human ? (this.hiddenAmount(h) >= 0.95 ? 0.75 : 0.95) : 0.85;
      if (Math.random() < chance) this.spotted(h);
    });
  }

  reachPique(k) {
    if (k.state === 'saved' || k.state === 'caught') return;
    const s = this.seeker;
    const seekerFirst = k.state === 'race' && Math.hypot(s.x - this.pique.x, s.y - this.pique.y) < 50;
    if (seekerFirst) return this.caught(k);
    k.state = 'saved'; this.saved++;
    TR.sfx(this, 'salvou', 0.5);
    TR.bubble(this, k.spr, '1, 2, 3, salve eu!', 1.6);
    if (k.spot) k.spot.used = false;
    k.path = null; k.moving = false;
    this.park(k);
    if (k === this.human) return this.endGame('salvo');
    this.checkDone();
  }

  caught(k) {
    k.state = 'caught';
    TR.sfx(this, 'achou', 0.5, 0.8);
    TR.bubble(this, this.seeker.spr, '1, 2, 3, ' + TR.KIDS[k.id].nome + '!', 1.6);
    k.path = null; k.moving = false;
    this.park(k);
    if (k === this.human) return this.endGame('pego');
    this.checkDone();
  }

  park(k) {
    const n = this.kids.filter((q) => q.state === 'saved' || q.state === 'caught').length;
    k.x = this.pique.x - 160 + n * 46; k.y = this.pique.y - 4; k.dir = 'down'; k.crouch = false;
  }

  checkRules(dt) {
    const s = this.seeker, P = this.pique;
    // procurador IA vendo alguém
    if (s !== this.human) {
      this.hiders.forEach((k) => {
        if (!['hidden', 'sneak', 'idle'].includes(k.state)) return;
        if (this.canSee(s, k, false)) {
          k.seenT += dt;
          if (k.seenT > (k.crouch ? 0.9 : 0.5)) this.spotted(k);
        } else k.seenT = Math.max(0, k.seenT - dt * 0.5);
      });
    }
    // corrida até o pique
    const h = this.human;
    if (this.modo === 'esconder') {
      if (h.state !== 'saved' && h.state !== 'caught' && Math.hypot(h.x - P.x, (h.y - P.y) * 1.2) < 48) {
        if (h.state === 'race' && Math.hypot(s.x - P.x, s.y - P.y) < 50) this.caught(h); else { h.state = h.state === 'race' ? 'race' : 'sneak'; this.reachPique(h); }
      }
      if (h.state === 'race' && Math.hypot(s.x - P.x, s.y - P.y) < 40 && Math.hypot(h.x - P.x, h.y - P.y) > 48) this.caught(h);
    } else {
      // você é o procurador: chegou no pique primeiro = pegou
      this.aiHiders.forEach((k) => {
        if (k.state === 'race' && Math.hypot(h.x - P.x, (h.y - P.y) * 1.2) < 50) this.caught(k);
      });
    }
    if (this.arrowT > 0) this.arrowT -= dt;
  }

  checkDone() {
    const left = this.aiHiders.filter((k) => k.state === 'hidden' || k.state === 'sneak' || k.state === 'race' || k.state === 'going');
    if (this.modo === 'procurar' && !left.length) this.endGame(null);
  }

  // ------------------------------------------------------------ desenho
  render(dt) {
    this.kids.forEach((k) => {
      const crouch = k.crouch && !k.moving;
      k.spr.setPosition(Math.round(k.x), Math.round(k.y)).setDepth(k.y + 1);
      k.sh.setPosition(Math.round(k.x), Math.round(k.y));
      if (crouch) { k.spr.stop(); k.spr.setFrame(k.dir === 'up' ? TR.Q.agachaCostas : TR.Q.agachaFrente); }
      else TR.pose(k.spr, k.dir, k.moving);
      const hid = this.hiddenAmount(k);
      k.spr.setAlpha(k === this.human && hid >= 0.95 ? 0.7 : 1);
      if (k.state === 'saved') k.spr.setTint(0xb8ffb8); else if (k.state === 'caught') k.spr.setTint(0xffb8b8); else k.spr.clearTint();
    });
    // cone de visão do procurador
    this.cone.clear();
    const s = this.seeker;
    if (s && this.state === 'search' && s.face) {
      const a = Math.atan2(s.face.y, s.face.x), r = 300;
      this.cone.fillStyle(0xfff3a0, 0.12).slice(s.x, s.y - 30, r, a - 0.7, a + 0.7, false).fillPath();
    }
    // seta do Estrategista
    if (this.arrowT > 0 && this.arrowTarget) {
      const h = this.human, t = this.arrowTarget, a = Math.atan2(t.y - h.y, t.x - h.x);
      this.arrow.setVisible(true).setPosition(h.x + Math.cos(a) * 70, h.y - 60 + Math.sin(a) * 40).setRotation(a).setDepth(6000);
    } else this.arrow.setVisible(false);
    // HUD
    const m = Math.max(0, Math.floor((this.timeLeft || 0) / 60)), sec = Math.max(0, Math.floor((this.timeLeft || 0) % 60)).toString().padStart(2, '0');
    if (this.state === 'count') this.hud.setText((this.modo === 'esconder' ? this.nomeSeeker + ' contando: ' : 'Contando: ') + this.count + '...');
    else if (this.state === 'search') this.hud.setText('Achados ' + this.found + '  ·  Salvos ' + this.saved + '  ·  ' + m + ':' + sec);
    if (this.state === 'search' && this.modo === 'esconder' && this.human.state !== 'race') {
      const hid = this.hiddenAmount(this.human);
      this.tipSet(hid >= 0.95 ? 'Escondido! Fica quietinho...' : this.human.crouch ? 'Agachado, mas dá pra te ver daqui' : 'Espaço = agachar atrás de algo');
    }
    if (this.state === 'search' && this.modo === 'procurar') this.tipSet('Espaço = "Achei!" perto de alguém  ·  E = Estrategista' + (this.habCd > 0 ? ' (' + Math.ceil(this.habCd) + 's)' : ''));
    this.updateMinimap();
  }

  tipSet(t) {
    if (this._tip === t) return;
    this._tip = t;
    this.tip.setText(t);
    this.tipBg.clear().fillStyle(0x0c0810, 0.8).fillRect(480 - this.tip.width / 2 - 10, 504, this.tip.width + 20, 26);
  }

  makeMinimap() {
    const s = 0.09, x = 16, y = TR.H - 12 - Math.round(this.WH * s);   // canto de baixo, cabe qualquer tamanho de mapa
    this.mm = { x, y, s };
    this.add.graphics().setScrollFactor(0).setDepth(5900).fillStyle(0x0c0810, 0.85).fillRect(x - 4, y - 4, this.WW * s + 8, this.WH * s + 8);
    this.add.image(x, y, 'esc_chao').setOrigin(0).setScale(s).setScrollFactor(0).setDepth(5901);
    this.mmDots = this.add.graphics().setScrollFactor(0).setDepth(5902);
  }

  updateMinimap() {
    const { x, y, s } = this.mm;
    const g = this.mmDots.clear();
    g.fillStyle(0xffd36a, 1).fillRect(x + this.pique.x * s - 2, y + this.pique.y * s - 2, 5, 5);
    if (this.human) g.fillStyle(0x7cf27c, 1).fillRect(x + this.human.x * s - 2, y + this.human.y * s - 2, 5, 5);
    if (this.seeker && this.seeker !== this.human && this.modo === 'esconder') g.fillStyle(0xff5a3c, 1).fillRect(x + this.seeker.x * s - 2, y + this.seeker.y * s - 2, 5, 5);
    const cam = this.cameras.main;
    g.lineStyle(1, 0xffffff, 0.8).strokeRect(x + cam.scrollX * s, y + cam.scrollY * s, 960 * s, 540 * s);
  }

  flash(msg, color) {
    this.big.setText(msg).setTint(color).setVisible(true).setScale(0.3);
    this.tweens.add({ targets: this.big, scale: 1, duration: 250, ease: 'Back.Out' });
    this.time.delayedCall(1100, () => this.big.setVisible(false));
  }

  endGame(why) {
    if (this.state === 'end') return;
    this.state = 'end';
    let title, sub, won;
    if (this.modo === 'esconder') {
      won = why !== 'pego';
      title = why === 'salvo' ? 'SALVO!' : why === 'pego' ? 'TE ACHARAM!' : 'NINGUÉM TE ACHOU!';
      sub = 'Achados ' + this.found + ' · Salvos ' + this.saved;
    } else {
      won = this.found - this.saved > this.saved;
      const caught = this.kids.filter((k) => k.state === 'caught').length;
      title = caught >= this.saved ? 'MANDOU BEM!' : 'A TURMA GANHOU!';
      won = caught >= this.saved;
      sub = 'Pegos ' + caught + ' · Salvos ' + this.saved;
    }
    TR.sfx(this, won ? 'vitoria' : 'derrota', 0.6);
    TR.endPanel(this, title, sub, () => this.scene.restart({ modo: this.modo, quem: this.quem }));
  }

  d2(a, b) { return (a.x - b.x) ** 2 + (a.y - b.y) ** 2; }
}
