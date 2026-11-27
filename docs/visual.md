# Instagram Media Studio — 0.6.1 · Essencial

## Visual Essencial

Implementação da direção aprovada: preto profundo, violeta discreto, cabeçalho compacto com ícone de abertura, contexto de captura, filtros sublinhados e galeria em duas colunas sem contornos externos nos cartões. O banner promocional foi removido para dar mais espaço às mídias.

O tema escuro passa a ser o padrão desta apresentação. As opções claro e sistema continuam disponíveis em **Configurações**. A preferência do Essencial é salva separadamente das versões anteriores.

## Correção da foto de perfil

O painel passa a associar falhas ao endereço da imagem, permitindo que uma URL nova seja carregada no mesmo cartão. Quando a foto falha, a extensão tenta recuperar outra versão, descarta temporariamente o endereço inválido e aceita o formato HD disponível em `url` ou `uri`.

Também foram ajustados o reconhecimento da foto no perfil sem `header`, o carregamento tardio dos dados e a preferência por HD sem inventar dimensões. A recuperação possui limites para evitar requisições repetidas. O botão **Atualizar galeria** permite uma nova tentativa manual.

## Reels: vídeo, capa ou ambos

No ícone de download com seta de cada cartão de vídeo, abra o menu com três opções:

- **Somente vídeo:** baixa somente o arquivo do vídeo.
- **Somente capa:** baixa somente a imagem da thumbnail disponibilizada pelo Instagram.
- **Vídeo + capa:** baixa um ZIP com vídeo e capa. Os arquivos possuem nomes correspondentes, como `reels-0001.mp4` e `reels-0001-capa.jpg`.

A extensão usa a maior versão de imagem recebida nos metadados. Não amplia a capa artificialmente nem promete uma resolução que não foi disponibilizada.

Para downloads em lote, selecione as mídias, escolha **Vídeo**, **Capa** ou **Vídeo + capa** na área inferior e clique em **Baixar seleção**. Essa preferência afeta os vídeos; imagens e fotos de perfil continuam sendo baixadas normalmente. As opções também estão disponíveis na prévia de um vídeo.

Se a capa não foi identificada, as opções correspondentes ficam desabilitadas no menu do cartão. Em lotes que incluam vídeos sem capa, o painel informa quantas não estavam disponíveis. O modo **Capa** não baixa o vídeo como substituto.

## Navegar pela mídia ampliada

- Setas laterais e teclas **← / →** passam para a mídia anterior ou seguinte do filtro atual.
- Arraste horizontalmente com o mouse ou deslize com o dedo sobre a mídia para navegar.
- A faixa de miniaturas permite abrir uma mídia diretamente; o contador mostra a posição.
- O botão **Tela cheia** amplia o visualizador mantendo setas e miniaturas disponíveis.
- As extremidades da coleção ficam desabilitadas, sem voltar automaticamente ao início.
- As teclas e os gestos sobre a área de controles do vídeo continuam reservados ao player.

## Atualizar

1. Extraia o ZIP em uma pasta permanente.
2. Substitua os arquivos da pasta da extensão instalada pelos novos arquivos.
3. Abra `edge://extensions` ou `chrome://extensions` e clique em **Recarregar**.
4. Atualize a aba do Instagram e abra o painel.

Para usar uma nova pasta, remova a instalação anterior, ative **Modo do desenvolvedor**, clique em **Carregar sem compactação** e selecione a pasta com `manifest.json`.

## Compilar e empacotar

O código efetivamente distribuído da captura está em `runtime/`; o Vite usa essa pasta como diretório público. O painel e os downloads são compilados de `src/`. A versão 0.6.1 corrige a recuperação de perfis; contexto e serviço permanecem iguais à base aprovada. Nenhuma nova permissão é necessária.

Na raiz do projeto, com as dependências instaladas:

```sh
npm run verificar
npm run build
node scripts/empacotar-visual.mjs CAMINHO/instagram-media-studio-v0.4.0.zip CAMINHO/instagram-media-studio-v0.6.1.zip
```

O empacotador valida o SHA-256 da base aprovada e usa o painel compilado e os arquivos atuais de `runtime/`. Cada arquivo distribuído é comparado com essa fonte, e contexto/serviço também são comparados com a base. Os testes de runtime verificam os scripts efetivamente enviados no ZIP; os testes antigos em `public/` continuam como cobertura histórica.

## Validação

- 65 testes automatizados, incluindo capas, modo padrão, seleção de URLs, extensão real de arquivo, nomes associados, lotes, ausência de capa e isolamento de requisições.
- Compilação e verificação de tipagem.
- Conferência em Chromium com dados controlados, em 280, 320, 390 e 540 px.
- Downloads reais no navegador de arquivo de vídeo, imagem de capa e ZIP com os dois; conteúdo e integridade do ZIP conferidos.
- Seleção em lote, opções na prévia, temas, grade/lista, configurações e movimento reduzido.
- Navegação conferida no navegador com setas, teclado, miniaturas, limites da galeria, mouse, toque, tela cheia, filtro atual e Escape. A barra e as teclas do player de vídeo preservam seu comportamento.

A falha foi reproduzida em Chromium no pacote 0.6.0: uma URL nova atualizava o cabeçalho, mas o cartão permanecia preso ao erro. A versão 0.6.1 foi testada com a cadeia real de scripts do ZIP: dados da página → captura → painel → filtro Perfil → download do JPEG. Foram conferidos endereço expirado, recuperação automática, HD em `uri`, API indisponível e foto tardia sem `header`. A sessão real do Instagram não foi acessada nesta etapa.
