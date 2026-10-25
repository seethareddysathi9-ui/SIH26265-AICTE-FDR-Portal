import random
import re
from datetime import datetime, timedelta
from typing import Optional
from ..models import FDR, OCRResult, Document
from sqlalchemy.orm import Session

def simulate_ocr_extraction(fdr: FDR, document: Document, db: Session) -> OCRResult:
    """
    Simulated OCR extraction. In production, replace with Tesseract or cloud OCR.
    This simulation intentionally introduces minor variations to demonstrate discrepancy detection.
    """
    # Base confidence (simulated)
    base_confidence = random.uniform(0.72, 0.97)

    fdr_num_conf = random.uniform(0.75, 0.98)
    amount_conf = random.uniform(0.80, 0.99)
    date_conf = random.uniform(0.78, 0.97)
    bank_conf = random.uniform(0.82, 0.99)

    # Extract with possible errors
    extracted_fdr_number = fdr.fdr_number
    extracted_amount = fdr.amount
    extracted_bank = fdr.bank_name

    # Introduce occasional mismatches for demo
    if fdr.fdr_number and "DISC" in fdr.fdr_number:
        extracted_amount = fdr.amount * 0.9  # 10% amount mismatch
        amount_conf = 0.65

    issue_date_str = fdr.issue_date.strftime("%d/%m/%Y") if fdr.issue_date else None
    maturity_date_str = fdr.maturity_date.strftime("%d/%m/%Y") if fdr.maturity_date else None

    raw_text = f"""
[SIMULATED OCR OUTPUT - FOR DEMONSTRATION PURPOSES]

FIXED DEPOSIT RECEIPT

FDR No: {extracted_fdr_number}
Bank: {extracted_bank}
Branch: {fdr.bank_branch}
Account: {fdr.account_number or 'N/A'}

Amount: INR {extracted_amount:,.2f}
In Words: [Amount in words]

Date of Issue: {issue_date_str}
Date of Maturity: {maturity_date_str}

In favor of: AICTE (All India Council for Technical Education)
Purpose: Security Deposit

Confidence Scores:
- FDR Number: {fdr_num_conf:.0%}
- Amount: {amount_conf:.0%}
- Dates: {date_conf:.0%}
- Bank Name: {bank_conf:.0%}

[Note: This is a simulated OCR extraction for prototype demonstration.]
[Real deployment would use Tesseract OCR or a cloud OCR API.]
    """

    # Detect mismatches
    mismatches = []
    if abs(extracted_amount - fdr.amount) > 1:
        mismatches.append(f"Amount: submitted={fdr.amount}, extracted={extracted_amount}")
    if extracted_fdr_number and extracted_fdr_number != fdr.fdr_number:
        mismatches.append(f"FDR Number: submitted={fdr.fdr_number}, extracted={extracted_fdr_number}")

    ocr_result = OCRResult(
        fdr_id=fdr.id,
        document_id=document.id,
        extracted_fdr_number=extracted_fdr_number,
        extracted_bank_name=extracted_bank,
        extracted_amount=extracted_amount,
        extracted_issue_date=issue_date_str,
        extracted_maturity_date=maturity_date_str,
        extracted_account_number=fdr.account_number,
        raw_text=raw_text,
        confidence_score=base_confidence,
        fdr_number_confidence=fdr_num_conf,
        amount_confidence=amount_conf,
        date_confidence=date_conf,
        bank_confidence=bank_conf,
        mismatches="|".join(mismatches) if mismatches else None,
        processing_status="completed",
        processed_at=datetime.utcnow()
    )
    db.add(ocr_result)
    db.commit()
    db.refresh(ocr_result)
    return ocr_result
