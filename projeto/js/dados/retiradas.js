import { Retirada } from "../classes/retirada.js";
import { funcionarios } from "./funcionarios.js";
import { materiais } from "./materiais.js";

const CHAVE = "almoxarifado.retiradas";

function carregarRetiradas() {
    let texto = localStorage.getItem(CHAVE);

    if (!texto) {
        texto = localStorage.getItem("retiradas");
        if (texto) localStorage.setItem(CHAVE, texto);
    }

    if (!texto) return [];

    try {
        const dados = JSON.parse(texto);
        if (!Array.isArray(dados)) return [];

        return dados
            .map(d => {
                const funcionario = funcionarios.find(f => f.id === Number(d.funcionarioId));
                const material = materiais.find(m => m.id === Number(d.materialId));

                if (!funcionario || !material) return null;

                return new Retirada(
                    funcionario,
                    material,
                    Number(d.quantidade),
                    d.data,
                    Number(d.id)
                );
            })
            .filter(Boolean);
    } catch {
        localStorage.removeItem(CHAVE);
        return [];
    }
}

export const retiradas = carregarRetiradas();

export function salvarRetiradas() {
    const dados = retiradas.map(r => ({
        id: r.id,
        funcionarioId: r.funcionario.id,
        materialId: r.material.id,
        quantidade: r.quantidade,
        data: r.data
    }));

    localStorage.setItem(CHAVE, JSON.stringify(dados));
}

export function funcionarioPossuiRetiradas(id) {
    return retiradas.some(r => r.funcionario?.id === Number(id));
}

export function materialPossuiRetiradas(id) {
    return retiradas.some(r => r.material?.id === Number(id));
}
