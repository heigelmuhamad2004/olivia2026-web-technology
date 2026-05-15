import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config(object):
    # Mengambil konfigurasi dari .env secara dinamis
    # Format: mysql+pymysql://user:password@host/dbname
    DB_USER = os.environ.get('DB_USERNAME')
    DB_PASS = os.environ.get('DB_PASSWORD') or ''
    DB_HOST = os.environ.get('DB_HOST')
    DB_NAME = os.environ.get('DB_DATABASE')
    
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_RECORD_QUERIES = True

    SECRET_KEY = os.environ.get('SECRET_KEY') or 'rahasia-presentasi-123'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'rahasia-jwt-presentasi-123'