from pydantic import BaseModel


class AccountInfo(BaseModel):
    account_id: str  # 계좌·포트폴리오 식별자
    name: str  # 계좌·포트폴리오 표시명
    kind: str = ""  # cash(현금성) | margin(신용) | pension(연금) 등 계좌 유형
    base_ccy: str = ""  # 기준통화 (KRW/USD …)
    last_activity: str = ""  # 마지막 활동일 YYYY-MM-DD (최근 활성 그룹핑용)


class AccountsOut(BaseModel):
    items: list[AccountInfo]
    total_count: int


class HolderInfo(BaseModel):
    account_id: str
    name: str
    email: str


class HoldersOut(BaseModel):
    items: list[HolderInfo]
    total_count: int
