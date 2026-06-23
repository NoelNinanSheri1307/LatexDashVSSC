import json

from backend.db.redis import redis_client


def get_session_summary():
    
    unique_users = set()
    session_count = 0

    for key in redis_client.scan_iter("sess:*"):
        raw = redis_client.get(key)
        print("raw", raw)

        if not raw:
            continue

        try:
            data = json.loads(raw)
        except Exception:
            continue
        print("data", data)

        user = (data.get("passport", {}).get("user"))

        if not user:
            continue

        user_id = user.get("_id")

        if not user_id:
            continue
        
        print("user_id", user_id)
        session_count += 1
        unique_users.add(user_id)

    return {
        "active_sessions": session_count,
        "logged_in_users": len(unique_users)
    }