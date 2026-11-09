const ID_CONTAINER = "mensagens-sistema";
const DURACAO_MS = 6000;

function garantirContainer() {
    let container = document.getElementById(ID_CONTAINER);
    if (container) return container;

    const estilo = document.createElement("style");
    estilo.textContent = `
        #${ID_CONTAINER} {
            position: fixed; top: 16px; right: 16px; z-index: 9999;
            display: flex; flex-direction: column; gap: 8px;
            max-width: min(420px, calc(100vw - 32px));
        }
        #${ID_CONTAINER} .mensagem {
            display: flex; align-items: flex-start; gap: 12px;
            padding: 12px 14px; border-radius: 10px; font-size: 0.85rem;
            line-height: 1.4; color: #0f172a; background: #fff;
            border: 1px solid #e2e8f0; border-left-width: 4px;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
        }
        #${ID_CONTAINER} .mensagem.erro { border-left-color: #dc2626; }
        #${ID_CONTAINER} .mensagem.sucesso { border-left-color: #16a34a; }
        #${ID_CONTAINER} .mensagem span { flex: 1; }
        #${ID_CONTAINER} .mensagem button {
            border: 0; background: transparent; cursor: pointer;
            font-size: 1rem; line-height: 1; color: #64748b;
        }
    `;
    document.head.append(estilo);

    container = document.createElement("div");
    container.id = ID_CONTAINER;
    container.setAttribute("aria-live", "polite");
    document.body.append(container);
    return container;
}

function mostrar(tipo, texto) {
    const container = garantirContainer();

    const aviso = document.createElement("div");
    aviso.className = `mensagem ${tipo}`;
    aviso.setAttribute("role", tipo === "erro" ? "alert" : "status");

    const conteudo = document.createElement("span");
    conteudo.textContent = texto;

    const fechar = document.createElement("button");
    fechar.type = "button";
    fechar.setAttribute("aria-label", "Fechar mensagem");
    fechar.textContent = "×";
    fechar.addEventListener("click", () => aviso.remove());

    aviso.append(conteudo, fechar);
    container.append(aviso);
    setTimeout(() => aviso.remove(), DURACAO_MS);
}

export function mostrarErro(texto) {
    mostrar("erro", texto);
}

export function mostrarSucesso(texto) {
    mostrar("sucesso", texto);
}