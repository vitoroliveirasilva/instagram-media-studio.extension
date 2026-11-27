# Instagram Media Studio

Extensão para Microsoft Edge e Google Chrome que reúne as mídias do Instagram em um painel lateral: visualize, selecione e baixe publicações, Stories, destaques, Reels e fotos de perfil.

**Versão 0.6.1 · Manifest V3 · Processamento no navegador · Licença MIT**

[Baixar versão publicada](https://github.com/vitoroliveirasilva/instagram-media-studio.extension/releases/latest) · [Histórico](CHANGELOG.md) · [Verificações](https://github.com/vitoroliveirasilva/instagram-media-studio.extension/actions)

## Recursos

| Recurso | Comportamento |
| --- | --- |
| Galeria contextual | Organiza as mídias por aba e contexto de navegação, com filtros, grade e lista. |
| Foto de perfil | Prioriza a versão HD declarada e tenta recuperar endereços que falharam. |
| Reels e vídeos | Permite baixar somente vídeo, somente capa ou vídeo e capa em ZIP. |
| Visualizador | Prévia com setas, teclado, gestos, miniaturas e tela cheia. |
| Downloads em lote | Seleção múltipla, progresso, cancelamento e indicação de falhas parciais. |
| Visual Essencial | Preto e violeta, tema escuro padrão e opções claro e sistema. |

A captura depende dos arquivos e metadados disponibilizados pelo Instagram para a sessão aberta. Vídeos segmentados ou protegidos podem não fornecer um arquivo completo para download. A extensão não reconstrói transmissões segmentadas nem contorna controles de acesso.

## Instalação

1. Baixe o arquivo `instagram-media-studio-v0.6.1.zip` na página de releases e extraia em uma pasta permanente.
2. Abra `edge://extensions` ou `chrome://extensions` e ative o **Modo do desenvolvedor**.
3. Selecione **Carregar sem compactação** e escolha a pasta que contém `manifest.json`.
4. Abra ou atualize o Instagram e clique no ícone da extensão.

O ZIP é um pacote compilado para instalação manual; não representa publicação nas lojas dos navegadores. Consulte o [guia de instalação](docs/instalacao.md) para atualização e verificação SHA-256.

## Desenvolvimento

Utilize Node.js 22 e npm. O manifesto declara Chrome 116 como mínimo; a homologação em versões antigas não está garantida.

```sh
git clone -b dev https://github.com/vitoroliveirasilva/instagram-media-studio.extension.git
cd instagram-media-studio.extension
npm ci
npm run verificar
npm run empacotar
```

A pasta `dist/` contém a extensão. `artifacts/` recebe o ZIP e seu SHA-256. A geração usa somente o código deste repositório, sem depender de pacotes de versões anteriores.

## Documentação

| Documento | Finalidade |
| --- | --- |
| [Instalação](docs/instalacao.md) | Instalar, atualizar, compilar e conferir o pacote. |
| [Utilização](docs/utilizacao.md) | Captura, seleção, capas, downloads e navegação ampliada. |
| [Arquitetura](docs/arquitetura.md) | Módulos, comunicação, estado e limites. |
| [Desenvolvimento](docs/desenvolvimento.md) | Comandos, convenções, CI e publicação. |
| [Testes e homologação](docs/testes-e-homologacao.md) | Cobertura automatizada e roteiro de validação manual. |
| [Privacidade e segurança](docs/privacidade-e-seguranca.md) | Permissões, tráfego, armazenamento e fronteiras de confiança. |
| [Solução de problemas](docs/solucao-de-problemas.md) | Diagnóstico por sintoma. |
| [Direção visual](docs/visual.md) | Padrões da interface Essencial. |
| [Notas da versão](docs/releases/v0.6.1.md) | Conteúdo da distribuição atual. |
| [Contribuição](CONTRIBUTING.md) | Fluxo de trabalho e requisitos de integração. |
| [Segurança](SECURITY.md) | Comunicação responsável de vulnerabilidades. |

## Privacidade e limites

Não há backend próprio, cadastro adicional ou telemetria implementada. A galeria permanece em memória; tema e modo de visualização são salvos localmente. A captura e a recuperação podem consultar o Instagram usando a sessão existente; prévias e downloads acessam os servidores de mídia da Meta.

A galeria admite até 10.000 mídias por aba. Cada operação de download possui orçamento de 250 MiB de conteúdo e prazo de 60 segundos por arquivo. URLs podem expirar e a qualidade máxima depende da origem. Consulte os guias técnicos para conhecer os controles e suas limitações.

Utilize conteúdos para os quais tenha autorização. Projeto independente, sem vínculo oficial com o Instagram ou a Meta. Distribuído sob a [licença MIT](LICENSE); o pacote inclui as licenças das dependências em `THIRD-PARTY-LICENSES.txt`.
