from flask import redirect, request, Response, make_response, abort
from flask_login import current_user, login_user, logout_user
from werkzeug.exceptions import BadRequestKeyError
from datetime import timedelta
import re
from sqlalchemy import or_
from secrets import token_urlsafe
import random
from uuid import uuid4
import urllib.parse
import PIL.Image
import io
from app import app, socketio, db, bcrypt, ses_cli, render_template, s3_cli
from app.helpers import invalid_names, split_s3_obj_url
from app.db_models import User, Project, Msg, ChatGroupMsg, ProjectChatGroupMsg, ChatGroupMsgStatus, \
    ProjectChatGroupMsgStatus, Friendship, FriendshipRequest, ChatGroup, ProjectChatGroup, ChatGroupMemberLink, \
    ProjectChatGroupMemberLink, CardUserAssignment, ProjectCollaboratorLink
from app.templating.text import get_lexicon_and_lang


@app.route("/<username>", methods=["GET", "POST"])
def user_profile(username):
    user = User.get_by_name(username)
    if not user:
        abort(404)
    if not user.sign_up_complete:
        abort(404)

    # -- POST
    if request.method == "POST":
        form = request.form

        if form["submit"] == "editProfile":
            if current_user.name != username:
                abort(404)

            if form["token"] != user.token:
                return make_response(Response(""), 419)

            try:
                # change profile pic
                pic = PIL.Image.open(request.files["newProfilePic"].stream)
                small_pic = pic.copy()
                pic.thumbnail((280, 280))
                small_pic.thumbnail((50, 50))

                pic_fileobj = io.BytesIO()
                pic.save(pic_fileobj, format="png")
                pic_fileobj.seek(0)

                small_pic_fileobj = io.BytesIO()
                small_pic.save(small_pic_fileobj, format="png")
                small_pic_fileobj.seek(0)

                key = uuid4().hex + ".png"
                small_pic_key = uuid4().hex + ".png"

                s3_cli.upload_fileobj(pic_fileobj, app.config["S3_BUCKET_NAME"], key,
                                      ExtraArgs={'ACL': 'public-read',
                                                 'CacheControl': 'max-age: 86400',
                                                 "ContentType": "image/png"})

                s3_cli.upload_fileobj(small_pic_fileobj, app.config["S3_BUCKET_NAME"], small_pic_key,
                                      ExtraArgs={'ACL': 'public-read',
                                                 'CacheControl': 'max-age: 86400',
                                                 "ContentType": "image/png"})

                #   delete prev avatar if not default avatar
                prev_bucket, prev_key = split_s3_obj_url(user.avatar_url)
                small_pic_prev_bucket, small_pic_prev_key = split_s3_obj_url(user.small_avatar_url)
                if prev_bucket == app.config["S3_BUCKET_NAME"]:  # => not default avatar
                    s3_cli.delete_object(Bucket=prev_bucket, Key=prev_key)
                    s3_cli.delete_object(Bucket=small_pic_prev_bucket, Key=small_pic_prev_key)

                user.avatar_url = app.config["S3_BUCKET_URL"] + "/" + key
                user.small_avatar_url = app.config["S3_BUCKET_URL"] + "/" + small_pic_key

            except BadRequestKeyError:
                pass

            # change profile desc
            if len(form["newProfileDesc"]) <= 256:
                user.profile_desc = form["newProfileDesc"]

            db.session.commit()

            return make_response(Response(""), 200)

        elif form["submit"] == "removeFriend":
            f1 = Friendship.query.filter_by(user_id=current_user.id, friend_id=user.id).first()
            f2 = Friendship.query.filter_by(user_id=user.id, friend_id=current_user.id).first()

            if f1 and f2:
                db.session.delete(f1)
                db.session.delete(f2)
                db.session.commit()

            socketio.emit("friend_removed", {"id": current_user.id}, room=user.id, namespace="/")

            return make_response(Response(""), 200)

        abort(400)

    # -- GET
    if current_user.name == username or not user.private or current_user.is_friend_with(user.id):
        return redirect(f"/{username}/projects")

    abort(404)


@app.route("/<username>/projects", methods=["GET"])
def user_profile_projects(username):
    user = User.get_by_name(username)
    if not user:
        abort(404)
    if not user.sign_up_complete:
        abort(404)

    current_user_is_friend_with_user = current_user.is_friend_with(user.id)

    projects = []
    for project in user.projects.order_by(Project.name):

        if current_user.id == user.id \
                or project.visibility == "public" \
                or (project.visibility == "friends" and current_user_is_friend_with_user) \
                or (project.visibility == "private" and current_user.is_project_collaborator_of(project.id)):

            projects.append({"name": project.name,
                             "link": f"/{project.owner_name}/{project.name}",
                             "desc": project.project_desc})

    if current_user.id == user.id:
        return render_template("user_profile_projects.html.j2",
                               user_id=user.id,
                               user_profile_pic_url=user.avatar_url,
                               username=username,
                               useremail=user.email,
                               userprofile_desc=user.profile_desc,
                               token=user.set_token(),
                               projects=projects,
                               current_user_is_friend_with_user=current_user_is_friend_with_user)

    elif not user.private or current_user_is_friend_with_user:
        if user.email_private:
            return render_template("user_profile_projects.html.j2",
                                   user_id=user.id,
                                   user_profile_pic_url=user.avatar_url,
                                   username=username,
                                   userprofile_desc=user.profile_desc,
                                   projects=projects,
                                   current_user_is_friend_with_user=current_user_is_friend_with_user)

        return render_template("user_profile_projects.html.j2",
                               user_id=user.id,
                               user_profile_pic_url=user.avatar_url,
                               username=username,
                               useremail=user.email,
                               userprofile_desc=user.profile_desc,
                               projects=projects,
                               current_user_is_friend_with_user=current_user_is_friend_with_user)

    abort(404)


@app.route("/<username>/friends", methods=["GET"])
def user_profile_friends(username):
    user = User.get_by_name(username)
    if not user:
        abort(404)
    if not user.sign_up_complete:
        abort(404)

    current_user_is_friend_with_user = current_user.is_friend_with(user.id)

    friends = []
    for friend in db.session.query(User)\
            .filter(User.id.in_(db.session.query(Friendship.friend_id).filter_by(user_id=user.id)))\
            .with_entities(User.name, User.small_avatar_url):
        friends.append({"name": friend.name, "link": f"/{friend.name}", "picUrl": friend.small_avatar_url})

    if current_user.id == user.id:
        return render_template("user_profile_friends.html.j2",
                               user_id=user.id,
                               user_profile_pic_url=user.avatar_url,
                               username=username,
                               useremail=user.email,
                               userprofile_desc=user.profile_desc,
                               token=user.set_token(),
                               friends=friends,
                               current_user_is_friend_with_user=current_user_is_friend_with_user)

    elif not user.private or current_user_is_friend_with_user:
        if user.email_private:
            return render_template("user_profile_friends.html.j2",
                                   user_id=user.id,
                                   user_profile_pic_url=user.avatar_url,
                                   username=username,
                                   userprofile_desc=user.profile_desc,
                                   friends=friends,
                                   current_user_is_friend_with_user=current_user_is_friend_with_user)

        return render_template("user_profile_friends.html.j2",
                               user_id=user.id,
                               user_profile_pic_url=user.avatar_url,
                               username=username,
                               useremail=user.email,
                               userprofile_desc=user.profile_desc,
                               friends=friends,
                               current_user_is_friend_with_user=current_user_is_friend_with_user)

    abort(404)


@app.route("/<username>/settings", methods=["GET", "POST"])
def user_profile_settings(username):
    if not current_user.name == username:
        abort(404)
    user = User.get_by_name(username)
    if not user:
        abort(404)
    if not user.sign_up_complete:
        abort(404)

    invalid_names_list = invalid_names()

    # -- POST
    if request.method == "POST":

        # - "switch" settings

        request_json = request.get_json()

        if request_json and request_json["setting"]:

            if request_json["token"] == user.token:

                # Email private

                if request_json["setting"] == "useremailPrivate":
                    if request_json["value"]:
                        user.email_private = True
                    else:
                        user.email_private = False

                # Profile private

                elif request_json["setting"] == "userprofilePrivate":
                    if request_json["value"]:
                        user.private = True
                    else:
                        user.private = False

                # Stay logged in

                elif request_json["setting"] == "keepUserLoggedIn":
                    if request_json["value"] and not user.stay_logged_in:
                        user.stay_logged_in = True
                        logout_user()
                        login_user(user, True, timedelta(days=365))
                    elif not request_json["value"] and user.stay_logged_in:
                        if user.stay_logged_in:
                            user.stay_logged_in = False
                            logout_user()
                            login_user(user)
                        user.stay_logged_in = False

                # Block all friendship requests

                elif request_json["setting"] == "blockAllFriendshipRequests":
                    if request_json["value"]:
                        user.block_all_friendship_requests = True
                    else:
                        user.block_all_friendship_requests = False

                db.session.commit()
                return make_response(Response(""), 200)

            else:
                abort(419)

        # - "form" settings

        form = request.form

        if form and form["submit"] != "editProfile":

            lex, _ = get_lexicon_and_lang("user_profile_settings_view_func")

            if form["token"] == user.token:

                # Change username

                if form["submit"] == "changeUsername":
                    change_username_invalid = False
                    change_username_username_error_text = ""
                    change_username_password_error_text = ""

                    if User.query.filter(User.name.ilike(form['newUsername'])).scalar() \
                            or form['newUsername'] in invalid_names_list:
                        change_username_username_error_text = lex["This username is not available"]
                        change_username_invalid = True

                    regexexp = re.compile("^[a-zA-Z][a-zA-Z0-9_-]*$")
                    if not 1 <= len(form["newUsername"]) <= 16 or not regexexp.search(form["newUsername"]):
                        change_username_username_error_text = lex["Invalid username"]
                        change_username_invalid = True

                    if not bcrypt.check_password_hash(user.password_hash, form["password"]):
                        change_username_password_error_text = lex["Wrong password"]
                        change_username_invalid = True

                    if change_username_invalid:
                        return render_template("user_profile_settings.html.j2",
                                               user_id=user.id,
                                               invalid_names=invalid_names_list,
                                               user_profile_pic_url=user.avatar_url,
                                               username=username,
                                               userprofile_desc=user.profile_desc,
                                               useremail=user.email,
                                               token=user.set_token(),
                                               change_username_invalid=True,
                                               new_username=form['newUsername'],
                                               change_username_password_error_text=change_username_password_error_text,
                                               change_username_username_error_text=change_username_username_error_text
                                               ), \
                               400

                    for project in user.projects:
                        project.owner_name = form["newUsername"]

                        project_data = {
                            "projectId": project.id,
                            "name": project.name,
                            "ownerName": project.owner_name,
                            "projectDesc": project.project_desc
                        }

                        for collab in db.session.query(ProjectCollaboratorLink.user_id)\
                                .filter_by(project_id=project.id):

                            socketio.emit("update_project_attributes",
                                          project_data,
                                          room=collab.user_id,
                                          namespace="/")

                        socketio.emit("update_project_attributes",
                                      project_data,
                                      room=user.id,
                                      namespace="/")

                    user.name = form["newUsername"]

                    # change avatar if default
                    bucket, _ = split_s3_obj_url(user.avatar_url)
                    if bucket != app.config["S3_BUCKET_NAME"]:  # => default avatar
                        rand_n = random.randint(1, 4)
                        user.avatar_url = f"{app.config['S3_STATIC_BUCKET_URL']}/default_avatar/" \
                                          f"{form['newUsername'][0].lower()}{rand_n}x.png"
                        user.small_avatar_url = f"{app.config['S3_STATIC_BUCKET_URL']}/default_avatar/" \
                                                f"{form['newUsername'][0].lower()}{rand_n}s.png"

                    db.session.commit()

                    for friendship in user.friendships:
                        socketio.emit("update_friend_name",
                                      {"id": user.id,
                                       "name": user.name},
                                      room=friendship.friend_id,
                                      namspace="/")

                    return redirect(f"/{user.name}/settings")

                # Change email

                if form["submit"] == "changeEmail":
                    change_email_invalid = False
                    change_email_email_error_text = ""
                    change_email_password_error_text = ""

                    if User.get_by_name_or_email(form['newEmail']) \
                            or User.query.filter_by(email_pending_verification=form['newEmail']).scalar():
                        change_email_email_error_text = lex["This email address is not available"]
                        change_email_invalid = True

                    if not 1 <= len(form["newEmail"]) <= 32:
                        change_email_email_error_text = lex["Invalid email address"]
                        change_email_invalid = True

                    if not bcrypt.check_password_hash(user.password_hash, form["password"]):
                        change_email_password_error_text = lex["Wrong password"]
                        change_email_invalid = True

                    if change_email_invalid:
                        return render_template("user_profile_settings.html.j2",
                                               user_id=user.id,
                                               invalid_names=invalid_names_list,
                                               user_profile_pic_url=user.avatar_url,
                                               username=username,
                                               userprofile_desc=user.profile_desc,
                                               useremail=user.email,
                                               token=user.set_token(),
                                               change_email_invalid=True,
                                               new_email=form['newEmail'],
                                               change_email_email_error_text=change_email_email_error_text,
                                               change_email_password_error_text=change_email_password_error_text
                                               ), \
                               400

                    email_verification_case_id = uuid4().hex
                    email_verification_code = token_urlsafe(16)

                    user.email_pending_verification = form["newEmail"]
                    user.email_verification_case_id = email_verification_case_id
                    user.email_verification_code = email_verification_code
                    db.session.commit()

                    email_verification_path_with_code = email_verification_case_id + f"?code={email_verification_code}"

                    email_html = render_template("email/verify_new_email.html.j2",
                                                 user_id=user.id,
                                                 username=user.name,
                                                 email=user.email_pending_verification,
                                                 code=email_verification_code,
                                                 link="https://taskstack.org/verify-email/" +
                                                      email_verification_path_with_code)

                    email_txt = render_template("email/verify_new_email.txt.j2",
                                                user_id=user.id,
                                                username=user.name,
                                                email=user.email_pending_verification,
                                                code=email_verification_code,
                                                link="https://taskstack.org/verify-email/" +
                                                     email_verification_path_with_code)

                    ses_cli.send_email(
                        Source='no-reply@taskstack.org',
                        Destination={
                            'ToAddresses': [
                                user.email_pending_verification,
                            ]
                        },
                        Message={
                            'Subject': {
                                'Data': lex['[Taskstack] Verify your new email address'],
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

                    return redirect(f"/verify-email/{email_verification_case_id}"
                                    f"?continue={urllib.parse.quote(request.path, safe='')}")

                # Change password

                elif form["submit"] == "changePassword":
                    change_password_invalid = False
                    change_password_password_error_text = ""
                    change_password_new_password_error_text = ""

                    if not bcrypt.check_password_hash(user.password_hash, form["old_password"]):
                        change_password_password_error_text = lex["Wrong password"]
                        change_password_invalid = True

                    if not 8 <= len(form["newPassword"]) <= 64:
                        change_password_password_error_text = lex["Invalid password"]
                        change_password_invalid = False

                    if change_password_invalid:
                        return render_template("user_profile_settings.html.j2",
                                               user_id=user.id,
                                               invalid_names=invalid_names_list,
                                               user_profile_pic_url=user.avatar_url,
                                               username=username,
                                               useremail=user.email,
                                               userprofile_desc=user.profile_desc,
                                               token=user.set_token(),
                                               change_password_invalid=True,
                                               change_password_password_error_text=change_password_password_error_text,
                                               change_password_new_password_error_text=
                                               change_password_new_password_error_text
                                               ), \
                               400

                    user.password_hash = bcrypt.generate_password_hash(form["newPassword"]).decode("utf-8")
                    db.session.commit()

                    return redirect(f"/{user.name}/settings")

                # Delete account

                elif form["submit"] == "deleteAccount":
                    if not bcrypt.check_password_hash(user.password_hash, form["password"]):
                        delete_account_password_error_text = lex["Wrong password"]

                        return render_template("user_profile_settings.html.j2",
                                               user_id=user.id,
                                               invalid_names=invalid_names_list,
                                               user_profile_pic_url=user.avatar_url,
                                               username=username,
                                               useremail=user.email,
                                               userprofile_desc=user.userprofile_desc,
                                               token=user.set_token(),
                                               delete_account_invalid=True,
                                               delete_account_password_error_text=delete_account_password_error_text
                                               ), \
                            400

                    logout_user()

                    for project in user.projects.with_entities(Project.id):
                        socketio.emit("project_deleted", room=project.id, namespace="/project")

                    # delete user avatar from s3 bucket
                    avatar_bucket, avatar_key = split_s3_obj_url(user.avatar_url)
                    small_avatar_bucket, small_avatar_key = split_s3_obj_url(user.small_avatar_url)
                    if avatar_bucket == app.config["S3_BUCKET_NAME"]:
                        s3_cli.delete_object(Bucket=avatar_bucket, Key=avatar_key)
                        s3_cli.delete_object(Bucket=small_avatar_bucket, Key=small_avatar_key)

                    # delete projects
                    for project in user.projects:
                        for _list in project.lists:
                            for card in _list.cards:
                                for file in card.attached_files:
                                    _, key = split_s3_obj_url(file.url)
                                    s3_cli.delete_object(Bucket=app.config["S3_BUCKET_NAME"], Key=key)
                                    db.session.delete(file)

                                CardUserAssignment.query.filter_by(card_id=card.id).delete()

                                db.session.delete(card)

                            for file in _list.attached_files:
                                _, key = split_s3_obj_url(file.url)
                                s3_cli.delete_object(Bucket=app.config["S3_BUCKET_NAME"], Key=key)
                                db.session.delete(file)

                            db.session.delete(_list)

                        project_chat_group = project.chat_group.first()
                        if project_chat_group:
                            ProjectChatGroupMsgStatus.query.filter_by(
                                project_chat_group_id=project_chat_group.id).delete()
                            ProjectChatGroupMsg.query.filter_by(project_chat_group_id=project_chat_group.id).delete()
                            project_chat_group.member_links.delete()
                            db.session.delete(project_chat_group)

                        for collab in db.session.query(ProjectCollaboratorLink.user_id)\
                                .filter_by(project_id=project.id):

                            socketio.emit("removed_as_collab_of_project", project.id, room=collab.user_id, namspace="/")

                            if project_chat_group:
                                socketio.emit("chat_group_removed",
                                              {"type": "projectChatGroup",
                                               "id": project_chat_group.id},
                                              room=collab.user_id,
                                              namspace="/")

                        ProjectCollaboratorLink.query.filter_by(project_id=project.id).delete()

                        db.session.delete(project)

                    # delete project collab links
                    for project_collaboration_link in user.project_collaboration_links:

                        socketio.emit("project_collab_removed",
                                      {"id": user.id},
                                      room=project_collaboration_link.project_id,
                                      namespace="/project")

                        db.session.delete(project_collaboration_link)

                    # delete card assignments
                    user.card_assignments.delete()

                    # delete chat group member links
                    for chat_group_member_link in user.chat_group_member_links:
                        for member in db.session.query(ChatGroupMemberLink.user_id) \
                                .filter_by(chat_group_id=chat_group_member_link.chat_group_id).all():
                            socketio.emit("chat_group_member_removed",
                                          {"userId": user.id,
                                           "chatGroupId": chat_group_member_link.chat_group_id,
                                           "chatGroupType": "chatGroup"},
                                          room=member.user_id,
                                          namspace="/")

                        db.session.delete(chat_group_member_link)

                    for project_chat_group_member_link in user.project_chat_group_member_links:
                        for member in db.session.query(ProjectChatGroupMemberLink.user_id) \
                                .filter_by(project_chat_group_id=project_chat_group_member_link.chat_group_id).all():
                            socketio.emit("chat_group_member_removed",
                                          {"userId": user.id,
                                           "chatGroupId": project_chat_group_member_link.chat_group_id,
                                           "chatGroupType": "projectChatGroup"},
                                          room=member.user_id,
                                          namspace="/")

                        db.session.delete(project_chat_group_member_link)

                    # delete friendships + friendship reqs
                    for friendship in user.friendships:
                        socketio.emit("friend_removed",
                                      {"id": user.id},
                                      room=friendship.friend_id,
                                      namspace="/")

                    Friendship.query.filter(
                        or_(Friendship.friend_id == user.id, Friendship.user_id == user.id)).delete()
                    FriendshipRequest.query.filter(
                        or_(FriendshipRequest.from_id == user.id, FriendshipRequest.to_id == user.id)) \
                        .delete()

                    # delete msgs
                    Msg.query.filter(or_(Msg.from_id == user.id, Msg.to_id == user.id)).delete()
                    ChatGroupMsg.query.filter_by(from_id=user.id).delete()
                    ProjectChatGroupMsg.query.filter_by(from_id=user.id).delete()
                    ChatGroupMsgStatus.query.filter_by(user_id=user.id).delete()
                    ProjectChatGroupMsgStatus.query.filter_by(user_id=user.id).delete()

                    # delete pot. resulting empty chat groups
                    ChatGroup.query.filter(ChatGroup.id.notin_(db.session.query(ChatGroupMemberLink.chat_group_id))) \
                        .delete(synchronize_session=False)
                    ProjectChatGroup.query \
                        .filter(ChatGroup.id
                                .notin_(db.session.query(ProjectChatGroupMemberLink.project_chat_group_id)))\
                        .delete(synchronize_session=False)

                    db.session.delete(user)

                    db.session.commit()

                    return redirect("/")

            else:
                return render_template("user_profile_settings.html.j2",
                                       user_id=user.id,
                                       invalid_names=invalid_names_list,
                                       user_profile_pic_url=user.avatar_url,
                                       username=username,
                                       useremail=user.email,
                                       userprofile_desc=user.profile_desc, token=user.set_token(),
                                       invalid_token=True
                                       ), \
                       419

        abort(400)

    # -- GET
    return render_template("user_profile_settings.html.j2",
                           user_id=user.id,
                           invalid_names=invalid_names_list,
                           user_profile_pic_url=user.avatar_url,
                           username=username,
                           useremail=user.email,
                           userprofile_desc=user.profile_desc,
                           token=user.set_token())
