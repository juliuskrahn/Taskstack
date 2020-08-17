from sqlalchemy import or_, and_, asc
from sqlalchemy.sql.expression import func
from app import app, db
from secrets import token_urlsafe
import datetime
import random


class User(db.Model):
    __tablename__ = "user"

    id = db.Column("id", db.Integer(), primary_key=True, autoincrement=True, unique=True)
    name = db.Column("name", db.String(16), unique=True, nullable=False)
    email = db.Column("email", db.String(32), unique=True)
    avatar_url = db.Column("avatar_url", db.String(128), nullable=False)
    small_avatar_url = db.Column("small_avatar_url", db.String(128), nullable=False)
    profile_desc = db.Column("profile_desc", db.String(256), nullable=False)
    password_hash = db.Column("password_hash", db.String(128), nullable=False)

    # settings
    private = db.Column("private", db.Boolean, nullable=False)
    email_private = db.Column("email_private", db.Boolean, nullable=False)
    stay_logged_in = db.Column("stay_logged_in", db.Boolean, nullable=False)
    block_all_friendship_requests = db.Column("block_all_friendship_requests", db.Boolean, nullable=False)

    # technical
    sign_up_complete = db.Column("sign_up_complete", db.Boolean, nullable=False)
    token = db.Column("token", db.String(32), nullable=True)  # (anti-csrf token)
    email_pending_verification = db.Column("email_pending_verification", db.String(32), unique=True)
    email_verification_case_id = db.Column("email_verification_case_id", db.String(32), unique=True)
    email_verification_code = db.Column("email_verification_code", db.String(8))
    reset_password_case_id = db.Column("reset_password_case_id", db.String(32), unique=True)
    reset_password_code_hash = db.Column("reset_password_code_hash", db.String(128))

    # relations
    projects = db.relationship("Project", backref="owner_user", lazy="dynamic")
    project_collaboration_links = db.relationship("ProjectCollaboratorLink", backref="user", lazy="dynamic")
    chat_group_member_links = db.relationship("ChatGroupMemberLink", backref="user", lazy="dynamic")
    project_chat_group_member_links = db.relationship("ProjectChatGroupMemberLink", backref="user", lazy="dynamic")
    friendships = db.relationship("Friendship", backref="user", lazy="dynamic")
    incoming_freqs = db.relationship("FriendshipRequest", backref="receiver_user", lazy="dynamic")
    received_user_to_user_msgs = db.relationship("Msg", backref="receiver_user", lazy="dynamic")
    chat_group_msg_statuses = db.relationship("ChatGroupMsgStatus", backref="user", lazy="dynamic")
    project_chat_group_msg_statuses = db.relationship("ProjectChatGroupMsgStatus", backref="user", lazy="dynamic")
    card_assignments = db.relationship("CardUserAssignment", backref="user", lazy="dynamic")

    def __init__(self,
                 name,
                 email_pending_verification,
                 password_hash,
                 email_verification_case_id,
                 email_verification_code,
                 stay_logged_in):

        self.name = name
        self.email_pending_verification = email_pending_verification
        self.email_verification_case_id = email_verification_case_id
        self.email_verification_code = email_verification_code

        rand_n = random.randint(1, 4)
        self.avatar_url = f"{app.config['S3_STATIC_BUCKET_URL']}/default_avatar/{name[0].lower()}{rand_n}x.png"
        self.small_avatar_url = f"{app.config['S3_STATIC_BUCKET_URL']}/default_avatar/{name[0].lower()}{rand_n}s.png"

        self.password_hash = password_hash
        self.stay_logged_in = stay_logged_in

        self.email = None
        self.profile_desc = ""
        self.private = False
        self.email_private = True
        self.block_all_friendship_requests = False
        self.token = None
        self.sign_up_complete = False
        self.notifications = None

    @classmethod
    def get_by_name(cls, name):
        return cls.query.filter_by(name=name).first()

    @classmethod
    def get_by_id(cls, user_id):
        return cls.query.filter_by(id=user_id).first()

    @classmethod
    def get_by_name_or_email(cls, arg):
        user = cls.query.filter_by(name=arg).first()
        if user:
            return user
        return cls.query.filter_by(email=arg).first()

    def get_id(self):
        return self.id

    def is_authenticated(self):
        return self.sign_up_complete

    @staticmethod
    def is_active():
        return True

    @staticmethod
    def is_anonymous():
        return False

    def set_token(self):
        self.token = token_urlsafe(16)
        db.session.commit()
        return self.token

    def is_project_owner_or_collaborator_of(self, project_id):
        if self.projects.filter_by(id=project_id).scalar() \
                or self.project_collaboration_links.filter_by(project_id=project_id).scalar():
            return True
        return False

    def is_project_owner_of(self, project_id):
        if self.projects.filter_by(id=project_id).scalar():
            return True
        return False

    def is_project_collaborator_of(self, project_id):
        if self.project_collaboration_links.filter_by(project_id=project_id).scalar():
            return True
        return False

    def get_projects_where_is_collaborator(self):
        return db.session.query(Project) \
            .filter(
                Project.id.in_(
                    db.session.query(ProjectCollaboratorLink.project_id)
                    .filter(ProjectCollaboratorLink.user_id == self.id)
                )
            ).all()

    def get_friends(self):
        return db.session.query(User) \
            .filter(
                User.id.in_(
                    db.session.query(Friendship.friend_id).filter_by(user_id=self.id)
                )
            ).all()

    def get_chat_groups_where_member(self):
        return self.chat_group_member_links \
            .join(ChatGroup, ChatGroupMemberLink.chat_group_id == ChatGroup.id) \
            .with_entities(ChatGroupMemberLink.user_role,
                           ChatGroup.id,
                           ChatGroup.name)

    def get_project_chat_groups_where_member(self):
        return self.project_chat_group_member_links \
            .join(ProjectChatGroup, ProjectChatGroup.id == ProjectChatGroupMemberLink.project_chat_group_id) \
            .with_entities(ProjectChatGroupMemberLink.user_role,
                           ProjectChatGroup.id,
                           ProjectChatGroup.name)

    def is_friend_with(self, friend_id):
        if self.id == friend_id:
            return False
        if self.friendships.filter_by(friend_id=friend_id).scalar():
            return True
        return False

    def get_msgs_ordered_asc_by_datetime(self, chat_id, chat_type):
        if chat_type == "userToUser":
            return db.session.query(Msg).filter(or_(and_(Msg.from_id == self.id, Msg.to_id == chat_id),
                                                    and_(Msg.from_id == chat_id, Msg.to_id == self.id))) \
                .order_by(asc(Msg.datetime)).all()

        elif chat_type == "chatGroup":
            return ChatGroupMsg.query.filter_by(chat_group_id=chat_id) \
                .order_by(asc(ChatGroupMsg.datetime)).all()

        elif chat_type == "projectChatGroup":
            return ProjectChatGroupMsg.query.filter_by(project_chat_group_id=chat_id) \
                .order_by(asc(ProjectChatGroupMsg.datetime)).all()

        raise ValueError("Invalid chat type")

    def get_last_msg(self, chat_id, chat_type):
        if chat_type == "userToUser":
            query = db.session.query(Msg).filter(or_(and_(Msg.from_id == self.id, Msg.to_id == chat_id),
                                                     and_(Msg.from_id == chat_id, Msg.to_id == self.id)))
            return query.filter_by(datetime=db.session.query(func.max(query.subquery().c.datetime))).first()

        elif chat_type == "chatGroup":
            query = ChatGroupMsg.query.filter_by(chat_group_id=chat_id)
            return query.filter_by(datetime=db.session.query(func.max(query.subquery().c.datetime))).first()

        elif chat_type == "projectChatGroup":
            query = ProjectChatGroupMsg.query.filter_by(project_chat_group_id=chat_id)
            return query.filter_by(datetime=db.session.query(func.max(query.subquery().c.datetime))).first()

        raise ValueError("Invalid chat type")

    def get_unread_count_in_chat(self, chat_id, chat_type):
        if chat_type == "userToUser":
            return self.received_user_to_user_msgs.filter_by(seen=False, from_id=chat_id) \
                .count()

        elif chat_type == "chatGroup":
            return self.chat_group_msg_statuses.filter_by(seen=False, chat_group_id=chat_id) \
                .count()

        elif chat_type == "projectChatGroup":
            return self.project_chat_group_msg_statuses.filter_by(seen=False, project_chat_group_id=chat_id) \
                .count()

        raise ValueError("Invalid chat type")

    def get_notifications_count(self):
        unread_user_user_to_user_msgs_count = self.received_user_to_user_msgs.filter_by(seen=False).count()
        if not isinstance(unread_user_user_to_user_msgs_count, int):
            unread_user_user_to_user_msgs_count = 0

        unread_chat_group_msgs_count = self.chat_group_msg_statuses.filter_by(seen=False).count()
        if not isinstance(unread_chat_group_msgs_count, int):
            unread_chat_group_msgs_count = 0

        unread_project_chat_group_msgs_count = self.project_chat_group_msg_statuses.filter_by(seen=False).count()
        if not isinstance(unread_project_chat_group_msgs_count, int):
            unread_project_chat_group_msgs_count = 0

        freqs_count = self.incoming_freqs.count()
        if not isinstance(freqs_count, int):
            freqs_count = 0

        return unread_user_user_to_user_msgs_count + unread_chat_group_msgs_count + \
            unread_project_chat_group_msgs_count + freqs_count

    def get_notifications(self):
        return \
            self.received_user_to_user_msgs.filter_by(seen=False).all() \
            + \
            db.session.query(ChatGroupMsg)\
            .filter(ChatGroupMsg.id.in_(db.session.query(ChatGroupMsgStatus.chat_group_msg_id)
                                        .filter_by(user_id=self.id, seen=False))) \
            .all() \
            + \
            db.session.query(ProjectChatGroupMsg)\
            .filter(ProjectChatGroupMsg.id.in_(db.session.query(ProjectChatGroupMsgStatus.project_chat_group_msg_id)
                                               .filter_by(user_id=self.id, seen=False))) \
            .all() \
            + \
            FriendshipRequest.query.filter_by(to_id=self.id).all()

    def mark_msgs_as_read_in_chat(self, chat_id, chat_type):
        if chat_type == "userToUser":
            self.received_user_to_user_msgs.update({Msg.seen: True}, synchronize_session=False)

        elif chat_type == "chatGroup":
            self.chat_group_msg_statuses.filter_by(chat_group_id=chat_id) \
                .update({ChatGroupMsgStatus.seen: True}, synchronize_session=False)

        elif chat_type == "projectChatGroup":
            self.project_chat_group_msg_statuses.filter_by(project_chat_group_id=chat_id) \
                .update({ProjectChatGroupMsgStatus.seen: True}, synchronize_session=False)

        else:
            raise ValueError("Invalid chat type")


class Friendship(db.Model):
    __tablename__ = "friendship"
    id = db.Column("id", db.Integer(), primary_key=True, autoincrement=True, unique=True)
    user_id = db.Column("user_id", db.Integer(), db.ForeignKey("user.id"), nullable=False)
    friend_id = db.Column("friend_id", db.Integer(), nullable=False)

    def __init__(self, user_id, friend_id):
        self.user_id = user_id
        self.friend_id = friend_id


class FriendshipRequest(db.Model):
    __tablename__ = "friendship_request"
    id = db.Column("id", db.Integer(), primary_key=True, autoincrement=True, unique=True)
    from_id = db.Column("from_id", db.Integer(), nullable=False)
    to_id = db.Column("to_id", db.Integer(), db.ForeignKey("user.id"), nullable=False)
    datetime = db.Column("datetime", db.DateTime(), nullable=False)

    def __init__(self, from_id, to_id):
        self.from_id = from_id
        self.to_id = to_id
        self.datetime = datetime.datetime.utcnow()


class Msg(db.Model):
    __tablename__ = "msg"
    id = db.Column("id", db.Integer(), primary_key=True, autoincrement=True, unique=True)
    content = db.Column("content", db.String(1024), nullable=False)
    from_id = db.Column("from_id", db.Integer(), nullable=False)
    to_id = db.Column("to_id", db.Integer(), db.ForeignKey("user.id"), nullable=False)
    datetime = db.Column("datetime", db.DateTime(), nullable=False)
    seen = db.Column("seen", db.Boolean, nullable=False)

    def __init__(self, from_id, to_id, content):
        self.from_id = from_id
        self.to_id = to_id
        self.content = content
        self.datetime = datetime.datetime.utcnow()
        self.seen = False


class Project(db.Model):
    __tablename__ = "project"
    id = db.Column("id", db.Integer(), primary_key=True, autoincrement=True, unique=True)
    name = db.Column("name", db.String(32), nullable=False)
    owner_name = db.Column("owner_name", db.String(16), db.ForeignKey("user.name"), nullable=False)
    project_desc = db.Column("project_desc", db.String(128), nullable=False)
    visibility = db.Column("visibility", db.String(16), nullable=False)  # public | friends | private
    invite_code = db.Column("invite_code", db.String(32), unique=True, nullable=False)
    invite_as_admin_code = db.Column("invite_as_admin_code", db.String(32), unique=True, nullable=False)
    lists = db.relationship("List", backref="project", lazy="dynamic")
    collab_links = db.relationship("ProjectCollaboratorLink", backref="project", lazy="dynamic")
    chat_group = db.relationship("ProjectChatGroup", backref="project", lazy="dynamic")

    def __init__(self, owner_name, name, project_desc, visibility):
        self.owner_name = owner_name
        self.name = name
        self.project_desc = project_desc
        self.visibility = visibility
        self.invite_code = token_urlsafe(16)
        self.invite_as_admin_code = token_urlsafe(16)


class ProjectCollaboratorLink(db.Model):
    __tablename__ = "project_collaborator_link"
    id = db.Column("id", db.Integer(), primary_key=True, autoincrement=True, unique=True)
    project_id = db.Column("project_id", db.Integer(), db.ForeignKey("project.id"), nullable=False)
    user_id = db.Column("user_id", db.String(16), db.ForeignKey("user.id"), nullable=False)
    user_role = db.Column("user_role", db.String(32), nullable=False)  # admin | access-only

    def __init__(self, project_id, user_id, user_role):
        self.project_id = project_id
        self.user_id = user_id
        self.user_role = user_role


class List(db.Model):
    __tablename__ = "list"
    id = db.Column("id", db.Integer(), primary_key=True, autoincrement=True, unique=True)
    project_id = db.Column("project_id", db.Integer(), db.ForeignKey("project.id"), nullable=False)
    name = db.Column("name", db.String(16), nullable=False)
    list_desc = db.Column("list_desc", db.String(1024), nullable=False)
    pos = db.Column("pos", db.Integer(), nullable=False)
    cards = db.relationship("Card", backref="list", lazy="dynamic")
    attached_files = db.relationship("ListAttachedFile", backref="list", lazy="dynamic")

    def __init__(self, project_id, name, list_desc, pos):
        self.project_id = project_id
        self.name = name
        self.list_desc = list_desc
        self.pos = pos


class ListAttachedFile(db.Model):
    __tablename__ = "list_attached_file"
    id = db.Column("id", db.Integer(), primary_key=True, autoincrement=True, unique=True)
    list_id = db.Column("list_id", db.Integer(), db.ForeignKey("list.id"), nullable=False)
    url = db.Column("url", db.String(256), primary_key=True, nullable=False, unique=True)
    name = db.Column("name", db.String(128), nullable=False)

    def __init__(self, list_id, url, name):
        self.list_id = list_id
        self.url = url
        self.name = name


class Card(db.Model):
    __tablename__ = "card"
    id = db.Column("id", db.Integer(), primary_key=True, autoincrement=True, unique=True)
    list_id = db.Column("list_id", db.Integer(), db.ForeignKey("list.id"), nullable=False)
    name = db.Column("name", db.String(16), nullable=False)
    card_desc = db.Column("card_desc", db.String(1024), nullable=False)
    img_url = db.Column("img_url", db.String(256))
    pos = db.Column("pos", db.Integer(), nullable=False)
    attached_files = db.relationship("CardAttachedFile", backref="card", lazy="dynamic")
    user_assignments = db.relationship("CardUserAssignment", backref="card", lazy="dynamic")

    def __init__(self, list_id, name, card_desc, pos):
        self.list_id = list_id
        self.name = name
        self.card_desc = card_desc
        self.img_url = None
        self.pos = pos


class CardUserAssignment(db.Model):
    __tablename__ = "card_user_assignment"
    id = db.Column("id", db.Integer(), primary_key=True, autoincrement=True, unique=True)
    card_id = db.Column("card_id", db.Integer(), db.ForeignKey("card.id"), nullable=False)
    user_id = db.Column("user_id", db.Integer(), db.ForeignKey("user.id"), nullable=False)

    def __init__(self, card_id, user_id):
        self.card_id = card_id
        self.user_id = user_id


class CardAttachedFile(db.Model):
    __tablename__ = "card_attached_file"
    id = db.Column("id", db.Integer(), primary_key=True, autoincrement=True, unique=True)
    card_id = db.Column("card_id", db.Integer(), db.ForeignKey("card.id"), nullable=False)
    url = db.Column("url", db.String(256), primary_key=True, nullable=False, unique=True)
    name = db.Column("name", db.String(128), nullable=False)

    def __init__(self, card_id, url, name):
        self.card_id = card_id
        self.url = url
        self.name = name


class ChatGroup(db.Model):
    __tablename__ = "chat_group"
    id = db.Column("id", db.Integer(), primary_key=True, autoincrement=True, unique=True)
    name = db.Column("name", db.String(32), nullable=False)
    member_links = db.relationship("ChatGroupMemberLink", backref="chat_group", lazy="dynamic")

    def __init__(self, name):
        self.name = name

    def get_members_with_only_id_entities(self):
        return self.member_links.with_entities(ChatGroupMemberLink.user_id).all()


class ChatGroupMemberLink(db.Model):
    __tablename__ = "chat_group_member_link"
    id = db.Column("id", db.Integer(), primary_key=True, autoincrement=True, unique=True)
    chat_group_id = db.Column("chat_group_id", db.Integer(), db.ForeignKey("chat_group.id"), nullable=False)
    user_id = db.Column("user_id", db.String(16), db.ForeignKey("user.id"), nullable=False)
    user_role = db.Column("user_role", db.String(32), nullable=False)  # admin | default

    def __init__(self, chat_group_id, user_id, user_role):
        self.chat_group_id = chat_group_id
        self.user_id = user_id
        self.user_role = user_role


class ProjectChatGroup(db.Model):
    __tablename__ = "project_chat_group"
    id = db.Column("id", db.Integer(), primary_key=True, autoincrement=True, unique=True)
    name = db.Column("name", db.String(32), nullable=False)
    project_id = db.Column("project_id", db.Integer(), db.ForeignKey("project.id"), nullable=False)
    member_links = db.relationship("ProjectChatGroupMemberLink", backref="project_chat_group", lazy="dynamic")

    def __init__(self, name, project_id):
        self.name = name
        self.project_id = project_id

    def get_members_with_only_id_entities(self):
        return self.member_links.with_entities(ProjectChatGroupMemberLink.user_id).all()


class ProjectChatGroupMemberLink(db.Model):
    __tablename__ = "project_chat_group_member_link"
    id = db.Column("id", db.Integer(), primary_key=True, autoincrement=True, unique=True)
    project_chat_group_id = db.Column("project_chat_group_id", db.Integer(), db.ForeignKey("project_chat_group.id"),
                                      nullable=False)
    user_id = db.Column("user_id", db.String(16), db.ForeignKey("user.id"), nullable=False)
    user_role = db.Column("user_role", db.String(32), nullable=False)  # admin | default

    def __init__(self, project_chat_group_id, user_id, user_role):
        self.project_chat_group_id = project_chat_group_id
        self.user_id = user_id
        self.user_role = user_role


class ChatGroupMsg(db.Model):
    __tablename__ = "chat_group_msg"
    id = db.Column("id", db.Integer(), primary_key=True, autoincrement=True, unique=True)
    chat_group_id = db.Column("chat_group_id", db.Integer(), db.ForeignKey("chat_group.id"), nullable=False)
    content = db.Column("content", db.String(1024), nullable=False)
    from_id = db.Column("from_id", db.Integer(), nullable=False)
    datetime = db.Column("datetime", db.DateTime(), nullable=False)

    def __init__(self, chat_group_id, from_id, content):
        self.chat_group_id = chat_group_id
        self.from_id = from_id
        self.content = content
        self.datetime = datetime.datetime.utcnow()


class ChatGroupMsgStatus(db.Model):
    __tablename__ = "chat_group_msg_status"
    id = db.Column("id", db.Integer(), primary_key=True, autoincrement=True, unique=True)
    user_id = db.Column("user_id", db.Integer(), db.ForeignKey("user.id"), nullable=False)
    chat_group_id = db.Column("chat_group_id", db.Integer(), nullable=False)
    chat_group_msg_id = db.Column("chat_group_msg_id", db.Integer(), nullable=False)
    seen = db.Column("seen", db.Boolean, nullable=False)

    def __init__(self, user_id, chat_group_id, chat_group_msg_id, seen):
        self.user_id = user_id
        self.chat_group_id = chat_group_id
        self.chat_group_msg_id = chat_group_msg_id
        self.seen = seen


class ProjectChatGroupMsg(db.Model):
    __tablename__ = "project_chat_group_msg"
    id = db.Column("id", db.Integer(), primary_key=True, autoincrement=True, unique=True)
    project_chat_group_id = db.Column("project_chat_group_id", db.Integer(), db.ForeignKey("project_chat_group.id"),
                                      nullable=False)
    content = db.Column("content", db.String(1024), nullable=False)
    from_id = db.Column("from_id", db.Integer(), nullable=False)
    datetime = db.Column("datetime", db.DateTime(), nullable=False)

    def __init__(self, project_chat_group_id, from_id, content):
        self.project_chat_group_id = project_chat_group_id
        self.from_id = from_id
        self.content = content
        self.datetime = datetime.datetime.utcnow()


class ProjectChatGroupMsgStatus(db.Model):
    __tablename__ = "project_chat_group_msg_status"
    id = db.Column("id", db.Integer(), primary_key=True, autoincrement=True, unique=True)
    user_id = db.Column("user_id", db.Integer(), db.ForeignKey("user.id"), nullable=False)
    project_chat_group_id = db.Column("project_chat_group_id", db.Integer(), nullable=False)
    project_chat_group_msg_id = db.Column("project_chat_group_msg_id", db.Integer(), nullable=False)
    seen = db.Column("seen", db.Boolean, nullable=False)

    def __init__(self, user_id, project_chat_group_id, project_chat_group_msg_id, seen):
        self.user_id = user_id
        self.project_chat_group_id = project_chat_group_id
        self.project_chat_group_msg_id = project_chat_group_msg_id
        self.seen = seen
