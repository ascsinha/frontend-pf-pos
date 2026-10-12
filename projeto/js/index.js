import { materiais } from "./dados/materiais.js";
import { funcionarios } from "./dados/funcionarios.js";
import { retiradas } from "./dados/retiradas.js";
 
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
 
const ICONE_SAIDA =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M3 9v4a2 2 0 002 2h14a2 2 0 002-2V9M7 14l5 5 5-5M12 19V7" />' +
    "</svg>";
 
function plural(quantidade, singular, plural) {
    return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}
 
function criarItemRetirada(retirada) {
    const item = document.createElement("div");
    item.className = "mov-item";
 
    const icone = document.createElement("div");
    icone.className = "mov-icon out";
    icone.innerHTML = ICONE_SAIDA; // texto fixo, sem dados do usuário
 
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
 
function renderizarUltimasRetiradas() {
    if (!listaUltimas) return;
    listaUltimas.innerHTML = "";
 
    if (retiradas.length === 0) {
        const vazio = document.createElement("p");
        vazio.className = "mov-vazio";
        vazio.textContent = "Nenhuma retirada registrada ainda.";
        listaUltimas.append(vazio);
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
 