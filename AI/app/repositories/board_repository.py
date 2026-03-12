import pymysql
from app.config.settings import settings


def _connect():
    return pymysql.connect(
        host=settings.db_host,
        port=settings.db_port,
        user=settings.db_user,
        password=settings.db_password,
        database=settings.db_name,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


def get_all_posts():

    conn = _connect()

    try:
        with conn.cursor() as cursor:

            sql = """
            SELECT
                board_id,
                board_title,
                board_ctnt
            FROM board
            """

            cursor.execute(sql)

            return cursor.fetchall()

    finally:
        conn.close()


def get_posts_by_ids(board_ids: list[int]):

    if not board_ids:
        return []

    conn = _connect()

    try:
        with conn.cursor() as cursor:

            placeholders = ",".join(["%s"] * len(board_ids))

            sql = f"""
            SELECT
                board_id,
                board_title,
                board_ctnt
            FROM board
            WHERE board_id IN ({placeholders})
            """

            cursor.execute(sql, board_ids)

            return cursor.fetchall()

    finally:
        conn.close()