from contextlib import asynccontextmanager

import uvicorn
from core.container import Container
from core.exception_handler import get_exception_handlers
from core.logger import logger
from core.middlewares import get_middlewares
from fastapi import FastAPI
from managers.scheduler_manager import scheduler_manager
from routers.chat.chat_router import router as chat_router
from routers.scheduler.scheduler_router import router as scheduler_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 스케줄러는 단일 프로세스(--workers=1) 운영 (멀티워커 시 중복 실행)
    scheduler_manager.start()

    yield

    await scheduler_manager.stop()
    logger.info("Portfolio Activity service shutdown")


app = FastAPI(
    title="Portfolio Activity Service API",
    description="포트폴리오 활동 기반 주기 활동 요약 스케줄러 + 포트폴리오 활동 조회 챗",
    version="1.0",
    lifespan=lifespan,
    middleware=get_middlewares(),
    exception_handlers=get_exception_handlers(),
)

app.container = Container()

app.include_router(chat_router)
app.include_router(scheduler_router)

if __name__ == "__main__":
    try:
        uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
    except KeyboardInterrupt:
        pass
