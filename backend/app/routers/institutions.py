from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, Institution, UserRole
from ..auth import get_current_user
from ..schemas import InstitutionCreate, InstitutionOut

router = APIRouter(prefix="/api/institutions", tags=["institutions"])

@router.post("/profile", response_model=InstitutionOut)
def create_or_update_profile(
    data: InstitutionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.institution:
        raise HTTPException(status_code=403, detail="Only institution accounts can create institution profiles")
    existing = db.query(Institution).filter(Institution.user_id == current_user.id).first()
    if existing:
        for k, v in data.dict().items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    aicte_check = db.query(Institution).filter(Institution.aicte_id == data.aicte_id).first()
    if aicte_check:
        raise HTTPException(status_code=400, detail="AICTE ID already registered")
    institution = Institution(user_id=current_user.id, **data.dict())
    db.add(institution)
    db.commit()
    db.refresh(institution)
    return institution

@router.get("/profile", response_model=InstitutionOut)
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    institution = db.query(Institution).filter(Institution.user_id == current_user.id).first()
    if not institution:
        raise HTTPException(status_code=404, detail="Institution profile not found")
    return institution

@router.get("/", response_model=List[InstitutionOut])
def list_institutions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in [UserRole.officer, UserRole.authority, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(Institution).all()
