export class Retirada {
    static proximoId = 1;

    #id;
    #funcionario;
    #material;
    #quantidade;
    #data;

    constructor(funcionario, material, quantidade, data = new Date().toISOString(), id = null) {
        if (id === null || id === undefined) {
            this.#id = Retirada.proximoId++;
        } else {
            this.#id = Number(id);
            Retirada.proximoId = Math.max(Retirada.proximoId, this.#id + 1);
        }
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
