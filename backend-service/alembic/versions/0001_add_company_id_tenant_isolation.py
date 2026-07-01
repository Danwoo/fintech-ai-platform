"""add company_id tenant isolation to watchlist/portfolio/holding/nav

Revision ID: 0001_company_id
Revises:
Create Date: 2026-07-01 00:00:00.000000

멀티테넌트 격리: TN_Watchlist / TN_Portfolio / TN_Holding 은 company_id 를 복합 PK 에
편입하고, TN_Nav 는 company_id(NOT NULL) + 인덱스를 추가한다. 기존 행은 시드 테넌트(1)로
백필한 뒤 NOT NULL / PK 를 적용한다.
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001_company_id"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SEED_COMPANY_ID = "1"


def _pk_name(table: str) -> str:
    return f"PK_{table}"


def upgrade() -> None:
    """Upgrade schema."""
    # 1) company_id 컬럼 추가 (기존 행은 시드 테넌트로 백필 후 NOT NULL)
    for table in ("TN_Watchlist", "TN_Portfolio", "TN_Holding", "TN_Nav"):
        op.add_column(
            table,
            sa.Column("company_id", sa.Integer(), nullable=False, server_default=SEED_COMPANY_ID),
        )

    # 2) 복합 PK 재구성 (기존 PK 를 drop 후 company_id 를 선두로 재생성)
    composite_pk = {
        "TN_Watchlist": ["company_id", "ticker"],
        "TN_Portfolio": ["company_id", "portfolio_id"],
        "TN_Holding": ["company_id", "portfolio_id", "ticker"],
    }
    for table, cols in composite_pk.items():
        op.drop_constraint(_pk_name(table), table, type_="primary")
        op.create_primary_key(_pk_name(table), table, cols)

    # 3) TN_Nav 는 id PK 유지 — company_id 인덱스만 추가
    op.create_index("idx_nav_company", "TN_Nav", ["company_id"])

    # 4) 백필용 server_default 제거 (신규 행은 애플리케이션이 명시적으로 채운다)
    for table in ("TN_Watchlist", "TN_Portfolio", "TN_Holding", "TN_Nav"):
        op.alter_column(table, "company_id", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("idx_nav_company", table_name="TN_Nav")

    original_pk = {
        "TN_Watchlist": ["ticker"],
        "TN_Portfolio": ["portfolio_id"],
        "TN_Holding": ["portfolio_id", "ticker"],
    }
    for table, cols in original_pk.items():
        op.drop_constraint(_pk_name(table), table, type_="primary")
        op.create_primary_key(_pk_name(table), table, cols)

    for table in ("TN_Watchlist", "TN_Portfolio", "TN_Holding", "TN_Nav"):
        op.drop_column(table, "company_id")
