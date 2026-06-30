from clients.file.sftp_client import SftpClient
from core.config import settings
from core.database import get_file_sql_client
from dependency_injector import containers, providers
from repositories.file.file_repository import FileRepository
from repositories.file.sftp_file_repository import SftpFileRepository
from services.file.file_service import FileService


class Container(containers.DeclarativeContainer):
    # Config
    config = providers.Object(settings)

    # Database
    file_sql_client = providers.Singleton(get_file_sql_client, config)

    # Client
    sftp_client = providers.Singleton(SftpClient, config)

    # Repository
    file_repository = providers.Factory(FileRepository, sql_client=file_sql_client)
    sftp_file_repository = providers.Factory(SftpFileRepository, sftp_client=sftp_client)

    # Service
    file_service = providers.Factory(FileService, file_repository=file_repository, file_store=sftp_file_repository)

    # Router
    router_modules = [
        "routers.file.file_router",
    ]
    wiring_config = containers.WiringConfiguration(modules=router_modules)
