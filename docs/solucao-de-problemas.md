# Solução de problemas

[Voltar ao início](../README.md)

## Diagnóstico rápido

| Sintoma | Verificação inicial |
| --- | --- |
| Extensão não carrega | Confirme que a pasta selecionada contém o manifesto compilado. |
| Ícone não abre o painel | Atualize o navegador e recarregue a extensão. |
| Galeria vazia | Abra o Instagram na aba ativa, atualize a página e navegue com o painel aberto. |
| Mídia no filtro errado | Consulte Todas; a classificação é heurística. |
| Vídeo sem prévia | Verifique se a mídia ainda está disponível e se o formato é suportado. |
| Download falha | Reabra a mídia, verifique o gerenciador de downloads e tente um lote menor. |
| CI sem artefato | Confirme a execução e o resultado do workflow. |

## Instalação e compilação

Se a pasta `dist/` não existir, execute na raiz do repositório:

```powershell
node --version
npm --version
npm install
npm run verificar
npm run build
```

Leia o primeiro erro apresentado pelo comando que falhou. Não ignore uma falha de tipagem ou teste para considerar a versão pronta. Se o npm não conseguir instalar dependências, verifique acesso à rede, proxy, registro npm e versão do Node.js. Não desative a validação TLS para contornar problemas de instalação.

No navegador, confirme o modo de desenvolvedor e selecione a pasta que contém diretamente o manifesto. Confira os detalhes de erro no cartão da extensão.

## Painel não conectado ou galeria vazia

1. Confirme que a aba ativa usa `https://www.instagram.com/`.
2. Recarregue a extensão no gerenciador.
3. Atualize a página do Instagram para reinjetar os scripts.
4. Abra o painel e navegue por uma publicação ou Story autorizado.
5. Se necessário, clique no botão de atualização da galeria.

Respostas de rede recebidas antes da ativação do painel não são recuperadas retroativamente. O botão de atualização inspeciona os elementos disponíveis naquele momento; reabrir a mídia pode provocar novos carregamentos feitos pelo próprio Instagram.

## Mídia ausente, repetida ou classificada incorretamente

A captura combina heurísticas de DOM e respostas de rede. Mudanças de estrutura, dimensões pequenas, respostas muito grandes, URLs não elegíveis ou limites de processamento podem impedir a identificação. A galeria mantém até mil mídias por aba. Alguns formatos de vídeo não possuem endereço direto compatível.

Consulte o filtro Todas, reabra a mídia e tente novamente. Não existe garantia de captura de todo o perfil, histórico de Stories ou mídias removidas.

## Pré-visualização e download

Uma URL que funcionava pode expirar. Reabra a publicação para que o Instagram carregue uma referência atual. O painel pode manter uma entrada anterior se o novo candidato apresentar resolução menor; limpar a galeria e navegar novamente pode ajudar.

Se a miniatura permanecer indisponível, mudar de aba ou limpar a galeria reinicia o estado de falhas de miniaturas. O navegador pode não conseguir reproduzir determinado codec, mesmo quando o arquivo é aceito para download.

Em caso de ZIP parcial, a mensagem informa quantos itens falharam, mas não apresenta uma lista detalhada por arquivo na versão atual. Tente baixar os itens restantes individualmente. Para arquivos grandes, use lotes menores; o limite por operação é de 250 MiB de conteúdo, e o ZIP pode exigir memória adicional.

Se o download já foi solicitado, acompanhe-o na página de downloads do navegador. O cancelamento no painel atua durante a preparação, não necessariamente depois que o navegador assume o arquivo.

## GitHub Actions

Acesse [Actions](https://github.com/vitoroliveirasilva/instagram-media-studio.extension/actions) e localize a execução do commit. Um artefato só é disponibilizado quando a etapa correspondente termina com sucesso e pode expirar após 14 dias. Caso não haja execução, verifique as configurações do repositório e a disponibilidade do workflow. Execute localmente os comandos de verificação e compilação se necessário.

## Como relatar um problema

Informe versão da extensão, commit, navegador, versão do navegador, sistema operacional, passos para reproduzir, comportamento observado e esperado. Acrescente mensagens de erro e imagens anonimizadas quando úteis.

Não compartilhe arquivos de diagnóstico contendo sessões, cookies, tokens, URLs assinadas, conteúdo privado ou respostas integrais do Instagram. Para falhas de segurança, consulte [SECURITY.md](../SECURITY.md).
