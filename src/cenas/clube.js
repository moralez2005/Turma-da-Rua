/*
 * O Barracão: o clube (esconderijo) da turma.
 * Setas/WASD andam · E usa a coisa mais perto (videogame, puff, gibis, sofá, JBL, mural, porta) · Esc sai.
 * Por enquanto tem acesso livre; depois vai ser liberado conforme o modo história avança.
 */
class Clube extends Phaser.Scene {
  constructor() { super('Clube'); }

  create() {
    this._saindo = false;
    this.painel = null; this.sentado = null;
    this.cameras.main.fadeIn(350, 18, 13, 24);
    TR.musicaFundo.tocar(this, TR.clubeMusica || 'm_rua');
    this.D = this.cache.json.get('barracao_clube');
    this.add.image(0, 0, 'barracao_clube').setOrigin(0).setDepth(-10);
    this.coisas = this.D.coisas;

    // pisca-pisca piscando, TV ligada no videogame e troféus na prateleira
    this.brilho = this.add.graphics().setDepth(5).setBlendMode(Phaser.BlendModes.ADD);
    this.tv = this.add.graphics().setDepth(6);
    this.trofeus = this.add.graphics().setDepth(7);
    this.desenhaTrofeus();
    this.jbl = this.add.sprite(566, 334, 'jbl_lucas', 0).setScale(1.2).setOrigin(0.5, 1).setDepth(334);

    // a turma no clube: uns sentados, outros de pé conversando
    this.turma = {};
    const poe = (id, x, y, quadro) => {
      if (TR.bloqueado(id)) return null;
      const s = TR.kid(this, id, x, y).setDepth(y);
      if (quadro !== undefined) s.setFrame(quadro); else { s.play(id + '_idle'); s.anims.setProgress(Math.random()); }
      this.turma[id] = s;
      return s;
    };
    poe('kaua', 232, 446, TR.Q.agachaCostas);     // jogando videogame no puff azul
    poe('daniel', 392, 334, TR.Q.agachaFrente);   // no sofá
    poe('cezar', 518, 334, TR.Q.agachaFrente);
    poe('manu', 336, 416, TR.Q.agachaFrente);     // lendo gibi no chão
    poe('lucas', 610, 384);                        // do lado da JBL
    poe('pedro', 700, 404);
    poe('guilherme', 752, 420);
    poe('gabriel', 520, 470);
    poe('matheus', 880, 470);

    // você entra pela porta
    this.eu = { id: 'pernalonga', x: 810, y: 380, dir: 'down', moving: false };
    this.eu.spr = TR.kid(this, this.eu.id, this.eu.x, this.eu.y);
    this.dica = TR.txt(this, 0, 0, '', 1, 0x241a2c).setOrigin(0.5, 1).setDepth(9000);
    this.dicaBg = this.add.graphics().setDepth(8999);

    const g = this.add.graphics().setDepth(4000).setScrollFactor(0);
    g.fillStyle(0x0c0810, 0.85).fillRect(0, 0, 960, 34);
    TR.txt(this, 16, 9, 'O Barracão: o clube da turma   |   setas andam · E usa · Esc sai', 1, 0xffe0b0).setDepth(4001).setScrollFactor(0);
    TR.button(this, 890, 17, '‹ Rua (Esc)', () => this.sair(), { fixed: true, depth: 6500 });

    this.keys = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D');
    this.input.keyboard.on('keydown-E', () => this.usar());
    this.input.keyboard.on('keydown-ENTER', () => this.usar());
    this.input.keyboard.on('keydown-SPACE', () => this.usar());
    this.input.keyboard.on('keydown-ESC', () => this.voltar());
    this.events.on('resume', () => { this.desenhaTrofeus(); this.input.keyboard.resetKeys(); });

    TR.chatter(this, (id) => this.turma[id] || (id === this.eu.id ? this.eu.spr : null), { first: 2500, min: 5000, max: 9000 });
    this.time.delayedCall(700, () => this.turma.lucas && TR.bubble(this, this.turma.lucas, 'Chegou! Fecha a porta que é o clube!', 2));
    TR.vhs(this, 0.4);
  }

  // ------------------------------------------------------------------ andar
  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000, e = this.eu, k = this.keys;
    this.animaCenario(time);
    if (!this.painel && !this.sentado) {
      const mx = (k.RIGHT.isDown || k.D.isDown ? 1 : 0) - (k.LEFT.isDown || k.A.isDown ? 1 : 0);
      const my = (k.DOWN.isDown || k.S.isDown ? 1 : 0) - (k.UP.isDown || k.W.isDown ? 1 : 0);
      const len = Math.hypot(mx, my);
      e.moving = len > 0;
      if (len) {
        e.x += mx / len * 210 * dt; e.y += my / len * 170 * dt;
        e.dir = TR.dirFrom(mx, my, e.dir);
      }
      const [x0, y0, x1, y1] = this.D.andar;
      e.x = Phaser.Math.Clamp(e.x, x0, x1); e.y = Phaser.Math.Clamp(e.y, y0, y1);
      e.spr.setPosition(Math.round(e.x), Math.round(e.y)).setDepth(e.y);
      TR.pose(e.spr, e.dir, e.moving);
    }
    // a coisa mais perto mostra o que dá pra fazer
    this.perto = null;
    if (!this.painel) {
      if (this.sentado) this.perto = { rotulo: 'levantar' };
      else {
        let melhor = 1e9;
        this.coisas.forEach((c) => { const d = Math.hypot(c.x - e.x, (c.y - e.y) * 1.4); if (d < 74 && d < melhor) { melhor = d; this.perto = c; } });
      }
    }
    this.dicaBg.clear();
    if (this.perto) {
      const txt = (this.sys.game.device.input.touch ? 'Usar: ' : 'E: ') + this.perto.rotulo;
      this.dica.setText(txt).setPosition(Math.round(e.spr.x), Math.round(e.spr.y - 146)).setVisible(true);
      const w = this.dica.width + 14;
      this.dicaBg.fillStyle(0x241a2c, 1).fillRect(this.dica.x - w / 2 - 2, this.dica.y - 22, w + 4, 24);
      this.dicaBg.fillStyle(0xffd36a, 1).fillRect(this.dica.x - w / 2, this.dica.y - 20, w, 20);
    } else this.dica.setVisible(false);
  }

  animaCenario(time) {
    // pisca-pisca: as cores acendem em ondas
    if (!this._ultLuz || time - this._ultLuz > 120) {
      this._ultLuz = time;
      this.brilho.clear();
      const cores = [0xff6060, 0xffd050, 0x60e090, 0x60a8ff];
      this.D.luzinhas.forEach(([x, y], i) => {
        const a = 0.25 + 0.75 * Math.max(0, Math.sin(time / 500 + i * 0.9));
        this.brilho.fillStyle(cores[i % 4], 0.35 * a).fillCircle(x, y, 9);
        this.brilho.fillStyle(cores[i % 4], 0.8 * a).fillCircle(x, y, 3);
      });
      // a lâmpada e a luz da TV
      this.brilho.fillStyle(0xffe0a0, 0.12).fillCircle(490, 70, 60);
      const [tx0, ty0, tx1, ty1] = this.D.tela;
      this.brilho.fillStyle(0x80c0ff, 0.06 + 0.03 * Math.sin(time / 90)).fillEllipse((tx0 + tx1) / 2, ty1 + 120, 220, 120);
    }
    // a TV mostrando os pênaltis do videogame (modo demonstração)
    const [x0, y0, x1, y1] = this.D.tela, w = x1 - x0, h = y1 - y0, g = this.tv;
    g.clear();
    g.fillStyle(0x2a7a3a, 1).fillRect(x0, y0, w, h);
    for (let y = y0; y < y1; y += 8) g.fillStyle(0x338a44, 1).fillRect(x0, y, w, 4);
    g.fillStyle(0xffffff, 1).fillRect(x0 + 20, y0 + 10, w - 40, 2).fillRect(x0 + 20, y0 + 10, 2, 16).fillRect(x1 - 22, y0 + 10, 2, 16);
    const t = (time / 1000) % 2;
    const kx = x0 + w / 2 + Math.sin(time / 400) * 12;
    g.fillStyle(0xffd030, 1).fillRect(kx - 3, y0 + 16, 6, 9);
    const bx = x0 + w / 2 + (t < 1 ? Math.sin(time / 1300) * 20 * t : 0), by = y1 - 10 - (t < 1 ? t * 34 : 0);
    g.fillStyle(0xffffff, 1).fillRect(bx - 2, by - 2, 4, 4);
    g.fillStyle(0x000000, 0.18);
    for (let y = y0; y < y1; y += 3) g.fillRect(x0, y, w, 1);
  }

  desenhaTrofeus() {
    const g = this.trofeus, [px0, py0, px1] = this.D.prateleira;
    g.clear();
    TR.CONQUISTAS.forEach(([id], i) => {
      const x = px0 + 10 + i * ((px1 - px0 - 20) / (TR.CONQUISTAS.length - 1));
      if (TR.conquistas[id]) TR.desenhaTrofeu(g, x, py0, 0.7);
    });
  }

  // ------------------------------------------------------------------ usar as coisas
  usar() {
    if (this._saindo) return;
    if (this.painel) return this.fechaPainel();
    if (this.sentado) return this.levantar();
    const c = this.perto;
    if (!c) return;
    TR.sfx(this, 'clique', 0.4);
    if (c.id === 'videogame') this.jogarVideogame();
    else if (c.id === 'puff') this.sentar({ x: 110, y: 444, quadro: TR.Q.agachaCostas, fala: ['kaua', 'Me passa o controle depois!'] });
    else if (c.id === 'sofa') this.sentar({ x: 455, y: 334, quadro: TR.Q.agachaFrente, fala: ['daniel', 'Senta aí, cabe três.'] });
    else if (c.id === 'gibis') { if (this.turma.manu) TR.bubble(this, this.turma.manu, 'Bora ler!', 1.2); this.time.delayedCall(400, () => TR.go(this, 'Historia', { de: 'Clube' })); }
    else if (c.id === 'jbl') this.trocaMusica();
    else if (c.id === 'mural') this.abreMural();
    else if (c.id === 'porta') this.sair();
  }

  voltar() {
    if (this.painel) return this.fechaPainel();
    if (this.sentado) return this.levantar();
    this.sair();
  }

  sair() { TR.go(this, 'Rua'); }

  sentar(lugar) {
    const e = this.eu;
    this.sentado = lugar;
    e.spr.stop(); e.spr.setFrame(lugar.quadro).setPosition(lugar.x, lugar.y).setDepth(lugar.y + 1);
    e.x = lugar.x; e.y = Math.max(lugar.y, this.D.andar[1]);
    this.cameras.main.pan(lugar.x, lugar.y - 80, 600, 'Sine.easeInOut');
    this.cameras.main.zoomTo(1.35, 600, 'Sine.easeInOut');
    const [id, f] = lugar.fala;
    this.time.delayedCall(700, () => this.turma[id] && TR.bubble(this, this.turma[id], f, 1.8));
  }

  levantar() {
    const e = this.eu;
    this.sentado = null;
    e.y = Math.max(e.y, this.D.andar[1] + 10);
    this.cameras.main.pan(480, 270, 450, 'Sine.easeInOut');
    this.cameras.main.zoomTo(1, 450, 'Sine.easeInOut');
  }

  jogarVideogame() {
    TR.bubble(this, this.turma.kaua, 'Bora! Pênalti valendo!', 1.4);
    this.time.delayedCall(350, () => { this.scene.launch('Videogame'); this.scene.pause(); });
  }

  // A JBL do clube: troca a música (as do jogo ou a rádio da turma)
  trocaMusica() {
    const OPC = [['m_rua', 'Lofi: Fim de tarde'], ['m_fim', 'Lofi: Até amanhã, turma'], ['m_esconde', 'Na ponta do pé'],
      ['fundo', '8-bit: Tarde na Rua'], ['radio_lucas', 'JBL do Lucas'], ['radio_pedro', 'JBL do Pedro']];
    this.opcMusica = ((this.opcMusica === undefined ? 0 : this.opcMusica) + 1) % OPC.length;
    const [chave, nome] = OPC[this.opcMusica];
    if (chave.startsWith('radio_')) Radio.setStation(chave.slice(6));
    else {
      if (Radio.playing) Radio.pause();
      TR.clubeMusica = chave;
      TR.musicaFundo.tocar(this, chave);
    }
    this.jbl.play('jbl_lucas_pulsa', true);
    TR.bubble(this, this.turma.lucas, '♪ ' + nome, 1.8);
  }

  // ------------------------------------------------------------------ painéis (gibis e mural)
  abrePainel(titulo, w, h) {
    const c = this.add.container(0, 0).setDepth(8000).setScrollFactor(0);
    c.add(this.add.rectangle(480, 270, 960, 540, 0x0c0810, 0.55));
    c.add(TR.panel(this, 480, 270, w, h, 8000));
    c.add(TR.txt(this, 480, 270 - h / 2 + 18, titulo, 2, 0xffd36a).setOrigin(0.5, 0));
    c.add(TR.txt(this, 480, 270 + h / 2 - 26, 'E ou Esc fecha', 1, 0xc9b8d8).setOrigin(0.5, 0));
    c.setAlpha(0); this.tweens.add({ targets: c, alpha: 1, duration: 150 });
    this.painel = c;
    return c;
  }

  fechaPainel() {
    const c = this.painel; this.painel = null;
    this.tweens.add({ targets: c, alpha: 0, duration: 120, onComplete: () => c.destroy() });
  }

  // Os gibis são o modo história: cada capítulo é um gibi (por enquanto, as capas)
  abreGibis() {
    const c = this.abrePainel('Gibis da turma', 760, 380);
    const cores = [0xd84a40, 0x3a7ad0, 0xe8b030, 0x48a860];
    for (let i = 0; i < 4; i++) {
      const x = 480 - 270 + i * 180, y = 250;
      const g = this.add.graphics();
      g.fillStyle(0x0c0810, 1).fillRect(x - 64, y - 90, 128, 180);
      g.fillStyle(cores[i], 1).fillRect(x - 60, y - 86, 120, 172);
      g.fillStyle(0xfff1d6, 1).fillRect(x - 52, y - 78, 104, 22);
      g.fillStyle(0x000000, 0.25).fillRect(x - 52, y - 46, 104, 96);
      // cadeadinho
      g.fillStyle(0x241a2c, 1).fillRect(x - 14, y - 6, 28, 22); g.lineStyle(4, 0x241a2c, 1).strokeCircle(x, y - 8, 9);
      g.fillStyle(0xffd36a, 1).fillRect(x - 2, y + 2, 4, 6);
      c.add(g);
      c.add(TR.txt(this, x, y - 74, 'Capítulo ' + (i + 1), 1, 0x241a2c).setOrigin(0.5, 0));
      c.add(TR.txt(this, x, y + 58, 'em breve', 1, 0xfff1d6).setOrigin(0.5, 0));
    }
    c.add(TR.txt(this, 480, 360, 'As histórias da turma estão sendo desenhadas. Cada gibi vai ser um capítulo!', 1, 0xf4e9d8).setOrigin(0.5, 0));
    TR.bubble(this, this.turma.manu, 'Esse aqui é o meu favorito!', 1.6);
  }

  // Mural: recordes da turma + todos os troféus (os que faltam aparecem apagados)
  abreMural() {
    const c = this.abrePainel('Mural da turma', 820, 440);
    const ganhos = TR.CONQUISTAS.filter(([id]) => TR.conquistas[id]).length;
    let recorde = 0;
    try { recorde = +localStorage.getItem('turma_vg_recorde') || 0; } catch (e) { /* ok */ }
    const x0 = 100;
    c.add(TR.txt(this, x0, 104, 'Troféus: ' + ganhos + ' de ' + TR.CONQUISTAS.length, 1, 0xffd36a));
    c.add(TR.txt(this, x0 + 230, 104, TR.textoPlacar(), 1, 0x9ccfff));
    c.add(TR.txt(this, x0 + 560, 104, 'Pênaltis: ' + recorde + '/5', 1, 0x9ccfff));
    const g = this.add.graphics(); c.add(g);
    TR.CONQUISTAS.forEach(([id, nome, desc], i) => {
      const col = i % 2, lin = Math.floor(i / 2);
      const x = x0 + col * 390, y = 136 + lin * 46;
      const tem = !!TR.conquistas[id];
      g.fillStyle(tem ? 0x3a2a48 : 0x1e1626, 1).fillRect(x, y, 370, 40);
      TR.desenhaTrofeu(g, x + 22, y + 34, 1.1, !tem);
      c.add(TR.txt(this, x + 46, y + 4, nome, 1, tem ? 0xffd36a : 0x7a6a86));
      c.add(TR.txt(this, x + 46, y + 21, desc, 1, tem ? 0xf4e9d8 : 0x6a5a76));
    });
    c.add(TR.txt(this, x0 + 390 + 46, 136 + 5 * 46 + 4, 'Lojinha da turma: em breve!', 1, 0xc9b8d8));
    // skins
    const skin = TR.gessoLiberado() ? 'Skin: ' + (TR.comGesso() ? 'de gesso' : 'normal') + '  (G troca)' : 'Skin de gesso: termine o cap. 2';
    c.add(TR.txt(this, x0 + 390 + 46, 136 + 5 * 46 + 24, skin, 1, TR.gessoLiberado() ? 0x9ccfff : 0x7a6a86));
    if (TR.gessoLiberado()) this.input.keyboard.once('keydown-G', () => { if (this.painel !== c) return; TR.trocaSkin(this); TR.sfx(this, 'selecionar', 0.5); this.scene.restart(); });
  }
}

/*
 * Videogame do clube: "Pênaltis 2019", na TV de tubo.
 * A mira passa de um lado pro outro: aperte Espaço (ou E) pra chutar. Canto alto é quase indefensável.
 */
class Videogame extends Phaser.Scene {
  constructor() { super('Videogame'); }

  create() {
    this.S = 4; this.ox = 160; this.oy = 86;   // tela virtual 160x100, ampliada 4x
    this.add.rectangle(480, 270, 960, 540, 0x0c0810, 0.85);
    const b = this.add.graphics();
    b.fillStyle(0xbab4aa, 1).fillRoundedRect(this.ox - 44, this.oy - 40, 640 + 88, 400 + 96, 28);
    b.fillStyle(0x8e887e, 1).fillRect(this.ox - 44, this.oy + 400 + 30, 640 + 88, 26);
    b.fillStyle(0x1a1e24, 1).fillRoundedRect(this.ox - 12, this.oy - 12, 664, 424, 18);
    this.g = this.add.graphics();
    this.crt = this.add.graphics();
    for (let y = 0; y < 400; y += 4) this.crt.fillStyle(0x000000, 0.22).fillRect(this.ox, this.oy + y + 2, 640, 2);
    this.txtTopo = TR.txt(this, 480, this.oy + 10, '', 1, 0xffffff).setOrigin(0.5, 0);
    this.txtMeio = TR.txt(this, 480, this.oy + 180, '', 2, 0xffe060).setOrigin(0.5);
    this.txtBaixo = TR.txt(this, 480, this.oy + 372, '', 1, 0xfff1d6).setOrigin(0.5, 0);
    TR.txt(this, 480, this.oy + 434, 'PÊNALTIS 2019 · Espaço chuta · Esc volta pro clube', 1, 0x3a342c).setOrigin(0.5, 0);
    this.input.keyboard.on('keydown-SPACE', () => this.chutar());
    this.input.keyboard.on('keydown-E', () => this.chutar());
    this.input.keyboard.on('keydown-ENTER', () => this.chutar());
    this.input.keyboard.on('keydown-ESC', () => this.sair());
    this.input.on('pointerdown', () => this.chutar());
    this.nova();
  }

  nova() {
    this.cobrancas = []; this.estado = 'mira'; this.t = 0;
    this.goleiro = { x: 80, alvo: 80 };
    this.bola = { x: 80, y: 88, ate: null };
    this.txtMeio.setText(''); this.txtBaixo.setText('aperte Espaço na hora certa');
  }

  chutar() {
    if (this.estado === 'fim') return this.nova();
    if (this.estado !== 'mira') return;
    this.estado = 'chute'; this.t = 0;
    const alvo = { x: this.mira.x, y: this.mira.y };
    // o goleiro escolhe um canto (lê um pouco o chute a cada cobrança)
    const lado = alvo.x < 70 ? 52 : alvo.x > 90 ? 108 : 80;
    const acerta = Math.random() < 0.38 + this.cobrancas.length * 0.05;
    this.goleiro.alvo = acerta ? lado : Phaser.Utils.Array.GetRandom([52, 80, 108].filter((v) => v !== lado));
    const alto = alvo.y < 27 && Math.abs(alvo.x - 80) > 20;   // ângulo: não tem goleiro que pegue
    this.bola.ate = alvo;
    this.bola.gol = alto || Math.abs(this.goleiro.alvo - alvo.x) > 14;
    TR.sfx(this, 'chute', 0.6);
    this.txtBaixo.setText('');
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.t += dt;
    const n = this.cobrancas.length;
    // mira: vai e volta, cada vez mais rápida; sobe e desce devagar
    const vel = 1.6 + n * 0.35;
    this.mira = { x: 80 + Math.sin(time / 1000 * vel * 2) * 36, y: 33 + Math.sin(time / 1000 * 1.3) * 10 };
    if (this.estado === 'chute') {
      const k = Math.min(1, this.t / 0.45), b = this.bola;
      b.x = 80 + (b.ate.x - 80) * k; b.y = 88 + (b.ate.y - 88) * k;
      this.goleiro.x += (this.goleiro.alvo - this.goleiro.x) * Math.min(1, dt * 9);
      if (k >= 1) {
        this.estado = 'resultado'; this.t = 0;
        this.cobrancas.push(b.gol);
        this.txtMeio.setText(b.gol ? 'GOOOL!' : 'DEFENDEU!').setTint(b.gol ? 0xffe060 : 0xff8a70);
        TR.sfx(this, b.gol ? 'gol' : 'pegar', b.gol ? 0.45 : 0.6);
      }
    } else if (this.estado === 'resultado' && this.t > 1.3) {
      this.txtMeio.setText('');
      if (this.cobrancas.length >= 5) this.terminar();
      else { this.estado = 'mira'; this.bola = { x: 80, y: 88, ate: null }; this.goleiro = { x: 80, alvo: 80 }; }
    }
    if (this.estado === 'mira') this.goleiro.x = 80 + Math.sin(time / 380) * 6;
    const gols = this.cobrancas.filter(Boolean).length;
    this.txtTopo.setText('GOLS ' + gols + '   ' + [0, 1, 2, 3, 4].map((i) => (i < n ? (this.cobrancas[i] ? '●' : 'x') : '○')).join(' '));
    this.desenha(time);
  }

  terminar() {
    this.estado = 'fim';
    const gols = this.cobrancas.filter(Boolean).length;
    let rec = 0;
    try { rec = +localStorage.getItem('turma_vg_recorde') || 0; if (gols > rec) localStorage.setItem('turma_vg_recorde', gols); } catch (e) { /* ok */ }
    this.txtMeio.setText(gols + ' DE 5!').setTint(0xffe060);
    this.txtBaixo.setText((gols > rec ? 'RECORDE NOVO!  ' : 'recorde: ' + Math.max(rec, gols) + '/5   ') + 'Espaço: de novo · Esc: sair');
    TR.sfx(this, gols >= 4 ? 'vitoria' : 'derrota', 0.5);
    if (gols >= 4) TR.conquista('videogame', this);
  }

  sair() { this.scene.stop(); this.scene.resume('Clube'); }

  // desenha a tela 160x100 em "pixels grandes"
  desenha(time) {
    const g = this.g, S = this.S, ox = this.ox, oy = this.oy;
    const r = (x, y, w, h, c) => g.fillStyle(c, 1).fillRect(ox + Math.round(x) * S, oy + Math.round(y) * S, Math.max(1, Math.round(w)) * S, Math.max(1, Math.round(h)) * S);
    g.clear();
    r(0, 0, 160, 100, 0x1c2040);                                 // céu da noite do estádio
    for (let i = 0; i < 40; i++) r((i * 4) % 160, 6 + (i % 3) * 3, 3, 2, [0xd84a40, 0xe8e8e8, 0x3a7ad0, 0xe8b030][(i + Math.floor(time / 300)) % 4]);   // torcida
    r(0, 16, 160, 84, 0x2a7a3a);
    for (let y = 16; y < 100; y += 8) r(0, y, 160, 4, 0x338a44);
    r(36, 48, 88, 1, 0xffffff);                                  // linha do gol
    for (let x = 41; x < 120; x += 4) for (let y = 19; y < 48; y += 4) r(x, y, 1, 1, 0xb8c8c0);   // rede
    r(38, 16, 84, 2, 0xffffff); r(38, 16, 2, 33, 0xffffff); r(120, 16, 2, 33, 0xffffff);          // traves
    r(79, 87, 2, 2, 0xffffff);                                   // marca do pênalti
    // goleiro (pula pro lado escolhido)
    const gx = this.goleiro.x, pulo = Math.abs(gx - 80) > 8;
    if (pulo) { r(gx - 8, 38, 16, 6, 0xffd030); r(gx + (gx > 80 ? 8 : -11), 38, 3, 3, 0xe0a070); }
    else { r(gx - 3, 36, 6, 8, 0xffd030); r(gx - 2, 32, 4, 4, 0xe0a070); r(gx - 3, 44, 2, 4, 0x203060); r(gx + 1, 44, 2, 4, 0x203060); r(gx - 6, 37, 3, 2, 0xffd030); r(gx + 3, 37, 3, 2, 0xffd030); }
    // batedor
    if (this.estado === 'mira') { r(70, 82, 5, 7, 0xd84a40); r(71, 78, 4, 4, 0x8a5a3a); r(71, 89, 2, 4, 0x203060); r(74, 89, 2, 4, 0x203060); }
    // bola (fica menor quando vai pro gol)
    const b = this.bola, tam = b.ate ? Math.max(2, 3 - (88 - b.y) / 25) : 3;
    r(b.x - tam / 2, b.y - tam / 2, tam, tam, 0xffffff);
    // mira piscando
    if (this.estado === 'mira' && Math.floor(time / 120) % 2 === 0) {
      const m = this.mira;
      r(m.x - 3, m.y, 2, 1, 0xff4040); r(m.x + 2, m.y, 2, 1, 0xff4040); r(m.x, m.y - 3, 1, 2, 0xff4040); r(m.x, m.y + 2, 1, 2, 0xff4040);
    }
    this.crt.setAlpha(0.85 + 0.15 * Math.sin(time / 50));
  }
}
