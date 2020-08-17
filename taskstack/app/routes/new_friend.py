from flask import request, redirect
from flask_login import current_user
from app import app, render_template, db, socketio
from app.db_models import User, Friendship, FriendshipRequest
import urllib.parse


@app.route("/new-friend", methods=["GET", "POST"])
def new_friend_page():
    if not current_user.is_authenticated():
        return redirect("/")

    continue_to = request.args.get("continue")
    if not continue_to:
        continue_to = "/"

    name = request.args.get("name")
    if not name:
        name = ""

    if request.method == "POST":
        form = request.form
        target = User.get_by_name_or_email(form["name"])

        if not target:
            return render_template("new_friend.html.j2",
                                   name_does_not_exist=True,
                                   continue_to=continue_to,
                                   post_to=f"/new-friend?continue={urllib.parse.quote(continue_to, safe='')}")

        if target.id == current_user.id \
                or Friendship.query.filter_by(user_id=current_user.id, friend_id=target.id).scalar() \
                or FriendshipRequest.query.filter_by(from_id=current_user.id, to_id=target.id).scalar():
            return render_template("new_friend.html.j2",
                                   invalid_target=True,
                                   continue_to=continue_to,
                                   post_to=f"/new-friend?continue={urllib.parse.quote(continue_to, safe='')}")

        if not target.block_all_friendship_requests:
            friendship_request = FriendshipRequest(current_user.id, target.id)
            db.session.add(friendship_request)
            db.session.commit()

            socketio.emit("receive_friendship_request",
                          {"id": friendship_request.id,
                           "type": "friendshipRequest",
                           "fromName": current_user.name,
                           "picUrl": current_user.small_avatar_url,
                           "goToUrl": f"/{current_user.name}",
                           "datetime": f"{friendship_request.datetime}+00:00"},
                          room=target.id,
                          namespace="/")

        return redirect(continue_to)

    return render_template("new_friend.html.j2",
                           continue_to=continue_to,
                           name=name)
