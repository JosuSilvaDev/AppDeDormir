# modulos/vendas.py
# Módulo de vendas — planos e pacotes com integração Stripe

import os
from datetime import datetime, timedelta
from banco_de_dados import conectar

# Instale com: pip install stripe
# Documentação: https://stripe.com/docs/api
try:
    import stripe
    STRIPE_DISPONIVEL = True
except ImportError:
    STRIPE_DISPONIVEL = False
    print("stripe não instalado. Rode: pip install stripe")


# ─────────────────────────────────────────
# CONFIGURAÇÃO DO STRIPE
# ─────────────────────────────────────────
# Obtenha suas chaves em: https://dashboard.stripe.com/apikeys
# Configure no terminal antes de rodar:
#   Windows:   set STRIPE_SECRET_KEY=sk_test_sua_chave_aqui
#   Mac/Linux: export STRIPE_SECRET_KEY=sk_test_sua_chave_aqui

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")

if STRIPE_DISPONIVEL and STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY


# ─────────────────────────────────────────
# PLANOS E PACOTES
# ─────────────────────────────────────────

PLANOS = {
    "gratuito": {
        "nome":        "Gratuito",
        "preco_mensal": 0,
        "preco_anual":  0,
        "limite_musicas":       5,   # músicas por gênero
        "limite_interpretacoes": 3,  # por mês
        "historico_completo":   False,
        "sem_anuncios":         False,
    },
    "pro": {
        "nome":         "Pro",
        "preco_mensal":  1990,   # centavos (R$ 19,90)
        "preco_anual":  16680,   # centavos (R$ 166,80 = 13,90/mês)
        "limite_musicas":        -1,  # ilimitado
        "limite_interpretacoes": -1,  # ilimitado
        "historico_completo":   True,
        "sem_anuncios":         True,
    },
}

PACOTES = {
    "musicas_premium": {
        "nome":      "Pacote músicas premium",
        "descricao": "+50 faixas exclusivas por gênero",
        "preco":     990,   # centavos (R$ 9,90)
        "tipo":      "musicas",
        "quantidade": 50,
    },
    "interpretacoes_10": {
        "nome":      "Interpretações semanais",
        "descricao": "10 interpretações por IA",
        "preco":     790,   # centavos (R$ 7,90)
        "tipo":      "interpretacoes",
        "quantidade": 10,
    },
    "pacote_completo": {
        "nome":      "Pacote completo",
        "descricao": "Músicas premium + 20 interpretações",
        "preco":     1490,  # centavos (R$ 14,90)
        "tipo":      "completo",
        "quantidade": 20,
    },
}


# ─────────────────────────────────────────
# BANCO DE DADOS
# ─────────────────────────────────────────

def criar_tabela_assinaturas():
    """Cria as tabelas de assinaturas e créditos no banco."""
    conn = conectar()
    cursor = conn.cursor()

    # Tabela de assinaturas
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS assinaturas (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id        INTEGER DEFAULT 1,
            plano             TEXT    NOT NULL DEFAULT 'gratuito',
            ciclo             TEXT    DEFAULT 'mensal',
            status            TEXT    DEFAULT 'ativo',
            stripe_customer_id TEXT,
            stripe_sub_id     TEXT,
            inicio            TEXT,
            fim               TEXT,
            criado_em         TEXT DEFAULT (datetime('now', 'localtime'))
        )
    """)

    # Tabela de créditos (pacotes avulsos)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS creditos (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id    INTEGER DEFAULT 1,
            tipo          TEXT    NOT NULL,
            quantidade    INTEGER NOT NULL,
            usado         INTEGER DEFAULT 0,
            stripe_payment_id TEXT,
            criado_em     TEXT DEFAULT (datetime('now', 'localtime'))
        )
    """)

    # Tabela de pagamentos (histórico)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pagamentos (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id        INTEGER DEFAULT 1,
            tipo              TEXT    NOT NULL,
            descricao         TEXT,
            valor_centavos    INTEGER NOT NULL,
            status            TEXT    DEFAULT 'pendente',
            stripe_payment_id TEXT,
            criado_em         TEXT DEFAULT (datetime('now', 'localtime'))
        )
    """)

    conn.commit()
    conn.close()
    print("Tabelas de vendas criadas.")


def salvar_assinatura(plano, ciclo, stripe_customer_id=None, stripe_sub_id=None):
    """Salva ou atualiza a assinatura do usuário."""
    conn = conectar()
    cursor = conn.cursor()

    inicio = datetime.now().strftime("%Y-%m-%d")
    if ciclo == "anual":
        fim = (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d")
    else:
        fim = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")

    # Cancela assinatura anterior
    cursor.execute("UPDATE assinaturas SET status = 'cancelado' WHERE usuario_id = 1")

    cursor.execute("""
        INSERT INTO assinaturas
            (usuario_id, plano, ciclo, status, stripe_customer_id, stripe_sub_id, inicio, fim)
        VALUES (1, ?, ?, 'ativo', ?, ?, ?, ?)
    """, (plano, ciclo, stripe_customer_id, stripe_sub_id, inicio, fim))

    conn.commit()
    conn.close()


def buscar_assinatura_ativa():
    """Retorna a assinatura ativa do usuário."""
    conn = conectar()
    conn.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM assinaturas
        WHERE usuario_id = 1 AND status = 'ativo'
        ORDER BY criado_em DESC LIMIT 1
    """)
    resultado = cursor.fetchone()
    conn.close()
    return resultado


def adicionar_creditos(tipo, quantidade, stripe_payment_id=None):
    """Adiciona créditos avulsos ao usuário após pagamento."""
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO creditos (usuario_id, tipo, quantidade, stripe_payment_id)
        VALUES (1, ?, ?, ?)
    """, (tipo, quantidade, stripe_payment_id))
    conn.commit()
    conn.close()


def buscar_creditos_disponiveis(tipo):
    """Retorna a quantidade de créditos disponíveis de um tipo."""
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COALESCE(SUM(quantidade - usado), 0)
        FROM creditos
        WHERE usuario_id = 1 AND tipo = ? AND quantidade > usado
    """, (tipo,))
    total = cursor.fetchone()[0]
    conn.close()
    return total


def usar_credito(tipo):
    """
    Consome um crédito do tipo informado.
    Retorna True se tinha crédito, False se não tinha.
    """
    conn = conectar()
    conn.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, quantidade, usado FROM creditos
        WHERE usuario_id = 1 AND tipo = ? AND quantidade > usado
        ORDER BY criado_em ASC LIMIT 1
    """, (tipo,))
    credito = cursor.fetchone()

    if not credito:
        conn.close()
        return False

    cursor.execute(
        "UPDATE creditos SET usado = usado + 1 WHERE id = ?",
        (credito["id"],)
    )
    conn.commit()
    conn.close()
    return True


# ─────────────────────────────────────────
# VERIFICAÇÃO DE ACESSO
# ─────────────────────────────────────────

def verificar_acesso(funcionalidade):
    """
    Verifica se o usuário tem acesso a uma funcionalidade.
    funcionalidade: 'musicas', 'interpretacao', 'historico'
    Retorna: (tem_acesso: bool, motivo: str)
    """
    assinatura = buscar_assinatura_ativa()
    plano_nome = assinatura["plano"] if assinatura else "gratuito"
    plano = PLANOS.get(plano_nome, PLANOS["gratuito"])

    if funcionalidade == "musicas":
        if plano["limite_musicas"] == -1:
            return True, "Pro"
        creditos = buscar_creditos_disponiveis("musicas")
        if creditos > 0:
            return True, "crédito"
        return False, f"Limite do plano gratuito atingido."

    if funcionalidade == "interpretacao":
        if plano["limite_interpretacoes"] == -1:
            return True, "Pro"
        creditos = buscar_creditos_disponiveis("interpretacoes")
        if creditos > 0:
            usar_credito("interpretacoes")
            return True, "crédito"
        return False, "Sem créditos de interpretação."

    if funcionalidade == "historico":
        if plano["historico_completo"]:
            return True, "Pro"
        return False, "Histórico completo disponível no plano Pro."

    return True, "ok"


# ─────────────────────────────────────────
# INTEGRAÇÃO STRIPE
# ─────────────────────────────────────────

def criar_link_assinatura(plano, ciclo, email_usuario):
    """
    Cria um link de pagamento do Stripe para assinatura.
    Retorna a URL para redirecionar o usuário.

    Para usar em produção, configure os Price IDs no Stripe Dashboard:
    https://dashboard.stripe.com/products
    """
    if not STRIPE_DISPONIVEL or not STRIPE_SECRET_KEY:
        print("Stripe não configurado. Configure STRIPE_SECRET_KEY.")
        return None

    # IDs dos preços criados no Stripe Dashboard
    # Substitua pelos seus Price IDs reais
    PRICE_IDS = {
        ("pro", "mensal"): "price_pro_mensal_id_aqui",
        ("pro", "anual"):  "price_pro_anual_id_aqui",
    }

    price_id = PRICE_IDS.get((plano, ciclo))
    if not price_id:
        print(f"Plano {plano}/{ciclo} não configurado.")
        return None

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            customer_email=email_usuario,
            line_items=[{"price": price_id, "quantity": 1}],
            success_url="http://localhost:8000/sucesso?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="http://localhost:8000/cancelado",
        )
        return session.url

    except Exception as e:
        print(f"Erro ao criar sessão Stripe: {e}")
        return None


def criar_link_pacote(chave_pacote, email_usuario):
    """
    Cria um link de pagamento do Stripe para pacote avulso.
    Retorna a URL para redirecionar o usuário.
    """
    if not STRIPE_DISPONIVEL or not STRIPE_SECRET_KEY:
        print("Stripe não configurado.")
        return None

    pacote = PACOTES.get(chave_pacote)
    if not pacote:
        print(f"Pacote '{chave_pacote}' não encontrado.")
        return None

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            customer_email=email_usuario,
            line_items=[{
                "price_data": {
                    "currency": "brl",
                    "unit_amount": pacote["preco"],
                    "product_data": {
                        "name": pacote["nome"],
                        "description": pacote["descricao"],
                    },
                },
                "quantity": 1,
            }],
            success_url="http://localhost:8000/sucesso?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="http://localhost:8000/cancelado",
            metadata={"pacote": chave_pacote},
        )
        return session.url

    except Exception as e:
        print(f"Erro ao criar sessão Stripe: {e}")
        return None


# ─────────────────────────────────────────
# INTERFACE DE TEXTO (terminal)
# ─────────────────────────────────────────

def formatar_preco(centavos):
    """Converte centavos em reais formatado. Ex: 1990 → R$ 19,90"""
    return f"R$ {centavos // 100},{centavos % 100:02d}"


def mostrar_planos():
    """Exibe os planos disponíveis no terminal."""
    assinatura = buscar_assinatura_ativa()
    plano_atual = assinatura["plano"] if assinatura else "gratuito"

    print("\n" + "=" * 45)
    print("        PLANOS DISPONÍVEIS")
    print("=" * 45)

    for chave, p in PLANOS.items():
        atual = " ← ATUAL" if chave == plano_atual else ""
        print(f"\n  [{p['nome'].upper()}]{atual}")
        if p["preco_mensal"] == 0:
            print(f"  Preço: Gratuito")
        else:
            print(f"  Mensal: {formatar_preco(p['preco_mensal'])}/mês")
            print(f"  Anual:  {formatar_preco(p['preco_anual'] // 12)}/mês (cobrado anualmente)")

        musicas = "Ilimitadas" if p["limite_musicas"] == -1 else f"{p['limite_musicas']} por gênero"
        interp  = "Ilimitadas" if p["limite_interpretacoes"] == -1 else f"{p['limite_interpretacoes']} por mês"
        print(f"  Músicas: {musicas}")
        print(f"  Interpretações: {interp}")
        print(f"  Histórico completo: {'Sim' if p['historico_completo'] else 'Não'}")

    print("\n" + "=" * 45)


def mostrar_pacotes():
    """Exibe os pacotes avulsos no terminal."""
    print("\n" + "=" * 45)
    print("        PACOTES AVULSOS")
    print("=" * 45)

    for i, (chave, p) in enumerate(PACOTES.items(), 1):
        creditos = buscar_creditos_disponiveis(p["tipo"])
        print(f"\n  {i}. {p['nome']}")
        print(f"     {p['descricao']}")
        print(f"     Preço: {formatar_preco(p['preco'])} (pagamento único)")
        if creditos > 0:
            print(f"     Créditos disponíveis: {creditos}")

    print("\n" + "=" * 45)


def menu_vendas():
    """Menu interativo de vendas."""
    while True:
        assinatura = buscar_assinatura_ativa()
        plano_atual = assinatura["plano"] if assinatura else "gratuito"
        creditos_interp = buscar_creditos_disponiveis("interpretacoes")
        creditos_musicas = buscar_creditos_disponiveis("musicas")

        print("\n" + "=" * 45)
        print("        LOJA")
        print("=" * 45)
        print(f"  Plano atual: {plano_atual.upper()}")
        print(f"  Créditos interpretação: {creditos_interp}")
        print(f"  Créditos músicas: {creditos_musicas}")
        print("=" * 45)
        print("  1. Ver planos")
        print("  2. Assinar Pro (mensal)")
        print("  3. Assinar Pro (anual)")
        print("  4. Ver pacotes avulsos")
        print("  5. Comprar pacote")
        print("  0. Voltar")
        print("=" * 45)

        escolha = input("\nEscolha: ").strip()

        if escolha == "1":
            mostrar_planos()

        elif escolha in ("2", "3"):
            ciclo = "mensal" if escolha == "2" else "anual"
            email = input("Seu e-mail: ").strip()
            url = criar_link_assinatura("pro", ciclo, email)
            if url:
                print(f"\nAcesse o link para pagar:\n{url}")
            else:
                # Simulação sem Stripe configurado
                print("\n[SIMULAÇÃO] Stripe não configurado.")
                print("Assinatura Pro ativada localmente para teste.")
                salvar_assinatura("pro", ciclo)

        elif escolha == "4":
            mostrar_pacotes()

        elif escolha == "5":
            mostrar_pacotes()
            chaves = list(PACOTES.keys())
            try:
                num = int(input("Número do pacote: ").strip()) - 1
                chave = chaves[num]
                email = input("Seu e-mail: ").strip()
                url = criar_link_pacote(chave, email)
                if url:
                    print(f"\nAcesse o link para pagar:\n{url}")
                else:
                    # Simulação sem Stripe
                    pacote = PACOTES[chave]
                    print("\n[SIMULAÇÃO] Stripe não configurado.")
                    print(f"Adicionando {pacote['quantidade']} créditos de '{pacote['tipo']}'.")
                    adicionar_creditos(pacote["tipo"], pacote["quantidade"])
                    print("Créditos adicionados com sucesso!")
            except (ValueError, IndexError):
                print("Opção inválida.")

        elif escolha == "0":
            break
        else:
            print("Opção inválida.")


# ─────────────────────────────────────────
# EXECUÇÃO DIRETA (teste rápido)
# ─────────────────────────────────────────

if __name__ == "__main__":
    criar_tabela_assinaturas()
    menu_vendas()