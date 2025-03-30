class Config():
    DEBUG=False
    SQL_ALCHEMY_TRACK_MODIFICATIONS=True
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_URL = 'redis://localhost:6379/0'
    CACHE_DEFAULT_TIMEOUT = 300

class LocalDevelopmentConfig(Config):
    SQLALCHEMY_DATABASE_URI="sqlite:///database.sqlite3"
    DEBUG=True
    SECURITY_PASSWORD_HASH='bcrypt'
    SECURITY_PASSWORD_SALT='secret'
    SECRET_KEY='key'
    SECURITY_TOKEN_AUTHENTICATION_HEADER='Authentication-Token'
    WTF_CSRF_ENABLED=False
    SECURITY_TOKEN_MAX_AGE=1800

    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = 'sahapiyush5@gmail.com'  
    MAIL_PASSWORD = 'fhju cfeb axqd wqsl'   
    MAIL_DEFAULT_SENDER = 'Quiz-Master <sahapiyush5@gmail.com>'

    # Celery configuration - using consistent naming
    BROKER_URL = 'redis://localhost:6379/0'
    RESULT_BACKEND = 'redis://localhost:6379/0'
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_URL = 'redis://localhost:6379/0'
    CACHE_DEFAULT_TIMEOUT = 300