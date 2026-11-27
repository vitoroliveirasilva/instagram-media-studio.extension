# Arquitetura técnica

## Componentes

Extensão Manifest V3 sem backend próprio. Vite compila a interface de `src/` e copia os scripts de `runtime/` para `dist/`. O diretório `public/` contém a implementação histórica exercitada pelos testes legados e não participa do pacote atual.

| Componente | Responsabilidade |
| --- | --- |
| `runtime/manifest.json` | Identidade, permissões, injeção e política de conteúdo. |
| `runtime/servico.js` | Configuração de abertura do painel lateral. |
| `runtime/contexto.js` | Identificação e isolamento do contexto de navegação. |
| `runtime/perfil.js` | Normalização, prioridade HD e reconhecimento da foto no DOM. |
| `runtime/extrator.js` | Extração de candidatos e associação de mídia ao contexto. |
| `runtime/rede.js` | Observação de respostas, cache reduzido e recuperação sob demanda. |
| `runtime/captura.js` | Coleta no contexto isolado e comunicação com o painel. |
| `src/painel.tsx` | Galeria, seleção, conexão, recuperação e visualizador. |
| `src/midias.ts` | Validação, identidade, deduplicação e nomes de arquivo. |
| `src/downloads.ts` | Planejamento de vídeo/capa, leitura limitada e ZIP. |
| `scripts/` | Auditoria, validação do runtime, finalização e empacotamento. |

## Fluxo de dados

Os scripts MAIN iniciam em `document_start`; a captura isolada inicia em `document_idle`. O painel conecta-se à aba por uma porta `ims-painel`. Eventos DOM transportam candidatos reduzidos entre os contextos; a captura valida os campos antes de enviá-los à interface.

O observador mantém em memória um cache limitado de candidatos sanitizados de respostas elegíveis. A abertura do painel ativa a coleta contextual e a recuperação adicional. Essas consultas usam endpoints internos do Instagram e podem depender da sessão. Fechar o painel interrompe a coleta ativa; os wrappers da página permanecem até o descarregamento.

O painel normaliza e deduplica as mídias por aba e contexto. A foto de perfil recebe prioridade própria; erros de imagem são associados ao identificador e à URL, permitindo usar um novo endereço no mesmo cartão. Uma falha pode iniciar recuperação limitada, com descarte temporário do endereço inválido.

## Estado e confiança

A galeria e os caches são voláteis. `chrome.storage.local` guarda `temaEssencial` e `modo`. A troca de aba reinicia seleção e prévia e cancela uma preparação de download ativa.

A página pode emitir eventos DOM e fornecer metadados arbitrários. Esses eventos não constituem uma origem autenticada: URLs, dimensões, tipos e tamanhos devem ser validados na entrada e novamente no download. A comunicação não transporta cookies nem corpos completos de resposta ao painel.

## Limites relevantes

| Operação | Limite |
| --- | --- |
| Galeria | 10.000 mídias por aba. |
| Normalização por mensagem | 150 candidatos; captura em lotes de até 100. |
| Percurso do extrator | 60.000 objetos e até 5.000 itens por array. |
| Resposta observada | 12.000.000 bytes. |
| Cache de candidatos de rede | 1.500 entradas. |
| Foto inválida | Cache de até 50 URLs, com validade de 120 segundos. |
| Recuperação automática no painel | Até três tentativas por contexto em 60 segundos; repetição da mesma URL limitada. |
| Download | 250 MiB acumulados por operação e 60 segundos por arquivo. |

Os limites não são um teto global de memória. DOM, respostas materializadas pelo navegador, prévias e montagem do ZIP têm custos adicionais.

## Download e distribuição

O download aceita somente HTTPS nos hosts de mídia permitidos, sem credenciais, com redirecionamentos bloqueados e validação MIME. Respostas 206 e `Content-Range` são recusadas. O leitor incremental aplica o orçamento de bytes e o sinal de cancelamento.

Uma saída é encaminhada diretamente; múltiplas saídas são agrupadas por JSZip com armazenamento sem recompressão. A URL de objeto é liberada ao concluir, interromper ou atingir o prazo de limpeza. O navegador confirma a solicitação, sem garantir conclusão do arquivo no disco.

O build remove comentários dos arquivos distribuídos e transfere os avisos legais incorporados para `THIRD-PARTY-LICENSES.txt`, junto das licenças das dependências. O empacotador verifica versões, integridade CRC e arquivos essenciais, e gera ZIP e SHA-256 sem depender de distribuições anteriores.
