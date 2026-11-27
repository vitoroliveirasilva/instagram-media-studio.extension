# Testes e homologação

## Verificação automatizada

Execute `npm run verificar` antes de integrar e `npm run empacotar` antes de distribuir. O pipeline verifica comentários por parser, sintaxe dos scripts, manifesto do runtime, tipagem TypeScript, testes, build e estrutura do ZIP.

| Suíte | Escopo |
| --- | --- |
| `src/midias.test.ts` | URLs, identidade, qualidade, limites e foto de perfil. |
| `src/downloads.test.ts` | Leitura incremental, MIME, tamanho, arquivo vazio e cancelamento. |
| `src/capas.test.ts` | Planejamento de vídeo/capa, nomes e downloads simulados. |
| `testes/runtime-perfil.test.mjs` | Runtime distribuído: HD em `uri`, endereço inválido, fallback por ID, dados tardios e isolamento de contexto. |
| `testes/rede.test.mjs` | Implementação histórica de `public/`: extração de rede e isolamento de mídias. |

A suíte histórica complementa a cobertura; ela não substitui os testes de `runtime/`. Os testes utilizam dados simulados e não autenticam em contas reais.

## Validação da correção 0.6.1

A falha da foto de perfil foi reproduzida na 0.6.0 e a correção foi conferida em Chromium com página controlada, captura, painel e download de JPEG. Os cenários incluíram resposta indisponível, endereço expirado, metadados tardios e HD em `uri`. Também foram exercitados os fluxos de capas, lote, prévia e navegação ampliada.

Essa validação controlada não comprova compatibilidade universal com sessões reais do Instagram. A plataforma pode variar conforme conta, rota e formato de resposta.

## Roteiro manual

| Cenário | Critério de aceite |
| --- | --- |
| Instalação | Pacote carrega sem erros; versão e permissões correspondem à release. |
| Perfil | Foto aparece, utiliza o melhor candidato identificado e baixa como imagem válida. |
| Recuperação | Um endereço inválido não impede renderizar uma nova URL no mesmo cartão. |
| Posts e carrosséis | Itens pertencem ao contexto aberto e imagens/vídeos não se confundem. |
| Stories e destaques | Avanço preserva o contexto correto e não mistura outros perfis. |
| Reels | Arquivo completo disponível pode ser reproduzido e baixado. |
| Capas | Somente capa não requisita vídeo; ambos geram nomes correspondentes. |
| Capa ausente | Opção fica indisponível ou o lote informa a ausência sem substituir por vídeo. |
| Visualizador | Setas, teclado, gestos e miniaturas funcionam também em tela cheia. |
| Downloads | Progresso, cancelamento, limites e falhas parciais possuem retorno claro. |
| Contexto | Troca de aba/perfil preserva isolamento, sem reaproveitar seleção indevida. |
| Aparência | Tema escuro padrão, claro e sistema; painel estreito e foco visível. |

Registre versão, navegador, sistema, passos, resultado esperado e resultado observado. Remova identificadores pessoais, cookies e parâmetros assinados antes de compartilhar evidências.

## Critérios de publicação

A CI deve concluir com sucesso, as versões devem coincidir, as notas devem existir e o ZIP deve conter manifesto na raiz, scripts, interface e licenças. Funcionalidades alteradas devem passar pelo roteiro manual aplicável. Limitações conhecidas precisam constar na documentação, sem prometer acesso a arquivos que a origem não disponibiliza.
