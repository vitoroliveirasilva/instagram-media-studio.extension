# Contribuição

[Voltar ao início](README.md)

## Fluxo de alterações

Use a branch `dev` como base de desenvolvimento. Alterações maiores devem ser isoladas em uma branch de trabalho e revisadas antes da integração. A branch `prod`, quando utilizada, fica reservada a versões homologadas.

1. Atualize sua cópia local sem sobrescrever mudanças não salvas.
2. Defina o escopo da alteração e os critérios de aceite.
3. Implemente a mudança com os testes correspondentes.
4. Execute `npm run verificar` e `npm run build`.
5. Teste no navegador quando o comportamento da extensão for afetado.
6. Atualize a documentação e o histórico quando necessário.
7. Revise o diff e faça o commit.

## Convenções

- Mensagens de commit em português do Brasil, claras e no presente.
- Interface e mensagens em português do Brasil.
- Código sem comentários explicativos; priorize legibilidade e documentação externa.
- Evite alterações de layout não relacionadas ao objetivo da tarefa.
- Não inclua dependências, permissões ou integrações desnecessárias.
- Não versione arquivos compilados, dependências instaladas, segredos ou dados de navegação.
- Preserve a licença MIT e avisos legais aplicáveis.

Exemplos de commits: `Corrige a seleção de mídias entre filtros`, `Adiciona testes de cancelamento de downloads`, `Atualiza o guia de instalação`.

## Revisão

Antes de integrar, confirme se as permissões continuam proporcionais, os limites de processamento são respeitados, os erros são tratados, os estados da interface são acessíveis e as mudanças não introduzem consultas automatizadas ou coleta de dados desnecessária.

Consulte [desenvolvimento](docs/desenvolvimento.md), [arquitetura](docs/arquitetura.md) e [testes e homologação](docs/testes-e-homologacao.md).

Problemas de segurança devem seguir [SECURITY.md](SECURITY.md).
