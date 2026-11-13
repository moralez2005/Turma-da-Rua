class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const g = this.add.graphics();
    const txt = this.add.text(480, 240, 'Carregando a rua...', { fontFamily: 'monospace', fontSize: '18px', color: '#ffd36a' }).setOrigin(0.5);
    this.load.on('progress', (v) => {
      g.clear();
      g.fillStyle(0x2a1d33, 1).fillRect(280, 270, 400, 18);
      g.fillStyle(0xf2b13c, 1).fillRect(284, 274, 392 * v, 10);
    });
    this.load.on('complete', () => { g.destroy(); txt.destroy(); });

    this.load.bitmapFont('pixel', 'assets/fonte/pixel.png', 'assets/fonte/pixel.xml');
    Object.keys(TR.KIDS).forEach((id) => {
      this.load.spritesheet(id, 'assets/personagens/' + id + '.png', { frameWidth: 80, frameHeight: 136 });
      if (!TR.KIDS[id].semFinal) this.load.spritesheet('final_' + id, 'assets/final/' + id + '.png', { frameWidth: 80, frameHeight: 136 });
    });
    this.load.image('rua', 'assets/cenarios/rua.png');
    this.load.image('rua_tarde', 'assets/cenarios/rua_tarde.png');
    this.load.image('barracao_dentro', 'assets/cenarios/barracao_dentro.png');
    this.load.image('rua_sem_ceu', 'assets/cenarios/rua_sem_ceu.png');
    this.load.json('rua_luzes', 'assets/cenarios/rua_luzes.json');
    this.load.json('barracao_dentro', 'assets/cenarios/barracao_dentro.json');
    this.load.image('turma14', 'assets/final/turma14.png');
    this.load.image('final_fundo', 'assets/final/fundo_480.png');
    this.load.image('esc_chao', 'assets/esconde/chao.png');
    this.load.json('esc_mapa', 'assets/esconde/mapa.json');
    ['carro', 'kombi', 'arbusto', 'tambor', 'engradados', 'mesa', 'lixeira', 'orelhao', 'mato', 'entulho', 'cacamba',
      'pneus', 'manga', 'varal', 'casinha', 'bananeira', 'caixa', 'tanque', 'carro_vermelho'].forEach((k) => {
      this.load.image('obj_' + k, 'assets/esconde/obj_' + k + '.png');
    });
    this.load.spritesheet('matheus_bike', 'assets/personagens/matheus_bike.png', { frameWidth: 128, frameHeight: 136 });
    ['tita', 'marido', 'vera', 'filha'].forEach((v) => this.load.spritesheet('viz_' + v, 'assets/vizinhas/' + v + '.png', { frameWidth: 80, frameHeight: 136 }));
    this.load.spritesheet('jbl_lucas', 'assets/itens/jbl_lucas.png', { frameWidth: 36, frameHeight: 26 });
    this.load.spritesheet('jbl_pedro', 'assets/itens/jbl_pedro.png', { frameWidth: 36, frameHeight: 26 });
    this.load.spritesheet('caramelo', 'assets/itens/caramelo.png', { frameWidth: 40, frameHeight: 30 });
    ['futebol', 'esconde', 'queimada', 'alerta', 'fim'].forEach((k) => this.load.image('token_' + k, 'assets/itens/token_' + k + '.png'));
    ['pipa', 'logo'].forEach((k) => this.load.image(k, 'assets/itens/' + k + '.png'));
    // bolas: 8 quadros de giro (ferramentas/gerador/bolas.py)
    ['bola', 'bola_queimada'].forEach((k) => this.load.spritesheet(k, 'assets/itens/' + k + '.png', { frameWidth: 14, frameHeight: 14 }));
    ['abertura', 'achou', 'alerta', 'apito', 'arremesso', 'bip', 'carro', 'chute', 'clique', 'congelar', 'derrota', 'gol',
      'habilidade', 'hover', 'la_vou_eu', 'mato', 'passe', 'pegar', 'pulo', 'queimado', 'quique', 'salvou', 'selecionar',
      'tecla', 'vitoria', 'orelhao', 'chuva', 'fundo'].forEach((k) => this.load.audio(k, 'assets/sons/' + k + '.wav'));
  }

  create() {
    TR.makeAnims(this);
    TR.musicaFundo.iniciar(this);
    this.scene.start(TR.startScene || 'Abertura', TR.startData);
  }
}
