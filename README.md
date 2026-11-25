# Instagram Media Studio

**Suas mídias do Instagram, organizadas em um único painel.**

Extensão de navegador para identificar, visualizar, selecionar e baixar imagens e vídeos carregados durante a navegação no Instagram. A galeria funciona no painel lateral, sem depender das ferramentas de desenvolvedor do navegador e sem exigir um servidor próprio.

![Versão](https://img.shields.io/badge/vers%C3%A3o-0.2.0-9d467b)
![Manifesto](https://img.shields.io/badge/Manifest-V3-555)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-555)

> **Estado do projeto:** desenvolvimento e homologação. A versão 0.2.0 é a primeira candidata à distribuição, desenvolvida na branch `dev` e integrada à `prod` por pull request. A compatibilidade funcional com sessões reais do Instagram ainda precisa ser comprovada. Não se trata de uma publicação oficial nas lojas de extensões.

## Funcionalidades

| Recurso | Descrição |
| --- | --- |
| Painel lateral | Galeria acessível ao lado da página do Instagram. |
| Captura durante a navegação | Identificação de mídias em elementos visíveis e respostas de mídia já carregadas pela página. |
| Organização | Filtros por publicações, Stories, Reels e destaques. |
| Visualização | Grade responsiva, lista, miniaturas e pré-visualização de imagens e vídeos. |
| Seleção | Seleção individual, múltipla e de todos os itens do filtro atual. |
| Downloads | Arquivo individual ou ZIP com várias mídias, com progresso da preparação e cancelamento. |
| Aparência | Temas claro, escuro e automático, com preferências salvas localmente. |
| Galerias por aba | Separação das mídias em memória enquanto o painel permanece aberto. |

A identificação de mídias e categorias é baseada em heurísticas. O Instagram pode alterar sua estrutura, carregar mídias antecipadamente ou fornecer vídeos que a extensão não consegue baixar diretamente.

## Instalação rápida

### Pré-requisitos

- Google Chrome ou Microsoft Edge atualizado, com suporte a extensões Manifest V3 e painel lateral.
- Git, Node.js 22 LTS e npm, caso a instalação seja feita a partir do código-fonte.
- Acesso ao repositório e às mídias que serão utilizadas.

O manifesto declara Chrome 116 como versão mínima; a compatibilidade efetiva com versões antigas não foi homologada. Recomenda-se utilizar uma versão estável atualizada.

### 1. Obter e compilar

```powershell
git clone -b dev https://github.com/vitoroliveirasilva/instagram-media-studio.extension.git
cd instagram-media-studio.extension
npm install
npm run verificar
npm run build
```

A extensão pronta para instalação será gerada na pasta `dist/`. Se uma verificação falhar, corrija o problema antes de carregar o resultado.

### 2. Instalar no navegador

| Navegador | Página de gerenciamento |
| --- | --- |
| Microsoft Edge | `edge://extensions` |
| Google Chrome | `chrome://extensions` |

1. Abra a página correspondente no navegador.
2. Ative o **Modo de desenvolvedor**.
3. Clique em **Carregar sem compactação** (ou opção equivalente).
4. Selecione a pasta `dist`, não a raiz do repositório.
5. Fixe o ícone da extensão na barra de ferramentas, se desejar.
6. Abra ou atualize a página do Instagram e clique no ícone da extensão.

Para instalar sem compilar, consulte a [página de releases](https://github.com/vitoroliveirasilva/instagram-media-studio.extension/releases) e utilize o ZIP compilado da versão desejada, se estiver publicado. Também é possível usar o artefato da [integração contínua](https://github.com/vitoroliveirasilva/instagram-media-studio.extension/actions), caso exista uma execução bem-sucedida para a versão desejada. Consulte o [guia de instalação](docs/instalacao.md).

## Como utilizar

1. Abra o Instagram e o painel lateral da extensão.
2. Navegue normalmente pelas publicações, Stories, destaques ou Reels.
3. Escolha um filtro e alterne entre grade e lista.
4. Clique em uma mídia para selecioná-la ou use o ícone de expansão para pré-visualizá-la.
5. Baixe um item pelo botão individual ou selecione vários e utilize **Baixar mídias selecionadas**.

Os downloads são encaminhados ao gerenciador do navegador, na subpasta `Instagram Media Studio/` do destino configurado. A extensão não confirma a conclusão de todos os downloads; consulte o gerenciador para acompanhar o resultado.

## Documentação

| Documento | Conteúdo |
| --- | --- |
| [Instalação e atualização](docs/instalacao.md) | Configuração local, instalação pelo código ou artefato e remoção. |
| [Guia de utilização](docs/utilizacao.md) | Galeria, filtros, seleção, prévia, downloads e configurações. |
| [Arquitetura técnica](docs/arquitetura.md) | Estrutura do projeto, comunicação, fluxo de dados e decisões técnicas. |
| [Privacidade e segurança](docs/privacidade-e-seguranca.md) | Permissões, dados, controles, riscos e limites de confiança. |
| [Desenvolvimento](docs/desenvolvimento.md) | Ambiente, comandos, padrões e integração contínua. |
| [Testes e homologação](docs/testes-e-homologacao.md) | Cobertura dos testes, critérios de aceite e roteiro manual. |
| [Solução de problemas](docs/solucao-de-problemas.md) | Diagnóstico de captura, painel, compilação e downloads. |
| [Histórico de alterações](CHANGELOG.md) | Evolução das versões. |
| [Contribuição](CONTRIBUTING.md) | Convenções do repositório e processo de alterações. |
| [Relato de vulnerabilidades](SECURITY.md) | Orientações para comunicação responsável. |

## Tecnologias

React 19 · TypeScript 5.8 · Vite 6 · Tailwind CSS 3 · Lucide React · JSZip · Vitest · Manifest V3 · JavaScript nativo · GitHub Actions.

## Privacidade e limitações

O processamento ocorre no navegador. Não há backend próprio, cadastro adicional, telemetria implementada ou persistência da galeria. Apenas tema e modo de visualização são armazenados pela extensão. A visualização e o download fazem requisições aos servidores de mídia do Instagram/Meta.

A galeria é limitada a mil itens por aba; downloads individuais e em lote têm limite de 250 MiB de conteúdo. URLs podem expirar, formatos podem ser rejeitados e vídeos segmentados ou protegidos podem não estar disponíveis. A extensão não contorna controles de acesso, não navega automaticamente e não promete recuperar mídias removidas ou expiradas.

Utilize apenas conteúdos para os quais tenha autorização e respeite direitos autorais, privacidade e as regras da plataforma.

## Licença

Distribuído sob a [licença MIT](LICENSE). Projeto independente, sem vínculo oficial com o Instagram ou a Meta.
