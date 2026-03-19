"""
Configurações principais da aplicação.

Este módulo centraliza variáveis de configuração utilizadas pelo sistema,
como informações da aplicação, conexão com o banco de dados e credenciais
administrativas simples do MVP.
"""

APP_NAME = "Service Tracker API"
APP_VERSION = "0.1.0"
DATABASE_URL = "sqlite:///./services.db"

# Senha usada para acessar a área administrativa
API_KEY = "minha-chave-secreta"  # Em produção, use uma variável de ambiente ou um gerenciador de segredos
