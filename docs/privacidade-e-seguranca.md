# Privacidade e segurança

## Dados e tráfego

A extensão funciona no navegador, sem servidor próprio ou telemetria implementada. Mídias, candidatos e contextos ficam em memória. Apenas `temaEssencial` e `modo` são persistidos em `chrome.storage.local`; a galeria não é um arquivo permanente.

A observação de respostas da página e a recuperação ativa acessam dados disponibilizados pelo Instagram à sessão existente. Consultas adicionais são acionadas com o painel ativo e dependem de endpoints internos. Prévias e downloads requisitam arquivos aos hosts de mídia da Meta. Esses servidores recebem as informações usuais de uma conexão de rede.

## Permissões declaradas

| Permissão | Uso |
| --- | --- |
| `sidePanel` | Exibir a galeria lateral. |
| `storage` | Salvar preferências de aparência e exibição. |
| `downloads` | Solicitar arquivos ao gerenciador e liberar URLs de objeto. |
| `https://www.instagram.com/*` | Executar captura e recuperação na página do Instagram. |
| `https://*.cdninstagram.com/*` e `https://*.fbcdn.net/*` | Exibir e obter mídias dos domínios aceitos. |

Não há permissão geral para todos os sites. O pacote não solicita senhas ao usuário.

## Controles

URLs são limitadas aos hosts aceitos, com HTTPS e sem credenciais embutidas. O download omite credenciais, não envia referência da página e rejeita redirecionamentos. MIME, respostas parciais, tamanho anunciado, tamanho efetivo, tempo e cancelamento são verificados.

A política de conteúdo restringe scripts ao pacote e conexões aos hosts declarados. Código remoto não é carregado para execução. Candidatos recebidos da página passam por normalização e limites de processamento antes de compor a galeria.

## Limites dos controles

Eventos DOM e metadados da página são entradas não confiáveis e não possuem autenticação criptográfica. MIME é uma declaração do servidor, sem inspeção antimalware. Limites de download não equivalem a um teto global de memória. A solicitação ao navegador não garante gravação concluída.

Estruturas e endpoints privados do Instagram podem mudar, responder com erro ou variar entre sessões. A extensão não contorna acesso privado, proteção de mídia ou expiração. Utilize somente conteúdos autorizados e respeite os direitos dos titulares.

## Relatar problemas

Siga `SECURITY.md` para vulnerabilidades. Não publique cookies, tokens, URLs assinadas reais, conteúdo privado ou dados de terceiros em issues, logs ou capturas de tela.
