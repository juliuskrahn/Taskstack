from flask import request, jsonify, abort
from flask_login import current_user
from app import app
from app.db_models import User


@app.route("/msgs")
def msgs():
    if not current_user.is_authenticated():
        abort(404)

    chat_id = request.args.get("chat-id")
    chat_type = request.args.get("chat-type")

    if not chat_id or not chat_type:
        abort(400)

    msgs_in_chat = current_user.get_msgs_ordered_asc_by_datetime(chat_id, chat_type)

    if chat_type == "userToUser":
        for i, msg in enumerate(msgs_in_chat):
            msgs_in_chat[i] = {
                "content": msg.content,
                "datetime": f"{msg.datetime}+00:00",
                "fromId": msg.from_id,
                "fromName": User.get_by_id(msg.from_id).name if msg.from_id is not current_user.id else
                current_user.name,
                "toId": msg.to_id
            }

    elif chat_type == "chatGroup" or chat_type == "projectChatGroup":
        for i, msg in enumerate(msgs_in_chat):
            msgs_in_chat[i] = {
                "content": msg.content,
                "datetime": f"{msg.datetime}+00:00",
                "fromId": msg.from_id,
                "fromName": User.get_by_id(msg.from_id).name if msg.from_id is not current_user.id else
                current_user.name
            }

    else:
        abort(400)

    return jsonify(msgs_in_chat), 200
