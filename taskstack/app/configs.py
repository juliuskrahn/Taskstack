import utils.env_loader as env_loader
env = env_loader.load()


class _Base:
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    S3_STATIC_BUCKET_URL = "https://taskstack-static.s3.eu-central-1.amazonaws.com"
    SECRET_KEY = env.get("TASKSTACK_SECRET_KEY")
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SECURE = True


class Production(_Base):
    ENV = "production"
    S3_BUCKET_NAME = "taskstack"
    S3_BUCKET_URL = "https://taskstack.s3.eu-central-1.amazonaws.com"
    SQLALCHEMY_DATABASE_URI = env.get("TASKSTACK_DB_URI")


class Development(_Base):
    ENV = "development"
    S3_BUCKET_NAME = "taskstack-dev-env"
    S3_BUCKET_URL = "https://taskstack-dev-env.s3.eu-central-1.amazonaws.com"
    SQLALCHEMY_DATABASE_URI = env.get("TASKSTACK_DB_URI")
