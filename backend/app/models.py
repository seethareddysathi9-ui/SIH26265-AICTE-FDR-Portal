from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum
from datetime import datetime

class UserRole(str, enum.Enum):
    institution = "institution"
    officer = "officer"
    authority = "authority"
    admin = "admin"

class FDRStatus(str, enum.Enum):
    submitted = "submitted"
    under_review = "under_review"
    verified = "verified"
    discrepancy_found = "discrepancy_found"
    correction_pending = "correction_pending"
    active = "active"
    approaching_maturity = "approaching_maturity"
    matured = "matured"
    renewal_pending = "renewal_pending"
    renewed = "renewed"
    release_requested = "release_requested"
    release_approved = "release_approved"
    released = "released"
    rejected = "rejected"

class DiscrepancyType(str, enum.Enum):
    amount_mismatch = "amount_mismatch"
    date_mismatch = "date_mismatch"
    bank_details_mismatch = "bank_details_mismatch"
    duplicate_fdr = "duplicate_fdr"
    missing_document = "missing_document"
    institution_mismatch = "institution_mismatch"
    ocr_low_confidence = "ocr_low_confidence"
    missing_lien_mark = "missing_lien_mark"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.institution)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    institution = relationship("Institution", back_populates="user", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="user")

class Institution(Base):
    __tablename__ = "institutions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    name = Column(String(500), nullable=False)
    aicte_id = Column(String(100), unique=True, index=True)
    state = Column(String(100))
    district = Column(String(100))
    address = Column(Text)
    phone = Column(String(20))
    institution_type = Column(String(100))
    contact_person = Column(String(255))
    contact_email = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="institution")
    fdrs = relationship("FDR", back_populates="institution")

class FDR(Base):
    __tablename__ = "fdrs"
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"))
    fdr_number = Column(String(100), index=True)
    bank_name = Column(String(255))
    bank_branch = Column(String(255))
    bank_ifsc = Column(String(20))
    account_number = Column(String(50))
    amount = Column(Float)
    issue_date = Column(DateTime)
    maturity_date = Column(DateTime)
    purpose = Column(String(500))
    status = Column(SAEnum(FDRStatus), default=FDRStatus.submitted)
    priority_score = Column(Integer, default=0)
    priority_reasons = Column(Text)
    submitted_by_id = Column(Integer, ForeignKey("users.id"))
    assigned_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    parent_fdr_id = Column(Integer, ForeignKey("fdrs.id"), nullable=True)
    renewal_type = Column(String(50), nullable=True)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    institution = relationship("Institution", back_populates="fdrs")
    submitted_by = relationship("User", foreign_keys=[submitted_by_id])
    assigned_officer = relationship("User", foreign_keys=[assigned_officer_id])
    parent_fdr = relationship("FDR", remote_side=[id], foreign_keys=[parent_fdr_id])
    child_fdrs = relationship("FDR", foreign_keys=[parent_fdr_id], overlaps="parent_fdr")
    documents = relationship("Document", back_populates="fdr")
    discrepancies = relationship("Discrepancy", back_populates="fdr")
    audit_logs = relationship("AuditLog", back_populates="fdr")
    ocr_results = relationship("OCRResult", back_populates="fdr")
    scrutiny_records = relationship("ScrutinyRecord", back_populates="fdr")

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    fdr_id = Column(Integer, ForeignKey("fdrs.id"))
    doc_type = Column(String(100))
    filename = Column(String(500))
    original_filename = Column(String(500))
    file_path = Column(String(1000))
    file_size = Column(Integer)
    mime_type = Column(String(100))
    uploaded_by_id = Column(Integer, ForeignKey("users.id"))
    is_verified = Column(Boolean, default=False)
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verification_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    fdr = relationship("FDR", back_populates="documents")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])
    ocr_results = relationship("OCRResult", back_populates="document")

class OCRResult(Base):
    __tablename__ = "ocr_results"
    id = Column(Integer, primary_key=True, index=True)
    fdr_id = Column(Integer, ForeignKey("fdrs.id"))
    document_id = Column(Integer, ForeignKey("documents.id"))
    extracted_fdr_number = Column(String(100))
    extracted_bank_name = Column(String(255))
    extracted_amount = Column(Float)
    extracted_issue_date = Column(String(50))
    extracted_maturity_date = Column(String(50))
    extracted_account_number = Column(String(50))
    raw_text = Column(Text)
    confidence_score = Column(Float)
    fdr_number_confidence = Column(Float)
    amount_confidence = Column(Float)
    date_confidence = Column(Float)
    bank_confidence = Column(Float)
    mismatches = Column(Text)
    processing_status = Column(String(50), default="pending")
    processed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    fdr = relationship("FDR", back_populates="ocr_results")
    document = relationship("Document", back_populates="ocr_results")

class Discrepancy(Base):
    __tablename__ = "discrepancies"
    id = Column(Integer, primary_key=True, index=True)
    fdr_id = Column(Integer, ForeignKey("fdrs.id"))
    discrepancy_type = Column(SAEnum(DiscrepancyType))
    field_name = Column(String(100))
    submitted_value = Column(Text)
    expected_value = Column(Text)
    description = Column(Text)
    severity = Column(String(20), default="medium")
    is_resolved = Column(Boolean, default=False)
    resolution_notes = Column(Text)
    detected_by = Column(String(50), default="system")
    resolved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    fdr = relationship("FDR", back_populates="discrepancies")
    resolved_by = relationship("User", foreign_keys=[resolved_by_id])

class ScrutinyRecord(Base):
    __tablename__ = "scrutiny_records"
    id = Column(Integer, primary_key=True, index=True)
    fdr_id = Column(Integer, ForeignKey("fdrs.id"))
    officer_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(100))
    old_status = Column(String(100))
    new_status = Column(String(100))
    observations = Column(Text)
    checklist_items = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    fdr = relationship("FDR", back_populates="scrutiny_records")
    officer = relationship("User", foreign_keys=[officer_id])

class ReleaseRequest(Base):
    __tablename__ = "release_requests"
    id = Column(Integer, primary_key=True, index=True)
    fdr_id = Column(Integer, ForeignKey("fdrs.id"), unique=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"))
    reason = Column(Text)
    supporting_docs = Column(Text)
    status = Column(String(50), default="pending")
    checklist_status = Column(Text)
    officer_recommendation = Column(Text)
    authority_decision = Column(Text)
    authority_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    decided_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    fdr = relationship("FDR")
    institution = relationship("Institution")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    fdr_id = Column(Integer, ForeignKey("fdrs.id"), nullable=True)
    title = Column(String(500))
    message = Column(Text)
    notification_type = Column(String(50))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    fdr_id = Column(Integer, ForeignKey("fdrs.id"), nullable=True)
    action = Column(String(200))
    entity_type = Column(String(100))
    entity_id = Column(Integer)
    details = Column(Text)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="audit_logs")
    fdr = relationship("FDR", back_populates="audit_logs")
