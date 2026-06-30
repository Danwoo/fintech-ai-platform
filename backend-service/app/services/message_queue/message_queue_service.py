# services/message_queue/message_queue_service.py
import json

from core.logger import logger
from repositories.message_queue.message_queue_repository import MessageQueueRepository
from services.nav.nav_service import NavService


class MessageQueueService:
    def __init__(self, message_queue_repository: MessageQueueRepository, nav_service: NavService):
        self.message_queue_repository = message_queue_repository
        self.nav_service = nav_service

    def publish(self, args: dict) -> tuple:
        """메시지 발행 — producer 가 topic/payload 를 큐에 적재 (실사용 시 비즈니스 트랜잭션 내 호출 가능)"""
        return self.message_queue_repository.insert_message(args)

    def consume_pending(self, limit: int) -> int:
        """대기 메시지 배치 소비 → 성공 done / 실패 failed 마킹, 처리 건수 반환"""
        messages = self.message_queue_repository.select_pending({"limit": limit})

        processed = 0
        for message in messages:
            try:
                self._dispatch(message)
                self.message_queue_repository.mark_done({"id": message["id"], "mod_id": "system"})
                processed += 1
            except Exception as e:
                self.message_queue_repository.mark_failed(
                    {"id": message["id"], "error": str(e)[:500], "mod_id": "system"}
                )
        return processed

    def _dispatch(self, message: dict) -> None:
        """메시지 소비 — topic 별 핸들러 라우팅 (신규 topic 은 여기 분기 추가)"""
        topic = message["topic"]
        if topic == "nav.snapshot":
            self.nav_service.record_snapshot(json.loads(message["payload"]))
        else:
            logger.info(f"MQ_CONSUME id={message['id']} topic={topic}")
