from flask import request, redirect
from flask_login import login_user, current_user
from datetime import timedelta
import urllib.parse
from app import app, db, bcrypt, render_template
from app.db_models import User


@app.route("/login",  methods=["GET", "POST"])
def login():

    post_to = request.path

    forgot_password_link = "/forgot-password"

    url_query_str = ""

    continue_to = request.args.get("continue")
    if continue_to:
        url_query_str = "?continue=" + urllib.parse.quote(continue_to, safe="")
        post_to += url_query_str
        forgot_password_link += url_query_str

    # -- POST
    if request.method == "POST":
        form = request.form

        user = User.get_by_name_or_email(form["username"])
        if user:
            if bcrypt.check_password_hash(user.password_hash, form["password"]):
                if form.get("keepUserLoggedIn") or user.stay_logged_in:
                    login_user(user, True, timedelta(days=365))
                    if not user.stay_logged_in:
                        user.stay_logged_in = True
                        db.session.commit()
                else:
                    login_user(user)

                continue_to = request.args.get("continue")

                if user.email_pending_verification is not None:
                    return redirect(f"/verify-email/{user.email_verification_case_id}{url_query_str}")

                if continue_to:
                    return redirect(continue_to)
                return redirect("/")

        return render_template("login.html.j2",
                               post_to=post_to,
                               forgot_password_link=f"/forgot-password{url_query_str}",
                               username=form["username"],
                               invalidLogin=True)

    # -- GET
    if current_user.is_authenticated():
        return redirect("/")

    return render_template("login.html.j2", post_to=post_to, forgot_password_link=f"/forgot-password{url_query_str}")
