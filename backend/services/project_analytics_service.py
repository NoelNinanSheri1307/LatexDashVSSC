from datetime import datetime, timedelta

from backend.db.mongo import db
from backend.utils.aggregation import get_date_format


def get_project_summary():

    total_projects = db.projects.count_documents({})

    public_projects = db.projects.count_documents(
        {
            "publicAccessLevel": {
                "$ne": "private"
            }
        }
    )

    return {
        "total_projects": total_projects,
        "public_projects": public_projects,
        "private_projects": total_projects - public_projects
    }


def get_project_activity():

    now = datetime.utcnow()

    return {
        "updated_7d":
            db.projects.count_documents(
                {
                    "lastUpdated": {
                        "$gte": now - timedelta(days = 7)
                    }
                }
            ),
        
        "updated_30d":
            db.projects.count_documents(
                {
                    "lastUpdated": {
                        "$gte": now - timedelta(days = 30)
                    }
                }
            ),
        
        "opened_30d":
            db.projects.count_documents(
                {
                    "lastOpened": {
                        "$gte": now - timedelta(days = 30)
                    }
                }
            ),
    }


def get_project_growth(frequency):

    fmt = get_date_format(frequency)

    pipeline = [
        {
            "$project": {
                "createdAt": {
                    "$toDate": "$_id"
                }
            }
        },

        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": fmt,
                        "date": "$createdAt"
                    }
                },

                "count": {
                    "$sum": 1
                }
            }
        },

        {
            "$sort": {
                "_id": 1
            }
        }
    ]

    result = list()

    for row in db.projects.aggregate(pipeline):
        result.append({
            "period": row["_id"],
            "count": row["count"]
        })
    
    return result