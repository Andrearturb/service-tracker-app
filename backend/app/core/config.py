"""
Configurações principais da aplicação.
"""

import os

APP_NAME = "Service Tracker API"
APP_VERSION = "0.1.0"

DATABASE_URL = os.environ["DATABASE_URL"]
API_KEY = os.environ["API_KEY"]