from flask import redirect, request
from flask_login import login_user, current_user
from datetime import timedelta
import urllib.parse
import re
from secrets import token_urlsafe
from uuid import uuid4
from app import app, db, bcrypt, ses_cli, render_template
from app.helpers import invalid_names
from app.db_models import User
from app.templating.text import get_lexicon_and_lang


@app.route("/signup", methods=["GET", "POST"])
def signup():
    continue_to = request.args.get("continue")

    invalid_names_list = invalid_names()

    # -- POST
    if request.method == "POST":
        form = request.form

        valid = True

        lex, _ = get_lexicon_and_lang("signup_view_func")

        name_error_text = ""
        email_error_text = ""
        password_error_text = ""

        if User.query.filter(User.name.ilike(form['username'])).scalar() or form['username'] in invalid_names_list:
            name_error_text = lex["This username is not available"]
            valid = False

        if User.get_by_name_or_email(form['useremail']) \
                or User.query.filter_by(email_pending_verification=form['useremail']).scalar():
            email_error_text = lex["This email address is not available"]
            valid = False

        regexexp = re.compile("^[a-zA-Z][a-zA-Z0-9_-]*$")
        if not 3 <= len(form["username"]) <= 16 or not regexexp.search(form["username"]):
            name_error_text = lex["Invalid username"]
            valid = False

        if not 1 <= len(form["useremail"]) <= 32:
            email_error_text = lex["Invalid email address"]
            valid = False

        if not 8 <= len(form["password"]) <= 64:
            password_error_text = lex["Invalid password"]
            valid = False

        if not valid:
            return render_template("signup.html.j2",
                                   invalid_names=invalid_names_list,
                                   username=form["username"],
                                   useremail=form["useremail"],
                                   name_error_text=name_error_text,
                                   email_error_text=email_error_text,
                                   password_error_text=password_error_text)

        email_verification_case_id = uuid4().hex
        email_verification_code = token_urlsafe(16)[:8]

        if form.get("keepUserLoggedIn"):
            user = User(form["username"], form["useremail"],
                        bcrypt.generate_password_hash(form["password"]).decode("utf-8"),
                        email_verification_case_id, email_verification_code, True)
            db.session.add(user)
            db.session.commit()
            login_user(user, True, timedelta(days=365))

        else:
            user = User(form["username"], form["useremail"],
                        bcrypt.generate_password_hash(form["password"]).decode("utf-8"),
                        email_verification_case_id, email_verification_code, False)
            db.session.add(user)
            db.session.commit()
            login_user(user)

        verify_email_path = email_verification_case_id
        verify_email_path_with_code = verify_email_path

        if continue_to:
            verify_email_path += f"?continue={urllib.parse.quote(continue_to, safe='')}"
            verify_email_path_with_code = verify_email_path + f"&code={email_verification_code}"
        else:
            verify_email_path_with_code += f"?code={email_verification_code}"

        email_html = render_template("email/account_created_verify_email.html.j2",
                                     username=user.name,
                                     email=user.email_pending_verification,
                                     code=email_verification_code,
                                     link="https://taskstack.org/verify-email/" + verify_email_path_with_code)

        email_txt = render_template("email/account_created_verify_email.txt.j2",
                                    username=user.name,
                                    email=user.email_pending_verification,
                                    code=email_verification_code,
                                    link="https://taskstack.org/verify-email/" + verify_email_path_with_code)

        ses_cli.send_email(
            Source='no-reply@taskstack.org',
            Destination={
                'ToAddresses': [
                    user.email_pending_verification,
                ]
            },
            Message={
                'Subject': {
                    'Data': lex['[Taskstack] Verify your email address'],
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

        return redirect("/verify-email/" + verify_email_path)

    # -- GET
    if current_user.is_authenticated():
        return redirect("/")

    post_to = request.path

    if continue_to:
        post_to += "?continue=" + urllib.parse.quote(continue_to, safe="")

    return render_template("signup.html.j2", post_to=post_to, invalid_names=invalid_names_list,)
