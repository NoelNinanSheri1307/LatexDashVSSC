from datetime import datetime, timedelta

from backend.db.mongo import db
from backend.db.mysql import mysql_conn
from backend.config import MYSQL_TABLE
from backend.utils.aggregation import get_date_format


def get_user_summary():

    return {
        "total_users":
            db.users.count_documents({}),
        "admin_users":
            db.users.count_documents(
                {
                    "isAdmin": True
                }
            ),
        "never_logged_in":
            db.users.count_documents(
                {
                    "$or": [
                        {"loginCount": 0},
                        {"loginCount": None}
                    ]
                }
            )
    }


def get_user_activity():

    now = datetime.utcnow()

    return {

        "active_7d":
            db.users.count_documents(
                {
                    "lastActive": {
                        "$gte": now - timedelta(days = 7)
                    }
                }
            ),

        "active_30d":
            db.users.count_documents(
                {
                    "lastActive": {
                        "$gte": now - timedelta(days = 30)
                    }
                }
            ),
        
        "active_90d":
            db.users.count_documents(
                {
                    "lastActive": {
                        "$gte": now - timedelta(days = 90)
                    }
                }
            ),
    }


def get_user_growth(frequency):

    fmt = get_date_format(frequency)

    pipeline = [
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": fmt,
                        "date": "$signUpDate"
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

    for row in db.users.aggregate(pipeline):
        result.append({
            "period": row["_id"],
            "count": row["count"]
        })
    
    return result


def get_login_stats():

    pipeline = [
        {
            "$group": {
                "_id": None,
                "avg": {
                    "$avg": "$loginCount"
                },
                "max": {
                    "$max": "$loginCount"
                }
            }
        }
    ]

    result = list(
        db.users.aggregate(pipeline)
    )

    if not result:
        return {}
    
    return {
        "average_login_count": round(result[0]["avg"], 2),
        "max_login_count": result[0]["max"]
    }


def get_user_list():
    
    mongo_users = db.users.find(
        {},
        {
            "email": 1,
            "isAdmin": 1,
            "signUpDate": 1,
            "lastLoggedIn": 1,
            "lastActive": 1,
            "loginCount": 1
        }
    )

    usernames = set()
    for user in mongo_users:

        email = user.get("email")

        if email:
            usernames.add(email.replace("@vssc.gov.in", ""))
    
    employee_lookup = dict()

    if usernames:

        placeholders = ",".join(["%s"] * len(usernames))

        query = f"""
                    SELECT scno, name, designation, section, division, groupname, entityname, emailid FROM {MYSQL_TABLE} WHERE emailid IN ({placeholders})
                """
        
        cursor = mysql_conn.cursor(dictionary = True)
        cursor.execute(query, list(usernames))
        rows = cursor.fetchall()
        for row in rows:
            employee_lookup[row["emailid"]] = row
        
        cursor.close()
    

    mongo_users = db.users.find(
        {},
        {
            "email": 1,
            "isAdmin": 1,
            "signUpDate": 1,
            "lastLoggedIn": 1,
            "lastActive": 1,
            "loginCount": 1
        }
    )

    users = list()

    for user in mongo_users:
        email = user.get("email")

        username = None
        if email:
            username = email.replace("@vssc.gov.in", "")
        
        employee = employee_lookup.get(username, {})

        users.append(
            {
                "_id": str(user["_id"]),
                "email": user.get("email"),
                "staff_code": employee.get("scno"),
                "name": employee.get("name"),
                "designation": employee.get("designation"),
                "section": employee.get("section", "").strip(),
                "division": employee.get("division", "").strip(),
                "groupname": employee.get("groupname", "").strip(),
                "entityname": employee.get("entityname", "").strip(),
                "is_admin": user.get("isAdmin"),
                "signup_date": user.get("signUpDate"),
                "last_logged_in": user.get("lastLoggedIn"),
                "last_active": user.get("lastActive"),
                "login_count": user.get("loginCount")
            }
        )

    return users