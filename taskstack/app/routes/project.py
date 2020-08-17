from flask import abort
from flask_login import current_user
from app import app, db, render_template
from app.helpers import invalid_names
from app.db_models import Project, ProjectCollaboratorLink, User, ProjectChatGroup, CardUserAssignment


@app.route("/<project_owner_name>/<project_name>")
def project_page(project_owner_name, project_name):
    project = db.session.query(Project).filter_by(owner_name=project_owner_name, name=project_name).first()

    if not project:
        abort(404)

    owner_user = project.owner_user

    current_user_role = "owner" if owner_user.id == current_user.id else "no-role"

    project_data = {
        "id": project.id,
        "name": project.name,
        "ownerName": project.owner_name,
        "projectDesc": project.project_desc,
        "visibility": project.visibility,
        "chatGroupStatus": "activated" if ProjectChatGroup.query.filter_by(project_id=project.id).scalar()
                           else "deactivated",
        "members": {
            owner_user.id: {
                "id": owner_user.id,
                "name": owner_user.name,
                "picUrl": owner_user.small_avatar_url,
                "goToUrl": f"/{owner_user.name}",
                "role": "owner"
            }
        },
        "lists": {}
    }

    for member_user in ProjectCollaboratorLink.query.filter_by(project_id=project.id)\
            .join(User)\
            .with_entities(User.id, User.name, User.small_avatar_url, ProjectCollaboratorLink.user_role):

        project_data["members"][member_user.id] = {
            "id": member_user.id,
            "name": member_user.name,
            "picUrl": member_user.small_avatar_url,
            "goToUrl": f"/{member_user.name}",
            "role": member_user.user_role
        }

        if current_user.id == member_user.id:
            current_user_role = member_user.user_role

    for list_ in project.lists:

        project_data["lists"][list_.id] = {
            "name": list_.name,
            "listDesc": list_.list_desc,
            "pos": list_.pos,
            "attachedFiles": {},
            "cards": {}
        }

        for file in list_.attached_files:
            project_data["lists"][list_.id]["attachedFiles"][file.name] = file.url

        for card in list_.cards:

            card_members = {}
            for card_assignment in db.session.query(CardUserAssignment.user_id).filter_by(card_id=card.id):
                card_members[card_assignment.user_id] = 1

            project_data["lists"][list_.id]["cards"][card.id] = {
                "name": card.name,
                "cardDesc": card.card_desc,
                "pos": card.pos,
                "listId": card.list_id,
                "attachedFiles": {},
                "members": card_members
            }

            for file in card.attached_files:
                project_data["lists"][list_.id]["cards"][card.id]["attachedFiles"][file.name] = file.url

    if current_user.name == project.owner_name:
        return render_template("project.html.j2",
                               invalid_names=invalid_names(),
                               project_name=project.name,
                               project_desc=project.project_desc,
                               project=project_data,
                               invite_link=f"https://taskstack.org/invite/{project.invite_code}",
                               invite_as_admin_link=f"https://taskstack.org/invite/{project.invite_as_admin_code}",
                               current_user_role=current_user_role)

    elif current_user.is_project_collaborator_of(project.id):
        return render_template("project.html.j2",
                               project_name=project.name,
                               project_desc=project.project_desc,
                               project=project_data,
                               current_user_role=current_user_role)

    else:
        if project.visibility == "public" \
                or (project.visibility == "friends" and current_user.is_friend_with(owner_user.id)):
            return render_template("project.html.j2",
                                   project_name=project.name,
                                   project_desc=project.project_desc,
                                   project=project_data,
                                   current_user_role=current_user_role)

    abort(404)
