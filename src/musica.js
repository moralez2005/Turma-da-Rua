/*
 * Trilha sonora original (gerada por ferramentas/gerador/fundo.py e trilha.py): uma música para cada momento.
 *   abertura: "Tarde na Rua" (8-bit) · rua: hora dourada · partida: animada · barracão: chuva · esconde: na ponta do pé · final: "Até amanhã, turma"
 * Cada cena chama TR.musicaFundo.tocar(this, 'm_...'): a música troca com um fade suave.
 * As músicas carregam só quando a cena pede (o jogo abre mais rápido). Abaixa sozinha quando a JBL ou o vídeo do final tocam.
 * O botão ♫ na barra da rádio liga e desliga (a escolha fica guardada no navegador).
 */
TR.musicaFundo = {
  tocando: [],      // [{ som, chave, alvo }]
  chave: null,
  ligada: true,
  volume: 0.2,
  iniciar() {
    if (this._iniciou) return;
    this._iniciou = true;
    try { this.ligada = localStorage.getItem('turma_fundo') !== 'off'; } catch (e) { /* ok */ }
    const botao = document.getElementById('radio-fundo');
    const pinta = () => { if (botao) { botao.classList.toggle('desligado', !this.ligada); botao.title = this.ligada ? 'Desligar a música de fundo' : 'Ligar a música de fundo'; } };
    if (botao) botao.onclick = () => {
      this.ligada = !this.ligada;
      try { localStorage.setItem('turma_fundo', this.ligada ? 'on' : 'off'); } catch (e) { /* ok */ }
      pinta();
    };
    pinta();
    // a cada instante, cada música vai devagar até o volume certo (troca de faixa e JBL abaixando)
    setInterval(() => {
      const mudo = !this.ligada || (typeof Radio !== 'undefined' && Radio.playing);
      this.tocando = this.tocando.filter((t) => {
        const alvo = mudo ? 0 : t.alvo;
        const v = t.som.volume + (alvo - t.som.volume) * 0.18;
        t.som.setVolume(Math.abs(v - alvo) < 0.004 ? alvo : v);
        if (t.alvo === 0 && t.som.volume === 0) { t.som.stop(); t.som.destroy(); return false; }
        return true;
      });
    }, 100);
  },

  // troca a música (carrega na hora se ainda não veio)
  tocar(scene, chave, opts = {}) {
    this.iniciar();
    if (this.chave === chave) return;
    this.chave = chave;
    this.tocando.forEach((t) => { t.alvo = 0; });
    const comeca = () => {
      if (this.chave !== chave) return;   // trocou de novo enquanto carregava
      try {
        const som = scene.sound.add(chave, { loop: opts.loop !== false, volume: 0 });
        som.play();
        this.tocando.push({ som, chave, alvo: this.volume * (opts.volume || 1) });
      } catch (e) { /* sem áudio */ }
    };
    if (scene.cache.audio.exists(chave)) return comeca();
    const base = 'assets/sons/' + chave;
    scene.load.audio(chave, chave.startsWith('m_') ? [base + '.ogg', base + '.mp3'] : [base + '.wav']);
    scene.load.once('filecomplete-audio-' + chave, comeca);
    scene.load.start();
  },
};
