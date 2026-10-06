import { materiais } from "./dados/materiais.js";
import { funcionarios } from "./dados/funcionarios.js";
import { retiradas } from "./dados/retiradas.js";

const statTotalProdutos = document.querySelector("#stat-total-produtos");
const statEmEstoque = document.querySelector("#stat-em-estoque");
const statEstoqueBaixo = document.querySelector("#stat-estoque-baixo");
const textoFuncionarios = document.querySelector("#quick-funcionarios-texto");
const textoMateriais = document.querySelector("#quick-materiais-texto");

function atualizarDashboard() {
    if (statTotalProdutos) statTotalProdutos.textContent = materiais.length;

    if (statEmEstoque) {
        statEmEstoque.textContent = materiais.filter(m => m.quantidade > 0).length;
    }

    if (statEstoqueBaixo) {
        statEstoqueBaixo.textContent = materiais.filter(
            m => m.quantidade > 0 && m.quantidade <= 10
        ).length;
    }

    if (textoFuncionarios) {
        const ativos = funcionarios.filter(f => !f.bloqueado).length;
        textoFuncionarios.textContent = `${ativos} funcionários ativos. Clique para gerenciar.`;
    }

    if (textoMateriais) {
        textoMateriais.textContent = `${materiais.length} materiais cadastrados. Clique para gerenciar.`;
    }

    const contadorRetiradas = document.querySelector("#stat-total-retiradas");
    if (contadorRetiradas) contadorRetiradas.textContent = retiradas.length;
}

atualizarDashboard();
