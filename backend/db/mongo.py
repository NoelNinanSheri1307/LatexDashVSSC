from pymongo import MongoClient

from backend.config import MONGO_URI


mongo_client = MongoClient(MONGO_URI)

db = mongo_client.get_default_database()