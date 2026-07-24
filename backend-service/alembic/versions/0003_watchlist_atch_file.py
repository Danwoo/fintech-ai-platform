"""add atch_file_id to watchlist for research document attachment

Revision ID: 0003_watchlist_atch_file
Revises: 0002_nav_idempotency
Create Date: 2026-07-24 00:00:00.000000

관심종목(TN_Watchlist) 티커별 리서치 문서 첨부를 위해 file-service 의 첨부 그룹 식별자를
담는 atch_file_id(NULL 허용) 컬럼을 추가한다. additive — 기존 행은 NULL 로 남고 데이터 무손실.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0003_watchlist_atch_file"
down_revision: str | Sequence[str] | None = "0002_nav_idempotency"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("TN_Watchlist", sa.Column("atch_file_id", sa.String(length=20), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("TN_Watchlist", "atch_file_id")
