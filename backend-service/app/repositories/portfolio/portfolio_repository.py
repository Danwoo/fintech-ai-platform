from sqlalchemy import text
from utils.common.devextreme_utils import build_filter_params, parse_sort


class PortfolioRepository:
    def __init__(self, sql_client):
        self.sql_client = sql_client

    # ── Portfolio (master) ─────────────────────────────────────────────
    def query_select_portfolio(self) -> str:
        return """
            SELECT *
              FROM (
                SELECT portfolio_id
                     , portfolio_nm
                     , sort_ordr
                     , use_at
                     , description
                     , FORMAT(reg_dt, 'yyyy-MM-dd HH:mm:ss') AS reg_dt
                     , reg_id
                     , FORMAT(mod_dt, 'yyyy-MM-dd HH:mm:ss') AS mod_dt
                     , mod_id
                FROM TN_Portfolio
                WHERE company_id = :company_id
                ) A
            WHERE 1 = 1
        """

    def select_portfolio_list(self, args: dict) -> tuple[list[dict], int]:
        base_sql = self.query_select_portfolio()
        sql_where, sql_params = build_filter_params(args)
        sql_params["company_id"] = args["company_id"]
        order_by = parse_sort(args.get("sort")) or "sort_ordr ASC, portfolio_id ASC"

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

    def select_portfolio(self, args: dict) -> dict | None:
        sql = self.query_select_portfolio() + " AND portfolio_id = :portfolio_id"
        with self.sql_client.connect() as conn:
            result = conn.execute(text(sql), args).mappings().fetchone()
            return dict(result) if result else None

    def insert_portfolio(self, args: dict) -> tuple:
        sql = """
            INSERT INTO TN_Portfolio (
                 company_id
               , portfolio_id
               , portfolio_nm
               , sort_ordr
               , use_at
               , description
               , reg_id
               , reg_dt
               , mod_id
               , mod_dt
            )
            OUTPUT INSERTED.portfolio_id
            VALUES (
                 :company_id
               , :portfolio_id
               , :portfolio_nm
               , :sort_ordr
               , :use_at
               , :description
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

    def update_portfolio(self, args: dict) -> None:
        sql = """
            UPDATE TN_Portfolio
               SET portfolio_nm = :portfolio_nm
                 , sort_ordr    = :sort_ordr
                 , use_at       = :use_at
                 , description  = :description
                 , mod_id       = :mod_id
                 , mod_dt       = CURRENT_TIMESTAMP
             WHERE portfolio_id  = :portfolio_id
               AND company_id    = :company_id
        """
        with self.sql_client.connect() as conn:
            with conn.begin():
                conn.execute(text(sql), args)

    def delete_portfolio(self, args: dict) -> None:
        sql_holdings = "DELETE FROM TN_Holding WHERE portfolio_id = :portfolio_id AND company_id = :company_id"
        sql_portfolio = "DELETE FROM TN_Portfolio WHERE portfolio_id = :portfolio_id AND company_id = :company_id"
        with self.sql_client.connect() as conn:
            with conn.begin():
                conn.execute(text(sql_holdings), args)
                conn.execute(text(sql_portfolio), args)

    # ── Holding (detail) ───────────────────────────────────────────────
    def query_select_holding(self) -> str:
        return """
            SELECT *
              FROM (
                SELECT h.portfolio_id
                     , h.ticker
                     , h.holding_nm
                     , h.quantity
                     , CAST(h.avg_price AS float) AS avg_price
                     , h.use_at
                     , h.description
                     , p.portfolio_nm
                     , FORMAT(h.reg_dt, 'yyyy-MM-dd HH:mm:ss') AS reg_dt
                     , h.reg_id
                     , FORMAT(h.mod_dt, 'yyyy-MM-dd HH:mm:ss') AS mod_dt
                     , h.mod_id
                FROM TN_Holding h
                INNER JOIN TN_Portfolio p
                        ON h.portfolio_id = p.portfolio_id
                       AND h.company_id = p.company_id
                WHERE h.company_id = :company_id
                ) A
            WHERE 1 = 1
              AND portfolio_id = :portfolio_id
        """

    def select_holding_list(self, args: dict) -> tuple[list[dict], int]:
        base_sql = self.query_select_holding()
        sql_where, sql_params = build_filter_params(args)
        order_by = parse_sort(args.get("sort")) or "ticker ASC"
        sql_params["portfolio_id"] = args["portfolio_id"]
        sql_params["company_id"] = args["company_id"]

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

    def select_holding(self, args: dict) -> dict | None:
        sql = self.query_select_holding() + " AND ticker = :ticker"
        with self.sql_client.connect() as conn:
            result = conn.execute(text(sql), args).mappings().fetchone()
            return dict(result) if result else None

    def insert_holding(self, args: dict) -> tuple:
        sql = """
            INSERT INTO TN_Holding (
                 company_id
               , portfolio_id
               , ticker
               , holding_nm
               , quantity
               , avg_price
               , use_at
               , description
               , reg_id
               , reg_dt
               , mod_id
               , mod_dt
            )
            OUTPUT INSERTED.portfolio_id, INSERTED.ticker
            VALUES (
                 :company_id
               , :portfolio_id
               , :ticker
               , :holding_nm
               , :quantity
               , :avg_price
               , :use_at
               , :description
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

    def update_holding(self, args: dict) -> None:
        sql = """
            UPDATE TN_Holding
               SET holding_nm  = :holding_nm
                 , quantity    = :quantity
                 , avg_price   = :avg_price
                 , use_at      = :use_at
                 , description = :description
                 , mod_id      = :mod_id
                 , mod_dt      = CURRENT_TIMESTAMP
             WHERE portfolio_id = :portfolio_id
               AND ticker        = :ticker
               AND company_id    = :company_id
        """
        with self.sql_client.connect() as conn:
            with conn.begin():
                conn.execute(text(sql), args)

    def delete_holding(self, args: dict) -> None:
        sql_holding = (
            "DELETE FROM TN_Holding WHERE portfolio_id = :portfolio_id AND ticker = :ticker AND company_id = :company_id"
        )
        with self.sql_client.connect() as conn:
            with conn.begin():
                conn.execute(text(sql_holding), args)
