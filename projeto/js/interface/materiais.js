import { Material } from "../classes/material.js";
import { listarMateriais, cadastrarMaterial, atualizarMaterial, excluirMaterial as excluirMaterialNaApi } from "../api/materiais.js";
import { contarRetiradasDoMaterial } from "../api/retiradas.js";
import { mesmoId } from "../utils.js";
import { criarLinhaMaterial, criarLinhaVazia } from "./componentes.js";
import { mostrarErro, mostrarSucesso } from "./mensagens.js";

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

let materiais = [];
let estadoCarga = "carregando"; 
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

    if (estadoCarga === "carregando") {
        corpoTabela.append(criarLinhaVazia("Carregando materiais...", 5));
        return;
    }

    if (estadoCarga === "erro") {
        corpoTabela.append(
            criarLinhaVazia("Não foi possível carregar os materiais. Verifique o servidor e recarregue a página.", 5)
        );
        if (contadorTexto) contadorTexto.textContent = "Dados indisponíveis";
        return;
    }

    const lista = materiaisFiltrados();
    if (lista.length === 0) {
        corpoTabela.append(criarLinhaVazia("Nenhum material encontrado.", 5));
    } else {
        lista.forEach(material => corpoTabela.append(criarLinhaMaterial(material)));
    }

    if (contadorTexto) contadorTexto.textContent = `${materiais.length} materiais cadastrados`;
}

async function carregarLista() {
    try {
        materiais = await listarMateriais();
        estadoCarga = "pronto";
        return true;
    } catch (erro) {
        estadoCarga = "erro";
        materiais = [];
        mostrarErro(`Não foi possível carregar os materiais. ${erro.message}`);
        return false;
    } finally {
        renderizarLista();
    }
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

function codigoDuplicado(codigo, idIgnorado = null) {
    return materiais.some(
        m => !mesmoId(m.id, idIgnorado) && m.codigo.toLowerCase() === codigo.toLowerCase()
    );
}

async function criarMaterial(dados) {
    if (!(await carregarLista())) return false;

    if (codigoDuplicado(dados.codigo)) {
        alert("Já existe um material com esse código.");
        return false;
    }

    try {
        await cadastrarMaterial(
            new Material(dados.codigo, dados.nome, dados.quantidade, dados.bloqueado)
        );
    } catch (erro) {
        mostrarErro(`Não foi possível cadastrar o material. ${erro.message}`);
        return false;
    }

    mostrarSucesso("Material cadastrado com sucesso.");
    return true;
}

async function alterarMaterial(id, dados) {
    if (!(await carregarLista())) return false;

    const material = materiais.find(m => mesmoId(m.id, id));
    if (!material) {
        mostrarErro("Este material não existe mais no servidor.");
        return false;
    }

    if (codigoDuplicado(dados.codigo, material.id)) {
        alert("Já existe outro material com esse código.");
        return false;
    }

    material.codigo = dados.codigo;
    material.nome = dados.nome;
    material.quantidade = dados.quantidade;
    material.bloqueado = dados.bloqueado;

    try {
        await atualizarMaterial(material);
    } catch (erro) {
        mostrarErro(`Não foi possível salvar as alterações do material. ${erro.message}`);
        return false;
    }

    mostrarSucesso("Material atualizado com sucesso.");
    return true;
}

async function excluirMaterial(id) {
    const material = materiais.find(m => mesmoId(m.id, id));
    if (!material) return;

    try {
        if ((await contarRetiradasDoMaterial(material.id)) > 0) {
            alert(`Não é possível excluir o material "${material.nome}" porque existem retiradas associadas a ele.`);
            return;
        }
    } catch (erro) {
        mostrarErro(`Não foi possível verificar as retiradas do material. ${erro.message}`);
        return;
    }

    if (!confirm(`Deseja realmente excluir o material "${material.nome}"?`)) return;

    try {
        await excluirMaterialNaApi(material.id);
    } catch (erro) {
        mostrarErro(`Não foi possível excluir o material. ${erro.message}`);
        return;
    }

    mostrarSucesso("Material excluído com sucesso.");
    if (mesmoId(idEmEdicao, material.id)) limparFormulario();
    await carregarLista();
}

function visualizarMaterial(id) {
    const material = materiais.find(m => mesmoId(m.id, id));
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
        const material = materiais.find(m => mesmoId(m.id, id));
        if (material) preencherFormularioParaEdicao(material);
    }
    if (botao.dataset.acao === "excluir") excluirMaterial(id);
    if (botao.dataset.acao === "visualizar") visualizarMaterial(id);
});

formulario?.addEventListener("submit", async evento => {
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

    if (botaoSalvar) botaoSalvar.disabled = true;
    try {
        const sucesso = idEmEdicao
            ? await alterarMaterial(idEmEdicao, dados)
            : await criarMaterial(dados);

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

export async function iniciarMateriais() {
    renderizarLista();
    await carregarLista();
}