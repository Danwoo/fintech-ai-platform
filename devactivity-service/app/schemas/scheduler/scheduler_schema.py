from typing import Literal

from pydantic import BaseModel, Field
from schemas.common_schema import CommonEntity, TrimmedBaseModel


class Scheduler(TrimmedBaseModel):
    scheduler_nm: str = Field(..., max_length=200)
    day_of_week: str = Field(default="mon", max_length=20)  # mon/tue/.../sun/* (APScheduler)
    hour: int = Field(default=9, ge=0, le=23)
    minute: int = Field(default=0, ge=0, le=59)
    period_weeks: Literal[1, 2, 4] = Field(default=1)  # 1=주간 2=격주 4=월간 (집계기간·N주마다 발송)
    use_at: str = Field(default="N", max_length=5)  # Y=활성(잡 등록)
    description: str | None = Field(None, max_length=1000)


class SchedulerOut(Scheduler, CommonEntity):
    scheduler_id: str


class SchedulersOut(BaseModel):
    items: list[SchedulerOut]
    total_count: int


class SchedulerCreateIn(Scheduler):
    scheduler_id: str = Field(..., max_length=20)


class SchedulerUpdateIn(Scheduler):
    pass


class SchedulerMemberOut(CommonEntity):
    scheduler_id: str
    account_id: str
    email: str
    name: str | None = None


class SchedulerMembersOut(BaseModel):
    items: list[SchedulerMemberOut]
    total_count: int


class SchedulerMemberIn(BaseModel):
    account_id: str = Field(..., max_length=100)
    email: str = Field(..., max_length=200)
    name: str | None = Field(None, max_length=200)
