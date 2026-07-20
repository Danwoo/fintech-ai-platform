from typing import Literal

from pydantic import BaseModel, Field

# 재무제표 구분 — 연결(CFS)·별도(OFS)
FinancialStatementType = Literal["CFS", "OFS"]
# 보고서 종류 — 사업보고서·반기·분기
ReportCode = Literal["11011", "11012", "11013", "11014"]
# 공시 유형 대분류 — 정기·주요사항·발행·지분·기타
DisclosureType = Literal["A", "B", "C", "D", "ALL"]


class CompanySearchIn(BaseModel):
    query: str | None = Field(
        default=None, description="회사명 또는 종목코드(6자리)·고유번호(corp_code)로 발행사를 찾는 검색어"
    )


class FinancialsIn(BaseModel):
    corp: str = Field(
        description="회사명 또는 종목코드(6자리). 정확한 발행사 식별이 어려우면 disclosure_company 로 먼저 조회"
    )
    year: int = Field(default=2024, ge=2015, le=2025, description="사업연도 (4자리, 예: 2024)")
    report_code: ReportCode = Field(
        default="11011",
        description="보고서 종류. 11011=사업보고서(연간), 11012=반기, 11013=1분기, 11014=3분기",
    )
    fs_type: FinancialStatementType = Field(
        default="CFS", description="재무제표 구분. CFS=연결, OFS=별도. 모호하면 CFS"
    )


class DisclosureListIn(BaseModel):
    corp: str | None = Field(
        default=None, description="회사명 또는 종목코드(6자리). 비우면 전체 발행사 대상 최신 공시 목록"
    )
    disclosure_type: DisclosureType = Field(
        default="ALL",
        description="공시 유형. A=정기공시, B=주요사항보고, C=발행공시, D=지분공시, ALL=전체. 모호하면 ALL",
    )
    start_date: str | None = Field(default=None, description="검색 시작일 (YYYYMMDD). 비우면 최근 90일")
    end_date: str | None = Field(default=None, description="검색 종료일 (YYYYMMDD). 비우면 오늘")
    page_no: int = Field(default=1, ge=1, description="조회 페이지 (1부터). total_count 가 더 크면 올려 추가 조회")
    page_count: int = Field(default=10, ge=1, le=100, description="페이지당 조회 건수 (최대 100)")


class DisclosureDetailIn(BaseModel):
    rcept_no: str = Field(
        description="공시 접수번호 (14자리). disclosure_list 결과의 rcept_no 로 본문 메타·요약을 조회"
    )


class DividendIn(BaseModel):
    corp: str = Field(description="회사명 또는 종목코드(6자리)")
    year: int = Field(default=2024, ge=2015, le=2025, description="배당 기준 사업연도 (4자리)")


class MajorShareholderIn(BaseModel):
    corp: str = Field(description="회사명 또는 종목코드(6자리)")


class DisclosureSearchOut(BaseModel):
    data: list[dict] = Field(default_factory=list, description="조회 결과 목록")
    total_count: int = Field(default=0, description="전체 결과 수 (data 건수보다 크면 페이지네이션으로 추가 조회 가능)")
    source: Literal["mock", "real"] = Field(
        default="mock", description="데이터 출처. mock=내장 샘플, real=DART OpenAPI"
    )
