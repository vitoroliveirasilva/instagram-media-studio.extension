# Solução de problemas

| Sintoma | Verificação e ação |
| --- | --- |
| Painel não conecta | Confirme a aba `www.instagram.com`, recarregue a extensão, atualize a página e reabra o painel. |
| Galeria vazia | Abra o conteúdo desejado com o painel ativo e use **Atualizar galeria**; confirme o filtro selecionado. |
| Foto de perfil sem imagem | Aguarde as tentativas limitadas, atualize a galeria e recarregue o perfil para obter um endereço atual. |
| Foto em baixa resolução | A qualidade depende do candidato fornecido pela origem; não há ampliação artificial. |
| Reel reproduz na página, mas não baixa | Pode haver somente segmentos ou resposta parcial; abra novamente o Reel e atualize. A extensão exige arquivo completo identificável. |
| Capa indisponível | Abra novamente o vídeo para carregar metadados. A opção só é habilitada quando há uma URL de imagem válida. |
| Download falha | Verifique expiração, conexão, limite de 250 MiB, formato e gerenciador de downloads. Tente menos itens. |
| ZIP incompleto | Leia o resumo de falhas parciais; conteúdos indisponíveis ou acima do orçamento não são incluídos. |
| Tela cheia recusada | Acione pelo botão do visualizador; permissões do navegador podem impedir a expansão. A prévia mantém a navegação. |
| Alteração não aparece | Recompile, recarregue a extensão, atualize a aba e confira se está usando `runtime/` e `src/`. |
| Build falha | Use Node.js 22, execute `npm ci` e repita a verificação; consulte a primeira falha do comando. |
| Release não publica | Confira job, notas, versões e tag; uma tag de outro commit não será substituída. |

## Informações para diagnóstico

Informe versão da extensão, navegador, sistema, categoria da mídia, passos de reprodução e mensagem apresentada. Diferencie instalação pelo ZIP de instalação pelo código. Remova dados pessoais e segredos dos registros.

A galeria existe em memória: recarregar a aba ou fechar o painel pode descartar o estado. Downloads já solicitados continuam sendo administrados pelo navegador.
