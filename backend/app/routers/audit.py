from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AuditLog, User
from ..auth import get_current_officer

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("/")
def get_audit_logs(fdr_id: int = None, skip: int = 0, limit: int = 50, current_user=Depends(get_current_officer), db: Session = Depends(get_db)):
    q = db.query(AuditLog)
    if fdr_id:
        q = q.filter(AuditLog.fdr_id == fdr_id)
    logs = q.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return [{"id": l.id, "action": l.action, "entity_type": l.entity_type, "details": l.details, "user_id": l.user_id, "fdr_id": l.fdr_id, "created_at": l.created_at} for l in logs]
