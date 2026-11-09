import { Retirada } from "../classes/retirada.js";
import { listarFuncionarios } from "../api/funcionarios.js";
import { listarMateriais, atualizarQuantidadeMaterial } from "../api/materiais.js";
import { listarRetiradas, cadastrarRetirada, atualizarRetirada, excluirRetirada as excluirRetiradaNaApi } from "../api/retiradas.js";
import { mesmoId } from "../utils.js";
import { criarLinhaRetirada, criarLinhaVazia } from "./componentes.js";
import { mostrarErro, mostrarSucesso } from "./mensagens.js";

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

let funcionarios = [];
let materiais = [];
let retiradas = [];
let estadoCarga = "carregando";
let idEmEdicao = null;

async function buscarDados() {
    const [listaFuncionarios, listaMateriais] = await Promise.all([
        listarFuncionarios(),
        listarMateriais()
    ]);
    const listaRetiradas = await listarRetiradas(listaFuncionarios, listaMateriais);

    funcionarios = listaFuncionarios;
    materiais = listaMateriais;
    retiradas = listaRetiradas;
}

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
        funcionarios.filter(f => !f.bloqueado || mesmoId(f.id, funcionarioSelecionado)),
        "Selecione um funcionário",
        f => `${f.matricula} - ${f.nome}`
    );

    preencherSelect(
        campoMaterial,
        materiais.filter(
            m => (!m.bloqueado && m.quantidade > 0) || mesmoId(m.id, materialSelecionado)
        ),
        "Selecione um material",
        m => `${m.codigo} - ${m.nome} (disp.: ${m.quantidade})`
    );

    if (funcionarioSelecionado !== null) campoFuncionario.value = String(funcionarioSelecionado);
    if (materialSelecionado !== null) campoMaterial.value = String(materialSelecionado);
}

function renderizarLista() {
    if (!corpoTabela) return;
    corpoTabela.innerHTML = "";

    if (estadoCarga === "carregando") {
        corpoTabela.append(criarLinhaVazia("Carregando retiradas...", 5, "empty-row"));
        return;
    }

    if (estadoCarga === "erro") {
        corpoTabela.append(
            criarLinhaVazia("Não foi possível carregar as retiradas. Verifique o servidor e recarregue a página.", 5, "empty-row")
        );
        if (contadorTexto) contadorTexto.textContent = "Dados indisponíveis";
        return;
    }

    if (retiradas.length === 0) {
        corpoTabela.append(criarLinhaVazia("Nenhuma retirada registrada.", 5, "empty-row"));
    } else {
        [...retiradas].reverse().forEach(r => corpoTabela.append(criarLinhaRetirada(r)));
    }

    if (contadorTexto) contadorTexto.textContent = `${retiradas.length} retiradas registradas`;
}

function atualizarTela() {
    carregarSelects();
    renderizarLista();
}

async function recarregarTela() {
    try {
        await buscarDados();
        estadoCarga = "pronto";
        return true;
    } catch (erro) {
        estadoCarga = "erro";
        funcionarios = [];
        materiais = [];
        retiradas = [];
        mostrarErro(`Não foi possível carregar as retiradas. ${erro.message}`);
        return false;
    } finally {
        atualizarTela();
    }
}

function limparFormulario() {
    idEmEdicao = null;
    if (campoId) campoId.value = "";
    formulario?.reset();
    if (tituloFormulario) tituloFormulario.textContent = "Registrar Retirada";
    if (botaoSalvar) botaoSalvar.textContent = "Registrar";
    carregarSelects();
}

async function executarComReversao(passos) {
    const concluidos = [];
    try {
        for (const passo of passos) {
            await passo.fazer();
            concluidos.push(passo);
        }
    } catch (erro) {
        let reversaCompleta = true;
        for (const passo of concluidos.reverse()) {
            try {
                await passo.desfazer?.();
            } catch {
                reversaCompleta = false;
            }
        }
        if (!reversaCompleta) {
            erro.message += " Algumas alterações não puderam ser desfeitas; recarregue a página e confira o estoque.";
        }
        throw erro;
    }
}

function passoAjustarEstoque(material, novaQuantidade) {
    const quantidadeOriginal = material.quantidade;
    return {
        fazer: () => atualizarQuantidadeMaterial(material.id, novaQuantidade),
        desfazer: () => atualizarQuantidadeMaterial(material.id, quantidadeOriginal)
    };
}

async function criarRetirada(funcionarioId, materialId, quantidade) {
    try {
        await buscarDados();
    } catch (erro) {
        mostrarErro(`Não foi possível validar a retirada. ${erro.message}`);
        return false;
    }

    const funcionario = funcionarios.find(f => mesmoId(f.id, funcionarioId));
    const material = materiais.find(m => mesmoId(m.id, materialId));

    if (!funcionario || !material) {
        alert("Selecione um funcionário e um material.");
        return false;
    }

    if (funcionario.bloqueado || material.bloqueado) {
        alert("Funcionário ou material bloqueado.");
        return false;
    }

    if (quantidade > material.quantidade) {
        alert(`Quantidade inválida. Disponível: ${material.quantidade}.`);
        return false;
    }

    const retirada = new Retirada(funcionario, material, quantidade);

    try {
        await executarComReversao([
            passoAjustarEstoque(material, material.quantidade - quantidade),
            { fazer: () => cadastrarRetirada(retirada) }
        ]);
    } catch (erro) {
        mostrarErro(`Não foi possível registrar a retirada. ${erro.message}`);
        return false;
    }

    mostrarSucesso("Retirada registrada com sucesso.");
    return true;
}

function iniciarEdicao(retirada) {
    if (!retirada.funcionario || !retirada.material) {
        mostrarErro("Esta retirada está ligada a um funcionário ou material que não existe mais.");
        return;
    }

    idEmEdicao = retirada.id;
    if (campoId) campoId.value = retirada.id;
    carregarSelects(retirada.funcionario.id, retirada.material.id);
    campoQuantidade.value = retirada.quantidade;

    if (tituloFormulario) tituloFormulario.textContent = "Editar Retirada";
    if (botaoSalvar) botaoSalvar.textContent = "Salvar alterações";
    formulario?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function alterarRetirada(id, funcionarioId, materialId, quantidade) {
    try {
        await buscarDados();
    } catch (erro) {
        mostrarErro(`Não foi possível validar a alteração. ${erro.message}`);
        return false;
    }

    const retirada = retiradas.find(r => mesmoId(r.id, id));
    if (!retirada) {
        mostrarErro("Esta retirada não existe mais no servidor.");
        return false;
    }

    const funcionario = funcionarios.find(f => mesmoId(f.id, funcionarioId));
    const material = materiais.find(m => mesmoId(m.id, materialId));
    if (!funcionario || !material) {
        alert("Selecione um funcionário e um material.");
        return false;
    }

    if (funcionario.bloqueado || material.bloqueado) {
        alert("Não é possível usar funcionário ou material bloqueado.");
        return false;
    }

    const materialAnterior = retirada.material; 
    const quantidadeAnterior = retirada.quantidade;
    const mesmoMaterial = mesmoId(materialAnterior?.id, material.id);

    const disponibilidade = mesmoMaterial
        ? material.quantidade + quantidadeAnterior
        : material.quantidade;

    if (quantidade < 1 || quantidade > disponibilidade) {
        alert(`Quantidade inválida. Disponível para esta alteração: ${disponibilidade}.`);
        return false;
    }

    const passos = [];
    if (mesmoMaterial) {
        passos.push(passoAjustarEstoque(material, disponibilidade - quantidade));
    } else {
        if (materialAnterior) {
            passos.push(passoAjustarEstoque(materialAnterior, materialAnterior.quantidade + quantidadeAnterior));
        }
        passos.push(passoAjustarEstoque(material, material.quantidade - quantidade));
    }

    const atualizada = new Retirada(funcionario, material, quantidade, retirada.data, retirada.id);
    passos.push({ fazer: () => atualizarRetirada(atualizada) });

    try {
        await executarComReversao(passos);
    } catch (erro) {
        mostrarErro(`Não foi possível salvar as alterações da retirada. ${erro.message}`);
        return false;
    }

    mostrarSucesso("Retirada atualizada com sucesso.");
    return true;
}

async function excluirRetirada(id) {
    const retirada = retiradas.find(r => mesmoId(r.id, id));
    if (!retirada) return;

    if (!confirm("Excluir esta retirada? A quantidade voltará ao estoque.")) return;

    try {
        await buscarDados();
    } catch (erro) {
        mostrarErro(`Não foi possível validar a exclusão. ${erro.message}`);
        return;
    }

    const atual = retiradas.find(r => mesmoId(r.id, id));
    if (!atual) {
        mostrarErro("Esta retirada já foi removida do servidor.");
        await recarregarTela();
        return;
    }

    const passos = [];
    if (atual.material) {
        passos.push(passoAjustarEstoque(atual.material, atual.material.quantidade + atual.quantidade));
    }
    passos.push({ fazer: () => excluirRetiradaNaApi(atual.id) });

    try {
        await executarComReversao(passos);
    } catch (erro) {
        mostrarErro(`Não foi possível excluir a retirada. ${erro.message}`);
        return;
    }

    mostrarSucesso("Retirada excluída e quantidade devolvida ao estoque.");
    if (mesmoId(idEmEdicao, atual.id)) limparFormulario();
    await recarregarTela();
}

formulario?.addEventListener("submit", async evento => {
    evento.preventDefault();

    const quantidade = Number(campoQuantidade.value);

    if (!campoFuncionario.value || !campoMaterial.value) {
        alert("Selecione um funcionário e um material.");
        return;
    }

    if (!Number.isInteger(quantidade) || quantidade < 1) {
        alert("Informe uma quantidade inteira maior que zero.");
        return;
    }

    if (botaoSalvar) botaoSalvar.disabled = true;
    try {
        const sucesso = idEmEdicao
            ? await alterarRetirada(idEmEdicao, campoFuncionario.value, campoMaterial.value, quantidade)
            : await criarRetirada(campoFuncionario.value, campoMaterial.value, quantidade);

        if (sucesso) {
            limparFormulario();
            await recarregarTela();
        }
    } finally {
        if (botaoSalvar) botaoSalvar.disabled = false;
    }
});

corpoTabela?.addEventListener("click", evento => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;

    const id = botao.closest("tr")?.dataset.id;
    if (!id) return;

    if (botao.dataset.acao === "editar") {
        const retirada = retiradas.find(r => mesmoId(r.id, id));
        if (retirada) iniciarEdicao(retirada);
    }

    if (botao.dataset.acao === "excluir") excluirRetirada(id);
});

botaoLimpar?.addEventListener("click", limparFormulario);

export async function iniciarRetiradas() {
    atualizarTela();
    await recarregarTela();
}