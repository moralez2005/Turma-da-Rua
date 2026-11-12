/*
 * Queimada 3 x 3. Seu time (Pernalonga, Cezar, Daniel) na esquerda; o do Lucas na direita.
 * Queimado vai para o cemitério atrás do time adversário e volta se queimar alguém de lá.
 * Setas andam · Espaço: segurar = carregar, soltar = arremessar (sem bola: tentar agarrar)
 * Mouse: clique arremessa no ponto · Q troca o alvo · E habilidade
 */
// Habilidades próprias da queimada (nada de habilidade de futebol aqui)
const QHAB = {
  pernalonga: { nome: 'Braço longo', desc: 'próximo arremesso sai mais forte e reto' },
  cezar: { nome: 'Ginga', desc: 'desvia de tudo por um instante' },
  daniel: { nome: 'Mira calculada', desc: 'a próxima bola persegue o alvo' },
  lucas: { nome: 'Zoeira', desc: 'zoa o time rival e deixa todo mundo lento' },
  pedro: { nome: 'Bomba do MC', desc: 'próximo arremesso é uma pedrada' },
  gabriel: { nome: 'Mão de goleiro', desc: 'agarra a próxima bola que vier' },
  kaua: { nome: 'Paredão', desc: 'agarra as próximas bolas que vierem' },
  matheus: { nome: 'Bike do nada', desc: 'some numa bike e foge rapidinho' },
  guilherme: { nome: 'Treta', desc: 'trava o time rival (o Pedro mais ainda)' },
  manu: { nome: 'Pequenininha', desc: 'a bola passa por cima dela por um tempo' },
};

class Queimada extends Phaser.Scene {
  constructor() { super('Queimada'); }

  create() {
    this._saindo = false;
    this.players = null;   // ao jogar de novo, a cena reaproveita o objeto: limpa o que sobrou da partida anterior
    this.cameras.main.fadeIn(300, 18, 13, 24);
    this.add.image(0, 0, 'rua').setOrigin(0);
    this.F = { x0: 24, x1: 936, y0: 296, y1: 496, mid: 480, cem: 64 };
    this.drawField();
    TR.backButton(this);
    TR.escolherTimes(this, 'queimada', {
      titulo: 'Queimada: monte os times',
      padrao: { azul: ['pernalonga', 'cezar', 'daniel'], vermelho: ['lucas', 'pedro', 'gabriel'] },
      opcoes: [
        { chave: 'tempo', rotulo: 'Tempo', tecla: 'T', padrao: 180, valores: [[120, '2 min'], [180, '3 min'], [300, '5 min'], [600, '10 min']] },
      ],
    }, (t) => this.montar(t));
  }

  montar(times) {
    this.state = 'intro';
    this.timeLeft = times.opcoes.tempo;
    const total = times.opcoes.tempo;
    TR.anoitecer(this, () => 1 - this.timeLeft / total, (t) => { const p = this.players.find((q) => q.alive); if (p) TR.bubble(this, p.spr, t, 1.8); }, [584, 70]);
    this.charge = 0;
    this.catchWin = 0;
    this.targetIdx = 0;

    const pos = [[[300, 360], [220, 440], [140, 380]], [[660, 360], [740, 440], [820, 380]]];
    const setup = [];
    [times.azul, times.vermelho].forEach((lista, team) => lista.forEach((id, i) => setup.push([id, team, pos[team][i][0], pos[team][i][1]])));
    this.nomeRival = TR.KIDS[times.vermelho[0]].nome;
    times.fora.forEach((id, i) => TR.kid(this, id, 560 + i * 70, 258).setDepth(258).play(id + '_idle'));
    this.players = setup.map(([id, team, x, y]) => {
      const spr = TR.kid(this, id, x, y);
      return {
        id, team, x, y, spr, sh: TR.shadow(this, x, y, 44).setStrokeStyle(2, team === 0 ? 0x5ab0ff : 0xff6a5a, 0.9), dir: team === 0 ? 'right' : 'left', moving: false,
        alive: true, spd: TR.KIDS[id].vel * 0.95, habCd: Phaser.Math.FloatBetween(3, 8), boost: 0, boostMul: 1,
        slow: 0, inv: 0, aim: false, hold: 0, wander: { x, y, t: 0 },
      };
    });
    this.human = this.players[0];
    this.ball = { x: 300, y: 380, z: 0, vx: 0, vy: 0, vz: 0, owner: null, thrower: null, live: false, homing: null };
    this.ballShadow = this.add.ellipse(0, 0, 20, 7, 0x000000, 0.35);
    this.ballSpr = this.add.image(0, 0, 'bola_queimada').setScale(2);

    const top = this.add.graphics().setDepth(6000);
    top.fillStyle(0x0c0810, 0.85).fillRect(300, 0, 360, 40);
    this.hud = TR.txt(this, 480, 12, '', 1, 0xfff1d6).setOrigin(0.5, 0).setDepth(6001);
    this.habBg = this.add.graphics().setDepth(6000);
    this.habBg.fillStyle(0x0c0810, 0.8).fillRect(10, 508, 380, 28);
    this.habTxt = TR.txt(this, 16, 514, '', 1, 0xffd36a).setDepth(6001);
    this.marker = this.add.triangle(0, 0, 0, 0, 20, 0, 10, 13, 0xffe066).setStrokeStyle(2, 0x241a2c).setDepth(6000);
    this.targetRing = this.add.ellipse(0, 0, 60, 18).setStrokeStyle(3, 0xff5a3c).setDepth(4).setVisible(false);
    this.chargeBar = this.add.graphics().setDepth(6000);
    this.big = TR.txt(this, 480, 200, '', 4, 0xffd36a).setOrigin(0.5).setDepth(6500).setVisible(false);
    TR.jblHud(this, { lucas: [120, 284], pedro: [840, 284] });

    this.keys = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D,SPACE,E,Q');
    this.input.keyboard.on('keydown-SPACE', () => this.spaceDown());
    this.input.keyboard.on('keyup-SPACE', () => this.spaceUp());
    this.input.keyboard.on('keydown-Q', () => { this.targetIdx++; TR.sfx(this, 'hover', 0.3); });
    this.input.keyboard.on('keydown-E', () => this.ability(this.human));
    this.input.on('pointerdown', (ptr) => {
      if (this.state !== 'play' || ptr.y < 290) return;
      const h = this.human;
      if (h && this.ball.owner === h) this.throwAt(h, ptr.worldX, ptr.worldY, 0.5);
    });

    this.give(this.human);
    TR.instructions(this, 'Queimada', [
      'Setas ou WASD ...... andar (só na sua metade)',
      'Espaço (segurar) ... carrega o arremesso; soltar = joga',
      'Mouse .............. clique onde quer arremessar',
      'Q .................. trocar o alvo (círculo vermelho)',
      'Espaço sem bola .... agarrar a bola na hora que ela chega',
      'E .................. habilidade (' + TR.KIDS[this.human.id].nome + ': ' + QHAB[this.human.id].nome + ')',
      'Queimado vai pro cemitério e volta se queimar alguém!',
    ], () => { this.state = 'play'; TR.sfx(this, 'apito', 0.5); });
    TR.chatter(this, (id) => { const p = this.players.find((q) => q.id === id); return p ? p.spr : null; }, { can: () => this.state === 'play', first: 7000 });
  }

  drawField() {
    const F = this.F, g = this.add.graphics().setDepth(1);
    g.fillStyle(0xffffff, 0.5).fillRect(F.mid - 2, F.y0, 4, F.y1 - F.y0);
    g.fillStyle(0xffffff, 0.3).fillRect(F.x0 + F.cem, F.y0, 2, F.y1 - F.y0).fillRect(F.x1 - F.cem, F.y0, 2, F.y1 - F.y0);
    g.fillStyle(0x000000, 0.12).fillRect(F.x0, F.y0, F.cem, F.y1 - F.y0).fillRect(F.x1 - F.cem, F.y0, F.cem, F.y1 - F.y0);
    TR.txt(this, F.x0 + F.cem / 2, F.y1 - 4, 'cemitério', 1, 0xfff1d6).setOrigin(0.5, 1).setAlpha(0.6).setDepth(2).setAngle(-90).setPosition(F.x0 + 32, 400);
    TR.txt(this, F.x1 - 32, 400, 'cemitério', 1, 0xfff1d6).setOrigin(0.5).setAlpha(0.6).setDepth(2).setAngle(90);
  }

  // área onde cada jogador pode andar
  zone(p) {
    const F = this.F;
    if (p.alive) return p.team === 0 ? [F.x0 + F.cem + 14, F.mid - 18] : [F.mid + 18, F.x1 - F.cem - 14];
    return p.team === 0 ? [F.x1 - F.cem + 6, F.x1 - 6] : [F.x0 + 6, F.x0 + F.cem - 6];
  }

  enemiesOf(p) { return this.players.filter((q) => q.team !== p.team && q.alive); }

  // ------------------------------------------------------------ loop
  update(time, delta) {
    if (!this.players) return;   // ainda escolhendo os times
    const dt = Math.min(delta, 50) / 1000;
    if (this.state === 'play') {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) return this.endGame();
      this.catchWin = Math.max(0, this.catchWin - dt);
      this.players.forEach((p) => {
        p.habCd -= dt; if (p.luva > 0) p.luva -= dt; p.boost = Math.max(0, p.boost - dt); p.slow = Math.max(0, p.slow - dt); p.inv = Math.max(0, p.inv - dt);
        if (p.boost <= 0) p.boostMul = 1;
      });
      this.fixHuman();
      this.humanInput(dt);
      this.players.forEach((p) => { if (p !== this.human) this.ai(p, dt); });
      this.separate();
      this.updateBall(dt);
    }
    this.render();
  }

  fixHuman() {
    const b = this.ball;
    if (b.owner && b.owner.team === 0) { this.human = b.owner; return; }
    if (!this.human || (!this.human.alive && !(b.owner === this.human))) {
      this.human = this.players.find((p) => p.team === 0 && p.alive) || this.players.find((p) => p.team === 0);
    }
  }

  speed(p) { return p.spd * p.boostMul * (p.slow > 0 ? 0.55 : 1) * (this.ball.owner === p ? 0.8 : 1); }

  humanInput(dt) {
    const p = this.human, k = this.keys;
    if (!p) return;
    const mx = (k.RIGHT.isDown || k.D.isDown ? 1 : 0) - (k.LEFT.isDown || k.A.isDown ? 1 : 0);
    const my = (k.DOWN.isDown || k.S.isDown ? 1 : 0) - (k.UP.isDown || k.W.isDown ? 1 : 0);
    this.move(p, mx, my, this.speed(p), dt);
    if (k.SPACE.isDown && this.ball.owner === p) this.charge = Math.min(1, this.charge + dt * 1.4);
  }

  spaceDown() {
    if (this.state !== 'play') return;
    if (this.ball.owner !== this.human) { this.catchWin = 0.3; this.human.aim = true; }
  }

  spaceUp() {
    if (this.state !== 'play') return;
    const h = this.human;
    if (h && this.ball.owner === h) {
      const t = this.currentTarget(h);
      if (t) this.throwAt(h, t.x, t.y - 40, this.charge);
    }
    this.charge = 0;
  }

  currentTarget(p) {
    const en = this.enemiesOf(p);
    if (!en.length) return null;
    en.sort((a, b) => a.y - b.y);
    return en[this.targetIdx % en.length];
  }

  ability(p) {
    if (this.state !== 'play' || !p || p.habCd > 0) return;
    p.habCd = 8;
    TR.sfx(this, 'habilidade', 0.5);
    if (p.id === 'pernalonga') { p.longo = true; }
    else if (p.id === 'cezar') { p.boost = 0.45; p.boostMul = 1.8; p.inv = 0.9; }
    else if (p.id === 'daniel') { p.sure = true; }
    else if (p.id === 'lucas') { this.enemiesOf(p).forEach((q) => { q.slow = 2.2; }); TR.bubble(this, p.spr, 'kkkkk Dona Juliete!', 1.4); return; }
    else if (p.id === 'pedro') { p.bomb = true; }
    else if (p.id === 'gabriel' || p.id === 'kaua') { p.luva = 4; }
    else if (p.id === 'matheus') { p.boost = 1.2; p.boostMul = 2; TR.bike(this, p.spr, 1.2); }
    else if (p.id === 'manu') { p.inv = 1.8; }
    else if (p.id === 'guilherme') { this.enemiesOf(p).forEach((q) => { q.slow = q.id === 'pedro' ? 3.5 : 1.6; }); }
    TR.bubble(this, p.spr, QHAB[p.id].nome + '!', 1.1);
  }

  // ------------------------------------------------------------ IA
  ai(p, dt) {
    const b = this.ball;
    if (b.owner === p) {
      p.hold += dt;
      const en = this.enemiesOf(p);
      if (p.hold > 0.9 && en.length) {
        if ((p.id === 'pedro' || p.id === 'daniel') && p.habCd <= 0) this.ability(p);
        const t = en.reduce((a, q) => (Math.abs(q.x - p.x) < Math.abs(a.x - p.x) ? q : a), en[0]);
        this.throwAt(p, t.x + Phaser.Math.Between(-30, 30), t.y - 40 + Phaser.Math.Between(-20, 20), Math.random() * 0.7);
      } else this.move(p, 0, 0, 0, dt);
      return;
    }
    let tx = p.wander.x, ty = p.wander.y, spd = this.speed(p);
    // bola parada perto: vai buscar
    const zoneHasBall = this.ballZoneTeam() === p.team && this.ballIsFree() && (p.alive || this.ballInCemeteryOf(p));
    if (zoneHasBall && this.closestCollector(p.team) === p) { tx = b.x; ty = b.y; }
    else if (b.live && b.thrower && b.thrower.team !== p.team && p.alive) {
      // desviar da bola que vem
      const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy);
      if (d < 260) { tx = p.x + (dy > 0 ? 0 : 0); ty = p.y + (p.y < 396 ? 90 : -90); spd *= 1.1; if (p.id === 'cezar' && p.habCd <= 0 && d < 150) this.ability(p); }
    } else {
      p.wander.t -= dt;
      if (p.wander.t <= 0) {
        const [a, c] = this.zone(p);
        p.wander = { x: Phaser.Math.Between(a, c), y: Phaser.Math.Between(this.F.y0 + 10, this.F.y1 - 10), t: Phaser.Math.FloatBetween(1, 2.5) };
      }
      if (p.id === 'lucas' && p.habCd <= 0 && Math.random() < 0.004) this.ability(p);
    }
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
    if (d > 8) this.move(p, dx / d, dy / d, spd * 0.9, dt); else this.move(p, 0, 0, 0, dt);
  }

  ballIsFree() { const b = this.ball; return !b.owner && !b.live; }
  ballZoneTeam() {
    const F = this.F, x = this.ball.x;
    if (x < F.x0 + F.cem) return 1;                 // cemitério do time 1 (atrás do time 0)
    if (x > F.x1 - F.cem) return 0;                 // cemitério do time 0
    return x < F.mid ? 0 : 1;
  }
  ballInCemeteryOf(p) {
    const F = this.F, x = this.ball.x;
    return p.team === 0 ? x > F.x1 - F.cem : x < F.x0 + F.cem;
  }
  closestCollector(team) {
    const b = this.ball;
    const inCem = team === 0 ? b.x > this.F.x1 - this.F.cem : b.x < this.F.x0 + this.F.cem;
    const cands = this.players.filter((p) => p.team === team && (inCem ? !p.alive : p.alive));
    if (!cands.length) return null;
    return cands.reduce((a, q) => (this.dist(q, b) < this.dist(a, b) ? q : a), cands[0]);
  }

  move(p, mx, my, spd, dt) {
    const len = Math.hypot(mx, my);
    if (len > 0) {
      mx /= len; my /= len;
      p.x += mx * spd * dt; p.y += my * spd * dt;
      p.dir = TR.dirFrom(mx, my, p.dir); p.moving = true;
    } else p.moving = false;
    const [a, c] = this.zone(p);
    p.x = Phaser.Math.Clamp(p.x, a, c);
    p.y = Phaser.Math.Clamp(p.y, this.F.y0, this.F.y1);
  }

  separate() {
    const ps = this.players;
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
      const a = ps[i], b = ps[j];
      if (a.alive !== b.alive || a.team !== b.team) continue;
      const dx = b.x - a.x, dy = (b.y - a.y) * 1.7, d = Math.hypot(dx, dy);
      if (d > 0 && d < 40) { const k = (40 - d) / 2; a.x -= dx / d * k; b.x += dx / d * k; a.y -= dy / d * k * 0.5; b.y += dy / d * k * 0.5; }
    }
    ps.forEach((p) => { const [a, c] = this.zone(p); p.x = Phaser.Math.Clamp(p.x, a, c); p.y = Phaser.Math.Clamp(p.y, this.F.y0, this.F.y1); });
  }

  // ------------------------------------------------------------ bola
  give(p) {
    const b = this.ball;
    Object.assign(b, { owner: p, live: false, vx: 0, vy: 0, vz: 0, z: 0, homing: null });
    p.hold = 0;
    TR.sfx(this, 'pegar', 0.35);
  }

  throwAt(p, tx, ty, charge) {
    const b = this.ball;
    let sp = 520 + charge * 380;
    if (p.longo) { sp *= 1.25; p.longo = false; TR.bubble(this, p.spr, 'Toma!', 0.8); }
    if (p.bomb) { sp *= 1.4; p.bomb = false; this.cameras.main.shake(150, 0.005); TR.bubble(this, p.spr, 'BOMBA!', 1); }
    const sx = p.x, sy = p.y - 50;
    const dx = tx - sx, dy = (ty + 40) - p.y, d = Math.hypot(dx, dy) || 1;
    Object.assign(b, { owner: null, live: true, thrower: p, x: sx, y: p.y, z: 50, vx: dx / d * sp, vy: dy / d * sp, vz: 60 + d * 0.05 });
    if (p.sure) { const en = this.enemiesOf(p); b.homing = en.length ? this.currentTarget(p) : null; p.sure = false; }
    p.dir = TR.dirFrom(dx, dy, p.dir);
    TR.sfx(this, 'arremesso', 0.55);
  }

  updateBall(dt) {
    const b = this.ball, F = this.F;
    if (b.owner) {
      const o = b.owner;
      b.x = o.x + (o.dir === 'left' ? -20 : o.dir === 'right' ? 20 : 0); b.y = o.y + 2; b.z = 46;
      return;
    }
    if (b.homing && b.homing.alive) {
      const dx = b.homing.x - b.x, dy = b.homing.y - b.y, d = Math.hypot(dx, dy) || 1, sp = Math.hypot(b.vx, b.vy);
      b.vx += (dx / d * sp - b.vx) * Math.min(1, dt * 4); b.vy += (dy / d * sp - b.vy) * Math.min(1, dt * 4);
    }
    b.x += b.vx * dt; b.y += b.vy * dt;
    b.vz -= 700 * dt; b.z += b.vz * dt;
    if (b.z <= 0) {
      b.z = 0;
      if (b.vz < -80) { b.vz = -b.vz * 0.45; TR.sfx(this, 'quique', 0.3); } else b.vz = 0;
      if (b.live) { b.live = false; b.homing = null; }
    }
    const fr = Math.pow(b.z > 0 ? 0.92 : 0.25, dt);
    b.vx *= fr; b.vy *= fr;
    if (b.x < F.x0) { b.x = F.x0; b.vx = Math.abs(b.vx) * 0.4; b.live = false; }
    if (b.x > F.x1) { b.x = F.x1; b.vx = -Math.abs(b.vx) * 0.4; b.live = false; }
    if (b.y < F.y0) { b.y = F.y0; b.vy = Math.abs(b.vy) * 0.5; }
    if (b.y > F.y1) { b.y = F.y1; b.vy = -Math.abs(b.vy) * 0.5; }

    if (b.live) {
      for (const p of this.players) {
        if (!p.alive || p.team === b.thrower.team || p.inv > 0) continue;
        if (this.dist(p, b) < 28 && b.z < 110) {
          let tries = p === this.human ? (this.catchWin > 0 ? 0.85 : 0) : (p.id === 'gabriel' ? 0.35 : 0.2);
          if (p.luva > 0) { tries = 1; p.luva = 0; }
          if (Math.random() < tries) {
            this.give(p);
            TR.bubble(this, p.spr, 'PEGUEI!', 1);
            TR.sfx(this, 'pegar', 0.6);
            return;
          }
          this.burn(p, b.thrower);
          b.live = false; b.homing = null;
          b.vx *= -0.25; b.vy *= -0.25; b.vz = 140;
          return;
        }
      }
    }
    if (!b.live && Math.hypot(b.vx, b.vy) < 120 && b.z < 30) {
      // recolher a bola; se parou num cemitério vazio, ela rola de volta pro campo
      let c = this.closestCollector(this.ballZoneTeam());
      if (!c) {
        if (b.x < F.x0 + F.cem) b.x = F.x0 + F.cem + 26;
        else if (b.x > F.x1 - F.cem) b.x = F.x1 - F.cem - 26;
        c = this.closestCollector(this.ballZoneTeam());
      }
      if (c && this.dist(c, b) < 30) this.give(c);
    }
  }

  burn(p, thrower) {
    TR.sfx(this, 'queimado', 0.6);
    p.alive = false;
    p.spr.setTint(0xff7a7a);
    this.time.delayedCall(300, () => p.spr.clearTint());
    TR.bubble(this, p.spr, p.team === 0 ? 'Aaah, queimei!' : 'QUEIMOU!', 1.2);
    this.flash('QUEIMADO!', p.team === 0 ? 0xff7a7a : 0x9cff9c);
    // quem estava no cemitério e queimou alguém volta para o campo
    if (thrower && !thrower.alive) {
      thrower.alive = true;
      TR.bubble(this, thrower.spr, 'Voltei!', 1.2);
      TR.sfx(this, 'salvou', 0.5);
      const [a, c] = this.zone(thrower);
      thrower.x = (a + c) / 2;
    }
    const [a, c] = this.zone(p);
    p.x = Phaser.Math.Clamp(p.x, a, c) || (a + c) / 2;
    p.x = (a + c) / 2;
    const left0 = this.players.filter((q) => q.team === 0 && q.alive).length;
    const left1 = this.players.filter((q) => q.team === 1 && q.alive).length;
    if (!left0 || !left1) this.time.delayedCall(700, () => this.endGame());
  }

  endGame() {
    if (this.state === 'end') return;
    this.state = 'end';
    const a = this.players.filter((q) => q.team === 0 && q.alive).length;
    const b = this.players.filter((q) => q.team === 1 && q.alive).length;
    const won = a > b, draw = a === b;
    TR.sfx(this, won ? 'vitoria' : 'derrota', 0.6);
    TR.endPanel(this, draw ? 'EMPATE!' : won ? 'VITÓRIA!' : 'PERDEU!', 'Vivos: ' + a + ' x ' + b, () => this.scene.restart());
  }

  flash(msg, color) {
    this.big.setText(msg).setTint(color || 0xffd36a).setVisible(true).setScale(0.3);
    this.tweens.add({ targets: this.big, scale: 1, duration: 250, ease: 'Back.Out' });
    this.time.delayedCall(900, () => this.big.setVisible(false));
  }

  render() {
    this.players.forEach((p) => {
      p.spr.setPosition(Math.round(p.x), Math.round(p.y)).setDepth(p.y);
      p.sh.setPosition(Math.round(p.x), Math.round(p.y)).setDepth(2);
      p.spr.setAlpha(p.alive ? 1 : 0.75);
      if (this.ball.owner === p && !p.moving) p.dir = p.team === 0 ? (p.alive ? 'right' : 'left') : (p.alive ? 'left' : 'right');
      TR.pose(p.spr, p.dir, p.moving && this.state === 'play');
    });
    const b = this.ball;
    this.ballShadow.setPosition(Math.round(b.x), Math.round(b.y)).setDepth(3).setScale(Math.max(0.4, 1 - b.z / 260));
    this.ballSpr.setPosition(Math.round(b.x), Math.round(b.y - 8 - b.z)).setDepth(b.y + 2);
    this.ballSpr.rotation += Math.hypot(b.vx, b.vy) * 0.0005;
    const h = this.human;
    if (h) this.marker.setPosition(Math.round(h.x), Math.round(h.y) - 146).setAngle(180);
    const t = h && b.owner === h ? this.currentTarget(h) : null;
    this.targetRing.setVisible(!!t && this.state === 'play');
    if (t) this.targetRing.setPosition(t.x, t.y);
    this.chargeBar.clear();
    if (h && this.charge > 0) {
      this.chargeBar.fillStyle(0x241a2c, 1).fillRect(h.x - 26, h.y + 8, 52, 9);
      this.chargeBar.fillStyle(this.charge > 0.8 ? 0xff5a3c : 0xffb13c, 1).fillRect(h.x - 24, h.y + 10, 48 * this.charge, 5);
    }
    const a = this.players.filter((q) => q.team === 0 && q.alive).length, c = this.players.filter((q) => q.team === 1 && q.alive).length;
    const m = Math.max(0, Math.floor(this.timeLeft / 60)), s = Math.max(0, Math.floor(this.timeLeft % 60)).toString().padStart(2, '0');
    this.hud.setText('Seu time  ' + a + ' x ' + c + '  Time do ' + this.nomeRival + '    ' + m + ':' + s);
    if (h) this.habTxt.setText('E: ' + QHAB[h.id].nome + (h.habCd > 0 ? '  (' + Math.ceil(h.habCd) + 's)' : '  PRONTA') + (h.alive ? '' : '  [cemitério]'));
  }

  dist(a, b) { return Math.hypot(a.x - b.x, (a.y - b.y) * 1.3); }
}
