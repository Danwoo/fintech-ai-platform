# repositories/message_queue/message_queue_repository.py
from sqlalchemy import text


class MessageQueueRepository:
    def __init__(self, sql_client):
        self.sql_client = sql_client

    def insert_message(self, args: dict) -> tuple:
        sql = """
            INSERT INTO TN_MessageQueue (
                 topic
               , payload
               , status
               , retry_count
               , reg_id
               , reg_dt
               , mod_id
               , mod_dt
            )
            OUTPUT INSERTED.id
            VALUES (
                 :topic
               , :payload
               , 'pending'
               , 0
               , :reg_id
               , CURRENT_TIMESTAMP
               , :reg_id
               , CURRENT_TIMESTAMP
            )
        """
        with self.sql_client.connect() as conn:
            with conn.begin():
                result = conn.execute(text(sql), args)
                return result.fetchone()

    def select_pending(self, args: dict) -> list[dict]:
        sql = """
            SELECT TOP (:limit)
                   id
                 , topic
                 , payload
                 , status
                 , retry_count
              FROM TN_MessageQueue
             WHERE status = 'pending'
             ORDER BY id ASC
        """
        with self.sql_client.connect() as conn:
            result = conn.execute(text(sql), args).mappings().all()
            return [dict(row) for row in result]

    def mark_done(self, args: dict) -> None:
        sql = """
            UPDATE TN_MessageQueue
               SET status = 'done'
                 , mod_id = :mod_id
                 , mod_dt = CURRENT_TIMESTAMP
             WHERE id = :id
        """
        with self.sql_client.connect() as conn:
            with conn.begin():
                conn.execute(text(sql), args)

    def mark_failed(self, args: dict) -> None:
        sql = """
            UPDATE TN_MessageQueue
               SET status = 'failed'
                 , retry_count = retry_count + 1
                 , error = :error
                 , mod_id = :mod_id
                 , mod_dt = CURRENT_TIMESTAMP
             WHERE id = :id
        """
        with self.sql_client.connect() as conn:
            with conn.begin():
                conn.execute(text(sql), args)
