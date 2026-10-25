from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from .models import UserRole, FDRStatus, DiscrepancyType

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    full_name: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.institution

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

# Institution schemas
class InstitutionCreate(BaseModel):
    name: str
    aicte_id: str
    state: str
    district: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    institution_type: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None

class InstitutionOut(BaseModel):
    id: int
    name: str
    aicte_id: str
    state: str
    district: Optional[str]
    institution_type: Optional[str]
    contact_person: Optional[str]
    contact_email: Optional[str]
    is_active: bool
    class Config:
        from_attributes = True

# FDR schemas
class FDRCreate(BaseModel):
    fdr_number: str
    bank_name: str
    bank_branch: str
    bank_ifsc: Optional[str] = None
    account_number: Optional[str] = None
    amount: float
    issue_date: datetime
    maturity_date: datetime
    purpose: Optional[str] = None
    notes: Optional[str] = None

class FDRUpdate(BaseModel):
    fdr_number: Optional[str] = None
    bank_name: Optional[str] = None
    bank_branch: Optional[str] = None
    amount: Optional[float] = None
    issue_date: Optional[datetime] = None
    maturity_date: Optional[datetime] = None
    status: Optional[FDRStatus] = None
    notes: Optional[str] = None

class FDROut(BaseModel):
    id: int
    fdr_number: str
    bank_name: str
    bank_branch: str
    bank_ifsc: Optional[str]
    account_number: Optional[str]
    amount: float
    issue_date: datetime
    maturity_date: datetime
    purpose: Optional[str]
    status: FDRStatus
    priority_score: int
    priority_reasons: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    institution_id: int
    parent_fdr_id: Optional[int]
    renewal_type: Optional[str]
    class Config:
        from_attributes = True

class FDRDetailOut(FDROut):
    institution: Optional[InstitutionOut]
    discrepancy_count: int = 0
    document_count: int = 0
    class Config:
        from_attributes = True

# Discrepancy schemas
class DiscrepancyOut(BaseModel):
    id: int
    fdr_id: int
    discrepancy_type: DiscrepancyType
    field_name: str
    submitted_value: Optional[str]
    expected_value: Optional[str]
    description: str
    severity: str
    is_resolved: bool
    resolution_notes: Optional[str]
    detected_by: str
    created_at: datetime
    class Config:
        from_attributes = True

# OCR schemas
class OCRResultOut(BaseModel):
    id: int
    fdr_id: int
    document_id: int
    extracted_fdr_number: Optional[str]
    extracted_bank_name: Optional[str]
    extracted_amount: Optional[float]
    extracted_issue_date: Optional[str]
    extracted_maturity_date: Optional[str]
    confidence_score: Optional[float]
    mismatches: Optional[str]
    processing_status: str
    processed_at: Optional[datetime]
    class Config:
        from_attributes = True

# Scrutiny schemas
class ScrutinyCreate(BaseModel):
    action: str
    observations: str
    new_status: Optional[FDRStatus] = None
    checklist_items: Optional[str] = None

# Notification schemas
class NotificationOut(BaseModel):
    id: int
    fdr_id: Optional[int]
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime
    class Config:
        from_attributes = True

# Audit log schemas
class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    fdr_id: Optional[int]
    action: str
    entity_type: str
    details: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

# Release request schemas
class ReleaseRequestCreate(BaseModel):
    reason: str
    supporting_docs: Optional[str] = None

class ReleaseRequestOut(BaseModel):
    id: int
    fdr_id: int
    status: str
    reason: str
    checklist_status: Optional[str]
    officer_recommendation: Optional[str]
    authority_decision: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

# Dashboard schemas
class DashboardStats(BaseModel):
    total_fdrs: int
    active_fdrs: int
    submitted_fdrs: int
    under_review_fdrs: int
    discrepancy_fdrs: int
    approaching_maturity: int
    matured_fdrs: int
    renewed_fdrs: int
    released_fdrs: int
    pending_release: int
    total_amount: float
    high_priority_count: int
    unresolved_discrepancies: int
