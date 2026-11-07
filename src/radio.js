/*
 * Rádio JBL — player oficial do YouTube (IFrame API) num cantinho da tela.
 * Regras do YouTube respeitadas: player visível (200x200) enquanto toca, sem autoplay,
 * pausa quando a aba fica oculta e pula vídeos que não permitem incorporação (erros 101/150).
 */
(function () {
  const Radio = {
    data: null,
    station: null,       // 'lucas' | 'pedro'
    index: 0,
    mode: 'off',         // 'off' | 'radio' | 'final'
    playing: false,
    ready: false,
    player: null,
    listeners: [],
    wasPlayingBeforeHide: false,

    init() {
      this.dock = document.getElementById('radio');
      this.titleEl = document.getElementById('radio-titulo');
      this.nameEl = document.getElementById('radio-nome');
      this.msgEl = document.getElementById('radio-msg');
      document.getElementById('radio-prev').onclick = () => this.prev();
      document.getElementById('radio-play').onclick = () => this.toggle();
      document.getElementById('radio-next').onclick = () => this.next();
      document.getElementById('radio-fechar').onclick = () => this.close();
      fetch('./src/data/radio.json').then((r) => r.json()).then((d) => {
        this.data = d;
      }).catch(() => { this.data = { estacoes: [], cenaFinal: {} }; });
      document.addEventListener('visibilitychange', () => {
        if (!this.player || !this.ready) return;
        if (document.hidden) {
          this.wasPlayingBeforeHide = this.playing;
          if (this.playing) this.player.pauseVideo();
        } else if (this.wasPlayingBeforeHide) {
          this.player.playVideo();
        }
      });
      window.onYouTubeIframeAPIReady = () => { this.apiReady = true; if (this.pending) this.pending(); };
      if (window.YT && window.YT.Player) this.apiReady = true;
      setTimeout(() => {
        if (!this.apiReady) this.offline = true;
        this.emit();
      }, 8000);
    },

    on(fn) { this.listeners.push(fn); },
    off(fn) { this.listeners = this.listeners.filter((f) => f !== fn); },
    emit() { this.listeners.forEach((f) => { try { f(this); } catch (e) { /* cena já fechada */ } }); this.renderUi(); },

    songs() {
      if (!this.data || !this.station) return [];
      const e = this.data.estacoes.find((s) => s.id === this.station);
      return e ? e.musicas.filter((m) => m.videoId) : [];
    },
    stationName() {
      if (this.mode === 'final') return 'Fim de tarde';
      if (!this.data || !this.station) return 'JBL';
      const e = this.data.estacoes.find((s) => s.id === this.station);
      return e ? e.nome : 'JBL';
    },

    ensurePlayer(videoId, autoplay) {
      const make = () => {
        if (this.player) {
          if (autoplay) this.player.loadVideoById(videoId); else this.player.cueVideoById(videoId);
          return;
        }
        this.player = new YT.Player('radio-player', {
          width: 200, height: 200, videoId,
          playerVars: { playsinline: 1, rel: 0, modestbranding: 1, autoplay: autoplay ? 1 : 0 },
          events: {
            onReady: () => { this.ready = true; if (autoplay) this.player.playVideo(); this.emit(); },
            onStateChange: (ev) => {
              const S = YT.PlayerState;
              if (ev.data === S.PLAYING) { this.playing = true;
              this.player.setVolume(this.mode === 'final' ? 15 : 20);}
              if (ev.data === S.PAUSED || ev.data === S.CUED) this.playing = false;
              if (ev.data === S.ENDED) { this.playing = false; if (this.mode === 'radio') this.next(); }
              this.emit();
            },
            onError: (ev) => {
              this.msg('Este vídeo não pode tocar aqui. Pulando…');
              if (this.mode === 'radio') setTimeout(() => this.next(), 600);
              else this.showYoutubeLink(videoId);
            },
          },
        });
      };
      if (this.apiReady) make();
      else { this.pending = make; this.msg('Carregando o YouTube…'); }
    },

    // ----- comandos públicos -----
    setStation(id) {
      if (this.mode === 'final') return;
      this.station = id;
      this.mode = 'radio';
      const list = this.songs();
      this.index = Math.floor(Math.random() * Math.max(1, list.length));
      this.open();
      if (!list.length) { this.msg('Essa JBL ainda não tem músicas com link. Veja src/data/radio.json.'); this.emit(); return; }
      if (this.offline) { this.msg('Sem conexão com o YouTube agora.'); this.emit(); return; }
      this.ensurePlayer(list[this.index].videoId, true);
      this.emit();
    },
    toggle() {
      if (!this.player || !this.ready) { if (this.mode === 'off' && this.station) this.setStation(this.station); return; }
      if (this.playing) this.player.pauseVideo(); else this.player.playVideo();
    },
    pause() { if (this.player && this.ready && this.playing) this.player.pauseVideo(); },
    next() { this.step(1); },
    prev() { this.step(-1); },
    step(d) {
      if (this.mode !== 'radio') return;
      const list = this.songs();
      if (!list.length) return;
      this.index = (this.index + d + list.length) % list.length;
      this.ensurePlayer(list[this.index].videoId, true);
    },
    playFinal() {
      const v = this.data && this.data.cenaFinal && this.data.cenaFinal.videoId;
      this.mode = 'final';
      this.open();
      if (!v) { this.msg('Sem música do final configurada.'); this.emit(); return; }
      if (this.offline) { this.msg('Sem conexão com o YouTube agora.'); this.emit(); return; }
      this.ensurePlayer(v, false);   // sem autoplay: a pessoa aperta o play no cantinho
      this.msg('Clique no vídeo ▶ pra ouvir');
      this.emit();
    },
    leaveFinal() {
      if (this.mode !== 'final') return;
      this.pause();
      this.mode = this.station ? 'radio' : 'off';
      if (this.mode === 'off') this.close(); else this.layout(true);
      this.emit();
    },
    open() { this.dock.classList.add('aberto'); this.layout(true); },
    // abre espaço pro player ao lado do jogo e reajusta o tamanho do canvas
    layout(on) {
      document.body.classList.toggle('radio-on', on);
      document.body.classList.toggle('final', this.mode === 'final');
      const fit = () => { try { window.jogo && window.jogo.scale.refresh(); } catch (e) { /* ainda carregando */ } };
      requestAnimationFrame(fit); setTimeout(fit, 120);
    },
    close() {
      this.pause();
      this.dock.classList.remove('aberto');
      this.layout(false);
      if (this.mode === 'radio') this.mode = 'off';
      this.emit();
    },
    msg(t) { if (this.msgEl) { this.msgEl.textContent = t; this.msgEl.style.display = t ? 'block' : 'none'; } },
    showYoutubeLink(v) {
      this.msgEl.innerHTML = 'Não deu para tocar aqui. <a target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=' + v + '">Ouvir no YouTube</a>';
      this.msgEl.style.display = 'block';
    },
    renderUi() {
      if (!this.nameEl) return;
      this.nameEl.textContent = this.stationName();
      this.dock.dataset.estacao = this.mode === 'final' ? 'final' : (this.station || '');
      let t = '';
      if (this.player && this.ready && this.player.getVideoData) {
        const vd = this.player.getVideoData();
        t = (vd && vd.title) || '';
      }
      this.titleEl.textContent = t;
      document.getElementById('radio-play').textContent = this.playing ? '❚❚' : '▶';
      if (this.playing) this.msg('');
    },
  };
  window.Radio = Radio;
})();
