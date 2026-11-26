# Instagram Media Studio — 0.5.0

## Novo visual

Biblioteca redesenhada com identidade em violeta, temas claro e escuro, indicação de conexão, contexto de captura, categorias com contadores e cartões com ações visíveis. A foto de perfil permanece selecionável separadamente. Os controles da biblioteca, da prévia e dos downloads seguem a mesma apresentação, com ajustes para painéis estreitos, teclado e movimento reduzido.

## Reels: vídeo, capa ou ambos

Os cartões de vídeo possuem três botões:

- **Vídeo:** baixa somente o arquivo do vídeo.
- **Capa:** baixa somente a imagem da thumbnail disponibilizada pelo Instagram.
- **Ambos:** baixa um ZIP com vídeo e capa. Os arquivos possuem nomes correspondentes, como `reels-0001.mp4` e `reels-0001-capa.jpg`.

A extensão usa a maior versão de imagem recebida nos metadados. Não amplia a capa artificialmente nem promete uma resolução que não foi disponibilizada.

Para downloads em lote, selecione as mídias, escolha **Vídeo**, **Capa** ou **Vídeo + capa** na área inferior e clique em **Baixar seleção**. Essa preferência afeta os vídeos; imagens e fotos de perfil continuam sendo baixadas normalmente. As opções também estão disponíveis na prévia de um vídeo.

Se a capa não foi identificada, os botões correspondentes ficam desabilitados no cartão. Em lotes que incluam vídeos sem capa, o painel informa quantas não estavam disponíveis. O modo **Capa** não baixa o vídeo como substituto.

## Atualizar

1. Extraia o ZIP em uma pasta permanente.
2. Substitua os arquivos da pasta da extensão instalada pelos novos arquivos.
3. Abra `edge://extensions` ou `chrome://extensions` e clique em **Recarregar**.
4. Atualize a aba do Instagram e abra o painel.

Para usar uma nova pasta, remova a instalação anterior, ative **Modo do desenvolvedor**, clique em **Carregar sem compactação** e selecione a pasta com `manifest.json`.

## Compilar e empacotar

Os scripts de captura do pacote final são os mesmos da versão 0.4.0 aprovada. O painel e o fluxo de download são compilados a partir do código-fonte atualizado. Nenhuma nova permissão é necessária.

Na raiz do projeto, com as dependências instaladas:

```sh
npm run verificar
npm run build
node scripts/empacotar-visual.mjs CAMINHO/instagram-media-studio-v0.4.0.zip CAMINHO/instagram-media-studio-v0.5.0.zip
```

O empacotador valida o SHA-256 da base aprovada, usa o painel compilado e compara byte a byte os scripts de captura, extração, contexto e serviço antes de salvar o pacote.

## Validação

- 57 testes automatizados, incluindo capas, modo padrão, seleção de URLs, extensão real de arquivo, nomes associados, lotes, ausência de capa e isolamento de requisições.
- Compilação e verificação de tipagem.
- Conferência em Chromium com dados controlados, em 280, 320, 390 e 540 px.
- Downloads reais no navegador de arquivo de vídeo, imagem de capa e ZIP com os dois; conteúdo e integridade do ZIP conferidos.
- Seleção em lote, opções na prévia, temas, grade/lista, configurações e movimento reduzido.

A sessão real do Instagram não foi acessada nesta etapa. A captura aprovada foi preservada pela comparação dos scripts funcionais.
