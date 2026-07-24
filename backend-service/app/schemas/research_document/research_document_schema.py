"""리서치 문서 잡 스토어 입출력 스키마.

Create 입력은 클라이언트가 넘기는 파일 참조(atch_file_id/file_sn/doc_title)만 받는다 —
company_id/user_id 는 인증 토큰 컨텍스트에서 채우고 클라이언트 입력을 신뢰하지 않는다(테넌트 격리).
status/chunk_count/error_msg 는 인제스트 결과로 서버가 채우는 잡 상태 필드다.
"""

from typing import Literal

from pydantic import BaseModel, Field
from schemas.common_schema import CommonEntity, TrimmedBaseModel

ResearchDocStatus = Literal["uploaded", "parsing", "indexed", "empty", "failed"]


class ResearchDocumentCreateIn(TrimmedBaseModel):
    atch_file_id: str = Field(..., max_length=20, description="file-service 첨부 그룹 ID")
    file_sn: int = Field(..., ge=1, description="첨부 그룹 내 파일 순번")
    doc_title: str | None = Field(None, max_length=500, description="원본 파일명(근거 표시명)")


class ResearchDocumentUpdateIn(TrimmedBaseModel):
    """인제스트 결과 반영용 잡 상태 갱신 페이로드 (서버 내부 전이 — 클라이언트 편집용 아님)."""

    status: ResearchDocStatus = Field(..., description="처리 상태")
    chunk_count: int | None = Field(None, ge=0, description="색인된 청크 수")
    error_msg: str | None = Field(None, max_length=1000, description="실패 사유(민감정보 마스킹)")


class ResearchDocumentOut(CommonEntity):
    research_doc_id: int
    company_id: int
    user_id: str
    atch_file_id: str
    file_sn: int | None = None
    doc_title: str | None = None
    status: ResearchDocStatus
    chunk_count: int | None = None
    error_msg: str | None = None


class ResearchDocumentsOut(BaseModel):
    items: list[ResearchDocumentOut]
    total_count: int
