from datetime import datetime


def get_date_format(frequency):

    mapping = {
        "day": "%Y-%m-%d",
        "week": "%Y-%U",
        "month": "%Y-%m"
    }

    return mapping.get(frequency, "%Y-%m")