from clients.doc_search.doc_search_client import DocSearchClient
from clients.file.file_service_client import FileServiceClient
from core.config import settings
from core.database import get_backend_sql_client
from dependency_injector import containers, providers

# Repository
from repositories.message_queue.message_queue_repository import MessageQueueRepository
from repositories.nav.nav_repository import NavRepository
from repositories.portfolio.portfolio_repository import PortfolioRepository
from repositories.research_document.research_document_repository import ResearchDocumentRepository
from repositories.watchlist.watchlist_repository import WatchlistRepository

# Service
from services.message_queue.message_queue_service import MessageQueueService
from services.nav.nav_service import NavService
from services.portfolio.portfolio_service import PortfolioService
from services.research_document.research_document_service import ResearchDocumentService
from services.watchlist.watchlist_service import WatchlistService


class Container(containers.DeclarativeContainer):
    # Config
    config = providers.Object(settings)

    # Database
    backend_sql_client = providers.Singleton(get_backend_sql_client, config)

    # Client
    file_service_client = providers.Singleton(FileServiceClient, config)
    doc_search_client = providers.Singleton(DocSearchClient, config)

    # Repository
    portfolio_repository = providers.Factory(PortfolioRepository, sql_client=backend_sql_client)
    watchlist_repository = providers.Factory(WatchlistRepository, sql_client=backend_sql_client)
    nav_repository = providers.Factory(NavRepository, sql_client=backend_sql_client)
    message_queue_repository = providers.Factory(MessageQueueRepository, sql_client=backend_sql_client)
    research_document_repository = providers.Factory(ResearchDocumentRepository, sql_client=backend_sql_client)

    # Service
    portfolio_service = providers.Factory(PortfolioService, portfolio_repository=portfolio_repository)
    watchlist_service = providers.Factory(WatchlistService, watchlist_repository=watchlist_repository)
    nav_service = providers.Factory(NavService, nav_repository=nav_repository)
    message_queue_service = providers.Factory(
        MessageQueueService, message_queue_repository=message_queue_repository, nav_service=nav_service
    )
    research_document_service = providers.Factory(
        ResearchDocumentService,
        research_document_repository=research_document_repository,
        file_service_client=file_service_client,
        doc_search_client=doc_search_client,
    )

    # Router
    router_modules = [
        "routers.portfolio.portfolio_router",
        "routers.watchlist.watchlist_router",
        "routers.nav.nav_router",
        "routers.research_document.research_document_router",
    ]
    # Manager
    manager_modules = [
        "managers.message_queue.message_consumer_manager",
        "managers.nav.nav_producer_manager",
    ]
    wiring_config = containers.WiringConfiguration(modules=router_modules + manager_modules)
