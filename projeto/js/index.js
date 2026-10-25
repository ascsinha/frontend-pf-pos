import { materiais } from "./dados/materiais.js";
import { funcionarios } from "./dados/funcionarios.js";
import { retiradas } from "./dados/retiradas.js";
import { criarItemRetirada, criarMensagemVazia } from "./interface/componentes.js";

const LIMITE_ULTIMAS = 6;
const LIMITE_ESTOQUE_BAIXO = 10;

const statTotalProdutos = document.querySelector("#stat-total-produtos");
const statEmEstoque = document.querySelector("#stat-em-estoque");
const statEstoqueBaixo = document.querySelector("#stat-estoque-baixo");
const statTotalRetiradas = document.querySelector("#stat-total-retiradas");
const statUnidadesRetiradas = document.querySelector("#stat-unidades-retiradas");
const textoFuncionarios = document.querySelector("#quick-funcionarios-texto");
const textoMateriais = document.querySelector("#quick-materiais-texto");
const textoRetiradas = document.querySelector("#quick-retiradas-texto");
const listaUltimas = document.querySelector("#lista-ultimas-retiradas");

function plural(quantidade, singular, plural) {
    return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

function renderizarUltimasRetiradas() {
    if (!listaUltimas) return;
    listaUltimas.innerHTML = "";

    if (retiradas.length === 0) {
        listaUltimas.append(criarMensagemVazia("Nenhuma retirada registrada ainda."));
        return;
    }

    [...retiradas]
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .slice(0, LIMITE_ULTIMAS)
        .forEach(retirada => listaUltimas.append(criarItemRetirada(retirada)));
}

function atualizarDashboard() {
    if (statTotalProdutos) statTotalProdutos.textContent = materiais.length;

    if (statEmEstoque) {
        statEmEstoque.textContent = materiais.filter(m => m.quantidade > 0).length;
    }

    if (statEstoqueBaixo) {
        statEstoqueBaixo.textContent = materiais.filter(
            m => m.quantidade > 0 && m.quantidade <= LIMITE_ESTOQUE_BAIXO
        ).length;
    }

    if (statTotalRetiradas) statTotalRetiradas.textContent = retiradas.length;

    if (statUnidadesRetiradas) {
        statUnidadesRetiradas.textContent = retiradas.reduce((soma, r) => soma + r.quantidade, 0);
    }

    if (textoFuncionarios) {
        const ativos = funcionarios.filter(f => !f.bloqueado).length;
        textoFuncionarios.textContent =
            `${plural(ativos, "funcionário ativo", "funcionários ativos")}. Clique para gerenciar.`;
    }

    if (textoMateriais) {
        textoMateriais.textContent =
            `${plural(materiais.length, "material cadastrado", "materiais cadastrados")}. Clique para gerenciar.`;
    }

    if (textoRetiradas) {
        textoRetiradas.textContent =
            `${plural(retiradas.length, "retirada registrada", "retiradas registradas")}. Clique para registrar.`;
    }

    renderizarUltimasRetiradas();
}

atualizarDashboard();
