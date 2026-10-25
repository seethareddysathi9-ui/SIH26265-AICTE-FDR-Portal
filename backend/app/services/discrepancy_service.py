from datetime import datetime
from typing import List
from ..models import FDR, Discrepancy, DiscrepancyType
from sqlalchemy.orm import Session

def check_duplicate_fdr_number(fdr: FDR, db: Session) -> List[Discrepancy]:
    """Check if FDR number already exists (duplicate detection)."""
    discrepancies = []
    existing = db.query(FDR).filter(
        FDR.fdr_number == fdr.fdr_number,
        FDR.id != fdr.id
    ).first()
    if existing:
        d = Discrepancy(
            fdr_id=fdr.id,
            discrepancy_type=DiscrepancyType.duplicate_fdr,
            field_name="fdr_number",
            submitted_value=fdr.fdr_number,
            expected_value=f"Unique - conflicts with FDR ID {existing.id}",
            description=f"FDR number '{fdr.fdr_number}' already exists in the system (FDR ID: {existing.id}, Institution ID: {existing.institution_id}). This may indicate a duplicate submission or document reuse.",
            severity="high",
            detected_by="system"
        )
        discrepancies.append(d)
    return discrepancies

def check_amount_consistency(fdr: FDR, ocr_amount: float) -> List[Discrepancy]:
    """Compare OCR-extracted amount with institution-submitted amount."""
    discrepancies = []
    if abs(fdr.amount - ocr_amount) > 100:
        pct_diff = abs(fdr.amount - ocr_amount) / fdr.amount * 100
        severity = "high" if pct_diff > 5 else "medium"
        d = Discrepancy(
            fdr_id=fdr.id,
            discrepancy_type=DiscrepancyType.amount_mismatch,
            field_name="amount",
            submitted_value=str(fdr.amount),
            expected_value=str(ocr_amount),
            description=f"Institution submitted amount Rs. {fdr.amount:,.2f} but OCR extracted Rs. {ocr_amount:,.2f} from the FDR document ({pct_diff:.1f}% difference). Manual verification required.",
            severity=severity,
            detected_by="ocr_system"
        )
        discrepancies.append(d)
    return discrepancies

def check_date_validity(fdr: FDR) -> List[Discrepancy]:
    """Check date logic and consistency."""
    discrepancies = []
    if fdr.issue_date and fdr.maturity_date:
        if fdr.maturity_date <= fdr.issue_date:
            d = Discrepancy(
                fdr_id=fdr.id,
                discrepancy_type=DiscrepancyType.date_mismatch,
                field_name="maturity_date",
                submitted_value=str(fdr.maturity_date),
                expected_value=f"Must be after issue date ({fdr.issue_date})",
                description="Maturity date is not after issue date. This is logically invalid for an FDR.",
                severity="high",
                detected_by="system"
            )
            discrepancies.append(d)
        tenure_days = (fdr.maturity_date - fdr.issue_date).days
        if tenure_days < 180:
            d = Discrepancy(
                fdr_id=fdr.id,
                discrepancy_type=DiscrepancyType.date_mismatch,
                field_name="tenure",
                submitted_value=f"{tenure_days} days",
                expected_value="Minimum 180 days for security deposit FDR",
                description=f"FDR tenure of {tenure_days} days is unusually short for a security deposit instrument. Minimum expected is 180 days.",
                severity="medium",
                detected_by="system"
            )
            discrepancies.append(d)
    return discrepancies

def check_missing_documents(fdr: FDR) -> List[Discrepancy]:
    """Check for required document types."""
    discrepancies = []
    doc_types = [d.doc_type for d in fdr.documents]
    required_types = ["fdr_certificate", "lien_letter"]
    for req in required_types:
        if req not in doc_types:
            d = Discrepancy(
                fdr_id=fdr.id,
                discrepancy_type=DiscrepancyType.missing_document,
                field_name="documents",
                submitted_value="Not uploaded",
                expected_value=req,
                description=f"Required document '{req.replace('_', ' ').title()}' has not been uploaded. This is needed for FDR verification.",
                severity="medium",
                detected_by="system"
            )
            discrepancies.append(d)
    return discrepancies

def run_all_checks(fdr: FDR, db: Session) -> List[Discrepancy]:
    """Run all discrepancy checks for an FDR."""
    # Clear previous unresolved system discrepancies
    db.query(Discrepancy).filter(
        Discrepancy.fdr_id == fdr.id,
        Discrepancy.detected_by == "system",
        Discrepancy.is_resolved == False
    ).delete()

    all_discrepancies = []
    all_discrepancies.extend(check_duplicate_fdr_number(fdr, db))
    all_discrepancies.extend(check_date_validity(fdr))
    all_discrepancies.extend(check_missing_documents(fdr))

    for d in all_discrepancies:
        db.add(d)

    if all_discrepancies:
        fdr.status = "discrepancy_found"

    db.commit()
    return all_discrepancies
