# Testes e homologação

[Voltar ao início](../README.md)

## Objetivo

Separar a existência dos testes da evidência de que eles foram executados e passaram. Uma extensão que compila ainda pode apresentar incompatibilidades com o Instagram ou com o navegador.

## Verificações automatizadas

```powershell
npm install
npm run verificar
npm run build
```

| Suíte | Cobertura prevista no código |
| --- | --- |
| `src/midias.test.ts` | URLs inseguras, fragmentos, duplicatas, resolução, miniaturas, categorias, dimensões, limites e MIME. |
| `src/downloads.test.ts` | Preservação de bytes, tipo declarado, tamanho anunciado e real, arquivo vazio e cancelamento. |
| `testes/rede.test.mjs` | Captura desativada, maior resolução, preservação da resposta original, vídeo e miniatura, domínios/rotas não elegíveis e desligamento durante resposta. |
| `npm run verificar` | Sintaxe dos três scripts públicos, tipagem e suítes acima. |
| Workflow de CI | Verificações, compilação, presença de arquivos declarados e empacotamento. |

Os testes de rede utilizam respostas sintéticas. Não autentificam no Instagram, não comprovam o funcionamento do DOM real e não substituem testes ponta a ponta do painel.

## Roteiro de homologação manual

Utilize uma conta e mídias de teste próprias ou autorizadas. Registre navegador, versão, sistema operacional, commit e resultado de cada caso. Não registre senhas, cookies, URLs assinadas ou conteúdo privado nos relatórios.

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| H01 | Instalação no Edge | Extensão carregada sem erros e painel aberto pelo ícone. |
| H02 | Instalação no Chrome | Mesmo comportamento observado no navegador suportado. |
| H03 | Painel fora do Instagram | Estado de orientação, sem captura da página externa. |
| H04 | Publicação de imagem | Mídia elegível aparece com miniatura e classificação adequada. |
| H05 | Carrossel de imagens e vídeos | Itens elegíveis aparecem individualmente ao navegar pelo carrossel. |
| H06 | Story de imagem | Imagem elegível disponível na galeria. |
| H07 | Story de vídeo | Vídeo elegível com prévia ou indicação de indisponibilidade. |
| H08 | Destaques | Mídias classificadas como destaques quando identificáveis. |
| H09 | Reel | Vídeo elegível identificado sem duplicar sua miniatura. |
| H10 | Filtros | Apenas a categoria escolhida é exibida; Todas reúne os itens. |
| H11 | Seleção entre filtros | Seleção preservada entre filtros; contagem total correta. |
| H12 | Troca de abas | Galerias separadas; seleção reiniciada. |
| H13 | Grade e lista | Layout adequado em painéis estreitos e largos. |
| H14 | Temas | Sistema, claro e escuro aplicados e lembrados. |
| H15 | Pré-visualização | Imagem ampliada e vídeo reproduzível quando suportado; fechamento por Esc. |
| H16 | Download individual | Arquivo válido, extensão adequada e destino conforme configuração. |
| H17 | ZIP | Arquivo íntegro, nomes válidos, mídias esperadas e sem perda não informada. |
| H18 | Falha parcial | Itens disponíveis são baixados e falhas contabilizadas. |
| H19 | Todas as mídias indisponíveis | Mensagem de erro e nenhum ZIP vazio solicitado. |
| H20 | Limite de tamanho | Operação respeita 250 MiB de conteúdo e informa falha. |
| H21 | Cancelamento | Preparação interrompida, sem encaminhar arquivo ainda não solicitado. |
| H22 | Limpar galeria | Estado da aba limpo; novas capturas podem voltar a preencher a galeria. |
| H23 | Fechar e reabrir painel | Estado anterior de mídias não persistido; preferências preservadas. |
| H24 | Navegação e recarga | Reconexão após atualização; sem mensagens antigas indevidas. |
| H25 | URLs expiradas e formatos não suportados | Falha tratada, sem travamento ou bypass de controles de acesso. |
| H26 | Teclado e alto contraste | Controles alcançáveis, foco visível e seleção distinguível. |
| H27 | Sessão prolongada | Navegação funcional e ausência de crescimento descontrolado perceptível de recursos. |
| H28 | Fechar painel durante captura | Observação de mídias interrompida após a última desconexão. |
| H29 | Mídias de baixa resolução e avatares | Elementos irrelevantes filtrados conforme heurísticas, sem descartar conteúdo esperado indevidamente. |

## Modelo de registro

| Campo | Preenchimento |
| --- | --- |
| Commit e versão | Identificador exato da compilação. |
| Ambiente | Navegador, versão e sistema operacional. |
| Caso | ID do cenário. |
| Resultado | Aprovado, reprovado, bloqueado ou não executado. |
| Evidência | Descrição ou imagem anonimizada. |
| Observação | Erro, restrição, resultado divergente ou comportamento esperado. |

## Critérios de aceite para publicação

- Tipagem, sintaxe, testes e compilação aprovados no commit que será distribuído.
- Instalação e abertura do painel confirmadas nos navegadores suportados.
- Captura, filtros, seleção, prévias e downloads validados com mídias de teste autorizadas.
- Ausência de falhas críticas conhecidas de segurança, perda silenciosa de dados ou travamento.
- Limitações remanescentes registradas e aceitas explicitamente.
- Manifesto, versão, histórico e instruções de instalação coerentes.

## Estado da validação

Na revisão documentada, a sintaxe dos scripts públicos e a leitura dos JSONs haviam sido verificadas. As suítes e a integração contínua estavam implementadas, mas não havia evidência de uma execução completa aprovada, compilação bem-sucedida ou homologação em sessão real do Instagram.

Os cenários acima são critérios de teste, não resultados já obtidos. Atualize o registro quando houver evidências do commit correspondente.

## Regressão contextual (0.3.0)

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| H30 | Abrir Stories de um perfil e avançar | Manter somente o conjunto desse perfil, sem reiniciar a cada Story. |
| H31 | Abrir Stories de outro perfil | Reiniciar a galeria; não misturar conjuntos. |
| H32 | Abrir uma publicação do perfil | Exibir apenas as mídias identificadas da publicação/carrossel, sem itens da grade anterior. |
| H33 | Voltar ao perfil e abrir outra publicação | Atualizar o contexto sem manter mídias anteriores. |
| H34 | Limpar galeria | Remover mídias e seleção; não repor imediatamente os mesmos identificadores enquanto a conexão permanecer ativa. |
| H35 | Atualizar após limpar | Permitir nova leitura dos elementos visíveis. |
| H36 | Resposta com mais de 150 mídias elegíveis | Receber múltiplos lotes, respeitando limites de processamento e galeria. |

Os casos são pendentes de execução no navegador. Os testes simulados cobrem isolamento por autor, carrossel, avanço de Story, transição do perfil aos Stories e emissão em lotes.
