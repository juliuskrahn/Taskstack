from flask_login import LoginManager
from app.db_models import User


login_manager = LoginManager()


@login_manager.user_loader
def load_user(user_id):
    return User.get_by_id(user_id)


class AnonymousUser:
    """ needs to implement the same (instance) attributes as db_models.User """

    def __init__(self):
        self.id = None

        self.name = None
        self.email_pending_verification = None
        self.email_verification_case_id = None
        self.email_verification_code = None

        self.avatar_url = None
        self.small_avatar_url = None

        self.password_hash = None
        self.stay_logged_in = None

        self.email = None
        self.profile_desc = None
        self.private = None
        self.email_private = None
        self.block_all_friendship_requests = None
        self.token = None
        self.sign_up_complete = None
        self.notifications = None

    def get_id(self):
        return None

    def is_authenticated(self):
        return False

    @staticmethod
    def is_active():
        return True

    @staticmethod
    def is_anonymous():
        return True

    def set_token(self):
        return None

    def is_project_owner_or_collaborator_of(self, project_id):
        return None

    def is_project_owner_of(self, project_id):
        return None

    def is_project_collaborator_of(self, project_id):
        return None

    def get_projects_where_is_collaborator(self):
        return None

    def get_friends(self):
        return None

    def get_chat_groups_where_member(self):
        return None

    def get_project_chat_groups_where_member(self):
        return None

    def is_friend_with(self, friend_id):
        return None

    def get_msgs_ordered_asc_by_datetime(self, chat_id, chat_type):
        return None

    def get_last_msg(self, chat_id, chat_type):
        return None

    def get_unread_count_in_chat(self, chat_id, chat_type):
        return 0

    def get_notifications_count(self):
        return 0

    def get_notifications(self):
        return None

    def mark_msgs_as_read_in_chat(self, chat_id, chat_type):
        return None
