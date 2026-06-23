import redis

from backend.config import REDIS_HOST
from backend.config import REDIS_PORT

redis_client = redis.Redis(host = REDIS_HOST, port = REDIS_PORT, decode_responses = True)