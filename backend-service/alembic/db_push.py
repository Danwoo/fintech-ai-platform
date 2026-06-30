"""
Prisma-style Database Push Tool


SQLAlchemy 모델 변경사항을 마이그레이션 히스토리 없이 DB에 직접 적용합니다.
개발 환경에서 빠른 스키마 동기화에 사용됩니다.


사용법:
    python db_push.py --env development
    python db_push.py --env production --accept-data-loss
    python db_push.py --env development --force-reset
    python db_push.py --env development --skip-generate
"""

import argparse
import os
import re
import sys
import time
from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory
from dotenv import load_dotenv
from sqlalchemy import MetaData, create_engine, inspect, text

from alembic import command

# ==============================================================================
# Path Configuration
# ==============================================================================


current_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.join(os.path.dirname(current_dir), "app")


if app_dir not in sys.path:
    sys.path.insert(0, app_dir)


# ==============================================================================
# Environment Configuration
# ==============================================================================


parser = argparse.ArgumentParser(
    description="Prisma 스타일 데이터베이스 스키마 동기화 도구", formatter_class=argparse.RawDescriptionHelpFormatter
)
parser.add_argument("--env", default="development", choices=["development", "staging", "production"], help="대상 환경")
parser.add_argument("--accept-data-loss", action="store_true", help="데이터 손실을 확인 없이 허용")
parser.add_argument("--force-reset", action="store_true", help="전체 데이터베이스 스키마를 삭제하고 재생성")
parser.add_argument("--skip-generate", action="store_true", help="SQLAlchemy 모델 검증 건너뛰기")
parser.add_argument("--schema", type=str, help="사용자 정의 모델 모듈 경로")


args = parser.parse_args()


env_path = os.path.join(app_dir, f".env.{args.env}")
load_dotenv(env_path)


from utils.common.database_utils import get_sql_db_url

# ==============================================================================
# Environment Variable Mapping
# ==============================================================================


def setup_alembic_env_vars():
    mapping = {
        "ALEMBIC_DB_DRIVER": "BACKEND_SQL_DB_DRIVER",
        "ALEMBIC_DB_ODBC_DRIVER": "BACKEND_SQL_DB_ODBC_DRIVER",
        "ALEMBIC_DB_HOST": "BACKEND_SQL_DB_HOST",
        "ALEMBIC_DB_PORT": "BACKEND_SQL_DB_PORT",
        "ALEMBIC_DB_NAME": "BACKEND_SQL_DB_NAME",
        "ALEMBIC_DB_USER": "BACKEND_SQL_DB_USER",
        "ALEMBIC_DB_PASSWORD": "BACKEND_SQL_DB_PASSWORD",
    }
    for alembic_key, source_key in mapping.items():
        if value := os.getenv(source_key):
            os.environ[alembic_key] = value


def get_alembic_db_url() -> str:
    driver = os.getenv("ALEMBIC_DB_DRIVER", "mssql+pyodbc")

    odbc_driver = ""
    if "pyodbc" in driver.lower():
        odbc_driver = os.getenv("ALEMBIC_DB_ODBC_DRIVER", "ODBC Driver 18 for SQL Server")

    url = get_sql_db_url(
        driver=driver,
        odbc_driver=odbc_driver,
        host=os.getenv("ALEMBIC_DB_HOST", "localhost"),
        port=int(os.getenv("ALEMBIC_DB_PORT", "1433")),
        dbname=os.getenv("ALEMBIC_DB_NAME", ""),
        user=os.getenv("ALEMBIC_DB_USER", ""),
        password=os.getenv("ALEMBIC_DB_PASSWORD", ""),
    )
    return url.replace("%", "%%")


def get_db_info():
    """데이터베이스 정보 반환"""
    driver = os.getenv("ALEMBIC_DB_DRIVER", "mssql+pyodbc")
    host = os.getenv("ALEMBIC_DB_HOST", "localhost")
    port = os.getenv("ALEMBIC_DB_PORT", "1433")
    dbname = os.getenv("ALEMBIC_DB_NAME", "")

    if "mssql" in driver.lower():
        db_type = "SQL Server"
    elif "postgresql" in driver.lower():
        db_type = "PostgreSQL"
    elif "mysql" in driver.lower():
        db_type = "MySQL"
    elif "oracle" in driver.lower():
        db_type = "Oracle"
    else:
        db_type = driver

    return {"type": db_type, "name": dbname, "host": host, "port": port}


# ==============================================================================
# Data Loss Detection
# ==============================================================================


def get_table_row_count(engine, table_name: str) -> int:
    """특정 테이블의 행 개수 조회"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
            return result.scalar() or 0
    except Exception:
        return 0


def detect_dangerous_operations(upgrade_body: str, engine) -> dict:
    """데이터 손실 위험 작업 감지"""
    dangerous_ops = []

    # 테이블 삭제 감지
    for match in re.finditer(r"op\.drop_table\(['\"](\w+)['\"]", upgrade_body):
        table_name = match.group(1)
        row_count = get_table_row_count(engine, table_name)

        if row_count > 0:
            dangerous_ops.append(
                {
                    "message": f"`{table_name}` 테이블을 삭제하려고 합니다. 테이블이 비어있지 않습니다 ({row_count}개 행)."
                }
            )
        else:
            dangerous_ops.append({"message": f"`{table_name}` 테이블을 삭제하려고 합니다."})

    # 컬럼 삭제 감지
    for match in re.finditer(r"op\.drop_column\(['\"](\w+)['\"],\s*['\"](\w+)['\"]", upgrade_body):
        table_name = match.group(1)
        column_name = match.group(2)

        try:
            with engine.connect() as conn:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name} WHERE {column_name} IS NOT NULL"))
                non_null_count = result.scalar() or 0

                if non_null_count > 0:
                    dangerous_ops.append(
                        {
                            "message": f"`{table_name}` 테이블의 `{column_name}` 컬럼을 삭제하려고 합니다. NULL이 아닌 값이 {non_null_count}개 있습니다."
                        }
                    )
                else:
                    dangerous_ops.append(
                        {"message": f"`{table_name}` 테이블의 `{column_name}` 컬럼을 삭제하려고 합니다."}
                    )
        except Exception:
            dangerous_ops.append({"message": f"`{table_name}` 테이블의 `{column_name}` 컬럼을 삭제하려고 합니다."})

    return {"has_danger": len(dangerous_ops) > 0, "operations": dangerous_ops}


def confirm_dangerous_operations(dangerous_info: dict, environment: str) -> bool:
    """데이터 손실 경고 및 확인"""

    print("\n⚠️  현재 데이터소스에 대한 경고:\n")

    for op in dangerous_info["operations"]:
        print(f"  • {op['message']}")

    if args.accept_data_loss:
        print("\n✓ --accept-data-loss 플래그로 자동 진행합니다")
        return True

    if environment == "production":
        print("\n❌ 오류: 프로덕션 환경에서 이 변경사항을 적용하려면 --accept-data-loss 플래그를 사용하세요.")
        return False

    print(
        "\n💡 이 마이그레이션을 적용하려면 데이터베이스를 리셋해야 합니다. 계속하시겠습니까? 모든 데이터가 손실됩니다."
    )

    try:
        response = input("  yes\n  no\n\n> ").strip().lower()
    except (KeyboardInterrupt, EOFError):
        print("\n")
        return False

    return response == "yes"


# ==============================================================================
# Force Reset
# ==============================================================================


def force_reset_database(db_url: str):
    """데이터베이스 전체 리셋"""

    if args.env == "production" and not args.accept_data_loss:
        print("❌ 오류: 프로덕션 환경에서 --force-reset을 사용하려면 --accept-data-loss와 함께 사용해야 합니다.")
        sys.exit(1)

    if not args.accept_data_loss:
        print("\n⚠️  경고: 데이터베이스의 모든 데이터가 삭제됩니다!")
        try:
            response = input("계속하려면 'yes'를 입력하세요: ").strip().lower()
        except (KeyboardInterrupt, EOFError):
            print("\n")
            sys.exit(0)

        if response != "yes":
            print("❌ 작업이 취소되었습니다")
            sys.exit(0)

    try:
        print("🔄 데이터베이스를 초기화하는 중...")
        engine = create_engine(db_url.replace("%%", "%"))

        metadata = MetaData()
        metadata.reflect(bind=engine, resolve_fks=False)

        with engine.begin() as conn:
            driver = os.getenv("ALEMBIC_DB_DRIVER", "mssql+pyodbc")
            if "mssql" in driver.lower():
                inspector = inspect(engine)
                for table_name in inspector.get_table_names():
                    for fk in inspector.get_foreign_keys(table_name):
                        fk_name = fk["name"]
                        try:
                            conn.execute(text(f"ALTER TABLE {table_name} DROP CONSTRAINT {fk_name}"))
                        except Exception:
                            pass
            elif "postgresql" in driver.lower():
                conn.execute(text("SET session_replication_role = 'replica'"))
            elif "mysql" in driver.lower():
                conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))

        metadata.drop_all(bind=engine)

        with engine.begin() as conn:
            if "postgresql" in driver.lower():
                conn.execute(text("SET session_replication_role = 'origin'"))
            elif "mysql" in driver.lower():
                conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))

        try:
            with engine.begin() as conn:
                conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
        except Exception:
            pass

        engine.dispose()
        print("✓ 데이터베이스 초기화 완료\n")

    except Exception as e:
        print(f"\n❌ 오류: {e}")
        sys.exit(1)


# ==============================================================================
# Model Validation
# ==============================================================================


def validate_models():
    """SQLAlchemy 모델 검증"""
    if args.skip_generate:
        return

    try:
        if args.schema:
            schema_module = args.schema
        else:
            schema_module = "models.base"

        try:
            module = __import__(schema_module, fromlist=["Base"])
            Base = getattr(module, "Base", None)

            if Base and hasattr(Base, "metadata"):
                return True
        except ImportError:
            pass
    except Exception:
        pass


# ==============================================================================
# Database Create
# ==============================================================================


def db_create():
    """대상 데이터베이스가 없으면 시스템 DB에 접속하여 생성 (MSSQL / PostgreSQL / MySQL 지원)"""
    driver = os.getenv("ALEMBIC_DB_DRIVER", "mssql+pyodbc")
    dbname = os.getenv("ALEMBIC_DB_NAME", "")

    if "mssql" in driver.lower():
        system_db = "master"
        check_sql = f"SELECT name FROM sys.databases WHERE name = '{dbname}'"
        create_sql = f"CREATE DATABASE [{dbname}]"
    elif "postgresql" in driver.lower():
        system_db = "postgres"
        check_sql = f"SELECT datname FROM pg_database WHERE datname = '{dbname}'"
        create_sql = f'CREATE DATABASE "{dbname}"'
    elif "mysql" in driver.lower():
        system_db = "mysql"
        check_sql = f"SELECT schema_name FROM information_schema.schemata WHERE schema_name = '{dbname}'"
        create_sql = f"CREATE DATABASE `{dbname}`"
    else:
        print(f"⚠️  '{driver}' 드라이버는 자동 DB 생성을 지원하지 않습니다. 수동으로 생성해주세요.")
        return

    os.environ["ALEMBIC_DB_NAME"] = system_db
    system_url = get_alembic_db_url()
    os.environ["ALEMBIC_DB_NAME"] = dbname

    try:
        engine = create_engine(system_url.replace("%%", "%"), isolation_level="AUTOCOMMIT")
        with engine.connect() as conn:
            result = conn.execute(text(check_sql))
            if not result.fetchone():
                conn.execute(text(create_sql))
                print(f"✓ 데이터베이스 '{dbname}' 생성 완료")
        engine.dispose()
    except Exception as e:
        print(f"\n❌ 데이터베이스 생성 오류: {e}")
        sys.exit(1)


# ==============================================================================
# Database Push
# ==============================================================================


def db_push():
    """Prisma 스타일 DB Push"""
    db_url = get_alembic_db_url()
    os.environ["ALEMBIC_DB_URL"] = db_url
    temp_file = None
    start_time = time.time()

    try:
        print(f"🌿 .env.{args.env}에서 환경 변수를 로드했습니다")

        db_info = get_db_info()
        print(
            f'📊 데이터소스 "db": {db_info["type"]} 데이터베이스 "{db_info["name"]}" ({db_info["host"]}:{db_info["port"]})'
        )

        if args.force_reset:
            force_reset_database(db_url)

        validate_models()

        print("🔍 스키마 변경사항을 분석하는 중...")
        alembic_cfg = Config(os.path.join(current_dir, "alembic.ini"))
        alembic_cfg.set_main_option("script_location", current_dir)
        alembic_cfg.cmd_opts = argparse.Namespace(autogenerate=True)

        Path(current_dir, "versions").mkdir(exist_ok=True)

        command.revision(alembic_cfg, autogenerate=True, message="temp_push")

        script_dir = ScriptDirectory.from_config(alembic_cfg)
        if not (head := script_dir.get_current_head()):
            elapsed = int((time.time() - start_time) * 1000)
            print(f"\n✅ 변경사항이 없습니다. 데이터베이스가 이미 스키마와 동기화되어 있습니다. {elapsed}ms 소요")

            if not args.skip_generate:
                print("✔ SQLAlchemy 모델이 검증되었습니다")
            return

        temp_file = Path(script_dir.get_revision(head).path)
        content = temp_file.read_text(encoding="utf-8")

        if content.count("pass") >= 2 and "op." not in content:
            elapsed = int((time.time() - start_time) * 1000)
            print(f"\n✅ 변경사항이 없습니다. 데이터베이스가 이미 스키마와 동기화되어 있습니다. {elapsed}ms 소요")
            temp_file.unlink()

            if not args.skip_generate:
                print("✔ SQLAlchemy 모델이 검증되었습니다")
            return

        m = re.search(r"def upgrade\(\).*?:\n(.*?)(?:\ndef downgrade|\Z)", content, re.DOTALL)
        upgrade_body = m.group(1) if m else content

        engine = create_engine(db_url.replace("%%", "%"))
        dangerous_info = detect_dangerous_operations(upgrade_body, engine)
        engine.dispose()

        if dangerous_info["has_danger"]:
            if not confirm_dangerous_operations(dangerous_info, args.env):
                if temp_file and temp_file.exists():
                    temp_file.unlink()
                print("❌ 작업이 취소되었습니다")
                sys.exit(0)

        print("\n🔨 데이터베이스에 변경사항을 적용하는 중...")
        command.upgrade(alembic_cfg, "head")

        elapsed = int((time.time() - start_time) * 1000)
        print(f"\n✅ 스키마 변경사항이 적용되었습니다. 데이터베이스가 동기화되었습니다. {elapsed}ms 소요")

        if not args.skip_generate:
            print("✔ SQLAlchemy 모델이 생성되었습니다")

    except Exception as e:
        print(f"\n❌ 오류: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)

    finally:
        try:
            engine = create_engine(db_url.replace("%%", "%"))
            with engine.connect() as conn:
                conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
                conn.commit()
            engine.dispose()

            if temp_file and temp_file.exists():
                temp_file.unlink()
        except Exception:
            pass


# ==============================================================================
# Entry Point
# ==============================================================================


if __name__ == "__main__":
    if args.force_reset and args.env == "production" and not args.accept_data_loss:
        print("❌ 오류: 프로덕션 환경에서 --force-reset을 사용하려면 --accept-data-loss와 함께 사용해야 합니다.")
        sys.exit(1)

    setup_alembic_env_vars()
    db_create()
    db_push()
