// Seleção das brincadeiras: tokens em cima de círculos na rua + JBLs do Lucas e do Pedro na calçada.
class Rua extends Phaser.Scene {
  constructor() { super('Rua'); }

  create() {
    this._saindo = false;
    this.cameras.main.fadeIn(350, 18, 13, 24);
    this.add.image(0, 0, 'rua').setOrigin(0);

    this.items = [
      { key: 'futebol', cena: 'Futebol', nome: 'Futebol de rua', x: 170, y: 420, desc: 'Traves de chinelo, 3 contra 3. Quem fizer 2 gols ganha.' },
      { key: 'esconde', cena: 'EscondeEsconde', nome: 'Esconde-esconde', x: 330, y: 352, desc: 'O quarteirão inteiro. Esconda-se ou procure a turma.' },
      { key: 'queimada', cena: 'Queimada', nome: 'Queimada', x: 490, y: 430, desc: 'Queime o time do Lucas antes que ele queime o seu.' },
      { key: 'alerta', cena: 'Alerta', nome: 'Alerta', x: 650, y: 352, desc: 'Gritou seu nome? Pega a bola e grita ALERTA!' },
      { key: 'fim', cena: 'Final', nome: 'Fim de tarde', x: 810, y: 420, desc: 'A turma no meio-fio vendo o pôr do sol.' },
    ];
    this.items.forEach((it, i) => this.makeStation(it, i));

    // turma na calçada
    [['kaua', 90, 262], ['gabriel', 150, 266], ['cezar', 440, 260], ['daniel', 560, 262], ['pernalonga', 620, 258]].forEach(([id, x, y]) => {
      const s = TR.kid(this, id, x, y).setDepth(y);
      s.play(id + '_idle'); s.anims.setProgress(Math.random());
    });
    // JBLs na calçada, com o dono do lado
    this.jbls = {};
    this.makeJbl('lucas', 250, 262, 'JBL do Lucas', 338);
    this.makeJbl('pedro', 712, 262, 'JBL do Pedro', 800);
    this.notes = this.add.group();
    this.time.addEvent({ delay: 420, loop: true, callback: () => this.spawnNote() });

    this.dog = this.add.sprite(-60, 536, 'caramelo').setScale(2).setOrigin(0.5, 1).setDepth(536).play('caramelo_anda');

    // painel de informação
    const g = this.add.graphics().setDepth(4000);
    g.fillStyle(0x0c0810, 0.85).fillRect(0, 0, 960, 34);
    TR.txt(this, 16, 9, 'Escolha uma brincadeira:  ← →  e  Enter   |   clique numa JBL (ou na rádio lá em cima) pra tocar música', 1, 0xffe0b0).setDepth(4001);
    this.info = TR.panel(this, 480, 506, 600, 54, 4000);
    this.infoTitle = TR.txt(this, 196, 486, '', 1, 0xffd36a).setDepth(4001);
    this.infoDesc = TR.txt(this, 196, 506, '', 1, 0xf4e9d8).setDepth(4001);
    this.infoGo = TR.txt(this, 764, 494, 'Enter ▶', 1, 0xffd36a).setOrigin(1, 0).setDepth(4001);
    this.tweens.add({ targets: this.infoGo, alpha: 0.35, yoyo: true, repeat: -1, duration: 500 });

    this.sel = TR.lastHub || 0;
    this.select(this.sel, true);
    this.input.keyboard.on('keydown-LEFT', () => this.select((this.sel + 4) % 5));
    this.input.keyboard.on('keydown-RIGHT', () => this.select((this.sel + 1) % 5));
    this.input.keyboard.on('keydown-A', () => this.select((this.sel + 4) % 5));
    this.input.keyboard.on('keydown-D', () => this.select((this.sel + 1) % 5));
    this.input.keyboard.on('keydown-ENTER', () => this.start(this.sel));
    this.input.keyboard.on('keydown-SPACE', () => this.start(this.sel));
    TR.vhs(this, 0.5);
    Radio.on(this.radioChanged = () => this.refreshJbls());
    this.events.once('shutdown', () => Radio.off(this.radioChanged));
  }

  makeStation(it, i) {
    const ring = this.add.graphics().setDepth(it.y - 30);
    const glow = this.add.ellipse(it.x, it.y, 120, 40, 0xffd36a, 0.0).setDepth(it.y - 31);
    ring.lineStyle(4, 0x241a2c, 1).strokeEllipse(it.x, it.y, 104, 34);
    ring.lineStyle(2, 0xfff1d6, 1).strokeEllipse(it.x, it.y, 100, 30);
    const shadow = this.add.ellipse(it.x, it.y, 46, 12, 0x000000, 0.3).setDepth(it.y - 29);
    const tok = this.add.image(it.x, it.y - 56, 'token_' + it.key).setDepth(it.y + 200);
    this.tweens.add({ targets: tok, y: it.y - 66, yoyo: true, repeat: -1, duration: 900 + i * 70, ease: 'Sine.InOut' });
    const lbl = TR.txt(this, it.x, it.y + 26, it.nome, 1, 0xfff1d6).setOrigin(0.5, 0).setDepth(it.y + 200);
    const hit = this.add.zone(it.x, it.y - 40, 130, 130).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => this.select(i));
    hit.on('pointerdown', () => this.start(i));
    Object.assign(it, { ring, glow, tok, lbl });
  }

  select(i, silent) {
    this.sel = i;
    this.items.forEach((it, k) => {
      const on = k === i;
      it.glow.setFillStyle(0xffd36a, on ? 0.35 : 0);
      it.tok.setScale(on ? 1.5 : 1);
      it.lbl.setTint(on ? 0xffd36a : 0xfff1d6);
    });
    const it = this.items[i];
    this.infoTitle.setText(it.nome);
    this.infoDesc.setText(it.desc);
    if (!silent) TR.sfx(this, 'hover', 0.3);
  }

  start(i) {
    TR.lastHub = i;
    TR.sfx(this, 'selecionar', 0.5);
    const it = this.items[i];
    this.tweens.add({ targets: it.tok, scale: 2.2, duration: 200, yoyo: true });
    TR.go(this, it.cena);
  }

  makeJbl(id, x, y, label, ownerX) {
    const owner = TR.kid(this, id, ownerX, y + 2).setDepth(y + 2);
    owner.play(id + '_idle');
    const s = this.add.sprite(x, y, 'jbl_' + id, 0).setScale(1.4).setOrigin(0.5, 1).setDepth(y + 1)
      .setInteractive({ useHandCursor: true });
    const lbl = TR.txt(this, x, y - 94, label, 1, 0xffd36a).setOrigin(0.5).setDepth(3001);
    const tip = TR.txt(this, x, y - 76, 'clique pra tocar', 1, 0xfff1d6).setOrigin(0.5).setDepth(3001);
    const bg = this.add.graphics().setDepth(3000);
    bg.fillStyle(0x0c0810, 0.75).fillRect(x - 100, y - 106, 200, 40);
    bg.fillStyle(0x0c0810, 0.75).fillTriangle(x - 8, y - 66, x + 8, y - 66, x, y - 56);
    s.on('pointerover', () => s.setTint(0xffe9a8));
    s.on('pointerout', () => s.clearTint());
    s.on('pointerdown', () => {
      TR.sfx(this, 'clique', 0.4);
      if (Radio.mode === 'radio' && Radio.station === id && Radio.ready) Radio.toggle();
      else Radio.setStation(id);
      TR.bubble(this, owner, id === 'pedro' ? 'Solta o funk!' : 'Aumenta o som!', 1.6);
    });
    this.jbls[id] = { s, tip, x, y };
    this.refreshJbls();
  }

  refreshJbls() {
    if (!this.jbls) return;
    Object.entries(this.jbls).forEach(([id, j]) => {
      if (!j.s.active) return;
      const on = Radio.mode === 'radio' && Radio.station === id && Radio.playing;
      if (on) j.s.play('jbl_' + id + '_pulsa', true); else { j.s.stop(); j.s.setFrame(0); }
      j.tip.setText(on ? 'tocando ♪ (clique pausa)' : 'clique pra tocar');
    });
  }

  spawnNote() {
    Object.entries(this.jbls).forEach(([id, j]) => {
      if (!(Radio.mode === 'radio' && Radio.station === id && Radio.playing)) return;
      const n = TR.txt(this, j.x + Phaser.Math.Between(-20, 20), j.y - 40, Phaser.Utils.Array.GetRandom(['♪', '♫']), 2,
        id === 'pedro' ? 0x7ab8ff : 0xffb36a).setOrigin(0.5).setDepth(3001);
      this.tweens.add({ targets: n, y: n.y - 60, x: n.x + Phaser.Math.Between(-20, 20), alpha: 0, duration: 1400, onComplete: () => n.destroy() });
    });
  }

  update(t, d) {
    this.dog.x += 60 * d / 1000;
    if (this.dog.x > 1040) this.dog.x = -80;
  }
}
