# Desenvolvimento

[Voltar ao início](../README.md)

## Ambiente e tecnologias

| Ferramenta | Versão declarada / finalidade |
| --- | --- |
| Node.js | 22 LTS recomendado; intervalo >=22 e <25. |
| React / React DOM | 19.1.0; interface. |
| TypeScript | 5.8.3; tipagem estática. |
| Vite | 6.3.5; desenvolvimento e compilação. |
| Tailwind CSS | 3.4.17; base de estilos e utilitários. |
| Lucide React | 0.468.0; ícones. |
| JSZip | 3.10.1; arquivos ZIP. |
| Vitest | 3.1.4; testes unitários. |
| Manifest V3 | Integração com o navegador. |

As versões são as declaradas no `package.json` da versão 0.2.0, e não uma recomendação de que sejam as versões mais recentes.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm install` | Instalar as dependências declaradas. |
| `npm run dev` | Iniciar o servidor de desenvolvimento Vite. |
| `npm test` | Executar os testes Vitest e os testes Node.js em `testes/`. |
| `npm run verificar` | Validar sintaxe dos scripts públicos, tipagem TypeScript e testes. |
| `npm run build` | Verificar tipagem e compilar para `dist/`. |

O servidor Vite isoladamente não reproduz as APIs `chrome.*` do navegador. Para testar a integração, compile o projeto e recarregue a extensão sem compactação.

## Ciclo de trabalho

```powershell
git switch dev
git pull --ff-only origin dev
npm install
npm run verificar
npm run build
```

Faça alterações pequenas e verificáveis. Após modificar o manifesto, os scripts de página ou o service worker, recarregue a extensão no gerenciador e atualize a aba do Instagram. Para mudanças na interface, reabra o painel após a compilação.

## Padrões

- Interface, mensagens, documentação e nomes próprios de domínio em português do Brasil.
- Código sem comentários explicativos; utilize nomes claros, funções coesas e documentação externa. Preserve avisos legais obrigatórios em dependências ou licenças.
- TypeScript com tipagem estrita e tratamento explícito de entradas não confiáveis.
- Scripts de captura sem dependência de servidor ou consultas adicionais à API da plataforma.
- Sem inclusão de senhas, cookies, URLs assinadas reais, dados pessoais ou arquivos baixados nos testes.
- Alterações de permissões e limites devem ser justificadas na documentação.
- Não alterar a interface aprovada sem necessidade funcional ou solicitação.

## Integração contínua

O arquivo `.github/workflows/verificacao.yml` configura execuções em pushes e pull requests para `dev` e `prod`, além de execução manual quando disponível no GitHub. A presença de ambas no workflow não comprova que as duas branches existam.

O job utiliza Ubuntu, Node.js 22, permissões de leitura e prazo de dez minutos. A sequência é instalação de dependências, verificação, compilação, conferência dos caminhos essenciais do manifesto compilado e publicação do artefato `instagram-media-studio` por 14 dias. Execuções concorrentes para a mesma referência podem ser canceladas em favor da mais recente.

O workflow usa `npm install`, não `npm ci`, pois não há lockfile versionado na revisão atual. Embora as dependências diretas estejam fixadas, dependências transitivas podem variar. Uma melhoria futura é gerar, revisar e versionar o lockfile e migrar a CI para instalação reprodutível.

A existência do workflow não equivale a uma execução aprovada. Consulte [Actions](https://github.com/vitoroliveirasilva/instagram-media-studio.extension/actions) e os logs de cada job.

## Publicação

A branch `dev` é o ambiente de desenvolvimento e homologação. A branch `prod`, quando utilizada, deve receber apenas alterações aprovadas conforme os critérios de [testes e homologação](testes-e-homologacao.md).

Para uma nova versão, alinhe `package.json` e `runtime/manifest.json`, atualize o [histórico](../CHANGELOG.md), execute as verificações e valide a extensão no navegador. Não confunda artefato de CI com publicação nas lojas oficiais.

Leia também [contribuição](../CONTRIBUTING.md).

### Primeira distribuição

O job `publicar` é executado apenas na `prod`, após sucesso do job de verificação, em push ou execução manual. Ele publica exclusivamente a versão 0.2.0 como pré-lançamento, com ZIP compilado e checksum SHA-256, sem substituir uma release existente. A publicação exige que o token do workflow tenha permissão de escrita em conteúdo. Versões futuras precisam de um processo de release atualizado e de homologação correspondente.
