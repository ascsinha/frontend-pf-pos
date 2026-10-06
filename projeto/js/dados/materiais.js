import { Material } from "../classes/material.js";

const CHAVE = "almoxarifado.materiais";

const dadosIniciais = [
    ["ESC-001", "Papel Sulfite A4", 85, false],
    ["ESC-002", "Caneta Esferográfica", 38, false],
    ["ESC-003", "Lápis Preto nº 2", 0, true],
    ["ESC-004", "Borracha Branca", 64, false],
    ["ESC-005", "Grampeador", 12, false],
    ["ESC-006", "Grampo 26/6", 7, false],
    ["ESC-007", "Pasta Suspensa", 34, true],
    ["ESC-008", "Fita Adesiva", 29, false],
    ["ESC-009", "Post-it 76x76mm", 11, false],
    ["ESC-010", "Marcador de Texto", 42, false],
    ["ESC-011", "Clips 4/0 Galvanizado", 23, false],
    ["ESC-012", "Envelope A4 Branco", 0, true]
];

function serializar() {
    return materiais.map(m => ({
        id: m.id,
        codigo: m.codigo,
        nome: m.nome,
        quantidade: m.quantidade,
        bloqueado: m.bloqueado
    }));
}

function carregarMateriais() {
    const texto = localStorage.getItem(CHAVE);

    if (!texto) {
        const lista = dadosIniciais.map(
            ([codigo, nome, quantidade, bloqueado]) =>
                new Material(codigo, nome, quantidade, bloqueado)
        );
        localStorage.setItem(CHAVE, JSON.stringify(lista.map(m => ({
            id: m.id,
            codigo: m.codigo,
            nome: m.nome,
            quantidade: m.quantidade,
            bloqueado: m.bloqueado
        }))));
        return lista;
    }

    try {
        const dados = JSON.parse(texto);
        return Array.isArray(dados)
            ? dados.map(d => new Material(d.codigo, d.nome, d.quantidade, d.bloqueado, d.id))
            : [];
    } catch {
        localStorage.removeItem(CHAVE);
        return carregarMateriais();
    }
}

export const materiais = carregarMateriais();

export function salvarMateriais() {
    localStorage.setItem(CHAVE, JSON.stringify(serializar()));
}
