from datetime import datetime, timedelta
from typing import List
from ..models import FDR, FDRStatus, Discrepancy
from sqlalchemy.orm import Session
import json

def calculate_priority_score(fdr: FDR, db: Session) -> tuple:
    """
    Calculates a priority score for an FDR case based on transparent, explainable rules.
    Returns (score, reasons_list)
    """
    score = 0
    reasons = []
    now = datetime.utcnow()

    # Rule 1: Maturity deadline proximity
    if fdr.maturity_date:
        days_to_maturity = (fdr.maturity_date - now).days
        if days_to_maturity < 0:
            score += 40
            reasons.append(f"OVERDUE: FDR matured {abs(days_to_maturity)} days ago with no renewal/release action")
        elif days_to_maturity <= 30:
            score += 35
            reasons.append(f"URGENT: FDR matures in {days_to_maturity} days (within 30 days)")
        elif days_to_maturity <= 60:
            score += 20
            reasons.append(f"WARNING: FDR matures in {days_to_maturity} days (within 60 days)")
        elif days_to_maturity <= 90:
            score += 10
            reasons.append(f"NOTICE: FDR matures in {days_to_maturity} days (within 90 days)")

    # Rule 2: Status-based priority
    high_priority_statuses = {
        FDRStatus.discrepancy_found: (30, "Discrepancy detected and unresolved"),
        FDRStatus.correction_pending: (25, "Awaiting institution correction submission"),
        FDRStatus.matured: (35, "FDR has matured and needs immediate action"),
        FDRStatus.renewal_pending: (28, "Renewal is pending processing"),
    }
    if fdr.status in high_priority_statuses:
        pts, reason = high_priority_statuses[fdr.status]
        score += pts
        reasons.append(reason)

    # Rule 3: Unresolved discrepancies
    unresolved = [d for d in fdr.discrepancies if not d.is_resolved]
    if unresolved:
        high_sev = sum(1 for d in unresolved if d.severity == "high")
        if high_sev > 0:
            score += 20 + (high_sev * 5)
            reasons.append(f"{high_sev} high-severity unresolved discrepancy(ies)")
        elif len(unresolved) > 0:
            score += 10
            reasons.append(f"{len(unresolved)} unresolved discrepancy(ies)")

    # Rule 4: Missing documents
    if len(fdr.documents) == 0:
        score += 15
        reasons.append("No supporting documents uploaded")
    elif len(fdr.documents) < 2:
        score += 8
        reasons.append("Fewer than expected documents uploaded")

    # Rule 5: Long waiting time
    days_waiting = (now - fdr.created_at).days
    if days_waiting > 90:
        score += 15
        reasons.append(f"Case pending for {days_waiting} days without resolution")
    elif days_waiting > 60:
        score += 8
        reasons.append(f"Case pending for {days_waiting} days")
    elif days_waiting > 30:
        score += 4
        reasons.append(f"Case pending for {days_waiting} days")

    # Rule 6: Release request pending
    if fdr.status == FDRStatus.release_requested:
        score += 20
        reasons.append("Institution has submitted a release request awaiting review")

    # Cap at 100
    score = min(score, 100)

    return score, reasons

def update_all_priorities(db: Session):
    """Recalculate priority scores for all active FDRs."""
    active_statuses = [
        FDRStatus.submitted, FDRStatus.under_review, FDRStatus.verified,
        FDRStatus.discrepancy_found, FDRStatus.correction_pending,
        FDRStatus.active, FDRStatus.approaching_maturity, FDRStatus.matured,
        FDRStatus.renewal_pending, FDRStatus.release_requested
    ]
    fdrs = db.query(FDR).filter(FDR.status.in_(active_statuses)).all()
    for fdr in fdrs:
        score, reasons = calculate_priority_score(fdr, db)
        fdr.priority_score = score
        fdr.priority_reasons = json.dumps(reasons)
    db.commit()
