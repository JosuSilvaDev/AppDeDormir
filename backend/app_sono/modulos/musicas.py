# modulos/musicas.py
# Módulo completo da biblioteca de músicas calmas para dormir

import os
from banco_de_dados import conectar

# Tenta importar pygame para tocar música
# Instale com: pip install pygame
try:
    import pygame
    pygame.mixer.init()
    PYGAME_DISPONIVEL = True
except ImportError:
    PYGAME_DISPONIVEL = False
    print("pygame não instalado. Rode: pip install pygame")


# ─────────────────────────────────────────
# CONFIGURAÇÃO
# ─────────────────────────────────────────

CAMINHO_MUSICAS = "dados/musicas/"


def criar_tabela_musicas():
    """Cria a tabela de músicas no banco de dados se não existir."""
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS musicas (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo           TEXT    NOT NULL,
            genero           TEXT    NOT NULL,
            nome_arquivo     TEXT    NOT NULL,
            duracao_segundos INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()
    print("Tabela 'musicas' pronta.")


def popular_musicas_exemplo():
    """
    Insere músicas de exemplo no banco.
    Substitua nome_arquivo pelos seus .mp3 reais.
    """
    exemplos = [
        ("Chuva suave na floresta",   "natureza",  "chuva_floresta.mp3",    180),
        ("Ondas do mar ao amanhecer", "natureza",  "ondas_mar.mp3",         240),
        ("Vento entre as árvores",    "natureza",  "vento_arvores.mp3",     200),
        ("Piano noturno",             "classico",  "piano_noturno.mp3",     210),
        ("Valsa para dormir",         "classico",  "valsa_dormir.mp3",      195),
        ("Lo-fi study beats",         "lofi",      "lofi_study.mp3",        230),
        ("Café da manhã chill",       "lofi",      "cafe_chill.mp3",        185),
        ("Jazz às 2h da manhã",       "jazz",      "jazz_noturno.mp3",      220),
        ("Trumpet dreams",            "jazz",      "trumpet_dreams.mp3",    200),
        ("Respiração profunda",       "meditacao", "respiracao.mp3",        300),
        ("Tibetan bowls",             "meditacao", "tibetan_bowls.mp3",     270),
    ]

    conn = conectar()
    cursor = conn.cursor()

    # Só insere se a tabela estiver vazia
    cursor.execute("SELECT COUNT(*) FROM musicas")
    if cursor.fetchone()[0] == 0:
        cursor.executemany(
            "INSERT INTO musicas (titulo, genero, nome_arquivo, duracao_segundos) VALUES (?,?,?,?)",
            exemplos
        )
        conn.commit()
        print(f"{len(exemplos)} músicas inseridas.")
    else:
        print("Músicas já cadastradas.")

    conn.close()


# ─────────────────────────────────────────
# CONSULTAS
# ─────────────────────────────────────────

def listar_todos_generos():
    """Retorna lista de gêneros únicos cadastrados."""
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT genero FROM musicas ORDER BY genero")
    generos = [linha[0] for linha in cursor.fetchall()]
    conn.close()
    return generos


def buscar_musicas(genero=None):
    """
    Retorna todas as músicas ou filtra por gênero.
    Cada música é um dicionário com id, titulo, genero, nome_arquivo, duracao_segundos.
    """
    conn = conectar()
    cursor = conn.cursor()

    if genero:
        cursor.execute(
            "SELECT * FROM musicas WHERE genero = ? ORDER BY titulo",
            (genero,)
        )
    else:
        cursor.execute("SELECT * FROM musicas ORDER BY genero, titulo")

    musicas = [dict(linha) for linha in cursor.fetchall()]
    conn.close()
    return musicas


def buscar_musica_por_id(id_musica):
    """Retorna uma música específica pelo ID."""
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM musicas WHERE id = ?", (id_musica,))
    linha = cursor.fetchone()
    conn.close()
    return dict(linha) if linha else None


# ─────────────────────────────────────────
# PLAYER
# ─────────────────────────────────────────

musica_atual = None  # guarda qual música está tocando


def tocar_musica(id_musica):
    """
    Toca a música com o ID fornecido.
    O arquivo .mp3 deve estar na pasta dados/musicas/.
    """
    global musica_atual

    if not PYGAME_DISPONIVEL:
        print("pygame não disponível. Instale com: pip install pygame")
        return

    musica = buscar_musica_por_id(id_musica)
    if not musica:
        print(f"Música ID {id_musica} não encontrada.")
        return

    caminho = os.path.join(CAMINHO_MUSICAS, musica["nome_arquivo"])

    if not os.path.exists(caminho):
        print(f"Arquivo não encontrado: {caminho}")
        print("Coloque o arquivo .mp3 na pasta dados/musicas/")
        return

    pygame.mixer.music.stop()
    pygame.mixer.music.load(caminho)
    pygame.mixer.music.play()
    musica_atual = musica
    print(f"Tocando: {musica['titulo']} ({musica['genero']})")


def pausar_musica():
    """Pausa a música atual."""
    if PYGAME_DISPONIVEL:
        pygame.mixer.music.pause()
        print("Música pausada.")


def continuar_musica():
    """Continua a música pausada."""
    if PYGAME_DISPONIVEL:
        pygame.mixer.music.unpause()
        print("Continuando...")


def parar_musica():
    """Para a música completamente."""
    global musica_atual
    if PYGAME_DISPONIVEL:
        pygame.mixer.music.stop()
    musica_atual = None
    print("Música parada.")


def ajustar_volume(nivel):
    """
    Ajusta o volume. nivel vai de 0.0 (mudo) a 1.0 (máximo).
    Exemplo: ajustar_volume(0.5) → 50% do volume
    """
    if PYGAME_DISPONIVEL:
        nivel = max(0.0, min(1.0, nivel))
        pygame.mixer.music.set_volume(nivel)
        print(f"Volume: {int(nivel * 100)}%")


# ─────────────────────────────────────────
# INTERFACE DE TEXTO (para testar no terminal)
# ─────────────────────────────────────────

def formatar_tempo(segundos):
    """Converte segundos em formato mm:ss."""
    m = segundos // 60
    s = segundos % 60
    return f"{m}:{s:02d}"


def mostrar_biblioteca():
    """Exibe a biblioteca no terminal, organizada por gênero."""
    generos = listar_todos_generos()

    print("\n" + "=" * 45)
    print("       BIBLIOTECA DE MÚSICAS PARA DORMIR")
    print("=" * 45)

    for genero in generos:
        print(f"\n  [{genero.upper()}]")
        musicas = buscar_musicas(genero=genero)
        for m in musicas:
            tempo = formatar_tempo(m["duracao_segundos"])
            print(f"  {m['id']:>2}. {m['titulo']:<30} {tempo}")

    print("\n" + "=" * 45)


def menu_musicas():
    """Menu interativo no terminal para explorar e tocar músicas."""
    while True:
        mostrar_biblioteca()
        print("\nOpções:")
        print("  [número] → tocar música")
        print("  p        → pausar")
        print("  c        → continuar")
        print("  s        → parar")
        print("  v [0-10] → volume (ex: v 7)")
        print("  q        → sair")

        entrada = input("\n> ").strip().lower()

        if entrada == "q":
            parar_musica()
            print("Até logo! Boas noites. 🌙")
            break
        elif entrada == "p":
            pausar_musica()
        elif entrada == "c":
            continuar_musica()
        elif entrada == "s":
            parar_musica()
        elif entrada.startswith("v "):
            try:
                nivel = int(entrada.split()[1]) / 10
                ajustar_volume(nivel)
            except (ValueError, IndexError):
                print("Use: v [0-10]  →  ex: v 7")
        else:
            try:
                id_escolhido = int(entrada)
                tocar_musica(id_escolhido)
            except ValueError:
                print("Digite um número válido.")


# ─────────────────────────────────────────
# EXECUÇÃO DIRETA (teste rápido)
# ─────────────────────────────────────────

if __name__ == "__main__":
    criar_tabela_musicas()
    popular_musicas_exemplo()
    menu_musicas()