from flask import abort, redirect, flash, request
from flask_login import current_user
from sqlalchemy import or_
import urllib.parse
from app import app, db, socketio, render_template
from app.db_models import User, Project, ProjectCollaboratorLink, ProjectChatGroupMemberLink
from app.templating.text import get_lexicon_and_lang


@app.route("/invite/<code>", methods=["GET", "POST"])
def invite_to_project_link(code):
    if not current_user.is_authenticated():
        return redirect("/login?continue=" + urllib.parse.quote(request.path, safe=""))

    project = Project.query.filter(or_(Project.invite_code == code, Project.invite_as_admin_code == code)).first()

    if not project:
        abort(404)

    if current_user.is_project_owner_or_collaborator_of(project.id):
        return redirect(f"/{project.owner_name}/{project.name}")

    # -- POST
    if request.method == "POST":

        lex, _ = get_lexicon_and_lang("invite_html_j2")

        role = "admin" if project.invite_as_admin_code == code else "access-only"

        db.session.add(ProjectCollaboratorLink(project.id, current_user.id, role))

        project_chat_group = project.chat_group.first()
        if project_chat_group:

            member_data = {current_user.id: {
                "id": current_user.id,
                "role": "default",
                "name": current_user.name,
                "picUrl": current_user.small_avatar_url,
                "goToUrl": f"/{current_user.name}"
            }}

            for member_user in db.session.query(ProjectChatGroupMemberLink) \
                    .filter_by(project_chat_group_id=project_chat_group.id) \
                    .join(User, User.id == ProjectChatGroupMemberLink.user_id) \
                    .with_entities(User.id,
                                   User.name,
                                   User.small_avatar_url):
                member_data[member_user.id] = {
                    "id": member_user.id,
                    "name": member_user.name,
                    "picUrl": member_user.small_avatar_url,
                    "goToUrl": f"/{member_user.name}",
                    "role": "default"
                }

                socketio.emit("new_chat_group_member",
                              {"chatGroupId": project_chat_group.id,
                               "chatGroupType": "projectChatGroup",
                               "member": {"id": current_user.id,
                                          "name": current_user.name,
                                          "picUrl": current_user.small_avatar_url,
                                          "goToUrl": f"/{current_user.name}",
                                          "role": "default"}
                               },
                              namespace="/",
                              room=member_user.id)

            db.session.add(ProjectChatGroupMemberLink(project_chat_group.id, current_user.id, "default"))

            last_msg = current_user.get_last_msg(project_chat_group.id, "projectChatGroup")
            last_msg = {"content": last_msg.content,
                        "datetime": f"{last_msg.datetime}+00:00"} if last_msg else "None"

            socketio.emit("new_chat_group",
                          {"id": project_chat_group.id,
                           "type": "projectChatGroup",
                           "name": project_chat_group.name,
                           "unreadCount": 0,
                           "lastMsg": last_msg,
                           "picUrl": "/static/img/group.png",
                           "roleOfCurrentUser": "default",
                           "members": member_data
                           },
                          room=current_user.id,
                          namespace="/")

        db.session.commit()

        socketio.emit("new_project_collab",
                      {"id": current_user.id,
                       "name": current_user.name,
                       "picUrl": current_user.small_avatar_url,
                       "goToUrl": f"/{current_user.name}",
                       "role": role},
                      namespace="/project",
                      room=project.id)

        socketio.emit("now_collab_of_project",
                      {"id": project.id,
                       "name": project.name,
                       "ownerName": project.owner_name,
                       "goToUrl": f"/{project.owner_name}/{project.name}"},
                      namespace="/",
                      room=current_user.id)

        formal_role = "Admin" if role == "admin" else '"Access Only"'

        flash(f"{lex['success_msg_part_1']} "
              f"{project.owner_name}/{project.name} "
              f"{lex['success_msg_part_2']} "
              f"{formal_role}"
              f"{lex['success_msg_part_3']}")

        return redirect(f"/{project.owner_name}/{project.name}")

    # -- GET
    return render_template("invite.html.j2",
                           project_name=f"{project.owner_name}/{project.name}",
                           post_to=request.path)
