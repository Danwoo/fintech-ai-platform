# managers/nav/nav_producer_manager.py
import asyncio
import json
import random

from core.container import Container
from core.logger import logger
from dependency_injector.wiring import Provide, inject
from fastapi.concurrency import run_in_threadpool
from services.message_queue.message_queue_service import MessageQueueService
from utils.common.time_utils import format_kst_seconds

PRODUCE_INTERVAL = 10
TOPIC = "nav.snapshot"

# key: (baseline, step, low, high) — 합성 random-walk 시세/체결 틱 (포트폴리오 NAV·벤치마크 시계열)
_SERIES = {
    "nav": (1000.0, 8.0, 800.0, 1300.0),
    "benchmark": (1000.0, 6.0, 850.0, 1250.0),
    "daily_return": (0.0, 0.6, -8.0, 8.0),
    "drawdown": (-2.0, 0.4, -25.0, 0.0),
}


class NavProducerManager:
    """합성 시세/체결 틱(포트폴리오 NAV 시계열)을 주기적으로 생성해 메시지 큐에 발행 (worker 프로세스 단일 인스턴스)"""

    def __init__(self):
        self.task: asyncio.Task | None = None
        self.should_stop = False
        self._values = {key: base for key, (base, *_rest) in _SERIES.items()}

    def _next_snapshot(self) -> dict:
        for key, (_base, step, low, high) in _SERIES.items():
            self._values[key] = max(low, min(high, self._values[key] + random.uniform(-step, step)))
        return {"timestamp": format_kst_seconds(), **{k: round(v, 4) for k, v in self._values.items()}}

    @inject
    async def start(
        self,
        message_queue_service: MessageQueueService = Provide[Container.message_queue_service],
    ) -> None:
        if self.task and not self.task.done():
            logger.warning("Nav producer already running")
            return

        self.should_stop = False
        logger.info("Starting nav producer...")

        async def loop():
            while not self.should_stop:
                snapshot = self._next_snapshot()
                await run_in_threadpool(
                    message_queue_service.publish,
                    {"topic": TOPIC, "payload": json.dumps(snapshot), "reg_id": "system"},
                )
                await asyncio.sleep(PRODUCE_INTERVAL)

        self.task = asyncio.create_task(loop())

    async def stop(self) -> None:
        logger.info("Stopping nav producer...")
        self.should_stop = True

        if self.task and not self.task.done():
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass

        logger.info("Nav producer stopped successfully")


nav_producer_manager = NavProducerManager()
