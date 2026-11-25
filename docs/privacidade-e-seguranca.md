# Privacidade e segurança

[Voltar ao início](../README.md)

## Escopo

Este documento descreve a implementação da versão 0.2.0. Não representa certificação, auditoria externa, garantia de segurança absoluta ou declaração de conformidade jurídica.

## Dados tratados

| Dado | Tratamento pela extensão |
| --- | --- |
| URLs de mídia e miniatura | Mantidas em memória durante a sessão da galeria. |
| Tipo, categoria, dimensões e identificador | Utilizados para organizar e deduplicar mídias. |
| Tema e modo de visualização | Persistidos em `chrome.storage.local`. |
| Arquivos baixados | Encaminhados ao gerenciador de downloads do navegador. |
| Respostas de rede | Inspecionadas temporariamente quando elegíveis; respostas completas não são persistidas. |
| Senhas, cookies e cabeçalhos de autenticação | Não são coletados ou armazenados deliberadamente pela extensão. |

A extensão não possui backend próprio, telemetria implementada ou serviço externo de armazenamento de mídias. O Instagram, os servidores de mídia e o navegador continuam sujeitos aos seus próprios mecanismos de processamento, cache e privacidade. URLs podem incluir parâmetros temporários de acesso e devem ser tratadas como informações sensíveis.

## Permissões do manifesto

| Permissão | Justificativa |
| --- | --- |
| `sidePanel` | Abrir e manter a galeria no painel lateral. |
| `storage` | Guardar preferências de tema e modo. |
| `downloads` | Encaminhar arquivos e consultar o estado de downloads iniciados. |
| `https://www.instagram.com/*` | Executar scripts apenas nas páginas correspondentes. |
| `https://*.cdninstagram.com/*` | Carregar e obter arquivos de mídia. |
| `https://*.fbcdn.net/*` | Carregar e obter arquivos de mídia hospedados pela Meta. |

Não são declaradas permissões abrangentes como `<all_urls>`, `cookies`, `debugger` ou `webRequest`.

## Controles implementados

- Validação de protocolo HTTPS, domínio de mídia, credenciais embutidas e portas não padrão.
- Normalização e restrição de campos recebidos da página.
- Política de segurança de conteúdo restringindo scripts, conexões, imagens e mídias nas páginas da extensão.
- Solicitações explícitas de download sem credenciais, sem referência de origem e sem aceitar redirecionamentos.
- Lista de tipos MIME aceitos e rejeição de arquivos vazios.
- Limites de volume, tempo e processamento.
- Captura vinculada às conexões do painel, sem navegação automatizada ou consultas adicionais à API do Instagram.

A política de conteúdo do painel não se estende automaticamente ao contexto principal da página. As requisições feitas pelo próprio Instagram mantêm seu comportamento original; as garantias de omissão de credenciais e bloqueio de redirecionamentos referem-se ao módulo de preparação de downloads, não a todas as pré-visualizações feitas pelo navegador.

## Riscos residuais

| Risco | Situação |
| --- | --- |
| Eventos DOM forjados pela página | Campos e URLs são validados, mas não há autenticação criptográfica da mensagem. |
| Mídias carregadas antecipadamente | Podem aparecer na galeria mesmo antes de serem visualizadas. |
| URLs expiradas | A extensão não renova assinaturas automaticamente. |
| Arquivos maliciosos | O MIME é declarado pelo servidor; não há antivírus nem validação de assinatura binária. |
| Consumo de memória | Limites reduzem o impacto, mas ZIP e várias abas podem elevar o uso total. |
| Dependências | Não há arquivo de lock versionado na revisão documentada; reprodução exata e auditoria de dependências precisam de atenção. |
| Alterações no Instagram | Podem comprometer captura, classificação ou reprodução. |

## Retenção e exclusão

Limpar a galeria remove os itens da aba atual no painel, sem impedir novas capturas. Fechar o painel encerra seu estado em memória; a remoção da aba elimina sua entrada do mapa de galerias. Preferências permanecem até serem alteradas ou removidas conforme o comportamento do navegador. Downloads já gravados devem ser excluídos pelo usuário se não forem mais necessários.

## Uso responsável

Use a extensão apenas em relação a mídias às quais tenha acesso legítimo e autorização para copiar ou utilizar. A possibilidade técnica de visualizar um arquivo não implica autorização para redistribuí-lo. Não utilize a ferramenta para contornar controles de acesso, coletar conteúdo privado sem consentimento ou violar direitos de terceiros.

Para comunicar uma falha, siga a [política de segurança](../SECURITY.md).

Na versão 0.3.0 em desenvolvimento, o nome de perfil ou identificador da publicação/destaque é usado temporariamente para identificar o contexto da galeria. Esses dados não são persistidos. A captura estruturada restringe candidatos ao contexto identificável; a leitura do DOM permanece heurística. A limpeza mantém temporariamente identificadores suprimidos na conexão atual, até atualização ou mudança de contexto, com limite de 20.000 entradas.
