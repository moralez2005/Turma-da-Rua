/*
 * Rádio da Rua — barra fixa no topo da página, fora do canvas do jogo.
 * As músicas vêm do player oficial do YouTube (IFrame API), que fica pendurado na barra enquanto toca.
 * Regras do YouTube: o player fica visível (200x200) enquanto toca, nada toca sozinho sem um clique,
 * pausa quando a aba fica oculta e pula vídeos que não deixam tocar fora do YouTube (erros 101/150).
 * Recolher o player (▴) também pausa a música.
 */
(function () {
  const $ = (id) => document.getElementById(id);

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
      this.dock = $('radio');
      this.titleEl = $('radio-titulo');
      this.nameEl = $('radio-nome');
      this.msgEl = $('radio-msg');
      this.listEl = $('radio-musicas');
      $('radio-prev').onclick = () => this.prev();
      $('radio-play').onclick = () => this.toggle();
      $('radio-next').onclick = () => this.next();
      $('radio-fechar').onclick = () => this.close();
      this.dock.querySelectorAll('.radio-estacoes button').forEach((b) => {
        b.onclick = () => {
          const id = b.dataset.estacao;
          if (this.mode === 'radio' && this.station === id && this.ready) this.toggle();
          else this.setStation(id);
        };
      });
      // botões HTML não podem roubar o foco do teclado do jogo
      this.dock.addEventListener('mouseup', () => { if (document.activeElement) document.activeElement.blur(); });

      fetch('./src/data/radio.json').then((r) => r.json()).then((d) => {
        this.data = d;
        this.emit();
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
      this.layout();
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
      if (!this.data || !this.station) return 'Rádio da Rua';
      const e = this.data.estacoes.find((s) => s.id === this.station);
      return e ? e.nome : 'Rádio da Rua';
    },
    current() {
      if (this.mode === 'final') return this.data && this.data.cenaFinal;
      return this.songs()[this.index];
    },

    ensurePlayer(videoId, autoplay) {
      const make = () => {
        if (this.player) {
          if (autoplay) this.player.loadVideoById(videoId); else this.player.cueVideoById(videoId);
          return;
        }
        this.player = new YT.Player('radio-player', {
          width: 200, height: 200, videoId,
          playerVars: { playsinline: 1, rel: 0, autoplay: autoplay ? 1 : 0 },
          events: {
            onReady: () => { this.ready = true; if (autoplay) this.player.playVideo(); this.emit(); },
            onStateChange: (ev) => {
              const S = YT.PlayerState;
              if (ev.data === S.PLAYING) {
                this.playing = true;
                this.player.setVolume(this.mode === 'final' ? 35 : 100);
              }
              if (ev.data === S.PAUSED || ev.data === S.CUED) this.playing = false;
              if (ev.data === S.ENDED) { this.playing = false; if (this.mode === 'radio') this.next(); }
              this.emit();
            },
            onError: () => {
              this.msg('Esse vídeo não pode tocar aqui. Pulando…');
              if (this.mode === 'radio') setTimeout(() => this.next(), 600);
              else this.showYoutubeLink(videoId);
            },
          },
        });
      };
      if (this.apiReady) make();
      else { this.pending = make; this.msg('Carregando o YouTube…'); }
    },

    // ----- comandos usados pelas cenas e pelos botões -----
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
    playIndex(i) {
      const list = this.songs();
      if (!list[i]) return;
      this.index = i;
      this.open();
      this.ensurePlayer(list[i].videoId, true);
      this.emit();
    },
    toggle() {
      if (this.mode === 'final') { if (this.ready) (this.playing ? this.player.pauseVideo() : this.player.playVideo()); return; }
      if (!this.station) { this.setStation('lucas'); return; }
      if (!this.player || !this.ready || this.mode === 'off') { this.setStation(this.station); return; }
      this.open();
      if (this.playing) this.player.pauseVideo(); else this.player.playVideo();
    },
    pause() { if (this.player && this.ready && this.playing) this.player.pauseVideo(); },
    next() { this.step(1); },
    prev() { this.step(-1); },
    step(d) {
      if (this.mode !== 'radio') return;
      const list = this.songs();
      if (!list.length) return;
      this.playIndex((this.index + d + list.length) % list.length);
    },
    playFinal() {
      const v = this.data && this.data.cenaFinal && this.data.cenaFinal.videoId;
      this.pause();
      this.mode = 'final';
      this.open();
      if (!v) { this.msg('Sem música do final configurada.'); this.emit(); return; }
      if (this.offline) { this.msg('Sem conexão com o YouTube agora.'); this.emit(); return; }
      this.ensurePlayer(v, false);   // sem autoplay: a pessoa aperta o play
      this.msg('Clique no vídeo ▶ pra ouvir');
      this.emit();
    },
    leaveFinal() {
      if (this.mode !== 'final') return;
      this.pause();
      this.mode = 'off';
      this.close();
    },

    // painel com o vídeo aberto (pendurado na barra)
    open() { this.dock.classList.add('aberto'); this.layout(); },
    close() {
      this.pause();
      this.dock.classList.remove('aberto');
      if (this.mode === 'radio') this.mode = 'off';
      this.layout();
      this.emit();
    },
    // abre espaço pro player ao lado do jogo e reajusta o tamanho do canvas
    layout() {
      document.body.classList.toggle('radio-on', this.dock.classList.contains('aberto'));
      document.body.classList.toggle('final', this.mode === 'final');
      const fit = () => { try { window.jogo && window.jogo.scale.refresh(); } catch (e) { /* ainda carregando */ } };
      requestAnimationFrame(fit); setTimeout(fit, 150);
    },

    msg(t) { if (this.msgEl) { this.msgEl.textContent = t; this.msgEl.style.display = t ? 'block' : 'none'; } },
    showYoutubeLink(v) {
      this.msgEl.innerHTML = 'Não deu para tocar aqui. <a target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=' + v + '">Ouvir no YouTube</a>';
      this.msgEl.style.display = 'block';
    },

    renderUi() {
      if (!this.nameEl) return;
      this.nameEl.textContent = this.stationName();
      this.dock.dataset.estacao = this.mode === 'final' ? 'final' : (this.mode === 'radio' ? this.station : '');
      this.dock.querySelectorAll('.radio-estacoes button').forEach((b) => {
        b.classList.toggle('ativa', this.mode === 'radio' && b.dataset.estacao === this.station);
      });
      const m = this.current();
      let t = 'clique numa JBL pra tocar';
      if (this.mode === 'final') t = 'a turma no meio-fio, vendo o sol ir embora';
      else if (this.mode === 'radio' && m) t = (this.playing ? '♪ ' : '') + m.titulo + (m.artista ? ' · ' + m.artista : '');
      this.titleEl.textContent = t;
      $('radio-play').textContent = this.playing ? '❚❚' : '▶';
      if (this.playing) this.msg('');
      // lista de músicas da estação (clique pra tocar)
      const key = this.mode + '|' + this.station + '|' + this.index;
      if (this.listEl && this._listKey !== key) {
        this._listKey = key;
        this.listEl.innerHTML = '';
        if (this.mode === 'radio') {
          this.songs().forEach((s, i) => {
            const li = document.createElement('li');
            li.textContent = s.titulo + (s.artista ? ' — ' + s.artista : '');
            if (i === this.index) li.className = 'tocando';
            li.onclick = () => this.playIndex(i);
            this.listEl.appendChild(li);
          });
        }
      }
    },
  };
  window.Radio = Radio;
})();
