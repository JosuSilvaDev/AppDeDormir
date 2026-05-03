
# modulos/sonhos.py
# Módulo do diário de sonhos com interpretação por IA (Claude API)
 
import sqlite3
import os
from datetime import datetime
 
# Instale com: pip install anthropic
try:
    import anthropic
    CLAUDE_DISPONIVEL = True
except ImportError:
    CLAUDE_DISPONIVEL = False
    print("anthropic não instalado. Rode: pip install anthropic")
 
CAMINHO_BANCO = "dados/sono.db"

# ─────────────────────────────────────────
# BANCO DE DADOS
# ─────────────────────────────────────────

def criar_tabela_sonhos():
    """Cria a tabela de sonhos no banco se não existir."""
    os.makedirs("dados", exist_ok=True)
    conn = sqlite3.connect(CAMINHO_BANCO)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sonhos (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            data          TEXT NOT NULL,
            descricao     TEXT NOT NULL,
            emocao        TEXT,
            interpretacao TEXT,
            criado_em     TEXT DEFAULT (datetime('now', 'localtime'))
        )
    """)
    conn.commit()
    conn.close()


def salvar_sonho(data, descricao, emocao, interpretacao):
    """Salva um sonho no banco de dados."""
    conn = sqlite3.connect(CAMINHO_BANCO)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO sonhos (data, descricao, emocao, interpretacao)
        VALUES (?, ?, ?, ?)
    """, (data, descricao, emocao, interpretacao))
    conn.commit()
    id_inserido = cursor.lastrowid
    conn.close()
    return id_inserido


def listar_sonhos():
    """Retorna todos os sonhos salvos, do mais recente ao mais antigo."""
    conn = sqlite3.connect(CAMINHO_BANCO)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sonhos ORDER BY criado_em DESC")
    sonhos = [dict(linha) for linha in cursor.fetchall()]
    conn.close()
    return sonhos


def buscar_sonho_por_data(data):
    """Busca sonhos de uma data específica (formato: AAAA-MM-DD)."""
    conn = sqlite3.connect(CAMINHO_BANCO)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sonhos WHERE data = ?", (data,))
    sonhos = [dict(linha) for linha in cursor.fetchall()]
    conn.close()
    return sonhos


# ─────────────────────────────────────────
# SÍMBOLOS (dicionário local)
# ─────────────────────────────────────────

symbols = {
    "água":        "O mundo emocional em movimento — sentimentos profundos, intuição e adaptação ao fluxo da vida",
    "chuva":       "Purificação da alma — liberação emocional, cura e recomeços silenciosos",
    "floresta":    "O território do inconsciente — mistério, autodescoberta e confronto com o desconhecido interior",
    "escuro":      "Sombras internas — medos ocultos, dúvidas e partes não exploradas de si mesmo",
    "voar":        "Expansão da consciência — liberdade, superação de limites ou desejo de transcender a realidade",
    "queda":       "Perda de controle — insegurança, medo do fracasso ou desconexão com a própria base",
    "correr":      "Movimento de fuga ou busca — tentativa de escapar de algo ou alcançar um objetivo interno",
    "casa":        "O templo do eu — identidade, mente e estrutura emocional do sonhador",
    "mar":         "O inconsciente infinito — profundidade emocional, mistério e conexão com o todo",
    "figura":      "A sombra interior — aspectos reprimidos ou desconhecidos da própria personalidade",
    "criança":     "O eu essencial — pureza, vulnerabilidade e memórias do passado",
    "perseguição": "Conflito interno ativo — ansiedade, pressão ou algo que exige enfrentamento",
    "morte":       "Transformação inevitável — fim de ciclos, renascimento e evolução pessoal",
    "fogo":        "Energia intensa — paixão, destruição criativa ou força de transformação",
    "cobra":       "Sabedoria oculta — renovação, perigo sutil ou despertar espiritual",
    "espelho":     "Reflexo da verdade — autoconhecimento, ilusões ou confronto com quem, você é" ,
    "lua":        "O inconsciente feminino — ciclos emocionais, intuição e mistérios ocultos",
    "sol":        "Consciência e vitalidade — clareza, energia e identidade verdadeira",
    "sangue":     "Força vital — energia, laços profundos ou sacrifício emocional",
    "porta":      "Transição — oportunidades, escolhas e novos caminhos se abrindo",
    "chave":      "Revelação — solução de problemas ou acesso a algo oculto",
    "escada":     "Ascensão ou queda — progresso espiritual, crescimento ou desafio",
    "vento":      "Mudanças invisíveis — forças externas influenciando sua vida",
    "olhos":      "Percepção — vigilância, intuição ou sensação de julgamento",
    "estrada":    "Jornada da vida — decisões, direção e propósito",
    "relógio":    "Tempo e pressão — urgência, ciclos e consciência da mortalidade"}



def detectar_simbolos(texto):
    """
    Detecta símbolos conhecidos no texto do sonho.
    Retorna lista de dicionários com símbolo e significado.
    """
    encontrados = []
    texto_lower = texto.lower()
    for simbolo, significado in symbols.items():
        if simbolo in texto_lower:
            encontrados.append({
                "simbolo": simbolo,
                "significado": significado
            })
    return encontrados
 


# ─────────────────────────────────────────
# INTERPRETAÇÃO COM IA (Claude API)
# ─────────────────────────────────────────

def interpretar_com_ia(descricao, emocao, simbolos_detectados):
    """
    Envia o sonho para a API do Claude e retorna a interpretação.
    Requer a variável de ambiente ANTHROPIC_API_KEY configurada.

    Como configurar a chave:
        Windows:  set ANTHROPIC_API_KEY=sua-chave-aqui
        Mac/Linux: export ANTHROPIC_API_KEY=sua-chave-aqui

    Obtenha sua chave em: https://console.anthropic.com
    """
    if not CLAUDE_DISPONIVEL:
        return interpretar_sem_ia(simbolos_detectados)

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Chave da API não encontrada. Usando interpretação local.")
        return interpretar_sem_ia(simbolos_detectados)

    simbolos_texto = ""
    if simbolos_detectados:
        simbolos_texto = "\n".join([
            f"- {s['simbolo']}: {s['significado']}"
            for s in simbolos_detectados
        ])
    else:
        simbolos_texto = "Nenhum símbolo específico detectado."

    prompt = f"""Você é um oráculo de sonhos que combina psicologia junguiana e sabedoria espiritual.

Sonho relatado:
"{descricao}"

Emoção sentida durante o sonho: {emocao}

Símbolos identificados:
{simbolos_texto}

Faça uma interpretação dividida em 3 partes curtas e objetivas:

1. PSICOLOGIA: O que este sonho revela sobre o estado emocional e psicológico do sonhador?
2. ESPIRITUAL: Qual o significado espiritual ou simbólico mais profundo?
3. CONSELHO: Qual ação prática ou reflexão o sonhador deveria considerar hoje?

Seja direto, acolhedor e use no máximo 3 frases por seção."""

    try:
        client = anthropic.Anthropic(api_key=api_key)
        mensagem = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=600,
            messages=[{"role": "user", "content": prompt}]
        )
        return mensagem.content[0].text

    except Exception as e:
        print(f"Erro na API: {e}")
        return interpretar_sem_ia(simbolos_detectados)


def interpretar_sem_ia(simbolos_detectados):
    """
    Interpretação local simples, usada quando a API não está disponível.
    """
    if not simbolos_detectados:
        psico = "como um psicólogo analítico (Carl Jung)"
        espi  = "como um guia espiritual e simbólico"
        cons  = "resposta curta, impactante e emocional"
    else:
        principais = ", ".join([s["simbolo"] for s in simbolos_detectados[:3]])
        psico = f"Os símbolos '{principais}' sugerem que sua mente está processando aspectos emocionais importantes."
        espi  = "Esses símbolos indicam um chamado para olhar para dentro e reconhecer aspectos ocultos de si mesmo."
        cons  = "Escreva sobre o que está evitando enfrentar. A clareza vem da reflexão honesta."

    return f"1. PSICOLOGIA: {psico}\n\n2. ESPIRITUAL: {espi}\n\n3. CONSELHO: {cons}"


# ─────────────────────────────────────────
# INTERFACE DE TEXTO (terminal)
# ─────────────────────────────────────────

def registrar_sonho_hoje():
    """Fluxo completo para registrar e interpretar o sonho do dia."""
    data_hoje = datetime.now().strftime("%Y-%m-%d")

    # Verifica se já registrou hoje
    sonhos_hoje = buscar_sonho_por_data(data_hoje)
    if sonhos_hoje:
        print(f"\nVocê já registrou um sonho hoje ({data_hoje}).")
        ver = input("Quer ver a interpretação anterior? (s/n): ").strip().lower()
        if ver == "s":
            exibir_interpretacao(sonhos_hoje[0])
        return

    print("\n" + "=" * 45)
    print("     BOM DIA! O QUE VOCÊ SONHOU?")
    print("=" * 45)
    print("Descreva seu sonho com detalhes:")
    descricao = input("> ").strip()

    if not descricao:
        print("Nenhum sonho registrado.")
        return

    print("\nComo você se sentiu durante o sonho?")
    print("(Ex: ansioso, feliz, assustado, tranquilo, confuso , triste , romatico)")
    emocao = input("> ").strip() or "não informado"

    print("\nAnalisando símbolos...")
    simbolos = detectar_simbolos(descricao)

    if simbolos:
        print(f"\n{len(simbolos)} símbolo(s) encontrado(s):")
        for s in simbolos:
            print(f"  - {s['simbolo']}: {s['significado']}")
    else:
        print("Nenhum símbolo específico detectado.")

    print("\nConsultando o oráculo...")
    interpretacao = interpretar_com_ia(descricao, emocao, simbolos)

    id_sonho = salvar_sonho(data_hoje, descricao, emocao, interpretacao)
    print(f"\nSonho salvo (ID: {id_sonho})")

    print("\n" + "=" * 45)
    print("         INTERPRETAÇÃO DO ORÁCULO")
    print("=" * 45)
    print(interpretacao)
    print("=" * 45)


def exibir_interpretacao(sonho):
    """Exibe a interpretação de um sonho salvo."""
    print("\n" + "=" * 45)
    print(f"Data: {sonho['data']}  |  Emoção: {sonho['emocao']}")
    print("=" * 45)
    print(f"Sonho: {sonho['descricao']}")
    print("\nInterpretação:")
    print(sonho["interpretacao"])
    print("=" * 45)


def historico_sonhos():
    """Exibe o histórico de sonhos registrados."""
    sonhos = listar_sonhos()

    if not sonhos:
        print("\nNenhum sonho registrado ainda.")
        return

    print(f"\n{'='*45}")
    print(f"  HISTÓRICO DE SONHOS ({len(sonhos)} registros)")
    print(f"{'='*45}")

    for s in sonhos:
        print(f"\n[{s['data']}] Emoção: {s['emocao']}")
        print(f"  {s['descricao'][:80]}{'...' if len(s['descricao']) > 80 else ''}")

    print(f"\n{'='*45}")
    ver = input("Ver interpretação de algum? Digite o número da data ou Enter para voltar: ").strip()
    if ver:
        sonho = next((s for s in sonhos if s["data"] == ver), None)
        if sonho:
            exibir_interpretacao(sonho)
        else:
            print("Data não encontrada.")


def menu_sonhos():
    """Menu interativo do diário de sonhos."""
    while True:
        print("\n" + "=" * 45)
        print("        DIÁRIO DE SONHOS")
        print("=" * 45)
        print("  1. Registrar sonho de hoje")
        print("  2. Ver histórico")
        print("  0. Voltar")
        print("=" * 45)

        escolha = input("\nEscolha: ").strip()

        if escolha == "1":
            registrar_sonho_hoje()
        elif escolha == "2":
            historico_sonhos()
        elif escolha == "0":
            break
        else:
            print("Opção inválida.")


# ─────────────────────────────────────────
# EXECUÇÃO DIRETA (teste rápido)
# ─────────────────────────────────────────

if __name__ == "__main__":
    criar_tabela_sonhos()
    menu_sonhos()