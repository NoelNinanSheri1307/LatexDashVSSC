from backend.db.mongo import db


def get_collaboration_distribution():

    distribution = {
        "0": 0,
        "1": 0,
        "2": 0,
        "3": 0,
        "4+": 0
    }

    cursor = db.projects.find(
        {},
        {
            "collaberator_refs": 1
        }
    )

    for project in cursor:

        collaborator_count = len(project.get("collaberator_refs", []))

        if collaborator_count >= 4:
            distribution["4+"] += 1

        else:
            distribution[str(collaborator_count)] += 1
    
    return distribution