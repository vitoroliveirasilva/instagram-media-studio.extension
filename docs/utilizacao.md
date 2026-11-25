# Guia de utilização

[Voltar ao início](../README.md)

## Painel lateral

O Instagram Media Studio opera ao lado da aba do Instagram. Abra o painel pelo ícone da extensão e navegue normalmente. Não é necessário abrir o console, o inspetor de elementos ou a aba de rede.

A interface contém cabeçalho com configurações, filtros, galeria, controles de atualização e visualização, seleção e downloads. A galeria possui rolagem própria e os controles inferiores permanecem acessíveis.

## Galeria e filtros

| Filtro | Conteúdo esperado |
| --- | --- |
| Todas | Todas as mídias identificadas na galeria atual. |
| Stories | Mídias classificadas como Stories. |
| Posts | Publicações, incluindo itens de carrosséis quando identificados. |
| Reels | Mídias classificadas como Reels. |
| Destaques | Mídias classificadas como destaques. |

A classificação é estimada a partir da página e das informações disponíveis na mídia. Algumas categorias podem estar incorretas. O filtro **Todas** ajuda a localizar itens classificados de outra forma.

A galeria acumula até mil mídias por aba durante a sessão. Respostas carregadas antecipadamente pelo Instagram podem incluir itens que ainda não foram exibidos na tela. O botão de atualização solicita uma nova leitura dos elementos visíveis; ele não consulta a API nem recupera respostas de rede antigas.

## Visualização e seleção

- **Grade:** miniaturas organizadas em colunas, adaptadas à largura do painel.
- **Lista:** apresentação vertical com miniatura, categoria e tipo.
- **Seleção:** clique na miniatura para selecionar ou desmarcar.
- **Pré-visualização:** clique no ícone de expansão; feche pelo botão correspondente ou pela tecla Esc.
- **Selecionar todas:** inclui as mídias do filtro atual sem descartar seleções anteriores.
- **Limpar:** remove todas as seleções, inclusive as de outros filtros.

A contagem inferior considera todas as mídias selecionadas, não apenas as visíveis no filtro. Confira essa contagem antes de baixar. Ao mudar de aba, a seleção é reiniciada; a galeria anterior pode permanecer em memória até o encerramento do painel.

## Downloads

Use o botão individual de uma mídia ou **Baixar mídias selecionadas**.

| Seleção | Resultado solicitado ao navegador |
| --- | --- |
| Um item | Arquivo de imagem ou vídeo, com extensão baseada no tipo MIME aceito. |
| Dois ou mais itens | ZIP com os arquivos obtidos com sucesso. |

Exemplos de nomes: `posts-0001.jpg`, `stories-0002.mp4`, `midias-<timestamp>.zip`. Os nomes são ilustrativos; a numeração depende da ordem de preparação. O navegador evita sobrescrever arquivos existentes por meio da opção de nomes únicos.

O limite de 250 MiB aplica-se ao conteúdo obtido em uma operação, inclusive a downloads individuais. Se alguns arquivos falharem em um lote, a extensão pode gerar o ZIP parcial e informar a quantidade de falhas. Se todos falharem, nenhum ZIP é solicitado.

O botão de cancelamento interrompe a preparação; após o encaminhamento ao gerenciador de downloads, o controle do download passa ao navegador. Mantenha o painel aberto durante a preparação. Consulte a lista de downloads para verificar conclusão, interrupções e destino dos arquivos.

## Configurações

- **Sistema:** acompanha a preferência de cores do navegador/sistema.
- **Claro:** força a aparência clara.
- **Escuro:** força a aparência escura.
- **Limpar galeria:** apaga os itens, a seleção e a prévia da aba atual. A captura pode preencher novamente a galeria durante a navegação.

O tema e o modo de visualização são lembrados entre sessões. A lista de mídias não é persistida pela extensão. Fechar o painel encerra sua sessão e interrompe a observação quando não houver outra conexão ativa.

## Boas práticas

Abra apenas as páginas e mídias que deseja utilizar. Se uma mídia estiver indisponível, tente reabri-la e atualizar a galeria. Evite compartilhar URLs de mídia, pois podem conter assinaturas temporárias. Utilize lotes menores para reduzir o consumo de memória.

Consulte [privacidade e segurança](privacidade-e-seguranca.md) e [solução de problemas](solucao-de-problemas.md).

## Alterações em desenvolvimento (0.3.0)

A galeria passa a acompanhar o perfil, conjunto de Stories ou publicação aberta. Avançar Stories do mesmo perfil mantém o conjunto atual; abrir outro perfil ou publicação reinicia a galeria. O ícone de lixeira na barra limpa a galeria; Limpar seleção desmarca os itens sem apagá-los. Atualizar volta a permitir a coleta de mídias limpas. A captura estruturada depende de identificação do proprietário ou publicação e não recupera respostas recebidas antes da abertura do painel. O limite de galeria sobe para 10.000 itens. Essas alterações exigem homologação no Instagram real.

## Vídeos e foto de perfil (0.3.1)

Ao abrir um perfil, a foto de perfil pode aparecer na categoria Perfil, com seleção e download individual. A ação Selecionar todas em Todas não inclui automaticamente a foto de perfil; selecione-a manualmente ou utilize o filtro Perfil. Para vídeos, abra a publicação, Reel ou Story com o painel aberto e reproduza-o normalmente. A extensão reconhece formatos adicionais de metadados, mas necessita de uma URL direta de arquivo completo; fluxos segmentados, protegidos ou indisponíveis não são remontados. A resolução da foto depende do que a página disponibilizar.
