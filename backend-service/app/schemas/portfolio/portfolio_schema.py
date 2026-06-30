from pydantic import BaseModel, Field
from schemas.common_schema import CommonEntity, TrimmedBaseModel


# ── Portfolio (master) ─────────────────────────────────────────────────
class Portfolio(TrimmedBaseModel):
    portfolio_nm: str = Field(..., max_length=200)
    sort_ordr: int = Field(default=1)
    use_at: str = Field(default="Y", max_length=1)
    description: str | None = Field(None, max_length=1000)


class PortfolioOut(Portfolio, CommonEntity):
    portfolio_id: str


class PortfoliosOut(BaseModel):
    items: list[PortfolioOut]
    total_count: int


class PortfolioCreateIn(Portfolio):
    portfolio_id: str = Field(..., max_length=20)


class PortfolioUpdateIn(Portfolio):
    pass


# ── Holding (detail) ───────────────────────────────────────────────────
class Holding(TrimmedBaseModel):
    holding_nm: str = Field(..., max_length=200)
    quantity: int = Field(default=0)
    avg_price: float = Field(default=0, ge=0)
    use_at: str = Field(default="Y", max_length=1)
    description: str | None = Field(None, max_length=1000)


class HoldingOut(Holding, CommonEntity):
    portfolio_id: str
    ticker: str
    portfolio_nm: str | None = None


class HoldingsOut(BaseModel):
    items: list[HoldingOut]
    total_count: int


class HoldingCreateIn(Holding):
    ticker: str = Field(..., max_length=20)


class HoldingUpdateIn(Holding):
    pass
