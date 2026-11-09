import { Material } from "../classes/material.js";
import { requisicao } from "./http.js";

const RECURSO = "/materiais";

function deApi(dados) {
    return new Material(dados.codigo, dados.nome, dados.quantidade, dados.bloqueado, dados.id);
}

function paraApi(material) {
    return {
        codigo: material.codigo,
        nome: material.nome,
        quantidade: material.quantidade,
        bloqueado: material.bloqueado
    };
}

export async function listarMateriais() {
    const dados = await requisicao(RECURSO);
    return dados.map(deApi);
}

export async function buscarMaterial(id) {
    return deApi(await requisicao(`${RECURSO}/${encodeURIComponent(id)}`));
}

export async function cadastrarMaterial(material) {
    return deApi(await requisicao(RECURSO, { metodo: "POST", corpo: paraApi(material) }));
}

export async function atualizarMaterial(material) {
    return deApi(
        await requisicao(`${RECURSO}/${encodeURIComponent(material.id)}`, {
            metodo: "PUT",
            corpo: paraApi(material)
        })
    );
}

export async function atualizarQuantidadeMaterial(id, quantidade) {
    return deApi(
        await requisicao(`${RECURSO}/${encodeURIComponent(id)}`, {
            metodo: "PATCH",
            corpo: { quantidade: Number(quantidade) }
        })
    );
}

export async function excluirMaterial(id) {
    await requisicao(`${RECURSO}/${encodeURIComponent(id)}`, { metodo: "DELETE" });
}