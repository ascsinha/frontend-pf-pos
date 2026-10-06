import { Funcionario } from "../classes/funcionario.js";
import { funcionarios, salvarFuncionarios } from "../dados/funcionarios.js";
import { funcionarioPossuiRetiradas } from "../dados/retiradas.js";

const corpoTabela = document.querySelector("#tabela-funcionarios tbody");
const contadorTexto = document.querySelector("#contador-funcionarios");
const formulario = document.querySelector("#form-funcionario");
const tituloFormulario = document.querySelector("#titulo-formulario-funcionario");
const botaoSalvar = document.querySelector("#botao-salvar-funcionario");
const botaoLimpar = document.querySelector("#botao-limpar-funcionario");
const campoMatricula = document.querySelector("#matricula");
const campoNome = document.querySelector("#nome");
const campoBloqueado = document.querySelector("#funcionario-bloqueado");
const campoBusca = document.querySelector("#busca-funcionario");
const botoesFiltro = document.querySelectorAll("#filtros-funcionario .filter-btn, .filter-btn");

let filtroAtual = "todos";
let buscaAtual = "";
let idEmEdicao = null;

function escapar(valor) {
    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function funcionariosFiltrados() {
    return funcionarios.filter(funcionario => {
        const combinaBusca =
            funcionario.nome.toLowerCase().includes(buscaAtual) ||
            funcionario.matricula.toLowerCase().includes(buscaAtual);

        const combinaFiltro =
            filtroAtual === "todos" ||
            (filtroAtual === "ativos" && !funcionario.bloqueado) ||
            (filtroAtual === "bloqueados" && funcionario.bloqueado);

        return combinaBusca && combinaFiltro;
    });
}

function renderizarLista() {
    if (!corpoTabela) return;
    corpoTabela.innerHTML = "";

    const lista = funcionariosFiltrados();
    if (lista.length === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:24px;">Nenhum funcionário encontrado.</td></tr>`;
    } else {
        lista.forEach(funcionario => corpoTabela.append(funcionario.render()));
    }

    if (contadorTexto) {
        contadorTexto.textContent = `${funcionarios.length} funcionários cadastrados`;
    }
}

function limparFormulario() {
    idEmEdicao = null;
    formulario?.reset();
    if (tituloFormulario) tituloFormulario.textContent = "Cadastrar Funcionário";
    if (botaoSalvar) botaoSalvar.textContent = "Cadastrar";
}

function preencherFormularioParaEdicao(funcionario) {
    idEmEdicao = funcionario.id;
    campoMatricula.value = funcionario.matricula;
    campoNome.value = funcionario.nome;
    if (campoBloqueado) campoBloqueado.checked = funcionario.bloqueado;
    if (tituloFormulario) tituloFormulario.textContent = "Editar Funcionário";
    if (botaoSalvar) botaoSalvar.textContent = "Salvar alterações";
    formulario?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function criarFuncionario(dados) {
    if (funcionarios.some(f => f.matricula.toLowerCase() === dados.matricula.toLowerCase())) {
        alert("Já existe um funcionário com essa matrícula.");
        return false;
    }

    funcionarios.push(new Funcionario(dados.matricula, dados.nome, dados.bloqueado));
    salvarFuncionarios();
    return true;
}

function alterarFuncionario(id, dados) {
    const funcionario = funcionarios.find(f => f.id === Number(id));
    if (!funcionario) return false;

    const matriculaDuplicada = funcionarios.some(
        f => f.id !== funcionario.id && f.matricula.toLowerCase() === dados.matricula.toLowerCase()
    );
    if (matriculaDuplicada) {
        alert("Já existe outro funcionário com essa matrícula.");
        return false;
    }

    funcionario.matricula = dados.matricula;
    funcionario.nome = dados.nome;
    funcionario.bloqueado = dados.bloqueado;
    salvarFuncionarios();
    return true;
}

function excluirFuncionario(id) {
    const indice = funcionarios.findIndex(f => f.id === Number(id));
    if (indice === -1) return;

    const funcionario = funcionarios[indice];

    if (funcionarioPossuiRetiradas(funcionario.id)) {
        alert(`Não é possível excluir o funcionário "${funcionario.nome}" porque existem retiradas associadas a ele.`);
        return;
    }

    if (!confirm(`Deseja realmente excluir o funcionário "${funcionario.nome}"?`)) return;

    funcionarios.splice(indice, 1);
    salvarFuncionarios();
    limparFormulario();
    renderizarLista();
}

function visualizarFuncionario(id) {
    const funcionario = funcionarios.find(f => f.id === Number(id));
    if (!funcionario) return;

    alert(
        `Funcionário\n\nMatrícula: ${escapar(funcionario.matricula)}\nNome: ${escapar(funcionario.nome)}\nStatus: ${funcionario.statusTexto}`
    );
}

corpoTabela?.addEventListener("click", evento => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;

    const id = botao.closest("tr")?.dataset.id;
    if (!id) return;

    if (botao.dataset.acao === "editar") {
        const funcionario = funcionarios.find(f => f.id === Number(id));
        if (funcionario) preencherFormularioParaEdicao(funcionario);
    }

    if (botao.dataset.acao === "excluir") excluirFuncionario(id);
    if (botao.dataset.acao === "visualizar") visualizarFuncionario(id);
});

formulario?.addEventListener("submit", evento => {
    evento.preventDefault();

    const dados = {
        matricula: campoMatricula.value.trim(),
        nome: campoNome.value.trim(),
        bloqueado: Boolean(campoBloqueado?.checked)
    };

    if (!dados.matricula || !dados.nome) {
        alert("Preencha a matrícula e o nome do funcionário.");
        return;
    }

    const sucesso = idEmEdicao
        ? alterarFuncionario(idEmEdicao, dados)
        : criarFuncionario(dados);

    if (sucesso) {
        limparFormulario();
        renderizarLista();
    }
});

botaoLimpar?.addEventListener("click", limparFormulario);

campoBusca?.addEventListener("input", evento => {
    buscaAtual = evento.target.value.trim().toLowerCase();
    renderizarLista();
});

botoesFiltro.forEach(botao => {
    botao.addEventListener("click", () => {
        botoesFiltro.forEach(b => b.classList.remove("active"));
        botao.classList.add("active");
        filtroAtual = botao.dataset.filtro || "todos";
        renderizarLista();
    });
});

export function iniciarFuncionarios() {
    renderizarLista();
}