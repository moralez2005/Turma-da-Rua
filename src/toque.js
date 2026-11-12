/*
 * Controles de toque (celular e tablet).
 *
 * Em vez de reescrever cada brincadeira, o controle na tela "aperta as teclas" do teclado:
 * o direcional manda as setas e cada botão manda a tecla da ação (Espaço, Shift, E...).
 * Os botões mudam conforme a cena (BOTOES_POR_CENA). Só aparece em tela de toque,
 * ou forçando com ?toque=1 no endereço (bom pra testar no computador).
 */
(function () {
  const forcar = new URLSearchParams(location.search).get('toque') === '1';
  const ehToque = forcar || window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (!ehToque) return;
  document.body.classList.add('toque');

  // código de cada tecla que o Phaser entende
  const TECLAS = {
    ArrowLeft: [37, 'ArrowLeft'], ArrowUp: [38, 'ArrowUp'], ArrowRight: [39, 'ArrowRight'], ArrowDown: [40, 'ArrowDown'],
    Space: [32, ' '], ShiftLeft: [16, 'Shift'], Enter: [13, 'Enter'], Escape: [27, 'Escape'],
    KeyC: [67, 'c'], KeyZ: [90, 'z'], KeyE: [69, 'e'], KeyQ: [81, 'q'], KeyF: [70, 'f'], KeyT: [84, 't'],
  };
  const apertadas = new Set();
  const manda = (tipo, code) => {
    const [kc, key] = TECLAS[code];
    const ev = new KeyboardEvent(tipo, { key, code, bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'keyCode', { get: () => kc });
    Object.defineProperty(ev, 'which', { get: () => kc });
    window.dispatchEvent(ev);
  };
  const desce = (code) => { if (apertadas.has(code)) return; apertadas.add(code); manda('keydown', code); };
  const sobe = (code) => { if (!apertadas.has(code)) return; apertadas.delete(code); manda('keyup', code); };
  const toca = (code) => { desce(code); setTimeout(() => sobe(code), 60); };

  // botões de cada brincadeira: [texto, tecla, segurar?]
  const BOTOES_POR_CENA = {
    Rua: [['Jogar', 'Enter']],
    Futebol: [['Passe', 'Space'], ['Chute', 'ShiftLeft', true], ['Por cima', 'KeyC'], ['Drible', 'KeyZ'], ['Habilidade', 'KeyE'], ['Trocar', 'KeyQ']],
    Queimada: [['Arremessa / Agarra', 'Space', true], ['Alvo', 'KeyQ'], ['Habilidade', 'KeyE']],
    Alerta: [['Ação', 'Space'], ['Alvo', 'KeyQ'], ['Arrancada', 'KeyE']],
    EscondeEsconde: [['Agachar / Achei', 'Space'], ['Correr', 'ShiftLeft', true], ['Habilidade', 'KeyE'], ['Orelhão', 'KeyT']],
  };
  const COM_DIRECIONAL = ['Rua', 'Futebol', 'Queimada', 'Alerta', 'EscondeEsconde'];

  // ---------- montagem do HTML ----------
  const caixa = document.createElement('div');
  caixa.id = 'toque';
  caixa.innerHTML = `
    <div id="toque-direcional"><div id="toque-bolinha"></div></div>
    <div id="toque-botoes"></div>
    <button id="toque-tela-cheia" title="Tela cheia">⛶</button>`;
  document.body.appendChild(caixa);
  const aviso = document.createElement('div');
  aviso.id = 'toque-girar';
  aviso.innerHTML = '<div><div class="toque-girar-icone">📱↻</div><p>Vire o celular pra jogar deitado</p><button>Tela cheia e deitar</button></div>';
  document.body.appendChild(aviso);

  // tela cheia + tentar travar deitado (funciona no Android; no iPhone, só virando)
  const telaCheia = () => {
    const el = document.documentElement;
    const p = el.requestFullscreen ? el.requestFullscreen() : (el.webkitRequestFullscreen ? el.webkitRequestFullscreen() : null);
    Promise.resolve(p).then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* ok */ } }).catch(() => {});
    setTimeout(() => { try { window.jogo.scale.refresh(); } catch (e) { /* ok */ } }, 400);
  };
  document.getElementById('toque-tela-cheia').onclick = telaCheia;
  aviso.querySelector('button').onclick = telaCheia;

  // ---------- direcional (joystick de 8 direções) ----------
  const pad = document.getElementById('toque-direcional');
  const bolinha = document.getElementById('toque-bolinha');
  let dedoPad = null;
  const atualizaPad = (e) => {
    const r = pad.getBoundingClientRect();
    const raio = r.width / 2;
    let dx = e.clientX - (r.left + raio), dy = e.clientY - (r.top + raio);
    const d = Math.hypot(dx, dy);
    if (d > raio) { dx = dx / d * raio; dy = dy / d * raio; }
    bolinha.style.transform = `translate(${dx}px, ${dy}px)`;
    const lim = raio * 0.35;
    const quer = new Set();
    if (dx < -lim) quer.add('ArrowLeft');
    if (dx > lim) quer.add('ArrowRight');
    if (dy < -lim) quer.add('ArrowUp');
    if (dy > lim) quer.add('ArrowDown');
    ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].forEach((k) => (quer.has(k) ? desce(k) : sobe(k)));
  };
  const soltaPad = () => {
    dedoPad = null;
    bolinha.style.transform = '';
    ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].forEach(sobe);
  };
  pad.addEventListener('pointerdown', (e) => { dedoPad = e.pointerId; pad.setPointerCapture(e.pointerId); atualizaPad(e); e.preventDefault(); });
  pad.addEventListener('pointermove', (e) => { if (e.pointerId === dedoPad) atualizaPad(e); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => pad.addEventListener(t, (e) => { if (e.pointerId === dedoPad) soltaPad(); }));

  // ---------- botões de ação (mudam conforme a cena) ----------
  const areaBotoes = document.getElementById('toque-botoes');
  let cenaAtual = null;
  const montaBotoes = (cena) => {
    areaBotoes.innerHTML = '';
    (BOTOES_POR_CENA[cena] || []).forEach(([texto, code, segurar]) => {
      const b = document.createElement('button');
      b.textContent = texto;
      b.className = 'toque-botao' + (code === 'Space' || code === 'Enter' ? ' principal' : '');
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        b.setPointerCapture(e.pointerId);
        b.classList.add('apertado');
        if (segurar) desce(code); else toca(code);
      });
      const solta = () => { b.classList.remove('apertado'); if (segurar) sobe(code); };
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => b.addEventListener(t, solta));
      areaBotoes.appendChild(b);
    });
  };
  // olha qual cena está rodando e troca os botões
  setInterval(() => {
    let cena = null;
    try { const ativas = window.jogo.scene.getScenes(true); cena = ativas.length ? ativas[0].scene.key : null; } catch (e) { return; }
    if (cena === cenaAtual) return;
    cenaAtual = cena;
    apertadas.forEach((k) => sobe(k));
    montaBotoes(cena);
    caixa.classList.toggle('sem-direcional', !COM_DIRECIONAL.includes(cena));
  }, 300);

  // o celular não pode dar zoom nem rolar a página quando a pessoa toca no jogo
  document.addEventListener('gesturestart', (e) => e.preventDefault());
})();
