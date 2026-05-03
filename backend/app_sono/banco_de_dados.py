# banco_de_dados.py
# Responsável por criar e conectar ao banco de dados SQLite do app

import sqlite3
import os

# ─────────────────────────────────────────
# CONFIGURAÇÃO
# ─────────────────────────────────────────

CAMINHO_BANCO = "dados/sono.db"


def conectar():
    """
    Abre e retorna uma conexão com o banco de dados.
    Cria a pasta 'dados/' automaticamente se não existir.

    Uso:
        conn = conectar()
        cursor = conn.cursor()
        ...
        conn.close()
    """
    os.makedirs("dados", exist_ok=True)
    conn = sqlite3.connect(CAMINHO_BANCO)
    conn.row_factory = sqlite3.Row  # permite acessar colunas pelo nome
    return conn


# ─────────────────────────────────────────
# CRIAÇÃO DAS TABELAS
# ─────────────────────────────────────────

def criar_tabela_musicas(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS musicas (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo           TEXT    NOT NULL,
            genero           TEXT    NOT NULL,
            nome_arquivo     TEXT    NOT NULL,
            duracao_segundos INTEGER DEFAULT 0
        )
    """)


def criar_tabela_sonhos(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sonhos (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            data         TEXT    NOT NULL,
            descricao    TEXT    NOT NULL,
            emocao       TEXT,
            interpretacao TEXT,
            criado_em    TEXT    DEFAULT (datetime('now', 'localtime'))
        )
    """)


def criar_tabela_sono(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sono (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            data         TEXT    NOT NULL,
            hora_dormir  TEXT    NOT NULL,
            hora_acordar TEXT    NOT NULL,
            duracao_min  INTEGER,
            qualidade    INTEGER,
            criado_em    TEXT    DEFAULT (datetime('now', 'localtime'))
        )
    """)


def criar_todas_tabelas():
    """
    Cria todas as tabelas do app de uma vez.
    Chame essa função no início do app (no main.py).
    """
    conn = conectar()
    cursor = conn.cursor()

    criar_tabela_musicas(cursor)
    criar_tabela_sonhos(cursor)
    criar_tabela_sono(cursor)

    conn.commit()
    conn.close()
    print("Todas as tabelas criadas com sucesso.")


# ─────────────────────────────────────────
# UTILITÁRIOS
# ─────────────────────────────────────────

def listar_tabelas():
    """Mostra todas as tabelas existentes no banco."""
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tabelas = [linha[0] for linha in cursor.fetchall()]
    conn.close()

    print("\nTabelas no banco de dados:")
    for t in tabelas:
        print(f"  - {t}")
    return tabelas


def resetar_banco():
    """
    ATENÇÃO: apaga todos os dados do banco!
    Use só durante o desenvolvimento para recomeçar do zero.
    """
    confirmacao = input("Tem certeza que quer apagar tudo? (sim/não): ").strip().lower()
    if confirmacao == "sim":
        if os.path.exists(CAMINHO_BANCO):
            os.remove(CAMINHO_BANCO)
            print("Banco apagado. Rode criar_todas_tabelas() para recriar.")
        else:
            print("Banco não encontrado.")
    else:
        print("Operação cancelada.")


# ─────────────────────────────────────────
# EXECUÇÃO DIRETA (teste rápido)
# ─────────────────────────────────────────

if __name__ == "__main__":
    criar_todas_tabelas()
    listar_tabelas()