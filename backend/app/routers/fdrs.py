from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..models import FDR, FDRStatus, Institution, User, UserRole, Discrepancy, AuditLog
from ..auth import get_current_user, get_current_officer
from ..schemas import FDRCreate, FDRUpdate, FDROut, FDRDetailOut
from ..services.discrepancy_service import run_all_checks
from ..services.priority_service import calculate_priority_score
import json

router = APIRouter(prefix="/api/fdrs", tags=["fdrs"])

def log_action(db, user_id, fdr_id, action, details=""):
    log = AuditLog(user_id=user_id, fdr_id=fdr_id, action=action,
                   entity_type="fdr", entity_id=fdr_id, details=details)
    db.add(log)

@router.post("/", response_model=FDROut)
def create_fdr(fdr_data: FDRCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.institution:
        institution = db.query(Institution).filter(Institution.user_id == current_user.id).first()
        if not institution:
            raise HTTPException(status_code=400, detail="Institution profile not found. Please complete your profile first.")
        institution_id = institution.id
    else:
        raise HTTPException(status_code=403, detail="Only institutions can submit FDRs")

    fdr = FDR(
        institution_id=institution_id,
        submitted_by_id=current_user.id,
        fdr_number=fdr_data.fdr_number,
        bank_name=fdr_data.bank_name,
        bank_branch=fdr_data.bank_branch,
        bank_ifsc=fdr_data.bank_ifsc,
        account_number=fdr_data.account_number,
        amount=fdr_data.amount,
        issue_date=fdr_data.issue_date,
        maturity_date=fdr_data.maturity_date,
        purpose=fdr_data.purpose,
        notes=fdr_data.notes,
        status=FDRStatus.submitted
    )
    db.add(fdr)
    db.commit()
    db.refresh(fdr)

    run_all_checks(fdr, db)
    db.refresh(fdr)

    score, reasons = calculate_priority_score(fdr, db)
    fdr.priority_score = score
    fdr.priority_reasons = json.dumps(reasons)
    db.commit()

    log_action(db, current_user.id, fdr.id, "FDR_SUBMITTED", f"New FDR {fdr.fdr_number} submitted")
    db.commit()

    return fdr

@router.get("/dashboard-stats")
def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(FDR)
    if current_user.role == UserRole.institution:
        institution = db.query(Institution).filter(Institution.user_id == current_user.id).first()
        if institution:
            query = query.filter(FDR.institution_id == institution.id)
        else:
            return {"total_fdrs": 0}

    all_fdrs = query.all()
    now = datetime.utcnow()

    return {
        "total_fdrs": len(all_fdrs),
        "active_fdrs": sum(1 for f in all_fdrs if f.status in [FDRStatus.active, FDRStatus.verified]),
        "submitted_fdrs": sum(1 for f in all_fdrs if f.status == FDRStatus.submitted),
        "under_review_fdrs": sum(1 for f in all_fdrs if f.status == FDRStatus.under_review),
        "discrepancy_fdrs": sum(1 for f in all_fdrs if f.status == FDRStatus.discrepancy_found),
        "approaching_maturity": sum(1 for f in all_fdrs if f.maturity_date and 0 <= (f.maturity_date - now).days <= 90),
        "matured_fdrs": sum(1 for f in all_fdrs if f.status == FDRStatus.matured),
        "renewed_fdrs": sum(1 for f in all_fdrs if f.status == FDRStatus.renewed),
        "released_fdrs": sum(1 for f in all_fdrs if f.status == FDRStatus.released),
        "pending_release": sum(1 for f in all_fdrs if f.status == FDRStatus.release_requested),
        "total_amount": sum(f.amount for f in all_fdrs if f.amount),
        "high_priority_count": sum(1 for f in all_fdrs if f.priority_score >= 50),
        "unresolved_discrepancies": db.query(Discrepancy).filter(Discrepancy.is_resolved == False).count(),
        "by_status": {s.value: sum(1 for f in all_fdrs if f.status == s) for s in FDRStatus}
    }

@router.get("/", response_model=List[FDROut])
def list_fdrs(
    status: Optional[str] = None,
    state: Optional[str] = None,
    bank: Optional[str] = None,
    search: Optional[str] = None,
    priority_min: Optional[int] = None,
    expiring_days: Optional[int] = None,
    skip: int = 0, limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(FDR).options(joinedload(FDR.institution))

    if current_user.role == UserRole.institution:
        institution = db.query(Institution).filter(Institution.user_id == current_user.id).first()
        if institution:
            query = query.filter(FDR.institution_id == institution.id)
        else:
            return []

    if status:
        query = query.filter(FDR.status == status)
    if state:
        query = query.join(Institution).filter(Institution.state == state)
    if bank:
        query = query.filter(FDR.bank_name.ilike(f"%{bank}%"))
    if search:
        query = query.filter(or_(
            FDR.fdr_number.ilike(f"%{search}%"),
            FDR.bank_name.ilike(f"%{search}%")
        ))
    if priority_min is not None:
        query = query.filter(FDR.priority_score >= priority_min)
    if expiring_days is not None:
        cutoff = datetime.utcnow() + timedelta(days=expiring_days)
        query = query.filter(FDR.maturity_date <= cutoff, FDR.maturity_date >= datetime.utcnow())

    return query.order_by(FDR.priority_score.desc()).offset(skip).limit(limit).all()

@router.get("/{fdr_id}")
def get_fdr(fdr_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fdr = db.query(FDR).options(
        joinedload(FDR.institution),
        joinedload(FDR.documents),
        joinedload(FDR.discrepancies),
        joinedload(FDR.scrutiny_records),
        joinedload(FDR.ocr_results)
    ).filter(FDR.id == fdr_id).first()

    if not fdr:
        raise HTTPException(status_code=404, detail="FDR not found")

    if current_user.role == UserRole.institution:
        institution = db.query(Institution).filter(Institution.user_id == current_user.id).first()
        if not institution or fdr.institution_id != institution.id:
            raise HTTPException(status_code=403, detail="Access denied")

    return {
        "id": fdr.id,
        "fdr_number": fdr.fdr_number,
        "bank_name": fdr.bank_name,
        "bank_branch": fdr.bank_branch,
        "bank_ifsc": fdr.bank_ifsc,
        "account_number": fdr.account_number,
        "amount": fdr.amount,
        "issue_date": fdr.issue_date,
        "maturity_date": fdr.maturity_date,
        "purpose": fdr.purpose,
        "status": fdr.status,
        "priority_score": fdr.priority_score,
        "priority_reasons": json.loads(fdr.priority_reasons) if fdr.priority_reasons else [],
        "notes": fdr.notes,
        "created_at": fdr.created_at,
        "updated_at": fdr.updated_at,
        "institution_id": fdr.institution_id,
        "parent_fdr_id": fdr.parent_fdr_id,
        "renewal_type": fdr.renewal_type,
        "institution": {
            "id": fdr.institution.id,
            "name": fdr.institution.name,
            "aicte_id": fdr.institution.aicte_id,
            "state": fdr.institution.state
        } if fdr.institution else None,
        "documents": [{"id": d.id, "doc_type": d.doc_type, "original_filename": d.original_filename, "is_verified": d.is_verified} for d in fdr.documents],
        "discrepancies": [{"id": d.id, "type": d.discrepancy_type, "field": d.field_name, "description": d.description, "severity": d.severity, "is_resolved": d.is_resolved} for d in fdr.discrepancies],
        "scrutiny_records": [{"id": s.id, "action": s.action, "observations": s.observations, "created_at": s.created_at} for s in fdr.scrutiny_records],
        "discrepancy_count": len([d for d in fdr.discrepancies if not d.is_resolved]),
        "document_count": len(fdr.documents)
    }

@router.patch("/{fdr_id}/status")
def update_fdr_status(
    fdr_id: int,
    status_data: dict,
    current_user: User = Depends(get_current_officer),
    db: Session = Depends(get_db)
):
    fdr = db.query(FDR).filter(FDR.id == fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR not found")
    old_status = fdr.status
    fdr.status = status_data.get("status", fdr.status)
    if "assigned_officer_id" in status_data:
        fdr.assigned_officer_id = status_data["assigned_officer_id"]
    db.commit()
    log_action(db, current_user.id, fdr.id, "STATUS_UPDATED", f"Status changed from {old_status} to {fdr.status}")
    db.commit()
    return {"message": "Status updated", "new_status": fdr.status}

@router.post("/{fdr_id}/scrutiny")
def add_scrutiny(fdr_id: int, scrutiny_data: dict, current_user: User = Depends(get_current_officer), db: Session = Depends(get_db)):
    from ..models import ScrutinyRecord
    fdr = db.query(FDR).filter(FDR.id == fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR not found")
    old_status = fdr.status
    record = ScrutinyRecord(
        fdr_id=fdr_id,
        officer_id=current_user.id,
        action=scrutiny_data.get("action", ""),
        old_status=old_status.value if old_status else "",
        new_status=scrutiny_data.get("new_status", old_status.value if old_status else ""),
        observations=scrutiny_data.get("observations", ""),
        checklist_items=scrutiny_data.get("checklist_items", "")
    )
    db.add(record)
    if scrutiny_data.get("new_status"):
        fdr.status = scrutiny_data["new_status"]
    db.commit()
    log_action(db, current_user.id, fdr.id, "SCRUTINY_ADDED", scrutiny_data.get("action", ""))
    db.commit()
    return {"message": "Scrutiny record added"}

@router.get("/{fdr_id}/release-readiness")
def check_release_readiness(fdr_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fdr = db.query(FDR).options(joinedload(FDR.documents), joinedload(FDR.discrepancies)).filter(FDR.id == fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR not found")

    doc_types = [d.doc_type for d in fdr.documents]
    checklist = [
        {"item": "FDR Certificate uploaded", "status": "fdr_certificate" in doc_types, "required": True},
        {"item": "Lien letter uploaded", "status": "lien_letter" in doc_types, "required": True},
        {"item": "Release request form uploaded", "status": "release_form" in doc_types, "required": True},
        {"item": "No unresolved discrepancies", "status": not any(d for d in fdr.discrepancies if not d.is_resolved), "required": True},
        {"item": "FDR verified by officer", "status": fdr.status in [FDRStatus.verified, FDRStatus.active, FDRStatus.matured, FDRStatus.release_requested], "required": True},
        {"item": "Institution compliance clearance", "status": False, "required": False, "note": "To be confirmed by competent authority (simulated)"},
        {"item": "Bank confirmation received", "status": False, "required": False, "note": "Mock bank verification - labelled as simulated"},
    ]

    required_completed = sum(1 for c in checklist if c["required"] and c["status"])
    required_total = sum(1 for c in checklist if c["required"])

    return {
        "fdr_id": fdr_id,
        "is_ready_for_review": required_completed == required_total,
        "completed_items": sum(1 for c in checklist if c["status"]),
        "total_items": len(checklist),
        "required_completed": required_completed,
        "required_total": required_total,
        "checklist": checklist,
        "disclaimer": "This checklist indicates document completeness only. Final release authorization requires competent authority approval as per AICTE regulations. This system does not automatically authorize financial releases."
    }
