// Módulo de componentes de interface.
//
// Concentra as funções responsáveis por transformar os dados de uma entidade do
// domínio (Funcionario, Material, Retirada) em elementos HTML. As classes do
// domínio não conhecem mais a estrutura da interface: elas apenas representam
// seus dados, e quem decide "como" exibir é este módulo.
//
// Todos os componentes devolvem o elemento criado para que os módulos da
// interface possam inseri-lo na página.

// Ícones fixos (sem dados do usuário), usados nos botões de ação.
const ICONE_VISUALIZAR = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>`;

const ICONE_EDITAR = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>`;

const ICONE_EXCLUIR = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>`;

const ICONE_SAIDA = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 9v4a2 2 0 002 2h14a2 2 0 002-2V9M7 14l5 5 5-5M12 19V7" />
    </svg>`;

// --- Elementos auxiliares reaproveitados ---

function criarTexto(classe, texto, tag = "span") {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    elemento.textContent = texto;
    return elemento;
}

function criarBotaoAcao(classe, acao, titulo, icone) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = `action-btn ${classe}`;
    botao.dataset.acao = acao;
    botao.title = titulo;
    botao.innerHTML = icone; // ícone fixo, sem dados do usuário
    return botao;
}

function criarCelulaAcoes(botoes) {
    const celula = document.createElement("td");

    const container = document.createElement("div");
    container.className = "actions";
    container.append(...botoes);

    celula.append(container);
    return celula;
}

function criarBadgeStatus(texto, classe) {
    const badge = document.createElement("button");
    badge.type = "button";
    badge.className = `status-badge ${classe}`;

    const ponto = document.createElement("span");
    ponto.className = "status-dot";

    badge.append(ponto, document.createTextNode(texto));
    return badge;
}

// --- Mapeamento de estado do domínio para classes visuais ---
// Antes ficava nas próprias classes; agora é responsabilidade da interface.

function classeStatusFuncionario(funcionario) {
    return funcionario.bloqueado ? "status-bloqueado" : "status-ativo";
}

function classeStatusMaterial(material) {
    return material.bloqueado ? "status-bloqueado" : "status-liberado";
}

function classeQuantidade(quantidade) {
    if (quantidade === 0) return "qtd-zero";
    if (quantidade <= 10) return "qtd-baixa";
    if (quantidade <= 40) return "qtd-media";
    return "qtd-alta";
}

// --- Componentes de linha de tabela ---

export function criarLinhaFuncionario(funcionario) {
    const linha = document.createElement("tr");
    linha.dataset.id = funcionario.id;

    const celulaMatricula = document.createElement("td");
    celulaMatricula.append(criarTexto("matricula-cell", funcionario.matricula));

    const celulaNome = document.createElement("td");
    celulaNome.append(criarTexto("func-nome", funcionario.nome));

    const celulaStatus = document.createElement("td");
    celulaStatus.append(criarBadgeStatus(funcionario.statusTexto, classeStatusFuncionario(funcionario)));

    const celulaAcoes = criarCelulaAcoes([
        criarBotaoAcao("view", "visualizar", "Visualizar", ICONE_VISUALIZAR),
        criarBotaoAcao("edit", "editar", "Editar", ICONE_EDITAR),
        criarBotaoAcao("delete", "excluir", "Excluir", ICONE_EXCLUIR)
    ]);

    linha.append(celulaMatricula, celulaNome, celulaStatus, celulaAcoes);
    return linha;
}

export function criarLinhaMaterial(material) {
    const linha = document.createElement("tr");
    linha.dataset.id = material.id;

    const celulaCodigo = document.createElement("td");
    celulaCodigo.append(criarTexto("codigo-cell", material.codigo));

    const celulaNome = document.createElement("td");
    celulaNome.append(criarTexto("mat-nome", material.nome));

    const celulaQuantidade = document.createElement("td");
    celulaQuantidade.append(
        criarTexto(`qtd-cell ${classeQuantidade(material.quantidade)}`, material.quantidade)
    );

    const celulaStatus = document.createElement("td");
    celulaStatus.append(criarBadgeStatus(material.statusTexto, classeStatusMaterial(material)));

    const celulaAcoes = criarCelulaAcoes([
        criarBotaoAcao("view", "visualizar", "Visualizar", ICONE_VISUALIZAR),
        criarBotaoAcao("edit", "editar", "Editar", ICONE_EDITAR),
        criarBotaoAcao("delete", "excluir", "Excluir", ICONE_EXCLUIR)
    ]);

    linha.append(celulaCodigo, celulaNome, celulaQuantidade, celulaStatus, celulaAcoes);
    return linha;
}

export function criarLinhaRetirada(retirada) {
    const linha = document.createElement("tr");
    linha.dataset.id = retirada.id;

    const celulaData = document.createElement("td");
    celulaData.textContent = retirada.dataFormatada;

    const celulaFuncionario = document.createElement("td");
    celulaFuncionario.append(criarTexto("func-nome", retirada.funcionario?.nome ?? "—"));

    const celulaMaterial = document.createElement("td");
    celulaMaterial.append(criarTexto("mat-nome", retirada.material?.nome ?? "—"));

    const celulaQuantidade = document.createElement("td");
    celulaQuantidade.append(criarTexto("qtd-cell", retirada.quantidade));

    const celulaAcoes = criarCelulaAcoes([
        criarBotaoAcao("edit", "editar", "Editar", ICONE_EDITAR),
        criarBotaoAcao("delete", "excluir", "Excluir (devolve ao estoque)", ICONE_EXCLUIR)
    ]);

    linha.append(celulaData, celulaFuncionario, celulaMaterial, celulaQuantidade, celulaAcoes);
    return linha;
}

// --- Componentes de estado vazio ---

export function criarLinhaVazia(mensagem, colspan = 1, classe = null) {
    const linha = document.createElement("tr");
    if (classe) linha.className = classe;

    const celula = document.createElement("td");
    celula.colSpan = colspan;
    celula.textContent = mensagem;
    celula.style.textAlign = "center";
    celula.style.color = "#94a3b8";
    celula.style.padding = "24px";

    linha.append(celula);
    return linha;
}

export function criarMensagemVazia(mensagem, classe = "mov-vazio") {
    const paragrafo = document.createElement("p");
    paragrafo.className = classe;
    paragrafo.textContent = mensagem;
    return paragrafo;
}

// --- Componentes do dashboard ---

export function criarItemRetirada(retirada) {
    const item = document.createElement("div");
    item.className = "mov-item";

    const icone = document.createElement("div");
    icone.className = "mov-icon out";
    icone.innerHTML = ICONE_SAIDA; // ícone fixo, sem dados do usuário

    const info = document.createElement("div");
    info.className = "mov-info";

    const titulo = document.createElement("h4");
    titulo.textContent = retirada.material?.nome ?? "—";

    const detalhe = document.createElement("p");
    const data = new Date(retirada.data).toLocaleDateString("pt-BR");
    detalhe.textContent = `${data} · ${retirada.funcionario?.nome ?? "—"}`;
    info.append(titulo, detalhe);

    const valor = document.createElement("div");
    valor.className = "mov-value out";
    valor.textContent = `-${retirada.quantidade}`;

    item.append(icone, info, valor);
    return item;
}
