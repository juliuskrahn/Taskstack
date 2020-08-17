from flask import abort, request
from flask_login import current_user
from app import app, db, render_template
from app.db_models import User, ChatGroupMemberLink, ProjectChatGroupMemberLink


@app.route("/chat")
def chat():
    if not current_user.is_authenticated():
        abort(404)

    chats = {
        "userToUser": {},
        "chatGroup": {},
        "projectChatGroup": {}
    }

    for friend in current_user.get_friends():
        last_msg = current_user.get_last_msg(friend.id, "userToUser")
        last_msg = {"content": last_msg.content, "datetime": f"{last_msg.datetime}+00:00"} if last_msg else "None"

        chats["userToUser"][friend.id] = {
            "id": friend.id,
            "type": "userToUser",
            "name": friend.name,
            "unreadCount": current_user.get_unread_count_in_chat(friend.id, "userToUser"),
            "lastMsg": last_msg,
            "picUrl": friend.small_avatar_url,
            "goToUrl": f"/{friend.name}"
        }

    for chat_group in current_user.get_chat_groups_where_member():
        last_msg = current_user.get_last_msg(chat_group.id, "chatGroup")
        last_msg = {"content": last_msg.content, "datetime": f"{last_msg.datetime}+00:00"} if last_msg else "None"

        members = {}

        for member_user in db.session.query(ChatGroupMemberLink) \
                .filter_by(chat_group_id=chat_group.id) \
                .join(User, User.id == ChatGroupMemberLink.user_id) \
                .with_entities(User.id,
                               User.name,
                               User.small_avatar_url,
                               ChatGroupMemberLink.user_role):

            members[member_user.id] = {
                "id": member_user.id,
                "name": member_user.name,
                "picUrl": member_user.small_avatar_url,
                "goToUrl": f"/{member_user.name}",
                "role": member_user.user_role
            }

        chats["chatGroup"][chat_group.id] = {
            "id": chat_group.id,
            "type": "chatGroup",
            "name": chat_group.name,
            "unreadCount": current_user.get_unread_count_in_chat(chat_group.id, "chatGroup"),
            "lastMsg": last_msg,
            "picUrl": "/static/img/group.png",
            "roleOfCurrentUser": chat_group.user_role,
            "members": members
        }

    for project_chat_group in current_user.get_project_chat_groups_where_member():
        last_msg = current_user.get_last_msg(project_chat_group.id, "projectChatGroup")
        last_msg = {"content": last_msg.content, "datetime": f"{last_msg.datetime}+00:00"} if last_msg else "None"

        members = {}

        for member_user in db.session.query(ProjectChatGroupMemberLink) \
                .filter_by(project_chat_group_id=project_chat_group.id) \
                .join(User, User.id == ProjectChatGroupMemberLink.user_id) \
                .with_entities(User.id,
                               User.name,
                               User.small_avatar_url):

            members[member_user.id] = {
                "id": member_user.id,
                "name": member_user.name,
                "picUrl": member_user.small_avatar_url,
                "goToUrl": f"/{member_user.name}",
                "role": "default"
            }

        chats["projectChatGroup"][project_chat_group.id] = {
            "id": project_chat_group.id,
            "type": "projectChatGroup",
            "name": project_chat_group.name,
            "unreadCount": current_user.get_unread_count_in_chat(project_chat_group.id, "projectChatGroup"),
            "lastMsg": last_msg,
            "picUrl": "/static/img/group.png",
            "roleOfCurrentUser": project_chat_group.user_role,
            "members": members
        }

    user_to_chat_with_name = request.args.get("with")

    if user_to_chat_with_name:
        member_user = User.get_by_name(user_to_chat_with_name)
        if member_user:
            if current_user.is_friend_with(member_user.id):
                return render_template("chat.html.j2",
                                       chats=chats,
                                       chat_to_open={"id": User.get_by_name(user_to_chat_with_name).id,
                                                     "type": "userToUser"})

    return render_template("chat.html.j2", chats=chats)
