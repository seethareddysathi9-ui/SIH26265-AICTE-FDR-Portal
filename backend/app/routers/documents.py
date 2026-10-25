from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Document, FDR, User, UserRole, Institution
from ..auth import get_current_user
from ..config import settings
from ..services.ocr_service import simulate_ocr_extraction
import os, shutil, uuid
from datetime import datetime

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.post("/upload/{fdr_id}")
async def upload_document(
    fdr_id: int,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fdr = db.query(FDR).filter(FDR.id == fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR not found")

    if current_user.role == UserRole.institution:
        institution = db.query(Institution).filter(Institution.user_id == current_user.id).first()
        if not institution or fdr.institution_id != institution.id:
            raise HTTPException(status_code=403, detail="Access denied")

    upload_dir = os.path.join(settings.UPLOAD_DIR, str(fdr_id))
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)

    doc = Document(
        fdr_id=fdr_id,
        doc_type=doc_type,
        filename=unique_filename,
        original_filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type,
        uploaded_by_id=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Trigger OCR simulation for FDR certificates
    if doc_type in ["fdr_certificate", "fdr_document"]:
        try:
            simulate_ocr_extraction(fdr, doc, db)
        except Exception:
            pass  # OCR failure should not block upload

    return {"id": doc.id, "filename": doc.original_filename, "doc_type": doc_type, "message": "Document uploaded successfully"}

@router.get("/{fdr_id}")
def get_fdr_documents(fdr_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.fdr_id == fdr_id).all()
    return [{"id": d.id, "doc_type": d.doc_type, "original_filename": d.original_filename, "file_size": d.file_size, "is_verified": d.is_verified, "created_at": d.created_at} for d in docs]
