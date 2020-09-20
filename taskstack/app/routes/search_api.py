from flask import request, jsonify, abort
from flask_login import current_user
from sqlalchemy import and_
from app import app, db
from app.db_models import User, Project, ProjectCollaboratorLink, Friendship


@app.route("/search")
def search():
    if not current_user.is_authenticated():
        abort(404)

    q = request.args.get("q")

    results = []

    for project in db.session.query(Project) \
        .filter(and_(
            Project.owner_name == current_user.name,
            Project.name.like(f"%{q}%")
        )
    ).all():
        results.append({
            "type": "project",
            "name": f"{project.owner_name}/{project.name}",
            "urlPath": f"/{project.owner_name}/{project.name}"
        })

    for project in db.session.query(Project) \
        .filter(and_(
            Project.id.in_(
                db.session.query(ProjectCollaboratorLink.project_id)
                .filter(ProjectCollaboratorLink.user_id == current_user.id)),
            Project.name.like(f"%{q}%")
        )
    ).all():
        results.append({
            "type": "project",
            "name": f"{project.owner_name}/{project.name}",
            "urlPath": f"/{project.owner_name}/{project.name}"
        })

    for user in db.session.query(User) \
        .filter(and_(
            User.id.in_(
                db.session.query(Friendship.friend_id).filter_by(user_id=current_user.id)
            ),
            User.name.like(f"%{q}%")
        )
    ).all():
        results.append({
            "type": "user",
            "name": user.name,
            "urlPath": f"/{user.name}"
        })

    return jsonify(results), 200
