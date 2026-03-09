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
ADMIN_PASSWORD = "admin123"
# Token simples retornado após login administrativo
# Em uma versão futura, isso pode virar JWT ou outro mecanismo mais robusto.
ADMIN_TOKEN = "service-tracker-admin-token"
