import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Scheduler(Base):
    """스케줄러 (마스터) — 리포트 발송 잡. day_of_week/hour/minute 로 APScheduler cron 구성, period_weeks 로 주기·집계기간."""

    __tablename__ = "TN_Scheduler"

    scheduler_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    scheduler_nm: Mapped[str] = mapped_column(String(200), nullable=False)
    day_of_week: Mapped[str] = mapped_column(String(20), default="mon", server_default="mon")
    hour: Mapped[int] = mapped_column(Integer, default=9, server_default="9")
    minute: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    period_weeks: Mapped[int] = mapped_column(
        Integer, default=1, server_default="1"
    )  # 1=주간 2=격주 4=월간 (집계기간·주기)
    use_at: Mapped[str] = mapped_column(String(5), default="N", server_default="N")
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    reg_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, default=func.now())
    reg_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    mod_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, onupdate=func.now(), nullable=True)
    mod_id: Mapped[str | None] = mapped_column(String(100), nullable=True)


class SchedulerMember(Base):
    """스케줄러 참여 멤버 (디테일) — 해당 스케줄러 발송 대상 계좌·포트폴리오."""

    __tablename__ = "TN_SchedulerMember"

    scheduler_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    account_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    email: Mapped[str] = mapped_column(String(200), nullable=False)
    name: Mapped[str | None] = mapped_column(String(200), nullable=True)

    reg_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, default=func.now())
    reg_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    mod_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, onupdate=func.now(), nullable=True)
    mod_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
