// Camada de comunicação HTTP.
//
// Centraliza a função de requisição usada por todos os módulos de api/.
// Qualquer falha (rede indisponível, resposta HTTP de erro, JSON inválido)
// é convertida em um ApiError com mensagem compreensível para o usuário.

// Endereço do JSON Server. Altere aqui se a API rodar em outra porta/host.
export const URL_BASE = globalThis.ESTOKA_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
    constructor(mensagem, { status = null, causa = null } = {}) {
        super(mensagem);
        this.name = "ApiError";
        this.status = status;
        this.causa = causa;
    }
}

function mensagemPorStatus(status) {
    if (status === 404) return "Registro não encontrado no servidor.";
    if (status >= 500) return "O servidor encontrou um erro ao processar a requisição.";
    return `O servidor recusou a requisição (HTTP ${status}).`;
}

/**
 *
 * @param {string}   
 * @param {object}    
 *                          
 */

export async function requisicao(caminho, { metodo = "GET", corpo, parametros } = {}) {
    const url = new URL(URL_BASE + caminho);
    if (parametros) {
        Object.entries(parametros).forEach(([chave, valor]) =>
            url.searchParams.set(chave, String(valor))
        );
    }

    const configuracao = { method: metodo, headers: { Accept: "application/json" } };
    if (corpo !== undefined) {
        configuracao.headers["Content-Type"] = "application/json";
        configuracao.body = JSON.stringify(corpo);
    }

    let resposta;
    try {
        resposta = await fetch(url, configuracao);
    } catch (erro) {
        throw new ApiError(
            "Não foi possível se comunicar com o servidor. Verifique se o JSON Server está em execução.",
            { causa: erro }
        );
    }

    if (!resposta.ok) {
        throw new ApiError(mensagemPorStatus(resposta.status), { status: resposta.status });
    }

    const texto = await resposta.text();
    if (!texto) return null;

    try {
        return JSON.parse(texto);
    } catch (erro) {
        throw new ApiError("O servidor devolveu uma resposta inválida.", {
            status: resposta.status,
            causa: erro
        });
    }
}