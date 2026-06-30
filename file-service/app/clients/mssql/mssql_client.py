# MSSQL (SQLAlchemy) Engine 클라이언트 — container 가 config 주입
import urllib.parse

from core.logger import logger
from sqlalchemy import Engine, create_engine, event, text
from utils.common.retry_utils import retry


def get_mssql_client(config) -> Engine:
    odbc_str = (
        f"DRIVER={config.FILE_SQL_DB_ODBC_DRIVER};"
        f"SERVER={config.FILE_SQL_DB_HOST},{config.FILE_SQL_DB_PORT};"
        f"DATABASE={config.FILE_SQL_DB_NAME};"
        f"UID={config.FILE_SQL_DB_USER};"
        f"PWD={config.FILE_SQL_DB_PASSWORD};"
        "Encrypt=no;"
        "TrustServerCertificate=yes;"
    )
    engine_url = f"{config.FILE_SQL_DB_DRIVER}:///?odbc_connect={urllib.parse.quote_plus(odbc_str)}"
    engine = create_engine(
        engine_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30,
        pool_recycle=1800,
        echo=False,
    )

    @event.listens_for(engine, "do_connect")
    def _retry_connect(dialect, conn_rec, cargs, cparams):
        return retry(
            lambda: dialect.connect(*cargs, **cparams),
            max_retries=2,
            base_delay=0.5,
            label="DB connect (FILE)",
        )

    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))

    logger.info("SQL Database connect successful (FILE)")
    return engine
