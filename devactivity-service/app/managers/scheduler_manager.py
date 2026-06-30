# managers/scheduler_manager.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from core.container import Container
from dependency_injector.wiring import Provide, inject
from services.scheduler.scheduler_service import SchedulerService


class SchedulerManager:
    """APScheduler 매니저 — 기동 시 활성(use_at='Y') 스케줄러를 cron 잡으로 자가적재, CRUD 변경 시 sync. 업무(멤버 조회·발송)는 SchedulerService 위임."""

    def __init__(self):
        self.scheduler = AsyncIOScheduler(timezone="Asia/Seoul")

    @inject
    def start(self, scheduler_service: SchedulerService = Provide[Container.scheduler_service]) -> None:
        if not self.scheduler.running:
            self.scheduler.start()
        for sch in scheduler_service.select_active_schedulers():
            self.scheduler.add_job(
                scheduler_service.run,
                CronTrigger(
                    day_of_week=sch["day_of_week"],
                    hour=sch["hour"],
                    minute=sch["minute"],
                    week=f"*/{sch['period_weeks']}" if sch["period_weeks"] > 1 else None,  # N주마다 (ISO 주차 step)
                ),
                args=[sch["scheduler_id"]],
                id=sch["scheduler_id"],
                replace_existing=True,
            )

    async def stop(self) -> None:
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)

    @inject
    def sync(
        self, scheduler_id: str, scheduler_service: SchedulerService = Provide[Container.scheduler_service]
    ) -> None:
        sch = scheduler_service.select_scheduler({"scheduler_id": scheduler_id})
        if sch.get("use_at") != "Y":
            self.unregister(scheduler_id)
            return
        self.scheduler.add_job(
            scheduler_service.run,
            CronTrigger(
                day_of_week=sch["day_of_week"],
                hour=sch["hour"],
                minute=sch["minute"],
                week=f"*/{sch['period_weeks']}" if sch["period_weeks"] > 1 else None,  # N주마다 (ISO 주차 step)
            ),
            args=[scheduler_id],
            id=scheduler_id,
            replace_existing=True,
        )

    def unregister(self, scheduler_id: str) -> None:
        if self.scheduler.get_job(scheduler_id):
            self.scheduler.remove_job(scheduler_id)


scheduler_manager = SchedulerManager()
