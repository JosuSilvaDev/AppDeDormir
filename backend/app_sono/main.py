# ─────────────────────────────────────────────────────────────
#  main.py
#  PONTO DE ENTRADA DA API
#
#  Para rodar o servidor:
#  uvicorn main:app --reload
#
#  --reload → reinicia automaticamente ao salvar arquivos
#             (só usar em desenvolvimento, não em produção)
#
#  Depois de rodar, acesse no navegador:
#  http://localhost:8000        → resposta da API
#  http://localhost:8000/docs   → documentação interativa (SWAGGER)
#  http://localhost:8000/redoc  → documentação alternativa
# ─────────────────────────────────────────────────────────────

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importamos as funções do banco de dados
from database import init_db, popular_dados_iniciais

# ── Criação do app FastAPI ───────────────────────────────────
# O objeto "app" é o coração da API.
# Tudo que registramos nele (rotas, middlewares) faz parte da API.
app = FastAPI(
    title="SleepZen API",
    description="API do app de bem-estar do sono",
    version="1.0.0",
)


# ── CORS ────────────────────────────────────────────────────
# CORS = Cross-Origin Resource Sharing
#
# Por padrão, navegadores e apps bloqueiam requisições
# vindas de origens diferentes (ex: celular → servidor).
# O CORSMiddleware libera essas requisições.
#
# allow_origins=["*"] → permite qualquer origem
# Em produção, trocaríamos por origens específicas:
# allow_origins=["https://meuapp.com"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # qualquer origem pode chamar a API
    allow_credentials=True,
    allow_methods=["*"],       # GET, POST, PUT, DELETE...
    allow_headers=["*"],       # qualquer header
)


# ── Evento de startup ────────────────────────────────────────
# @app.on_event("startup") → executa ANTES do servidor
# começar a aceitar requisições.
# Perfeito para inicializar o banco de dados.
@app.on_event("startup")
def on_startup():
    """Executa ao iniciar o servidor."""
    print("\n🌙 Iniciando SleepZen API...")
    init_db()                  # cria as tabelas se não existirem
    popular_dados_iniciais()   # popula músicas de exemplo
    print("🚀 API pronta em http://localhost:8000\n")


# ── Rota raiz ────────────────────────────────────────────────
# GET / → retorna uma mensagem de boas-vindas
# É a primeira rota — útil para testar se a API está rodando
@app.get("/")
def root():
    """
    Rota de verificação — confirma que a API está online.

    Como testar:
    curl http://localhost:8000/
    ou acesse http://localhost:8000/ no navegador
    """
    return {
        "status": "online",
        "app": "SleepZen API",
        "versao": "1.0.0",
        "docs": "http://localhost:8000/docs",
        "mensagem": "🌙 Bem-vindo à API do SleepZen!"
    }


# ── Rota de saúde ────────────────────────────────────────────
# Padrão da indústria: /health retorna o status da API
# Usado por sistemas de monitoramento para saber se está vivo
@app.get("/health")
def health_check():
    """Verifica se a API está saudável."""
    return {"status": "healthy"}


# ── Inclusão dos módulos ─────────────────────────────────────
# Cada módulo tem suas próprias rotas.
# Vamos incluí-los nas próximas partes:
#
# from modulos.musicas import router as musicas_router
# from modulos.sonhos  import router as sonhos_router
# from modulos.sono    import router as sono_router
# from modulos.vendas  import router as vendas_router
#
# app.include_router(musicas_router, prefix="/musicas", tags=["Músicas"])
# app.include_router(sonhos_router,  prefix="/sonhos",  tags=["Sonhos"])
# app.include_router(sono_router,    prefix="/sono",    tags=["Sono"])
# app.include_router(vendas_router,  prefix="/vendas",  tags=["Vendas"])
#
# Por enquanto, essas linhas estão comentadas até criarmos os módulos.


# ── Execução direta ──────────────────────────────────────────
# Se rodar "python main.py" diretamente (sem uvicorn),
# isso inicia o servidor automaticamente.
# Mas o modo recomendado é: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)