from clients.llm.llm_client import get_chat_client, get_llm_client
from clients.mail.mail_client import MailClient
from clients.mcp.mcp_client import get_mcp_client
from core.config import settings
from core.database import get_devactivity_sql_client
from dependency_injector import containers, providers
from repositories.scheduler.scheduler_repository import SchedulerRepository
from services.chat.portfolio_chat_service import PortfolioChatService
from services.report.activity_report_service import ActivityReportService
from services.scheduler.scheduler_service import SchedulerService


class Container(containers.DeclarativeContainer):
    # Config
    config = providers.Object(settings)

    # Database
    devactivity_sql_client = providers.Singleton(get_devactivity_sql_client, config)

    # Client
    mcp_client = providers.Singleton(get_mcp_client, config)
    chat_client = providers.Singleton(get_chat_client, config)
    llm_client = providers.Singleton(get_llm_client, config)
    mail_client = providers.Singleton(MailClient, config)

    # Repository
    scheduler_repository = providers.Factory(SchedulerRepository, sql_client=devactivity_sql_client)

    # Service
    activity_report_service = providers.Factory(
        ActivityReportService,
        mcp_client=mcp_client,
        summarize_client=llm_client,
        mail_client=mail_client,
    )
    scheduler_service = providers.Factory(
        SchedulerService,
        scheduler_repository=scheduler_repository,
        activity_report_service=activity_report_service,
        mcp_client=mcp_client,
    )
    portfolio_chat_service = providers.Factory(
        PortfolioChatService,
        mcp_client=mcp_client,
        chat_client=chat_client,
    )

    router_modules = ["routers.chat.chat_router", "routers.scheduler.scheduler_router"]
    manager_modules = ["managers.scheduler_manager"]
    wiring_config = containers.WiringConfiguration(modules=[*router_modules, *manager_modules])
