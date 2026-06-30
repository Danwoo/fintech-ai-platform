import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


# --------------------------------------------------------------------------
# TN_File
# --------------------------------------------------------------------------
class File(Base):
    __tablename__ = "TN_File"
    __table_args__ = {"comment": "첨부파일"}

    # Primary Key
    atch_file_id: Mapped[str] = mapped_column(String(20), primary_key=True, comment="첨부파일 ID")

    # Audit
    reg_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, default=func.now(), comment="생성일시")
    reg_id: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="생성자 ID")
    mod_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, onupdate=func.now(), comment="수정일시")
    mod_id: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="수정자 ID")

    # Relationships
    details: Mapped[list["FileDetail"]] = relationship(back_populates="file", cascade="all, delete-orphan")


# --------------------------------------------------------------------------
# TN_FileDetail
# --------------------------------------------------------------------------
class FileDetail(Base):
    __tablename__ = "TN_FileDetail"
    __table_args__ = {"comment": "첨부파일 상세"}

    # Composite Primary Key
    atch_file_id: Mapped[str] = mapped_column(
        String(20), ForeignKey("TN_File.atch_file_id", ondelete="CASCADE"), primary_key=True, comment="첨부파일 ID"
    )
    file_sn: Mapped[int] = mapped_column(Integer, primary_key=True, comment="파일 순번")

    # File Info
    file_stre_cours: Mapped[str | None] = mapped_column(String(1300), nullable=True, comment="파일 저장 경로")
    stre_file_nm: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="저장 파일명")
    orignl_file_nm: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="원본 파일명")
    file_extsn: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="파일 확장자")
    file_mg: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="파일 크기")
    file_ty: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="파일 타입")

    # Audit
    reg_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, default=func.now(), comment="생성일시")
    reg_id: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="생성자 ID")
    mod_dt: Mapped[datetime.datetime | None] = mapped_column(DateTime, onupdate=func.now(), comment="수정일시")
    mod_id: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="수정자 ID")

    # Relationships
    file: Mapped["File"] = relationship(back_populates="details")
