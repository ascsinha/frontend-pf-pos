import { Material } from "../classes/material.js";
import { materiais, salvarMateriais } from "../dados/materiais.js";
import { materialPossuiRetiradas } from "../dados/retiradas.js";

const corpoTabela = document.querySelector("#tabela-materiais tbody");
const contadorTexto = document.querySelector("#contador-materiais");
const formulario = document.querySelector("#form-material");
const tituloFormulario = document.querySelector("#titulo-formulario-material");
const botaoSalvar = document.querySelector("#botao-salvar-material");
const botaoLimpar = document.querySelector("#botao-limpar-material");
const campoCodigo = document.querySelector("#codigo");
const campoNome = document.querySelector("#nome");
const campoQuantidade = document.querySelector("#quantidade");
const campoBloqueado = document.querySelector("#material-bloqueado");
const campoBusca = document.querySelector("#busca-material");
const botoesFiltro = document.querySelectorAll("#filtros-material .filter-btn, .filter-btn");

let filtroAtual = "todos";
let buscaAtual = "";
let idEmEdicao = null;

function materiaisFiltrados() {
    return materiais.filter(material => {
        const combinaBusca =
            material.nome.toLowerCase().includes(buscaAtual) ||
            material.codigo.toLowerCase().includes(buscaAtual);

        const combinaFiltro =
            filtroAtual === "todos" ||
            (filtroAtual === "liberados" && !material.bloqueado) ||
            (filtroAtual === "bloqueados" && material.bloqueado);

        return combinaBusca && combinaFiltro;
    });
}

function renderizarLista() {
    if (!corpoTabela) return;
    corpoTabela.innerHTML = "";

    const lista = materiaisFiltrados();
    if (lista.length === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:24px;">Nenhum material encontrado.</td></tr>`;
    } else {
        lista.forEach(material => corpoTabela.append(material.render()));
    }

    if (contadorTexto) contadorTexto.textContent = `${materiais.length} materiais cadastrados`;
}

function limparFormulario() {
    idEmEdicao = null;
    formulario?.reset();
    if (tituloFormulario) tituloFormulario.textContent = "Cadastrar Material";
    if (botaoSalvar) botaoSalvar.textContent = "Cadastrar";
}

function preencherFormularioParaEdicao(material) {
    idEmEdicao = material.id;
    campoCodigo.value = material.codigo;
    campoNome.value = material.nome;
    campoQuantidade.value = material.quantidade;
    if (campoBloqueado) campoBloqueado.checked = material.bloqueado;
    if (tituloFormulario) tituloFormulario.textContent = "Editar Material";
    if (botaoSalvar) botaoSalvar.textContent = "Salvar alterações";
    formulario?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function criarMaterial(dados) {
    if (materiais.some(m => m.codigo.toLowerCase() === dados.codigo.toLowerCase())) {
        alert("Já existe um material com esse código.");
        return false;
    }

    materiais.push(new Material(dados.codigo, dados.nome, dados.quantidade, dados.bloqueado));
    salvarMateriais();
    return true;
}

function alterarMaterial(id, dados) {
    const material = materiais.find(m => m.id === Number(id));
    if (!material) return false;

    const codigoDuplicado = materiais.some(
        m => m.id !== material.id && m.codigo.toLowerCase() === dados.codigo.toLowerCase()
    );
    if (codigoDuplicado) {
        alert("Já existe outro material com esse código.");
        return false;
    }

    material.codigo = dados.codigo;
    material.nome = dados.nome;
    material.quantidade = dados.quantidade;
    material.bloqueado = dados.bloqueado;
    salvarMateriais();
    return true;
}

function excluirMaterial(id) {
    const indice = materiais.findIndex(m => m.id === Number(id));
    if (indice === -1) return;

    const material = materiais[indice];

    if (materialPossuiRetiradas(material.id)) {
        alert(`Não é possível excluir o material "${material.nome}" porque existem retiradas associadas a ele.`);
        return;
    }

    if (!confirm(`Deseja realmente excluir o material "${material.nome}"?`)) return;

    materiais.splice(indice, 1);
    salvarMateriais();
    limparFormulario();
    renderizarLista();
}

function visualizarMaterial(id) {
    const material = materiais.find(m => m.id === Number(id));
    if (!material) return;

    alert(
        `Material\n\nCódigo: ${material.codigo}\nNome: ${material.nome}\nQuantidade disponível: ${material.quantidade}\nStatus: ${material.statusTexto}`
    );
}

corpoTabela?.addEventListener("click", evento => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;

    const id = botao.closest("tr")?.dataset.id;
    if (!id) return;

    if (botao.dataset.acao === "editar") {
        const material = materiais.find(m => m.id === Number(id));
        if (material) preencherFormularioParaEdicao(material);
    }
    if (botao.dataset.acao === "excluir") excluirMaterial(id);
    if (botao.dataset.acao === "visualizar") visualizarMaterial(id);
});

formulario?.addEventListener("submit", evento => {
    evento.preventDefault();

    const quantidade = Number(campoQuantidade.value);
    const dados = {
        codigo: campoCodigo.value.trim(),
        nome: campoNome.value.trim(),
        quantidade,
        bloqueado: Boolean(campoBloqueado?.checked)
    };

    if (!dados.codigo || !dados.nome || !Number.isInteger(quantidade) || quantidade < 0) {
        alert("Informe código, nome e uma quantidade válida (zero ou maior).");
        return;
    }

    const sucesso = idEmEdicao
        ? alterarMaterial(idEmEdicao, dados)
        : criarMaterial(dados);

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

export function iniciarMateriais() {
    renderizarLista();
}
