# modulos/sono.py
# Módulo do monitor de sono — registra e exibe o tempo de sono do usuário

import os
from datetime import datetime, timedelta
from banco_de_dados import conectar


# ─────────────────────────────────────────
# BANCO DE DADOS
# ─────────────────────────────────────────

def criar_tabela_sono():
    """Cria a tabela de sono no banco se não existir."""
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sono (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            data         TEXT NOT NULL,
            hora_dormir  TEXT NOT NULL,
            hora_acordar TEXT NOT NULL,
            duracao_min  INTEGER NOT NULL,
            qualidade    INTEGER DEFAULT 3,
            criado_em    TEXT DEFAULT (datetime('now', 'localtime'))
        )
    """)
    conn.commit()
    conn.close()


def salvar_sono(data, hora_dormir, hora_acordar, duracao_min, qualidade):
    """Salva um registro de sono no banco."""
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO sono (data, hora_dormir, hora_acordar, duracao_min, qualidade)
        VALUES (?, ?, ?, ?, ?)
    """, (data, hora_dormir, hora_acordar, duracao_min, qualidade))
    conn.commit()
    id_inserido = cursor.lastrowid
    conn.close()
    return id_inserido


def buscar_sono_hoje():
    """Verifica se já existe registro de sono para hoje."""
    data_hoje = datetime.now().strftime("%Y-%m-%d")
    conn = conectar()
    conn.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sono WHERE data = ?", (data_hoje,))
    registro = cursor.fetchone()
    conn.close()
    return registro


def buscar_ultimos_dias(dias=7):
    """Retorna os registros de sono dos últimos N dias."""
    conn = conectar()
    conn.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM sono
        ORDER BY data DESC
        LIMIT ?
    """, (dias,))
    registros = cursor.fetchall()
    conn.close()
    return list(reversed(registros))


# ─────────────────────────────────────────
# CÁLCULOS
# ─────────────────────────────────────────

def calcular_duracao(hora_dormir, hora_acordar):
    """
    Calcula a duração do sono em minutos.
    Lida com o caso de dormir antes da meia-noite e acordar depois.

    Exemplo:
        calcular_duracao("23:00", "06:30") → 450 minutos (7h 30m)
    """
    fmt = "%H:%M"
    t_dormir  = datetime.strptime(hora_dormir,  fmt)
    t_acordar = datetime.strptime(hora_acordar, fmt)

    if t_acordar <= t_dormir:
        t_acordar += timedelta(days=1)

    duracao = int((t_acordar - t_dormir).total_seconds() / 60)
    return duracao


def formatar_duracao(minutos):
    """Converte minutos em formato legível. Ex: 450 → '7h 30m'"""
    h = minutos // 60
    m = minutos % 60
    return f"{h}h {m:02d}m"


def calcular_media(registros):
    """Calcula a média de sono em minutos a partir de uma lista de registros."""
    if not registros:
        return 0
    total = sum(r["duracao_min"] for r in registros)
    return total // len(registros)


def avaliar_sono(minutos):
    """
    Avalia a qualidade do sono com base na duração.
    Recomendação: 7 a 9 horas para adultos.
    """
    if minutos >= 480:      # 8h+
        return "Ótimo! Você dormiu o suficiente."
    elif minutos >= 420:    # 7h+
        return "Bom. Dentro do recomendado."
    elif minutos >= 360:    # 6h+
        return "Regular. Tente dormir um pouco mais."
    elif minutos >= 300:    # 5h+
        return "Ruim. Sono insuficiente."
    else:
        return "Muito pouco sono. Priorize seu descanso."


# ─────────────────────────────────────────
# INTERFACE DE TEXTO (terminal)
# ─────────────────────────────────────────

QUALIDADES = {
    "1": (1, "Péssima"),
    "2": (2, "Ruim"),
    "3": (3, "Regular"),
    "4": (4, "Boa"),
    "5": (5, "Ótima"),
}


def registrar_sono_hoje():
    """Fluxo completo para registrar o sono do dia."""
    data_hoje = datetime.now().strftime("%Y-%m-%d")

    # Verifica se já registrou hoje
    registro = buscar_sono_hoje()
    if registro:
        print(f"\nVocê já registrou o sono de hoje ({data_hoje}).")
        print(f"  Dormiu:   {registro['hora_dormir']}")
        print(f"  Acordou:  {registro['hora_acordar']}")
        print(f"  Duração:  {formatar_duracao(registro['duracao_min'])}")
        return

    print("\n" + "=" * 45)
    print("       REGISTRAR SONO DE HOJE")
    print("=" * 45)

    # Hora que dormiu
    while True:
        hora_dormir = input("Que horas você foi dormir? (HH:MM, ex: 23:00): ").strip()
        try:
            datetime.strptime(hora_dormir, "%H:%M")
            break
        except ValueError:
            print("Formato inválido. Use HH:MM")

    # Hora que acordou
    while True:
        hora_acordar = input("Que horas você acordou?   (HH:MM, ex: 06:30): ").strip()
        try:
            datetime.strptime(hora_acordar, "%H:%M")
            break
        except ValueError:
            print("Formato inválido. Use HH:MM")

    # Qualidade
    print("\nComo foi a qualidade do seu sono?")
    print("  1 - Péssima  2 - Ruim  3 - Regular  4 - Boa  5 - Ótima")
    while True:
        escolha = input("Qualidade (1-5): ").strip()
        if escolha in QUALIDADES:
            qualidade, label_qualidade = QUALIDADES[escolha]
            break
        print("Digite um número de 1 a 5.")

    # Calcula e salva
    duracao = calcular_duracao(hora_dormir, hora_acordar)
    salvar_sono(data_hoje, hora_dormir, hora_acordar, duracao, qualidade)

    print("\n" + "=" * 45)
    print(f"  Sono registrado para {data_hoje}")
    print(f"  Duração:   {formatar_duracao(duracao)}")
    print(f"  Qualidade: {label_qualidade}")
    print(f"  Avaliação: {avaliar_sono(duracao)}")
    print("=" * 45)


def exibir_historico():
    """Exibe o histórico dos últimos 7 dias com gráfico de barras no terminal."""
    registros = buscar_ultimos_dias(7)

    if not registros:
        print("\nNenhum registro de sono ainda.")
        return

    media = calcular_media(registros)

    print("\n" + "=" * 45)
    print("       HISTÓRICO DE SONO (7 dias)")
    print("=" * 45)

    # Gráfico de barras no terminal
    max_min = max(r["duracao_min"] for r in registros)
    largura = 20  # largura máxima da barra

    for r in registros:
        data     = r["data"][5:]                         # mostra MM-DD
        duracao  = formatar_duracao(r["duracao_min"])
        barras   = int((r["duracao_min"] / max_min) * largura) if max_min else 0
        barra    = "█" * barras + "░" * (largura - barras)
        qual     = "★" * r["qualidade"] + "☆" * (5 - r["qualidade"])

        print(f"  {data}  {barra}  {duracao}  {qual}")

    print(f"\n  Média: {formatar_duracao(media)}  |  {avaliar_sono(media)}")
    print("=" * 45)


def menu_sono():
    """Menu interativo do monitor de sono."""
    while True:
        print("\n" + "=" * 45)
        print("        MONITOR DE SONO")
        print("=" * 45)
        print("  1. Registrar sono de hoje")
        print("  2. Ver histórico (7 dias)")
        print("  0. Voltar")
        print("=" * 45)

        escolha = input("\nEscolha: ").strip()

        if escolha == "1":
            registrar_sono_hoje()
        elif escolha == "2":
            exibir_historico()
        elif escolha == "0":
            break
        else:
            print("Opção inválida.")


# ─────────────────────────────────────────
# EXECUÇÃO DIRETA (teste rápido)
# ─────────────────────────────────────────

if __name__ == "__main__":
    criar_tabela_sono()
    menu_sono()