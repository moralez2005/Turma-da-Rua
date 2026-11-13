/*
 * Futebol de rua 3 x 3 com física de bola (altura, quique, atrito) e habilidades.
 * Setas/WASD andam · Espaço passa · C passe por cima · Z drible · Shift (segurar/soltar) chuta · E habilidade · Q troca
 */
class Futebol extends Phaser.Scene {
  constructor() { super('Futebol'); }

  create() {
    this._saindo = false;
    this.players = null;   // ao jogar de novo, a cena reaproveita o objeto: limpa o que sobrou da partida anterior
    this.cameras.main.fadeIn(300, 18, 13, 24);
    this.F = { x0: 24, x1: 936, y0: 292, y1: 498, mid: 480, gy0: 344, gy1: 444 };
    TR.ruaComCeu(this);
    this.drawField();
    TR.backButton(this);
    this.state = 'escolha';
    TR.escolherTimes(this, 'futebol', {
      titulo: 'Futebol: monte os times',
      papeis: ['Atacante', 'Defesa', 'Goleiro'],
      padrao: { azul: ['pernalonga', 'cezar', 'kaua'], vermelho: ['lucas', 'pedro', 'gabriel'] },
      opcoes: [
        { chave: 'tempo', rotulo: 'Tempo', tecla: 'T', padrao: 180, valores: [[120, '2 min'], [180, '3 min'], [300, '5 min'], [600, '10 min']] },
        { chave: 'gols', rotulo: 'Vence com', tecla: 'G', padrao: 2, valores: [[2, '2 gols'], [3, '3 gols'], [5, '5 gols'], [0, 'sem limite']] },
        { chave: 'clima', rotulo: 'Clima', tecla: 'K', padrao: 'surpresa', valores: [['sol', 'sol'], ['surpresa', 'surpresa'], ['chuva', 'vai chover']] },
      ],
    }, (t) => this.montar(t));
  }

  // Monta a partida com os times escolhidos (o 1º de cada time ataca, o 2º defende, o 3º vai pro gol)
  montar(times) {
    const F = this.F;

    this.score = [0, 0];
    this.opcoes = times.opcoes;
    this.aguaTimer = undefined;
    this.dentroDoBarracao = false; this.torcedoresCorrendo = [];
    // chuva: 'chuva' = com certeza, 'surpresa' = às vezes, 'sol' = nunca
    const clima = times.opcoes.clima;
    this.chuvaTimer = clima === 'chuva' ? Phaser.Math.Between(25, 45) : (clima === 'surpresa' && Math.random() < 0.4 ? Phaser.Math.Between(40, 120) : -1);
    this.timeLeft = times.opcoes.tempo;
    this.golsPraVencer = times.opcoes.gols;
    // o dia vai acabando conforme o tempo da partida passa
    const total = times.opcoes.tempo;
    TR.cicloDoDia(this, () => 1 - this.timeLeft / total, (t) => TR.bubble(this, Phaser.Utils.Array.GetRandom(this.players).spr, t, 1.8));
    this.state = 'intro';
    this.carTimer = Phaser.Math.Between(35, 55);
    this.car = null;
    this.charge = 0;

    const papel = ['att', 'def', 'gk'];
    const casa = [[[380, 430], [240, 340], [58, 394]], [[580, 360], [720, 450], [902, 394]]];
    const roles = [];
    [times.azul, times.vermelho].forEach((lista, team) => lista.forEach((id, i) => roles.push({ id, team, role: papel[i], home: casa[team][i] })));
    this.players = roles.map((r) => this.makePlayer(r));
    this.human = this.players[0];
    this.nomeTime = [TR.KIDS[times.azul[0]].nome, TR.KIDS[times.vermelho[0]].nome];

    // quem ficou de fora assiste da calçada (o primeiro deles comenta o jogo)
    this.torcida = times.fora.map((id, i) => {
      const s = TR.kid(this, id, 660 - i * 70, 258).setDepth(258);
      s.play(id + '_idle');
      return s;
    });
    this.daniel = this.torcida[0] || this.players[0].spr;

    this.ball = { x: 480, y: 394, z: 0, vx: 0, vy: 0, vz: 0, owner: null, last: null, noPick: 0 };
    this.ballShadow = this.add.ellipse(0, 0, 18, 6, 0x000000, 0.35);
    this.ballSpr = this.add.image(0, 0, 'bola').setScale(2);

    // interface
    const top = this.add.graphics().setDepth(6000);
    top.fillStyle(0x0c0810, 0.85).fillRect(300, 0, 360, 40);
    this.hud = TR.txt(this, 480, 12, '', 1, 0xfff1d6).setOrigin(0.5, 0).setDepth(6001);
    this.habTxt = TR.txt(this, 16, 514, '', 1, 0xffd36a).setDepth(6001);
    this.habBar = this.add.graphics().setDepth(6000);
    this.marker = this.add.triangle(0, 0, 0, 0, 20, 0, 10, 13, 0xffe066).setStrokeStyle(2, 0x241a2c).setDepth(6000);
    this.passArrow = this.add.triangle(0, 0, 0, 0, 14, 0, 7, 9, 0x7cf27c).setDepth(6000).setVisible(false);
    this.chargeBar = this.add.graphics().setDepth(6000);
    this.big = TR.txt(this, 480, 200, '', 4, 0xffd36a).setOrigin(0.5).setDepth(6500).setVisible(false);
    TR.jblHud(this, { lucas: [548, 280], pedro: [800, 280] });

    this.keys = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D,SPACE,SHIFT,E,Q,Z,C');
    this.input.keyboard.on('keydown-SPACE', () => this.humanPass());
    this.input.keyboard.on('keydown-Q', () => this.swapToNearest());
    this.input.keyboard.on('keydown-C', () => this.humanPass(true));
    this.input.keyboard.on('keydown-Z', () => this.dribble(this.human));
    this.input.keyboard.on('keydown-E', () => this.useAbility(this.human));
    this.input.keyboard.on('keyup-SHIFT', () => this.humanShoot());

    this.kickoff(0);
    TR.instructions(this, 'Futebol de rua', [
      'Setas ou WASD ...... andar (a bola vai junto no pé)',
      'Espaço ............. passe rasteiro (seta verde = quem recebe)',
      'C .................. passe por cima (passa por cima de quem marca)',
      'Z .................. drible / finta (ninguém rouba por um instante)',
      'Shift .............. segure pra carregar e solte pra chutar',
      '   + ↑ ou ↓ ........ escolhe o canto do gol',
      'E .................. habilidade do jogador',
      'Q .................. trocar de jogador',
      'Encoste em quem está com a bola pra roubar. ' + (this.golsPraVencer ? this.golsPraVencer + ' gols ganha!' : 'Ganha quem tiver mais gols no fim!'),
    ], () => { this.state = 'play'; TR.sfx(this, 'apito', 0.5); TR.bubble(this, this.daniel, 'Vai, ' + TR.KIDS[this.human.id].nome + '!', 2); });
    const byId = {}; this.players.forEach((p) => { byId[p.id] = p.spr; }); times.fora.forEach((id, i) => { byId[id] = this.torcida[i]; });
    TR.chatter(this, (id) => byId[id], { can: () => this.state === 'play', first: 6000 });
  }

  // ------------------------------------------------------------------ criação
  makePlayer(r) {
    const st = TR.KIDS[r.id];
    const spr = TR.kid(this, r.id, r.home[0], r.home[1]);
    const sh = TR.shadow(this, r.home[0], r.home[1], 44).setStrokeStyle(2, r.team === 0 ? 0x5ab0ff : 0xff6a5a, 0.9);
    return {
      id: r.id, team: r.team, role: r.role, home: { x: r.home[0], y: r.home[1] }, x: r.home[0], y: r.home[1],
      spd: st.vel, kick: st.chute, dir: r.team === 0 ? 'right' : 'left', face: { x: r.team === 0 ? 1 : -1, y: 0 },
      spr, sh, moving: false, stealCd: 0, aiCd: 0, hold: 0, boost: 0, boostMul: 1, slow: 0, immune: 0,
      habCd: Phaser.Math.FloatBetween(4, 9), bomb: false, dribCd: 0, drib: null,
    };
  }

  drawField() {
    const g = this.add.graphics().setDepth(1);
    const F = this.F;
    g.fillStyle(0xffffff, 0.35).fillRect(F.mid - 1, F.y0, 2, F.y1 - F.y0);
    for (let a = 0; a < 360; a += 8) {
      const r = Phaser.Math.DegToRad(a);
      g.fillRect(Math.round(F.mid + Math.cos(r) * 48), Math.round(394 + Math.sin(r) * 30), 2, 2);
    }
    const chinelo = (x, y) => {
      g.fillStyle(0x241a2c, 1).fillRect(x - 1, y - 15, 10, 18);
      g.fillStyle(0x3c6ec8, 1).fillRect(x, y - 14, 8, 16);
      g.fillStyle(0xffffff, 1).fillRect(x + 3, y - 12, 2, 2).fillRect(x + 1, y - 9, 2, 2).fillRect(x + 5, y - 9, 2, 2);
    };
    [[F.x0 - 6, F.gy0], [F.x0 + 4, F.gy0], [F.x0 - 6, F.gy1], [F.x0 + 4, F.gy1],
      [F.x1 - 12, F.gy0], [F.x1 - 2, F.gy0], [F.x1 - 12, F.gy1], [F.x1 - 2, F.gy1]].forEach(([x, y]) => chinelo(x, y));
  }

  // ------------------------------------------------------------------ loop
  update(time, delta) {
    if (!this.players) return;   // ainda escolhendo os times
    const dt = Math.min(delta, 50) / 1000;
    if (this.state === 'play') {
      this.timeLeft -= dt;
      this.carTimer -= dt;
      if (this.carTimer <= 0) this.startCar();
      if (this.chuvaTimer > 0) { this.chuvaTimer -= dt; if (this.chuvaTimer <= 0) return this.comecaChuva(); }
      // de vez em quando a Dona Tita oferece água pra turma
      this.aguaTimer = (this.aguaTimer === undefined ? Phaser.Math.Between(50, 80) : this.aguaTimer) - dt;
      if (this.aguaTimer <= 0) {
        this.aguaTimer = Phaser.Math.Between(70, 110);
        const quem = Phaser.Utils.Array.GetRandom(this.players);
        TR.vizinhaEspia(this, 'tita', 'agua', () => TR.bubble(this, quem.spr, Phaser.Utils.Array.GetRandom(TR.VIZINHAS.tita.falas.respostaAgua), 1.6));
      }
      if (this.timeLeft <= 0) return this.endGame();
      if (!this.human) this.human = this.players.find((p) => p.team === 0 && p.role !== 'gk');
      this.players.forEach((p) => this.tickEffects(p, dt));
      this.humanInput(dt);
      this.players.forEach((p) => { if (p !== this.human) this.ai(p, dt); });
      this.separate();
      this.updateBall(dt);
    }
    if (this.car) this.updateCar(dt);
    if (this.state === 'chuva') this.correPraCoberta(dt);
    this.render(time);
  }

  tickEffects(p, dt) {
    p.stealCd -= dt; p.aiCd -= dt; p.habCd -= dt; p.dribCd = (p.dribCd || 0) - dt;
    p.boost = Math.max(0, p.boost - dt); p.slow = Math.max(0, p.slow - dt); p.immune = Math.max(0, p.immune - dt);
    if (p.boost <= 0) p.boostMul = 1;
  }

  speedOf(p) {
    let s = p.spd * p.boostMul;
    if (p.slow > 0) s *= 0.55;
    if (this.ball.owner === p) s *= 0.88;
    return s;
  }

  // ------------------------------------------------------------------ humano
  humanInput(dt) {
    const p = this.human, k = this.keys;
    if (!p) return;
    const mx = (k.RIGHT.isDown || k.D.isDown ? 1 : 0) - (k.LEFT.isDown || k.A.isDown ? 1 : 0);
    const my = (k.DOWN.isDown || k.S.isDown ? 1 : 0) - (k.UP.isDown || k.W.isDown ? 1 : 0);
    if (!this.doDrib(p, dt)) this.move(p, mx, my, this.speedOf(p), dt);
    if (k.SHIFT.isDown && this.ball.owner === p) this.charge = Math.min(1, this.charge + dt * 1.3);
    const o = this.ball.owner;
    if (o && o.team !== p.team && this.dist(p, this.ball) < 26 && p.stealCd <= 0 && o.immune <= 0) {
      p.stealCd = 0.3;
      if (Math.random() < 0.6) { this.give(p); TR.sfx(this, 'pegar', 0.3); }
    }
  }

  humanPass(lob) {
    if (this.state !== 'play') return;
    const p = this.human;
    if (!p || this.ball.owner !== p) return;
    const m = this.bestPass(p);
    if (!m) return;
    if (lob) this.lob(p, m); else this.kickTo(p, m.x + m.face.x * 10, m.y, 470, 40);
    TR.sfx(this, 'passe', 0.5);
    this.human = m;
  }

  // passe por cima: a bola sobe e passa por cima de quem está no meio do caminho
  lob(p, m) {
    const d = Math.hypot(m.x - this.ball.x, m.y - this.ball.y);
    const t = Phaser.Math.Clamp(d / 300, 0.8, 1.2);
    const vz = 490 * t;
    const sp = d / (t * 1.08);
    this.kickTo(p, m.x, m.y, sp, vz);
    this.ball.lob = true;
    if (Math.random() < 0.4) TR.bubble(this, p.spr, p.id === 'cezar' ? 'Chapéu!' : 'Vai por cima!', 1);
  }

  // drible: finta pro lado com a bola colada no pé
  dribble(p) {
    if (this.state !== 'play' || !p || this.ball.owner !== p || p.dribCd > 0) return;
    p.dribCd = 1.6;
    const opp = this.players.filter((q) => q.team !== p.team).sort((a, b) => this.dist(a, p) - this.dist(b, p))[0];
    const atk = p.team === 0 ? 1 : -1;
    let side = opp ? (opp.y > p.y ? -1 : 1) : (Math.random() < 0.5 ? -1 : 1);
    if (p.y + side * 60 < this.F.y0 + 10 || p.y + side * 60 > this.F.y1 - 10) side = -side;
    p.drib = { t: 0.32, vx: atk * 0.75, vy: side * 0.9 };
    p.immune = Math.max(p.immune, 0.6);
    if (opp && this.dist(opp, p) < 70) opp.stealCd = 0.8; // marcador fica pra trás
    TR.sfx(this, 'pulo', 0.35, 1.3);
    const fr = { cezar: ['Caneta!', 'Olé!'], pernalonga: ['Fica aí!'], lucas: ['Sai, Juliete!'], pedro: ['Ginga de MC!'] }[p.id] || ['Olé!'];
    if (Math.random() < 0.6) TR.bubble(this, p.spr, fr[Math.floor(Math.random() * fr.length)], 0.9);
  }

  humanShoot() {
    const p = this.human;
    if (!p || this.state !== 'play' || this.ball.owner !== p) { this.charge = 0; return; }
    const F = this.F, k = this.keys;
    const gx = p.team === 0 ? F.x1 + 20 : F.x0 - 20;
    let gy = (F.gy0 + F.gy1) / 2;
    if (k.UP.isDown || k.W.isDown) gy = F.gy0 + 14;
    if (k.DOWN.isDown || k.S.isDown) gy = F.gy1 - 14;
    this.shoot(p, gx, gy, this.charge);
    this.charge = 0;
  }

  shoot(p, gx, gy, charge) {
    let power = 430 + p.kick * 40 + charge * 280;
    let vz = 60 + charge * 190;
    if (p.bomb) { power *= 1.45; vz *= 0.6; p.bomb = false; this.cameras.main.shake(180, 0.006); TR.bubble(this, p.spr, 'BOMBA!', 1.2); }
    this.kickTo(p, gx, gy + Phaser.Math.Between(-10, 10), power, vz);
    TR.sfx(this, 'chute', 0.7);
  }

  swapToNearest() {
    if (this.state !== 'play') return;
    const mates = this.players.filter((p) => p.team === 0 && p !== this.human && p.role !== 'gk');
    if (!mates.length) return;
    mates.sort((a, b) => this.dist(a, this.ball) - this.dist(b, this.ball));
    this.human = mates[0];
    TR.sfx(this, 'hover', 0.3);
  }

  // ------------------------------------------------------------------ habilidades
  useAbility(p) {
    if (this.state !== 'play' || !p || p.habCd > 0) return;
    p.habCd = 7;
    TR.sfx(this, 'habilidade', 0.5);
    const nome = TR.KIDS[p.id].hab;
    if (p.id === 'pernalonga') { p.boost = 1.6; p.boostMul = 1.65; }
    else if (p.id === 'cezar') { p.boost = 0.45; p.boostMul = 2.4; p.immune = 1.2; }
    else if (p.id === 'lucas') {
      this.players.forEach((q) => { if (q.team !== p.team && this.dist(q, p) < 220) q.slow = 2.2; });
      TR.bubble(this, p.spr, 'kkkkk Dona Juliete!', 1.4); return;
    } else if (p.id === 'pedro') { p.bomb = true; }
    else if (p.id === 'kaua' || p.id === 'gabriel') { p.boost = 1.2; p.boostMul = 1.5; }
    else if (p.id === 'matheus') { p.boost = 1.4; p.boostMul = 1.9; TR.bike(this, p.spr, 1.4); }
    else if (p.id === 'manu') { p.boost = 0.8; p.boostMul = 1.5; p.immune = 1.6; }
    else if (p.id === 'guilherme') {
      // arruma treta: quem está perto fica parado discutindo (o Pedro fica mais tempo)
      this.players.forEach((q) => { if (q.team !== p.team && this.dist(q, p) < 200) q.slow = q.id === 'pedro' ? 3.5 : 1.6; });
      const ped = this.players.find((q) => q.id === 'pedro');
      TR.bubble(this, p.spr, ped ? 'Pedro, vem cá!' : 'Treta!', 1.2);
      if (ped) this.time.delayedCall(700, () => TR.bubble(this, ped.spr, Phaser.Utils.Array.GetRandom(TR.REACT.tretaPedro), 1.4));
      return;
    }
    TR.bubble(this, p.spr, nome + '!', 1.2);
  }

  // ------------------------------------------------------------------ IA
  ai(p, dt) {
    const F = this.F, b = this.ball;
    const mine = b.owner && b.owner.team === p.team;
    const atk = p.team === 0 ? 1 : -1;
    const ownGoal = p.team === 0 ? F.x0 : F.x1;
    const oppGoal = p.team === 0 ? F.x1 : F.x0;
    let tx = p.home.x, ty = p.home.y, spd = this.speedOf(p);

    if (p.role === 'gk') {
      tx = ownGoal + atk * 34;
      ty = Phaser.Math.Clamp(b.y, F.gy0 + 6, F.gy1 - 6);
      const near = Math.abs(b.x - ownGoal) < 170 && !mine;
      if (near) tx = ownGoal + atk * Math.min(80, Math.abs(b.x - ownGoal) * 0.5);
      if (b.owner === p) {
        p.hold += dt;
        if (p.hold > 0.6) { const m = this.bestPass(p); if (m) { this.kickTo(p, m.x, m.y, 460, 80); TR.sfx(this, 'passe', 0.4); } }
      }
      if (!b.owner && Math.abs(b.x - ownGoal) < 110 && p.habCd <= 0 && Math.hypot(b.vx, b.vy) > 300) this.useAbility(p);
    } else if (b.owner === p) {
      p.hold += dt;
      tx = oppGoal; ty = 394 + Math.sin(this.time.now / 700 + p.home.y) * 50;
      const pressure = this.players.some((q) => q.team !== p.team && this.dist(q, p) < 60);
      if (Math.abs(oppGoal - p.x) < 300 && p.aiCd <= 0) {
        p.aiCd = 1.2;
        if (p.id === 'pedro' && p.habCd <= 0) this.useAbility(p);
        this.shoot(p, oppGoal + atk * 20, Phaser.Math.Between(F.gy0 + 10, F.gy1 - 10), Math.random() * 0.6);
        return;
      }
      if (pressure && p.hold > 0.5 && p.aiCd <= 0) {
        const m = this.bestPass(p);
        if (m) {
          p.aiCd = 0.9;
          const blocked = this.players.some((q) => q.team !== p.team && this.dist(q, { x: (p.x + m.x) / 2, y: (p.y + m.y) / 2 }) < 50);
          if (blocked) this.lob(p, m); else this.kickTo(p, m.x, m.y, 460, 40);
          TR.sfx(this, 'passe', 0.4); return;
        }
      }
      if (p.id === 'cezar' && pressure && p.habCd <= 0) this.useAbility(p);
      if (pressure && p.dribCd <= 0 && Math.random() < 0.02) this.dribble(p);
    } else if (mine) {
      tx = Phaser.Math.Clamp(b.x + atk * (p.role === 'att' ? 170 : -90), F.x0 + 70, F.x1 - 70);
      ty = p.role === 'att' ? (b.y < 394 ? 452 : 336) : p.home.y;
    } else {
      const chaser = this.closestOfTeam(p.team);
      if (chaser === p) { tx = b.x; ty = b.y; spd *= 1.04; }
      else { tx = (p.home.x + b.x) / 2; ty = (p.home.y + b.y) / 2; }
      if (b.owner && b.owner.team !== p.team && this.dist(p, b) < 26 && p.stealCd <= 0 && b.owner.immune <= 0) {
        p.stealCd = 0.45;
        if (Math.random() < 0.38) { this.give(p); TR.sfx(this, 'pegar', 0.3); }
      }
      if (p.id === 'lucas' && p.habCd <= 0 && b.owner && b.owner.team !== p.team && this.dist(p, b.owner) < 200) this.useAbility(p);
    }
    if (this.doDrib(p, dt)) return;
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
    if (d > 6) this.move(p, dx / d, dy / d, spd * 0.92, dt); else this.move(p, 0, 0, 0, dt);
  }

  doDrib(p, dt) {
    if (!p.drib) return false;
    p.drib.t -= dt;
    if (p.drib.t <= 0 || this.ball.owner !== p) { p.drib = null; return false; }
    const keepFace = { x: p.face.x, y: p.face.y };
    this.move(p, p.drib.vx, p.drib.vy, this.speedOf(p) * 2.1, dt);
    p.face = { x: keepFace.x * 0.6 + p.drib.vx * 0.4, y: p.drib.vy * 0.5 };
    return true;
  }

  closestOfTeam(team) {
    let best = null, bd = 1e9;
    this.players.forEach((p) => { if (p.team === team && p.role !== 'gk') { const d = this.dist(p, this.ball); if (d < bd) { bd = d; best = p; } } });
    return best;
  }

  bestPass(p) {
    let best = null, score = 1e9;
    this.players.forEach((q) => {
      if (q === p || q.team !== p.team) return;
      const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1;
      const align = (dx * p.face.x + dy * p.face.y) / d;
      const s = d * (1.7 - align) + (q.role === 'gk' ? 260 : 0);
      if (s < score) { score = s; best = q; }
    });
    return best;
  }

  // ------------------------------------------------------------------ movimento
  move(p, mx, my, spd, dt) {
    const F = this.F, len = Math.hypot(mx, my);
    if (len > 0) {
      mx /= len; my /= len;
      p.x += mx * spd * dt; p.y += my * spd * dt;
      p.face = { x: mx, y: my };
      p.dir = TR.dirFrom(mx, my, p.dir);
      p.moving = true;
    } else p.moving = false;
    p.x = Phaser.Math.Clamp(p.x, F.x0 + 8, F.x1 - 8);
    p.y = Phaser.Math.Clamp(p.y, F.y0, F.y1);
  }

  separate() {
    const ps = this.players, F = this.F;
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
      const a = ps[i], b = ps[j], dx = b.x - a.x, dy = (b.y - a.y) * 1.7, d = Math.hypot(dx, dy);
      if (d > 0 && d < 34) {
        const push = (34 - d) / 2;
        a.x -= dx / d * push; b.x += dx / d * push; a.y -= dy / d * push * 0.5; b.y += dy / d * push * 0.5;
      }
    }
    ps.forEach((p) => { p.x = Phaser.Math.Clamp(p.x, F.x0 + 8, F.x1 - 8); p.y = Phaser.Math.Clamp(p.y, F.y0, F.y1); });
  }

  // ------------------------------------------------------------------ bola (física)
  give(p) {
    const b = this.ball;
    if (b.owner) b.owner.hold = 0;
    b.owner = p; p.hold = 0; b.vx = b.vy = b.vz = 0; b.z = 0;
    if (p.team === 0 && p.role !== 'gk') this.human = p;
  }

  kickTo(p, tx, ty, speed, vz) {
    const b = this.ball, dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy) || 1;
    b.owner = null;
    b.vx = dx / d * speed; b.vy = dy / d * speed; b.vz = vz || 0;
    b.last = p; b.noPick = 0.22; p.hold = 0; b.lob = false;
  }

  updateBall(dt) {
    const b = this.ball, F = this.F;
    if (b.owner) {
      const o = b.owner;
      b.x = o.x + o.face.x * 22; b.y = o.y + o.face.y * 8 + 2; b.z = 0;
      return;
    }
    b.noPick -= dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
    // altura: gravidade e quique
    b.vz -= 980 * dt; b.z += b.vz * dt;
    if (b.z <= 0) {
      b.z = 0;
      if (b.vz < -90) { b.vz = -b.vz * 0.48; b.quique = this.time.now; TR.sfx(this, 'quique', Math.min(0.5, -b.vz / 600)); }
      else b.vz = 0;
    }
    const fr = Math.pow(b.z > 0 ? 0.85 : 0.32, dt);
    b.vx *= fr; b.vy *= fr;
    if (Math.hypot(b.vx, b.vy) < 10 && b.z === 0) { b.vx = 0; b.vy = 0; }
    // meios-fios em cima e embaixo. Bola alta ou forte em frente à casa de uma vizinha: cai no quintal dela!
    if (b.y < F.y0) {
      const viz = TR.vizinhaDaFaixa(b.x);
      if (viz && (b.z > 30 || Math.hypot(b.vx, b.vy) > 380)) return this.bolaNaVizinha(viz);
      // bateu no portão sem entrar: às vezes a vizinha sai pra reclamar
      if (viz && Math.hypot(b.vx, b.vy) > 200 && Math.random() < 0.45) TR.vizinhaEspia(this, viz, 'portao');
      b.y = F.y0; b.vy = Math.abs(b.vy) * 0.6; TR.sfx(this, 'quique', 0.3);
    }
    if (b.y > F.y1) { b.y = F.y1; b.vy = -Math.abs(b.vy) * 0.6; TR.sfx(this, 'quique', 0.3); }
    const mouth = b.y > F.gy0 && b.y < F.gy1;
    if (b.x < F.x0) {
      if (mouth && b.z < 70) return this.goal(1);
      if (mouth) { TR.bubble(this, [b.x + 40, b.y], 'Por cima!', 1); }
      b.x = F.x0; b.vx = Math.abs(b.vx) * 0.5;
    }
    if (b.x > F.x1) {
      if (mouth && b.z < 70) return this.goal(0);
      if (mouth && Math.random() < 0.5) return this.bolaNaVizinha('vera');   // isolou por cima: casa lilás
      if (mouth) { TR.bubble(this, [b.x - 40, b.y], 'Por cima!', 1); }
      b.x = F.x1; b.vx = -Math.abs(b.vx) * 0.5;
    }
    if (b.noPick > 0) return;
    const sp = Math.hypot(b.vx, b.vy);
    let best = null, bd = 1e9;
    this.players.forEach((p) => {
      const reach = p.role === 'gk' ? (p.boost > 0 ? 44 : 32) : 22;
      const maxZ = p.role === 'gk' ? 90 : 34;
      const d = this.dist(p, b);
      if (d < reach && b.z < maxZ && d < bd) {
        if (sp > 520 && p.role !== 'gk' && Math.random() < 0.6) return;
        if (sp > 650 && p.role === 'gk' && Math.random() < 0.35) return;
        best = p; bd = d;
      }
    });
    if (best) {
      if (best.role === 'gk' && sp > 300) { TR.sfx(this, 'pulo', 0.4); TR.bubble(this, best.spr, Phaser.Utils.Array.GetRandom(['Defendeu!', 'Pegou nada!']), 1); }
      this.give(best);
    }
  }

  // A bola caiu no quintal de uma vizinha: o jogo para até ela devolver (ou furar)
  bolaNaVizinha(id) {
    const b = this.ball;
    this.state = 'vizinha';
    Object.assign(b, { owner: null, vx: 0, vy: 0, vz: 0, z: 0 });
    this.ballSpr.setVisible(false); this.ballShadow.setVisible(false);
    this.players.forEach((p) => { p.moving = false; });
    const quem = b.last || this.human;
    const v = TR.VIZINHAS[id];
    this.time.delayedCall(500, () => TR.bubble(this, quem.spr, id === 'vera' ? 'Xi... na da ' + v.nome + '...' : 'Ô ' + v.nome + ', a bola!', 1.6));
    const ped = this.players.find((p) => p.id === 'pedro');
    if (id === 'vera' && ped) this.time.delayedCall(2200, () => TR.bubble(this, ped.spr, 'Se ela furar eu vou embora!', 1.6));
    TR.bolaNaCasa(this, id, {
      volta: (x, y) => {
        Object.assign(b, { x, y: this.F.y0 + 6, z: 40, vx: Phaser.Math.Between(-60, 60), vy: 260, vz: 220, last: null, noPick: 0.4 });
        this.ballSpr.setVisible(true); this.ballShadow.setVisible(true);
        TR.sfx(this, 'chute', 0.5);
        this.state = 'play';
      },
      furou: () => {
        this.flash('FUROU A BOLA!');
        TR.bubble(this, this.daniel, 'Acabou o jogo, turma...', 2);
        this.time.delayedCall(1600, () => {
          if (this.state === 'end') return;
          this.state = 'end';
          TR.sfx(this, 'derrota', 0.6);
          TR.endPanel(this, 'FUROU!', 'A filha da ' + v.nome + ' furou a bola. Fim de jogo!', () => this.scene.restart());
        });
      },
    });
  }

  goal(team) {
    this.score[team]++;
    this.state = 'goal';
    TR.sfx(this, team === 0 ? 'gol' : 'derrota', 0.6);
    this.flash(team === 0 ? 'GOOOL!' : 'Gol deles...');
    this.cameras.main.shake(250, 0.008);
    const sc = this.ball.last;
    if (sc) TR.bubble(this, sc.spr, sc.team === team ? TR.fala(sc.id, 'gol') : 'Foi contra...', 1.5);
    const sofreu = this.players.filter((p) => p.team !== team);
    const gol = sofreu.find((p) => p.role === 'gk');
    TR.bubble(this, this.daniel, team === 0 ? 'Golaço!!' : 'Acorda, ' + TR.KIDS[gol.id].nome + '!', 1.5);
    // Pedro não sabe perder: se o time dele tomou gol, ameaça ir embora com a bola
    const ped = sofreu.find((p) => p.id === 'pedro');
    const quem = ped || gol;
    this.time.delayedCall(600, () => TR.bubble(this, quem.spr, TR.fala(quem.id, 'sofreu'), 1.6));
    this.time.delayedCall(1700, () => {
      if (this.golsPraVencer && this.score[team] >= this.golsPraVencer) return this.endGame();
      this.kickoff(team === 0 ? 1 : 0);
      this.state = 'play';
      TR.sfx(this, 'apito', 0.4);
    });
  }

  kickoff(team) {
    this.players.forEach((p) => { p.x = p.home.x; p.y = p.home.y; p.hold = 0; p.moving = false; });
    const b = this.ball;
    Object.assign(b, { x: 480, y: 394, z: 0, vx: 0, vy: 0, vz: 0, owner: null });
    const s = this.players.find((p) => p.team === team && p.role === 'att');
    s.x = team === 0 ? 452 : 508; s.y = 394;
    this.give(s);
    this.human = this.players.find((p) => p.team === 0 && p.role === 'att');
  }

  // ------------------------------------------------------------------ carro
  startCar() {
    this.state = 'car';
    this.carTimer = Phaser.Math.Between(40, 60);
    // às vezes é um Fusca azul: quem apertar F primeiro dá o peteleco
    const fusca = Math.random() < 0.4;
    if (fusca) TR._texturaFusca(this);
    this.car = this.add.image(-120, 420, fusca ? 'fusca' : 'obj_carro').setOrigin(0.5, 1).setDepth(900);
    if (fusca) this.events.once('peteleco', () => this.flash(TR.textoPlacar().replace('Petelecos: ', '')));
    if (fusca) TR.fusca(this, { semCarro: true, voce: () => this.human.spr, kids: () => this.players.map((p) => p.spr).concat(this.torcida) });
    TR.sfx(this, 'carro', 0.5);
    const near = this.players.slice().sort((a, b) => this.dist(a, this.ball) - this.dist(b, this.ball))[0];
    TR.bubble(this, near.spr, 'Ó o carro!', 1.8);
    this.players.forEach((p) => { p.moving = true; p.dir = 'up'; });
  }

  updateCar(dt) {
    // todo mundo sai pra calçada de cima enquanto o carro passa
    if (this.state === 'car') this.players.forEach((p) => { p.y = Math.max(this.F.y0, p.y - 260 * dt); if (p.y <= this.F.y0 + 1) p.moving = false; });
    this.car.x += 320 * dt;
    if (this.car.x > 1100) {
      this.car.destroy(); this.car = null;
      if (this.state === 'car') { this.state = 'play'; this.players.forEach((p) => { p.dir = p.team === 0 ? 'right' : 'left'; }); }
    }
  }

  // ------------------------------------------------------------------ chuva
  comecaChuva() {
    this.state = 'chuva';
    const b = this.ball;
    if (b.owner) { b.owner.hold = 0; b.owner = null; }
    b.vx = b.vy = 0;
    const quem = Phaser.Utils.Array.GetRandom(this.players);
    TR.bubble(this, quem.spr, 'CHUVA! Corre pro barracão!', 1.8);
    // todo mundo corre pra porta do barracão (na calçada) e entra
    this.PORTA = { x: 358, y: 236 };
    this.players.concat(this.torcida.map((spr) => ({ spr, torcida: true, x: spr.x, y: spr.y, spd: 200 }))).forEach((p, i) => {
      p.coberta = { x: this.PORTA.x + ((i % 3) - 1) * 10, y: this.PORTA.y };
      p.dentro = false; p.moving = true;
      if (p.torcida) this.torcedoresCorrendo = (this.torcedoresCorrendo || []).concat([p]);
    });
    TR.chuva(this, 13, () => {});
    // se alguém demorar, entra mesmo assim
    this.time.delayedCall(3800, () => { if (this.state === 'chuva' && !this.dentroDoBarracao) this.entraNoBarracao(); });
  }

  // cada um corre até a porta; quando chega, some pra dentro
  correPraCoberta(dt) {
    const todos = this.players.concat(this.torcedoresCorrendo || []);
    todos.forEach((p) => {
      if (!p.coberta || p.dentro) return;
      const dx = p.coberta.x - p.x, dy = p.coberta.y - p.y, d = Math.hypot(dx, dy);
      if (d < 6) {
        p.dentro = true; p.moving = false; p.dir = 'up';
        this.tweens.add({ targets: p.spr, alpha: 0, y: p.spr.y - 8, duration: 220 });
        if (p.sh) p.sh.setVisible(false);
        return;
      }
      const v = Math.min(d, (p.spd || 200) * 1.25 * dt);
      p.x += dx / d * v; p.y += dy / d * v; p.moving = true; p.dir = TR.dirFrom(dx, dy, p.dir);
      if (p.torcida) { p.spr.setPosition(p.x, p.y).setDepth(p.y); TR.pose(p.spr, p.dir, true); }
    });
    if (!this.dentroDoBarracao && todos.every((p) => p.dentro)) this.entraNoBarracao();
  }

  // a câmera "entra" no barracão: tela de dentro, com a chuva lá fora e a goteira no balde
  entraNoBarracao() {
    if (this.dentroDoBarracao) return;
    this.dentroDoBarracao = true;
    const cam = this.cameras.main;
    cam.fadeOut(300, 10, 8, 14);
    cam.once('camerafadeoutcomplete', () => {
      const D = this.cache.json.get('barracao_dentro');
      const cont = this.add.container(0, 0).setDepth(7400).setScrollFactor(0);
      cont.add(this.add.image(0, 0, 'barracao_dentro').setOrigin(0));
      const chuvaG = this.add.graphics(); cont.add(chuvaG);
      const pingo = this.add.graphics(); cont.add(pingo);
      // a turma lá dentro: uns em pé, outros sentados no chão
      const ids = this.players.map((p) => p.id).concat(this.torcida.map((s) => s.texture.key));
      const dentro = ids.map((id, i) => {
        const [x, y] = D.lugares[i % D.lugares.length];
        const s = this.add.sprite(x, y, id, 0).setOrigin(0.5, 0.97);
        if (i % 3 === 1) s.setFrame(TR.Q.agachaFrente); else { s.play(id + '_idle'); s.anims.setProgress(Math.random()); }
        cont.add(s);
        return s;
      });
      dentro.sort((a, b) => a.y - b.y).forEach((s, k) => cont.moveTo(s, 3 + k));
      cam.fadeIn(350, 10, 8, 14);
      // chuva caindo nos vãos da janela e da porta
      const gotas = Array.from({ length: 60 }, () => ({ r: Math.random(), y: Math.random(), v: 0.9 + Math.random() * 0.6 }));
      let gotaY = D.goteira[1], respingo = 0;
      const anima = (t, dms) => {
        const dt = dms / 1000;
        chuvaG.clear().lineStyle(1, 0xbcd4ff, 0.7);
        [D.janela, D.porta].forEach(([x0, y0, x1, y1], q) => {
          gotas.forEach((g, i) => {
            if (i % 2 !== q) return;
            g.y = (g.y + g.v * dt * 1.4) % 1;
            const x = x0 + g.r * (x1 - x0), y = y0 + g.y * (y1 - y0);
            chuvaG.lineBetween(x, y, x - 2, Math.min(y1, y + 10));
          });
        });
        // goteira: a gota cai no balde e respinga
        gotaY += dt * 320;
        if (gotaY > D.balde[1] - 26) { gotaY = D.goteira[1]; respingo = 0.25; TR.sfx(this, 'bip', 0.08, 2.4); }
        respingo = Math.max(0, respingo - dt);
        pingo.clear().fillStyle(0xbcd4ff, 0.9).fillRect(D.goteira[0] - 1, gotaY, 3, 6);
        if (respingo > 0) pingo.fillRect(D.balde[0] - 8, D.balde[1] - 30, 2, 2).fillRect(D.balde[0] + 6, D.balde[1] - 31, 2, 2);
      };
      this.events.on('update', anima);
      // conversa enquanto a chuva não passa
      const falas = [['Ainda bem que tem o barracão!', 0], ['Molhou meu boné!', 'pedro'], ['Bora jogar adedonha enquanto isso?', 0],
        ['Olha a goteira kkkk', 'lucas'], ['Já já passa...', 'pernalonga']];
      falas.forEach(([f, id], k) => this.time.delayedCall(900 + k * 1700, () => {
        const i = typeof id === 'string' ? ids.indexOf(id) : -1;
        const s = dentro[i >= 0 ? i : (k * 3) % dentro.length];
        if (s && s.active) TR.bubble(this, s, f, 1.6);
      }));
      // passou: sai do barracão e volta pro jogo
      this.time.delayedCall(9500, () => {
        const q = Phaser.Utils.Array.GetRandom(dentro);
        TR.bubble(this, q, 'Parou! Bora voltar!', 1.4);
        this.time.delayedCall(1200, () => {
          cam.fadeOut(300, 10, 8, 14);
          cam.once('camerafadeoutcomplete', () => {
            this.events.off('update', anima);
            cont.destroy(true);
            this.dentroDoBarracao = false;
            this.players.forEach((p) => { p.coberta = null; p.dentro = false; p.spr.setAlpha(1); if (p.sh) p.sh.setVisible(true); });
            (this.torcedoresCorrendo || []).forEach((p, i) => { p.spr.setAlpha(1).setPosition(660 - i * 70, 258).setDepth(258); p.spr.play(p.spr.texture.key + '_idle'); });
            this.torcedoresCorrendo = [];
            this.kickoff(this.ball.last && this.ball.last.team === 0 ? 1 : 0);
            cam.fadeIn(350, 10, 8, 14);
            this.state = 'play';
            TR.sfx(this, 'apito', 0.4);
          });
        });
      });
    });
  }

  // ------------------------------------------------------------------ fim
  endGame() {
    if (this.state === 'end') return;
    this.state = 'end';
    const won = this.score[0] > this.score[1], draw = this.score[0] === this.score[1];
    TR.sfx(this, won ? 'vitoria' : 'derrota', 0.6);
    TR.endPanel(this, draw ? 'EMPATE!' : won ? 'VITÓRIA!' : 'PERDEU!', 'Time do ' + this.nomeTime[0] + ' ' + this.score[0] + ' x ' + this.score[1] + ' Time do ' + this.nomeTime[1],
      () => this.scene.restart());
  }

  flash(msg) {
    this.big.setText(msg).setVisible(true).setScale(0.3);
    this.tweens.add({ targets: this.big, scale: 1, duration: 300, ease: 'Back.Out' });
    this.time.delayedCall(1400, () => this.big.setVisible(false));
  }

  // ------------------------------------------------------------------ desenho
  render(time) {
    const b = this.ball;
    this.players.forEach((p) => {
      p.spr.setPosition(Math.round(p.x), Math.round(p.y)).setDepth(p.y);
      p.sh.setPosition(Math.round(p.x), Math.round(p.y)).setDepth(2);
      if (!p.moving) p.dir = TR.dirFrom(b.x - p.x, (b.y - p.y) * 0.5, p.dir);
      TR.pose(p.spr, p.dir, p.moving && this.state !== 'goal' && this.state !== 'end');
      p.spr.setTint(p.slow > 0 ? 0xaab8ff : (p.boost > 0 || p.drib ? 0xfff0b0 : 0xffffff));
      if (p.slow <= 0 && p.boost <= 0 && !p.drib) p.spr.clearTint();
    });
    this.ballShadow.setPosition(Math.round(b.x), Math.round(b.y)).setDepth(3).setScale(Math.max(0.5, 1 - b.z / 200));
    this.ballSpr.setPosition(Math.round(b.x), Math.round(b.y - 7 - b.z)).setDepth(b.y + 1);
    TR.giraBola(this.ballSpr, b, this, b.owner && b.owner.moving ? 0.35 : 0);
    const h = this.human;
    if (h) this.marker.setPosition(Math.round(h.x), Math.round(h.y) - 146).setAngle(180);
    if (h && b.owner === h && this.state === 'play') {
      const m = this.bestPass(h);
      this.passArrow.setVisible(!!m);
      if (m) this.passArrow.setPosition(Math.round(m.x), Math.round(m.y) - 146).setAngle(180);
    } else this.passArrow.setVisible(false);
    this.chargeBar.clear();
    if (h && this.charge > 0) {
      this.chargeBar.fillStyle(0x241a2c, 1).fillRect(h.x - 26, h.y + 8, 52, 9);
      this.chargeBar.fillStyle(this.charge > 0.8 ? 0xff5a3c : 0xffb13c, 1).fillRect(h.x - 24, h.y + 10, 48 * this.charge, 5);
    }
    const m = Math.max(0, Math.floor(this.timeLeft / 60)), s = Math.max(0, Math.floor(this.timeLeft % 60)).toString().padStart(2, '0');
    this.hud.setText(this.nomeTime[0] + '  ' + this.score[0] + ' x ' + this.score[1] + '  ' + this.nomeTime[1] + '     ' + m + ':' + s);
    if (h) {
      const cd = Math.max(0, h.habCd);
      this.habTxt.setText('E: ' + TR.KIDS[h.id].hab + (cd > 0 ? ' (' + Math.ceil(cd) + 's)' : ' PRONTA') + '   Z: drible' + (h.dribCd > 0 ? ' ..' : ' ok'));
      this.habBar.clear().fillStyle(0x0c0810, 0.8).fillRect(10, 508, 420, 28);
    }
  }

  dist(a, b) { return Math.hypot(a.x - b.x, (a.y - b.y) * 1.3); }
}
