import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Index, Integer, Numeric, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


# 1. Base 클래스
class Base(DeclarativeBase):
    pass


# 2. Board 모델
class Board(Base):
    __tablename__ = "TN_Board"
    __table_args__ = (Index("idx_board_reg_dt", "reg_dt"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    bbs_ty: Mapped[str | None] = mapped_column(String(5), nullable=True)
    sj: Mapped[str] = mapped_column(String(200), nullable=False)
    cn: Mapped[str | None] = mapped_column(Text, nullable=True)
    atch_file_id: Mapped[str | None] = mapped_column(String(20), nullable=True)
    rdcnt: Mapped[int | None] = mapped_column(Integer, default=0)
    use_at: Mapped[str | None] = mapped_column(String(5), default="Y", server_default="Y")

    reg_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, default=func.now())
    reg_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    mod_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, onupdate=func.now(), nullable=True)
    mod_id: Mapped[str | None] = mapped_column(String(100), nullable=True)


# 3. MessageQueue (Kafka 대체 DB 메시지 큐 — producer publish → consumer 소비/적재; 시세/체결 틱 인제스트)
class MessageQueue(Base):
    __tablename__ = "TN_MessageQueue"
    __table_args__ = (Index("idx_message_queue_status", "status"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    topic: Mapped[str] = mapped_column(String(100), nullable=False)
    payload: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", server_default="pending")
    retry_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    error: Mapped[str | None] = mapped_column(String(500), nullable=True)

    reg_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, default=func.now())
    reg_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    mod_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, onupdate=func.now(), nullable=True)
    mod_id: Mapped[str | None] = mapped_column(String(100), nullable=True)


# 4. Watchlist (관심종목) 모델
class Watchlist(Base):
    __tablename__ = "TN_Watchlist"

    ticker: Mapped[str] = mapped_column(String(20), primary_key=True)
    issuer_nm: Mapped[str | None] = mapped_column(String(200), nullable=True)
    market: Mapped[str | None] = mapped_column(String(20), nullable=True)
    sector: Mapped[str | None] = mapped_column(String(100), nullable=True)
    currency: Mapped[str | None] = mapped_column(String(5), nullable=True)
    target_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    alert_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    priority: Mapped[str | None] = mapped_column(String(5), nullable=True)
    use_at: Mapped[str | None] = mapped_column(String(1), default="Y", server_default="Y")
    memo: Mapped[str | None] = mapped_column(String(1300), nullable=True)

    reg_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, default=func.now())
    reg_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    mod_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, onupdate=func.now(), nullable=True)
    mod_id: Mapped[str | None] = mapped_column(String(100), nullable=True)


# 5. Portfolio → Holding (2-level master-detail 예시 — 포트폴리오 마스터 / 보유종목 디테일)
class Portfolio(Base):
    __tablename__ = "TN_Portfolio"

    portfolio_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    portfolio_nm: Mapped[str] = mapped_column(String(200), nullable=False)
    sort_ordr: Mapped[int | None] = mapped_column(Integer, default=1)
    use_at: Mapped[str] = mapped_column(String(1), default="Y", server_default="Y")
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    reg_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, default=func.now())
    reg_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    mod_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, onupdate=func.now(), nullable=True)
    mod_id: Mapped[str | None] = mapped_column(String(100), nullable=True)


class Holding(Base):
    __tablename__ = "TN_Holding"

    portfolio_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    ticker: Mapped[str] = mapped_column(String(20), primary_key=True)
    holding_nm: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[int | None] = mapped_column(Integer, default=0)
    avg_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), default=0)
    use_at: Mapped[str] = mapped_column(String(1), default="Y", server_default="Y")
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    reg_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, default=func.now())
    reg_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    mod_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, onupdate=func.now(), nullable=True)
    mod_id: Mapped[str | None] = mapped_column(String(100), nullable=True)


# 6. Nav (producer → message queue → consumer 파이프라인이 적재하는 포트폴리오 NAV/가격 시계열, 대시보드 차트 소스)
class Nav(Base):
    __tablename__ = "TN_Nav"
    __table_args__ = (Index("idx_nav_dt", "nav_dt"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nav_dt: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    nav: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    benchmark: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    daily_return: Mapped[Decimal | None] = mapped_column(Numeric(10, 4), nullable=True)
    drawdown: Mapped[Decimal | None] = mapped_column(Numeric(10, 4), nullable=True)

    reg_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, default=func.now())
    reg_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    mod_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, onupdate=func.now(), nullable=True)
    mod_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
