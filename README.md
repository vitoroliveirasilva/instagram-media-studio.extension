# Instagram Media Studio

Extensão para Google Chrome e Microsoft Edge que reúne imagens e vídeos carregados durante a navegação no Instagram, em um painel lateral independente das ferramentas de desenvolvedor.

## Instalação local

Requisitos: Node.js 22 LTS e npm.

```powershell
git clone -b dev https://github.com/vitoroliveirasilva/instagram-media-studio.extension.git
cd instagram-media-studio.extension
npm install
npm run verificar
npm run build
```

1. Abra `edge://extensions` ou `chrome://extensions`.
2. Ative o modo de desenvolvedor.
3. Clique em **Carregar sem compactação** e selecione a pasta `dist`.
4. Abra ou atualize o Instagram, fixe a extensão na barra de ferramentas e clique no ícone.

## Uso

Navegue normalmente com o painel aberto. A extensão identifica imagens e vídeos em elementos visíveis e em respostas de mídia já carregadas pela página. Utilize os filtros de publicações, Stories, Reels e destaques, alterne entre grade e lista, selecione arquivos ou abra a pré-visualização. O download individual usa o navegador e a seleção de vários itens gera um ZIP.

## Privacidade e limites

A captura ocorre somente enquanto o painel estiver conectado à aba ativa do Instagram. A galeria permanece em memória durante a sessão do painel e é separada por aba; apenas as preferências de aparência e visualização são persistidas. Não há armazenamento de cookies, senhas, cabeçalhos de autenticação ou respostas completas, nem consultas adicionais à API do Instagram. Não há servidor externo. Baixe apenas mídias para as quais possua autorização.

A captura depende da estrutura atual do Instagram. URLs podem expirar, vídeos segmentados ou protegidos podem não estar disponíveis e nem todas as mídias carregadas antecipadamente pela página correspondem ao item em exibição. Downloads individuais e em lote têm limite de 250 MiB de conteúdo, com leitura incremental, verificação de formato, cancelamento e indicação de falhas parciais. O ZIP pode exigir memória adicional para montagem. A extensão não contorna controles de acesso, não navega automaticamente e não garante a captura de todas as mídias. A galeria mantém até mil mídias por aba.

## Desenvolvimento

React, TypeScript, Vite, Tailwind CSS, Lucide, JSZip e Manifest V3. Os scripts executados na página usam JavaScript nativo. Os testes unitários abrangem normalização, validação de URLs, deduplicação, limites, formatos de arquivo e leitura incremental. O comando de verificação também valida a sintaxe dos scripts e a tipagem TypeScript.

```powershell
npm test
npm run build
```

A validação funcional no Instagram autenticado deve ser realizada no navegador após a instalação.

## Verificação manual

- Abra o painel em uma aba do Instagram e navegue por imagens, carrosséis, Stories, destaques e Reels.
- Troque de aba, volte ao Instagram e confirme que as galerias permanecem separadas.
- Teste a seleção por filtro, a pré-visualização, o cancelamento e os downloads individuais e em ZIP.
- Teste mídia expirada, ausência de mídia e os três temas.
- Feche o painel e confirme que a captura não continua ativa.
