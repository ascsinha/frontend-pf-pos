import { Funcionario } from "../classes/funcionario.js";

const CHAVE = "almoxarifado.funcionarios";

const dadosIniciais = [
    ["FUNC-001", "Ana Silva", false],
    ["FUNC-002", "Carlos Mendes", false],
    ["FUNC-003", "Pedro Costa", true],
    ["FUNC-004", "Mariana Oliveira", false],
    ["FUNC-005", "João Santos", true],
    ["FUNC-006", "Beatriz Almeida", false],
    ["FUNC-007", "Rafael Lima", false],
    ["FUNC-008", "Fernanda Souza", false]
];

function salvarDados() {
    const dados = funcionarios.map(f => ({
        id: f.id,
        matricula: f.matricula,
        nome: f.nome,
        bloqueado: f.bloqueado
    }));
    localStorage.setItem(CHAVE, JSON.stringify(dados));
}

function carregarFuncionarios() {
    const texto = localStorage.getItem(CHAVE);

    if (!texto) {
        const lista = dadosIniciais.map(
            ([matricula, nome, bloqueado]) => new Funcionario(matricula, nome, bloqueado)
        );
        localStorage.setItem(CHAVE, JSON.stringify(lista.map(f => ({
            id: f.id,
            matricula: f.matricula,
            nome: f.nome,
            bloqueado: f.bloqueado
        }))));
        return lista;
    }

    try {
        const dados = JSON.parse(texto);
        return Array.isArray(dados)
            ? dados.map(d => new Funcionario(d.matricula, d.nome, d.bloqueado, d.id))
            : [];
    } catch {
        localStorage.removeItem(CHAVE);
        return carregarFuncionarios();
    }
}

export const funcionarios = carregarFuncionarios();

export function salvarFuncionarios() {
    salvarDados();
}