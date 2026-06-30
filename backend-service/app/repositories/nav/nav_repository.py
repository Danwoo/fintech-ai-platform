# repositories/nav/nav_repository.py
from sqlalchemy import text


class NavRepository:
    def __init__(self, sql_client):
        self.sql_client = sql_client

    def insert_nav(self, args: dict) -> None:
        sql = """
            INSERT INTO TN_Nav (
                 nav_dt
               , nav
               , benchmark
               , daily_return
               , drawdown
               , reg_id
               , reg_dt
               , mod_id
               , mod_dt
            )
            VALUES (
                 :nav_dt
               , :nav
               , :benchmark
               , :daily_return
               , :drawdown
               , :reg_id
               , CURRENT_TIMESTAMP
               , :reg_id
               , CURRENT_TIMESTAMP
            )
        """
        with self.sql_client.connect() as conn:
            with conn.begin():
                conn.execute(text(sql), args)

    def select_history(self, args: dict) -> list[dict]:
        sql = """
            SELECT FORMAT(nav_dt, 'yyyy-MM-ddTHH:mm:ss') AS timestamp
                 , CAST(nav AS float)          AS nav
                 , CAST(benchmark AS float)    AS benchmark
                 , CAST(daily_return AS float) AS daily_return
                 , CAST(drawdown AS float)     AS drawdown
              FROM TN_Nav
             WHERE nav_dt >= DATEADD(MINUTE, -:minutes, GETDATE())
             ORDER BY nav_dt ASC
        """
        with self.sql_client.connect() as conn:
            result = conn.execute(text(sql), args).mappings().all()
            return [dict(row) for row in result]
