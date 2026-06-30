# services/nav/nav_service.py
from repositories.nav.nav_repository import NavRepository


class NavService:
    def __init__(self, nav_repository: NavRepository):
        self.nav_repository = nav_repository

    def record_snapshot(self, snapshot: dict) -> None:
        """producer 가 메시지 큐에 발행한 NAV 스냅샷을 시계열 테이블에 기록 (consumer dispatch 경유)"""
        self.nav_repository.insert_nav(
            {
                "nav_dt": snapshot["timestamp"],
                "nav": snapshot.get("nav"),
                "benchmark": snapshot.get("benchmark"),
                "daily_return": snapshot.get("daily_return"),
                "drawdown": snapshot.get("drawdown"),
                "reg_id": "system",
            }
        )

    def select_history(self, minutes: int) -> tuple[list[dict], int]:
        items = self.nav_repository.select_history({"minutes": minutes})
        return items, len(items)
