from core.auth_context import require_company_id
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

    # ── Scheduler (master) — 요청 경로는 company_id 로 테넌트 스코핑 ──────────
    def select_scheduler_list(self, args: dict) -> tuple[list, int]:
        args["company_id"] = require_company_id()
        return self.scheduler_repository.select_scheduler_list(args)

    def select_scheduler(self, args: dict) -> dict:
        args["company_id"] = require_company_id()
        scheduler = self.scheduler_repository.select_scheduler(args)
        if not scheduler:
            raise NotFoundError("스케줄러를 찾을 수 없습니다.")
        return scheduler

    def insert_scheduler(self, args: dict) -> tuple:
        args["company_id"] = require_company_id()
        if self.scheduler_repository.select_scheduler(args):
            raise ConflictError("이미 존재하는 스케줄러입니다.")
        return self.scheduler_repository.insert_scheduler(args)

    def update_scheduler(self, args: dict) -> None:
        args["company_id"] = require_company_id()
        if not self.scheduler_repository.select_scheduler(args):
            raise NotFoundError("스케줄러를 찾을 수 없습니다.")
        self.scheduler_repository.update_scheduler(args)

    def delete_scheduler(self, args: dict) -> None:
        args["company_id"] = require_company_id()
        if not self.scheduler_repository.select_scheduler(args):
            raise NotFoundError("스케줄러를 찾을 수 없습니다.")
        self.scheduler_repository.delete_scheduler(args)

    # ── SchedulerMember (detail) ────────────────────────────────────────
    def select_member_list(self, args: dict) -> tuple[list, int]:
        args["company_id"] = require_company_id()
        return self.scheduler_repository.select_member_list(args)

    def insert_member(self, args: dict) -> None:
        args["company_id"] = require_company_id()
        # 멤버는 소유한 스케줄러에만 등록 — 타 테넌트 스케줄러로의 멤버 주입 차단
        if not self.scheduler_repository.select_scheduler(args):
            raise NotFoundError("스케줄러를 찾을 수 없습니다.")
        if self.scheduler_repository.select_member(args):
            raise ConflictError("이미 등록된 멤버입니다.")
        self.scheduler_repository.insert_member(args)

    def delete_member(self, args: dict) -> None:
        args["company_id"] = require_company_id()
        if not self.scheduler_repository.select_member(args):
            raise NotFoundError("멤버를 찾을 수 없습니다.")
        self.scheduler_repository.delete_member(args)

    def members_for_run(self, scheduler_id: str) -> list[dict]:
        self.select_scheduler({"scheduler_id": scheduler_id})  # 소유 검증 (없으면 NotFoundError)
        return self.scheduler_repository.select_members_for_job(scheduler_id)

    # ── 시스템 경로 (요청 밖 — 부팅/cron) — company_id 미주입, 전 테넌트 대상 ──
    def select_active_schedulers(self) -> list[dict]:
        return self.scheduler_repository.select_active_schedulers()

    async def run(self, scheduler_id: str) -> None:
        try:
            scheduler = self.scheduler_repository.select_scheduler_for_job(scheduler_id)
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
