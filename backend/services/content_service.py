from collections import Counter

from backend.db.mongo import db


def get_content_summary():

    total_documents = 0
    total_uploaded_files = 0
    project_count = 0

    cursor = db.projects.find(
        {},
        {
            "rootFolder": 1
        }
    )

    for project in cursor:

        project_count += 1

        root_folders = project.get("rootFolder", [])

        for folder in root_folders:
            total_documents += len(folder.get("docs", []))
            total_uploaded_files += len(folder.get("fileRefs", []))
    
    return {

        "total_documents": total_documents,
        "total_uploaded_files": total_uploaded_files,
        "avg_documents_per_project": round(total_documents / max(project_count, 1), 2),
        "avg_uploaded_files_per_project": round(total_uploaded_files / max(project_count, 1), 2)
    }


def get_file_types():

    counter = Counter()

    cursor = db.projects.find(
        {},
        {
            "rootFolder": 1
        }
    )

    for project in cursor:

        root_folders = project.get("rootFolder", [])

        for folder in root_folders:

            files = folder.get("fileRefs", [])

            for file in files:

                filename = file.get("name", "")
                if "." not in filename:
                    continue

                extension = (filename.split(".")[-1].lower())
                counter[extension] += 1
    
    return dict(counter)