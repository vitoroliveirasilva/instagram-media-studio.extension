# Desenvolvimento e publicação

## Ambiente

Use Node.js 22 e npm. O intervalo aceito é `>=22 <25`. `package.json` fixa as dependências diretas e `package-lock.json` registra sua resolução para instalação com `npm ci`.

| Comando | Finalidade |
| --- | --- |
| `npm ci` | Instalar a árvore registrada no lockfile. |
| `npm run dev` | Iniciar a interface no Vite; APIs do navegador exigem a extensão carregada. |
| `npm test` | Executar Vitest e testes Node.js. |
| `npm run verificar:comentarios` | Analisar JS, TS, TSX, CSS e HTML do projeto. |
| `npm run verificar` | Auditar comentários, sintaxe, runtime, tipagem e testes. |
| `npm run build` | Compilar `dist/`, validar manifesto e preservar licenças externas. |
| `npm run empacotar` | Compilar e gerar ZIP e SHA-256 em `artifacts/`. |

O código distribuído vem de `runtime/` e `src/`. `public/` é uma referência histórica coberta por testes; alterar somente essa pasta não corrige o pacote atual. Não versione `dist/`, `artifacts/` ou `node_modules/`.

## Convenções

Código sem comentários, com nomes claros e documentação técnica externa. O auditor usa parser para JavaScript/TypeScript e PostCSS para CSS; URLs, expressões regulares e strings não são tratadas como comentários. Licenças e avisos obrigatórios permanecem em arquivos próprios.

Use português do Brasil nas mensagens e documentos, tipagem estrita, entradas simuladas nos testes e tratamento explícito de dados não confiáveis. Preserve a direção Essencial e justifique mudanças de permissões, rede ou limites.

## Branches

`dev` concentra desenvolvimento e homologação. `prod` é a referência publicada e a branch padrão do repositório. Branches temporárias podem ser removidas depois que seu conteúdo estiver integrado e não houver trabalho pendente.

Fluxo: alteração em branch temporária ou `dev`, verificação, PR para `prod`, merge e publicação. Use merge commit para preservar ancestralidade entre branches permanentes. Após a promoção, `dev` pode receber avanço rápido para o merge de `prod`, mantendo ambas alinhadas sem reescrever histórico.

## Integração contínua

O workflow `.github/workflows/verificacao.yml` roda em pushes e PRs para `dev` e `prod`, além de execução manual. O job de verificação usa Node.js 22, `npm ci`, auditoria, testes, build e empacotamento. A extensão e o pacote ficam disponíveis como artefatos por 14 dias.

Somente um push ou execução manual em `prod`, após sucesso das verificações, habilita a publicação com permissão `contents: write`. O job baixa o pacote validado e publica uma release estável com ZIP, SHA-256 e notas da versão. PRs não publicam releases.

## Preparar uma versão

1. Alinhe as versões de `package.json`, `package-lock.json` e `runtime/manifest.json`.
2. Atualize `CHANGELOG.md` e crie `docs/releases/vVERSAO.md`.
3. Execute `npm ci`, `npm run verificar` e `npm run empacotar`.
4. Homologue os cenários afetados e registre limitações nas notas.
5. Abra e integre o PR para `prod`; acompanhe a execução e os assets da release.

A tag deve apontar para o commit publicado. Uma tag existente em outro commit faz a publicação falhar; o workflow não reescreve tags. Uma repetição no mesmo commit atualiza notas e assets da mesma versão. Para alterações de código após publicação, use uma nova versão.

A publicação no GitHub não instala a atualização no navegador e não publica o pacote nas lojas oficiais.
