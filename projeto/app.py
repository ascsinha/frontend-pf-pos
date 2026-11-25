"""Servidor Flask do ESTOKA.

Substitui o JSON Server: serve os arquivos estáticos do front-end e expõe a
mesma API REST (/funcionarios, /materiais e /retiradas) persistindo os dados
em db.json.

Execução:
    python app.py

A aplicação fica disponível em http://localhost:5000.
"""

import json
import secrets
import string
from pathlib import Path

from flask import Flask, abort, jsonify, request, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
CAMINHO_DB = BASE_DIR / "db.json"

COLECOES = ("funcionarios", "materiais", "retiradas")

# Arquivos/pastas do próprio projeto que nunca devem ser servidos como
# estáticos (ex.: o .venv criado dentro de projeto/ não pode ficar acessível).
ARQUIVOS_INTERNOS = {
    "node_modules",
    "app.py",
    "requirements.txt",
    "db.json",
    "package.json",
    "package-lock.json",
    "testes",
    "TESTES.md",
    "README.md",
}

# static_url_path="" faz o Flask servir os HTML, css/ e js/ diretamente na raiz
# (ex.: /materiais.html, /js/index.js), como um servidor de arquivos estáticos.
app = Flask(__name__, static_folder=str(BASE_DIR), static_url_path="")


@app.before_request
def bloquear_arquivos_internos():
    segmentos = [parte for parte in request.path.split("/") if parte]
    if not segmentos:
        return None
    primeiro = segmentos[0]
    if primeiro.startswith(".") or primeiro in ARQUIVOS_INTERNOS:
        abort(404)
    return None


def ler_dados():
    with CAMINHO_DB.open(encoding="utf-8") as arquivo:
        return json.load(arquivo)


def gravar_dados(dados):
    with CAMINHO_DB.open("w", encoding="utf-8") as arquivo:
        json.dump(dados, arquivo, ensure_ascii=False, indent=2)


# Estado em memória, espelhado em db.json (mesmo comportamento do JSON Server).
DADOS = ler_dados()


def salvar():
    gravar_dados(DADOS)


def indice_de(colecao, identificador):
    for indice, registro in enumerate(DADOS[colecao]):
        if str(registro.get("id")) == str(identificador):
            return indice
    return None


def localizar(colecao, identificador):
    indice = indice_de(colecao, identificador)
    return None if indice is None else DADOS[colecao][indice]


def gerar_id(colecao):
    existentes = {str(registro.get("id")) for registro in DADOS[colecao]}
    alfabeto = string.ascii_lowercase + string.digits
    while True:
        novo = "".join(secrets.choice(alfabeto) for _ in range(8))
        if novo not in existentes:
            return novo


def registrar_colecao(colecao):
    rota = "/" + colecao

    @app.get(rota, endpoint=f"{colecao}_listar")
    def listar():
        registros = DADOS[colecao]
        filtros = dict(request.args.items())
        if filtros:
            registros = [
                registro
                for registro in registros
                if all(str(registro.get(chave)) == valor for chave, valor in filtros.items())
            ]
        return jsonify(registros)

    @app.get(f"{rota}/<identificador>", endpoint=f"{colecao}_buscar")
    def buscar(identificador):
        registro = localizar(colecao, identificador)
        if registro is None:
            return jsonify({}), 404
        return jsonify(registro)

    @app.post(rota, endpoint=f"{colecao}_criar")
    def criar():
        corpo = request.get_json(silent=True)
        if not isinstance(corpo, dict):
            return jsonify({"erro": "Corpo JSON inválido."}), 400
        registro = dict(corpo)
        registro["id"] = gerar_id(colecao)
        DADOS[colecao].append(registro)
        salvar()
        return jsonify(registro), 201

    @app.put(f"{rota}/<identificador>", endpoint=f"{colecao}_substituir")
    def substituir(identificador):
        corpo = request.get_json(silent=True)
        if not isinstance(corpo, dict):
            return jsonify({"erro": "Corpo JSON inválido."}), 400
        registro = dict(corpo)
        registro["id"] = identificador
        indice = indice_de(colecao, identificador)
        if indice is None:
            DADOS[colecao].append(registro)
            salvar()
            return jsonify(registro), 201
        DADOS[colecao][indice] = registro
        salvar()
        return jsonify(registro)

    @app.patch(f"{rota}/<identificador>", endpoint=f"{colecao}_atualizar")
    def atualizar(identificador):
        corpo = request.get_json(silent=True)
        if not isinstance(corpo, dict):
            return jsonify({"erro": "Corpo JSON inválido."}), 400
        registro = localizar(colecao, identificador)
        if registro is None:
            return jsonify({}), 404
        registro.update(corpo)
        salvar()
        return jsonify(registro)

    @app.delete(f"{rota}/<identificador>", endpoint=f"{colecao}_excluir")
    def excluir(identificador):
        indice = indice_de(colecao, identificador)
        if indice is None:
            return jsonify({}), 404
        DADOS[colecao].pop(indice)
        salvar()
        return "", 200


for _colecao in COLECOES:
    registrar_colecao(_colecao)


@app.get("/")
def pagina_inicial():
    return send_from_directory(BASE_DIR, "index.html")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
