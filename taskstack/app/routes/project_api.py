from flask import abort, jsonify
from flask_login import current_user
from app import app, db
from app.db_models import Project, HistoryListCreated, HistoryListDeleted, HistoryCardCreated, HistoryCardDeleted, \
    HistoryCardChangedList


@app.route("/<project_owner_name>/<project_name>/history")
def project_history(project_owner_name, project_name):
    project = db.session.query(Project).filter_by(owner_name=project_owner_name, name=project_name).first()

    if not project:
        abort(404)

    if not current_user.is_project_owner_or_collaborator_of(project.id):
        abort(404)

    history = []

    for HistoryListCreated_event in HistoryListCreated.query.filter_by(project_id=project.id):
        history.append({
            "type": "historyListCreated_event",
            "id": HistoryListCreated_event.id,
            "name": HistoryListCreated_event.name,
            "listDesc": HistoryListCreated_event.list_desc,
            "attachedFilesNames": HistoryListCreated_event.attached_files,
            "datetime": HistoryListCreated_event.datetime
        })

    for HistoryListDeleted_event in HistoryListDeleted.query.filter_by(project_id=project.id):
        history.append({
            "type": "historyListDeleted_event",
            "id": HistoryListDeleted_event.id,
            "name": HistoryListDeleted_event.name,
            "listDesc": HistoryListDeleted_event.list_desc,
            "attachedFilesNames": HistoryListDeleted_event.attached_files,
            "datetime": HistoryListDeleted_event.datetime
        })

    for HistoryCardCreated_event in HistoryCardCreated.query.filter_by(project_id=project.id):
        history.append({
            "type": "historyCardCreated_event",
            "id": HistoryCardCreated_event.id,
            "name": HistoryCardCreated_event.name,
            "cardDesc": HistoryCardCreated_event.card_desc,
            "attachedFilesNames": HistoryCardCreated_event.attached_files,
            "membersNames": HistoryCardCreated_event.assigned_users,
            "listName":  HistoryCardCreated_event.list_name,
            "datetime": HistoryCardCreated_event.datetime
        })

    for HistoryCardDeleted_event in HistoryCardDeleted.query.filter_by(project_id=project.id):
        history.append({
            "type": "historyCardDeleted_event",
            "id": HistoryCardDeleted_event.id,
            "name": HistoryCardDeleted_event.name,
            "cardDesc": HistoryCardDeleted_event.card_desc,
            "attachedFilesNames": HistoryCardDeleted_event.attached_files,
            "membersNames": HistoryCardDeleted_event.assigned_users,
            "listName": HistoryCardDeleted_event.list_name,
            "datetime": HistoryCardDeleted_event.datetime
        })

    for HistoryCardChangedList_event in HistoryCardChangedList.query.filter_by(project_id=project.id):
        history.append({
            "type": "historyCardChangedList_event",
            "id": HistoryCardChangedList_event.id,
            "name": HistoryCardChangedList_event.name,
            "oldListName": HistoryCardChangedList_event.old_list_name,
            "newListName": HistoryCardChangedList_event.new_list_name,
            "datetime": HistoryCardChangedList_event.datetime
        })

    return jsonify(history), 200
