import { Retirada } from "../classes/retirada.js";
import { requisicao } from "./http.js";
import { mesmoId } from "../utils.js";

const RECURSO = "/retiradas";

function paraApi(retirada) {
    return {
        funcionarioId: retirada.funcionario.id,
        materialId: retirada.material.id,
        quantidade: retirada.quantidade,
        data: retirada.data
    };
}

export function montarRetirada(dados, funcionarios, materiais) {
    const funcionario = funcionarios.find(f => mesmoId(f.id, dados.funcionarioId)) ?? null;
    const material = materiais.find(m => mesmoId(m.id, dados.materialId)) ?? null;
    return new Retirada(funcionario, material, dados.quantidade, dados.data, dados.id);
}

export async function listarRetiradas(funcionarios, materiais) {
    const dados = await requisicao(RECURSO);
    return dados.map(d => montarRetirada(d, funcionarios, materiais));
}

export async function cadastrarRetirada(retirada) {
    return await requisicao(RECURSO, { metodo: "POST", corpo: paraApi(retirada) });
}

export async function atualizarRetirada(retirada) {
    return await requisicao(`${RECURSO}/${encodeURIComponent(retirada.id)}`, {
        metodo: "PUT",
        corpo: paraApi(retirada)
    });
}

export async function excluirRetirada(id) {
    await requisicao(`${RECURSO}/${encodeURIComponent(id)}`, { metodo: "DELETE" });
}

export async function contarRetiradasDoFuncionario(funcionarioId) {
    const dados = await requisicao(RECURSO, { parametros: { funcionarioId } });
    return dados.length;
}

export async function contarRetiradasDoMaterial(materialId) {
    const dados = await requisicao(RECURSO, { parametros: { materialId } });
    return dados.length;
}