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

---

## Frontend v.4 — Módulo de Componentes (refatoração)

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
