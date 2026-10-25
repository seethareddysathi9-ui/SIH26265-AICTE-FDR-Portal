# AICTE FDR Management Portal
### SIH26265 — Smart India Hackathon 2026 Prototype

> **⚠ PROTOTYPE DISCLAIMER:** This is a hackathon demonstration prototype only.
> All data is synthetic. This system is NOT connected to real AICTE or bank systems.
> No real financial records are used or generated.

---

## 🎯 Problem Statement

**SIH26265** — AICTE Security Deposit/FDR Management Portal

Build a centralized web portal that manages the complete lifecycle of security deposits
and Fixed Deposit Receipts (FDRs) submitted by technical institutions to AICTE.

---

## 🏗️ Architecture

```
SIH/
├── backend/          # FastAPI + SQLite (Python)
│   ├── app/
│   │   ├── models.py         # SQLAlchemy ORM models
│   │   ├── auth.py           # JWT authentication
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── config.py         # Settings
│   │   ├── database.py       # DB connection
│   │   ├── routers/          # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── fdrs.py       # Core FDR CRUD + priority
│   │   │   ├── documents.py  # File upload + OCR trigger
│   │   │   ├── institutions.py
│   │   │   ├── analytics.py
│   │   │   ├── notifications.py
│   │   │   └── audit.py
│   │   └── services/
│   │       ├── ocr_service.py          # Simulated OCR
│   │       ├── priority_service.py     # Priority scoring engine
│   │       └── discrepancy_service.py  # Discrepancy detection
│   ├── seed.py       # Demo data generator
│   ├── run.py        # Server entry point
│   └── requirements.txt
│
├── frontend/         # React + TypeScript + Vite + Tailwind v4
│   └── src/
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── institution/
│       │   │   ├── Dashboard.tsx
│       │   │   ├── SubmitFDR.tsx
│       │   │   ├── MyFDRs.tsx
│       │   │   ├── FDRDetail.tsx
│       │   │   └── Notifications.tsx
│       │   └── officer/
│       │       ├── Dashboard.tsx
│       │       ├── CaseQueue.tsx
│       │       ├── FDRDetail.tsx
│       │       ├── Analytics.tsx
│       │       ├── AuditTrail.tsx
│       │       └── Notifications.tsx
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── Layout.tsx
│       │   ├── StatusBadge.tsx
│       │   └── ui.tsx
│       ├── context/AuthContext.tsx
│       ├── api/
│       │   ├── client.ts     # Axios instance
│       │   └── services.ts   # API calls
│       └── utils/helpers.ts
│
├── start-backend.bat
├── start-frontend.bat
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+ with pip
- Node.js 18+ with npm

### Step 1: Start Backend

```bash
cd C:\Users\sathi\SIH\backend
pip install -r requirements.txt
python seed.py         # Creates DB and loads demo data
python run.py          # Starts server on http://localhost:8000
```

Or simply run: **`start-backend.bat`**

### Step 2: Start Frontend

```bash
cd C:\Users\sathi\SIH\frontend
npm install
npm run dev            # Starts on http://localhost:5173
```

Or simply run: **`start-frontend.bat`**

### Step 3: Open Browser

Navigate to: **http://localhost:5173**

---

## 👤 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| AICTE Officer | officer1@aicte.gov.in | Officer@123 |
| Competent Authority | authority@aicte.gov.in | Auth@123 |
| Institution (CVR) | cvr@college.edu | College@123 |
| Institution (VNR) | vnr@college.edu | College@123 |
| Institution (MGIT) | mgit@college.edu | College@123 |
| Admin | admin@aicte.gov.in | Admin@123 |

---

## 📋 Demo Scenarios

The system is pre-loaded with 8 FDR test cases:

| # | FDR Number | Scenario | Priority |
|---|-----------|----------|----------|
| 1 | FDR-SBI-2024-001 | Valid active FDR | Low |
| 2 | FDR-DISC-2024-002 | Amount mismatch (OCR detected) | High |
| 3 | FDR-DUPL-2024-003 | Duplicate FDR number | High |
| 4 | FDR-ICICI-2024-004 | Approaching maturity (25 days) | Critical |
| 5 | FDR-PNB-2023-005 | Matured, no action taken | Critical |
| 6 | FDR-PNB-2024-006-RNW | Renewal FDR (linked to #5) | Medium |
| 7 | FDR-SBI-2022-007 | Release request pending | High |
| 8 | FDR-AXIS-2024-008 | Missing documents | Medium |

---

## ✅ Implemented Features

### Institution Portal
- [x] Login / Register
- [x] FDR submission form with validation
- [x] My FDRs list with search and status filter
- [x] FDR detail with document upload
- [x] Discrepancy notifications
- [x] Release readiness checklist (view-only)
- [x] Notification center

### AICTE Officer Portal
- [x] Overview dashboard with stats
- [x] Priority-sorted case queue with filters
- [x] Full FDR scrutiny page with tabbed interface
- [x] Status transitions with workflow
- [x] Add scrutiny/observation records
- [x] Discrepancy review with severity labels
- [x] Release readiness checker with explanation
- [x] Analytics with Recharts (pie, bar, line charts)
- [x] Maturity timeline table
- [x] Audit trail log viewer

### Core System Features
- [x] JWT-based role authentication (institution/officer/authority/admin)
- [x] Simulated OCR extraction on document upload
- [x] Automatic discrepancy detection (duplicate, amount mismatch, missing docs, date errors)
- [x] Explainable priority scoring engine (transparent rule-based, not ML black box)
- [x] Release readiness checklist (document completeness only — does NOT authorize releases)
- [x] Audit trail for all state changes
- [x] Notification system
- [x] Renewal FDR linking to parent FDR

---

## ⚠️ Simulated/Not Real Features

| Feature | Status | Notes |
|---------|--------|-------|
| OCR Document Extraction | Simulated | Production would use Tesseract or cloud OCR |
| Bank Verification | Simulated (labelled) | No real bank API integration |
| Email Notifications | Not implemented | Backend structure ready |
| AICTE System Integration | Not connected | Would require authorized AICTE API access |
| Cryptographic Audit Log | Simplified | Production would use append-only signed log |

---

## 🔑 API Documentation

When the backend is running: **http://localhost:8000/docs** (Swagger UI)

Key endpoints:
- `POST /api/auth/login` — Get JWT token
- `GET /api/fdrs/` — List FDRs (filtered by role)
- `GET /api/fdrs/dashboard-stats` — Dashboard statistics
- `POST /api/fdrs/` — Submit new FDR
- `POST /api/documents/upload/{fdr_id}` — Upload document (triggers OCR)
- `GET /api/fdrs/{id}/release-readiness` — Release readiness checklist
- `GET /api/analytics/overview` — Analytics data
- `GET /api/analytics/maturity-timeline` — Maturity timeline

---

## 🛡️ Business Rules Implemented

1. Discrepancies are flagged as *reasons for investigation*, not proof of fraud
2. OCR results are clearly labelled as *simulated/extracted* — not officer-verified
3. Institution-submitted data is distinct from independently confirmed data
4. The system does NOT automatically authorize financial releases
5. The release readiness checker only checks document completeness
6. All synthetic data is clearly labelled as demo data
7. No real financial, banking, or institution data is used

---

## 🏆 Innovative Features (SIH Differentiators)

1. **Explainable Priority Engine** — Every priority score shows exact reasons (e.g., "URGENT: FDR matures in 25 days"). Not a black box.
2. **Trust Level Badges** — UI distinguishes institution-submitted / OCR-extracted / officer-verified / bank-confirmed data
3. **Simulated OCR Analysis** — Demonstrates how document analysis would work in production
4. **Smart Release Readiness** — Checklist with exact missing items and reasons, with legal disclaimer
5. **Renewal Chain Tracking** — Renewal FDRs are linked to parent FDRs with full history
6. **Demo Workflow Completeness** — All 6 demo flows from the problem statement work end-to-end

---

*SIH26265 — Built for Smart India Hackathon 2026*
