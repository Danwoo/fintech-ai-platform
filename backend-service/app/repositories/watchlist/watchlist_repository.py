from sqlalchemy import text
from utils.common.devextreme_utils import build_filter_params, parse_sort


class WatchlistRepository:
    def __init__(self, sql_client):
        self.sql_client = sql_client

    def query_select_watchlist(self) -> str:
        return """
            SELECT *
              FROM (
                SELECT ticker
                     , issuer_nm
                     , market
                     , sector
                     , currency
                     , CAST(target_price AS float) AS target_price
                     , CAST(alert_price AS float)  AS alert_price
                     , priority
                     , use_at
                     , memo
                     , FORMAT(reg_dt, 'yyyy-MM-dd HH:mm:ss') AS reg_dt
                     , reg_id
                     , FORMAT(mod_dt, 'yyyy-MM-dd HH:mm:ss') AS mod_dt
                     , mod_id
                FROM TN_Watchlist
                ) A
            WHERE 1 = 1
        """

    def select_watchlist_list(self, args: dict) -> tuple[list[dict], int]:
        base_sql = self.query_select_watchlist()

        sql_where, sql_params = build_filter_params(args)
        order_by = parse_sort(args.get("sort")) or "ticker ASC"

        skip = int(args.get("skip", 0))
        take = args.get("take")

        if take is not None:
            take = int(take)
            final_sql = f"""
                SELECT *
                  FROM (
                            SELECT ROW_NUMBER() OVER (ORDER BY {order_by}) AS rn
                                 , TB.*
                              FROM ({base_sql} {sql_where}) TB
                       ) TB
                 WHERE rn BETWEEN {skip + 1} AND {skip + take}
            """
            count_sql = f"SELECT COUNT(*) AS cnt FROM ({base_sql} {sql_where}) TB"

            with self.sql_client.connect() as conn:
                result = conn.execute(text(final_sql), sql_params).mappings().all()
                count = conn.execute(text(count_sql), sql_params).scalar()
                return [dict(row) for row in result], count
        else:
            final_sql = f"""
                SELECT *
                  FROM (
                            SELECT ROW_NUMBER() OVER (ORDER BY {order_by}) AS rn
                                 , TB.*
                              FROM ({base_sql} {sql_where}) TB
                       ) TB
            """

            with self.sql_client.connect() as conn:
                result = conn.execute(text(final_sql), sql_params).mappings().all()
                return [dict(row) for row in result], len(result)

    def select_watchlist(self, args: dict) -> dict | None:
        sql = self.query_select_watchlist() + " AND ticker = :ticker"
        with self.sql_client.connect() as conn:
            result = conn.execute(text(sql), args).mappings().fetchone()
            return dict(result) if result else None

    def insert_watchlist(self, args: dict) -> tuple:
        sql = """
            INSERT INTO TN_Watchlist (
                 ticker
               , issuer_nm
               , market
               , sector
               , currency
               , target_price
               , alert_price
               , priority
               , use_at
               , memo
               , reg_id
               , reg_dt
               , mod_id
               , mod_dt
            )
            OUTPUT INSERTED.ticker
            VALUES (
                 :ticker
               , :issuer_nm
               , :market
               , :sector
               , :currency
               , :target_price
               , :alert_price
               , :priority
               , :use_at
               , :memo
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

    def update_watchlist(self, args: dict) -> None:
        sql = """
            UPDATE TN_Watchlist
               SET issuer_nm    = :issuer_nm
                 , market       = :market
                 , sector       = :sector
                 , currency     = :currency
                 , target_price = :target_price
                 , alert_price  = :alert_price
                 , priority     = :priority
                 , use_at       = :use_at
                 , memo         = :memo
                 , mod_id       = :mod_id
                 , mod_dt       = CURRENT_TIMESTAMP
             WHERE ticker        = :ticker
        """
        with self.sql_client.connect() as conn:
            with conn.begin():
                conn.execute(text(sql), args)

    def delete_watchlist(self, args: dict) -> None:
        sql = """
            DELETE
              FROM TN_Watchlist
             WHERE ticker = :ticker
        """
        with self.sql_client.connect() as conn:
            with conn.begin():
                conn.execute(text(sql), args)
