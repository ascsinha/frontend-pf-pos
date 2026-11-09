import { Funcionario } from "../classes/funcionario.js";
import { requisicao } from "./http.js";

const RECURSO = "/funcionarios";

function deApi(dados) {
    return new Funcionario(dados.matricula, dados.nome, dados.bloqueado, dados.id);
}

function paraApi(funcionario) {
    return {
        matricula: funcionario.matricula,
        nome: funcionario.nome,
        bloqueado: funcionario.bloqueado
    };
}

export async function listarFuncionarios() {
    const dados = await requisicao(RECURSO);
    return dados.map(deApi);
}

export async function buscarFuncionario(id) {
    return deApi(await requisicao(`${RECURSO}/${encodeURIComponent(id)}`));
}

export async function cadastrarFuncionario(funcionario) {
    return deApi(await requisicao(RECURSO, { metodo: "POST", corpo: paraApi(funcionario) }));
}

export async function atualizarFuncionario(funcionario) {
    return deApi(
        await requisicao(`${RECURSO}/${encodeURIComponent(funcionario.id)}`, {
            metodo: "PUT",
            corpo: paraApi(funcionario)
        })
    );
}

export async function excluirFuncionario(id) {
    await requisicao(`${RECURSO}/${encodeURIComponent(id)}`, { metodo: "DELETE" });
}