from clients.file.file_service_client import FileServiceClient
from core.config import settings
from core.database import get_backend_sql_client
from dependency_injector import containers, providers

# Repository
from repositories.message_queue.message_queue_repository import MessageQueueRepository
from repositories.nav.nav_repository import NavRepository
from repositories.portfolio.portfolio_repository import PortfolioRepository
from repositories.watchlist.watchlist_repository import WatchlistRepository

# Service
from services.message_queue.message_queue_service import MessageQueueService
from services.nav.nav_service import NavService
from services.portfolio.portfolio_service import PortfolioService
from services.watchlist.watchlist_service import WatchlistService


class Container(containers.DeclarativeContainer):
    # Config
    config = providers.Object(settings)

    # Database
    backend_sql_client = providers.Singleton(get_backend_sql_client, config)

    # Client
    file_service_client = providers.Singleton(FileServiceClient, config)

    # Repository
    portfolio_repository = providers.Factory(PortfolioRepository, sql_client=backend_sql_client)
    watchlist_repository = providers.Factory(WatchlistRepository, sql_client=backend_sql_client)
    nav_repository = providers.Factory(NavRepository, sql_client=backend_sql_client)
    message_queue_repository = providers.Factory(MessageQueueRepository, sql_client=backend_sql_client)

    # Service
    portfolio_service = providers.Factory(PortfolioService, portfolio_repository=portfolio_repository)
    watchlist_service = providers.Factory(WatchlistService, watchlist_repository=watchlist_repository)
    nav_service = providers.Factory(NavService, nav_repository=nav_repository)
    message_queue_service = providers.Factory(
        MessageQueueService, message_queue_repository=message_queue_repository, nav_service=nav_service
    )

    # Router
    router_modules = [
        "routers.portfolio.portfolio_router",
        "routers.watchlist.watchlist_router",
        "routers.nav.nav_router",
    ]
    # Manager
    manager_modules = [
        "managers.message_queue.message_consumer_manager",
        "managers.nav.nav_producer_manager",
    ]
    wiring_config = containers.WiringConfiguration(modules=router_modules + manager_modules)
