# escritorio_api_pos
Estudo de Caso: Controle de Retirada de Materiais de Escritório

# Nome do Sistema
ESTOKA - Sistema Integrado de Gerenciamento de Almoxarifado e Controle de Estoque

## Identificação

**Controle de Retirada de Materiais de Escritório ** [Estoka]

**Equipe:** 

### Integrantes

- ACSA MIRELLA DA SILVA DANTAS
- ANDRIELA GLEICE PEREIRA DA SILVA
- GABRYELA DAYANE SILVA SANTOS
- LAURA MARIA FERREIRA GOMES DE SOUZA
- MARIA JULIANNE BERNARDO DA SILVA
- THERESA LETICIA SANTOS ROSA DE OLIVEIRA

## Frontend v.5 — Integração com API REST (JSON Server)

A aplicação deixou de guardar os dados no `localStorage` do navegador. Agora
funcionários, materiais e retiradas são consultados, cadastrados, alterados e
excluídos por requisições HTTP a uma API REST fornecida pelo **JSON Server**.

> Branch desta atividade: `capitulo-7-api-rest` (criada a partir de `frontend-v4`).

### Como executar

Pré-requisitos: [Node.js](https://nodejs.org/) 18 ou superior.

1. Instalar as dependências (na pasta `projeto/`):

   ```
   npm install
   ```

2. Iniciar a API (JSON Server em `http://localhost:3000`):

   ```
   npm run api
   ```

   Equivale a `npx json-server db.json`. Para conferir, abra
   `http://localhost:3000/materiais` no navegador.

3. Em **outro terminal**, servir os arquivos do front-end. Os scripts usam
   módulos ES, então a página precisa ser aberta por `http://` (não por duplo
   clique no arquivo). Qualquer servidor estático serve, por exemplo:

   ```
   npx serve .
   ```

   ou a extensão **Live Server** do VS Code (clique direito em `index.html` →
   *Open with Live Server*), ou `python3 -m http.server 5500`.

4. Abrir `index.html` pelo endereço do servidor estático (ex.:
   `http://localhost:5500/index.html`).

Observações:

- O endereço da API fica em `js/api/http.js` (`URL_BASE`). Se o JSON Server
  usar outra porta, altere apenas essa constante.
- Não use `json-server --static .` para servir o front-end: como as páginas se
  chamam `funcionarios.html`, `materiais.html` e `retiradas.html`, o servidor
  responderia com o HTML nas requisições a `/funcionarios`, `/materiais` e
  `/retiradas`.
- O JSON Server grava as alterações diretamente no `db.json`. Para voltar aos
  dados iniciais, restaure o arquivo com `git checkout -- db.json`.

### Recursos da API (`db.json`)

| Coleção | Campos | Observação |
| --- | --- | --- |
| `funcionarios` | `id`, `matricula`, `nome`, `bloqueado` | 8 registros iniciais |
| `materiais` | `id`, `codigo`, `nome`, `quantidade`, `bloqueado` | 12 registros iniciais |
| `retiradas` | `id`, `funcionarioId`, `materialId`, `quantidade`, `data` | 3 registros iniciais |

Relacionamentos: cada retirada guarda `funcionarioId` e `materialId`, que
apontam para os registros de `funcionarios` e `materiais`. Os registros iniciais
usam ids em texto (`"f1"`, `"m1"`, `"r1"`); os novos recebem ids em texto
gerados pelo próprio JSON Server.

### Descrição das adaptações (localStorage → API REST)

**1. Camada de comunicação (`js/api/`)** — nova.

| Arquivo | Responsabilidade |
| --- | --- |
| `http.js` | Função `requisicao()` (fetch + JSON), endereço-base da API e a classe `ApiError`. Converte falha de rede, resposta HTTP de erro e JSON inválido em mensagens compreensíveis. |
| `funcionarios.js` | `listarFuncionarios`, `buscarFuncionario`, `cadastrarFuncionario`, `atualizarFuncionario`, `excluirFuncionario` |
| `materiais.js` | As mesmas operações, mais `atualizarQuantidadeMaterial` (PATCH do estoque) |
| `retiradas.js` | Operações de retirada, `montarRetirada` (resolve os relacionamentos) e consultas `contarRetiradasDoFuncionario/DoMaterial` usadas nas regras de exclusão |

Os módulos de interface chamam essas funções e nunca montam requisições HTTP
diretamente.

**2. Removido:** `js/dados/` (persistência em `localStorage`). O estado de cada
tela passou a ser sempre o último retrato recebido da API.

**3. Classes de domínio (`js/classes/`).** Deixaram de gerar ids próprios
(`proximoId`) e de converter o id para número: o `id` é guardado exatamente como
a API devolve (texto).

**4. Interface (`js/interface/` e `js/index.js`).** Os componentes e formulários
foram mantidos; mudou apenas a origem e o destino dos dados:

- **Consulta:** ao abrir a página, a lista é buscada na API (mostrando
  "Carregando..." e, em caso de falha, uma mensagem de erro).
- **Cadastro / alteração / exclusão:** viram `POST`, `PUT` e `DELETE`; depois de
  cada operação a lista é recarregada do servidor.
- **Dashboard:** carrega as três coleções em paralelo (`Promise.all`).
- **Retiradas:** cada retirada altera o estoque do material. Como o JSON Server
  não tem transações, as operações são feitas em passos com reversão
  (`executarComReversao`): se um passo falha, os anteriores são desfeitos.
  A validação de estoque usa dados recém-carregados do servidor.
- **Mensagens ao usuário:** `js/interface/mensagens.js` exibe avisos de erro e
  sucesso na tela, sem depender do console.
- **Identificadores:** todas as comparações usam `mesmoId()` (`js/utils.js`),
  que compara como texto. Nenhum id é convertido com `Number()`.

**5. Regras de negócio preservadas** (o JSON Server não as aplica sozinho,
portanto continuam na aplicação):

- matrícula de funcionário e código de material únicos;
- não excluir funcionário ou material que possui retiradas (consulta feita no
  servidor no momento da exclusão);
- funcionário ou material bloqueado não pode ser usado em retirada;
- quantidade da retirada limitada ao estoque disponível;
- excluir uma retirada devolve a quantidade ao estoque; alterar uma retirada
  ajusta o estoque do material anterior e do novo.

Em um sistema real, essas regras críticas também devem ser protegidas no
servidor (backend próprio).

### Testes

O registro completo está em [`TESTES.md`](TESTES.md). Para executar os testes
automatizados da camada de API (usam uma cópia temporária do `db.json`):

```
npm run testar
```

### Estrutura de diretórios (v.5)

```
projeto/
├── db.json
├── package.json
├── js/
│   ├── api/
│   │   ├── http.js
│   │   ├── funcionarios.js
│   │   ├── materiais.js
│   │   └── retiradas.js
│   ├── classes/
│   │   ├── funcionario.js
│   │   ├── material.js
│   │   └── retirada.js
│   ├── interface/
│   │   ├── componentes.js
│   │   ├── mensagens.js
│   │   ├── funcionarios.js
│   │   ├── materiais.js
│   │   └── retiradas.js
│   ├── utils.js
│   ├── index.js
│   ├── funcionarios.js
│   ├── materiais.js
│   └── retiradas.js
├── testes/
│   └── testar-api.mjs
├── css/
├── index.html
├── funcionarios.html
├── materiais.html
├── retiradas.html
└── TESTES.md
```

---

## Frontend v.4 — Módulo de Componentes (refatoração)

> Seção histórica da versão 4. A persistência em `localStorage` descrita abaixo foi substituída pela API REST na versão 5 (veja acima).

### Objetivo da refatoração

Retirar das classes de domínio a responsabilidade de construir elementos HTML,
transferindo-a para um módulo específico de componentes de interface. As classes
passam a representar apenas os dados e o comportamento dos objetos; quem decide
**como** cada objeto é apresentado é o módulo de componentes.

### 1. Métodos de renderização identificados

| Classe | Arquivo | Método/Propriedade | Informações apresentadas |
| --- | --- | --- | --- |
| `Funcionario` | `js/classes/funcionario.js` | `render()` | Matrícula, nome, status e botões de ação (visualizar/editar/excluir) |
| `Funcionario` | `js/classes/funcionario.js` | `statusClasse` | Classe CSS do status (usada só na renderização) |
| `Material` | `js/classes/material.js` | `render()` | Código, nome, quantidade, status e botões de ação (visualizar/editar/excluir) |
| `Material` | `js/classes/material.js` | `statusClasse` / `quantidadeClasse` | Classes CSS de status e de faixa de quantidade (usadas só na renderização) |
| `Retirada` | `js/classes/retirada.js` | `render()` | Data, funcionário, material, quantidade e botões de ação (editar/excluir) |

Além das classes, o módulo de dashboard (`js/index.js`) construía a lista de
"últimas retiradas" por meio da função `criarItemRetirada`, que também foi
movida para o módulo de componentes.

### 2. Refatoração das classes do domínio

Foram removidos das classes:

- `render()` de `Funcionario`, `Material` e `Retirada`;
- as propriedades `statusClasse`, `quantidadeClasse` (mapeamento de estado para
  classes CSS, que é responsabilidade da interface);
- os imports de `escapeHtml`, que só existiam para montar HTML.

As classes mantiveram atributos, construtores, propriedades (`get`/`set`),
`dataFormatada` e `statusTexto`. Nenhuma regra de negócio ou operação (criar,
consultar, alterar, excluir) foi alterada.

### 3. Módulo de componentes (`js/interface/componentes.js`)

Funções exportadas:

| Função | Responsabilidade |
| --- | --- |
| `criarLinhaFuncionario(funcionario)` | Cria o `<tr>` de um funcionário (matrícula, nome, status e ações) |
| `criarLinhaMaterial(material)` | Cria o `<tr>` de um material (código, nome, quantidade, status e ações) |
| `criarLinhaRetirada(retirada)` | Cria o `<tr>` de uma retirada (data, funcionário, material, quantidade e ações) |
| `criarLinhaVazia(mensagem, colspan, classe)` | Cria a linha de "nenhum registro encontrado" |
| `criarMensagemVazia(mensagem, classe)` | Cria a mensagem de estado vazio do dashboard |
| `criarItemRetirada(retirada)` | Cria o item de movimentação exibido nas "últimas retiradas" do dashboard |

Todas retornam o elemento criado, para que os módulos de interface os insiram
na página. Os dados do usuário são inseridos via `textContent` (o navegador faz
o escape), enquanto os SVGs fixos usam `innerHTML`.

### 4. Integração nos módulos de interface

- `js/interface/funcionarios.js` → usa `criarLinhaFuncionario` e `criarLinhaVazia`.
- `js/interface/materiais.js` → usa `criarLinhaMaterial` e `criarLinhaVazia`.
- `js/interface/retiradas.js` → usa `criarLinhaRetirada` e `criarLinhaVazia`.
- `js/index.js` → usa `criarItemRetirada` e `criarMensagemVazia`.

Os módulos de interface continuam responsáveis pelos eventos (delegação de
clique em `data-acao`), pelo estado dos filtros/busca e pelas operações de
criar, alterar e excluir — a renderização apenas passou a ser delegada aos
componentes.

### 5. Responsabilidades por módulo

| Módulo | Responsabilidade |
| --- | --- |
| `js/classes/*.js` | Representar as entidades e suas regras (dados, propriedades, comportamento) |
| `js/dados/*.js` | Persistência em `localStorage` e regras de consulta auxiliares |
| `js/interface/componentes.js` | Construir os elementos HTML a partir dos dados das entidades |
| `js/interface/*.js` | Ligar eventos, manter o estado da tela e orquestrar as operações |
| `js/utils.js` | Utilitário compartilhado (`escapeHtml`) |

### Estrutura de diretórios

```
projeto/
├── js/
│   ├── classes/
│   │   ├── funcionario.js
│   │   ├── material.js
│   │   └── retirada.js
│   ├── dados/
│   │   ├── funcionarios.js
│   │   ├── materiais.js
│   │   └── retiradas.js
│   ├── interface/
│   │   ├── componentes.js
│   │   ├── funcionarios.js
│   │   ├── materiais.js
│   │   └── retiradas.js
│   ├── utils.js
│   ├── index.js
│   ├── funcionarios.js
│   ├── materiais.js
│   └── retiradas.js
├── css/
├── index.html
├── funcionarios.html
├── materiais.html
└── retiradas.html
```