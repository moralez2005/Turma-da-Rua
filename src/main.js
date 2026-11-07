// Permite abrir direto numa cena para testar: index.html?cena=Futebol
(function () {
  const p = new URLSearchParams(location.search);
  if (p.get('cena')) TR.startScene = p.get('cena');
  if (p.get('modo')) TR.startData = { modo: p.get('modo') };
})();

Radio.init();

window.jogo = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'jogo',
  width: TR.W,
  height: TR.H,
  backgroundColor: '#120d18',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  audio: { disableWebAudio: false },
  scene: [Boot, Abertura, Rua, Futebol, Queimada, Alerta, EscondeEsconde, Final],
});
