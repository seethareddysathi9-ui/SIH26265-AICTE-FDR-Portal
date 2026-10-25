"""
Seed script for AICTE FDR Management Portal.
Creates demo users, institutions, and FDR records with realistic test cases.
All data is synthetic and for demonstration purposes only.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, create_tables, engine
from app.models import (
    User, Institution, FDR, Document, Discrepancy, AuditLog,
    Notification, UserRole, FDRStatus, DiscrepancyType
)
from app.auth import get_password_hash
from datetime import datetime, timedelta
import json

def seed():
    create_tables()
    db = SessionLocal()

    if db.query(User).count() > 0:
        print("Database already seeded. Skipping.")
        db.close()
        return

    print("Seeding database with demo data...")

    # === CREATE USERS ===
    users_data = [
        {"email": "admin@aicte.gov.in", "password": "Admin@123", "full_name": "System Administrator", "role": UserRole.admin},
        {"email": "officer1@aicte.gov.in", "password": "Officer@123", "full_name": "Rajesh Kumar (Senior Officer)", "role": UserRole.officer},
        {"email": "officer2@aicte.gov.in", "password": "Officer@123", "full_name": "Priya Sharma (FDR Scrutiny Officer)", "role": UserRole.officer},
        {"email": "authority@aicte.gov.in", "password": "Auth@123", "full_name": "Director (Regulation Bureau)", "role": UserRole.authority},
        {"email": "cvr@college.edu", "password": "College@123", "full_name": "CVR College Admin", "role": UserRole.institution},
        {"email": "vnr@college.edu", "password": "College@123", "full_name": "VNR VJIET Admin", "role": UserRole.institution},
        {"email": "mgit@college.edu", "password": "College@123", "full_name": "MGIT Admin", "role": UserRole.institution},
        {"email": "cbit@college.edu", "password": "College@123", "full_name": "CBIT Admin", "role": UserRole.institution},
        {"email": "rgukt@college.edu", "password": "College@123", "full_name": "RGUKT Admin", "role": UserRole.institution},
    ]

    created_users = {}
    for ud in users_data:
        user = User(
            email=ud["email"],
            hashed_password=get_password_hash(ud["password"]),
            full_name=ud["full_name"],
            role=ud["role"]
        )
        db.add(user)
        db.flush()
        created_users[ud["email"]] = user
    db.commit()

    # === CREATE INSTITUTIONS ===
    institutions_data = [
        {"email": "cvr@college.edu", "name": "CVR College of Engineering", "aicte_id": "AICTE-AP-1234", "state": "Telangana", "district": "Hyderabad", "institution_type": "Engineering College", "contact_person": "Dr. B. Suresh"},
        {"email": "vnr@college.edu", "name": "VNR Vignana Jyothi Institute of Engineering & Technology", "aicte_id": "AICTE-AP-5678", "state": "Telangana", "district": "Hyderabad", "institution_type": "Engineering College", "contact_person": "Dr. A. Krishnamurthy"},
        {"email": "mgit@college.edu", "name": "Mahatma Gandhi Institute of Technology", "aicte_id": "AICTE-AP-9012", "state": "Telangana", "district": "Hyderabad", "institution_type": "Engineering College", "contact_person": "Prof. R. Naidu"},
        {"email": "cbit@college.edu", "name": "Chaitanya Bharathi Institute of Technology", "aicte_id": "AICTE-AP-3456", "state": "Andhra Pradesh", "district": "Guntur", "institution_type": "Engineering College", "contact_person": "Dr. K. Reddy"},
        {"email": "rgukt@college.edu", "name": "Rajiv Gandhi University of Knowledge Technologies", "aicte_id": "AICTE-AP-7890", "state": "Andhra Pradesh", "district": "Nuzvid", "institution_type": "University", "contact_person": "Dr. P. Rao"},
    ]

    created_institutions = {}
    for idata in institutions_data:
        user = created_users[idata["email"]]
        inst = Institution(
            user_id=user.id,
            name=idata["name"],
            aicte_id=idata["aicte_id"],
            state=idata["state"],
            district=idata["district"],
            institution_type=idata["institution_type"],
            contact_person=idata["contact_person"],
            contact_email=idata["email"]
        )
        db.add(inst)
        db.flush()
        created_institutions[idata["email"]] = inst
    db.commit()

    officer = created_users["officer1@aicte.gov.in"]
    now = datetime.utcnow()

    # === CREATE FDR RECORDS ===
    fdr_scenarios = [
        {
            "inst": created_institutions["cvr@college.edu"],
            "user": created_users["cvr@college.edu"],
            "fdr_number": "FDR-SBI-2024-001",
            "bank_name": "State Bank of India",
            "bank_branch": "Secunderabad Main Branch",
            "bank_ifsc": "SBIN0000500",
            "account_number": "32145678901",
            "amount": 1000000.0,
            "issue_date": now - timedelta(days=180),
            "maturity_date": now + timedelta(days=185),
            "purpose": "Security deposit for new engineering program approval",
            "status": FDRStatus.active,
            "priority_score": 10,
            "priority_reasons": json.dumps(["NOTICE: FDR matures in 185 days (within 90 days)"])
        },
        {
            "inst": created_institutions["vnr@college.edu"],
            "user": created_users["vnr@college.edu"],
            "fdr_number": "FDR-DISC-2024-002",
            "bank_name": "HDFC Bank",
            "bank_branch": "Kukatpally Branch",
            "bank_ifsc": "HDFC0001234",
            "account_number": "50456789012",
            "amount": 2000000.0,
            "issue_date": now - timedelta(days=90),
            "maturity_date": now + timedelta(days=275),
            "purpose": "Security deposit - capacity expansion",
            "status": FDRStatus.discrepancy_found,
            "priority_score": 55,
            "priority_reasons": json.dumps(["Discrepancy detected and unresolved", "High-severity amount mismatch between submitted and OCR-extracted values"])
        },
        {
            "inst": created_institutions["mgit@college.edu"],
            "user": created_users["mgit@college.edu"],
            "fdr_number": "FDR-DUPL-2024-003",
            "bank_name": "Bank of Baroda",
            "bank_branch": "Ameerpet Branch",
            "bank_ifsc": "BARB0AMPRPT",
            "account_number": "22334455667",
            "amount": 500000.0,
            "issue_date": now - timedelta(days=60),
            "maturity_date": now + timedelta(days=305),
            "purpose": "Annual security deposit renewal",
            "status": FDRStatus.discrepancy_found,
            "priority_score": 60,
            "priority_reasons": json.dumps(["HIGH: Duplicate FDR number detected", "Discrepancy detected and unresolved"])
        },
        {
            "inst": created_institutions["cbit@college.edu"],
            "user": created_users["cbit@college.edu"],
            "fdr_number": "FDR-ICICI-2024-004",
            "bank_name": "ICICI Bank",
            "bank_branch": "Vijayawada Main",
            "bank_ifsc": "ICIC0001567",
            "account_number": "00678901234",
            "amount": 750000.0,
            "issue_date": now - timedelta(days=335),
            "maturity_date": now + timedelta(days=25),
            "purpose": "Security deposit - existing program",
            "status": FDRStatus.approaching_maturity,
            "priority_score": 75,
            "priority_reasons": json.dumps(["URGENT: FDR matures in 25 days (within 30 days)", "No renewal action taken"])
        },
        {
            "inst": created_institutions["rgukt@college.edu"],
            "user": created_users["rgukt@college.edu"],
            "fdr_number": "FDR-PNB-2023-005",
            "bank_name": "Punjab National Bank",
            "bank_branch": "Nuzvid Branch",
            "bank_ifsc": "PUNB0NUVZID",
            "account_number": "01234567891",
            "amount": 300000.0,
            "issue_date": now - timedelta(days=550),
            "maturity_date": now - timedelta(days=5),
            "purpose": "Security deposit - older program",
            "status": FDRStatus.matured,
            "priority_score": 80,
            "priority_reasons": json.dumps(["OVERDUE: FDR matured 5 days ago with no renewal/release action", "Immediate action required"])
        },
        {
            "inst": created_institutions["rgukt@college.edu"],
            "user": created_users["rgukt@college.edu"],
            "fdr_number": "FDR-PNB-2024-006-RNW",
            "bank_name": "Punjab National Bank",
            "bank_branch": "Nuzvid Branch",
            "bank_ifsc": "PUNB0NUVZID",
            "account_number": "01234567892",
            "amount": 300000.0,
            "issue_date": now - timedelta(days=10),
            "maturity_date": now + timedelta(days=355),
            "purpose": "Renewal of FDR-PNB-2023-005",
            "status": FDRStatus.under_review,
            "renewal_type": "renewal",
            "priority_score": 20,
            "priority_reasons": json.dumps(["Renewal under review"])
        },
        {
            "inst": created_institutions["cvr@college.edu"],
            "user": created_users["cvr@college.edu"],
            "fdr_number": "FDR-SBI-2022-007",
            "bank_name": "State Bank of India",
            "bank_branch": "Secunderabad Main Branch",
            "bank_ifsc": "SBIN0000500",
            "account_number": "32145678902",
            "amount": 1500000.0,
            "issue_date": now - timedelta(days=730),
            "maturity_date": now - timedelta(days=60),
            "purpose": "Original security deposit - program closed",
            "status": FDRStatus.release_requested,
            "priority_score": 65,
            "priority_reasons": json.dumps(["OVERDUE: FDR matured 60 days ago", "Release request pending review", "Institution compliance clearance pending"])
        },
        {
            "inst": created_institutions["vnr@college.edu"],
            "user": created_users["vnr@college.edu"],
            "fdr_number": "FDR-AXIS-2024-008",
            "bank_name": "Axis Bank",
            "bank_branch": "Madhapur Branch",
            "bank_ifsc": "UTIB0001289",
            "account_number": "91234567890",
            "amount": 800000.0,
            "issue_date": now - timedelta(days=30),
            "maturity_date": now + timedelta(days=335),
            "purpose": "New program security deposit",
            "status": FDRStatus.submitted,
            "priority_score": 25,
            "priority_reasons": json.dumps(["No supporting documents uploaded", "Pending initial review"])
        },
    ]

    created_fdrs = []
    for fd in fdr_scenarios:
        fdr = FDR(
            institution_id=fd["inst"].id,
            submitted_by_id=fd["user"].id,
            assigned_officer_id=officer.id,
            fdr_number=fd["fdr_number"],
            bank_name=fd["bank_name"],
            bank_branch=fd["bank_branch"],
            bank_ifsc=fd["bank_ifsc"],
            account_number=fd["account_number"],
            amount=fd["amount"],
            issue_date=fd["issue_date"],
            maturity_date=fd["maturity_date"],
            purpose=fd["purpose"],
            status=fd["status"],
            priority_score=fd["priority_score"],
            priority_reasons=fd["priority_reasons"],
            renewal_type=fd.get("renewal_type")
        )
        db.add(fdr)
        db.flush()
        created_fdrs.append(fdr)
    db.commit()

    # Link renewal FDR (006) to matured FDR (005)
    created_fdrs[5].parent_fdr_id = created_fdrs[4].id
    db.commit()

    # Add duplicate FDR with same number as FDR-003
    dup_fdr = FDR(
        institution_id=created_institutions["cbit@college.edu"].id,
        submitted_by_id=created_users["cbit@college.edu"].id,
        fdr_number="FDR-DUPL-2024-003",
        bank_name="Canara Bank",
        bank_branch="Guntur Branch",
        bank_ifsc="CNRB0001567",
        account_number="1234567890",
        amount=500000.0,
        issue_date=now - timedelta(days=65),
        maturity_date=now + timedelta(days=300),
        purpose="Security deposit",
        status=FDRStatus.discrepancy_found,
        priority_score=70,
        priority_reasons=json.dumps(["DUPLICATE: Same FDR number as existing record"])
    )
    db.add(dup_fdr)
    db.commit()

    # === ADD DISCREPANCIES ===
    discrepancies = [
        Discrepancy(
            fdr_id=created_fdrs[1].id,
            discrepancy_type=DiscrepancyType.amount_mismatch,
            field_name="amount",
            submitted_value="2000000.00",
            expected_value="1800000.00",
            description="Institution submitted amount Rs. 20,00,000 but OCR extracted Rs. 18,00,000 from the FDR document (10% difference). Manual verification required.",
            severity="high",
            detected_by="ocr_system"
        ),
        Discrepancy(
            fdr_id=created_fdrs[2].id,
            discrepancy_type=DiscrepancyType.duplicate_fdr,
            field_name="fdr_number",
            submitted_value="FDR-DUPL-2024-003",
            expected_value="Unique FDR number",
            description="FDR number 'FDR-DUPL-2024-003' already exists in the system. Submitted by MGIT, but a record with this FDR number also exists for CBIT. This may indicate a duplicate submission or document reuse.",
            severity="high",
            detected_by="system"
        ),
        Discrepancy(
            fdr_id=created_fdrs[6].id,
            discrepancy_type=DiscrepancyType.missing_document,
            field_name="documents",
            submitted_value="Not uploaded",
            expected_value="compliance_clearance",
            description="Institution compliance clearance certificate is required for release processing but has not been provided.",
            severity="medium",
            detected_by="officer"
        ),
        Discrepancy(
            fdr_id=created_fdrs[7].id,
            discrepancy_type=DiscrepancyType.missing_document,
            field_name="documents",
            submitted_value="Not uploaded",
            expected_value="fdr_certificate",
            description="FDR Certificate document has not been uploaded. This is required for OCR verification.",
            severity="medium",
            detected_by="system"
        ),
        Discrepancy(
            fdr_id=created_fdrs[7].id,
            discrepancy_type=DiscrepancyType.missing_document,
            field_name="documents",
            submitted_value="Not uploaded",
            expected_value="lien_letter",
            description="Lien letter confirming AICTE's lien on the FDR has not been uploaded.",
            severity="medium",
            detected_by="system"
        ),
    ]
    for d in discrepancies:
        db.add(d)
    db.commit()

    # === ADD AUDIT LOGS ===
    audit_entries = [
        AuditLog(user_id=created_users["cvr@college.edu"].id, fdr_id=created_fdrs[0].id, action="FDR_SUBMITTED", entity_type="fdr", entity_id=created_fdrs[0].id, details="FDR-SBI-2024-001 submitted by CVR College"),
        AuditLog(user_id=officer.id, fdr_id=created_fdrs[0].id, action="STATUS_UPDATED", entity_type="fdr", entity_id=created_fdrs[0].id, details="Status changed to under_review"),
        AuditLog(user_id=officer.id, fdr_id=created_fdrs[0].id, action="STATUS_UPDATED", entity_type="fdr", entity_id=created_fdrs[0].id, details="Status changed to active after verification"),
        AuditLog(user_id=created_users["vnr@college.edu"].id, fdr_id=created_fdrs[1].id, action="FDR_SUBMITTED", entity_type="fdr", entity_id=created_fdrs[1].id, details="FDR-DISC-2024-002 submitted"),
        AuditLog(user_id=None, fdr_id=created_fdrs[1].id, action="DISCREPANCY_DETECTED", entity_type="fdr", entity_id=created_fdrs[1].id, details="Amount mismatch detected by OCR system"),
        AuditLog(user_id=created_users["cvr@college.edu"].id, fdr_id=created_fdrs[6].id, action="RELEASE_REQUESTED", entity_type="fdr", entity_id=created_fdrs[6].id, details="Release request submitted for FDR-SBI-2022-007"),
    ]
    for log in audit_entries:
        db.add(log)

    # === ADD NOTIFICATIONS ===
    notifications = [
        Notification(user_id=created_users["cbit@college.edu"].id, fdr_id=created_fdrs[3].id, title="FDR Approaching Maturity", message="Your FDR FDR-ICICI-2024-004 matures in 25 days. Please initiate renewal or contact AICTE.", notification_type="maturity_alert"),
        Notification(user_id=created_users["rgukt@college.edu"].id, fdr_id=created_fdrs[4].id, title="FDR Has Matured", message="FDR FDR-PNB-2023-005 has matured. Please submit renewal or release request immediately.", notification_type="maturity_overdue"),
        Notification(user_id=created_users["vnr@college.edu"].id, fdr_id=created_fdrs[1].id, title="Discrepancy Found", message="A discrepancy has been detected in your FDR FDR-DISC-2024-002. Please review and submit corrections.", notification_type="discrepancy"),
        Notification(user_id=officer.id, fdr_id=created_fdrs[3].id, title="Urgent: FDR Expiring Soon", message="CBIT's FDR matures in 25 days and requires immediate officer review.", notification_type="officer_alert"),
        Notification(user_id=officer.id, fdr_id=created_fdrs[4].id, title="Overdue Matured FDR", message="RGUKT's FDR has matured 5 days ago with no action. Priority review required.", notification_type="officer_alert"),
    ]
    for n in notifications:
        db.add(n)

    db.commit()
    db.close()

    print("\n=== DEMO DATA SEEDED SUCCESSFULLY ===")
    print("\nDemo Credentials:")
    print("  Admin:       admin@aicte.gov.in     / Admin@123")
    print("  Officer:     officer1@aicte.gov.in  / Officer@123")
    print("  Authority:   authority@aicte.gov.in / Auth@123")
    print("  Institution: cvr@college.edu        / College@123")
    print("  Institution: vnr@college.edu        / College@123")
    print("\nDemo FDR Scenarios:")
    print("  1. Valid active FDR (FDR-SBI-2024-001)")
    print("  2. Amount mismatch discrepancy (FDR-DISC-2024-002)")
    print("  3. Duplicate FDR number (FDR-DUPL-2024-003)")
    print("  4. Approaching maturity - 25 days (FDR-ICICI-2024-004)")
    print("  5. Matured with no action (FDR-PNB-2023-005)")
    print("  6. Renewal FDR linked to #5 (FDR-PNB-2024-006-RNW)")
    print("  7. Release request pending (FDR-SBI-2022-007)")
    print("  8. Missing documents (FDR-AXIS-2024-008)")

if __name__ == "__main__":
    seed()
