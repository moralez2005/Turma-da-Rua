// Fim de tarde: a turma no meio-fio, pôr do sol, close, frase do Sheik e créditos.
class Final extends Phaser.Scene {
  constructor() { super('Final'); }

  create() {
    this._saindo = false;
    const cam = this.cameras.main;
    cam.setBounds(0, 0, 960, 540);
    cam.fadeIn(1200, 18, 13, 24);
    this.add.image(0, 0, 'final_fundo').setOrigin(0).setScale(2);
    // brilho do sol
    this.glow = this.add.circle(600, 352, 70, 0xffd890, 0.18).setDepth(1);
    this.tweens.add({ targets: this.glow, radius: 84, alpha: 0.08, yoyo: true, repeat: -1, duration: 1600, ease: 'Sine.InOut' });
    this.birds = this.add.graphics().setDepth(2);
    this.bt = 0;

    // espaçados pra caber todo mundo inteiro na tela (ninguém cortado nas bordas)
    const L = [['cezar', 70, 258], ['kaua', 126, 258], ['pedro', 183, 258], ['pernalonga', 240, 236],
      ['lucas', 297, 258], ['daniel', 354, 258], ['gabriel', 410, 258]];
    this.kids = {};
    L.sort((a, b) => a[2] - b[2]).forEach(([id, x, y], i) => {
      const s = this.add.sprite(x * 2, y * 2, 'final_' + id, 0).setOrigin(0.5, 132 / 136).setScale(2).setDepth(10 + y);
      this.tweens.add({ targets: s, scaleY: 2.03, yoyo: true, repeat: -1, duration: 1300 + i * 90, ease: 'Sine.InOut', delay: i * 150 });
      this.time.addEvent({ delay: Phaser.Math.Between(2200, 3800), loop: true, callback: () => {
        if (s.frame.name === 2) return;
        s.setFrame(1); this.time.delayedCall(140, () => s.setFrame(0));
      } });
      this.kids[id] = s;
    });

    TR.musicaFundo.tocar(this, 'm_fim', { loop: false, volume: 1.3 });
    Radio.playFinal();
    this.hint = TR.txt(this, 16, 14, '♪ Até amanhã, turma · ou aperte o play no vídeo ao lado', 1, 0xffe0b0).setDepth(9000).setScrollFactor(0);
    this.tweens.add({ targets: this.hint, alpha: 0.4, yoyo: true, repeat: 6, duration: 700, onComplete: () => this.hint.setAlpha(0.8) });
    const back = TR.button(this, 880, 22, 'Voltar (Esc)', () => this.leave(), { fixed: true, depth: 9500 });
    this.input.keyboard.on('keydown-ESC', () => this.leave());

    // close devagar na turma
    this.time.delayedCall(1800, () => {
      cam.pan(480, 300, 2600, 'Sine.easeInOut');
      cam.zoomTo(1.05, 2600, 'Sine.easeInOut');
    });
    // conversa
    const falas = [
      ['lucas', 'Amanhã tem revanche, hein, Dona Juliete!'], ['pedro', 'Vocês só ganharam porque eu deixei'],
      ['pedro', 'Quando eu for MC, venho buscar vocês de foguetão'], ['daniel', 'Bora jogar Brawl de noite?'],
      ['cezar', 'Bora tocar a campainha da vizinha e correr?'], ['kaua', 'De boa... olha esse pôr do sol'],
      ['gabriel', 'Passa o refri, Pernalonga!'], ['pernalonga', 'Calma, gente... que dia bom.'],
    ];
    falas.forEach(([id, f], i) => this.time.delayedCall(4800 + i * 2600, () => this.talk(id, f)));
    this.time.delayedCall(4800 + falas.length * 2600 + 1500, () => this.quote());
  }

  talk(id, f) {
    const s = this.kids[id];
    TR.bubble(this, { x: s.x, y: s.y }, f, 2.3, { offY: id === 'pernalonga' ? 262 : 222 });
    let n = 0;
    const ev = this.time.addEvent({ delay: 160, repeat: 9, callback: () => { s.setFrame(n++ % 2 ? 2 : 0); } });
    this.time.delayedCall(1800, () => s.setFrame(0));
  }

  quote() {
    const cam = this.cameras.main;
    this.tweens.add({ targets: this.hint, alpha: 0, duration: 800 });
    cam.zoomTo(1, 2000, 'Sine.easeInOut');
    cam.pan(480, 270, 2000, 'Sine.easeInOut');
    const shade = this.add.rectangle(480, 270, 960, 540, 0x0c0810, 0).setDepth(8000).setScrollFactor(0);
    this.tweens.add({ targets: shade, fillAlpha: 0.62, duration: 2000 });
    const lines = ['Algo que não muda com o tempo', 'é a memória dos dias', 'de juventude.'];
    const objs = this.quoteObjs = lines.map((l, i) => TR.txt(this, 480, 150 + i * 44, '', 2, 0xfff1d6).setOrigin(0.5).setDepth(8001).setScrollFactor(0));
    let li = 0, ci = 0;
    this.time.delayedCall(2200, () => {
      this.time.addEvent({ delay: 60, loop: true, callback: (ev) => {
        if (li >= lines.length) return;
        ci++;
        objs[li].setText(lines[li].slice(0, ci));
        if (lines[li][ci - 1] !== ' ') TR.sfx(this, 'tecla', 0.18);
        if (ci >= lines[li].length) { li++; ci = 0; }
        if (li >= lines.length && !this.credited) {
          this.credited = true;
          const c = this.sheik = TR.txt(this, 480, 300, 'Sheik — The Legend of Zelda: Ocarina of Time', 1, 0xf2b13c).setOrigin(0.5).setDepth(8001).setScrollFactor(0).setAlpha(0);
          this.tweens.add({ targets: c, alpha: 1, duration: 900 });
          this.time.delayedCall(2500, () => this.credits());
        }
      } });
    });
  }

  credits() {
    const lines = [
      'A TURMA DA RUA', '', 'Itaberá, 2019', '',
      'Pernalonga · Cezar · Kauã Henrique · Pedro', 'Lucas · Daniel · Gabriel', '',
      'Músicas: tocadas pelo player oficial do YouTube.', 'Todos os direitos reservados aos autores.', '',
      'Feito com Phaser 3, IBM Bob e Claude', 'Inspirado em Zueirama', '', 'Obrigado por jogar!',
    ];
    this.tweens.add({ targets: this.quoteObjs.concat([this.sheik]), alpha: 0, duration: 900 });
    const c = this.add.container(480, 600).setDepth(8100).setScrollFactor(0);
    lines.forEach((l, i) => c.add(TR.txt(this, 0, i * 30, l, i === 0 ? 2 : 1, i === 0 ? 0xffd36a : 0xfff1d6).setOrigin(0.5)));
    this.tweens.add({ targets: c, y: -lines.length * 30 - 40, duration: 7000, onComplete: () => this.homenagem() });
  }

  // Homenagem: a foto do aniversário de 14 anos, tipo polaroid, com uma frase embaixo
  homenagem() {
    const dark = this.add.rectangle(480, 270, 960, 540, 0x0c0810, 0).setDepth(8150).setScrollFactor(0);
    this.tweens.add({ targets: dark, fillAlpha: 0.6, duration: 1200 });
    const faixa = this.add.rectangle(480, 430, 640, 58, 0x0c0810, 0.7).setDepth(8190).setScrollFactor(0).setAlpha(0);
    this.tweens.add({ targets: faixa, alpha: 1, duration: 1000, delay: 2000 });
    const ttl = TR.txt(this, 480, 34, 'Aos tempos dourados', 2, 0xffd36a).setOrigin(0.5).setDepth(8200).setScrollFactor(0).setAlpha(0);
    // a foto usa filtro suave (o resto do jogo é pixel art) e fica reta, sem girar, pra não serrilhar
    this.textures.get('turma14').setFilter(Phaser.Textures.FilterMode.LINEAR);
    const foto = this.add.image(480, 232, 'turma14').setDepth(8200).setScrollFactor(0).setAlpha(0).setScale(0.5);
    const f1 = TR.txt(this, 480, 418, 'O tempo passou, a rua mudou, cada um seguiu seu caminho...', 1, 0xfff1d6).setOrigin(0.5).setDepth(8200).setScrollFactor(0).setAlpha(0);
    const f2 = TR.txt(this, 480, 442, '...mas aquela tarde continua com a gente.', 1, 0xfff1d6).setOrigin(0.5).setDepth(8200).setScrollFactor(0).setAlpha(0);
    this.tweens.add({ targets: ttl, alpha: 1, duration: 1000 });
    this.tweens.add({ targets: foto, alpha: 1, duration: 1600, ease: 'Sine.Out', delay: 400 });
    this.tweens.add({ targets: f1, alpha: 1, duration: 1200, delay: 2200 });
    this.tweens.add({ targets: f2, alpha: 1, duration: 1200, delay: 3600 });
    this.time.delayedCall(5200, () => TR.button(this, 480, 496, 'Voltar pra rua', () => this.leave(), { fixed: true, depth: 9000 }));
  }

  leave() {
    Radio.leaveFinal();
    TR.go(this, 'Rua');
  }

  update(t, d) {
    this.bt += d / 1000;
    const g = this.birds.clear().fillStyle(0x5a2a40, 1);
    for (let i = 0; i < 4; i++) {
      const x = ((this.bt * 34 + i * 70) % 1100) - 60, y = 110 + i * 16 + Math.sin(this.bt * 2 + i) * 6;
      const w = Math.sin(this.bt * 9 + i) > 0 ? -4 : 3;
      g.fillRect(x - 8, y + w, 7, 2).fillRect(x + 1, y + w, 7, 2).fillRect(x - 1, y, 2, 2);
    }
  }
}
