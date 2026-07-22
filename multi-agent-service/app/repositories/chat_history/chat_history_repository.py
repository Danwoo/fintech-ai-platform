import json
import os
from pathlib import Path

from fastapi.concurrency import run_in_threadpool
from sqlalchemy import text


class ChatHistoryRepository:
    """공통 DB ai_chat_history 멀티턴 히스토리 read-only 조회.

    frontend Prisma 가 write 하는 테이블 — 여기선 LLM 컨텍스트용 question/answer 만 읽는다
    (sources/images/followups 는 프론트 표시용이라 미조회).

    max_turns: 적재할 (question,answer) 쌍 상한 — 최근 N턴만 읽어 대화 길이와 무관하게
    메모리·토큰을 bound 한다 (무제한 로드 방지, #85).
    """

    def __init__(self, sql_client, max_turns: int = 10):
        self.sql_client = sql_client
        self.max_turns = max_turns

    def _select(self, email: str, gid: int) -> list[dict]:
        # dev 전용 로컬 폴백 — MULTI_AGENT_HISTORY_FILE 설정 시 공통 DB 대신 로컬 JSON 에서 읽음
        # (공통 DB 없이 멀티턴 검증용). production 은 env 미설정이라 아래 DB 경로.
        local = os.getenv("MULTI_AGENT_HISTORY_FILE")
        if local:
            p = Path(local)
            rows = json.loads(p.read_text(encoding="utf-8")) if p.exists() else []
            filtered = [
                {"question": r["question"], "answer": r["answer"]}
                for r in rows
                if r.get("email") == email and r.get("gid") == gid and r.get("flag", 1) == 1
            ]
            # DB 경로의 TOP 캡과 동일하게 최근 N턴만 (파일은 sort 순 저장 가정 → 꼬리 slice)
            return filtered[-self.max_turns :] if self.max_turns > 0 else filtered
        # 최근 N턴만: 안쪽에서 sort DESC 로 TOP N 를 뽑고 바깥에서 sort ASC 로 시간순 복원.
        sql = text(
            "SELECT question, answer FROM ("
            "  SELECT TOP (:limit) question, answer, sort FROM ai_chat_history "
            "  WHERE email = :email AND gid = :gid AND flag = 1 "
            "  ORDER BY sort DESC"
            ") t ORDER BY t.sort ASC"
        )
        with self.sql_client.connect() as conn:
            rows = conn.execute(sql, {"email": email, "gid": gid, "limit": self.max_turns}).mappings().all()
        return [dict(r) for r in rows]

    async def select_history(self, email: str, gid: int) -> list[dict]:
        # pyodbc sync → 이벤트루프 블로킹 방지 (anti-pattern 13)
        return await run_in_threadpool(self._select, email, gid)
