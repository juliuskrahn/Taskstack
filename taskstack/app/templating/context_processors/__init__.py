from flask import request
from flask_login import current_user
import urllib.parse
from app import app


@app.context_processor
def notifications_count():
    return dict(notifications_count=current_user.get_notifications_count())


@app.context_processor
def login_url():
    return dict(login_url="/login?continue=" + urllib.parse.quote(request.path, safe=""))


@app.context_processor
def signup_url():
    return dict(signup_url="/signup?continue=" + urllib.parse.quote(request.path, safe=""))
