from flask_socketio import emit, join_room, rooms, close_room, Namespace
from flask import request
from flask_login import current_user
import re
import sys
from app import app, db, s3_cli
from app.db_models import User, Project, List, Card, ListAttachedFile, CardAttachedFile, ProjectCollaboratorLink, \
    ProjectChatGroup, ProjectChatGroupMemberLink, ProjectChatGroupMsg, ProjectChatGroupMsgStatus, CardUserAssignment
from app.helpers import split_s3_obj_url, invalid_names
from uuid import uuid4


SOCKET_IO_PROJECT_NAMESPACE_NAME = "/project"


class SocketIOProjectNamespace(Namespace):
    """
    rooms: <project id>: int

    emitted events:

    """

    MAX_ATTACHED_FILES_PER_LIST_OR_CARD = 8

    @staticmethod
    def on_connect():
        return current_user.is_authenticated()

    @staticmethod
    def on_join_project_room(project_id):
        if current_user.is_project_owner_or_collaborator_of(project_id):
            join_room(int(project_id))

    @staticmethod
    def on_edit_project_name_and_desc(data):
        if data["id"] in rooms() and current_user.is_project_owner_of(data["id"]):
            project = Project.query.filter_by(id=data["id"]).first()

            regexexp = re.compile("^[a-zA-Z0-9_-]*$")
            if 3 <= len(data["name"]) <= 32 and data["name"] != project.name and regexexp.search(data["name"]):

                if Project.query.filter(Project.owner_name == project.owner_name,
                                        Project.name.ilike(data["name"])).scalar():

                    emit("edit_project_name_and_desc_error_owner_has_already_project_with_that_name",
                         room=request.sid)
                    return

                if data["name"] in invalid_names():
                    return

                project.name = data["name"]

                ProjectChatGroup.query.filter_by(project_id=project.id)\
                    .update({ProjectChatGroup.name: f"{project.owner_name}/{project.name}"})

            if len(data["projectDesc"]) <= 128 and data["projectDesc"] != project.project_desc:
                project.project_desc = data["projectDesc"]

            db.session.commit()

            project_data = {
                "projectId": project.id,
                "name": project.name,
                "ownerName": project.owner_name,
                "projectDesc": project.project_desc
            }

            emit("edit_project_name_and_desc_successful", room=request.sid)

            for collab in db.session.query(ProjectCollaboratorLink.user_id).filter_by(project_id=project.id).all():
                emit("update_project_attributes",
                     project_data,
                     room=collab.user_id,
                     namespace="/")

            emit("update_project_attributes",
                 project_data,
                 room=current_user.id,
                 namespace="/")

    @staticmethod
    def on_delete_project(data):
        if data["id"] in rooms() and current_user.is_project_owner_of(data["id"]):
            project = Project.query.filter_by(id=data["id"]).first()

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

            ProjectCollaboratorLink.query.filter_by(project_id=project.id).delete()

            project_chat_group = project.chat_group.first()
            if project_chat_group:
                ProjectChatGroupMsgStatus.query.filter_by(project_chat_group_id=project_chat_group.id).delete()
                ProjectChatGroupMsg.query.filter_by(project_chat_group_id=project_chat_group.id).delete()
                project_chat_group.member_links.delete()
                db.session.delete(project_chat_group)

            for user in db.session.query(ProjectCollaboratorLink.user_id) \
                    .filter_by(project_id=project.id):

                emit("removed_as_collab_of_project", project.id, room=user.id, namspace="/")

                if project_chat_group:
                    emit("chat_group_removed",
                         {"type": "projectChatGroup",
                          "id": project_chat_group.id},
                         room=user.id,
                         namspace="/")

            db.session.delete(project)

            db.session.commit()

            emit("project_deleted", room=int(data["id"]))

            close_room(data["id"])

    @staticmethod
    def on_create_list(data):
        if data["projectId"] in rooms():
            List.query.filter_by(project_id=data["projectId"]).update({"pos": List.pos + 1})
            new_list = List(data["projectId"],
                            data["name"],
                            data["listDesc"],
                            0)
            db.session.add(new_list)
            db.session.flush()

            if len(data["attachedFiles"]) > SocketIOProjectNamespace.MAX_ATTACHED_FILES_PER_LIST_OR_CARD:
                return

            attached_files = {}
            for file_name, binary in data["attachedFiles"].items():
                if sys.getsizeof(binary) > 10485760:
                    return
                key = uuid4().hex
                s3_cli.put_object(Body=binary, Bucket=app.config["S3_BUCKET_NAME"], Key=key, ACL='public-read',
                                  CacheControl='no-store',
                                  ContentDisposition=f'attachment; filename="{file_name}"')
                db.session.add(ListAttachedFile(new_list.id, app.config["S3_BUCKET_URL"] + "/" + key, file_name))
                attached_files[file_name] = app.config["S3_BUCKET_URL"] + "/" + key

            db.session.commit()

            emit("create_list_successful", room=request.sid)

            emit("build_new_list",
                 {"id": new_list.id,
                  "name": data["name"],
                  "listDesc": data["listDesc"],
                  "pos": new_list.pos,
                  "attachedFiles": attached_files},
                 room=int(data["projectId"]))

    @staticmethod
    def on_move_list(data):
        if data["projectId"] in rooms():
            resp = {"id": data["id"], "pos": data["pos"], "otherListsPosChanges": []}

            lists = List.query.filter_by(project_id=data["projectId"])
            list_to_move = lists.filter_by(id=data["id"], project_id=data["projectId"]).first()
            if list_to_move.pos > data["pos"]:
                for _list in lists.all():
                    if data["pos"] <= _list.pos < list_to_move.pos:
                        _list.pos += 1
                        resp["otherListsPosChanges"].append([_list.id, 1])
            else:
                for _list in lists.all():
                    if list_to_move.pos < _list.pos <= data["pos"]:
                        _list.pos -= 1
                        resp["otherListsPosChanges"].append([_list.id, -1])
            list_to_move.pos = data["pos"]

            db.session.commit()

            emit("move_list_successful", room=request.sid)
            emit("update_list_pos", resp, room=int(data["projectId"]))

    @staticmethod
    def on_edit_list(data):
        if data["projectId"] in rooms():
            list_to_edit = List.query.filter_by(project_id=data["projectId"], id=data["id"]).first()
            list_to_edit.name = data["name"]
            list_to_edit.list_desc = data["listDesc"]

            files_total = list_to_edit.attached_files.count() - len(data["removedAttachedFiles"]) + \
                len(data["newAttachedFiles"])
            if files_total > SocketIOProjectNamespace.MAX_ATTACHED_FILES_PER_LIST_OR_CARD:
                return

            removed_attached_files = []
            new_attached_files = []

            for file_name in data["removedAttachedFiles"]:
                file = ListAttachedFile.query.filter_by(list_id=list_to_edit.id, name=file_name).first()
                _, key = split_s3_obj_url(file.url)
                s3_cli.delete_object(Bucket=app.config["S3_BUCKET_NAME"], Key=key)
                db.session.delete(file)
                removed_attached_files.append(file_name)

            for file_name, binary in data["replacedAttachedFiles"].items():
                if sys.getsizeof(binary) > 10485760:
                    return
                file_url = ListAttachedFile.query.filter_by(list_id=list_to_edit.id, name=file_name).first().url
                _, key = split_s3_obj_url(file_url)
                s3_cli.put_object(Body=binary, Bucket=app.config["S3_BUCKET_NAME"], Key=key, ACL='public-read',
                                  CacheControl='no-store',
                                  ContentDisposition=f'attachment; filename="{file_name}"')

            for file_name, binary in data["newAttachedFiles"].items():
                if sys.getsizeof(binary) > 10485760:
                    return
                key = uuid4().hex
                s3_cli.put_object(Body=binary, Bucket=app.config["S3_BUCKET_NAME"], Key=key, ACL='public-read',
                                  CacheControl='no-store',
                                  ContentDisposition=f'attachment; filename="{file_name}"')
                db.session.add(ListAttachedFile(list_to_edit.id, app.config["S3_BUCKET_URL"] + "/" + key, file_name))
                new_attached_files.append([file_name, app.config["S3_BUCKET_URL"] + "/" + key])

            db.session.commit()

            emit("edit_list_successful", request.sid)

            emit("update_list",
                 {"id": data["id"],
                  "name": data["name"],
                  "listDesc": data["listDesc"],
                  "removedAttachedFiles": removed_attached_files,
                  "newAttachedFiles": new_attached_files},
                 room=int(data["projectId"]))

    @staticmethod
    def on_delete_list(data):
        if data["projectId"] in rooms():
            list_to_remove = List.query.filter_by(id=data["id"], project_id=data["projectId"]).first()

            for file in list_to_remove.attached_files:
                _, key = split_s3_obj_url(file.url)
                s3_cli.delete_object(Bucket=app.config["S3_BUCKET_NAME"], Key=key)
                db.session.delete(file)

            for card in list_to_remove.cards:
                for file in card.attached_files:
                    _, key = split_s3_obj_url(file.url)
                    s3_cli.delete_object(Bucket=app.config["S3_BUCKET_NAME"], Key=key)
                    db.session.delete(file)

                CardUserAssignment.query.filter_by(card_id=card.id).delete()

                db.session.delete(card)

            lists_pos_changes = []

            for _list in list_to_remove.project.lists:
                if _list.pos > list_to_remove.pos:
                    _list.pos -= 1
                    lists_pos_changes.append([_list.id, -1])

            db.session.delete(list_to_remove)
            db.session.commit()

            emit("delete_list_successful", room=request.sid)

            emit("remove_list", {"id": data["id"], "listsPosChanges": lists_pos_changes}, room=int(data["projectId"]))

    @staticmethod
    def on_create_card(data):
        if data["projectId"] in rooms() and List.query.filter_by(id=data["listId"],
                                                                 project_id=data["projectId"]).scalar():
            new_card = Card(data["listId"],
                            data["name"],
                            data["cardDesc"],
                            Card.query.filter_by(list_id=data["listId"]).count())
            db.session.add(new_card)
            db.session.flush()

            if len(data["attachedFiles"]) > SocketIOProjectNamespace.MAX_ATTACHED_FILES_PER_LIST_OR_CARD:
                return

            attached_files = {}
            for file_name, binary in data["attachedFiles"].items():
                if sys.getsizeof(binary) > 10485760:
                    return
                key = uuid4().hex
                s3_cli.put_object(Body=binary, Bucket=app.config["S3_BUCKET_NAME"], Key=key, ACL='public-read',
                                  CacheControl='no-store',
                                  ContentDisposition=f'attachment; filename="{file_name}"')
                db.session.add(CardAttachedFile(new_card.id, app.config["S3_BUCKET_URL"] + "/" + key, file_name))
                attached_files[file_name] = app.config["S3_BUCKET_URL"] + "/" + key

            card_members = {}
            for user_id in data["members"]:
                card_members[user_id] = 1
                db.session.add(CardUserAssignment(new_card.id, user_id))

            db.session.commit()

            emit("create_card_successful", room=request.sid)

            emit("build_new_card",
                 {"id": new_card.id,
                  "listId": data["listId"],
                  "name": data["name"],
                  "cardDesc": data["cardDesc"],
                  "pos": new_card.pos,
                  "attachedFiles": attached_files,
                  "members": card_members},
                 room=int(data["projectId"]))

    @staticmethod
    def on_move_card(data):
        if data["projectId"] in rooms():
            card_to_move = Card.query.filter_by(id=data["id"]).first()

            resp = {"cards": [
                        {"id": data["id"],
                         "listId": data["listId"],
                         "prevListId": card_to_move.list_id,
                         "pos": data["pos"]}],
                    "otherCardsPosChanges": []}

            prev_list = List.query.filter_by(id=card_to_move.list_id).first()

            if prev_list.project_id != int(data["projectId"]) or card_to_move.list.project_id != int(data["projectId"]):
                return

            if card_to_move.list_id == int(data["listId"]):
                if card_to_move.pos > data["pos"]:
                    for card in prev_list.cards:
                        if data["pos"] <= card.pos < card_to_move.pos:
                            card.pos += 1
                            resp["otherCardsPosChanges"].append([card.id, card.list_id, 1])
                else:
                    for card in prev_list.cards:
                        if card_to_move.pos < card.pos <= data["pos"]:
                            card.pos -= 1
                            resp["otherCardsPosChanges"].append([card.id, card.list_id, -1])
            else:
                list_to_move_to = List.query.filter_by(project_id=data["projectId"], id=data["listId"]).first()
                if list_to_move_to.project_id != int(data["projectId"]):
                    return
                for card in prev_list.cards:
                    if card.pos > card_to_move.pos:
                        card.pos -= 1
                        resp["otherCardsPosChanges"].append([card.id, card.list_id, -1])
                for card in list_to_move_to.cards:
                    if card.pos >= data["pos"]:
                        card.pos += 1
                        resp["otherCardsPosChanges"].append([card.id, card.list_id, 1])
                card_to_move.list_id = data["listId"]
            card_to_move.pos = int(data["pos"])

            db.session.commit()

            emit("update_cards_pos", resp, room=int(data["projectId"]))

    @staticmethod
    def on_move_cards(data):
        if data["projectId"] in rooms():
            resp = {"cards": [],
                    "otherCardsPosChanges": []}

            cards = Card.query.filter(Card.id.in_(data["ids"])).order_by(Card.pos)

            current_pos = int(data["pos"])

            origin_lists = {}

            cards_to_move_inside_target_list_that_where_before_insert_point = 0

            for card in cards:
                if card.list.project_id != int(data["projectId"]):
                    return
                origin_lists[card.list_id] = card.list
                if card.list_id == int(data["listId"]) and card.pos <= int(data["pos"]):
                    cards_to_move_inside_target_list_that_where_before_insert_point += 1

                card.pos = current_pos
                current_pos += 1

                resp["cards"].append({"id": card.id,
                                      "listId": data["listId"],
                                      "prevListId": card.list_id,
                                      "pos": card.pos})

            try:
                target_list = origin_lists[int(data["listId"])]
            except KeyError:
                target_list = List.query.filter_by(id=data["listId"]).first()

            if target_list.project_id != int(data["projectId"]):
                return

            for card in cards:
                card.list_id = int(data["listId"])

            for card in target_list.cards:
                if card in cards:
                    continue
                if card.pos < int(data["pos"]) or (card.pos == int(data["pos"])
                                                   and cards_to_move_inside_target_list_that_where_before_insert_point):
                    card.pos -= cards_to_move_inside_target_list_that_where_before_insert_point
                else:
                    resp["otherCardsPosChanges"].append([card.id, card.list_id, current_pos])
                    card.pos += current_pos

            db.session.commit()

            for list_ in origin_lists.values():
                pos = 0
                for card in list_.cards.order_by(Card.pos):
                    if card.pos != pos:
                        resp["otherCardsPosChanges"].append([card.id, card.list_id, pos-card.pos])
                        card.pos = pos
                    pos += 1

            db.session.commit()

            emit("move_cards_successful", room=request.sid)
            emit("update_cards_pos", resp, room=int(data["projectId"]))

    @staticmethod
    def on_edit_card(data):
        if data["projectId"] in rooms():
            card_to_edit = Card.query.filter_by(id=data["id"]).first()

            if card_to_edit.list.project_id != data["projectId"]:
                return

            files_total = card_to_edit.attached_files.count() - len(data["removedAttachedFiles"]) + \
                len(data["newAttachedFiles"])
            if files_total > SocketIOProjectNamespace.MAX_ATTACHED_FILES_PER_LIST_OR_CARD:
                return

            card_to_edit.name = data["name"]
            card_to_edit.card_desc = data["cardDesc"]

            removed_attached_files = []
            new_attached_files = []

            for file_name in data["removedAttachedFiles"]:
                file = CardAttachedFile.query.filter_by(card_id=card_to_edit.id, name=file_name).first()
                _, key = split_s3_obj_url(file.url)
                s3_cli.delete_object(Bucket=app.config["S3_BUCKET_NAME"], Key=key)
                db.session.delete(file)
                removed_attached_files.append(file_name)

            for file_name, binary in data["replacedAttachedFiles"].items():
                if sys.getsizeof(binary) > 10485760:
                    return
                file_url = CardAttachedFile.query.filter_by(card_id=card_to_edit.id, name=file_name).first().url
                _, key = split_s3_obj_url(file_url)
                s3_cli.put_object(Body=binary, Bucket=app.config["S3_BUCKET_NAME"], Key=key, ACL='public-read',
                                  CacheControl='no-store',
                                  ContentDisposition=f'attachment; filename="{file_name}"')

            for file_name, binary in data["newAttachedFiles"].items():
                if sys.getsizeof(binary) > 10485760:
                    return
                key = uuid4().hex
                s3_cli.put_object(Body=binary, Bucket=app.config["S3_BUCKET_NAME"], Key=key, ACL='public-read',
                                  CacheControl='no-store',
                                  ContentDisposition=f'attachment; filename="{file_name}"')
                db.session.add(CardAttachedFile(card_to_edit.id, app.config["S3_BUCKET_URL"] + "/" + key, file_name))
                new_attached_files.append([file_name, app.config["S3_BUCKET_URL"] + "/" + key])

            new_card_members = []
            removed_card_members = []

            for user_id in data["newMembers"]:
                new_card_members.append(user_id)
                db.session.add(CardUserAssignment(card_to_edit.id, user_id))

            for user_id in data["removedMembers"]:
                removed_card_members.append(user_id)
                CardUserAssignment.query.filter_by(card_id=card_to_edit.id, user_id=user_id).delete()

            db.session.commit()

            emit("edit_card_successful", room=request.sid)

            emit("update_card",
                 {"id": data["id"],
                  "listId": data["listId"],
                  "name": data["name"],
                  "cardDesc": data["cardDesc"],
                  "removedAttachedFiles": removed_attached_files,
                  "newAttachedFiles": new_attached_files,
                  "newMembers": new_card_members,
                  "removedMembers": removed_card_members},
                 room=int(data["projectId"]))

    @staticmethod
    def on_delete_card(data):
        if data["projectId"] in rooms():
            card_to_remove = Card.query.filter_by(id=data["id"]).first()

            if card_to_remove.list.project_id != data["projectId"]:
                return

            for file in card_to_remove.attached_files:
                _, key = split_s3_obj_url(file.url)
                s3_cli.delete_object(Bucket=app.config["S3_BUCKET_NAME"], Key=key)
                db.session.delete(file)

            cards_pos_changes = []

            for card in card_to_remove.list.cards:
                if card.pos > card_to_remove.pos:
                    card.pos -= 1
                    cards_pos_changes.append([card.id, -1])

            CardUserAssignment.query.filter_by(card_id=card_to_remove.id).delete()

            db.session.delete(card_to_remove)

            db.session.commit()

            emit("delete_card_successful", room=request.sid)

            emit("remove_card",
                 {"id": data["id"],
                  "listId": data["listId"],
                  "cardsPosChanges": cards_pos_changes},
                 room=int(data["projectId"]))

    @staticmethod
    def on_add_friend_to_project(data):
        if data["projectId"] in rooms() and current_user.is_project_owner_of(data["projectId"]):
            project = Project.query.filter_by(id=data["projectId"]).first()

            friend = User.get_by_name_or_email(data["friendNameOrEmail"])

            if not friend or not current_user.is_friend_with(friend.id) or \
                    friend.is_project_collaborator_of(project.id):
                emit("add_friend_to_project_error_invalid_target", room=request.sid)
                return

            if data["role"] != "admin" and data["role"] != "access-only":
                return

            db.session.add(ProjectCollaboratorLink(data["projectId"], friend.id, data["role"]))

            project_chat_group = project.chat_group.first()
            if project_chat_group:

                member_data = {friend.id: {
                                  "id": friend.id,
                                  "role": "default",
                                  "name": friend.name,
                                  "picUrl": friend.small_avatar_url,
                                  "goToUrl": f"/{friend.name}"
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

                    emit("new_chat_group_member",
                         {"chatGroupId": project_chat_group.id,
                          "chatGroupType": "projectChatGroup",
                          "member": {"id": friend.id,
                                     "name": friend.name,
                                     "picUrl": friend.small_avatar_url,
                                     "goToUrl": f"/{friend.name}",
                                     "role": "default"}
                          },
                         namespace="/",
                         room=member_user.id)

                db.session.add(ProjectChatGroupMemberLink(project_chat_group.id, friend.id, "default"))

                last_msg = current_user.get_last_msg(project_chat_group.id, "projectChatGroup")
                last_msg = {"content": last_msg.content,
                            "datetime": f"{last_msg.datetime}+00:00"} if last_msg else "None"

                emit("new_chat_group",
                     {"id": project_chat_group.id,
                      "type": "projectChatGroup",
                      "name": project_chat_group.name,
                      "unreadCount": 0,
                      "lastMsg": last_msg,
                      "picUrl": "/static/img/group.png",
                      "roleOfCurrentUser": "default",
                      "members": member_data
                      },
                     room=friend.id,
                     namespace="/")

            db.session.commit()

            emit("successfully_added_friend_to_project", room=request.sid)

            emit("new_project_collab",
                 {"id": friend.id,
                  "name": friend.name,
                  "picUrl": friend.small_avatar_url,
                  "goToUrl": f"/{friend.name}",
                  "role": data["role"]},
                 room=data["projectId"])

            emit("now_collab_of_project",
                 {"id": data["projectId"],
                  "name": project.name,
                  "ownerName": project.owner_name,
                  "goToUrl": f"/{project.owner_name}/{project.name}"},
                 namespace="/",
                 room=friend.id)

    @staticmethod
    def on_change_user_role(data):
        if current_user.is_project_owner_of(data["projectId"]) \
                and data["newRole"] == "admin" or data["newRole"] == "access-only":

            collab_link = ProjectCollaboratorLink.query.filter_by(project_id=data["projectId"], user_id=data["userId"])\
                .first()

            if not collab_link:
                return

            collab_link.user_role = data["newRole"]
            db.session.commit()

            emit("successfully_changed_user_role", room=request.sid)
            emit("force_reload", namespace="/", room=int(data["userId"]))

    @staticmethod
    def on_remove_user_from_project(data):
        current_user_is_project_owner = current_user.is_project_owner_of(data["projectId"])
        if data["projectId"] in rooms() and \
                (current_user_is_project_owner or
                 (current_user.id == data["userId"] and not current_user_is_project_owner)):

            ProjectCollaboratorLink.query.filter_by(project_id=data["projectId"], user_id=data["userId"]).delete()
            CardUserAssignment.query\
                .filter(CardUserAssignment.user_id == data["userId"],
                        CardUserAssignment.card_id.in_(db.session.query(Card.id)
                                                       .filter(Card.list_id.in_(db.session.query(List.id)
                                                                                .filter(List.project_id ==
                                                                                        data["projectId"])
                                                                                )
                                                               )
                                                       )
                        ).delete(synchronize_session=False)

            project_chat_group = ProjectChatGroup.query.filter_by(project_id=data["projectId"]).first()
            if project_chat_group:
                ProjectChatGroupMemberLink.query.filter_by(project_chat_group_id=project_chat_group.id,
                                                           user_id=data["userId"]).delete()

                emit("chat_group_removed",
                     {"id": project_chat_group.id, "type": "projectChatGroup"},
                     namespace="/",
                     room=int(data["userId"]))

                for member in project_chat_group.get_members_with_only_id_entities():
                    if member.user_id != data["userId"]:
                        emit("chat_group_member_removed",
                             {"chatGroupId": project_chat_group.id,
                              "chatGroupType": "projectChatGroup",
                              "userId": data["userId"]
                              },
                             namespace="/",
                             room=member.user_id)

            db.session.commit()

            if current_user.id == data["userId"]:
                emit("successfully_left_project", room=request.sid)
            else:
                emit("successfully_removed_project_collab", room=request.sid)

            emit("project_collab_removed",
                 {"id": data["userId"]},
                 room=int(data["projectId"]))

            emit("removed_as_collab_of_project", data["projectId"], room=int(data["userId"]), namespace="/",)

    @staticmethod
    def on_change_project_owner(data):
        if data["projectId"] in rooms() and current_user.is_project_owner_of(data["projectId"]):
            project = Project.query.filter_by(id=data["projectId"]).first()

            new_owner_user = User.get_by_name_or_email(data["nameOrEmail"])

            if not new_owner_user or not new_owner_user.is_project_collaborator_of(data["projectId"]) \
                    or Project.query.filter_by(owner_name=new_owner_user.name).scalar():
                emit("change_project_owner_error_invalid_target", room=request.sid)
                return

            ProjectCollaboratorLink.query.filter_by(project_id=data["projectId"], user_id=new_owner_user.id).delete()
            project.owner_name = new_owner_user.name
            db.session.add(ProjectCollaboratorLink(data["projectId"], current_user.id, "admin"))
            db.session.commit()

            project_data = {
                "projectId": project.id,
                "name": project.name,
                "ownerName": project.owner_name,
                "projectDesc": project.project_desc
            }

            for collab in db.session.query(ProjectCollaboratorLink.user_id).filter_by(project_id=project.id).all():
                emit("update_project_attributes",
                     project_data,
                     room=collab.user_id,
                     namespace="/")

            emit("update_project_attributes",
                 project_data,
                 room=new_owner_user.id,
                 namespace="/")

            emit("force_reload", room=current_user.id, namespace="/")
            emit("force_reload", room=new_owner_user.id, namespace="/")

    @staticmethod
    def on_create_project_chat_group(data):
        if data["projectId"] not in rooms() or not current_user.is_project_owner_of(data["projectId"]):
            return

        project = Project.query.filter_by(id=data["projectId"]).first()

        project_chat_group = ProjectChatGroup(f"{project.owner_name}/{project.name}", project.id)
        db.session.add(project_chat_group)
        db.session.flush()

        db.session.add(ProjectChatGroupMemberLink(project_chat_group.id, current_user.id, "default"))

        members = {
            current_user.id: {"id": current_user.id,
                              "role": "default",
                              "name": current_user.name,
                              "picUrl": current_user.small_avatar_url,
                              "goToUrl": f"/{current_user.name}"}
        }

        for user in db.session.query(User)\
                .filter(User.id.in_(
                                    db.session.query(ProjectCollaboratorLink.user_id)
                                    .filter_by(project_id=project.id))
                        ):

            db.session.add(ProjectChatGroupMemberLink(project_chat_group.id, user.id, "default"))

            members[user.id] = {
                "id": user.id,
                "role": "default",
                "name": user.name,
                "picUrl": user.small_avatar_url,
                "goToUrl": f"/{user.name}"
            }

        db.session.commit()

        emit("successfully_created_project_chat_group", room=request.sid)

        for key in members.keys():
            emit("new_chat_group",
                 {"id": project_chat_group.id,
                  "type": "projectChatGroup",
                  "name": project_chat_group.name,
                  "unreadCount": 0,
                  "lastMsg": "None",
                  "picUrl": "/static/img/group.png",
                  "roleOfCurrentUser": "default",
                  "members": members,
                  "msgs": []},
                 room=int(key),
                 namespace="/")

    @staticmethod
    def on_delete_project_chat_group(data):
        if data["projectId"] in rooms() and current_user.is_project_owner_of(data["projectId"]):

            project_chat_group = ProjectChatGroup.query.filter_by(project_id=data["projectId"]).first()

            members = project_chat_group.get_members_with_only_id_entities()

            ProjectChatGroupMsgStatus.query.filter_by(project_chat_group_id=project_chat_group.id).delete()
            ProjectChatGroupMsg.query.filter_by(project_chat_group_id=project_chat_group.id).delete()
            project_chat_group.member_links.delete()
            db.session.delete(project_chat_group)

            db.session.commit()

            emit("successfully_deleted_project_chat_group", room=request.sid)

            for member in members:
                emit("chat_group_removed",
                     {"id": project_chat_group.id, "type": "projectChatGroup"},
                     room=member.user_id,
                     namespace="/")

    @staticmethod
    def on_change_project_visibility(data):
        if data["projectId"] in rooms() and current_user.is_project_owner_of(data["projectId"]):
            Project.query.filter_by(id=data["projectId"])\
                .update({Project.visibility: data["value"]})
            db.session.commit()

            emit("successfully_changed_project_visibility", room=request.sid)

            emit("update_project_visibility", data["value"], room=data["projectId"])
