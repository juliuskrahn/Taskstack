import utils.env_loader as env_loader
env = env_loader.load()


from flask import Flask

if env.get("FLASK_ENV") == "production":
    app = Flask("app", template_folder="templates_production")
    from app import configs
    app.config.from_object(configs.Production)

    socketio_kwargs = {
        "async_mode": "gevent",
        "message_queue": 'redis://redis:6379',
        "engineio_logger": True,
        "always_connect": False,
        "cookie": None,
        "cors_allowed_origins": "*"
    }

elif env.get("FLASK_ENV") == "development":
    app = Flask("app", template_folder="templates")
    from app import configs
    app.config.from_object(configs.Development)

    socketio_kwargs = {
        "async_mode": "gevent",
        "engineio_logger": True,
        "always_connect": False,
        "cookie": None,
        "cors_allowed_origins": "*"
    }

else:
    raise ValueError("Set the environment variable FLASK_ENV to: 'production' | 'development'")


from flask_socketio import SocketIO
socketio = SocketIO(app,
                    **socketio_kwargs)


from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy(app)

from app.db_models import *
db.create_all()
db.session.commit()


import boto3

s3_cli = boto3.client("s3",
                      aws_access_key_id=env["AWS_ACCESS_KEY_ID"],
                      aws_secret_access_key=env["AWS_SECRET_ACCESS_KEY"],
                      region_name=env["AWS_DEFAULT_REGION"])

ses_cli = boto3.client("ses",
                       aws_access_key_id=env["AWS_ACCESS_KEY_ID"],
                       aws_secret_access_key=env["AWS_SECRET_ACCESS_KEY"],
                       region_name=env["AWS_DEFAULT_REGION"])


from app.auth import login_manager
login_manager.init_app(app)
from app.auth import AnonymousUser
login_manager.anonymous_user = AnonymousUser


from flask_bcrypt import Bcrypt
bcrypt = Bcrypt(app)


from app.templating.context_processors import *

app.jinja_env.trim_blocks = True
app.jinja_env.lstrip_blocks = True


from flask import render_template
from app.templating.text import get_lexicon_and_lang_for_templating_context_wrapper
render_template = get_lexicon_and_lang_for_templating_context_wrapper(render_template)
# always import render_template func from app


from app.routes.commons import *
from app.routes.home import *
from app.routes.login import *
from app.routes.signup import *
from app.routes.verify_email import *
from app.routes.forgot_password import *
from app.routes.reset_password import *
from app.routes.user_profile import *
from app.routes.new_project import *
from app.routes.project import *
from app.routes.project_api import *
from app.routes.new_friend import *
from app.routes.invite import *
from app.routes.chat import *
from app.routes.chat_api import *
from app.routes.logout import *
from app.routes.search_api import *
from app.routes.error_handlers import *


from app.socketio_event_handlers.global_namespace import SocketIOGlobalNamespace,  SOCKET_IO_GLOBAL_NAMESPACE_NAME
socketio.on_namespace(SocketIOGlobalNamespace(SOCKET_IO_GLOBAL_NAMESPACE_NAME))

from app.socketio_event_handlers.project_namespace import SocketIOProjectNamespace, SOCKET_IO_PROJECT_NAMESPACE_NAME
socketio.on_namespace(SocketIOProjectNamespace(SOCKET_IO_PROJECT_NAMESPACE_NAME))
