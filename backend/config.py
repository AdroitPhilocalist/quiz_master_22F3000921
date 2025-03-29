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

# Redis and Celery configurations
REDIS_URL = 'redis://localhost:6379/0'
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'

# Cache configurations
CACHE_TYPE = 'RedisCache'
CACHE_REDIS_URL = REDIS_URL
CACHE_DEFAULT_TIMEOUT = 300  # 5 minutes default cache timeout