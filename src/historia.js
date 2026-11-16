/*
 * MODO HISTÓRIA: as histórias reais da turma, contadas em gibi (páginas com quadrinhos feitos com a arte do jogo)
 * e com partes jogáveis no meio.
 *
 *   TR.historia ........ progresso salvo no navegador (capítulos feitos)
 *   TR.bloqueado(id) ... personagens que só aparecem depois de um capítulo (Matheus: cap. 4, Guilherme: cap. 5)
 *   TR.skins ........... skins desbloqueadas na história (você de gesso: cap. 2)
 *   TR.gibi() .......... mostra páginas de gibi, quadrinho por quadrinho
 *   TR.HJ .............. as partes jogáveis (conhecer a turma, fugir da beudinha, filme de terror, correr atrás do Matheus, convidar o Guilherme)
 *   TR.CAPITULOS ....... o roteiro de cada capítulo
 *   class Historia ..... a cena que junta tudo
 */

// ------------------------------------------------------------------ progresso, bloqueios e skins
TR.historia = { feitos: {} };
try { Object.assign(TR.historia, JSON.parse(localStorage.getItem('turma_historia') || '{}')); } catch (e) { /* ok */ }
TR.salvaHistoria = () => { try { localStorage.setItem('turma_historia', JSON.stringify(TR.historia)); } catch (e) { /* ok */ } };
TR.capFeito = (n) => !!TR.historia.feitos[n];
TR.capLiberado = (n) => n === 1 || TR.capFeito(n - 1);
TR.DESBLOQUEIO = { matheus: 4, guilherme: 5 };
TR.bloqueado = (id) => (TR.DESBLOQUEIO[id] && !TR.capFeito(TR.DESBLOQUEIO[id]) ? TR.DESBLOQUEIO[id] : 0);
TR.liberados = (lista) => lista.filter((id) => !TR.bloqueado(id));

TR.skins = { pernalonga: 'normal' };
try { Object.assign(TR.skins, JSON.parse(localStorage.getItem('turma_skins') || '{}')); } catch (e) { /* ok */ }
TR.gessoLiberado = () => TR.capFeito(2);
TR.comGesso = () => TR.skins.pernalonga === 'gesso' && TR.gessoLiberado();
// troca a folha de sprites do Pernalonga (com ou sem gesso) e refaz as animações dele
TR.aplicaSkins = (scene) => {
  const tex = scene.textures, fonte = TR.comGesso() ? 'pernalonga_gesso' : 'pernalonga_normal';
  if (!tex.exists(fonte)) return;
  if (tex.exists('pernalonga')) tex.remove('pernalonga');
  tex.addSpriteSheet('pernalonga', tex.get(fonte).getSourceImage(), { frameWidth: 80, frameHeight: 136 });
  scene.anims.anims.keys().filter((k) => k.startsWith('pernalonga_')).forEach((k) => scene.anims.remove(k));
  TR.makeAnims(scene);
};
TR.trocaSkin = (scene) => {
  TR.skins.pernalonga = TR.skins.pernalonga === 'gesso' ? 'normal' : 'gesso';
  try { localStorage.setItem('turma_skins', JSON.stringify(TR.skins)); } catch (e) { /* ok */ }
  TR.aplicaSkins(scene);
};

// quadros da folha de sprites (8 colunas): nomes fáceis pros roteiros
TR.F = { frente: 0, esq: 8, dir: 16, costas: 24, sentado: 32, sentadoCostas: 33, pisca: 34, fala: 35,
  seguraDir: 40, lancaDir: 43, vergonha: 56, vergonha2: 57, abreDir: 58, olhaCimaDir: 59, levantaDir: 60, abreEsq: 61, olhaCimaEsq: 62 };

// ------------------------------------------------------------------ gibi
/*
 * paginas: [{ paineis: [painel, ...] }]
 * painel: { r: [x, y, w, h] na tela, bg: chave do cenário (ou cor), cx, cy, z: centro e zoom no cenário,
 *           tint, atores: [{ id | key, f, anim, x, y, s, flip, ang }], fx: [{ tipo: 'areia' | 'susto' | 'kkk', x, y }],
 *           baloes: [{ t, de: índice do ator, tipo: 'fala' | 'grito' | 'pensa', dx, dy }], leg: 'narração', legBaixo: true }
 */
TR.gibi = (scene, paginas, fim) => {
  let pag = 0, pn = -1, ocupado = false, cont = null;
  const dica = TR.txt(scene, 944, 528, '▶ Espaço', 1, 0x5a4a3a).setOrigin(1, 1).setDepth(9500);
  scene.tweens.add({ targets: dica, alpha: 0.3, yoyo: true, repeat: -1, duration: 500 });
  const pular = TR.txt(scene, 16, 528, 'Esc: pular', 1, 0x8a7a6a).setOrigin(0, 1).setDepth(9500);
  const novaPagina = () => {
    cont = scene.add.container(0, 0).setDepth(100);
    const g = scene.add.graphics();
    g.fillStyle(0xf2e6c8, 1).fillRect(0, 0, 960, 540);
    for (let y = 6; y < 540; y += 12) for (let x = (y / 12) % 2 ? 6 : 12; x < 960; x += 12) g.fillStyle(0xe6d6b0, 1).fillRect(x, y, 2, 2);
    cont.add(g);
    cont.x = 40; cont.alpha = 0;
    scene.tweens.add({ targets: cont, x: 0, alpha: 1, duration: 220 });
    pn = -1;
  };
  const mostraPainel = (p) => {
    const [rx, ry, rw, rh] = p.r, z = p.z || 1;
    const borda = scene.add.graphics();
    borda.fillStyle(0x111111, 1).fillRect(rx - 4, ry - 4, rw + 8, rh + 8);
    borda.fillStyle(typeof p.bg === 'number' ? p.bg : 0x2a2030, 1).fillRect(rx, ry, rw, rh);
    cont.add(borda);
    const mundo = scene.add.container(rx + rw / 2 - (p.cx || 480) * z, ry + rh / 2 - (p.cy || 270) * z).setScale(z);
    const forma = scene.make.graphics({ add: false }); forma.fillStyle(0xffffff).fillRect(rx, ry, rw, rh);
    mundo.setMask(forma.createGeometryMask());
    if (typeof p.bg === 'string') { const im = scene.add.image(0, 0, p.bg).setOrigin(0); if (p.tint) im.setTint(p.tint); mundo.add(im); }
    const atores = (p.atores || []).map((a) => {
      const key = a.key || (TR.KIDS[a.id] ? a.id : 'viz_' + a.id);
      const s = scene.add.sprite(a.x, a.y, key, a.f || 0).setOrigin(0.5, 0.97).setScale(a.s || 1);
      if (a.anim) s.play(a.anim);
      if (a.flip) s.setFlipX(true);
      if (a.ang) s.setAngle(a.ang);
      if (p.tint && !a.semTint) s.setTint(p.tint);
      if (a.alpha) s.setAlpha(a.alpha);
      mundo.add(s);
      return s;
    });
    (p.fx || []).forEach((f) => {
      const g = scene.add.graphics(); mundo.add(g);
      if (f.tipo === 'areia') for (let i = 0; i < 40; i++) g.fillStyle([0xe8d090, 0xd8b870, 0xc8a050][i % 3], 1).fillRect(f.x + Phaser.Math.Between(-40, 40), f.y + Phaser.Math.Between(-30, 30), 3, 3);
      if (f.tipo === 'impacto') {   // estrela de "POW"
        const estrela = (r1, r2) => Array.from({ length: 16 }, (_, k) => { const r = k % 2 ? r1 : r2, a = k / 16 * Math.PI * 2; return { x: f.x + Math.cos(a) * r, y: f.y + Math.sin(a) * r * 0.8 }; });
        g.fillStyle(0x111111, 1).fillPoints(estrela(24, 58), true);
        g.fillStyle(0xfff07a, 1).fillPoints(estrela(17, 48), true);
      }
      if (f.tipo === 'raios') { g.lineStyle(3, 0x111111, 0.5); for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; g.lineBetween(f.x + Math.cos(a) * 120, f.y + Math.sin(a) * 90, f.x + Math.cos(a) * 400, f.y + Math.sin(a) * 300); } }
      if (f.tipo === 'lagrimas') { g.fillStyle(0x60b0ff, 1); [[-10, 0], [10, 4], [-12, 14], [12, 18]].forEach(([dx, dy]) => g.fillRect(f.x + dx, f.y + dy, 3, 6)); }
      if (f.tipo === 'areiaChao') { for (let i = 0; i < 160; i++) g.fillStyle([0xe0c890, 0xd0b478, 0xc8a868][i % 3], 1).fillRect(f.x + Phaser.Math.Between(-60, 60), f.y + Phaser.Math.Between(-14, 14), 4, 3); }
      if (f.tipo === 'sofa') { g.fillStyle(0x6a5292, 1).fillRect(256, 356, 448, 18); g.fillStyle(0x4a3a6a, 1).fillRect(256, 374, 448, 30); g.fillStyle(0x7e64ac, 1).fillRect(256, 354, 448, 3); }
      if (f.tipo === 'linhas') { g.lineStyle(3, 0x111111, 0.6); for (let i = 0; i < 6; i++) g.lineBetween(f.x - 30, f.y - 20 + i * 8, f.x - 70, f.y - 20 + i * 8); }
      if (f.tipo === 'tremor') { g.lineStyle(3, 0x111111, 0.7); [[-24, -10], [24, -10], [-28, 10], [28, 10]].forEach(([dx, dy]) => g.lineBetween(f.x + dx, f.y + dy, f.x + dx * 1.4, f.y + dy * 1.4)); }
    });
    cont.add(mundo);
    // balões de fala
    const usados = [];
    (p.baloes || []).forEach((b, i) => {
      const a = atores[b.de] || null;
      const wx = a ? a.x : (b.x || 480), wy = a ? a.y - 136 * (a.scaleY || 1) - 6 : (b.y || 200);
      const px = mundo.x + wx * z, py = mundo.y + wy * z;
      const t = TR.txt(scene, 0, 0, b.t, 1, 0x111111).setMaxWidth(Math.min(240, rw - 30)).setOrigin(0.5, 1);
      const w = t.width + 18, h = t.height + 14;
      const topo = ry + h + 6 + (p.leg && !p.legBaixo ? 34 : 0);
      const fixa = (x, y) => [Phaser.Math.Clamp(x, rx + w / 2 + 6, rx + rw - w / 2 - 6), Phaser.Math.Clamp(y, topo, ry + rh - 8)];
      const bate = (x, y) => usados.some((u) => Math.abs(u[0] - x) < (u[2] + w) / 2 + 4 && Math.abs((u[1] - u[3] / 2) - (y - h / 2)) < (u[3] + h) / 2 + 4);
      let [bx, by] = fixa(px + (b.dx || 0), py - 18 + (b.dy || 0));
      for (const [ox, oy] of [[0, 0], [w * 0.6, 0], [-w * 0.6, 0], [0, h + 8], [w * 0.6, h + 8], [-w * 0.6, h + 8], [0, -(h + 8)], [0, 2 * (h + 8)]]) {
        const [cx_, cy_] = fixa(bx + ox, by + oy);
        if (!bate(cx_, cy_)) { bx = cx_; by = cy_; break; }
      }
      usados.push([bx, by, w, h]);
      t.setPosition(bx, by - 7);
      const gb = scene.add.graphics();
      const grito = b.tipo === 'grito';
      gb.fillStyle(0x111111, 1).fillRoundedRect(bx - w / 2 - 3, by - h - 3, w + 6, h + 6, grito ? 2 : 12);
      gb.fillStyle(grito ? 0xfff07a : 0xffffff, 1).fillRoundedRect(bx - w / 2, by - h, w, h, grito ? 2 : 10);
      if (b.tipo === 'pensa') { gb.fillStyle(0x111111, 1).fillCircle(bx - 10, by + 8, 6).fillCircle(bx - 18, by + 18, 4); gb.fillStyle(0xffffff, 1).fillCircle(bx - 10, by + 8, 4).fillCircle(bx - 18, by + 18, 2); }
      else if (a) {
        const tx = Phaser.Math.Clamp(px, bx - w / 2 + 10, bx + w / 2 - 10);
        const ponta = [Phaser.Math.Clamp(px, tx - 24, tx + 24), Phaser.Math.Clamp(py, by + 8, Math.min(by + 34, ry + rh - 4))];
        gb.fillStyle(0x111111, 1).fillTriangle(tx - 9, by - 2, tx + 9, by - 2, ponta[0], ponta[1] + 3);
        gb.fillStyle(grito ? 0xfff07a : 0xffffff, 1).fillTriangle(tx - 6, by - 3, tx + 6, by - 3, ponta[0], ponta[1]);
      }
      cont.add([gb, t]);
      gb.alpha = t.alpha = 0;
      scene.tweens.add({ targets: [gb, t], alpha: 1, duration: 160, delay: 140 + i * 280 });
    });
    // legenda (caixinha amarela do narrador)
    if (p.leg) {
      const t = TR.txt(scene, 0, 0, p.leg, 1, 0x111111).setMaxWidth(rw - 34);
      const w = t.width + 16, h = t.height + 10, lx = rx + 6, ly = p.legBaixo ? ry + rh - h - 6 : ry + 6;
      const gl = scene.add.graphics();
      gl.fillStyle(0x111111, 1).fillRect(lx - 2, ly - 2, w + 4, h + 4); gl.fillStyle(0xffe08a, 1).fillRect(lx, ly, w, h);
      t.setPosition(lx + 8, ly + 5);
      cont.add([gl, t]);
    }
    const tudo = cont.list.slice(cont.list.indexOf(borda));
    tudo.forEach((o) => { if (o.alpha === 1) { o.alpha = 0; scene.tweens.add({ targets: o, alpha: 1, duration: 200 }); } });
    if (p.som) TR.sfx(scene, p.som, 0.6);
    if (p.treme) scene.time.delayedCall(150, () => scene.cameras.main.shake(200, 0.006));
  };
  const avanca = () => {
    if (ocupado) return;
    const P = paginas[pag];
    if (pn < P.paineis.length - 1) { pn++; mostraPainel(P.paineis[pn]); ocupado = true; scene.time.delayedCall(260, () => { ocupado = false; }); return; }
    // página acabou: vira a página ou termina
    ocupado = true;
    TR.sfx(scene, 'pagina', 0.5);
    const velha = cont;
    scene.tweens.add({ targets: velha, x: -60, alpha: 0, duration: 200, onComplete: () => velha.destroy(true) });
    pag++;
    if (pag >= paginas.length) return termina();
    scene.time.delayedCall(180, () => { novaPagina(); ocupado = false; avanca(); });
  };
  const termina = () => {
    scene.input.keyboard.off('keydown', tecla); scene.input.off('pointerdown', avanca);
    dica.destroy(); pular.destroy();
    scene.time.delayedCall(220, fim);
  };
  const tecla = (ev) => {
    if (['Space', 'Enter', 'KeyE', 'ArrowRight'].includes(ev.code)) avanca();
    if (ev.code === 'Escape') { if (cont) cont.destroy(true); termina(); }
  };
  novaPagina();
  scene.time.delayedCall(250, () => { avanca(); scene.input.keyboard.on('keydown', tecla); scene.input.on('pointerdown', avanca); });
};

// ------------------------------------------------------------------ peças das partes jogáveis
TR.HP = {
  // roda fn a cada quadro só enquanto este passo estiver na tela
  noQuadro(scene, fn) {
    scene.events.on('update', fn);
    scene.events.once('shutdown', () => scene.events.off('update', fn));
  },
  // você andando pela rua (setas/WASD). opts: { vel, limites: [x0, y0, x1, y1], mancando }
  jogador(scene, id, x, y, opts = {}) {
    const k = scene.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D');
    const j = { id, x, y, dir: 'right', spr: TR.kid(scene, id, x, y).setDepth(y), parado: false, t: 0 };
    const lim = opts.limites || [30, 268, 930, 500];
    j.update = (dt) => {
      j.t += dt;
      if (j.parado) { TR.pose(j.spr, j.dir, false); return; }
      const mx = (k.RIGHT.isDown || k.D.isDown ? 1 : 0) - (k.LEFT.isDown || k.A.isDown ? 1 : 0);
      const my = (k.DOWN.isDown || k.S.isDown ? 1 : 0) - (k.UP.isDown || k.W.isDown ? 1 : 0);
      const len = Math.hypot(mx, my);
      let v = opts.vel || 210;
      if (opts.mancando) v *= 0.68 + 0.32 * Math.abs(Math.sin(j.t * 6));   // passo manco
      if (len) { j.x += mx / len * v * dt; j.y += my / len * v * 0.8 * dt; j.dir = TR.dirFrom(mx, my, j.dir); }
      j.x = Phaser.Math.Clamp(j.x, lim[0], lim[2]); j.y = Phaser.Math.Clamp(j.y, lim[1], lim[3]);
      j.spr.setPosition(Math.round(j.x), Math.round(j.y + (opts.mancando && len ? Math.abs(Math.sin(j.t * 6)) * 3 : 0))).setDepth(j.y);
      TR.pose(j.spr, j.dir, len > 0);
    };
    return j;
  },
  // faz um sprite de vizinha (ou qualquer folha com _run_) correr pra uma direção
  poseViz(spr, chave, dir, anda) {
    const k = 'viz_' + chave + '_run_' + dir;
    if (anda) { if (!spr.anims.isPlaying || spr.anims.currentAnim.key !== k) spr.play(k, true); }
    else { spr.stop(); spr.setFrame(TR.DIRS[dir] * TR.COLS); }
  },
  // falas em sequência: [[sprite, 'texto', segundos], ...]
  dialogo(scene, falas, fim) {
    let t = 0;
    falas.forEach(([s, txt, seg]) => { scene.time.delayedCall(t * 1000, () => s && s.active && TR.bubble(scene, s, txt, seg || 1.8)); t += (seg || 1.8) + 0.15; });
    if (fim) scene.time.delayedCall(t * 1000, fim);
  },
  objetivo(scene, txt) {
    if (!scene._obj) {
      scene._objBg = scene.add.graphics().setDepth(8000).setScrollFactor(0);
      scene._obj = TR.txt(scene, 480, 52, '', 1, 0xffe08a).setOrigin(0.5).setDepth(8001).setScrollFactor(0);
    }
    scene._obj.setText(txt);
    const w = scene._obj.width + 30;
    scene._objBg.clear().fillStyle(0x0c0810, 0.85).fillRect(480 - w / 2, 38, w, 28).fillStyle(0xf2b13c, 1).fillRect(480 - w / 2, 38, 4, 28);
  },
  // tecla de ação (E, Espaço ou toque no botão "Usar")
  acao(scene, fn) {
    ['keydown-E', 'keydown-SPACE', 'keydown-ENTER'].forEach((ev) => scene.input.keyboard.on(ev, fn));
  },
  turmaParada(scene, lista) {
    const s = {};
    lista.forEach(([id, x, y, f]) => {
      s[id] = TR.kid(scene, id, x, y).setDepth(y);
      if (f !== undefined) s[id].setFrame(f); else { s[id].play(id + '_idle'); s[id].anims.setProgress(Math.random()); }
    });
    return s;
  },
};

// ------------------------------------------------------------------ partes jogáveis
TR.HJ = {
  // Cap. 1: subir a rua e conhecer a turma
  conhecer(scene, ok) {
    TR.ruaComCeu(scene); TR.cicloDoDia(scene, () => 0.33);
    const eu = TR.HP.jogador(scene, 'pernalonga', 60, 440);
    const t = TR.HP.turmaParada(scene, [['kaua', 170, 420], ['pedro', 380, 352], ['lucas', 540, 440], ['daniel', 690, 372], ['gabriel', 840, 430]]);
    t.kaua.setFlipX(false);
    const jbl = scene.add.sprite(420, 350, 'jbl_pedro', 0).setScale(1.3).setOrigin(0.5, 1).setDepth(351).play('jbl_pedro_pulsa');
    const falas = {
      kaua: [[t.kaua, 'Ó ele aí! Chega mais, mano!'], [t.kaua, 'Vou te apresentar a turma. Fala com todo mundo!', 2.2]],
      pedro: [[t.pedro, 'E aí! Sou o Pedro, o MC da rua. Curte um funk?', 2.2], [t.kaua, 'A JBL dele não desliga nunca kkk', 1.8]],
      lucas: [[t.lucas, 'Lucas, prazer! Tu joga bola? Fica no meu time!', 2.2]],
      daniel: [[t.daniel, 'Daniel. Calculei aqui: com essa perna comprida... tu é o Pernalonga! kkkk', 2.6], [eu.spr, 'Pernalonga?!', 1.4], [t.daniel, 'Pegou, agora é teu apelido!', 1.8]],
      gabriel: [[t.gabriel, 'Gabriel! Fica no gol comigo que eu pego tudo!', 2.2]],
    };
    const conheceu = new Set();
    let falando = false;
    TR.HP.objetivo(scene, 'Suba a rua e conheça a turma: chegue perto e aperte E');
    TR.HP.dialogo(scene, falas.kaua.slice(0, 1));
    const perto = () => Object.keys(t).find((id) => Math.hypot(t[id].x - eu.x, (t[id].y - eu.y) * 1.3) < 80);
    TR.HP.acao(scene, () => {
      if (falando) return;
      const id = perto();
      if (!id) return;
      falando = true; eu.parado = true;
      eu.dir = t[id].x > eu.x ? 'right' : 'left';
      TR.HP.dialogo(scene, falas[id], () => {
        falando = false; eu.parado = false;
        if (id !== 'kaua') conheceu.add(id);
        TR.HP.objetivo(scene, 'Conheça a turma (' + conheceu.size + '/4)');
        if (conheceu.size === 4) {
          eu.parado = true;
          TR.HP.dialogo(scene, [[t.pedro, 'Bora um golzinho? Já tem time!', 1.8], [t.kaua, 'Bem-vindo à rua, Pernalonga!', 1.8]], ok);
        }
      });
    });
    TR.HP.noQuadro(scene, (tm, d) => {
      eu.update(Math.min(d, 50) / 1000);
      const id = perto();
      Object.keys(t).forEach((k) => t[k].setTint(k === id && !falando ? 0xfff0b0 : 0xffffff));
    });
  },

  // Cap. 2: fugir da beudinha mancando (20 segundos)
  fuga(scene, ok, falha) {
    TR.ruaComCeu(scene); TR.cicloDoDia(scene, () => 0.45);
    const eu = TR.HP.jogador(scene, 'pernalonga', 300, 420, { vel: 185, mancando: true, limites: [30, 292, 930, 500] });
    const b = { x: 760, y: 360, spr: scene.add.sprite(760, 360, 'viz_beudinha', 0).setOrigin(0.5, 0.97), dir: 'left', investida: 0 };
    const cel = scene.add.image(0, 0, 'celular').setDepth(9000);
    const outros = ['pedro', 'daniel', 'lucas', 'kaua', 'cezar'].map((id, i) => ({ id, x: 150 + i * 170, y: 320 + (i % 2) * 140, spr: TR.kid(scene, id, 150 + i * 170, 320), dir: 'right', vx: 0, vy: 0 }));
    const DUR = 20;
    let tempo = 0, fim = false, proxInvestida = 4;
    const louvor = scene.sound.add('louvor', { loop: true, volume: 0.22 }); louvor.play();
    scene.events.once('shutdown', () => louvor.destroy());
    TR.HP.objetivo(scene, 'FUJA DA BEUDINHA! Você está mancando...  ' + DUR + 's');
    TR.bubble(scene, b.spr, 'TÃO RINDO DE MIM, É?!', 1.6);
    const grita = ['Volta aqui, moleque!', 'Rindo de mim?!', 'Vou contar pra sua mãe!', 'Eu só queria jogar!'];
    scene.time.addEvent({ delay: 3200, loop: true, callback: () => !fim && TR.bubble(scene, b.spr, Phaser.Utils.Array.GetRandom(grita), 1.4) });
    TR.HP.noQuadro(scene, (tm, d) => {
      if (fim) return;
      const dt = Math.min(d, 50) / 1000;
      tempo += dt;
      eu.update(dt);
      // ela vai acelerando e de vez em quando dá uma investida
      proxInvestida -= dt;
      if (proxInvestida <= 0) { proxInvestida = Phaser.Math.FloatBetween(3.5, 5); b.investida = 0.7; TR.bubble(scene, b.spr, '!!', 0.6); }
      b.investida = Math.max(0, b.investida - dt);
      const v = (122 + tempo * 3.4) * (b.investida > 0 && b.investida < 0.5 ? 1.7 : b.investida > 0 ? 0.3 : 1);
      const dx = eu.x - b.x, dy = eu.y - b.y, dd = Math.hypot(dx, dy) || 1;
      b.x += dx / dd * v * dt; b.y += dy / dd * v * 0.85 * dt;
      b.dir = TR.dirFrom(dx, dy, b.dir);
      b.spr.setPosition(Math.round(b.x), Math.round(b.y)).setDepth(b.y);
      TR.HP.poseViz(b.spr, 'beudinha', b.dir, true);
      cel.setPosition(b.x + (b.dir === 'left' ? -18 : 18), b.y - 70).setDepth(b.y + 1);
      // a turma também corre dela
      outros.forEach((o) => {
        const ox = o.x - b.x, oy = o.y - b.y, od = Math.hypot(ox, oy) || 1;
        const fog = od < 220 ? 1 : 0.25;
        o.vx += (ox / od * 220 * fog - o.vx) * dt * 3; o.vy += (oy / od * 160 * fog - o.vy) * dt * 3;
        o.x = Phaser.Math.Clamp(o.x + o.vx * dt, 40, 920); o.y = Phaser.Math.Clamp(o.y + o.vy * dt, 296, 498);
        if (o.x <= 40 || o.x >= 920) o.vx = -o.vx; if (o.y <= 296 || o.y >= 498) o.vy = -o.vy;
        o.dir = TR.dirFrom(o.vx, o.vy, o.dir);
        o.spr.setPosition(Math.round(o.x), Math.round(o.y)).setDepth(o.y);
        TR.pose(o.spr, o.dir, Math.hypot(o.vx, o.vy) > 20);
      });
      const resta = Math.max(0, Math.ceil(DUR - tempo));
      TR.HP.objetivo(scene, 'FUJA DA BEUDINHA! Você está mancando...  ' + resta + 's');
      if (dd < 34) {
        fim = true; louvor.stop();
        TR.sfx(scene, 'tropeco', 0.6); scene.cameras.main.shake(200, 0.01);
        TR.bubble(scene, b.spr, 'PEGUEI!', 1.2);
        scene.time.delayedCall(900, falha);
      } else if (tempo >= DUR) {
        fim = true;
        eu.parado = true; TR.bubble(scene, eu.spr, 'Ufa...', 1.2);
        scene.time.delayedCall(700, ok);
      }
    });
  },

  // Cap. 3: filme de terror na casa do Cezar: não pode se assustar (Espaço na hora certa pra se segurar)
  susto(scene, ok, falha) {
    scene.add.image(0, 0, 'sala_cezar').setOrigin(0);
    const sof = TR.HP.turmaParada(scene, [['kaua', 352, 392, 0], ['pernalonga', 448, 392, 0], ['pedro', 544, 392, 0], ['cezar', 640, 392, 0]]);
    const assento = scene.add.graphics().setDepth(500);
    assento.fillStyle(0x6a5292, 1).fillRect(256, 356, 448, 18).fillStyle(0x4a3a6a, 1).fillRect(256, 374, 448, 30).fillStyle(0x7e64ac, 1).fillRect(256, 354, 448, 3);
    const tv = scene.add.rectangle(480, 270, 960, 540, 0x6080ff, 0.12).setDepth(1000).setBlendMode(Phaser.BlendModes.ADD);
    const mao = scene.add.graphics().setDepth(5);
    const flash = scene.add.rectangle(480, 270, 960, 540, 0xffffff, 0).setDepth(9000);
    const SUSTOS = 8;
    let feitos = 0, erros = 0, atual = null, fim = false;
    const vidas = () => TR.HP.objetivo(scene, 'Aguente o filme sem se assustar!  Coragem: ' + '♥'.repeat(3 - erros) + '·'.repeat(erros) + '   sustos: ' + feitos + '/' + SUSTOS);
    vidas();
    const dica = TR.txt(scene, 480, 500, '', 2, 0xffe08a).setOrigin(0.5).setDepth(9100);
    scene.time.delayedCall(400, () => TR.bubble(scene, sof.cezar, 'Relaxa, é de ação...', 1.8));
    const tipos = {
      pedro: { aviso: () => TR.bubble(scene, sof.pedro, '(respira fundo...)', 1.2), som: 'grito', fala: () => TR.bubble(scene, sof.pedro, 'AAAAAAAAH!', 1.2) },
      kaua: { aviso: () => { TR.bubble(scene, sof.kaua, 'psiu...', 1.1); scene.tweens.add({ targets: sof.kaua, x: 380, duration: 900 }); },
        som: 'susto', fala: () => { TR.bubble(scene, sof.kaua, 'BUUU! kkkkk', 1.2); scene.tweens.add({ targets: sof.kaua, x: 352, duration: 400, delay: 300 }); } },
      janela: { aviso: () => { mao.clear(); scene.tweens.addCounter({ from: 0, to: 1, duration: 1000, onUpdate: (tw) => {
        const v = tw.getValue(); mao.clear().fillStyle(0x05060c, 0.85 * v).fillRect(684, 210 - 70 * v, 40, 70 * v).fillRect(680, 210 - 80 * v, 8, 20).fillRect(692, 210 - 88 * v, 8, 24).fillRect(704, 210 - 84 * v, 8, 22);
      } }); },
        som: 'batida', fala: () => { TR.bubble(scene, [700, 120], 'TOC TOC TOC! VAI DORMIR, CEZAR!', 1.4); scene.time.delayedCall(900, () => mao.clear()); } },
      tv: { aviso: () => { scene.tweens.add({ targets: tv, alpha: 0.02, duration: 800 }); TR.musicaFundo.tocando.forEach((m) => { m.alvo = 0.03; }); },
        som: 'susto', fala: () => { tv.setAlpha(1).setFillStyle(0xff4040, 0.35); scene.time.delayedCall(250, () => tv.setFillStyle(0x6080ff, 0.12)); TR.musicaFundo.tocando.forEach((m) => { m.alvo = TR.musicaFundo.volume; }); } },
    };
    const proximo = () => {
      if (fim) return;
      if (feitos >= SUSTOS) { fim = true; TR.HP.objetivo(scene, 'Você aguentou o filme inteiro!'); TR.bubble(scene, sof.pernalonga, 'Nem tive medo... (mentira)', 1.8); return scene.time.delayedCall(1600, ok); }
      const tipo = Phaser.Utils.Array.GetRandom(Object.keys(tipos));
      const espera = Phaser.Math.Between(1400, 3200);
      scene.time.delayedCall(espera, () => {
        if (fim) return;
        const T = tipos[tipo];
        T.aviso();
        const aviso = 900 + Math.max(0, 700 - feitos * 80);   // fica mais rápido
        atual = { inicio: scene.time.now, janela: scene.time.now + aviso - 450, susto: scene.time.now + aviso, segurou: false, tipo };
        dica.setText('...');
        scene.time.delayedCall(aviso - 450, () => { if (atual && !atual.segurou) dica.setText('SEGURA! (Espaço)'); });
        scene.time.delayedCall(aviso, () => {
          TR.sfx(scene, T.som, 0.7); T.fala();
          flash.setAlpha(0.5); scene.tweens.add({ targets: flash, alpha: 0, duration: 250 });
          scene.cameras.main.shake(180, 0.008);
          scene.time.delayedCall(170, () => {
            if (!atual) return;
            const s = atual; atual = null; dica.setText('');
            if (s.segurou) { feitos++; TR.bubble(scene, sof.pernalonga, Phaser.Utils.Array.GetRandom(['Nem ligo.', 'Tranquilo...', 'Hmpf.']), 1); }
            else assustou();
            vidas(); proximo();
          });
        });
      });
    };
    const assustou = () => {
      erros++; feitos++;
      const p = sof.pernalonga;
      p.setFrame(TR.F.vergonha);
      scene.tweens.add({ targets: p, y: 350, yoyo: true, duration: 160, onComplete: () => p.setFrame(0) });
      TR.bubble(scene, p, 'AAAH!', 1);
      TR.sfx(scene, 'grito', 0.4, 1.3);
      if (erros >= 3) { fim = true; TR.HP.objetivo(scene, 'Você pulou do sofá! A turma não vai te deixar esquecer...'); scene.time.delayedCall(1200, falha); }
    };
    TR.HP.acao(scene, () => {
      if (!atual || atual.segurou || fim) return;
      if (scene.time.now >= atual.janela) { atual.segurou = true; dica.setText('Segurou!'); TR.sfx(scene, 'bip', 0.3); }
      else { const s = atual; atual = null; dica.setText('Cedo demais!'); assustou(); vidas(); scene.time.delayedCall(s.susto - scene.time.now + 300, proximo); }
    });
    TR.HP.noQuadro(scene, (tm) => { if (tv.alpha > 0.05) tv.setAlpha(0.1 + 0.05 * Math.sin(tm / 70) + 0.04 * Math.sin(tm / 23)); });
    scene.time.delayedCall(2200, proximo);
  },

  // Cap. 4: correr atrás do Matheus até ele entrar em casa
  perseguir(scene, ok) {
    TR.ruaComCeu(scene); TR.cicloDoDia(scene, () => 0.38);
    const eu = TR.HP.jogador(scene, 'pernalonga', 120, 430, { vel: 220 });
    const m = { x: 260, y: 400, spr: TR.kid(scene, 'matheus', 260, 400), dir: 'right', fuga: 0, t: 0 };
    const pontos = [[460, 470], [380, 320], [640, 330], [560, 480], [800, 440], [700, 310]];
    let alvo = 0, quase = 0, terminou = false;
    TR.HP.objetivo(scene, 'Corre atrás do Matheus!');
    TR.bubble(scene, m.spr, 'Hahaha! Pega eu!', 1.4);
    TR.HP.noQuadro(scene, (tm, d) => {
      if (terminou) return;
      const dt = Math.min(d, 50) / 1000;
      m.t += dt;
      eu.update(dt);
      const casa = m.t > 9;
      const [tx, ty] = casa ? [880, 286] : pontos[alvo];
      let dx = tx - m.x, dy = ty - m.y, dd = Math.hypot(dx, dy) || 1;
      if (dd < 20 && !casa) alvo = (alvo + 1) % pontos.length;
      const de = Math.hypot(eu.x - m.x, eu.y - m.y);
      if (de < 46 && m.fuga <= 0) { m.fuga = 0.6; quase++; TR.bubble(scene, m.spr, Phaser.Utils.Array.GetRandom(['Quase!', 'Hahaha!', 'Tá lento!']), 0.9); }
      m.fuga = Math.max(0, m.fuga - dt);
      const v = m.fuga > 0 ? 330 : 205;
      if (m.fuga > 0) { dx = m.x - eu.x; dy = m.y - eu.y; dd = Math.hypot(dx, dy) || 1; }
      m.x = Phaser.Math.Clamp(m.x + dx / dd * v * dt, 30, 930); m.y = Phaser.Math.Clamp(m.y + dy / dd * v * 0.8 * dt, 280, 500);
      m.dir = TR.dirFrom(dx, dy, m.dir);
      m.spr.setPosition(Math.round(m.x), Math.round(m.y)).setDepth(m.y);
      TR.pose(m.spr, m.dir, true);
      if (casa && Math.hypot(880 - m.x, 286 - m.y) < 16) {
        terminou = true;
        scene.tweens.add({ targets: m.spr, alpha: 0, y: m.spr.y - 10, duration: 300 });
        TR.HP.objetivo(scene, 'Ele entrou em casa!' + (quase ? '  (quase pegou ' + quase + 'x)' : ''));
        eu.parado = true;
        scene.time.delayedCall(500, () => TR.bubble(scene, eu.spr, 'KKKKKK que moleque doido!', 1.8));
        scene.time.delayedCall(2300, ok);
      }
    });
  },

  // Cap. 5: chamar o menino novo pra jogar e apresentar pro Pedro
  convite(scene, ok) {
    TR.ruaComCeu(scene); TR.cicloDoDia(scene, () => 0.3);
    scene.add.image(780, 300, 'caminhao').setOrigin(0.5, 1).setDepth(300);
    const eu = TR.HP.jogador(scene, 'pernalonga', 80, 440);
    const t = TR.HP.turmaParada(scene, [['guilherme', 640, 330], ['pedro', 230, 360], ['kaua', 170, 380], ['lucas', 300, 400]]);
    t.guilherme.setFrame(TR.F.esq);
    let etapa = 0, falando = false;
    TR.HP.objetivo(scene, 'Tem um menino novo na rua! Vá falar com ele (E)');
    const alvoDe = () => (etapa === 0 ? 'guilherme' : 'pedro');
    TR.HP.acao(scene, () => {
      if (falando) return;
      const id = alvoDe(), s = t[id];
      if (Math.hypot(s.x - eu.x, (s.y - eu.y) * 1.3) > 80) return;
      falando = true; eu.parado = true;
      if (etapa === 0) {
        TR.HP.dialogo(scene, [[eu.spr, 'E aí! Tu é novo aqui? Bora jogar bola?', 2], [t.guilherme, 'Bora! Sou o Guilherme.', 1.6], [eu.spr, 'Vem, vou te apresentar a turma!', 1.6]], () => {
          etapa = 1; falando = false; eu.parado = false;
          TR.HP.objetivo(scene, 'Leve o Guilherme até a turma e fale com o Pedro (E)');
          scene.tweens.add({ targets: t.guilherme, x: 330, y: 350, duration: 2600, onUpdate: () => TR.pose(t.guilherme, 'left', true), onComplete: () => TR.pose(t.guilherme, 'left', false) });
        });
      } else {
        TR.HP.dialogo(scene, [[t.pedro, 'Beleza, mas a bola é minha, então eu escolho o time!', 2.2], [t.guilherme, 'Ih, mal cheguei e já tá mandando?', 1.8],
          [t.pedro, 'Se reclamar eu levo a bola embora!', 1.8], [t.guilherme, 'Então leva!', 1.4], [t.kaua, 'Começou kkkkk', 1.4]], ok);
      }
    });
    TR.HP.noQuadro(scene, (tm, d) => {
      eu.update(Math.min(d, 50) / 1000);
      const s = t[alvoDe()];
      Object.values(t).forEach((o) => o.setTint(o === s && !falando && Math.hypot(s.x - eu.x, (s.y - eu.y) * 1.3) < 80 ? 0xfff0b0 : 0xffffff));
    });
  },
};

// ------------------------------------------------------------------ roteiro dos capítulos
(() => {
  const F = TR.F;
  const L = {   // posições de quadrinhos (tela 960x540, margem de 20)
    um: [[24, 24, 912, 492]],
    topo2: [[24, 24, 912, 232], [24, 280, 448, 236], [488, 280, 448, 236]],
    dois: [[24, 24, 448, 492], [488, 24, 448, 492]],
    quatro: [[24, 24, 448, 236], [488, 24, 448, 236], [24, 280, 448, 236], [488, 280, 448, 236]],
    tres: [[24, 24, 290, 492], [335, 24, 290, 492], [646, 24, 290, 492]],
  };
  const P = (lay, paineis) => ({ paineis: paineis.map((p, i) => Object.assign({ r: L[lay][i] }, p)) });
  const NOITE = 0x7080b0, TARDE = 0xffe2c4;

  TR.CAPITULOS = [
    {
      n: 1, herois: ['kaua', 'pernalonga'], titulo: 'A rua', cor: 0xd84a40, resumo: 'O dia em que eu subi a rua pela primeira vez.',
      passos: [
        { musica: 'm_rua', gibi: [
          P('topo2', [
            { bg: 'escola', cx: 480, cy: 300, z: 0.95, leg: '2019. Itaberá. Eu só saía de casa pra ir pra escola.',
              atores: [{ id: 'kaua', f: F.dir, x: 400, y: 392 }, { id: 'pernalonga', f: F.dir, x: 470, y: 396 }],
              baloes: [{ t: 'Mano, tu tem que colar lá na rua de tarde!', de: 0 }] },
            { bg: 'escola', cx: 470, cy: 300, z: 1.6, atores: [{ id: 'kaua', f: F.dir, x: 420, y: 392 }, { id: 'pernalonga', f: F.esq, x: 500, y: 396 }],
              baloes: [{ t: 'Que rua?', de: 1 }] },
            { bg: 'escola', cx: 440, cy: 300, z: 1.6, atores: [{ id: 'kaua', f: F.fala, x: 420, y: 392 }, { id: 'pernalonga', f: F.esq, x: 500, y: 396 }],
              baloes: [{ t: 'A minha! Tem futebol, queimada, esconde-esconde... a turma toda!', de: 0 }],
              leg: 'Até então, meus amigos eram só os da escola.', legBaixo: true },
          ]),
          P('dois', [
            { bg: 'rua', tint: TARDE, cx: 300, cy: 330, z: 1.0, leg: 'Naquela tarde, criei coragem e subi a rua.',
              atores: [{ id: 'pernalonga', f: F.costas, x: 300, y: 470, s: 1.2 }] },
            { bg: 'rua', tint: TARDE, cx: 520, cy: 330, z: 1.2, atores: [{ id: 'kaua', f: F.frente, x: 470, y: 380 }, { id: 'pedro', f: F.fala, x: 560, y: 360 }, { id: 'gabriel', x: 620, y: 400 }],
              baloes: [{ t: 'Ó ele aí! Chega mais!', de: 0 }] },
          ]),
        ] },
        { musica: 'm_rua', jogo: 'conhecer' },
        { musica: 'm_rua', gibi: [
          P('um', [{ bg: 'rua', tint: TARDE, cx: 480, cy: 340, z: 1.25, leg: 'E foi assim que eu conheci a turma.', legBaixo: true,
            atores: [{ id: 'kaua', x: 330, y: 420 }, { id: 'pedro', f: F.fala, x: 410, y: 400 }, { id: 'pernalonga', f: F.fala, x: 480, y: 430 }, { id: 'lucas', f: F.fala, x: 560, y: 405 }, { id: 'daniel', x: 630, y: 420 }, { id: 'gabriel', x: 700, y: 410 }],
            baloes: [{ t: 'Bora um golzinho?', de: 1 }, { t: 'Tu fica no meu time!', de: 3 }] }]),
        ] },
      ],
    },
    {
      n: 2, herois: ['cezar', 'beudinha'], titulo: 'A beudinha', cor: 0x3a7ad0, resumo: 'O dia em que conhecemos o Cezar (e a beudinha).',
      passos: [
        { musica: 'm_rua', gibi: [
          P('tres', [
            { bg: 'rua', tint: TARDE, cx: 260, cy: 360, z: 1.3, leg: 'Eu tinha acabado de tirar o gesso do pé esquerdo. Subia a rua meio mancando.',
              atores: [{ id: 'pernalonga', f: F.dir, x: 240, y: 440, ang: 4 }], fx: [{ tipo: 'linhas', x: 240, y: 400 }] },
            { bg: 'rua', tint: TARDE, cx: 520, cy: 360, z: 1.2, leg: 'Aí passou um moleque novo de bike. O que o Kauã tinha comentado na escola.',
              atores: [{ key: 'cezar_bike', f: 0, x: 560, y: 420 }, { id: 'pernalonga', f: F.dir, x: 420, y: 450 }], fx: [{ tipo: 'linhas', x: 520, y: 360 }],
              baloes: [{ t: 'É ele...', de: 1, tipo: 'pensa' }] },
            { bg: 'rua', tint: TARDE, cx: 700, cy: 370, z: 1.3, leg: 'A gente tava jogando quando apareceu ela.',
              atores: [{ id: 'beudinha', f: F.esq, x: 720, y: 430 }, { key: 'celular', x: 700, y: 360 }],
              baloes: [{ t: '♪ ♪ (louvor no último volume num celular de botão) ♪', de: 0, tipo: 'grito' }], som: 'louvor' },
          ]),
          P('quatro', [
            { bg: 'rua', tint: TARDE, cx: 520, cy: 360, z: 1.3, atores: [{ id: 'beudinha', f: F.esq, x: 600, y: 430 }, { id: 'pedro', f: F.dir, x: 460, y: 420 }],
              baloes: [{ t: 'Posso jogar com vocês?', de: 0 }, { t: 'Não, tia.', de: 1 }] },
            { bg: 'rua', tint: TARDE, cx: 480, cy: 360, z: 1.2, leg: 'Ela foi embora. Aí o Daniel tropeçou no nada.',
              atores: [{ id: 'beudinha', f: F.costas, x: 700, y: 400, s: 0.9 }, { id: 'daniel', f: F.abreDir, x: 420, y: 450, ang: 60 }], fx: [{ tipo: 'tremor', x: 420, y: 400 }],
              baloes: [{ t: 'Opa—', de: 1 }], som: 'tropeco' },
            { bg: 'rua', tint: TARDE, cx: 480, cy: 360, z: 1.2, atores: [{ id: 'pedro', f: F.fala, x: 360, y: 420 }, { id: 'lucas', f: F.fala, x: 460, y: 430 }, { id: 'kaua', f: F.fala, x: 560, y: 420 }, { id: 'beudinha', f: F.frente, x: 700, y: 400, s: 0.9 }],
              baloes: [{ t: 'KKKKKKKKK', de: 1, tipo: 'grito' }, { t: 'TÃO RINDO DE MIM?!', de: 3, tipo: 'grito' }], som: 'zoeira' },
            { bg: 'rua', tint: TARDE, cx: 520, cy: 370, z: 1.3, leg: 'E ela veio pra cima. E eu, mancando...',
              atores: [{ id: 'beudinha', f: F.esq, x: 640, y: 440, s: 1.1 }, { id: 'pernalonga', f: F.abreEsq, x: 430, y: 430 }], fx: [{ tipo: 'linhas', x: 700, y: 380 }], treme: true },
          ]),
        ] },
        { musica: 'm_jogo', jogo: 'fuga' },
        { musica: 'm_rua', gibi: [
          P('topo2', [
            { bg: 'rua', tint: TARDE, cx: 480, cy: 360, z: 1.05, leg: 'Foi aí que a gente conheceu o Cezar de verdade.',
              atores: [{ id: 'cezar', f: F.levantaDir, x: 440, y: 440 }, { key: 'pau', x: 470, y: 380, ang: 30 }, { id: 'beudinha', f: F.esq, x: 640, y: 430 },
                { id: 'kaua', f: F.abreDir, x: 260, y: 400 }, { id: 'pedro', f: F.abreDir, x: 330, y: 420 }],
              baloes: [{ t: 'CHEGA MAIS QUE EU TÔ ARMADO!', de: 0, tipo: 'grito' }, { t: 'O QUÊ?!', de: 3 }] },
            { bg: 'rua', tint: TARDE, cx: 630, cy: 280, z: 1.1, leg: 'Ela ficou tão brava que chutou a máquina que o Geraldo tava arrumando...',
              atores: [{ id: 'geraldo', f: F.sentado, x: 560, y: 330 }, { key: 'maquina', x: 640, y: 330 }, { id: 'beudinha', f: F.levantaDir, x: 700, y: 334, flip: true }],
              baloes: [{ t: 'PÁ!', de: 1, tipo: 'grito', dy: 30 }], som: 'chute' },
            { bg: 'rua', tint: TARDE, cx: 600, cy: 340, z: 1.2, leg: '...e caiu de costas com o próprio chute.',
              atores: [{ id: 'beudinha', f: F.frente, x: 640, y: 380, ang: -85 }, { id: 'geraldo', f: F.fala, x: 520, y: 330 }, { id: 'lucas', f: F.fala, x: 400, y: 440 }, { id: 'cezar', f: F.fala, x: 740, y: 450 }],
              baloes: [{ t: 'MINHA MÁQUINA!', de: 1 }, { t: 'KKKKKKKK', de: 2, tipo: 'grito' }], som: 'zoeira', treme: true },
          ]),
        ] },
      ],
      premio: 'Skin nova: você de gesso no pé esquerdo (sem habilidade, só estilo). Troque no mural do Barracão.',
    },
    {
      n: 3, herois: ['pedro', 'kaua'], titulo: 'Filme de terror', cor: 0x4a3a6a, resumo: 'Era pra ser um filme de ação.',
      passos: [
        { musica: 'm_esconde', gibi: [
          P('topo2', [
            { bg: 'sala_cezar', cx: 480, cy: 300, z: 0.95, leg: 'Uma noite, eu, o Kauã e o Pedro fomos ver filme na casa do Cezar.',
              atores: [{ id: 'kaua', x: 352, y: 392 }, { id: 'pernalonga', x: 448, y: 392 }, { id: 'pedro', x: 544, y: 392 }, { id: 'cezar', f: F.fala, x: 640, y: 392 }], fx: [{ tipo: 'sofa' }],
              baloes: [{ t: 'É de ação, confia.', de: 3 }] },
            { bg: 'sala_cezar', cx: 448, cy: 320, z: 2, atores: [{ id: 'pernalonga', x: 448, y: 392 }], fx: [{ tipo: 'sofa' }], baloes: [{ t: 'Ação, né...', de: 0, tipo: 'pensa' }] },
            { bg: 'sala_cezar', cx: 500, cy: 330, z: 1.6, leg: 'Não era de ação.', legBaixo: true, tint: 0x8090ff,
              atores: [{ id: 'pernalonga', f: F.vergonha, x: 448, y: 392 }, { id: 'pedro', f: F.vergonha2, x: 544, y: 392 }], fx: [{ tipo: 'sofa' }], som: 'susto', treme: true },
          ]),
        ] },
        { musica: 'm_esconde', jogo: 'susto' },
        { musica: 'm_fim', gibi: [
          P('um', [{ bg: 'rua', tint: NOITE, cx: 480, cy: 360, z: 1.2, leg: 'Depois, fomos brincar na rua... com as pernas bambas.', legBaixo: true,
            atores: [{ id: 'pedro', f: F.dir, x: 380, y: 420 }, { id: 'pernalonga', f: F.dir, x: 470, y: 430 }, { id: 'kaua', f: F.fala, x: 560, y: 420 }, { id: 'cezar', f: F.esq, x: 650, y: 430 }],
            fx: [{ tipo: 'tremor', x: 380, y: 400 }, { tipo: 'tremor', x: 470, y: 410 }],
            baloes: [{ t: 'Eu não gritei, tá?', de: 0 }, { t: 'Gritou sim kkkkk', de: 2 }] }]),
        ] },
      ],
    },
    {
      n: 4, herois: ['matheus'], titulo: 'O Matheus', cor: 0xe8b030, resumo: 'O moleque da areia.',
      passos: [
        { musica: 'm_rua', gibi: [
          P('tres', [
            { bg: 'rua', tint: TARDE, cx: 480, cy: 360, z: 1.3, leg: 'Um dia, apareceu um moleque de boné...',
              atores: [{ id: 'matheus', f: F.levantaDir, x: 420, y: 430 }, { id: 'pernalonga', f: F.esq, x: 560, y: 430 }], fx: [{ tipo: 'areia', x: 490, y: 360 }], som: 'areia' },
            { bg: 'rua', tint: TARDE, cx: 560, cy: 360, z: 1.8, atores: [{ id: 'pernalonga', f: F.vergonha, x: 560, y: 430 }], fx: [{ tipo: 'areia', x: 560, y: 340 }],
              baloes: [{ t: 'PFF! AREIA?!', de: 0, tipo: 'grito' }], treme: true },
            { bg: 'rua', tint: TARDE, cx: 480, cy: 360, z: 1.2, atores: [{ id: 'matheus', f: F.esq, x: 380, y: 430 }, { id: 'pernalonga', f: F.esq, x: 600, y: 430 }], fx: [{ tipo: 'linhas', x: 420, y: 380 }],
              baloes: [{ t: 'Hahaha!', de: 0 }, { t: 'VOLTA AQUI!', de: 1, tipo: 'grito' }] },
          ]),
        ] },
        { musica: 'm_jogo', jogo: 'perseguir' },
        { musica: 'm_rua', gibi: [
          P('tres', [
            { bg: 'rua', tint: TARDE, cx: 600, cy: 360, z: 1.2, leg: 'Ele correu pra casa. E eu comecei a rir sozinho.',
              atores: [{ id: 'pernalonga', f: F.fala, x: 600, y: 440 }], baloes: [{ t: 'KKKKKK que moleque doido', de: 0 }] },
            { bg: 'rua', tint: TARDE, cx: 860, cy: 300, z: 1.6, leg: 'No outro dia, ele voltou. Devagarinho.',
              atores: [{ id: 'matheus', f: F.frente, x: 880, y: 300, alpha: 0.9 }], baloes: [{ t: '...', de: 0 }] },
            { bg: 'rua', tint: TARDE, cx: 520, cy: 360, z: 1.2, leg: 'E começou a brincar com a gente.', legBaixo: true,
              atores: [{ id: 'matheus', f: F.fala, x: 460, y: 420 }, { id: 'kaua', f: F.fala, x: 560, y: 420 }, { id: 'pernalonga', x: 640, y: 430 }],
              baloes: [{ t: 'Posso jogar?', de: 0 }, { t: 'Pode, mas sem areia!', de: 1 }] },
          ]),
        ] },
      ],
      premio: 'Desbloqueado: Matheus! Ele já pode jogar todas as brincadeiras.',
    },
    {
      n: 5, herois: ['guilherme', 'pedro'], titulo: 'O Guilherme', cor: 0x48a860, resumo: 'O vizinho novo (e a treta com o Pedro).',
      passos: [
        { musica: 'm_rua', gibi: [
          P('dois', [
            { bg: 'rua', tint: TARDE, cx: 740, cy: 330, z: 1.1, leg: 'Um dia, chegou um caminhão de mudança na rua.',
              atores: [{ key: 'caminhao', x: 780, y: 300 }, { id: 'guilherme', f: F.esq, x: 630, y: 330 }] },
            { bg: 'rua', tint: TARDE, cx: 400, cy: 360, z: 1.3, atores: [{ id: 'lucas', f: F.fala, x: 360, y: 410 }, { id: 'pernalonga', f: F.dir, x: 450, y: 420 }],
              baloes: [{ t: 'Morador novo!', de: 0 }, { t: 'Vou lá chamar ele.', de: 1 }] },
          ]),
        ] },
        { musica: 'm_rua', jogo: 'convite' },
        { musica: 'm_jogo', gibi: [
          P('dois', [
            { bg: 'rua', tint: TARDE, cx: 480, cy: 380, z: 1.6, leg: 'Não demorou nem um dia pro Guilherme se irritar com o Pedro.',
              atores: [{ id: 'guilherme', f: F.fala, x: 440, y: 430 }, { id: 'pedro', f: F.fala, x: 520, y: 430, flip: true }],
              baloes: [{ t: 'Pedro, para de reclamar!', de: 0 }, { t: 'Vou levar minha bola embora!', de: 1 }] },
            { bg: 'rua', tint: TARDE, cx: 480, cy: 370, z: 1.0, leg: 'Mas desde então, a gente brinca junto.', legBaixo: true,
              atores: [{ id: 'guilherme', anim: 'guilherme_run_right', x: 380, y: 420 }, { id: 'pedro', anim: 'pedro_run_left', x: 560, y: 410 }, { key: 'bola', x: 470, y: 430 }, { id: 'pernalonga', anim: 'pernalonga_run_right', x: 300, y: 440 }] },
          ]),
        ] },
      ],
      premio: 'Desbloqueado: Guilherme! Ele já pode jogar todas as brincadeiras.',
    },
  ];
})();

// ------------------------------------------------------------------ a cena
class Historia extends Phaser.Scene {
  constructor() { super('Historia'); }

  create(data) {
    this._saindo = false;
    this._obj = null; this._objBg = null;   // a cena é reaproveitada a cada passo
    this.cameras.main.fadeIn(300, 18, 13, 24);
    this.cap = data && data.cap; this.passo = (data && data.passo) || 0;
    if (data && data.de) TR.historiaDe = data.de;
    if (!this.cap) return this.menu();
    const C = TR.CAPITULOS[this.cap - 1], P = C.passos[this.passo];
    this.input.keyboard.on('keydown-ESC', () => { if (P && P.jogo) this.menuSair(); });
    if (!P) return this.concluir(C);
    if (P.musica) TR.musicaFundo.tocar(this, P.musica);
    if (this.passo === 0 && !data.semCapa) return this.capa(C, () => this.scene.restart({ cap: this.cap, passo: 0, semCapa: true }));
    if (P.gibi) TR.gibi(this, P.gibi, () => this.proximo());
    else TR.HJ[P.jogo](this, () => this.proximo(), () => this.falhou(), P);
    if (P.jogo) TR.button(this, 890, 17, '‹ Sair (Esc)', () => this.menuSair(), { fixed: true, depth: 9600 });
  }

  proximo() {
    if (this._saindo) return;
    this._saindo = true;
    this.cameras.main.fadeOut(260, 18, 13, 24);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ cap: this.cap, passo: this.passo + 1, semCapa: true }));
  }

  falhou() {
    TR.panel(this, 480, 270, 440, 150, 9000);
    TR.txt(this, 480, 236, 'Não foi dessa vez!', 2, 0xffd36a).setOrigin(0.5).setDepth(9001);
    TR.button(this, 380, 300, 'Tentar de novo (Enter)', () => this.scene.restart({ cap: this.cap, passo: this.passo, semCapa: true }), { fixed: true, depth: 9002 });
    TR.button(this, 590, 300, 'Sair', () => this.menuSair(), { fixed: true, depth: 9002 });
    this.input.keyboard.once('keydown-ENTER', () => this.scene.restart({ cap: this.cap, passo: this.passo, semCapa: true }));
  }

  menuSair() { TR.go(this, 'Historia', {}); }

  // capa do gibi antes de começar
  capa(C, depois) {
    const g = this.add.graphics();
    g.fillStyle(0x120d18, 1).fillRect(0, 0, 960, 540);
    g.fillStyle(0x0c0810, 1).fillRect(330, 60, 300, 420); g.fillStyle(C.cor, 1).fillRect(336, 66, 288, 408);
    g.fillStyle(0xfff1d6, 1).fillRect(352, 82, 256, 54);
    TR.txt(this, 480, 92, 'A TURMA DA RUA', 1, 0xd84a40).setOrigin(0.5, 0);
    TR.txt(this, 480, 112, 'Capítulo ' + C.n, 1, 0x241a2c).setOrigin(0.5, 0);
    TR.txt(this, 480, 170, C.titulo, 3, 0xfff1d6).setOrigin(0.5, 0);
    TR.txt(this, 480, 420, C.resumo, 1, 0xfff1d6).setOrigin(0.5, 0).setMaxWidth(260);
    const herois = C.herois || ['kaua'];
    herois.forEach((id, i) => this.add.sprite(480 + (i - (herois.length - 1) / 2) * 90, 400, TR.KIDS[id] ? id : 'viz_' + id, TR.F.frente).setOrigin(0.5, 1).setScale(1.3));
    TR.sfx(this, 'pagina', 0.5);
    this.time.delayedCall(1900, depois);
    this.input.keyboard.once('keydown', depois);
  }

  concluir(C) {
    const novo = !TR.capFeito(C.n);
    TR.historia.feitos[C.n] = true; TR.salvaHistoria();
    TR.musicaFundo.tocar(this, 'm_fim', { loop: false, volume: 1.2 });
    this.add.rectangle(480, 270, 960, 540, 0x120d18);
    TR.panel(this, 480, 270, 620, 300, 100);
    TR.txt(this, 480, 150, 'FIM DO CAPÍTULO ' + C.n, 2, 0xffd36a).setOrigin(0.5).setDepth(101);
    TR.txt(this, 480, 190, C.titulo, 1, 0xfff1d6).setOrigin(0.5).setDepth(101);
    const linhas = [];
    if (C.premio) linhas.push(C.premio);
    if (TR.CAPITULOS[C.n]) linhas.push('Liberado: Capítulo ' + (C.n + 1) + ' (' + TR.CAPITULOS[C.n].titulo + ')');
    else linhas.push('Você terminou todas as histórias (por enquanto)!');
    TR.txt(this, 480, 230, linhas.join('\n\n'), 1, 0xf4e9d8).setOrigin(0.5, 0).setMaxWidth(560).setDepth(101).setCenterAlign();
    if (novo) TR.sfx(this, 'vitoria', 0.5);
    if (TR.CAPITULOS[C.n]) TR.button(this, 370, 380, 'Próximo capítulo (Enter)', () => TR.go(this, 'Historia', { cap: C.n + 1 }), { fixed: true, depth: 102 });
    TR.button(this, TR.CAPITULOS[C.n] ? 610 : 480, 380, 'Ver os gibis', () => TR.go(this, 'Historia', {}), { fixed: true, depth: 102 });
    this.input.keyboard.once('keydown-ENTER', () => TR.go(this, 'Historia', TR.CAPITULOS[C.n] ? { cap: C.n + 1 } : {}));
  }

  // estante de gibis: escolher o capítulo
  menu() {
    TR.musicaFundo.tocar(this, 'm_rua');
    this.add.image(0, 0, 'barracao_clube').setOrigin(0).setTint(0x8a7a90);
    TR.panel(this, 480, 280, 900, 440, 100);
    TR.txt(this, 480, 80, 'Modo história: os gibis da turma', 2, 0xffd36a).setOrigin(0.5).setDepth(101);
    TR.txt(this, 480, 112, '← → escolhe · Enter lê · Esc volta', 1, 0xc9b8d8).setOrigin(0.5).setDepth(101);
    this.sel = Math.max(0, TR.CAPITULOS.findIndex((c) => !TR.capFeito(c.n)));
    if (this.sel < 0) this.sel = 0;
    this.capas = TR.CAPITULOS.map((C, i) => {
      const x = 105 + i * 107, y = 270;
      const lib = TR.capLiberado(C.n), feito = TR.capFeito(C.n);
      const g = this.add.graphics().setDepth(102);
      g.fillStyle(0x0c0810, 1).fillRect(x - 48, y - 96, 96, 192);
      g.fillStyle(lib ? C.cor : 0x3a3040, 1).fillRect(x - 44, y - 92, 88, 184);
      g.fillStyle(0xfff1d6, 1).fillRect(x - 40, y - 84, 80, 22);
      if (!lib) { g.fillStyle(0x241a2c, 1).fillRect(x - 14, y - 4, 28, 22); g.lineStyle(4, 0x241a2c, 1).strokeCircle(x, y - 6, 9); }
      else this.add.sprite(x, y + 64, (C.herois || ['kaua'])[0], 0).setOrigin(0.5, 1).setScale(0.7).setDepth(103);
      TR.txt(this, x, y - 80, 'Cap. ' + C.n, 1, 0x241a2c).setOrigin(0.5, 0).setDepth(103);
      const nome = TR.txt(this, x, y - 52, lib ? C.titulo : '???', 1, 0xfff1d6).setOrigin(0.5, 0).setDepth(103).setMaxWidth(84).setCenterAlign();
      if (feito) TR.txt(this, x, y + 104, '✓ lido', 1, 0x7cf27c).setOrigin(0.5, 0).setDepth(103);
      else if (!lib) TR.txt(this, x, y + 104, 'trancado', 1, 0x8a7a96).setOrigin(0.5, 0).setDepth(103);
      const brilho = this.add.rectangle(x, y, 108, 204).setStrokeStyle(4, 0xffd36a).setDepth(101).setVisible(false);
      const zona = this.add.zone(x, y, 96, 192).setInteractive({ useHandCursor: true }).setDepth(104);
      zona.on('pointerover', () => this.escolhe(i));
      zona.on('pointerdown', () => { this.escolhe(i); this.abre(); });
      return { brilho, C, lib, nome };
    });
    this.resumo = TR.txt(this, 480, 420, '', 1, 0xf4e9d8).setOrigin(0.5, 0).setDepth(103);
    this.escolhe(this.sel);
    const n = this.capas.length;
    this.input.keyboard.on('keydown-LEFT', () => this.escolhe((this.sel + n - 1) % n));
    this.input.keyboard.on('keydown-RIGHT', () => this.escolhe((this.sel + 1) % n));
    this.input.keyboard.on('keydown-ENTER', () => this.abre());
    this.input.keyboard.on('keydown-SPACE', () => this.abre());
    this.input.keyboard.on('keydown-ESC', () => TR.go(this, TR.historiaDe || 'Rua'));
    TR.button(this, 480, 470, '‹ Voltar (Esc)', () => TR.go(this, TR.historiaDe || 'Rua'), { fixed: true, depth: 105 });
  }

  escolhe(i) {
    this.sel = i;
    this.capas.forEach((c, k) => c.brilho.setVisible(k === i));
    const c = this.capas[i];
    this.resumo.setText(c.lib ? c.C.resumo : 'Termine o capítulo ' + (c.C.n - 1) + ' pra liberar.');
    TR.sfx(this, 'hover', 0.2);
  }

  abre() {
    const c = this.capas[this.sel];
    if (!c.lib) { TR.sfx(this, 'derrota', 0.3); return; }
    TR.sfx(this, 'selecionar', 0.5);
    TR.go(this, 'Historia', { cap: c.C.n });
  }
}
