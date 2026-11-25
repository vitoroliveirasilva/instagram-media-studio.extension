# Histórico de alterações

[Voltar ao início](README.md)

O histórico registra funcionalidades e alterações relevantes do projeto. Os itens descrevem mudanças implementadas, não certificam que todos os cenários foram homologados.

## 0.3.0 — em desenvolvimento

- Galeria contextual por perfil, sequência de Stories, destaque e publicação.
- Captura de respostas filtrada por perfil ou publicação identificável, com emissão em lotes.
- Limpeza acessível na barra da galeria, com supressão dos itens já capturados até nova atualização ou mudança de contexto.
- Limite de galeria ampliado para 10.000 itens; homologação real pendente.

## Não publicado

### Documentação

- Reorganização do README como ponto de entrada do projeto.
- Guias de instalação, utilização, arquitetura, desenvolvimento, privacidade, testes e solução de problemas.
- Registro de limitações, critérios de aceite, convenções de contribuição e relato de vulnerabilidades.

## 0.2.0

### Melhorias

- Confirmação de conexão com o painel e tratamento aprimorado de trocas de aba.
- Controle de frequência da captura, limites de processamento e deduplicação de candidatos.
- Leitura incremental de respostas e arquivos.
- Validação de URLs e tipos MIME, restrição de redirecionamentos e política de conteúdo do painel.
- Cancelamento de preparação, tratamento de falhas parciais e limpeza de URLs de objeto.
- Preservação de categorias, miniaturas e candidatos de maior resolução.
- Ajustes de responsividade e acessibilidade.

### Qualidade

- Ampliação dos testes unitários de mídia e downloads.
- Testes simulados de captura de rede.
- Comando de verificação de sintaxe, tipagem e testes.
- Workflow de integração contínua com compilação e artefato.

Commits de referência: [b8176de](https://github.com/vitoroliveirasilva/instagram-media-studio.extension/commit/b8176de5945bbf81dc77d7a14ec7a6643ad936a3) e [8688f9a](https://github.com/vitoroliveirasilva/instagram-media-studio.extension/commit/8688f9a6ffbb4b0519b4fcc01423a0ffa7b99002).

## 0.1.0

- Primeira implementação do painel lateral.
- Captura de mídias durante a navegação.
- Filtros por Stories, publicações, Reels e destaques.
- Galeria em grade e lista, seleção, pré-visualização e downloads.
- Temas, armazenamento local de preferências e galeria por aba em memória.
- Estrutura inicial React, TypeScript, Vite e Manifest V3.

Commit de referência: [5b8eafc](https://github.com/vitoroliveirasilva/instagram-media-studio.extension/commit/5b8eafc3cd264e9a63ff1857f36a85c7756cadb9).

## Limitações conhecidas

A compilação completa e a homologação real devem ser comprovadas antes de uma distribuição estável. Consulte [testes e homologação](docs/testes-e-homologacao.md).
