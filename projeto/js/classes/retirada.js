export class Retirada {
    #id;
    #funcionario;
    #material;
    #quantidade;
    #data;

    constructor(funcionario, material, quantidade, data = new Date().toISOString(), id = null) {
        this.#id = id ?? null;
        this.#funcionario = funcionario;
        this.#material = material;
        this.#quantidade = Number(quantidade);
        this.#data = data;
    }

    get id() { return this.#id; }
    get funcionario() { return this.#funcionario; }
    get material() { return this.#material; }
    get quantidade() { return this.#quantidade; }
    get data() { return this.#data; }
    set funcionario(valor) { this.#funcionario = valor; }
    set material(valor) { this.#material = valor; }
    set quantidade(valor) { this.#quantidade = Number(valor); }
    set data(valor) { this.#data = valor; }
    get dataFormatada() { return new Date(this.#data).toLocaleString("pt-BR"); }
}