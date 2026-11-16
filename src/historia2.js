/*
 * Modo história, parte 2: capítulos 6 (a bola do Real Madrid), 7 (a bicicleta) e 8 (esconde-esconde à noite),
 * o passeio de bike pela cidade (usado na história e na brincadeira "Passeio de bike") e a cena Bike.
 */

// ------------------------------------------------------------------ passeio de bike pela cidade (3840 px de largura)
TR.animBike = (id) => (id === 'matheus' ? 'matheus_pedala' : id + '_pedala');
TR.passeio = (scene, o) => {
  const W = 3840, cam = scene.cameras.main;
  scene.add.image(0, 0, 'cidade').setOrigin(0).setDepth(-5);
  cam.setBounds(0, 0, W, 540);
  const k = scene.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D');
  scene.input.keyboard.on('keydown-SPACE', () => TR.sfx(scene, 'campainha', 0.4));
  const eu = { id: o.quem, x: o.x0, y: 420, v: 200, inv: 0, tombos: 0, andou: 0 };
  eu.spr = scene.add.sprite(eu.x, eu.y, o.quem + '_bike', 0).setOrigin(0.5, 0.97).play(TR.animBike(o.quem));
  const amigos = (o.amigos || []).map((id, i) => ({ id, dx: i ? 140 : -110, dy: i % 2 ? -40 : 40, x: o.x0 + (i ? 140 : -110), y: 420,
    spr: scene.add.sprite(0, 0, id + '_bike', 0).setOrigin(0.5, 0.97).play(TR.animBike(id)) }));
  // obstáculos: buraco, cone, poça e o Caramelo atravessando
  const obs = [];
  const gera = (de, ate) => {
    obs.forEach((b) => b.g.destroy()); obs.length = 0;
    for (let x = de + 420; x < ate - 150; x += Phaser.Math.Between(170, 280) / (o.densidade || 1)) {
      const tipo = Phaser.Utils.Array.GetRandom(['buraco', 'buraco', 'cone', 'poca', 'cachorro']);
      const y = Phaser.Math.Between(300, 490);
      let g;
      if (tipo === 'cachorro') g = scene.add.sprite(x, 290, 'caramelo').setScale(2).setOrigin(0.5, 1).play('caramelo_anda');
      else {
        g = scene.add.graphics().setPosition(x, y);
        if (tipo === 'buraco') g.fillStyle(0x2a2622, 1).fillEllipse(0, 0, 44, 16).fillStyle(0x46403a, 1).fillEllipse(0, -2, 36, 10);
        if (tipo === 'poca') g.fillStyle(0x5a7aa0, 0.9).fillEllipse(0, 0, 60, 16).fillStyle(0xa0c0e0, 0.7).fillEllipse(-8, -2, 20, 5);
        if (tipo === 'cone') g.fillStyle(0x241a2c, 1).fillTriangle(-12, 2, 12, 2, 0, -34).fillStyle(0xff7a20, 1).fillTriangle(-9, 0, 9, 0, 0, -30).fillStyle(0xffffff, 1).fillRect(-5, -16, 10, 4);
      }
      g.setDepth(tipo === 'cone' ? y : 3);
      obs.push({ tipo, x, y, g, vy: tipo === 'cachorro' ? Phaser.Math.Between(60, 110) : 0 });
    }
  };
  gera(o.x0, o.x1);
  const p = { eu, amigos, gera, parado: false };
  TR.HP.noQuadro(scene, (tm, d) => {
    const dt = Math.min(d, 50) / 1000;
    if (!p.parado) {
      const alvo = (k.RIGHT.isDown || k.D.isDown ? 360 : k.LEFT.isDown || k.A.isDown ? 110 : 240) * (o.turbo || 1);
      eu.v += (alvo - eu.v) * Math.min(1, dt * 2.5);
      eu.y = Phaser.Math.Clamp(eu.y + ((k.DOWN.isDown || k.S.isDown ? 1 : 0) - (k.UP.isDown || k.W.isDown ? 1 : 0)) * 200 * dt, 300, 495);
      eu.x += eu.v * dt; eu.andou += eu.v * dt;
    }
    eu.inv = Math.max(0, eu.inv - dt);
    obs.forEach((b) => {
      if (b.tipo === 'cachorro') { b.y += b.vy * dt; if (b.y > 500) { b.y = 290; } b.g.setPosition(b.x, b.y).setDepth(b.y); }
      if (eu.inv <= 0 && !p.parado && Math.abs(b.x - eu.x) < (b.tipo === 'poca' ? 30 : 24) && Math.abs(b.y - eu.y) < 16) {
        eu.inv = 1.2; eu.tombos++; eu.v = 50;
        TR.sfx(scene, b.tipo === 'poca' ? 'quique' : 'tropeco', 0.5); cam.shake(160, 0.006);
        TR.bubble(scene, eu.spr, Phaser.Utils.Array.GetRandom(b.tipo === 'cachorro' ? ['Sai, Caramelo!', 'Quase!'] : ['Opa!', 'Eita!', 'Ai!']), 0.9);
      }
    });
    eu.spr.setPosition(Math.round(eu.x), Math.round(eu.y + (eu.inv > 0 ? Math.sin(tm / 40) * 3 : 0))).setDepth(eu.y).setAlpha(eu.inv > 0 && Math.floor(tm / 90) % 2 ? 0.6 : 1);
    eu.spr.anims.timeScale = Math.max(0.2, eu.v / 240);
    amigos.forEach((a) => {
      a.x += (eu.x + a.dx - a.x) * Math.min(1, dt * 2.2); a.y += (Phaser.Math.Clamp(eu.y + a.dy, 300, 495) - a.y) * Math.min(1, dt * 1.5);
      a.spr.setPosition(Math.round(a.x), Math.round(a.y)).setDepth(a.y);
      a.spr.anims.timeScale = Math.max(0.2, eu.v / 240);
    });
    cam.scrollX = Phaser.Math.Clamp(eu.x - 320, 0, W - 960);
    if (o.cadaQuadro) o.cadaQuadro(eu, dt);
  });
  return p;
};

// ------------------------------------------------------------------ partes jogáveis novas
Object.assign(TR.HJ, {
  // Cap. 6: pegar as bolas do quintal e levar até o portão (pra dividir na casa do Lucas)
  bolas(scene, ok) {
    scene.add.image(0, 0, 'quintal').setOrigin(0);
    const eu = TR.HP.jogador(scene, 'pernalonga', 120, 400, { limites: [30, 236, 900, 520] });
    const SAIDA = { x: 900, y: 380 };
    const lucas = TR.kid(scene, 'lucas', 920, 360).setDepth(360).setFrame(TR.F.esq);
    const bolas = [];
    const especiais = { 3: 'bola_branca', 9: 'bola_azul' };
    for (let i = 0; i < 18; i++) {
      const x = Phaser.Math.Between(80, 820), y = Phaser.Math.Between(250, 510);
      const key = especiais[i] || 'bola';
      const s = scene.add.sprite(x, y, key, 0).setScale(2).setDepth(y);
      if (!especiais[i]) s.setTint(Phaser.Utils.Array.GetRandom([0xffffff, 0xffd0a0, 0xa0c8ff, 0xffa0a0, 0xc0ffa0]));
      bolas.push({ x, y, s, dono: null, entregue: false, alvoDe: null });
    }
    const ajudantes = ['pedro', 'kaua', 'daniel'].map((id, i) => ({ id, x: 160 + i * 40, y: 300 + i * 70, spr: TR.kid(scene, id, 160, 300), leva: [], alvo: null, dir: 'right' }));
    eu.leva = [];
    let entregues = 0;
    const total = bolas.length;
    const hud = () => TR.HP.objetivo(scene, 'Pegue as bolas e leve pro portão (até 3 por vez)  ' + entregues + '/' + total);
    hud();
    TR.bubble(scene, lucas, 'Joga tudo aqui! Lá em casa a gente divide!', 2);
    const entrega = (quem) => {
      quem.leva.forEach((b) => { b.entregue = true; b.s.setVisible(false); entregues++; });
      if (quem.leva.length) TR.sfx(scene, 'pegar', 0.4);
      quem.leva = []; hud();
      if (entregues >= total && !scene._acabou) {
        scene._acabou = true;
        eu.parado = true;
        TR.HP.dialogo(scene, [[lucas, 'Bora pra minha casa dividir!', 1.6], [ajudantes[0].spr, 'A branca do Real Madrid é minha, hein!', 1.8]], ok);
      }
    };
    const pega = (quem) => {
      if (quem.leva.length >= 3) return;
      const b = bolas.find((q) => !q.dono && !q.entregue && Math.hypot(q.x - quem.x, (q.y - quem.y) * 1.2) < 26);
      if (b) { b.dono = quem; quem.leva.push(b); TR.sfx(scene, 'quique', 0.3); }
    };
    const mostraLeva = (quem, spr) => quem.leva.forEach((b, i) => b.s.setPosition(spr.x, spr.y - 142 - i * 14).setDepth(spr.y + 1));
    TR.HP.noQuadro(scene, (tm, d) => {
      const dt = Math.min(d, 50) / 1000;
      eu.update(dt);
      pega(eu);
      if (Math.hypot(eu.x - SAIDA.x, eu.y - SAIDA.y) < 80) entrega(eu);
      mostraLeva(eu, eu.spr);
      ajudantes.forEach((a) => {
        if (a.leva.length >= 2 || (a.leva.length && !bolas.some((b) => !b.dono && !b.entregue))) a.alvo = SAIDA;
        else if (!a.alvo || a.alvo === SAIDA || a.alvo.dono) {
          const livres = bolas.filter((b) => !b.dono && !b.entregue && !ajudantes.some((o) => o !== a && o.alvo === b));
          livres.sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y));
          a.alvo = livres[0] || (a.leva.length ? SAIDA : null);
        }
        if (a.alvo) {
          const dx = a.alvo.x - a.x, dy = a.alvo.y - a.y, dd = Math.hypot(dx, dy) || 1;
          if (dd > 6) { a.x += dx / dd * 120 * dt; a.y += dy / dd * 100 * dt; a.dir = TR.dirFrom(dx, dy, a.dir); }
          if (a.alvo === SAIDA && dd < 70) { entrega(a); a.alvo = null; }
        }
        pega(a);
        a.spr.setPosition(Math.round(a.x), Math.round(a.y)).setDepth(a.y);
        TR.pose(a.spr, a.dir, !!a.alvo);
        mostraLeva(a, a.spr);
      });
    });
  },

  // Cap. 6: o Pedro chorando querendo a bola azul: empurra ele (Espaço) quando ele chegar perto
  empurra(scene, ok) {
    TR.ruaComCeu(scene); TR.cicloDoDia(scene, () => 0.5);
    const eu = TR.HP.jogador(scene, 'pernalonga', 620, 420, { limites: [440, 300, 900, 500], vel: 150 });
    const bola = scene.add.image(0, 0, 'bola_azul').setScale(2);
    const pe = { x: 180, y: 420, spr: TR.kid(scene, 'pedro', 180, 420), volta: 0, fim: false };
    const anel = scene.add.graphics().setDepth(9000);
    const META = 5;
    let empurroes = 0, investida = false;
    const hud = () => TR.HP.objetivo(scene, 'O Pedro quer a bola! Aperte ESPAÇO quando ele chegar perto pra empurrar  ' + empurroes + '/' + META);
    hud();
    TR.bubble(scene, pe.spr, 'ME DÁ MINHA BOLA!', 1.6);
    TR.sfx(scene, 'choro', 0.5);
    scene.time.addEvent({ delay: 2600, loop: true, callback: () => { if (!investida) { TR.bubble(scene, pe.spr, Phaser.Utils.Array.GetRandom(['ME DÁ!', 'É MINHA!', 'Eu escolhi primeiro!', 'Buáááá!']), 1.2); TR.sfx(scene, 'choro', 0.3); } } });
    TR.HP.acao(scene, () => {
      if (investida || pe.fim) return;
      const d = Math.hypot(pe.x - eu.x, (pe.y - eu.y) * 1.3);
      eu.spr.setFrame(eu.x > pe.x ? TR.F.lancaDir + 8 : TR.F.lancaDir);
      if (d < 95 && pe.volta <= 0) {
        empurroes++; hud();
        TR.sfx(scene, 'pulo', 0.5, 0.8);
        pe.volta = 0.5;
        scene.tweens.add({ targets: pe, x: Math.max(60, pe.x - 190), duration: 380, ease: 'Quad.Out' });
        TR.bubble(scene, eu.spr, Phaser.Utils.Array.GetRandom(['Sai, Pedro!', 'Tu já tem bola!', 'Para!']), 0.9);
        if (empurroes >= META) {
          investida = true;
          scene.time.delayedCall(700, () => { TR.bubble(scene, pe.spr, 'AAAAAAAAH!', 1.2); TR.sfx(scene, 'grito', 0.6); });
        }
      }
    });
    TR.HP.noQuadro(scene, (tm, d) => {
      if (pe.fim) return;
      const dt = Math.min(d, 50) / 1000;
      eu.update(dt);
      bola.setPosition(eu.spr.x + 20, eu.spr.y - 64).setDepth(eu.y + 1);
      pe.volta = Math.max(0, pe.volta - dt);
      const dx = eu.x - pe.x, dy = eu.y - pe.y, dd = Math.hypot(dx, dy) || 1;
      if (investida && !pe._t) pe._t = scene.time.delayedCall(1300, () => { pe._largou = true; });   // respira... e vem desgovernado
      if (pe.volta <= 0 && (!investida || pe._largou)) {
        const v = investida ? 520 : 120 + empurroes * 18;
        pe.x += dx / dd * v * dt; pe.y += dy / dd * v * 0.8 * dt;
      }
      pe.spr.setPosition(Math.round(pe.x), Math.round(pe.y)).setDepth(pe.y);
      TR.pose(pe.spr, TR.dirFrom(dx, dy, 'right'), pe.volta <= 0);
      anel.clear();
      if (!investida && dd < 140) anel.lineStyle(3, dd < 95 ? 0xffd36a : 0x8a7a96, 0.9).strokeEllipse(eu.x, eu.y - 4, 150, 60);
      if (dd < 30) {
        if (investida) {
          pe.fim = true;
          TR.sfx(scene, 'soco', 0.9); scene.cameras.main.flash(200, 255, 255, 255); scene.cameras.main.shake(300, 0.02);
          scene.time.delayedCall(500, ok);
        } else {   // ele chegou: puxa a bola, mas leva um empurrão sem contar
          pe.volta = 0.6; scene.tweens.add({ targets: pe, x: Math.max(60, pe.x - 110), duration: 300 });
          TR.bubble(scene, pe.spr, 'Larga!', 0.8); scene.cameras.main.shake(120, 0.006);
        }
      }
    });
  },

  // Cap. 7: o passeio de bike (fase 1: até a escola; fase 2: fugindo do professor até a casa do Kauã)
  pedalar(scene, ok, falha, P) {
    const fase = P.fase || 1;
    const x0 = fase === 1 ? 140 : 1720, x1 = fase === 1 ? 1650 : 3560;
    const prof = scene.add.sprite(1690, 260, 'viz_professor', 0).setOrigin(0.5, 0.97).setDepth(260);
    if (fase === 1) prof.play('viz_professor_idle');
    const pas = TR.passeio(scene, { quem: 'pernalonga', amigos: ['kaua', 'cezar'], x0, x1, turbo: fase === 2 ? 1.2 : 1, densidade: fase === 2 ? 1.3 : 1,
      cadaQuadro: (eu) => {
        if (fase === 2) { prof.x = Math.min(prof.x + 0.6, eu.x - 200); TR.HP.poseViz(prof, 'professor', 'right', true); }
        if (!pas || pas.parado) return;
        const resta = Math.max(0, Math.round((x1 - eu.x) / 10));
        TR.HP.objetivo(scene, (fase === 1 ? 'Pedale com a turma pela cidade' : 'FOGE! Pedale até a casa do Kauã') + '  (setas · Espaço: campainha)  ' + resta + 'm');
        if (eu.x >= x1 - 60) { pas.parado = true; scene.time.delayedCall(400, ok); }
      } });
    scene.cameras.main.scrollX = x0 - 320;
    if (fase === 2) { scene.time.delayedCall(500, () => TR.bubble(scene, prof, 'Ô, meninos! Esperem!', 1.6)); TR.bubble(scene, pas.amigos[0].spr, 'FOGE!!!', 1.2); }
    else TR.bubble(scene, pas.amigos[1].spr, 'Bora até a praça!', 1.6);
  },

  // Cap. 8: esconde-esconde à noite: o Kauã corre pra se esconder e escorrega na areia da obra
  escorrega(scene, ok) {
    TR.ruaComCeu(scene); TR.cicloDoDia(scene, () => 0.96);
    const areia = scene.add.graphics().setDepth(3);
    for (let i = 0; i < 900; i++) areia.fillStyle([0xc8b080, 0xb89c6c, 0xd8c294][i % 3], 1).fillRect(Phaser.Math.Between(440, 560), Phaser.Math.Between(282, 500), 4, 3);
    const carro = scene.add.image(830, 470, 'obj_carro').setOrigin(0.5, 1).setDepth(470);
    const pedro = TR.kid(scene, 'pedro', 120, 262).setDepth(262).setFrame(TR.F.costas);
    const kaua = TR.HP.jogador(scene, 'kaua', 170, 420, { vel: 230, limites: [30, 280, 930, 500] });
    let n = 0, caiu = false;
    TR.HP.objetivo(scene, 'Você é o Kauã! Corre e se esconde atrás do carro!');
    const conta = scene.time.addEvent({ delay: 900, loop: true, callback: () => { if (!caiu) TR.bubble(scene, pedro, ++n + '...', 0.7); } });
    const farol = scene.add.ellipse(960, 300, 10, 10, 0xfff0b0, 0).setDepth(9000).setBlendMode(Phaser.BlendModes.ADD);
    TR.HP.noQuadro(scene, (tm, d) => {
      const dt = Math.min(d, 50) / 1000;
      kaua.update(dt);
      if (!caiu && kaua.x > 450 && kaua.x < 550) {
        caiu = true; kaua.parado = true; conta.remove();
        TR.sfx(scene, 'tropeco', 0.7);
        scene.tweens.add({ targets: kaua.spr, angle: 85, x: kaua.x + 40, duration: 350, ease: 'Quad.Out' });
        TR.bubble(scene, kaua.spr, 'AAAI!', 1);
        const cam = scene.cameras.main;
        scene.time.delayedCall(700, () => {
          TR.sfx(scene, 'caminhao', 0.6);
          scene.tweens.add({ targets: farol, alpha: 0.7, width: 160, height: 90, duration: 900 });
          TR.bubble(scene, pedro, 'CAMINHÃO!!!', 1.4);
          cam.pan(kaua.x, kaua.y - 60, 500, 'Sine.easeInOut'); cam.zoomTo(2.2, 500, 'Sine.easeInOut');
        });
        scene.time.delayedCall(2300, () => {
          const cl = scene.add.image(1100, 300, 'caminhao_lixo').setScale(0.22).setOrigin(0.5, 1).setDepth(300).setFlipX(true);
          scene.tweens.add({ targets: cl, x: 935, duration: 2600 });
          cam.zoomTo(1, 700, 'Sine.easeInOut'); cam.pan(700, 270, 700, 'Sine.easeInOut');
          const t = TR.txt(scene, 480, 140, '...MAS O CAMINHÃO TAVA LÁ LONGE', 2, 0xffe08a).setOrigin(0.5).setDepth(9500).setScrollFactor(0).setAlpha(0);
          scene.tweens.add({ targets: t, alpha: 1, delay: 900, duration: 300 });
          scene.time.delayedCall(1400, () => { TR.bubble(scene, pedro, 'KKKKKKKKKKK', 1.6); TR.sfx(scene, 'zoeira', 0.5); });
          scene.time.delayedCall(4200, ok);
        });
      }
    });
  },
});

// ------------------------------------------------------------------ capítulos 6, 7 e 8
(() => {
  const F = TR.F;
  const L = {
    dois: [[24, 24, 448, 492], [488, 24, 448, 492]],
    quatro: [[24, 24, 448, 236], [488, 24, 448, 236], [24, 280, 448, 236], [488, 280, 448, 236]],
    tres: [[24, 24, 290, 492], [335, 24, 290, 492], [646, 24, 290, 492]],
    topo2: [[24, 24, 912, 232], [24, 280, 448, 236], [488, 280, 448, 236]],
    novela: [[24, 24, 448, 236], [488, 24, 448, 236], [24, 280, 290, 236], [335, 280, 290, 236], [646, 280, 290, 236]],
  };
  const P = (lay, paineis) => ({ paineis: paineis.map((p, i) => Object.assign({ r: L[lay][i] }, p)) });
  const NOITE = 0x7080b0, TARDE = 0xffe2c4, PARADO = 0x9a9aa8;

  TR.CAPITULOS.push(
    {
      n: 6, herois: ['pedro', 'lucas'], titulo: 'A bola do Real', cor: 0x9a6ad0, resumo: 'O quintal cheio de bola, o portão e o soco.',
      passos: [
        { musica: 'm_rua', gibi: [
          P('dois', [
            { bg: 'rua', tint: TARDE, cx: 500, cy: 380, z: 1.2, leg: 'Um dia, alguém descobriu uma casa com o quintal cheio de bola velha.',
              atores: [{ id: 'pedro', f: F.fala, x: 420, y: 430 }, { id: 'kaua', f: F.dir, x: 520, y: 440 }, { id: 'pernalonga', f: F.dir, x: 600, y: 430 }],
              fx: [{ tipo: 'linhas', x: 520, y: 380 }], baloes: [{ t: 'Tem bola de montão lá, bora!', de: 0 }] },
            { bg: 'quintal', cx: 480, cy: 360, z: 1.0, leg: 'E era bola pra todo lado.',
              atores: [{ id: 'pedro', f: F.costas, x: 400, y: 500 }, { id: 'pernalonga', f: F.costas, x: 480, y: 510 }, { id: 'lucas', f: F.costas, x: 560, y: 500 },
                { key: 'bola_branca', x: 300, y: 330, s: 2 }, { key: 'bola_azul', x: 640, y: 300, s: 2 }],
              baloes: [{ t: 'Leva tudo pra minha casa! Lá a gente divide!', de: 2 }] },
          ]),
        ] },
        { musica: 'm_jogo', jogo: 'bolas' },
        { musica: 'm_rua', gibi: [
          P('quatro', [
            { bg: 'rua', tint: TARDE, cx: 180, cy: 230, z: 1.3, leg: 'Levamos tudo pra casa do Lucas pra dividir.',
              atores: [{ id: 'lucas', f: F.fala, x: 120, y: 258 }, { key: 'bola', x: 170, y: 254, s: 2 }, { key: 'bola', x: 190, y: 250, s: 2 }, { key: 'bola_branca', x: 210, y: 256, s: 2 }, { key: 'bola', x: 230, y: 252, s: 2 }, { id: 'pedro', f: F.esq, x: 280, y: 262 }] },
            { bg: 'rua', tint: TARDE, cx: 480, cy: 330, z: 1.8, atores: [{ id: 'pedro', f: F.levantaDir, x: 440, y: 400 }, { id: 'lucas', f: F.levantaDir, x: 530, y: 400, flip: true }, { key: 'bola_branca', x: 485, y: 340, s: 3 }],
              baloes: [{ t: 'Essa do Real Madrid é minha!', de: 0 }, { t: 'Eu vi primeiro!', de: 1 }] },
            { bg: 'rua', tint: TARDE, cx: 168, cy: 200, z: 1.6, leg: 'O Lucas se irritou e fechou o portão na cara do Pedro.',
              atores: [{ id: 'pedro', f: F.vergonha, x: 168, y: 262 }], fx: [{ tipo: 'impacto', x: 168, y: 170 }], baloes: [{ t: 'BLAM!', de: 0, tipo: 'grito' }], som: 'batida', treme: true },
            { bg: 'rua', tint: TARDE, cx: 560, cy: 330, z: 1.6, leg: 'E a bola que o Pedro tinha escolhido antes, a do PSG... eu peguei.', legBaixo: true,
              atores: [{ id: 'pernalonga', f: F.fala, x: 560, y: 400 }, { key: 'bola_azul', x: 590, y: 340, s: 3 }], baloes: [{ t: 'Essa fica comigo.', de: 0 }] },
          ]),
          P('dois', [
            { bg: 'rua', tint: TARDE, cx: 480, cy: 330, z: 1.9, leg: 'Ele ficou bravo e começou a chorar, pedindo a bola...',
              atores: [{ id: 'pedro', f: F.fala, x: 480, y: 400 }], fx: [{ tipo: 'lagrimas', x: 480, y: 340 }], baloes: [{ t: 'ME DÁ MINHA BOLA!', de: 0, tipo: 'grito' }], som: 'choro' },
            { bg: 'rua', tint: TARDE, cx: 480, cy: 360, z: 1.3, leg: '...sendo que ele já tinha uma bola. A que a gente tava jogando antes!', legBaixo: true,
              atores: [{ id: 'pedro', f: F.dir, x: 400, y: 430 }, { key: 'bola', x: 430, y: 430, s: 2 }, { id: 'pernalonga', f: F.esq, x: 560, y: 430 }, { key: 'bola_azul', x: 540, y: 370, s: 2 }],
              baloes: [{ t: 'Tu já tem bola, Pedro!', de: 2 }] },
          ]),
        ] },
        { musica: 'm_esconde', jogo: 'empurra' },
        { musica: 'm_esconde', gibi: [
          P('novela', [
            { bg: 'rua', tint: TARDE, cx: 480, cy: 360, z: 1.3, leg: 'Numa dessas, ele veio pra cima de mim, desgovernado...',
              atores: [{ id: 'pedro', f: F.abreDir, x: 380, y: 430 }, { id: 'pernalonga', f: F.esq, x: 600, y: 430 }], fx: [{ tipo: 'raios', x: 380, y: 360 }], baloes: [{ t: 'AAAAAAAH!', de: 0, tipo: 'grito' }] },
            { bg: 'rua', tint: TARDE, cx: 500, cy: 360, z: 1.6, atores: [{ id: 'pedro', f: F.levantaDir, x: 470, y: 430 }, { id: 'pernalonga', f: F.vergonha, x: 540, y: 430 }],
              fx: [{ tipo: 'impacto', x: 520, y: 330 }], baloes: [{ t: 'POW!', de: 1, tipo: 'grito' }], som: 'soco', treme: true },
            { bg: 'rua', tint: TARDE, cx: 540, cy: 372, z: 2.4, leg: '(close de novela)', atores: [{ id: 'pernalonga', f: F.frente, x: 540, y: 430 }], som: 'drama' },
            { bg: 'rua', tint: TARDE, cx: 540, cy: 366, z: 3.6, atores: [{ id: 'pernalonga', f: F.frente, x: 540, y: 430 }], fx: [{ tipo: 'raios', x: 540, y: 366 }] },
            { bg: 'rua', tint: TARDE, cx: 540, cy: 362, z: 5.5, atores: [{ id: 'pernalonga', f: F.frente, x: 540, y: 430 }], treme: true },
          ]),
          P('quatro', [
            { bg: 'rua', tint: PARADO, cx: 480, cy: 360, z: 1.2, leg: 'Meu mundo parou por 2 segundos.',
              atores: [{ id: 'pedro', f: F.levantaDir, x: 440, y: 430, semTint: false }, { id: 'pernalonga', f: F.abreEsq, x: 540, y: 430 }, { key: 'bola_azul', x: 560, y: 360, s: 2 }] },
            { bg: 'rua', tint: TARDE, cx: 800, cy: 420, z: 1.5, leg: 'Deixei a bola rolar ladeira abaixo...',
              atores: [{ key: 'bola_azul', x: 830, y: 470, s: 2 }], fx: [{ tipo: 'linhas', x: 820, y: 470 }] },
            { bg: 'rua', tint: TARDE, cx: 520, cy: 330, z: 1.8, atores: [{ id: 'pernalonga', f: F.fala, x: 520, y: 420 }],
              baloes: [{ t: 'VOCÊ É UM EGOÍSTA! ENGOLE ESSA BOLA TAMBÉM!', de: 0, tipo: 'grito' }], treme: true },
            { bg: 'rua', tint: TARDE, cx: 480, cy: 360, z: 1.2, leg: 'Depois disso, ficamos um tempão sem se falar.', legBaixo: true,
              atores: [{ id: 'pedro', f: F.esq, x: 360, y: 420 }, { id: 'pernalonga', f: F.dir, x: 620, y: 420 }] },
          ]),
        ] },
      ],
    },
    {
      n: 7, herois: ['kaua', 'cezar'], titulo: 'A bicicleta', cor: 0x2a9ac0, resumo: 'O passeio, o professor e o banco torto.',
      passos: [
        { musica: 'm_rua', gibi: [
          P('dois', [
            { bg: 'cidade', cx: 300, cy: 380, z: 1.0, leg: 'Um dia, eu, o Kauã e o Cezar saímos de bike pela cidade.',
              atores: [{ key: 'cezar_bike', x: 170, y: 420 }, { key: 'pernalonga_bike', x: 290, y: 450 }, { key: 'kaua_bike', x: 400, y: 430 }], fx: [{ tipo: 'linhas', x: 150, y: 400 }] },
            { bg: 'cidade', cx: 300, cy: 360, z: 1.7, atores: [{ key: 'cezar_bike', x: 230, y: 420 }, { key: 'kaua_bike', x: 360, y: 430 }],
              baloes: [{ t: 'Bora até a praça!', de: 0 }, { t: 'Bora!', de: 1 }] },
          ]),
        ] },
        { musica: 'm_jogo', jogo: 'pedalar', fase: 1 },
        { musica: 'm_rua', gibi: [
          P('dois', [
            { bg: 'cidade', cx: 1660, cy: 300, z: 1.4, leg: 'Aí, do nada, a gente viu um professor.',
              atores: [{ id: 'professor', f: F.fala, x: 1690, y: 260 }], baloes: [{ t: 'Opa, meninos! Tudo bem?', de: 0 }] },
            { bg: 'cidade', cx: 1800, cy: 380, z: 1.1, leg: 'Sem motivo nenhum... a gente fugiu.', legBaixo: true,
              atores: [{ key: 'kaua_bike', x: 1700, y: 430 }, { key: 'pernalonga_bike', x: 1820, y: 450 }, { key: 'cezar_bike', x: 1930, y: 420 }], fx: [{ tipo: 'linhas', x: 1660, y: 400 }, { tipo: 'linhas', x: 1780, y: 420 }],
              baloes: [{ t: 'FOGE!!!', de: 0, tipo: 'grito' }] },
          ]),
        ] },
        { musica: 'm_jogo', jogo: 'pedalar', fase: 2 },
        { musica: 'm_rua', gibi: [
          P('tres', [
            { bg: 'cidade', cx: 3300, cy: 360, z: 1.6, leg: 'No meio da fuga, o banco da bike do Kauã entortou... e ele foi pra frente.',
              atores: [{ key: 'kaua_bike', x: 3300, y: 440, ang: 22 }], fx: [{ tipo: 'impacto', x: 3270, y: 350 }], baloes: [{ t: 'CREC!', de: 0, tipo: 'grito' }], som: 'crec', treme: true },
            { bg: 'cidade', cx: 3640, cy: 330, z: 1.3, leg: 'Chegamos na casa dele pra ver...',
              atores: [{ key: 'kaua_bike', x: 3590, y: 300, ang: 8 }, { id: 'kaua', f: F.frente, x: 3660, y: 300 }, { id: 'cezar', f: F.fala, x: 3730, y: 310 }, { id: 'pernalonga', f: F.esq, x: 3800, y: 300 }],
              baloes: [{ t: 'Xiii...', de: 2 }, { t: 'Isso aí não tem conserto não.', de: 3 }] },
            { bg: 'cidade', cx: 3660, cy: 260, z: 2.2, leg: 'Não tinha conserto. Fim do passeio.', legBaixo: true, atores: [{ id: 'kaua', f: F.vergonha, x: 3660, y: 300 }] },
          ]),
        ] },
      ],
      premio: 'Desbloqueado: Passeio de bike! Está no menu da rua.',
    },
    {
      n: 8, herois: ['kaua'], titulo: 'Esconde à noite', cor: 0x24306a, resumo: 'O caminhão de lixo (que tava lá longe).',
      passos: [
        { musica: 'm_esconde', gibi: [
          P('dois', [
            { bg: 'rua', tint: NOITE, cx: 480, cy: 340, z: 1.0, leg: 'Essa eu não vi. Mas me contaram tudo.',
              atores: [{ id: 'pedro', f: F.costas, x: 200, y: 262 }, { id: 'kaua', anim: 'kaua_run_right', x: 420, y: 430 }, { id: 'lucas', anim: 'lucas_run_right', x: 560, y: 400 }] },
            { bg: 'rua', tint: NOITE, cx: 220, cy: 220, z: 1.8, leg: 'Esconde-esconde à noite. O Pedro contava.', atores: [{ id: 'pedro', f: F.costas, x: 200, y: 262 }],
              baloes: [{ t: '...8, 9, 10! Lá vou eu!', de: 0 }] },
          ]),
        ] },
        { musica: 'm_esconde', jogo: 'escorrega' },
        { musica: 'm_rua', gibi: [
          P('tres', [
            { bg: 'rua', tint: TARDE, cx: 680, cy: 300, z: 1.3, leg: 'No outro dia, a Dona Tita veio perguntar...',
              atores: [{ key: 'viz_tita', f: 0, x: 700, y: 262 }, { id: 'kaua', f: F.costas, x: 660, y: 420 }],
              baloes: [{ t: 'Ô Kauã! É verdade que tu quase morreu atropelado?', de: 0 }] },
            { bg: 'rua', tint: TARDE, cx: 660, cy: 330, z: 2.0, atores: [{ id: 'kaua', f: F.fala, x: 660, y: 420 }], baloes: [{ t: 'NÃO QUASE MORRI NADA!', de: 0, tipo: 'grito' }], treme: true },
            { bg: 'rua', tint: TARDE, cx: 480, cy: 360, z: 1.2, leg: 'E todo mundo riu. De novo.', legBaixo: true,
              atores: [{ id: 'lucas', f: F.fala, x: 380, y: 420 }, { id: 'pedro', f: F.fala, x: 470, y: 430 }, { id: 'daniel', f: F.fala, x: 560, y: 420 }, { id: 'kaua', f: F.vergonha, x: 650, y: 430 }],
              baloes: [{ t: 'KKKKKKKKKK', de: 1, tipo: 'grito' }], som: 'zoeira' },
          ]),
        ] },
      ],
    },
  );
})();

// ------------------------------------------------------------------ brincadeira: Passeio de bike (liberada no capítulo 7)
class Bike extends Phaser.Scene {
  constructor() { super('Bike'); }

  create(data) {
    this._saindo = false; this._obj = null; this._objBg = null;
    this.cameras.main.fadeIn(300, 18, 13, 24);
    TR.musicaFundo.tocar(this, 'm_jogo');
    const quem = data && data.quem;
    if (!quem) return this.escolher();
    let recorde = 0;
    try { recorde = +localStorage.getItem('turma_bike_recorde') || 0; } catch (e) { /* ok */ }
    let voltas = 0;
    const pas = TR.passeio(this, { quem, amigos: ['pernalonga', 'kaua', 'cezar', 'matheus'].filter((id) => id !== quem && !TR.bloqueado(id)).slice(0, 2), x0: 140, x1: 3800,
      cadaQuadro: (eu) => {
        const m = Math.round((eu.andou) / 10);
        if (m > recorde) { recorde = m; try { localStorage.setItem('turma_bike_recorde', m); } catch (e) { /* ok */ } }
        TR.HP.objetivo(this, 'Passeio de bike: ' + m + 'm   recorde: ' + recorde + 'm   tombos: ' + eu.tombos + '   (setas · Espaço: campainha)');
        if (eu.x > 3760 && !this._volta) {   // deu a volta no quarteirão: volta pro começo da cidade
          this._volta = true; voltas++;
          this.cameras.main.fadeOut(250, 18, 13, 24);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            eu.x = 140; pas.amigos.forEach((a) => { a.x = 140 + a.dx; }); pas.gera(140, 3800);
            this.cameras.main.fadeIn(250, 18, 13, 24); this._volta = false;
          });
        }
      } });
    TR.button(this, 890, 17, '‹ Rua (Esc)', () => TR.go(this, 'Rua'), { fixed: true, depth: 9600 });
    this.input.keyboard.on('keydown-ESC', () => TR.go(this, 'Rua'));
  }

  escolher() {
    this.add.image(0, 0, 'cidade').setOrigin(0).setTint(0x8a8090);
    TR.panel(this, 480, 270, 760, 340, 100);
    TR.txt(this, 480, 128, 'Passeio de bike: quem vai pedalar?', 2, 0xffd36a).setOrigin(0.5).setDepth(101);
    const quem = ['pernalonga', 'kaua', 'cezar', 'matheus'];
    quem.forEach((id, i) => {
      const x = 225 + i * 170, tr = TR.bloqueado(id);
      const s = this.add.sprite(x, 330, id + '_bike', 0).setOrigin(0.5, 1).setDepth(101).setInteractive({ useHandCursor: true });
      if (tr) s.setTint(0x000000); else s.play(TR.animBike(id));
      TR.txt(this, x, 344, (i + 1) + '. ' + (tr ? '???' : TR.KIDS[id].nome), 1, 0xfff1d6).setOrigin(0.5, 0).setDepth(101);
      const vai = () => { if (tr) { TR.sfx(this, 'derrota', 0.3); return; } TR.sfx(this, 'selecionar', 0.5); this.scene.restart({ quem: id }); };
      s.on('pointerdown', vai);
      this.input.keyboard.on('keydown-' + ['ONE', 'TWO', 'THREE', 'FOUR'][i], vai);
    });
    TR.txt(this, 480, 392, 'Desvie dos buracos, das poças, dos cones e do Caramelo. Espaço toca a campainha.', 1, 0xc9b8d8).setOrigin(0.5).setDepth(101);
    TR.button(this, 480, 420, '‹ Rua (Esc)', () => TR.go(this, 'Rua'), { fixed: true, depth: 102 });
    this.input.keyboard.on('keydown-ESC', () => TR.go(this, 'Rua'));
  }
}
