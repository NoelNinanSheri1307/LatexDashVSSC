import mysql.connector

from backend.config import MYSQL_HOST
from backend.config import MYSQL_USER
from backend.config import MYSQL_PASS
from backend.config import MYSQL_DATABASE


mysql_conn = mysql.connector.connect(
    host = MYSQL_HOST,
    user = MYSQL_USER,
    password = MYSQL_PASS,
    database = MYSQL_DATABASE
)