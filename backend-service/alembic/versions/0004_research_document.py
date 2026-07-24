"""add TN_ResearchDocument job store for research document ingest orchestration

Revision ID: 0004_research_document
Revises: 0003_watchlist_atch_file
Create Date: 2026-07-25 00:00:00.000000

리서치 문서 업로드→인덱싱 잡의 진행 상태를 추적하는 신규 테이블 TN_ResearchDocument 를 추가한다.
backend-service 가 file-service 실물 저장과 doc-search 인제스트를 오케스트레이션하면서 그 상태를
(uploaded→parsing→indexed|empty|failed) 이 행에 남긴다. additive — 신규 테이블이라 기존 데이터 무영향,
롤백은 DROP TABLE 로 안전하다. company_id(테넌트 격리)·atch_file_id(파일 회수 키)에 인덱스를 건다.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0004_research_document"
down_revision: str | Sequence[str] | None = "0003_watchlist_atch_file"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "TN_ResearchDocument",
        sa.Column("research_doc_id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.String(length=100), nullable=False),
        sa.Column("atch_file_id", sa.String(length=20), nullable=False),
        sa.Column("file_sn", sa.Integer(), nullable=True),
        sa.Column("doc_title", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="uploaded"),
        sa.Column("chunk_count", sa.Integer(), nullable=True),
        sa.Column("error_msg", sa.String(length=1000), nullable=True),
        sa.Column("reg_dt", sa.DateTime(), nullable=True),
        sa.Column("reg_id", sa.String(length=100), nullable=True),
        sa.Column("mod_dt", sa.DateTime(), nullable=True),
        sa.Column("mod_id", sa.String(length=100), nullable=True),
        sa.PrimaryKeyConstraint("research_doc_id", name="PK_TN_ResearchDocument"),
    )
    op.create_index("idx_research_document_company", "TN_ResearchDocument", ["company_id"])
    op.create_index("idx_research_document_atch_file", "TN_ResearchDocument", ["atch_file_id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("idx_research_document_atch_file", table_name="TN_ResearchDocument")
    op.drop_index("idx_research_document_company", table_name="TN_ResearchDocument")
    op.drop_table("TN_ResearchDocument")
