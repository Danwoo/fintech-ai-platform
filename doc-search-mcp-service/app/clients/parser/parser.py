"""문서 텍스트 추출 파서 추상화 — 오픈소스(pypdf) 구현 + config 토글 팩토리.

인제스트 파이프라인의 첫 단계. 파일 bytes → `ParsedDoc`(전체 텍스트 + 페이지별 텍스트)로 정규화해
청킹 단계가 파일 포맷을 몰라도 되게 한다. Upstage Document Parse 등 상용 파서는 후속 슬라이스에서
같은 인터페이스로 붙인다(`get_parser` 의 "upstage" 분기).

pypdf 추출은 CPU 블로킹이므로 호출 측(Service)이 `run_in_threadpool` 로 오프로드한다(anti-pattern 13).
"""

from __future__ import annotations

import io
from dataclasses import dataclass, field

from core.exceptions import UnsupportedMediaTypeError
from pypdf import PdfReader

_TEXT_EXTENSIONS = {".txt", ".md"}


@dataclass
class ParsedPage:
    page_no: int  # 1-based 페이지 번호 (txt/md 는 1)
    text: str


@dataclass
class ParsedDoc:
    text: str  # 전체 텍스트 (페이지 연결)
    pages: list[ParsedPage] = field(default_factory=list)


def _extension(filename: str) -> str:
    dot = filename.rfind(".")
    return filename[dot:].lower() if dot != -1 else ""


class OpenSourceParser:
    """오픈소스 파서 — .pdf 는 pypdf 로 페이지별, .txt/.md 는 utf-8 단일 페이지. 이미지는 다루지 않는다(텍스트 전용)."""

    def parse(self, file_bytes: bytes, filename: str) -> ParsedDoc:
        ext = _extension(filename)
        if ext == ".pdf":
            return self._parse_pdf(file_bytes)
        if ext in _TEXT_EXTENSIONS:
            return self._parse_text(file_bytes)
        raise UnsupportedMediaTypeError(f"지원하지 않는 파일 형식입니다: {ext or '(확장자 없음)'}")

    def _parse_pdf(self, file_bytes: bytes) -> ParsedDoc:
        reader = PdfReader(io.BytesIO(file_bytes))
        pages: list[ParsedPage] = []
        for idx, page in enumerate(reader.pages, start=1):
            page_text = (page.extract_text() or "").strip()
            if page_text:
                pages.append(ParsedPage(page_no=idx, text=page_text))
        full_text = "\n\n".join(p.text for p in pages)
        return ParsedDoc(text=full_text, pages=pages)

    def _parse_text(self, file_bytes: bytes) -> ParsedDoc:
        text = file_bytes.decode("utf-8", errors="replace").strip()
        pages = [ParsedPage(page_no=1, text=text)] if text else []
        return ParsedDoc(text=text, pages=pages)


def get_parser(config):
    """config.DOC_PARSER 로 파서 구현을 고른다 (외부타입 get_* 팩토리 규약).

    - "opensource"(기본): pypdf 기반 OpenSourceParser
    - "upstage": 후속 슬라이스 — 아직 미구현이라 선택 시 기동/사용 지점에서 명확히 실패시킨다.
    """
    parser_kind = config.DOC_PARSER
    if parser_kind == "opensource":
        return OpenSourceParser()
    if parser_kind == "upstage":
        raise NotImplementedError("Upstage 파서는 후속 슬라이스에서 구현됩니다 (DOC_PARSER=opensource 사용).")
    raise ValueError(f"알 수 없는 DOC_PARSER 값입니다: {parser_kind}")
