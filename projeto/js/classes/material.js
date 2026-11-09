export class Material {
    #id;
    #codigo;
    #nome;
    #quantidade;
    #bloqueado;

    constructor(codigo, nome, quantidade = 0, bloqueado = false, id = null) {
        this.#id = id ?? null;
        this.#codigo = codigo;
        this.#nome = nome;
        this.#quantidade = Number(quantidade);
        this.#bloqueado = Boolean(bloqueado);
    }

    get id() {
        return this.#id;
    }

    get codigo() {
        return this.#codigo;
    }

    set codigo(valor) {
        this.#codigo = valor;
    }

    get nome() {
        return this.#nome;
    }

    set nome(valor) {
        this.#nome = valor;
    }

    get quantidade() {
        return this.#quantidade;
    }

    set quantidade(valor) {
        this.#quantidade = Number(valor);
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