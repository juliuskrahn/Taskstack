from flask_socketio import Namespace, join_room, emit
from flask_login import current_user
from app import db
from app.db_models import User, ChatGroup, ProjectChatGroup, Msg, ChatGroupMsg, ChatGroupMsgStatus, \
    ProjectChatGroupMsg, ProjectChatGroupMsgStatus, ChatGroupMemberLink, FriendshipRequest, Friendship


SOCKET_IO_GLOBAL_NAMESPACE_NAME = "/"


class SocketIOGlobalNamespace(Namespace):
    """
    rooms: <user id>: int

    emitted events:

    """

    @staticmethod
    def on_connect():
        if current_user.is_authenticated():
            join_room(current_user.id)
            return True
        return False

    @staticmethod
    def on_send_msg(data):
        if data["chatType"] == "userToUser":
            if not current_user.is_friend_with(data["chatId"]):
                return

            msg = Msg(current_user.id, data["chatId"], data["content"])
            db.session.add(msg)
            db.session.commit()

            msg_data_to_emit = {"id": msg.id,
                                "type": "msg",
                                "chatType": "userToUser",
                                "picUrl": current_user.small_avatar_url,
                                "goToUrl": f"/{current_user.name}",
                                "goToChatUrl": f"/chat?with{current_user.name}",
                                "fromId": msg.from_id,
                                "fromName": current_user.name,
                                "toId": msg.to_id,
                                "content": msg.content,
                                "datetime": f"{msg.datetime}+00:00"}

            receiver_user_ids = [msg.to_id]

        elif data["chatType"] == "chatGroup":
            chat_group = ChatGroup.query.filter_by(id=data["chatId"]).first()
            members = chat_group.get_members_with_only_id_entities()

            for member in members:
                if current_user.id == member.user_id:
                    break
            else:  # no break
                return

            msg = ChatGroupMsg(chat_group.id, current_user.id, data["content"])
            db.session.add(msg)
            db.session.flush()

            db.session.add(ChatGroupMsgStatus(current_user.id, chat_group.id, msg.id, True))

            receiver_user_ids = []

            for member in members:
                if not member.user_id == current_user.id:
                    db.session.add(ChatGroupMsgStatus(member.user_id, chat_group.id, msg.id, False))
                    receiver_user_ids.append(member.user_id)

            db.session.commit()

            msg_data_to_emit = {"id": msg.id,
                                "type": "msg",
                                "chatGroupId": chat_group.id,
                                "goToChatUrl": f"/chat",
                                "picUrl": current_user.small_avatar_url,
                                "goToUrl": f"/{current_user.name}",
                                "fromId": msg.from_id,
                                "fromName": current_user.name,
                                "content": msg.content,
                                "datetime": f"{msg.datetime}+00:00"}

        elif data["chatType"] == "projectChatGroup":
            chat_group = ProjectChatGroup.query.filter_by(id=data["chatId"]).first()
            members = chat_group.get_members_with_only_id_entities()

            for member in members:
                if current_user.id == member.user_id:
                    break
            else:  # no break
                return

            msg = ProjectChatGroupMsg(chat_group.id, current_user.id, data["content"])
            db.session.add(msg)
            db.session.flush()

            db.session.add(ProjectChatGroupMsgStatus(current_user.id, chat_group.id, msg.id, True))

            receiver_user_ids = []

            for member in members:
                if not member.user_id == current_user.id:
                    db.session.add(ProjectChatGroupMsgStatus(member.user_id, chat_group.id, msg.id, False))
                    receiver_user_ids.append(member.user_id)

            db.session.commit()

            msg_data_to_emit = {"id": msg.id,
                                "type": "msg",
                                "projectChatGroupId": chat_group.id,
                                "goToChatUrl": f"/chat",
                                "picUrl": current_user.small_avatar_url,
                                "goToUrl": f"/{current_user.name}",
                                "fromId": msg.from_id,
                                "fromName": current_user.name,
                                "content": msg.content,
                                "datetime": f"{msg.datetime}+00:00"}

        else:
            return

        emit("successfully_sent_msg", msg_data_to_emit, room=current_user.id)

        for id_ in receiver_user_ids:
            emit("receive_msg", msg_data_to_emit, room=id_)

    @staticmethod
    def on_mark_msgs_as_read(data):
        current_user.mark_msgs_as_read_in_chat(data["chatId"], data["chatType"])
        db.session.commit()

    @staticmethod
    def on_mark_msg_as_read(data):
        if data["chatType"] == "userToUser":
            msg = Msg.query.filter_by(id=data["id"]).first()

            if current_user.id == msg.to_id:
                msg.seen = True
                db.session.commit()

        elif data["chatType"] == "chatGroup":
            msg_status = ChatGroupMsgStatus.query.filter_by(chat_group_msg_id=data["id"], user_id=current_user.id)\
                .first()
            msg_status.seen = True
            db.session.commit()

        elif data["chatType"] == "projectChatGroup":
            msg_status = ProjectChatGroupMsgStatus.query.filter_by(project_chat_group_msg_id=data["id"],
                                                                   user_id=current_user.id) \
                .first()
            msg_status.seen = True
            db.session.commit()

    @staticmethod
    def on_accept_freq(data):
        freq = FriendshipRequest.query.filter_by(id=data["id"]).first()

        if freq.to_id == current_user.id:
            from_user = User.get_by_id(freq.from_id)

            new_friendship1 = Friendship(freq.from_id, freq.to_id)
            new_friendship2 = Friendship(freq.to_id, freq.from_id)
            db.session.add(new_friendship1)
            db.session.add(new_friendship2)

            emit("remove_friendship_request", data["id"], room=current_user.id)

            emit("new_friend",
                 {"id": from_user.id,
                  "name": from_user.name,
                  "unreadCount": 0,
                  "lastMsg": "None",
                  "picUrl": from_user.small_avatar_url,
                  "goToUrl": f"/{from_user.name}"},
                 room=current_user.id)

            emit("new_friend",
                 {"id": current_user.id,
                  "name": current_user.name,
                  "unreadCount": 0,
                  "lastMsg": "None",
                  "picUrl": current_user.small_avatar_url,
                  "goToUrl": f"/{current_user.name}"},
                 room=from_user.id)

            db.session.delete(freq)
            db.session.commit()

    @staticmethod
    def on_dont_accept_freq(data):
        freq = FriendshipRequest.query.filter_by(id=data["id"]).first()
        if freq.to_id == current_user.id:
            db.session.delete(freq)
            db.session.commit()

            emit("remove_friendship_request", data["id"], room=current_user.id)

    @staticmethod
    def on_create_chat_group(name):
        group = ChatGroup(name)
        db.session.add(group)
        db.session.flush()
        member_link = ChatGroupMemberLink(group.id, current_user.id, "admin")
        db.session.add(member_link)
        db.session.commit()

        emit("successfully_created_chat_group", room=current_user.id)

        emit("new_chat_group",
             {"id": group.id,
              "type": "chatGroup",
              "name": group.name,
              "unreadCount": 0,
              "lastMsg": "None",
              "picUrl": "/static/img/group.png",
              "roleOfCurrentUser": "admin",
              "members": {
                  current_user.id: {
                      "id": current_user.id,
                      "role": "admin",
                      "name": current_user.name,
                      "picUrl": current_user.small_avatar_url,
                      "goToUrl": f"/{current_user.name}"
                  }
              },
              "msgs": []},
             room=current_user.id)

    @staticmethod
    def on_edit_chat_group_name(data):
        current_user_member_link = ChatGroupMemberLink.query.filter_by(user_id=current_user.id,
                                                                       chat_group_id=data["chatGroupId"])\
            .first()
        if not current_user_member_link or current_user_member_link.user_role != "admin":
            return

        chat_group = ChatGroup.query.filter_by(id=data["chatGroupId"]).first()
        chat_group.name = data["newName"]
        db.session.commit()

        for member in chat_group.get_members_with_only_id_entities():
            emit("update_chat_group_name",
                 {"id": chat_group.id,
                  "type": "chatGroup",
                  "newName": chat_group.name},
                 room=member.user_id)

        emit("successfully_edited_chat_group_name", room=current_user.id)

    @staticmethod
    def on_delete_chat_group(id_):
        current_user_member_link = ChatGroupMemberLink.query.filter_by(user_id=current_user.id, chat_group_id=id_)\
            .first()
        if not current_user_member_link or current_user_member_link.user_role != "admin":
            return

        chat_group = ChatGroup.query.filter_by(id=id_).first()

        members = chat_group.get_members_with_only_id_entities()

        ChatGroupMsgStatus.query.filter_by(chat_group_id=id_).delete()
        ChatGroupMsg.query.filter_by(chat_group_id=id_).delete()
        chat_group.member_links.delete()
        db.session.delete(chat_group)

        db.session.commit()

        for member in members:
            emit("chat_group_removed", {"id": id_, "type": "chatGroup"}, room=member.user_id)

        emit("successfully_deleted_chat_group", room=current_user.id)

    @staticmethod
    def on_add_friend_to_chat_group(data):
        current_user_member_link = ChatGroupMemberLink.query.filter_by(user_id=current_user.id,
                                                                       chat_group_id=data["chatGroupId"]) \
            .first()
        if not current_user_member_link or current_user_member_link.user_role != "admin":
            return

        friend = User.get_by_name_or_email(data["friendNameOrEmail"])

        if not friend \
                or ChatGroupMemberLink.query.filter_by(user_id=friend.id, chat_group_id=data["chatGroupId"]).scalar()\
                or not current_user.is_friend_with(friend.id):
            emit("add_friend_to_chat_group_error_invalid_target", room=current_user.id)
            return

        chat_group = ChatGroup.query.filter_by(id=data["chatGroupId"]).first()

        db.session.add(ChatGroupMemberLink(data["chatGroupId"], friend.id, "default"))
        db.session.commit()

        member_ids_to_emit_new_chat_group_member_info_to = []

        members = {}

        for member_user in db.session.query(ChatGroupMemberLink) \
                .filter_by(chat_group_id=chat_group.id) \
                .join(User, User.id == ChatGroupMemberLink.user_id)\
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

            if member_user.id != friend.id:
                member_ids_to_emit_new_chat_group_member_info_to.append(member_user.id)

        last_msg = friend.get_last_msg(chat_group.id, "chatGroup")

        emit("new_chat_group",
             {"id": chat_group.id,
              "type": "chatGroup",
              "name": chat_group.name,
              "unreadCount": friend.get_unread_count_in_chat(chat_group.id, "chatGroup"),
              "lastMsg": {"content": last_msg.content, "datetime": f"{last_msg.datetime}+00:00"} if last_msg
              else "None",
              "picUrl": "/static/img/group.png",
              "roleOfCurrentUser": "default",
              "members": members},
             room=friend.id)

        for id_ in member_ids_to_emit_new_chat_group_member_info_to:
            emit("new_chat_group_member",
                 {"chatGroupId": chat_group.id,
                  "chatGroupType": "chatGroup",
                  "member": {"id": friend.id,
                             "name": friend.name,
                             "picUrl": friend.small_avatar_url,
                             "goToUrl": f"/{friend.name}",
                             "role": "default"}
                  },
                 room=id_)

        emit("successfully_added_friend_to_chat_group", room=current_user.id)

    @staticmethod
    def on_remove_user_from_chat_group(data):
        remove_myself = data.get("removeMyself")

        if remove_myself:
            if current_user.id != data["userId"]:
                return

            emit("successfully_left_group", room=current_user.id)

        else:
            current_user_member_link = \
                ChatGroupMemberLink.query.filter_by(user_id=current_user.id, chat_group_id=data["chatGroupId"]).first()

            if current_user_member_link.user_role != "admin":
                return

        ChatGroupMsg.query.filter_by(from_id=data["userId"], chat_group_id=data["chatGroupId"]).delete()
        ChatGroupMsgStatus.query.filter_by(user_id=data["userId"], chat_group_id=data["chatGroupId"]).delete()
        ChatGroupMemberLink.query.filter_by(user_id=data["userId"], chat_group_id=data["chatGroupId"]).delete()

        if ChatGroupMemberLink.query.filter_by(chat_group_id=data["chatGroupId"]).count() == 0:
            ChatGroup.query.filter_by(id=data["chatGroupId"]).delete()

        db.session.commit()

        emit("chat_group_removed", {"id": data["chatGroupId"], "type": "chatGroup"}, room=int(data["userId"]))

        for member_data in db.session.query(ChatGroupMemberLink.user_id).filter_by(chat_group_id=data["chatGroupId"])\
                .all():
            emit("chat_group_member_removed",
                 {"userId": data["userId"],
                  "chatGroupId": data["chatGroupId"],
                  "chatGroupType": "chatGroup"},
                 room=member_data.user_id)

        if remove_myself:
            emit("successfully_left_group", room=current_user.id)
        else:
            emit("successfully_removed_user_from_chat_group", room=current_user.id)

    @staticmethod
    def on_change_chat_group_member_role(data):
        current_user_member_link = \
            ChatGroupMemberLink.query.filter_by(user_id=current_user.id, chat_group_id=data["chatGroupId"]).first()

        if current_user_member_link.user_role != "admin" or \
                (data["newRole"] != "admin" and data["newRole"] != "default"):
            return

        ChatGroupMemberLink.query.filter_by(user_id=data["id"], chat_group_id=data["chatGroupId"])\
            .update({ChatGroupMemberLink.user_role: data["newRole"]}, synchronize_session=False)
        db.session.commit()

        for member_data in db.session.query(ChatGroupMemberLink.user_id).filter_by(chat_group_id=data["chatGroupId"]) \
                .all():
            emit("update_chat_group_member_role",
                 {"chatGroupId": data["chatGroupId"],
                  "chatGroupType": "chatGroup",
                  "id": data["id"],
                  "newRole": data["newRole"]},
                 room=member_data.user_id)

        emit("successfully_changed_chat_group_member_role", room=current_user.id)
