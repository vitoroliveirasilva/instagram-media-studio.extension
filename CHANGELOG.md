# Histórico de alterações

[Voltar ao início](README.md)

O histórico registra funcionalidades e alterações relevantes do projeto. Os itens descrevem mudanças implementadas, não certificam que todos os cenários foram homologados.

## 0.5.1 — navegação na mídia ampliada

- Setas anterior/próxima, teclado e gestos horizontais na prévia.
- Miniaturas e contador de posição, respeitando o filtro atual da galeria.
- Tela cheia do visualizador com navegação preservada.
- Preservação das teclas e da área de controles do vídeo.

## 0.5.0 — biblioteca e capas de vídeos

- Biblioteca redesenhada, com temas claro e escuro, status, contexto e contadores por categoria.
- Botões visíveis para baixar vídeo, somente capa ou ambos em um ZIP.
- Preferência de conteúdo nos downloads em lote e na prévia.
- Nomes correspondentes para vídeo e capa, preservando o formato real de cada arquivo.
- Tratamento explícito de capas ausentes, com 12 testes adicionais e conferência no navegador.
- Scripts funcionais de captura preservados a partir da versão 0.4.0 aprovada.

## Reformulação visual — em revisão

- Paleta coral, marca, temas claro e escuro, filtros e cartões maiores.
- Contador de mídias, controles de seleção, lista, prévia e estados vazios redesenhados.
- Ajustes para painéis estreitos, teclado e movimento reduzido.
- Empacotador visual 0.4.1 sobre a base 0.4.0 aprovada, preservando seus scripts funcionais.
- Guia de atualização e reprodução em [visual](docs/visual.md).

## 0.3.3 — em desenvolvimento

- Reconhecimento de identificadores de destaques em conjuntos e chaves de respostas, inclusive carregamentos iniciados no perfil.
- Suporte às rotas alternativas de Reels e a novos campos de vídeo e foto de perfil.
- Recuperação da foto de perfil pelo cabeçalho quando a identificação é inequívoca.
- Diagnóstico de captura opcional, com contagens técnicas sem URLs, nomes de perfis ou credenciais.

## 0.3.2 — em desenvolvimento

- Leitura limitada de metadados JSON já presentes na página, sem consultas adicionais à API.
- Preferência por foto de perfil HD declarada, sem inventar dimensões e sem substituição por miniatura de menor prioridade.
- Identificação adicional de vídeos diretos em estruturas aninhadas e do Story atual pelo identificador.
- Mensagem explícita para mídias segmentadas ou protegidas que não disponibilizam um arquivo direto completo.

## 0.3.1 — em desenvolvimento

- Suporte a endereços diretos de vídeos e imagens em estruturas GraphQL adicionais, inclusive carrosséis.
- Foto de perfil selecionável separadamente, com preferência pela melhor resolução identificada.
- Rejeição de respostas parciais no download e de URLs explicitamente segmentadas.
- Testes simulados de vídeo, carrossel e foto de perfil.

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
