# Instagram Media Studio — atualização visual 0.4.1

O pacote 0.4.1 aplica o novo visual sobre o ZIP 0.4.0 aprovado. Os scripts de captura, extração, contexto e serviço permanecem idênticos. O JavaScript do painel recebe apenas três alterações de apresentação: marca em duas linhas, contador de mídias e identificação visual do cartão de perfil.

## O que mudou

- Paleta em coral, superfícies claras mais suaves e tema escuro em grafite.
- Marca redesenhada, tipografia e hierarquia de informações revistas.
- Filtros com indicação mais clara da categoria selecionada.
- Cartões maiores, em duas colunas no painel estreito, com ações e seleção redesenhadas.
- Melhor apresentação da foto de perfil, lista, prévia e estado vazio.
- Botões, configurações e área de download padronizados.
- Ajustes para painéis estreitos, navegação por teclado, contraste forçado e movimento reduzido.

## Atualizar a extensão

1. Extraia o ZIP.
2. Substitua os arquivos da pasta da extensão instalada pelos arquivos novos.
3. Abra `edge://extensions` ou `chrome://extensions` e clique em **Recarregar** no cartão da extensão.
4. Atualize a aba do Instagram e abra o painel novamente.

Se quiser usar uma nova pasta, remova a instalação anterior, ative **Modo do desenvolvedor**, escolha **Carregar sem compactação** e selecione a pasta com `manifest.json`.

## Reproduzir o pacote visual

A branch de desenvolvimento contém o novo estilo em `src/estilos.css` e as mesmas três mudanças de apresentação em `src/painel.tsx`. O empacotador permite aplicar essa apresentação ao pacote 0.4.0 aprovado, sem substituir seus arquivos funcionais pelos de outra versão do repositório.

Com as dependências instaladas, execute na raiz do projeto:

```sh
npm run verificar
npm run build
node scripts/empacotar-visual.mjs CAMINHO/instagram-media-studio-v0.4.0.zip CAMINHO/instagram-media-studio-v0.4.1.zip
```

O script confere o SHA-256 da base aprovada, verifica as três substituições de apresentação e confere os arquivos de captura no ZIP gerado.

## Validação

- Os 45 testes existentes do repositório passaram, assim como a tipagem e a compilação.
- O pacote visual foi aberto em Chromium com dados de exemplo: temas claro e escuro, larguras de 280, 320, 390 e 540 px, seleção, filtro de perfil, grade, lista, prévia, estado vazio, movimento reduzido e download de um MP4 completo.
- Os scripts funcionais do pacote foram comparados byte a byte com a versão 0.4.0.

A conferência visual usou dados controlados. A sessão real do Instagram não foi acessada nesta etapa; a preservação do comportamento aprovado foi verificada pela comparação dos arquivos funcionais.
