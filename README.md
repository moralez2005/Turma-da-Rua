# 🎮 A Turma da Rua

> *Em algum lugar de Itaberá, em 2019...*

Um jogo em pixel art sobre uma tarde de brincadeiras na rua com sete amigos de infância: futebol com traves de chinelo, esconde-esconde no quarteirão inteiro, queimada e alerta. A JBL do Lucas ou a do Pedro toca as músicas da época e, no fim, a turma senta no meio-fio para ver o pôr do sol.

Projeto desenvolvido para o workshop **IBM SkillsBuild · #IBMBOB**.

## ▶️ Jogue agora

**👉 [https://SEU-USUARIO.github.io/turma-da-rua/](https://SEU-USUARIO.github.io/turma-da-rua/)**

Funciona direto no navegador do computador, sem instalar nada.

![Abertura](assets/prints/01_abertura.png)

## O que tem no jogo

- **⚽ Futebol de rua:** 3 contra 3 com traves de chinelo. Passe, chute carregado, drible e habilidade de cada personagem. De vez em quando passa um carro e todo mundo corre pra calçada.
- **👁 Esconde-esconde:** o quarteirão inteiro com 24 esconderijos (Kombi, caçamba, mato alto, varal, bananeira...). Dá pra se esconder ou procurar a turma.
- **🔴 Queimada:** seu time contra o time do Lucas. Mire, carregue, arremesse e agarre a bola na hora certa. Quem é queimado vai pro cemitério e pode voltar.
- **❗ Alerta:** escolha um tema e a sua palavra. Gritaram a sua? Corre pegar a bola, grita ALERTA, todo mundo congela e você arremessa.
- **🌅 Fim de tarde:** a cena final, com a turma no meio-fio, refri, salgadinho e uma frase pra fechar.
- **📻 Rádio JBL:** as duas JBLs ficam na calçada em todas as telas. É só clicar numa delas pra tocar.

![Seleção de personagens](assets/prints/02_selecao.png)

| Futebol | Queimada |
| --- | --- |
| ![Futebol](assets/prints/03_futebol.png) | ![Queimada](assets/prints/04_queimada.png) |
| **Alerta** | **Esconde-esconde** |
| ![Alerta](assets/prints/05_alerta.png) | ![Esconde-esconde](assets/prints/06_esconde.png) |

![Fim de tarde](assets/prints/08_fim_de_tarde.png)

## A turma

Pernalonga, Cezar, Kauã Henrique, Pedro ("Dona Juliete"), Lucas, Daniel e Gabriel. Cada um tem uma habilidade própria no futebol (tecla **E**): passada longa, caneta, paredão, bomba, zoeira, estrategista e gato. Na queimada e no alerta as habilidades mudam para combinar com cada brincadeira.

## Controles

| Tecla | Ação |
| --- | --- |
| Setas / WASD | Andar |
| Espaço | Passe, arremessar/agarrar, agachar ou "Achei!" |
| Shift | Chute carregado (futebol) · correr (esconde) |
| C / Z | Passe por cima / drible (futebol) |
| 1 a 7 | Escolher tema e palavra (alerta) |
| E | Habilidade do personagem |
| Q | Trocar jogador ou alvo |
| M | Ligar ou pausar a JBL |
| Esc | Voltar para a rua |

## Rodar no seu computador

É um site estático, sem build. Dentro da pasta do projeto:

```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000`. (Abrir o `index.html` com dois cliques não funciona, porque o navegador bloqueia a leitura dos arquivos locais.)

Para ir direto a uma brincadeira: `http://localhost:8000/?cena=Futebol`. Também vale `Queimada`, `Alerta`, `EscondeEsconde` e `Final`.

**Adicionar músicas:** edite `src/data/radio.json` e preencha `titulo`, `artista` e `videoId` (o código que vem depois de `watch?v=` no link do YouTube).

## Como foi feito

- **Motor:** [Phaser 3.87](https://phaser.io), incluído em `lib/` (sem build e sem CDN).
- **Linguagem:** JavaScript puro, HTML e CSS.
- **Arte:** pixel art gerada por scripts em Python (Pillow/numpy) em `ferramentas/gerador/`: sprites em 4 direções, cenários e o mapa do esconde-esconde. Nenhuma foto real foi usada.
- **Sons:** efeitos retrô sintetizados por código.
- **Fonte:** Unifont, renderizada como fonte bitmap.
- **Deploy:** GitHub Pages.

### IA no desenvolvimento

- **IBM Bob:** primeira versão do jogo (estrutura em Phaser, cenas e rádio) a partir do documento de design em [`docs/design.md`](docs/design.md).
- **Claude (Anthropic):** artes, sons, revisão e reescrita das brincadeiras para corrigir bugs e deixar tudo jogável.

## Créditos

- **Autor:** Kauã, com a turma de amigos que inspirou o jogo.
- **Músicas:** tocadas pelo player oficial do YouTube, sem cópia do áudio. Todos os direitos reservados aos autores. A lista está em `src/data/radio.json`.
- **Frase final:** "Algo que não muda com o tempo é a memória dos dias de juventude." Sheik, *The Legend of Zelda: Ocarina of Time* (Nintendo).
- **Inspiração:** *Zueirama*.
- **Workshop:** IBM SkillsBuild · #IBMBOB

## Licença

Código sob a licença MIT ([LICENSE](LICENSE)). Músicas, frase e obras citadas pertencem aos seus autores.
