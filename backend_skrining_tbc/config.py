import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config(object):
    # ==========================================
    # HARDCODE DATABASE UNTUK PRESENTASI
    # ==========================================
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:NpckuTUtCvaVBCdURtfymDnZFrjzeDqY@mysql.railway.internal:3306/railway'

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_RECORD_QUERIES = True

    SECRET_KEY = 'rahasia-presentasi-123'
    JWT_SECRET_KEY = 'rahasia-jwt-presentasi-123'
