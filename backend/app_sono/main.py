# main.py
# Ponto de entrada do app de bem-estar do sono

# ⚠️ IMPORTANTE: antes de rodar este arquivo, execute no TERMINAL:
# pip install stripe

from modulos.musicas import criar_tabela_musicas, popular_musicas_exemplo, menu_musicas
from modulos.sonhos import criar_tabela_sonhos, menu_sonhos
from modulos.sono import criar_tabela_sono, menu_sono
from modulos.vendas import criar_tabela_assinaturas, menu_vendas

# ─────────────────────────────────────────
# INICIALIZAÇÃO DO BANCO DE DADOS
# ─────────────────────────────────────────

def inicializar_banco():
    """Cria todas as tabelas necessárias ao abrir o app."""
    criar_tabela_musicas()
    criar_tabela_sonhos()
    criar_tabela_sono()
    criar_tabela_assinaturas()
    print("Banco de dados pronto.\n")


def popular_dados_iniciais():
    """Popula o banco com dados de exemplo na primeira execução."""
    popular_musicas_exemplo()


# ─────────────────────────────────────────
# MENU PRINCIPAL
# ─────────────────────────────────────────

def menu_principal():
    """Menu principal do app no terminal."""
    while True:
        print("\n" + "=" * 45)
        print("        BEM-ESTAR DO SONO")
        print("=" * 45)
        print("  1. Biblioteca de músicas")
        print("  2. Diário de sonhos")
        print("  3. Monitor de sono")
        print("  4. Loja")
        print("  0. Sair")
        print("=" * 45)

        escolha = input("\nEscolha uma opção: ").strip()

        if escolha == "1":
            menu_musicas()
        elif escolha == "2":
            menu_sonhos()
        elif escolha == "3":
            menu_sono()
        elif escolha == "4":
            menu_vendas()
        elif escolha == "0":
            print("\nAté logo! Boas noites. 🌙")
            break
        else:
            print("Opção inválida. Tente novamente.")


# ─────────────────────────────────────────
# EXECUÇÃO
# ─────────────────────────────────────────

if __name__ == "__main__":
    inicializar_banco()
    popular_dados_iniciais()
    menu_principal()