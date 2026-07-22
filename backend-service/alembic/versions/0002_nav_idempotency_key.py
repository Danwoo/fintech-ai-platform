"""add source_message_id idempotency key to nav

Revision ID: 0002_nav_idempotency
Revises: 0001_company_id
Create Date: 2026-07-22 00:00:00.000000

큐 at-least-once 재소비의 TN_Nav 중복 적재를 막는 멱등키를 추가한다. 메시지 id 를 실은
source_message_id(NULL 허용) 컬럼과, NULL 을 제외한 필터드 유니크 인덱스를 둔다. 기존/수동
적재행은 source_message_id 가 NULL 이라 인덱스 대상에서 빠진다(MSSQL 유니크 NULL 1개 제약 회피).
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_nav_idempotency"
down_revision: str | Sequence[str] | None = "0001_company_id"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("TN_Nav", sa.Column("source_message_id", sa.Integer(), nullable=True))
    op.create_index(
        "ux_nav_source_message",
        "TN_Nav",
        ["source_message_id"],
        unique=True,
        mssql_where=sa.text("source_message_id IS NOT NULL"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ux_nav_source_message", table_name="TN_Nav")
    op.drop_column("TN_Nav", "source_message_id")
