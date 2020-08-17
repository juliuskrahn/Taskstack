from app import app, render_template
from app.db_models import User, Msg, ChatGroupMsg, ProjectChatGroupMsg, FriendshipRequest
from flask_login import current_user


@app.route("/")
def home():
    # home if auth
    if current_user.is_authenticated():

        # projects

        projects_where_is_owner = []
        for project in current_user.projects:
            projects_where_is_owner.append({
                "id": project.id,
                "ownerName": project.owner_name,
                "name": project.name,
                "goToUrl": f"/{project.owner_name}/{project.name}"
            })

        projects_where_is_collab = current_user.get_projects_where_is_collaborator()
        for i, project in enumerate(projects_where_is_collab):
            projects_where_is_collab[i] = {
                "id": project.id,
                "ownerName": project.owner_name,
                "name": project.name,
                "goToUrl": f"/{project.owner_name}/{project.name}"
            }

        # notifications

        notifications = current_user.get_notifications()
        for i, notification in enumerate(notifications):
            from_user = User.get_by_id(notification.from_id)

            if isinstance(notification, Msg):
                notifications[i] = {
                    "id": notification.id,
                    "type": "msg",
                    "chatType": "userToUser",
                    "picUrl": from_user.small_avatar_url,
                    "goToUrl": f"/{from_user.name}",
                    "goToChatUrl": f"/chat?with={from_user.name}",
                    "datetime": f"{notification.datetime}+00:00",
                    "content": notification.content
                }

            elif isinstance(notification, ChatGroupMsg):
                notifications[i] = {
                    "id": notification.id,
                    "type": "msg",
                    "chatType": "chatGroup",
                    "picUrl": from_user.small_avatar_url,
                    "goToUrl": f"/{from_user.name}",
                    "goToChatUrl": "/chat",
                    "datetime": f"{notification.datetime}+00:00",
                    "content": notification.content
                }

            elif isinstance(notification, ProjectChatGroupMsg):
                notifications[i] = {
                    "id": notification.id,
                    "type": "msg",
                    "chatType": "projectChatGroup",
                    "picUrl": from_user.small_avatar_url,
                    "goToUrl": f"/{from_user.name}",
                    "goToChatUrl": "/chat",
                    "datetime": f"{notification.datetime}+00:00",
                    "content": notification.content
                }

            elif isinstance(notification, FriendshipRequest):
                notifications[i] = {
                    "id": notification.id,
                    "type": "friendshipRequest",
                    "picUrl": from_user.small_avatar_url,
                    "goToUrl": f"/{from_user.name}",
                    "datetime": f"{notification.datetime}+00:00"
                }

        # friends

        friends = current_user.get_friends()
        for i, friend in enumerate(friends):
            friends[i] = {
                "id": friend.id,
                "name": friend.name,
                "picUrl": friend.small_avatar_url,
                "goToUrl": f"/{friend.name}"
            }

        return render_template("home.auth.html.j2",
                               projects={"whereOwner": projects_where_is_owner,
                                         "whereCollab": projects_where_is_collab},
                               notifications=notifications,
                               friends=friends)

    # home if not auth
    return render_template("home.unauth.html.j2")
