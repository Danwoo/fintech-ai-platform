from contextlib import asynccontextmanager

import uvicorn
from core.container import Container
from core.exception_handler import get_exception_handlers
from core.logger import logger
from core.middlewares import get_middlewares
from fastapi import FastAPI
from managers.message_queue.message_consumer_manager import message_consumer_manager
from managers.nav.nav_producer_manager import nav_producer_manager
from routers.nav.nav_router import router as nav_router
from routers.portfolio.portfolio_router import router as portfolio_router
from routers.watchlist.watchlist_router import router as watchlist_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 백그라운드 매니저가 앱 안에서 실행 → 매니저 있는 서비스는 단일 프로세스(--workers=1)로 운영 (멀티워커 시 매니저 중복)
    backend_sql_client = app.container.backend_sql_client()
    await message_consumer_manager.start()
    await nav_producer_manager.start()

    yield

    await nav_producer_manager.stop()
    await message_consumer_manager.stop()
    try:
        backend_sql_client.dispose()
        logger.info("SQL Database disconnect successful")
    except Exception as e:
        logger.error(f"SQL Database disconnect failed: {e}")


app = FastAPI(
    title="Backend API",
    description="Backend API Server",
    version="1.0",
    lifespan=lifespan,
    middleware=get_middlewares(),
    exception_handlers=get_exception_handlers(),
)

app.container = Container()

app.include_router(portfolio_router)
app.include_router(watchlist_router)
app.include_router(nav_router)

if __name__ == "__main__":
    try:
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    except KeyboardInterrupt:
        pass
