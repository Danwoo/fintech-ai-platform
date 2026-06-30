from contextlib import asynccontextmanager

import uvicorn
from core.config import settings  # noqa: F401
from core.container import Container
from core.exception_handler import get_exception_handlers
from core.logger import logger
from core.middlewares import get_middlewares
from fastapi import FastAPI
from routers.file.file_router import router as file_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    file_sql_client = app.container.file_sql_client()

    yield

    try:
        file_sql_client.dispose()
        logger.info("SQL Database disconnect successful")
    except Exception as e:
        logger.error(f"SQL Database disconnect failed: {e}")


app = FastAPI(
    title="File API",
    description="File API Server",
    version="1.0",
    root_path="/" + settings.SERVICE_NAME,
    lifespan=lifespan,
    middleware=get_middlewares(),
    exception_handlers=get_exception_handlers(),
)

app.container = Container()

app.include_router(file_router)


if __name__ == "__main__":
    try:
        uvicorn.run("main:app", host="0.0.0.0", port=8100, reload=True)
    except KeyboardInterrupt:
        pass
