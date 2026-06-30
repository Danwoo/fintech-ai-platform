from sqlalchemy import Engine
from utils.common.database_utils import create_sql_engine_from_settings


def get_devactivity_sql_client(config) -> Engine:
    return create_sql_engine_from_settings(
        db_name_log="BACKEND",
        driver=config.DEVACTIVITY_SQL_DB_DRIVER,
        odbc_driver=config.DEVACTIVITY_SQL_DB_ODBC_DRIVER,
        host=config.DEVACTIVITY_SQL_DB_HOST,
        port=config.DEVACTIVITY_SQL_DB_PORT,
        dbname=config.DEVACTIVITY_SQL_DB_NAME,
        user=config.DEVACTIVITY_SQL_DB_USER,
        password=config.DEVACTIVITY_SQL_DB_PASSWORD,
    )
