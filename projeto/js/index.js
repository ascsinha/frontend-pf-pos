import { listarMateriais } from "./api/materiais.js";
import { listarFuncionarios } from "./api/funcionarios.js";
import { listarRetiradas } from "./api/retiradas.js";
import { criarItemRetirada, criarMensagemVazia } from "./interface/componentes.js";
import { mostrarErro } from "./interface/mensagens.js";

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

function renderizarUltimasRetiradas(retiradas) {
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

function atualizarDashboard({ materiais, funcionarios, retiradas }) {
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

    renderizarUltimasRetiradas(retiradas);
}

function mostrarFalhaDeCarga() {
    [statTotalProdutos, statEmEstoque, statEstoqueBaixo, statTotalRetiradas, statUnidadesRetiradas]
        .forEach(elemento => { if (elemento) elemento.textContent = "—"; });

    if (listaUltimas) {
        listaUltimas.innerHTML = "";
        listaUltimas.append(
            criarMensagemVazia("Não foi possível carregar os dados. Verifique o servidor e recarregue a página.")
        );
    }
}

async function carregarDashboard() {
    if (listaUltimas) {
        listaUltimas.innerHTML = "";
        listaUltimas.append(criarMensagemVazia("Carregando dados..."));
    }

    try {
        const [funcionarios, materiais] = await Promise.all([
            listarFuncionarios(),
            listarMateriais()
        ]);
        const retiradas = await listarRetiradas(funcionarios, materiais);

        atualizarDashboard({ materiais, funcionarios, retiradas });
    } catch (erro) {
        mostrarFalhaDeCarga();
        mostrarErro(`Não foi possível carregar os dados do painel. ${erro.message}`);
    }
}

carregarDashboard();