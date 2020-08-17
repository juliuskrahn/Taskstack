from flask import redirect
from flask_login import logout_user
from app import app


@app.route("/logout", methods=["POST"])
def logout():
    logout_user()
    return redirect("/")
