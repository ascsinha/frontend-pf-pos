import { Funcionario } from "../classes/funcionario.js";
import {
    listarFuncionarios,
    cadastrarFuncionario,
    atualizarFuncionario,
    excluirFuncionario as excluirFuncionarioNaApi
} from "../api/funcionarios.js";
import { contarRetiradasDoFuncionario } from "../api/retiradas.js";
import { escapeHtml, mesmoId } from "../utils.js";
import { criarLinhaFuncionario, criarLinhaVazia } from "./componentes.js";
import { mostrarErro, mostrarSucesso } from "./mensagens.js";

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

let funcionarios = [];
let estadoCarga = "carregando"; 
let filtroAtual = "todos";
let buscaAtual = "";
let idEmEdicao = null;

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

    if (estadoCarga === "carregando") {
        corpoTabela.append(criarLinhaVazia("Carregando funcionários...", 4));
        return;
    }

    if (estadoCarga === "erro") {
        corpoTabela.append(
            criarLinhaVazia("Não foi possível carregar os funcionários. Verifique o servidor e recarregue a página.", 4)
        );
        if (contadorTexto) contadorTexto.textContent = "Dados indisponíveis";
        return;
    }

    const lista = funcionariosFiltrados();
    if (lista.length === 0) {
        corpoTabela.append(criarLinhaVazia("Nenhum funcionário encontrado.", 4));
    } else {
        lista.forEach(funcionario => corpoTabela.append(criarLinhaFuncionario(funcionario)));
    }

    if (contadorTexto) {
        contadorTexto.textContent = `${funcionarios.length} funcionários cadastrados`;
    }
}

async function carregarLista() {
    try {
        funcionarios = await listarFuncionarios();
        estadoCarga = "pronto";
        return true;
    } catch (erro) {
        estadoCarga = "erro";
        funcionarios = [];
        mostrarErro(`Não foi possível carregar os funcionários. ${erro.message}`);
        return false;
    } finally {
        renderizarLista();
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

function matriculaDuplicada(matricula, idIgnorado = null) {
    return funcionarios.some(
        f => !mesmoId(f.id, idIgnorado) && f.matricula.toLowerCase() === matricula.toLowerCase()
    );
}

async function criarFuncionario(dados) {
    if (!(await carregarLista())) return false;

    if (matriculaDuplicada(dados.matricula)) {
        alert("Já existe um funcionário com essa matrícula.");
        return false;
    }

    try {
        await cadastrarFuncionario(new Funcionario(dados.matricula, dados.nome, dados.bloqueado));
    } catch (erro) {
        mostrarErro(`Não foi possível cadastrar o funcionário. ${erro.message}`);
        return false;
    }

    mostrarSucesso("Funcionário cadastrado com sucesso.");
    return true;
}

async function alterarFuncionario(id, dados) {
    if (!(await carregarLista())) return false;

    const funcionario = funcionarios.find(f => mesmoId(f.id, id));
    if (!funcionario) {
        mostrarErro("Este funcionário não existe mais no servidor.");
        return false;
    }

    if (matriculaDuplicada(dados.matricula, funcionario.id)) {
        alert("Já existe outro funcionário com essa matrícula.");
        return false;
    }

    funcionario.matricula = dados.matricula;
    funcionario.nome = dados.nome;
    funcionario.bloqueado = dados.bloqueado;

    try {
        await atualizarFuncionario(funcionario);
    } catch (erro) {
        mostrarErro(`Não foi possível salvar as alterações do funcionário. ${erro.message}`);
        return false;
    }

    mostrarSucesso("Funcionário atualizado com sucesso.");
    return true;
}

async function excluirFuncionario(id) {
    const funcionario = funcionarios.find(f => mesmoId(f.id, id));
    if (!funcionario) return;

    try {
        if ((await contarRetiradasDoFuncionario(funcionario.id)) > 0) {
            alert(`Não é possível excluir o funcionário "${funcionario.nome}" porque existem retiradas associadas a ele.`);
            return;
        }
    } catch (erro) {
        mostrarErro(`Não foi possível verificar as retiradas do funcionário. ${erro.message}`);
        return;
    }

    if (!confirm(`Deseja realmente excluir o funcionário "${funcionario.nome}"?`)) return;

    try {
        await excluirFuncionarioNaApi(funcionario.id);
    } catch (erro) {
        mostrarErro(`Não foi possível excluir o funcionário. ${erro.message}`);
        return;
    }

    mostrarSucesso("Funcionário excluído com sucesso.");
    if (mesmoId(idEmEdicao, funcionario.id)) limparFormulario();
    await carregarLista();
}

function visualizarFuncionario(id) {
    const funcionario = funcionarios.find(f => mesmoId(f.id, id));
    if (!funcionario) return;

    alert(
        `Funcionário\n\nMatrícula: ${escapeHtml(funcionario.matricula)}\nNome: ${escapeHtml(funcionario.nome)}\nStatus: ${funcionario.statusTexto}`
    );
}

corpoTabela?.addEventListener("click", evento => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;

    const id = botao.closest("tr")?.dataset.id;
    if (!id) return;

    if (botao.dataset.acao === "editar") {
        const funcionario = funcionarios.find(f => mesmoId(f.id, id));
        if (funcionario) preencherFormularioParaEdicao(funcionario);
    }

    if (botao.dataset.acao === "excluir") excluirFuncionario(id);
    if (botao.dataset.acao === "visualizar") visualizarFuncionario(id);
});

formulario?.addEventListener("submit", async evento => {
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

    if (botaoSalvar) botaoSalvar.disabled = true;
    try {
        const sucesso = idEmEdicao
            ? await alterarFuncionario(idEmEdicao, dados)
            : await criarFuncionario(dados);

        if (sucesso) {
            limparFormulario();
            await carregarLista();
        }
    } finally {
        if (botaoSalvar) botaoSalvar.disabled = false;
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

export async function iniciarFuncionarios() {
    renderizarLista();
    await carregarLista();
}