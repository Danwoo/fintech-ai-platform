from sqlalchemy import text
from utils.common.devextreme_utils import build_filter_params, parse_sort


class SchedulerRepository:
    def __init__(self, sql_client):
        self.sql_client = sql_client

    # ── Scheduler (master) ──────────────────────────────────────────────
    def query_select_scheduler(self) -> str:
        return """
            SELECT *
              FROM (
                SELECT scheduler_id
                     , scheduler_nm
                     , day_of_week
                     , hour
                     , minute
                     , period_weeks
                     , use_at
                     , description
                     , FORMAT(reg_dt, 'yyyy-MM-dd HH:mm:ss') AS reg_dt
                     , reg_id
                     , FORMAT(mod_dt, 'yyyy-MM-dd HH:mm:ss') AS mod_dt
                     , mod_id
                FROM TN_Scheduler
                ) A
            WHERE 1 = 1
        """

    def select_scheduler_list(self, args: dict) -> tuple[list[dict], int]:
        base_sql = self.query_select_scheduler()
        sql_where, sql_params = build_filter_params(args)
        order_by = parse_sort(args.get("sort")) or "scheduler_id ASC"
        skip = int(args.get("skip", 0))
        take = args.get("take")

        if take is not None:
            take = int(take)
            final_sql = f"""
                SELECT *
                  FROM (SELECT ROW_NUMBER() OVER (ORDER BY {order_by}) AS rn, TB.*
                          FROM ({base_sql} {sql_where}) TB) TB
                 WHERE rn BETWEEN {skip + 1} AND {skip + take}
            """
            count_sql = f"SELECT COUNT(*) AS cnt FROM ({base_sql} {sql_where}) TB"
            with self.sql_client.connect() as conn:
                rows = conn.execute(text(final_sql), sql_params).mappings().all()
                count = conn.execute(text(count_sql), sql_params).scalar()
                return [dict(r) for r in rows], count
        final_sql = f"""
            SELECT *
              FROM (SELECT ROW_NUMBER() OVER (ORDER BY {order_by}) AS rn, TB.*
                      FROM ({base_sql} {sql_where}) TB) TB
        """
        with self.sql_client.connect() as conn:
            rows = conn.execute(text(final_sql), sql_params).mappings().all()
            return [dict(r) for r in rows], len(rows)

    def select_scheduler(self, args: dict) -> dict | None:
        sql = self.query_select_scheduler() + " AND scheduler_id = :scheduler_id"
        with self.sql_client.connect() as conn:
            row = conn.execute(text(sql), args).mappings().fetchone()
            return dict(row) if row else None

    def select_active_schedulers(self) -> list[dict]:
        """잡 등록 대상 — use_at='Y'. 런타임 cron 구성에 필요한 필드만."""
        sql = """
            SELECT scheduler_id, scheduler_nm, day_of_week, hour, minute, period_weeks
              FROM TN_Scheduler WHERE use_at = 'Y'
        """
        with self.sql_client.connect() as conn:
            return [dict(r) for r in conn.execute(text(sql)).mappings().all()]

    def insert_scheduler(self, args: dict) -> tuple:
        sql = """
            INSERT INTO TN_Scheduler (
                 scheduler_id, scheduler_nm, day_of_week, hour, minute, period_weeks, use_at, description,
                 reg_id, reg_dt, mod_id, mod_dt
            )
            OUTPUT INSERTED.scheduler_id
            VALUES (
                 :scheduler_id, :scheduler_nm, :day_of_week, :hour, :minute, :period_weeks, :use_at, :description,
                 :reg_id, CURRENT_TIMESTAMP, :reg_id, CURRENT_TIMESTAMP
            )
        """
        with self.sql_client.connect() as conn:
            with conn.begin():
                return conn.execute(text(sql), args).fetchone()

    def update_scheduler(self, args: dict) -> None:
        sql = """
            UPDATE TN_Scheduler
               SET scheduler_nm  = :scheduler_nm
                 , day_of_week  = :day_of_week
                 , hour         = :hour
                 , minute       = :minute
                 , period_weeks = :period_weeks
                 , use_at       = :use_at
                 , description  = :description
                 , mod_id       = :mod_id
                 , mod_dt       = CURRENT_TIMESTAMP
             WHERE scheduler_id = :scheduler_id
        """
        with self.sql_client.connect() as conn:
            with conn.begin():
                conn.execute(text(sql), args)

    def delete_scheduler(self, args: dict) -> None:
        with self.sql_client.connect() as conn:
            with conn.begin():
                conn.execute(text("DELETE FROM TN_SchedulerMember WHERE scheduler_id = :scheduler_id"), args)
                conn.execute(text("DELETE FROM TN_Scheduler WHERE scheduler_id = :scheduler_id"), args)

    # ── SchedulerMember (detail) ────────────────────────────────────────
    def select_member_list(self, args: dict) -> tuple[list[dict], int]:
        base_sql = """
            SELECT scheduler_id
                 , account_id
                 , email
                 , name
                 , FORMAT(reg_dt, 'yyyy-MM-dd HH:mm:ss') AS reg_dt
                 , reg_id
                 , FORMAT(mod_dt, 'yyyy-MM-dd HH:mm:ss') AS mod_dt
                 , mod_id
              FROM TN_SchedulerMember
             WHERE scheduler_id = :scheduler_id
        """
        order_by = parse_sort(args.get("sort")) or "account_id ASC"
        with self.sql_client.connect() as conn:
            rows = (
                conn.execute(text(f"{base_sql} ORDER BY {order_by}"), {"scheduler_id": args["scheduler_id"]})
                .mappings()
                .all()
            )
            return [dict(r) for r in rows], len(rows)

    def select_member(self, args: dict) -> dict | None:
        sql = "SELECT scheduler_id, account_id FROM TN_SchedulerMember WHERE scheduler_id = :scheduler_id AND account_id = :account_id"
        with self.sql_client.connect() as conn:
            row = conn.execute(text(sql), args).mappings().fetchone()
            return dict(row) if row else None

    def select_members_for_job(self, scheduler_id: str) -> list[dict]:
        """잡 실행 시점 — 발송 대상 (account_id/email/name)."""
        sql = "SELECT account_id, email, name FROM TN_SchedulerMember WHERE scheduler_id = :scheduler_id ORDER BY account_id"
        with self.sql_client.connect() as conn:
            return [dict(r) for r in conn.execute(text(sql), {"scheduler_id": scheduler_id}).mappings().all()]

    def insert_member(self, args: dict) -> None:
        sql = """
            INSERT INTO TN_SchedulerMember (scheduler_id, account_id, email, name, reg_id, reg_dt, mod_id, mod_dt)
            VALUES (:scheduler_id, :account_id, :email, :name, :reg_id, CURRENT_TIMESTAMP, :reg_id, CURRENT_TIMESTAMP)
        """
        with self.sql_client.connect() as conn:
            with conn.begin():
                conn.execute(text(sql), args)

    def delete_member(self, args: dict) -> None:
        sql = "DELETE FROM TN_SchedulerMember WHERE scheduler_id = :scheduler_id AND account_id = :account_id"
        with self.sql_client.connect() as conn:
            with conn.begin():
                conn.execute(text(sql), args)
