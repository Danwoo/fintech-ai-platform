"""
Alembic Migration Environment Configuration


이 모듈은 Alembic의 마이그레이션 환경을 설정합니다.
db_push.py를 통해 실행되며, SQLAlchemy 모델과 실제 DB 스키마를 비교합니다.
"""

import os
import sys
from logging.config import fileConfig

from sqlalchemy import Table, engine_from_config, event, pool

from alembic import context

# ==============================================================================
# Path Configuration
# ==============================================================================


current_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.join(os.path.dirname(current_dir), "app")


if app_dir not in sys.path:
    sys.path.insert(0, app_dir)


from models.schema import Base

# ==============================================================================
# Alembic Configuration
# ==============================================================================


config = context.config


# alembic.ini 파일에서 로깅 설정 로드
if config.config_file_name:
    fileConfig(config.config_file_name)


# SQLAlchemy 모델의 메타데이터 (테이블 정의)
target_metadata = Base.metadata


# db_push.py에서 설정한 환경변수로부터 DB URL 가져오기
db_url = os.getenv("ALEMBIC_DB_URL")
if not db_url:
    raise ValueError("ALEMBIC_DB_URL not set. Run via db_push.py")


config.set_main_option("sqlalchemy.url", db_url)


# ==============================================================================
# Database-Specific Event Handlers
# ==============================================================================


@event.listens_for(Table, "column_reflect")
def receive_column_reflect(inspector, table, column_info):
    """
    MSSQL column comment 무시
    MSSQL은 컬럼 주석을 지원하지 않으므로 reflection 시 제거
    """
    column_info["comment"] = None


# ==============================================================================
# Migration Filters
# ==============================================================================


def include_object(object, name, type_, reflected, compare_to):
    """
    마이그레이션에 포함할 객체 필터링


    - alembic_version 테이블 제외
    - 테이블/컬럼의 comment 비교 무시 (MSSQL 호환성)
    """
    if type_ in ("table", "column") and compare_to is not None:
        object.comment = compare_to.comment = None

    return not (type_ == "table" and name == "alembic_version")


def include_name(name, type_, parent_names):
    """
    익명 제약조건 필터링


    SQLAlchemy가 자동 생성한 이름 없는 FK/Unique 제약조건 무시
    """
    return not (type_ in ("foreign_key_constraint", "unique_constraint") and name is None)


def process_revision_directives(context, revision, directives):
    """
    빈 마이그레이션 파일 생성 방지


    스키마 변경사항이 없을 경우 마이그레이션 파일을 생성하지 않음
    db_push.py에서 사용자에게 메시지를 표시합니다
    """
    if getattr(config.cmd_opts, "autogenerate", None):
        script = directives[0]
        if script.upgrade_ops.is_empty() or not script.upgrade_ops.ops:
            directives[:] = []


# ==============================================================================
# Migration Execution
# ==============================================================================


def run_migrations_offline():
    """
    오프라인 모드로 마이그레이션 실행


    DB 연결 없이 SQL 스크립트만 생성할 때 사용
    """
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
        include_name=include_name,
        compare_type=False,  # 컬럼 타입 변경 감지 비활성화 (MSSQL 호환성)
        compare_server_default=False,  # 서버 기본값 비교 비활성화
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """
    온라인 모드로 마이그레이션 실행


    실제 DB 연결을 통해 스키마 변경을 적용
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,  # 마이그레이션용 단일 연결
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=False,
            compare_server_default=False,
            include_object=include_object,
            include_name=include_name,
            process_revision_directives=process_revision_directives,
        )
        with context.begin_transaction():
            context.run_migrations()


# ==============================================================================
# Entry Point
# ==============================================================================


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
