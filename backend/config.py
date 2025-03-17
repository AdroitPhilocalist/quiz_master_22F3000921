class Config():
    DEBUG=False
    SQL_ALCHEMY_TRACK_MODIFICATIONS=True

class LocalDevelopmentConfig(Config):
    SQLALCHEMY_DATABASE_URI="sqlite:///database.sqlite3"
    DEBUG=True
    SECURITY_PASSWORD_HASH='bcrypt'
    SECURITY_PASSWORD_SALT='secret'
    SECRET_KEY='key'
    SECURITY_TOKEN_AUTHENTICATION_HEADER='Authentication-Token'
    WTF_CSRF_ENABLED=False
    SECURITY_TOKEN_MAX_AGE=1800