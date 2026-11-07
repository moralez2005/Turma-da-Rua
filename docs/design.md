> **Nota:** este é o documento de design original, usado para gerar a primeira versão com o IBM Bob. O jogo final evoluiu (resolução 960×540, novo mapa do esconde-esconde, JBLs no cenário, sons). Veja o README.

# A Turma da Rua — Documento do Jogo

Jogo de navegador em pixel art sobre uma tarde de brincadeiras na rua, em Itaberá (SP), em 2019, com 7 amigos de infância. A tarde termina com um close mais detalhado e animado da turma no meio-fio vendo o pôr do sol.

## Visão geral

- **Plataforma:** HTML5 + JavaScript com Phaser 3 (via CDN, sem build), publicado no GitHub Pages.
- **Inspiração:** Zueirama (pixel art estilo anos 90, humor de zoeira, fases curtas e minigames).
- **Estrutura:** Abertura ("Itaberá, 2019..." digitado sobre a rua em sépia) → RuaHub (menu na própria rua) → Futebol, Esconde-esconde, Queimada, Alerta → "Fim de tarde" (cena final) → frase final → créditos.
- **Resolução interna:** 480×270, ampliada sem suavização (pixelArt: true, escala FIT).
- **Rádio JBL:** barra fixa no topo durante todo o jogo, tocando músicas pelo player oficial do YouTube.

## Personagens

Dados completos (atributos, especiais e falas) em `src/data/personagens.json`. As falas são um rascunho e devem ser trocadas pelas de verdade.

| Personagem | Visual | Personalidade | Vel. | Chute | Defesa | Especial |
| --- | --- | --- | --- | --- | --- | --- |
| Pernalonga (você) | O mais alto, pernas compridas, camiseta branca | O mais velho e o mais cabeça | 4 | 5 | 3 | Passada longa: arrancada que cobre o dobro da distância |
| Cezar | Camisa florida de manga longa, descalço | Vida loka, sem medo, traquinagem | 5 | 3 | 2 | Caneta: dribla atravessando o adversário |
| Kauã Henrique | Loiro, franja | O mais calmo; goleiro porque não gosta de correr | 2 | 2 | 5 | Paredão |
| Pedro ("Dona Juliete") | Juliete, boné pra trás, orelhas grandes | Banca de malandro, funkeiro, sensível; ameaça levar a bola embora | 2 | 4 | 3 | "Vou embora com a bola!": a partida pausa até convencerem ele |
| Lucas | Regata vermelha, bermuda camuflada | Despreocupado, zoa sem limite, implica com o Pedro | 4 | 3 | 2 | Zoeira: deixa o adversário mais lento por 3 s |
| Daniel | Magro, moreno claro, celular na mão | Nerd dos jogos de celular, implica com o Pedro | 3 | 3 | 3 | Estrategista: mostra onde está a bola ou o escondido mais próximo |
| Gabriel | O menor, negro, gêmeo do Daniel | Vai pro gol, implica com o Pedro | 4 | 2 | 4 | Gato: pulo de goleiro mais rápido |

## Modos de jogo

### 1. Futebol de rua
- Fundo `assets/cenarios/rua_gameplay_480x270.png` (bloquete cinza); traves de chinelo nas pontas.
- Times de 3 na linha + goleiro (Kauã e Gabriel). Vence quem fizer 2 gols, ou quem tiver mais gols em 3 minutos.
- Eventos: carro passando ("Ó o carro!" pausa o jogo), bola no quintal do vizinho, Pedro ameaçando ir embora com a bola.
- Controles: setas/WASD andam, Espaço chuta, Shift usa o especial.

### 2. Esconde-esconde
- Mundo de 960×540 (`assets/cenarios/esconde_mapa_960x540.png`), câmera 480×270 seguindo o jogador.
- Pique: o poste no meio da calçada de cima. Quem procura conta até 30.
- 11 esconderijos em `src/data/esconderijos.json` (posição, quantos cabem, dica): barracão, beco, arbusto, tambor azul, engradados do bar, muro da esquina, carro parado, mato do terreno baldio, entulho, pé de manga, quintal da casa de baixo.
- Esconder: Espaço agacha atrás do objeto; só a cabeça aparece, ou o menino fica na sombra (beco, barracão).
- Procurar: cone de visão de 60° e 140 px; quem fica 1 s dentro do cone é achado. Placar "Achados: x / 6".
- Salvar: correr até o poste antes de quem procura e bater "1, 2, 3, salve eu!".
- Pistas: o mato balança, o entulho faz barulho, o Tio do bar às vezes entrega quem está nos engradados.
- Especial do Daniel: seta por 2 s para o escondido mais próximo. O primeiro achado conta na próxima rodada.

### 3. Queimada
- A rua dividida em dois campos, com "cemitério" atrás de cada um. Queimado vai pro cemitério e volta se queimar alguém.
- Segurar Espaço carrega o arremesso; apertar na hora certa agarra a bola. Vence quem queimar todo o time adversário.

### 4. Alerta
- Um joga a bola pra cima e grita um nome; todos correm. O chamado pega a bola e grita "Alerta!"; todos congelam.
- Ele dá até 3 passos e arremessa (barra de mira oscilando). Acertou: o alvo perde 1 vida; errou: quem perde é ele. Com 3 vidas perdidas, sai.

### Falas e zoeira
Balões curtos por evento (gol, queimada, achado). Toda zoeira é entre amigos; nada que exponha alguém de verdade.

## Abertura
Fundo `assets/cenarios/rua_gameplay_480x270.png` em sépia com vinheta, fade-in de 1 s, "Itaberá, 2019..." digitado letra por letra (fonte pixel), depois "aperte qualquer tecla" piscando. Referência: `assets/preview/abertura.gif` e `assets/cenarios/tela_abertura_480x270.png`.

## Cena final do pôr do sol
1. Tela escurece, "Fim de tarde..." e o player da música final aparece para a pessoa apertar o play.
2. Plano aberto (480×270) com céu dourado, nuvens andando, pássaros, janelas acesas e o brilho do sol pulsando. Fundo: `assets/cenarios/por_do_sol_fundo_480x270.png`.
3. Seis meninos sentados no meio-fio e o Pernalonga em pé na calçada atrás deles, olhando uns para os outros. Sprites: `assets/personagens/close_hd/*_close_3frames_80x136.png` (0 normal, 1 piscando, 2 falando). Posições (centro x, base y): cezar 74,258; kaua 128,258; pedro 186,258; pernalonga 244,236 (desenhado antes); lucas 302,258; daniel 358,258; gabriel 412,258.
4. No chão: garrafas PET e de vidro, uma PET caída derramando, copos, saco de salgadinho e a bola (ver `assets/preview/cena_final_animada.gif`).
5. Zoom de câmera até 1,3× em 2 s; respiração de 1 px; piscadas em tempos diferentes; bocas falando.
6. Encerramento: a cena escurece para 38% sem parar a animação e aparece digitado: "Algo que não muda com o tempo / é a memória dos dias / de juventude." com o crédito "Sheik - The Legend of Zelda: Ocarina of Time" (referência `assets/preview/final_frase.gif`). Depois, créditos.

### Música da cena final
- Vídeo do YouTube `9qo5v22F6MU`, tocado pelo player oficial (IFrame Player API), estilizado como a tela do celular do Daniel, com no mínimo 200×200 px, sem autoplay.
- A Rádio JBL pausa ao entrar na cena. Se o vídeo bloquear incorporação (erro 101/150), mostrar "Ouvir no YouTube" e rodar a cena sem som.
- Créditos: título, artista, "todos os direitos reservados aos autores", link do vídeo. Nenhum arquivo de áudio vai para o repositório.

## Rádio JBL
- Barra fixa no topo (HTML/CSS, fora do canvas) com caixinha JBL, título da música e botões anterior / play-pause / próxima, mais seletor de estação.
- Playlist em `src/data/radio.json`: JBL do Lucas (rock/pop alternativo gringo + hits BR de 2019), JBL do Pedro (Poesia Acústica e derivados + funk) e Seleção da turma.
- Músicas com `videoId` vazio são puladas até alguém colar o ID do clipe oficial (o código depois de `watch?v=`).
- Regras do YouTube: player nunca escondido (mínimo 200×200 px quando aberto), sem autoplay, pausar quando a aba fica oculta, nada de áudio separado do vídeo, pular em erro 101/150 com link "abrir no YouTube".

## Arquivos do projeto

| Caminho | Conteúdo |
| --- | --- |
| `assets/cenarios/` | Rua do jogo, mapa do esconde-esconde, fundo e cena final, telas de abertura e frase final |
| `assets/personagens/jogo/` | Sprites de corrida 4 quadros de 40×68 |
| `assets/personagens/close_hd/` | Close 3 quadros de 80×136 (sentado ou em pé) |
| `assets/preview/` | GIFs e imagens para o README |
| `src/data/` | radio.json, esconderijos.json, personagens.json |
| `ferramentas/gerador/` | Scripts Python (Pillow) que geram todas as artes |

## Prompts para o IBM Bob

Mande um por vez e teste no navegador antes do próximo. Para rodar localmente: `python -m http.server 8000` na pasta e abra `http://localhost:8000` (abrir o index.html com dois cliques não funciona por causa dos JSON).

**1. Estrutura**
```
Leia docs/design.md, a pasta assets/ e os arquivos de src/data/. Crie um jogo web com Phaser 3 (via CDN, sem etapa de build): index.html na raiz, src/main.js e uma cena por arquivo em src/scenes/: Abertura, RuaHub, Futebol, EscondeEsconde, Queimada, Alerta e FimDeTarde. Resolução interna 480x270, pixelArt: true, escala FIT centralizada. Use caminhos relativos (./assets/...) para funcionar no GitHub Pages. A RuaHub é o menu: a rua de rua_gameplay_480x270.png com 4 pontos clicáveis, um para cada brincadeira, e o "Fim de tarde".
```

**2. Personagens e futebol**
```
Na cena Futebol, use assets/cenarios/rua_gameplay_480x270.png como fundo e os spritesheets assets/personagens/jogo/*_corrida_4frames_40x68.png (frames 40x68, animação 0-1-2-3 a 8 fps). Implemente o futebol de rua descrito em docs/design.md: traves de chinelo, 2 times, goleiros Kauã e Gabriel, IA simples para os outros, placar, vitória com 2 gols ou 3 minutos, evento "Ó o carro!" que pausa o jogo, e os atributos e especiais de src/data/personagens.json.
```

**3. Esconde-esconde, queimada e alerta**
```
Implemente a cena EscondeEsconde seguindo docs/design.md e src/data/esconderijos.json. Mundo de 960x540 com o fundo assets/cenarios/esconde_mapa_960x540.png, câmera 480x270 seguindo o jogador e limitada ao mundo. Bloqueie as áreas de areas_bloqueadas. O jogador escolhe esconder ou procurar. Escondendo: 30 s até o fim da contagem; em um esconderijo, Espaço agacha (sprite deslocado para baixo, com o objeto desenhado por cima). Procurando: cone de visão de 60 graus e 140 px; um escondido dentro do cone por 1 s é achado. A IA dos outros escolhe esconderijos respeitando o campo 'cabe' e corre para o pique quando quem procura está longe. Mostre "Achados: x / 6" e as falas de src/data/personagens.json. Depois faça a Queimada e o Alerta na rua_gameplay_480x270.png, como no design.
```

**4. Rádio JBL**
```
Crie um componente HTML/CSS fixo no topo da página, fora do canvas do Phaser: a Rádio JBL. Use a YouTube IFrame Player API com src/data/radio.json (lista de estações, cada música com titulo, artista e videoId; pule as que têm videoId vazio e, quando o título estiver vazio, use o do player). Regras obrigatórias: o player nunca fica escondido e tem no mínimo 200x200 px quando aberto; sem autoplay; pausar quando a aba ficar oculta (visibilitychange); se der erro 101 ou 150, pular para a próxima e mostrar link "abrir no YouTube". Mostre o título com getVideoData().title e botões anterior / play-pause / próxima, mais um seletor de estação.
```

**5. Abertura, cena final e frase**
```
Crie a cena Abertura (primeira do jogo) e a FimDeTarde exatamente como nas seções "Abertura" e "Cena final do pôr do sol" de docs/design.md, usando os arquivos indicados lá e os GIFs de assets/preview/ como referência visual. Música final: videoId de cenaFinal em src/data/radio.json, player de no mínimo 200x200 px estilizado como a tela do celular do Daniel, sem autoplay; a animação começa quando a pessoa aperta play; pause a Rádio JBL ao entrar; em erro 101/150, botão "Ouvir no YouTube" e cena sem som. Antes dos créditos, a frase do Sheik digitada com o crédito embaixo.
```

**6. README e licença**
```
Crie um README.md em português com: título, uma frase sobre o jogo, o link para jogar (https://SEU-USUARIO.github.io/turma-da-rua/), os GIFs de assets/preview/, os controles, como rodar localmente (python -m http.server), os créditos (turma, músicas tocadas pelo player oficial do YouTube com todos os direitos aos autores, frase do Sheik de The Legend of Zelda: Ocarina of Time, inspiração no Zueirama) e uma seção "Como o IBM Bob foi usado". Crie também um LICENSE MIT para o código. Confira se todos os caminhos são relativos e se não existe foto real nem arquivo de música no projeto.
```

Guarde prints ou exporte as conversas com o Bob em cada etapa; mostrar como a IA foi usada costuma contar na avaliação.

## Como subir pro GitHub
1. Crie uma conta em github.com e confirme o e-mail.
2. "+" → "New repository", nome `turma-da-rua`, marque **Public**, "Create repository".
3. Envie os arquivos:
   - Navegador: "Add file" → "Upload files", arraste o conteúdo da pasta (até 100 arquivos por envio, até 25 MB cada), escreva uma mensagem e "Commit changes".
   - Ou terminal do Bob:
     ```
     git init
     git add .
     git commit -m "Primeira versão do jogo"
     git branch -M main
     git remote add origin https://github.com/SEU-USUARIO/turma-da-rua.git
     git push -u origin main
     ```
4. Settings → Pages → "Build and deployment" → Source: **Deploy from a branch**, branch `main`, pasta `/(root)`, Save.
5. Em 1 ou 2 minutos o jogo fica em `https://SEU-USUARIO.github.io/turma-da-rua/`. Teste numa aba anônima e no celular.
6. Para atualizar: envie de novo ou `git add .`, `git commit -m "..."`, `git push`.
7. Antes de entregar: sem fotos reais, sem endereço da rua, sem arquivos de música; link do jogo no topo do README.
