import json
import os
from pathlib import Path

from fastapi.concurrency import run_in_threadpool
from sqlalchemy import text


class ChatHistoryRepository:
    """공통 DB ai_chat_history 멀티턴 히스토리 read-only 조회.

    frontend Prisma 가 write 하는 테이블 — 여기선 LLM 컨텍스트용 question/answer 만 읽는다
    (sources/images/followups 는 프론트 표시용이라 미조회).
    """

    def __init__(self, sql_client):
        self.sql_client = sql_client

    def _select(self, email: str, gid: int) -> list[dict]:
        # dev 전용 로컬 폴백 — MULTI_AGENT_HISTORY_FILE 설정 시 공통 DB 대신 로컬 JSON 에서 읽음
        # (공통 DB 없이 멀티턴 검증용). production 은 env 미설정이라 아래 DB 경로.
        local = os.getenv("MULTI_AGENT_HISTORY_FILE")
        if local:
            p = Path(local)
            rows = json.loads(p.read_text(encoding="utf-8")) if p.exists() else []
            return [
                {"question": r["question"], "answer": r["answer"]}
                for r in rows
                if r.get("email") == email and r.get("gid") == gid and r.get("flag", 1) == 1
            ]
        sql = text(
            "SELECT question, answer FROM ai_chat_history "
            "WHERE email = :email AND gid = :gid AND flag = 1 "
            "ORDER BY sort"
        )
        with self.sql_client.connect() as conn:
            rows = conn.execute(sql, {"email": email, "gid": gid}).mappings().all()
        return [dict(r) for r in rows]

    async def select_history(self, email: str, gid: int) -> list[dict]:
        # pyodbc sync → 이벤트루프 블로킹 방지 (anti-pattern 13)
        return await run_in_threadpool(self._select, email, gid)
