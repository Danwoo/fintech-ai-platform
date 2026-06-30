from sqlalchemy import Engine
from utils.common.database_utils import create_sql_engine_from_settings


def get_file_sql_client(config) -> Engine:
    return create_sql_engine_from_settings(
        db_name_log="FILE",
        driver=config.FILE_SQL_DB_DRIVER,
        odbc_driver=config.FILE_SQL_DB_ODBC_DRIVER,
        host=config.FILE_SQL_DB_HOST,
        port=config.FILE_SQL_DB_PORT,
        dbname=config.FILE_SQL_DB_NAME,
        user=config.FILE_SQL_DB_USER,
        password=config.FILE_SQL_DB_PASSWORD,
    )
