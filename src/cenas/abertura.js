class Abertura extends Phaser.Scene {
  constructor() { super('Abertura'); }

  create() {
    this._saindo = false;
    this.cameras.main.fadeIn(600, 18, 13, 24);
    this.add.image(0, 0, 'rua_tarde').setOrigin(0);
    // nuvens andando
    this.clouds = [];
    for (let i = 0; i < 4; i++) {
      const g = this.add.graphics();
      const w = Phaser.Math.Between(70, 130);
      g.fillStyle(0xfff3e0, 0.75);
      for (let k = 0; k < 4; k++) g.fillEllipse(k * w / 4, -(k % 2) * 8, w * 0.5, w * 0.28);
      g.setPosition(Phaser.Math.Between(0, 960), Phaser.Math.Between(16, 70));
      g.speed = Phaser.Math.FloatBetween(6, 14);
      this.clouds.push(g);
    }
    // pássaros
    this.birds = this.add.graphics().setDepth(5);
    this.birdT = 0;
    // pipa com linha
    this.pipa = this.add.image(760, 70, 'pipa').setDepth(6);
    this.linha = this.add.graphics().setDepth(5);
    // turma na calçada e na rua
    this.kids = [];
    [['kaua', 120, 258], ['gabriel', 200, 262], ['daniel', 690, 258], ['pedro', 790, 262], ['lucas', 860, 258]].forEach(([id, x, y]) => {
      const s = TR.kid(this, id, x, y).setDepth(y);
      s.play(id + '_idle');
      s.anims.setProgress(Math.random());
      this.kids.push(s);
    });
    this.runner1 = TR.kid(this, 'cezar', -60, 420).setDepth(420);
    this.runner2 = TR.kid(this, 'pernalonga', -160, 440).setDepth(440);
    this.ball = this.add.image(-40, 418, 'bola').setScale(2).setDepth(421);
    this.runner1.play('cezar_run_right'); this.runner2.play('pernalonga_run_right');
    this.dog = this.add.sprite(-80, 530, 'caramelo').setScale(2).setOrigin(0.5, 1).setDepth(530).play('caramelo_anda');
    // degradê escuro embaixo para dar leitura
    const sh = this.add.graphics().setDepth(900);
    for (let i = 0; i < 30; i++) sh.fillStyle(0x120d18, i / 30 * 0.5).fillRect(0, 380 + i * 6, 960, 6);
    TR.vhs(this, 1);

    // estado 0: precisa de um clique para liberar o som do navegador
    this.hint = TR.txt(this, 480, 300, 'Clique ou aperte qualquer tecla', 2, 0xfff1d6).setOrigin(0.5).setDepth(9500);
    this.tweens.add({ targets: this.hint, alpha: 0.25, yoyo: true, repeat: -1, duration: 650 });
    this.stage = 0;
    this.input.on('pointerdown', () => this.advance());
    this.input.keyboard.on('keydown', () => this.advance());
  }

  advance() {
    if (this.stage === 0) { this.stage = 1; this.hint.destroy(); this.startIntro(); return; }
    if (this.stage === 1) { this.finishTyping(); return; }
    if (this.stage === 2) { TR.sfx(this, 'selecionar', 0.5); TR.go(this, 'Rua'); }
  }

  startIntro() {
    TR.sfx(this, 'abertura', 0.55);
    // balão animado no topo
    const msg = 'Em algum lugar de Itaberá, em 2019...';
    this.bText = TR.txt(this, 0, 0, '', 2, 0x241a2c).setOrigin(0.5);
    const full = TR.txt(this, 0, 0, msg, 2).setVisible(false);
    const w = full.width + 40, h = full.height + 26;
    full.destroy();
    const g = this.add.graphics();
    g.fillStyle(0x241a2c, 1).fillRoundedRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8, 14);
    g.fillStyle(0xfff8ec, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    g.fillStyle(0x241a2c, 1).fillTriangle(-24, h / 2 + 2, 6, h / 2 + 2, -30, h / 2 + 26);
    g.fillStyle(0xfff8ec, 1).fillTriangle(-20, h / 2 - 2, 2, h / 2 - 2, -26, h / 2 + 18);
    this.balloon = this.add.container(480, 66, [g, this.bText]).setDepth(9400).setScale(0);
    this.tweens.add({ targets: this.balloon, scale: 1, duration: 420, ease: 'Back.Out' });
    this.tweens.add({ targets: this.balloon, y: 60, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.InOut', delay: 500 });
    this.typed = 0;
    this.msg = msg;
    this.typer = this.time.addEvent({
      delay: 70, repeat: msg.length - 1, startAt: -400, callback: () => {
        this.typed++;
        this.bText.setText(msg.slice(0, this.typed));
        if (msg[this.typed - 1] !== ' ') TR.sfx(this, 'tecla', 0.25, Phaser.Math.FloatBetween(0.9, 1.15));
        if (this.typed >= msg.length) this.time.delayedCall(500, () => this.showLogo());
      },
    });
  }

  finishTyping() {
    if (this.typer) this.typer.remove();
    this.bText.setText(this.msg);
    this.showLogo();
  }

  showLogo() {
    if (this.stage >= 2) return;
    this.stage = 2;
    const logo = this.add.image(480, -160, 'logo').setScale(2).setDepth(9300);
    this.tweens.add({ targets: logo, y: 282, duration: 900, ease: 'Bounce.Out' });
    this.tweens.add({ targets: logo, angle: { from: -1.5, to: 1.5 }, yoyo: true, repeat: -1, duration: 2200, ease: 'Sine.InOut', delay: 900 });
    const sub = TR.txt(this, 480, 452, 'uma tarde de brincadeiras com a turma', 1, 0xffe0b0).setOrigin(0.5).setDepth(9500).setAlpha(0);
    const go = TR.txt(this, 480, 486, 'ENTER ou clique para jogar', 2, 0xffd36a).setOrigin(0.5).setDepth(9500).setAlpha(0);
    this.tweens.add({ targets: [sub, go], alpha: 1, delay: 900, duration: 500 });
    this.time.delayedCall(1500, () => this.tweens.add({ targets: go, alpha: 0.3, yoyo: true, repeat: -1, duration: 600 }));
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.clouds.forEach((c) => { c.x += c.speed * dt; if (c.x > 1020) c.x = -140; });
    // pipa balançando
    const px = 760 + Math.sin(time / 900) * 26, py = 74 + Math.sin(time / 600) * 10;
    this.pipa.setPosition(px, py).setAngle(Math.sin(time / 700) * 10);
    this.linha.clear().lineStyle(1, 0xfff1d6, 0.8).beginPath().moveTo(px, py + 20);
    this.linha.lineTo(px - 60, py + 140); this.linha.lineTo(830, 220); this.linha.strokePath();
    // pássaros
    this.birdT += dt;
    this.birds.clear().fillStyle(0x3a2030, 1);
    for (let i = 0; i < 3; i++) {
      const bx = ((this.birdT * 40 + i * 50) % 1100) - 60, by = 40 + i * 12 + Math.sin(this.birdT * 3 + i) * 4;
      const wing = Math.sin(this.birdT * 10 + i) > 0 ? -3 : 2;
      this.birds.fillRect(bx - 6, by + wing, 5, 2).fillRect(bx + 1, by + wing, 5, 2).fillRect(bx - 1, by, 2, 2);
    }
    // meninos correndo atrás da bola
    this.runner1.x += 210 * dt; this.runner2.x += 214 * dt;
    this.ball.x = this.runner1.x + 26; this.ball.y = 416 + Math.abs(Math.sin(time / 120)) * -4;
    this.ball.setAngle(time / 3);
    if (this.runner2.x > 1100) { this.runner1.x = -60; this.runner2.x = -170; }
    this.dog.x += 60 * dt;
    if (this.dog.x > 1040) this.dog.x = -80;
  }
}
