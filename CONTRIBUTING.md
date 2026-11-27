# Guia de contribuição

## Preparação

Parta de `dev`, atualize com avanço rápido e use Node.js 22. Instale com `npm ci`. Utilize uma branch temporária para alterações que precisem de revisão isolada.

## Padrões de implementação

Escreva código sem comentários, com nomes claros e funções coesas. Mantenha a explicação técnica na documentação e preserve licenças em arquivos próprios. Use português do Brasil nas mensagens, documentação e commits.

O runtime distribuído está em `runtime/`; `public/` permanece como referência histórica dos testes. Não inclua dependências instaladas, builds, pacotes, credenciais ou dados privados no histórico. Preserve o visual Essencial e documente mudanças de permissões, limites e comportamento de rede.

## Validação e revisão

Execute `npm run verificar` e `npm run empacotar`. Teste manualmente os fluxos afetados no navegador. Descreva no PR o problema, o comportamento final, a validação e as limitações relevantes. Atualize os guias e o histórico quando houver alteração observável.

Integre desenvolvimento em `dev`; promova para `prod` por PR, após verificações. Use merge commit entre branches permanentes para preservar o histórico. Não reescreva tags publicadas. Branches temporárias podem ser removidas após integração completa.

## Licença e segurança

Contribuições seguem a licença MIT do projeto. Preserve os avisos aplicáveis às dependências. Consulte `SECURITY.md` para relatar vulnerabilidades sem expor informações sensíveis.
