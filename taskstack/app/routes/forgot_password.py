from flask import request, redirect
import urllib.parse
from uuid import uuid4
from secrets import token_urlsafe
from app import app, bcrypt, db, ses_cli, render_template
from app.db_models import User
from app.templating.text import get_lexicon_and_lang


@app.route("/forgot-password", methods=["GET", "POST"])
def forgot_password():

    continue_to = request.args.get("continue")
    url_query_str = "?"
    if continue_to:
        url_query_str += "continue=" + urllib.parse.quote(continue_to, safe="")

    # -- POST
    if request.method == "POST":
        form = request.form

        user = User.get_by_name_or_email(form["name"])

        if not user:
            return render_template("forgot_password.html.j2",
                                   post_to=request.path + url_query_str,
                                   username_or_email_does_not_exist=True)

        user.reset_password_case_id = uuid4().hex
        reset_password_code = token_urlsafe(16)
        user.reset_password_code_hash = bcrypt.generate_password_hash(reset_password_code).decode("utf-8")

        db.session.commit()

        lex, _ = get_lexicon_and_lang("forgot_password_view_func")

        reset_password_path_with_code = user.reset_password_case_id + f"?code={reset_password_code}"

        email_html = render_template("email/reset_password.html.j2",
                                     code=reset_password_code,
                                     link="https://taskstack.org/reset-password/" + reset_password_path_with_code)

        email_txt = render_template("email/reset_password.txt.j2",
                                    code=reset_password_code,
                                    link="https://taskstack.org/reset-password/" + reset_password_path_with_code)

        ses_cli.send_email(
            Source='no-reply@taskstack.org',
            Destination={
                'ToAddresses': [
                    user.email,
                ]
            },
            Message={
                'Subject': {
                    'Data': lex['[Taskstack] Reset password'],
                    'Charset': 'UTF-8'
                },
                'Body': {
                    'Text': {
                        'Data': email_txt,
                        'Charset': 'UTF-8'
                    },
                    'Html': {
                        'Data': email_html,
                        'Charset': 'UTF-8'
                    }
                }
            }
        )

        return redirect("/reset-password/" + user.reset_password_case_id + url_query_str)

    # -- GET
    return render_template("forgot_password.html.j2", post_to=request.path + url_query_str)
