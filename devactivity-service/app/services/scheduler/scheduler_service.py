from core.exceptions import ConflictError, NotFoundError
from core.logger import logger
from repositories.scheduler.scheduler_repository import SchedulerRepository
from services.report.activity_report_service import ActivityReportService


class SchedulerService:
    def __init__(
        self,
        scheduler_repository: SchedulerRepository,
        activity_report_service: ActivityReportService,
    ):
        self.scheduler_repository = scheduler_repository
        self.activity_report_service = activity_report_service

    # ── Scheduler (master) ──────────────────────────────────────────────
    def select_active_schedulers(self) -> list[dict]:
        return self.scheduler_repository.select_active_schedulers()

    def select_scheduler_list(self, args: dict) -> tuple[list, int]:
        return self.scheduler_repository.select_scheduler_list(args)

    def select_scheduler(self, args: dict) -> dict:
        scheduler = self.scheduler_repository.select_scheduler(args)
        if not scheduler:
            raise NotFoundError("스케줄러를 찾을 수 없습니다.")
        return scheduler

    def insert_scheduler(self, args: dict) -> tuple:
        if self.scheduler_repository.select_scheduler(args):
            raise ConflictError("이미 존재하는 스케줄러입니다.")
        return self.scheduler_repository.insert_scheduler(args)

    def update_scheduler(self, args: dict) -> None:
        if not self.scheduler_repository.select_scheduler(args):
            raise NotFoundError("스케줄러를 찾을 수 없습니다.")
        self.scheduler_repository.update_scheduler(args)

    def delete_scheduler(self, args: dict) -> None:
        if not self.scheduler_repository.select_scheduler(args):
            raise NotFoundError("스케줄러를 찾을 수 없습니다.")
        self.scheduler_repository.delete_scheduler(args)

    # ── SchedulerMember (detail) ────────────────────────────────────────
    def select_member_list(self, args: dict) -> tuple[list, int]:
        return self.scheduler_repository.select_member_list(args)

    def insert_member(self, args: dict) -> None:
        if self.scheduler_repository.select_member(args):
            raise ConflictError("이미 등록된 멤버입니다.")
        self.scheduler_repository.insert_member(args)

    def delete_member(self, args: dict) -> None:
        if not self.scheduler_repository.select_member(args):
            raise NotFoundError("멤버를 찾을 수 없습니다.")
        self.scheduler_repository.delete_member(args)

    def members_for_run(self, scheduler_id: str) -> list[dict]:
        self.select_scheduler({"scheduler_id": scheduler_id})  # 없으면 NotFoundError
        return self.scheduler_repository.select_members_for_job(scheduler_id)

    # ── 잡 액션 — 스케줄러가 cron 시점에 호출 (지난주 → 현재) ──────────────
    async def run(self, scheduler_id: str) -> None:
        try:
            scheduler = self.scheduler_repository.select_scheduler({"scheduler_id": scheduler_id})
            if not scheduler:
                return
            members = self.scheduler_repository.select_members_for_job(scheduler_id)
            if not members:
                return
            since, until = self.activity_report_service.period(scheduler["period_weeks"])
            async for msg in self.activity_report_service.generate_for(members, since, until):
                logger.info(f"[스케줄러 {scheduler_id}] {msg}")
        except Exception as e:
            logger.error(f"[스케줄러 {scheduler_id}] 실패: {e}")
