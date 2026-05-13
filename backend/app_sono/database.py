# ─────────────────────────────────────────────────────────────
#  database.py
#  CONEXÃO COM O BANCO DE DADOS
#
#  Usamos SQLite — um banco de dados que fica num
#  arquivo único (sleepzen.db) na pasta do projeto.
#
#  Vantagens do SQLite para desenvolvimento:
#  - Não precisa instalar nada extra
#  - O banco é um arquivo só (fácil de resetar)
#  - Perfeito para aprender e prototipar
#
#  Em produção usaríamos PostgreSQL ou MySQL,
#  mas a lógica do código seria a mesma.
# ─────────────────────────────────────────────────────────────

import sqlite3
import os

# Nome do arquivo do banco de dados
# O arquivo será criado automaticamente na primeira execução
DB_NAME = "sleepzen.db"


def get_db():
    """
    Cria e retorna uma conexão com o banco de dados.

    check_same_thread=False → necessário para o FastAPI,
    que pode usar a mesma conexão em threads diferentes.

    row_factory=sqlite3.Row → faz com que cada linha
    retornada seja um objeto acessível por nome da coluna
    (ex: row['nome']) em vez de índice (row[0]).
    """
    conn = sqlite3.connect(DB_NAME, check_same_thread=False)
    conn.row_factory = sqlite3.Row  # acesso por nome: row['nome']
    return conn


def init_db():
    """
    Inicializa o banco de dados criando todas as tabelas
    caso ainda não existam.

    Chamada uma única vez quando o servidor inicia.
    O "IF NOT EXISTS" garante que não apaga dados existentes.
    """
    conn = get_db()
    cursor = conn.cursor()

    # ── Tabela: músicas ──────────────────────────────────────
    # Guarda todas as músicas/sons disponíveis no app
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS musicas (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            nome      TEXT    NOT NULL,
            categoria TEXT    NOT NULL,
            duracao   TEXT    NOT NULL,
            emoji     TEXT    NOT NULL,
            descricao TEXT,
            ativo     INTEGER DEFAULT 1,  -- 1=ativo, 0=inativo
            criado_em TEXT    DEFAULT (datetime('now'))
        )
    """)

    # ── Tabela: sonhos ───────────────────────────────────────
    # Guarda o diário de sonhos do usuário
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sonhos (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo    TEXT    NOT NULL,
            descricao TEXT    NOT NULL,
            emocoes   TEXT,   -- JSON: ["Feliz", "Calmo"]
            simbolos  TEXT,   -- JSON: ["🕊️ Voar", "💧 Água"]
            criado_em TEXT    DEFAULT (datetime('now'))
        )
    """)

    # ── Tabela: registros de sono ────────────────────────────
    # Guarda os dados de monitoramento do sono
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sono (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            horas_dormidas REAL    NOT NULL,   -- ex: 7.5 (7h30min)
            hora_dormir    TEXT    NOT NULL,   -- ex: "23:10"
            hora_acordar   TEXT    NOT NULL,   -- ex: "07:00"
            qualidade      TEXT    NOT NULL,   -- "Boa", "Regular", "Ruim"
            humor          TEXT,              -- "Bem", "Cansado", etc.
            observacoes    TEXT,
            criado_em      TEXT    DEFAULT (datetime('now'))
        )
    """)

    # ── Tabela: assinaturas ──────────────────────────────────
    # Guarda as assinaturas PRO dos usuários
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS assinaturas (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            email            TEXT    NOT NULL UNIQUE,
            plano            TEXT    NOT NULL,  -- "mensal", "anual", "unico"
            status           TEXT    NOT NULL,  -- "ativo", "cancelado", "expirado"
            stripe_id        TEXT,              -- ID da assinatura no Stripe
            data_inicio      TEXT    DEFAULT (datetime('now')),
            data_expiracao   TEXT
        )
    """)

    conn.commit()  # salva as mudanças
    conn.close()   # fecha a conexão
    print("✅ Banco de dados inicializado com sucesso.")


def popular_dados_iniciais():
    """
    Popula o banco com dados de exemplo.
    Só insere se a tabela de músicas estiver vazia,
    evitando duplicatas a cada reinício do servidor.
    """
    conn = get_db()
    cursor = conn.cursor()

    # Verifica se já tem músicas cadastradas
    cursor.execute("SELECT COUNT(*) FROM musicas")
    count = cursor.fetchone()[0]

    if count == 0:
        # Insere as músicas iniciais
        musicas = [
            ("Chuva Suave",     "Natureza",     "3:45", "🌧️", "Deixe a chuva lavar os pensamentos."),
            ("Piano Relaxante", "Instrumental", "4:32", "🎹", "Notas suaves que guiam ao descanso."),
            ("Ondas do Mar",    "Natureza",     "5:15", "🌊", "O ritmo eterno do oceano."),
            ("Noite Tranquila", "Ambiente",     "6:02", "🌙", "Silêncio estrelado para sono profundo."),
            ("Floresta Serena", "Natureza",     "4:18", "🌿", "Pássaros e vento entre as folhas."),
            ("Vento na Janela", "Ambiente",     "3:30", "🍃", "O sussurro do vento como abraço suave."),
        ]

        cursor.executemany(
            "INSERT INTO musicas (nome, categoria, duracao, emoji, descricao) VALUES (?, ?, ?, ?, ?)",
            musicas
        )

        conn.commit()
        print(f"✅ {len(musicas)} músicas inseridas no banco.")
    else:
        print(f"ℹ️  Banco já populado com {count} músicas.")

    conn.close()