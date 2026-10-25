from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from ..database import get_db
from ..models import FDR, FDRStatus, Institution, Discrepancy, AuditLog
from ..auth import get_current_officer

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/overview")
def get_overview(current_user=Depends(get_current_officer), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    all_fdrs = db.query(FDR).all()

    by_status = {}
    for s in FDRStatus:
        count = sum(1 for f in all_fdrs if f.status == s)
        if count > 0:
            by_status[s.value] = count

    by_state = {}
    for fdr in all_fdrs:
        if fdr.institution:
            state = fdr.institution.state or "Unknown"
            by_state[state] = by_state.get(state, 0) + 1

    by_bank = {}
    for fdr in all_fdrs:
        bank = fdr.bank_name or "Unknown"
        by_bank[bank] = by_bank.get(bank, 0) + 1

    monthly = []
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=30*i)).replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1)
        count = sum(1 for f in all_fdrs if month_start <= f.created_at < month_end)
        monthly.append({"month": month_start.strftime("%b %Y"), "count": count})

    amounts = [f.amount for f in all_fdrs if f.amount]

    return {
        "total_fdrs": len(all_fdrs),
        "total_amount": sum(amounts),
        "avg_amount": sum(amounts) / len(amounts) if amounts else 0,
        "by_status": by_status,
        "by_state": dict(sorted(by_state.items(), key=lambda x: x[1], reverse=True)[:10]),
        "by_bank": dict(sorted(by_bank.items(), key=lambda x: x[1], reverse=True)[:10]),
        "monthly_submissions": monthly,
        "approaching_maturity_30d": sum(1 for f in all_fdrs if f.maturity_date and 0 <= (f.maturity_date - now).days <= 30),
        "approaching_maturity_60d": sum(1 for f in all_fdrs if f.maturity_date and 0 <= (f.maturity_date - now).days <= 60),
        "overdue_count": sum(1 for f in all_fdrs if f.maturity_date and (f.maturity_date - now).days < 0 and f.status not in [FDRStatus.renewed, FDRStatus.released]),
        "high_priority_count": sum(1 for f in all_fdrs if f.priority_score >= 50),
        "unresolved_discrepancies": db.query(Discrepancy).filter(Discrepancy.is_resolved == False).count(),
        "disclaimer": "[DEMO DATA] Statistics shown are based on synthetic test data generated for prototype demonstration purposes."
    }

@router.get("/maturity-timeline")
def get_maturity_timeline(current_user=Depends(get_current_officer), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    upcoming = []
    fdrs = db.query(FDR).filter(FDR.maturity_date != None).all()
    for fdr in fdrs:
        days = (fdr.maturity_date - now).days
        if -30 <= days <= 180:
            upcoming.append({
                "fdr_id": fdr.id,
                "fdr_number": fdr.fdr_number,
                "institution": fdr.institution.name if fdr.institution else "Unknown",
                "amount": fdr.amount,
                "maturity_date": fdr.maturity_date,
                "days_to_maturity": days,
                "status": fdr.status.value,
                "is_overdue": days < 0
            })
    return sorted(upcoming, key=lambda x: x["days_to_maturity"])
