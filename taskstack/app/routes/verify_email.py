from flask import request, abort, redirect
import urllib.parse
from app import app, db, render_template
from app.db_models import User


@app.route("/verify-email/<email_verification_case_id>", methods=["GET", "POST"])
def verify_email(email_verification_case_id):
    user = User.query.filter_by(email_verification_case_id=email_verification_case_id).first()
    if not user:
        abort(404)

    continue_to = request.args.get("continue")

    code = request.args.get("code")
    if not code:
        code = ""

    # -- POST
    if request.method == "POST":
        form = request.form

        if form["code"] == user.email_verification_code:
            user.email, user.email_pending_verification = user.email_pending_verification, None
            user.email_verification_case_id, user.email_verification_code = None, None

            if not user.sign_up_complete:
                user.sign_up_complete = True

            db.session.commit()

            if continue_to:
                return redirect(continue_to)
            return redirect("/")

        else:
            template_context_vars = {
                "post_to": request.path,
                "wrong_code": True,
                "sign_up_complete": user.sign_up_complete,
                "username": user.name,
                "email": user.email_pending_verification
            }

            if continue_to:
                template_context_vars["post_to"] += "?continue=" + urllib.parse.quote(continue_to, safe="")

            return render_template("verify_email.html.j2", **template_context_vars)

    # -- GET
    template_context_vars = {
        "post_to": request.path,
        "sign_up_complete": user.sign_up_complete,
        "username": user.name,
        "email": user.email_pending_verification,
        "code": code
    }

    if continue_to:
        template_context_vars["post_to"] += "?continue=" + urllib.parse.quote(continue_to, safe="")

    return render_template("verify_email.html.j2", **template_context_vars)
