# Registro de testes — Frontend v.5 (integração com API REST)

**Data de execução:** 08/11/2026
**Branch:** `capitulo-7-api-rest`
**Ambiente:** Node.js 22, JSON Server 1.0.0-beta, Google Chrome (headless) controlado por script,
front-end servido por `python3 -m http.server 5500` e API em `http://localhost:3000`.

Os testes foram executados sobre **uma cópia** do `db.json`, para não alterar os
dados iniciais do projeto. Dois níveis de verificação:

1. **Camada de API** (`npm run testar`, script `testes/testar-api.mjs`): chama
   diretamente as funções de `js/api/*` contra um JSON Server temporário.
2. **Interface no navegador:** um script automatizou o Chrome sobre as páginas
   reais (`index.html`, `funcionarios.html`, `materiais.html`, `retiradas.html`),
   preenchendo formulários, clicando nos botões e conferindo, a cada passo, o que
   aparece na tela **e** a resposta da API (`GET` no JSON Server). Esse script não
   faz parte do repositório; os cenários estão descritos abaixo para repetição
   manual.

## Resultado por cenário obrigatório

| # | Cenário | Como foi verificado | Resultado |
| --- | --- | --- | --- |
| 1 | Abrir a aplicação e carregar registros da API | Dashboard mostra 12 produtos e 3 retiradas; telas exibem 8 funcionários, 12 materiais e 3 retiradas com nomes do funcionário/material resolvidos | Passou |
| 2 | Cadastrar e confirmar persistência | Funcionário `FUNC-050` e material `ESC-050` cadastrados pela tela; `GET /funcionarios` e `GET /materiais` confirmaram os registros; lista na tela atualizada (+1) | Passou |
| 3 | Alterar e verificar atualização | Nome do funcionário e quantidade do material editados pela tela (formulário vem preenchido); `GET /{recurso}/{id}` confirmou os novos valores | Passou |
| 4 | Excluir e confirmar remoção | Registros criados no teste excluídos pela tela; sumiram da API e da lista | Passou |
| 5 | Operações em recursos relacionados | Retirada cadastrada: estoque do material diminui na API e a retirada guarda `funcionarioId`/`materialId`; troca de material numa retirada devolve o estoque do anterior e desconta do novo; exclusão da retirada devolve a quantidade; dashboard e tela mostram funcionário e material corretos | Passou |
| 6 | Regras de negócio | Matrícula e código duplicados barrados (nada gravado); excluir funcionário `f1` e material `m1` bloqueado por existirem retiradas; funcionário bloqueado e material bloqueado/sem estoque não aparecem na seleção de retirada; quantidade acima do estoque barrada sem gravar nada | Passou |
| 7 | Identificadores textuais | Registros iniciais com ids `"f1"`, `"m1"`, `"r1"` e novos com ids gerados pelo servidor (texto) foram editados, excluídos e associados sem erro; `mesmoId()` compara como texto | Passou |
| 8 | Falha de comunicação | Com o JSON Server parado, as páginas mostram na tabela "Não foi possível carregar…", o contador indica "Dados indisponíveis" e um aviso na tela informa que o servidor não responde, sem erros JS não tratados | Passou |

## Teste adicional: reversão em falha parcial

Ao registrar uma retirada, o sistema primeiro ajusta o estoque e depois grava a
retirada. Simulou-se falha (HTTP 500) no `POST /retiradas` com o estoque já
descontado: o estoque voltou ao valor original (38 → 38), nenhuma retirada foi
gravada e a tela exibiu "Não foi possível registrar a retirada…".

## Testes automatizados da camada de API (`npm run testar`)

| # | Teste | Resultado |
| --- | --- | --- |
| 1 | Carrega funcionários, materiais e retiradas a partir da API | Passou |
| 2 | Cadastra funcionário e confirma persistência no servidor | Passou |
| 3 | Altera funcionário e verifica a atualização | Passou |
| 4 | Exclui funcionário e confirma a remoção (404 ao buscar) | Passou |
| 5 | CRUD de material, incluindo ajuste de estoque via PATCH | Passou |
| 6 | Retiradas preservam o relacionamento com funcionário e material | Passou |
| 7 | Consultas usadas nas regras de exclusão (retiradas por funcionário/material) | Passou |
| 8 | Identificadores textuais preservados | Passou |
| 9 | Resposta HTTP de erro vira `ApiError` com mensagem compreensível | Passou |
| 10 | Servidor parado vira `ApiError` compreensível | Passou |

**Total:** 10/10 na camada de API e 39/39 verificações na interface.

## Limitações conhecidas

- O JSON Server não oferece transações: se o computador/servidor cair **entre**
  duas requisições de uma retirada, e a reversão também falhar, o estoque pode
  ficar inconsistente (a aplicação avisa nesse caso). Um backend próprio deve
  fazer essa operação de forma atômica.
- Duas pessoas operando ao mesmo tempo podem disputar o mesmo estoque; a
  aplicação revalida o estoque no momento do envio, mas não há bloqueio no
  servidor.
- As regras de negócio estão apenas no front-end, como orienta a atividade.
