export class Funcionario {
    #id;
    #matricula;
    #nome;
    #bloqueado;

    constructor(matricula, nome, bloqueado = false, id = null) {
        this.#id = id ?? null;
        this.#matricula = matricula;
        this.#nome = nome;
        this.#bloqueado = Boolean(bloqueado);
    }

    get id() {
        return this.#id;
    }

    get matricula() {
        return this.#matricula;
    }

    set matricula(valor) {
        this.#matricula = valor;
    }

    get nome() {
        return this.#nome;
    }

    set nome(valor) {
        this.#nome = valor;
    }

    get bloqueado() {
        return this.#bloqueado;
    }

    set bloqueado(valor) {
        this.#bloqueado = Boolean(valor);
    }

    get statusTexto() {
        return this.#bloqueado ? "Bloqueado" : "Não bloqueado";
    }
}