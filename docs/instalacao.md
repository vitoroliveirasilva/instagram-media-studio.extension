# Instalação e atualização

[Voltar ao início](../README.md)

## Requisitos

| Componente | Requisito |
| --- | --- |
| Navegador | Chrome ou Edge estável atualizado, com painel lateral e Manifest V3. |
| Node.js | 22 LTS recomendado; o pacote declara versões a partir de 22 e inferiores a 25. |
| npm | Disponível junto ao Node.js. |
| Git | Necessário para clonar e atualizar o repositório. |
| Acesso | Permissão de leitura do repositório e acesso legítimo ao Instagram. |

Verifique o ambiente:

```powershell
node --version
npm --version
git --version
```

O Chrome 116 é o mínimo declarado no manifesto, não uma garantia de compatibilidade: APIs utilizadas no projeto podem exigir versões posteriores. Utilize o navegador atualizado. Firefox, Safari e navegadores móveis não são alvos homologados.

## Instalar a partir do código-fonte

```powershell
git clone -b dev https://github.com/vitoroliveirasilva/instagram-media-studio.extension.git
cd instagram-media-studio.extension
npm install
npm run verificar
npm run build
```

Use `npm install` enquanto não houver um arquivo de lock versionado. A pasta `dist/` deve conter `manifest.json`, `index.html`, `servico.js`, `rede.js`, `captura.js` e os recursos gerados pelo Vite.

## Instalar a partir de um artefato

1. Acesse [GitHub Actions](https://github.com/vitoroliveirasilva/instagram-media-studio.extension/actions).
2. Abra uma execução bem-sucedida da verificação para a branch e o commit desejados.
3. Baixe o artefato `instagram-media-studio`, se estiver disponível.
4. Extraia o ZIP em uma pasta dedicada.
5. Localize a pasta que contém diretamente o `manifest.json` e carregue-a no navegador.

O workflow configura retenção de 14 dias. A existência de uma configuração de CI não comprova a disponibilidade de artefatos ou a aprovação dos testes. Se não houver execução aprovada, utilize o código-fonte.

## Carregar a extensão

No Edge, abra `edge://extensions`. No Chrome, abra `chrome://extensions`.

Ative o modo de desenvolvedor, selecione **Carregar sem compactação** e escolha a pasta de saída. Não selecione um arquivo ZIP, a raiz do projeto ou a pasta `public/`. Confira o nome e a versão exibidos na lista de extensões.

Abra `https://www.instagram.com/`, autentique-se normalmente se necessário, atualize a página e clique no ícone do Instagram Media Studio. A extensão não solicita senha própria.

## Atualizar uma instalação local

Feche o painel e conclua os downloads em andamento antes de atualizar.

```powershell
git status
git switch dev
git pull --ff-only origin dev
npm install
npm run verificar
npm run build
```

Caso existam alterações locais, preserve-as antes de atualizar. Não descarte arquivos à força.

No gerenciador de extensões, clique em **Recarregar** no cartão do Instagram Media Studio. Atualize as abas abertas do Instagram e reabra o painel. Se tiver instalado por artefato, extraia a versão aprovada na pasta carregada ou remova a instalação antiga e carregue a nova.

## Remover

Feche o painel, acesse o gerenciador de extensões e selecione **Remover**. Isso encerra o uso da extensão e elimina suas preferências locais conforme o comportamento do navegador. Arquivos já baixados não são apagados automaticamente.

## Próximo passo

Consulte o [guia de utilização](utilizacao.md) ou a [solução de problemas](solucao-de-problemas.md).
