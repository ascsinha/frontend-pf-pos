export class Funcionario {
    static proximoId = 1;

    #id;
    #matricula;
    #nome;
    #bloqueado;

    constructor(matricula, nome, bloqueado = false, id = null) {
        if (id === null || id === undefined) {
            this.#id = Funcionario.proximoId++;
        } else {
            this.#id = Number(id);
            Funcionario.proximoId = Math.max(Funcionario.proximoId, this.#id + 1);
        }
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
