/*
 * Música de fundo 8-bit original ("Tarde na Rua", gerada por ferramentas/gerador/fundo.py).
 * Toca baixinho em todas as telas e abaixa sozinha quando a JBL ou a música do fim de tarde está tocando.
 * O botão ♫ na barra da rádio liga e desliga (a escolha fica guardada no navegador).
 */
TR.musicaFundo = {
  som: null,
  ligada: true,
  volume: 0.22,
  iniciar(scene) {
    try { this.ligada = localStorage.getItem('turma_fundo') !== 'off'; } catch (e) { /* ok */ }
    if (this.som) return;
    try { this.som = scene.sound.add('fundo', { loop: true, volume: 0 }); this.som.play(); } catch (e) { return; }
    const botao = document.getElementById('radio-fundo');
    const pinta = () => { if (botao) { botao.classList.toggle('desligado', !this.ligada); botao.title = this.ligada ? 'Desligar a música de fundo' : 'Ligar a música de fundo'; } };
    if (botao) botao.onclick = () => {
      this.ligada = !this.ligada;
      try { localStorage.setItem('turma_fundo', this.ligada ? 'on' : 'off'); } catch (e) { /* ok */ }
      pinta();
    };
    pinta();
    // a cada instante, vai devagar até o volume certo (abaixa quando a JBL toca)
    setInterval(() => {
      if (!this.som) return;
      const alvo = this.ligada && !Radio.playing && Radio.mode !== 'final' ? this.volume : 0;
      const v = this.som.volume + (alvo - this.som.volume) * 0.25;
      this.som.setVolume(Math.abs(v - alvo) < 0.005 ? alvo : v);
    }, 100);
  },
};
