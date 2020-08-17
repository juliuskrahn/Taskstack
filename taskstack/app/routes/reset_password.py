from flask import abort, request, redirect
from flask_login import login_user
import urllib.parse
from app import app, bcrypt, db, render_template
from app.db_models import User


@app.route("/reset-password/<reset_password_case_id>", methods=["GET", "POST"])
def reset_password(reset_password_case_id):
    user = User.query.filter_by(reset_password_case_id=reset_password_case_id).first()
    if not user:
        abort(404)

    continue_to = request.args.get("continue")
    url_query_str = "?"
    if continue_to:
        url_query_str += "continue=" + urllib.parse.quote(continue_to, safe="")

    code = request.args.get("code")
    if not code:
        code = ""

    # -- POST
    if request.method == "POST":
        form = request.form

        if not bcrypt.check_password_hash(user.reset_password_code_hash, form["code"]):
            return render_template("reset_password.html.j2", post_to=request.path + url_query_str, wrong_code=True)

        if not 8 <= len(form["password"]) <= 64:
            return render_template("reset_password.html.j2",
                                   post_to=request.path + url_query_str,
                                   invalid_password=True)

        user.password_hash = bcrypt.generate_password_hash(form["password"]).decode("utf-8")
        user.reset_password_code_hash = None
        user.reset_password_case_id = None
        db.session.commit()

        login_user(user)

        if continue_to:
            return redirect(continue_to)
        return redirect("/")

    # -- GET
    return render_template("reset_password.html.j2",
                           post_to=request.path + url_query_str,
                           code=code)
