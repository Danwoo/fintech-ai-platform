"""리서치 문서 업로드→인덱싱 오케스트레이션.

흐름(POST): 잡행 INSERT(status=uploaded) → file-service 에서 실물 bytes 조회 → doc-search 인제스트
호출 → 결과 status(indexed|empty|failed)·chunk_count 로 잡행 UPDATE → 갱신된 행 반환. 인제스트가
실패하면 잡행을 failed 로 남기고(민감정보 마스킹) 도메인 예외(502)로 올린다.

DELETE: doc-search 청크 회수 → file-service 파일 삭제 → 잡행 삭제 순. 외부 삭제가 먼저라 하나라도
실패하면 잡행이 남아 재시도 가능(부분실패 안전 — 예외는 자연 전파해 exception_handler 가 매핑).

테넌트 격리: 모든 경로가 require_company_id() 로 스코프하고, 인제스트/삭제도 그 company_id 를
doc-search 로 넘겨 양쪽에서 fail-closed.
"""

from core.auth_context import get_email, get_user_id, require_company_id
from core.exceptions import BadGatewayError, NotFoundError
from core.logger import logger

# 잡 상태 전이는 사용자 편집이 아니라 인제스트 파이프라인이 유발하는 시스템 이벤트다 (감사컬럼 규약 룰5).
_SYSTEM_ACTOR = "system"


class ResearchDocumentService:
    def __init__(self, research_document_repository, file_service_client, doc_search_client):
        self.repository = research_document_repository
        self.file_service_client = file_service_client
        self.doc_search_client = doc_search_client

    def select_research_document_list(self, args: dict) -> tuple[list, int]:
        args["company_id"] = require_company_id()
        return self.repository.select_research_document_list(args)

    def select_research_document(self, args: dict) -> dict:
        args["company_id"] = require_company_id()
        document = self.repository.select_research_document(args)
        if not document:
            raise NotFoundError("데이터를 찾을 수 없습니다.")
        return document

    async def create_research_document(self, args: dict) -> dict:
        company_id = require_company_id()

        # 1) 잡행 INSERT (status=uploaded) — 이후 단계의 진행 상태를 이 행에 남긴다.
        insert_args = {
            "company_id": company_id,
            "user_id": get_user_id(),
            "atch_file_id": args["atch_file_id"],
            "file_sn": args["file_sn"],
            "doc_title": args.get("doc_title"),
            "status": "uploaded",
            "reg_id": get_email(),
        }
        keys = self.repository.insert_research_document(insert_args)
        research_doc_id = keys[0]

        # 2) file-service 에서 실물 bytes 조회 (잘못된 참조면 자연 전파 → 404, 잡행은 uploaded 로 남아 정직).
        file_args = {"atch_file_id": args["atch_file_id"], "file_sn": args["file_sn"]}
        file_bytes, orignl_file_nm = await self.file_service_client.read_file_content(file_args)
        doc_title = args.get("doc_title") or orignl_file_nm

        # 3) doc-search 인제스트 (파싱·청킹·임베딩·색인). 업스트림 실패는 잡행을 failed 로 남기고 502.
        try:
            result = await self.doc_search_client.ingest(
                file_bytes=file_bytes,
                filename=orignl_file_nm,
                company_id=company_id,
                user_id=get_user_id(),
                atch_file_id=args["atch_file_id"],
                file_sn=args["file_sn"],
                doc_title=doc_title,
            )
        except Exception as exc:
            # 전체 상세는 내부 로그로만, 잡행 error_msg 는 마스킹(예외 유형만 — 메시지 본문 미저장)
            logger.error("리서치 문서 인제스트 실패 research_doc_id=%s: %r", research_doc_id, exc)
            self._apply_status(
                research_doc_id,
                company_id,
                status="failed",
                chunk_count=None,
                error_msg=f"ingest_failed:{type(exc).__name__}",
            )
            raise BadGatewayError("문서 인덱싱 처리에 실패했습니다.") from exc

        # 4) 결과 status(indexed|empty|failed)·chunk_count 로 잡행 UPDATE
        self._apply_status(
            research_doc_id,
            company_id,
            status=result.get("status", "failed"),
            chunk_count=result.get("chunk_count"),
            error_msg=None,
        )

        args["research_doc_id"] = research_doc_id
        return self.select_research_document(args)

    async def delete_research_document(self, args: dict) -> None:
        company_id = require_company_id()
        args["company_id"] = company_id
        document = self.repository.select_research_document(args)
        if not document:
            raise NotFoundError("데이터를 찾을 수 없습니다.")

        # 외부 리소스를 먼저 회수하고 잡행은 마지막에 삭제한다 — 외부 삭제가 실패하면 예외가 전파돼
        # 잡행이 남으므로 재시도 가능(부분실패 안전). doc-search·file-service 삭제는 멱등에 가깝다.
        await self.doc_search_client.delete_by_file(document["atch_file_id"], company_id)
        await self.file_service_client.delete_file_detail(
            {"atch_file_id": document["atch_file_id"], "file_sn": document["file_sn"]}
        )
        self.repository.delete_research_document(args)

    def _apply_status(
        self, research_doc_id: int, company_id: int, *, status: str, chunk_count: int | None, error_msg: str | None
    ) -> None:
        self.repository.update_research_document_status(
            {
                "research_doc_id": research_doc_id,
                "company_id": company_id,
                "status": status,
                "chunk_count": chunk_count,
                "error_msg": error_msg,
                "mod_id": _SYSTEM_ACTOR,
            }
        )
