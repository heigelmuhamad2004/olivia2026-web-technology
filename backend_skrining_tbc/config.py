import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config(object):
    # 1. Cek apakah ada DATABASE_URL (Otomatis dari Railway)
    database_url = os.environ.get("DATABASE_URL")
    
    if database_url:
        if database_url.startswith("mysql://"):
            database_url = database_url.replace("mysql://", "mysql+pymysql://", 1)
        
        SQLALCHEMY_DATABASE_URI = database_url
    
    # 2. Jika tidak ada DATABASE_URL (Berarti sedang di Laptop/Local)
    else:
        HOST = os.environ.get("DB_HOST", "localhost")
        DATABASE = os.environ.get("DB_DATABASE", "test_db")
        USERNAME = os.environ.get("DB_USERNAME", "root")
        PASSWORD = os.environ.get("DB_PASSWORD", "")
        
        SQLALCHEMY_DATABASE_URI = f'mysql+pymysql://{USERNAME}:{PASSWORD}@{HOST}/{DATABASE}'

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_RECORD_QUERIES = True

    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'you-will-never-guess-jwt'