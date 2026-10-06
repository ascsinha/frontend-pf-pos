import { Retirada } from "../classes/retirada.js";
import { retiradas, salvarRetiradas } from "../dados/retiradas.js";
import { funcionarios } from "../dados/funcionarios.js";
import { materiais, salvarMateriais } from "../dados/materiais.js";

const corpoTabela = document.querySelector("#tabela-retiradas tbody");
const contadorTexto = document.querySelector("#contador-retiradas");
const formulario = document.querySelector("#form-retirada");
const campoFuncionario = document.querySelector("#retirada-funcionario");
const campoMaterial = document.querySelector("#retirada-material");
const campoQuantidade = document.querySelector("#retirada-quantidade");
const campoId = document.querySelector("#retirada-id");
const tituloFormulario = document.querySelector("#titulo-formulario-retirada");
const botaoSalvar = document.querySelector("#botao-salvar-retirada");
const botaoLimpar = document.querySelector("#botao-limpar-retirada");

let idEmEdicao = null;

function preencherSelect(select, itens, rotuloInicial, rotulo) {
    if (!select) return;
    select.innerHTML = "";

    const inicial = new Option(rotuloInicial, "", true, true);
    inicial.disabled = true;
    select.append(inicial);

    itens.forEach(item => select.append(new Option(rotulo(item), item.id)));
}

function carregarSelects(funcionarioSelecionado = null, materialSelecionado = null) {
    preencherSelect(
        campoFuncionario,
        funcionarios.filter(f => !f.bloqueado || f.id === funcionarioSelecionado),
        "Selecione um funcionário",
        f => `${f.matricula} - ${f.nome}`
    );

    preencherSelect(
        campoMaterial,
        materiais.filter(m => (!m.bloqueado && m.quantidade > 0) || m.id === materialSelecionado),
        "Selecione um material",
        m => `${m.codigo} - ${m.nome} (disp.: ${m.quantidade})`
    );

    if (funcionarioSelecionado !== null) campoFuncionario.value = String(funcionarioSelecionado);
    if (materialSelecionado !== null) campoMaterial.value = String(materialSelecionado);
}

function renderizarLista() {
    if (!corpoTabela) return;
    corpoTabela.innerHTML = "";

    if (retiradas.length === 0) {
        corpoTabela.innerHTML = `<tr class="empty-row"><td colspan="5">Nenhuma retirada registrada.</td></tr>`;
    } else {
        [...retiradas].reverse().forEach(r => corpoTabela.append(r.render()));
    }

    if (contadorTexto) contadorTexto.textContent = `${retiradas.length} retiradas registradas`;
}

function atualizarTela() {
    carregarSelects();
    renderizarLista();
}

function limparFormulario() {
    idEmEdicao = null;
    if (campoId) campoId.value = "";
    formulario?.reset();
    if (tituloFormulario) tituloFormulario.textContent = "Registrar Retirada";
    if (botaoSalvar) botaoSalvar.textContent = "Registrar";
    carregarSelects();
}

function criarRetirada(funcionario, material, quantidade) {
    const retirada = new Retirada(funcionario, material, quantidade);
    material.quantidade -= quantidade;
    retiradas.push(retirada);

    salvarMateriais();
    salvarRetiradas();
}

function iniciarEdicao(retirada) {
    idEmEdicao = retirada.id;
    if (campoId) campoId.value = retirada.id;
    carregarSelects(retirada.funcionario.id, retirada.material.id);
    campoFuncionario.value = String(retirada.funcionario.id);
    campoMaterial.value = String(retirada.material.id);
    campoQuantidade.value = retirada.quantidade;

    if (tituloFormulario) tituloFormulario.textContent = "Editar Retirada";
    if (botaoSalvar) botaoSalvar.textContent = "Salvar alterações";
    formulario?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function alterarRetirada(id, funcionario, material, quantidade) {
    const retirada = retiradas.find(r => r.id === Number(id));
    if (!retirada) return false;

    if (funcionario.bloqueado || material.bloqueado) {
        alert("Não é possível usar funcionário ou material bloqueado.");
        return false;
    }

    const materialAnterior = retirada.material;
    const quantidadeAnterior = retirada.quantidade;

    const disponibilidade = material === materialAnterior
        ? material.quantidade + quantidadeAnterior
        : material.quantidade;

    if (quantidade < 1 || quantidade > disponibilidade) {
        alert(`Quantidade inválida. Disponível para esta alteração: ${disponibilidade}.`);
        return false;
    }

    // Reverte a retirada antiga e aplica a nova operação.
    materialAnterior.quantidade += quantidadeAnterior;
    material.quantidade -= quantidade;

    retirada.funcionario = funcionario;
    retirada.material = material;
    retirada.quantidade = quantidade;

    salvarMateriais();
    salvarRetiradas();
    return true;
}

function excluirRetirada(id) {
    const indice = retiradas.findIndex(r => r.id === Number(id));
    if (indice === -1) return;

    const retirada = retiradas[indice];
    if (!confirm("Excluir esta retirada? A quantidade voltará ao estoque.")) return;

    retirada.material.quantidade += retirada.quantidade;
    retiradas.splice(indice, 1);

    salvarMateriais();
    salvarRetiradas();
    limparFormulario();
    atualizarTela();
}

formulario?.addEventListener("submit", evento => {
    evento.preventDefault();

    const funcionario = funcionarios.find(f => f.id === Number(campoFuncionario.value));
    const material = materiais.find(m => m.id === Number(campoMaterial.value));
    const quantidade = Number(campoQuantidade.value);

    if (!funcionario || !material) {
        alert("Selecione um funcionário e um material.");
        return;
    }

    if (!Number.isInteger(quantidade) || quantidade < 1) {
        alert("Informe uma quantidade inteira maior que zero.");
        return;
    }

    if (idEmEdicao) {
        if (alterarRetirada(idEmEdicao, funcionario, material, quantidade)) {
            limparFormulario();
            atualizarTela();
        }
        return;
    }

    if (funcionario.bloqueado || material.bloqueado) {
        alert("Funcionário ou material bloqueado.");
        return;
    }

    if (quantidade > material.quantidade) {
        alert(`Quantidade inválida. Disponível: ${material.quantidade}.`);
        return;
    }

    criarRetirada(funcionario, material, quantidade);
    limparFormulario();
    atualizarTela();
});

corpoTabela?.addEventListener("click", evento => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;

    const id = botao.closest("tr")?.dataset.id;
    if (!id) return;

    if (botao.dataset.acao === "editar") {
        const retirada = retiradas.find(r => r.id === Number(id));
        if (retirada) iniciarEdicao(retirada);
    }

    if (botao.dataset.acao === "excluir") excluirRetirada(id);
});

botaoLimpar?.addEventListener("click", limparFormulario);

export function iniciarRetiradas() {
    atualizarTela();
}
