from datetime import datetime, timedelta

from backend.db.mongo import db
from backend.services.session_service import get_session_summary


def get_overview():

    now = datetime.utcnow()

    active_users = db.users.count_documents(
        {
            "lastActive": {
                "$gte": now - timedelta(days = 30)
            }
        }
    )

    active_projects = db.projects.count_documents(
        {
            "lastUpdated": {
                "$gte": now - timedelta(days = 30)
            }
        }
    )

    users_with_projects = len(db.projects.distinct("owner_ref"))

    users_with_edits = len(db.projects.distinct("lastUpdatedBy"))

    session_data = (get_session_summary())

    return {
        "total_users": db.users.count_documents({}),

        "total_projects": db.projects.count_documents({}),

        "active_users_30d": active_users,

        "active_projects_30d": active_projects,

        "logged_in_users": session_data["logged_in_users"],

        "active_sessions": session_data["active_sessions"],

        "user_with_projects": users_with_projects,

        "user_with_edits": users_with_edits
    }