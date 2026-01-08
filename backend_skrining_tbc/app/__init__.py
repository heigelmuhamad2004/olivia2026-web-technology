from flask import Flask
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager




# Inisialisasi aplikasi Flask, database, dan migrasi
app = Flask(__name__)
app.config.from_object(Config)
db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager (app)
print("Loaded DB URI:", app.config["SQLALCHEMY_DATABASE_URI"])
CORS(app)
from app.model import Provinsi, Kabupaten, Kecamatan, Pasien, Skrining, User, Rujukan, TokenBlocklist

from app.controller.auth_controller import auth_bp
app.register_blueprint (auth_bp, url_prefix='/auth')

from app import routes
from app.routes import *

from app.model.token_block_list import TokenBlocklist

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    token = TokenBlocklist.query.filter_by(jti=jti).first()
    return token is not None  # True = token sudah diblokir

