from flask import redirect, request, abort
from flask_login import current_user
import re
from app import app, db, render_template
from app.helpers import invalid_names
from app.db_models import Project, ProjectChatGroup, ProjectChatGroupMemberLink


@app.route("/new", methods=["GET", "POST"])
def new_project():
    if not current_user.is_authenticated():
        return redirect("/")

    invalid_names_list = invalid_names()

    # -- POST
    if request.method == "POST":
        form = request.form

        regexexp = re.compile("^[a-zA-Z0-9_-]*$")
        if not 3 <= len(form["name"]) <= 32 or not regexexp.search(form["name"]) or form["name"] in invalid_names_list:
            abort(400)

        if not len(form["desc"]) <= 128:
            abort(400)

        if Project.query.filter(Project.owner_name == current_user.name,
                                Project.name.ilike(form["name"])).scalar():

            return render_template("new_project.html.j2",
                                   invalid_names=invalid_names_list,
                                   owner_has_already_project_with_that_name=True)

        project_visibility = "private" if form.get("project_private") else "public"
        project = Project(current_user.name, form["name"], form["desc"], project_visibility)
        db.session.add(project)

        if form.get("create_project_chat_group") is not None:
            db.session.flush()
            project_chat_group = ProjectChatGroup(f"{project.owner_name}/{project.name}", project.id)
            db.session.add(project_chat_group)
            db.session.flush()
            db.session.add(ProjectChatGroupMemberLink(project_chat_group.id, current_user.id, "default"))

        db.session.commit()

        return redirect(f"/{project.owner_name}/{project.name}")

    # -- GET
    return render_template("new_project.html.j2",
                           invalid_names=invalid_names_list)
