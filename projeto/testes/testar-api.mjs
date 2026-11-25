import { spawn } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const porta = 3100;
globalThis.ESTOKA_API_URL = `http://localhost:${porta}`;

const pastaTemp = mkdtempSync(join(tmpdir(), "estoka-"));
copyFileSync(join(raiz, "db.json"), join(pastaTemp, "db.json"));

const importar = caminho => import(pathToFileURL(join(raiz, caminho)).href);
const { ApiError } = await importar("js/api/http.js");
const apiFuncionarios = await importar("js/api/funcionarios.js");
const apiMateriais = await importar("js/api/materiais.js");
const apiRetiradas = await importar("js/api/retiradas.js");
const { Funcionario } = await importar("js/classes/funcionario.js");
const { Material } = await importar("js/classes/material.js");
const { Retirada } = await importar("js/classes/retirada.js");
const { mesmoId } = await importar("js/utils.js");

let servidor = null;

async function iniciarServidor() {
    servidor = spawn(
        process.execPath,
        [join(raiz, "node_modules/json-server/lib/bin.js"), join(pastaTemp, "db.json"), "-p", String(porta)],
        { stdio: "ignore" }
    );
    for (let i = 0; i < 50; i++) {
        try {
            await fetch(`${globalThis.ESTOKA_API_URL}/funcionarios`);
            return;
        } catch {
            await new Promise(r => setTimeout(r, 100));
        }
    }
    throw new Error("JSON Server não iniciou.");
}

function pararServidor() {
    servidor?.kill();
    servidor = null;
}

// --- Mini executor de testes ---
const resultados = [];
async function teste(nome, funcao) {
    try {
        await funcao();
        resultados.push({ nome, ok: true });
        console.log(`  ✔ ${nome}`);
    } catch (erro) {
        resultados.push({ nome, ok: false, erro });
        console.log(`  ✘ ${nome}\n      ${erro.message}`);
    }
}
function afirmar(condicao, mensagem) {
    if (!condicao) throw new Error(mensagem);
}

try {
    await iniciarServidor();
    console.log("\nTestes da integração com a API REST\n");

    await teste("1. Carrega funcionários, materiais e retiradas a partir da API", async () => {
        const funcionarios = await apiFuncionarios.listarFuncionarios();
        const materiais = await apiMateriais.listarMateriais();
        const retiradas = await apiRetiradas.listarRetiradas(funcionarios, materiais);
        afirmar(funcionarios.length === 8, `esperava 8 funcionários, veio ${funcionarios.length}`);
        afirmar(materiais.length === 12, `esperava 12 materiais, veio ${materiais.length}`);
        afirmar(retiradas.length === 3, `esperava 3 retiradas, veio ${retiradas.length}`);
        afirmar(funcionarios[0] instanceof Funcionario, "deveria devolver instâncias de Funcionario");
    });

    let novoFuncionario;
    await teste("2. Cadastra funcionário e confirma persistência no servidor", async () => {
        novoFuncionario = await apiFuncionarios.cadastrarFuncionario(
            new Funcionario("FUNC-099", "Teste Automatizado", false)
        );
        afirmar(novoFuncionario.id, "o servidor deveria gerar um id");
        const lido = await apiFuncionarios.buscarFuncionario(novoFuncionario.id);
        afirmar(lido.nome === "Teste Automatizado", "registro não foi persistido");
    });

    await teste("3. Altera funcionário e verifica a atualização", async () => {
        novoFuncionario.nome = "Nome Alterado";
        novoFuncionario.bloqueado = true;
        await apiFuncionarios.atualizarFuncionario(novoFuncionario);
        const lido = await apiFuncionarios.buscarFuncionario(novoFuncionario.id);
        afirmar(lido.nome === "Nome Alterado" && lido.bloqueado === true, "alteração não persistiu");
    });

    await teste("4. Exclui funcionário e confirma a remoção", async () => {
        await apiFuncionarios.excluirFuncionario(novoFuncionario.id);
        const lista = await apiFuncionarios.listarFuncionarios();
        afirmar(!lista.some(f => mesmoId(f.id, novoFuncionario.id)), "registro ainda existe");
        try {
            await apiFuncionarios.buscarFuncionario(novoFuncionario.id);
            afirmar(false, "deveria falhar com 404");
        } catch (erro) {
            afirmar(erro instanceof ApiError && erro.status === 404, "esperava ApiError 404");
        }
    });

    await teste("5. CRUD de material, incluindo ajuste de estoque via PATCH", async () => {
        const criado = await apiMateriais.cadastrarMaterial(new Material("ESC-099", "Material Teste", 20, false));
        const ajustado = await apiMateriais.atualizarQuantidadeMaterial(criado.id, 15);
        afirmar(ajustado.quantidade === 15 && ajustado.nome === "Material Teste", "PATCH deveria alterar só a quantidade");
        criado.nome = "Material Teste 2";
        await apiMateriais.atualizarMaterial(criado);
        afirmar((await apiMateriais.buscarMaterial(criado.id)).nome === "Material Teste 2", "PUT não persistiu");
        await apiMateriais.excluirMaterial(criado.id);
        const lista = await apiMateriais.listarMateriais();
        afirmar(!lista.some(m => mesmoId(m.id, criado.id)), "material não foi removido");
    });

    await teste("6. Retiradas preservam o relacionamento com funcionário e material", async () => {
        const funcionarios = await apiFuncionarios.listarFuncionarios();
        const materiais = await apiMateriais.listarMateriais();
        const ana = funcionarios.find(f => f.id === "f1");
        const papel = materiais.find(m => m.id === "m1");

        const criada = await apiRetiradas.cadastrarRetirada(new Retirada(ana, papel, 3));
        afirmar(criada.funcionarioId === "f1" && criada.materialId === "m1", "ids de relacionamento incorretos");

        const retiradas = await apiRetiradas.listarRetiradas(funcionarios, materiais);
        const lida = retiradas.find(r => mesmoId(r.id, criada.id));
        afirmar(lida?.funcionario?.nome === "Ana Silva", "retirada deveria estar ligada a Ana Silva");
        afirmar(lida?.material?.nome === "Papel Sulfite A4", "retirada deveria estar ligada ao Papel Sulfite A4");

        lida.quantidade = 4;
        await apiRetiradas.atualizarRetirada(lida);
        const apos = (await apiRetiradas.listarRetiradas(funcionarios, materiais)).find(r => mesmoId(r.id, criada.id));
        afirmar(apos.quantidade === 4, "quantidade da retirada não foi atualizada");

        await apiRetiradas.excluirRetirada(criada.id);
        const final = await apiRetiradas.listarRetiradas(funcionarios, materiais);
        afirmar(!final.some(r => mesmoId(r.id, criada.id)), "retirada não foi removida");
    });

    await teste("7. Consultas usadas nas regras de negócio (excluir com retiradas associadas)", async () => {
        afirmar((await apiRetiradas.contarRetiradasDoFuncionario("f1")) === 2, "f1 deveria ter 2 retiradas");
        afirmar((await apiRetiradas.contarRetiradasDoFuncionario("f8")) === 0, "f8 não deveria ter retiradas");
        afirmar((await apiRetiradas.contarRetiradasDoMaterial("m1")) === 1, "m1 deveria ter 1 retirada");
        afirmar((await apiRetiradas.contarRetiradasDoMaterial("m12")) === 0, "m12 não deveria ter retiradas");
    });

    await teste("8. Identificadores textuais são preservados (sem conversão para número)", async () => {
        const funcionarios = await apiFuncionarios.listarFuncionarios();
        afirmar(funcionarios.every(f => typeof f.id === "string"), "ids deveriam ser texto");
        afirmar(funcionarios[0].id === "f1", "id 'f1' deveria ser mantido");

        const gerado = await apiFuncionarios.cadastrarFuncionario(new Funcionario("FUNC-098", "Id Gerado", false));
        afirmar(typeof gerado.id === "string", "id gerado pelo servidor deveria ser texto");
        afirmar((await apiFuncionarios.buscarFuncionario(gerado.id)).id === gerado.id, "busca por id gerado falhou");
        afirmar(mesmoId("f1", "f1") && !mesmoId("f1", "f2") && !mesmoId(null, "f1"), "mesmoId com comportamento incorreto");
        await apiFuncionarios.excluirFuncionario(gerado.id);
    });

    await teste("9. Resposta HTTP de erro vira ApiError com mensagem compreensível", async () => {
        try {
            await apiMateriais.buscarMaterial("id-inexistente");
            afirmar(false, "deveria lançar erro");
        } catch (erro) {
            afirmar(erro instanceof ApiError, "esperava ApiError");
            afirmar(erro.status === 404 && /não encontrado/i.test(erro.message), `mensagem inesperada: ${erro.message}`);
        }
    });

    await teste("10. Falha de comunicação (servidor parado) vira ApiError compreensível", async () => {
        pararServidor();
        await new Promise(r => setTimeout(r, 500));
        try {
            await apiMateriais.listarMateriais();
            afirmar(false, "deveria lançar erro");
        } catch (erro) {
            afirmar(erro instanceof ApiError, "esperava ApiError");
            afirmar(/servidor/i.test(erro.message) && erro.status === null, `mensagem inesperada: ${erro.message}`);
        }
    });
} finally {
    pararServidor();
    rmSync(pastaTemp, { recursive: true, force: true });
}

const falhas = resultados.filter(r => !r.ok).length;
console.log(`\n${resultados.length - falhas}/${resultados.length} testes passaram.\n`);
process.exit(falhas === 0 ? 0 : 1);