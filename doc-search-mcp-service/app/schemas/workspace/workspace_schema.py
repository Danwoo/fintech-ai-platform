"""워크스페이스 인제스트 입출력 스키마. (검색 tool 은 vector_search_schema 의 TopicSearchIn/Out 을 재사용한다.)"""

from typing import Literal

from pydantic import BaseModel, Field


class IngestOut(BaseModel):
    job_ref: str = Field(description="인제스트 참조 키 (원본 첨부 그룹 atch_file_id)")
    chunk_count: int = Field(description="색인된 청크 수")
    status: Literal["indexed", "failed"] = Field(description="처리 상태")
