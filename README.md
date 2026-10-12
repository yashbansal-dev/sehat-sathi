# Sehat Sathi AI — The Two-Minute Doctor
> **T01 — Fragmented Medical Records, Incomplete Health History**  
> AI-powered personal health history platform converting scattered medical documents into a unified, chronological, evidence-linked clinical story.

---

## 🌟 Product Vision

Patients frequently arrive at clinical consultations carrying fragmented medical records—disorganized physical paper folders, WhatsApp prescription photos, discharge summaries, and laboratory slips. Doctors often have less than two to three minutes to digest this chaotic history, leading to overlooked drug allergies, redundant repeat tests, and medication reconciliation errors.

**Sehat Sathi AI** solves this problem by:
1. Converting scattered prescriptions, laboratory tests, and hospital discharge summaries into a unified, chronological medical timeline.
2. Providing **The Two-Minute Doctor Brief**—a concise, evidence-linked clinical summary showing active vs. historical medications, abnormal biomarkers, documented allergies, and targeted questions for clinician verification.
3. Providing a **Verification Center** that flags low-confidence OCR scans, faded dosages, and conflicting records, logging every correction in an immutable audit trail.
4. Offering **Patient-Controlled Secure Sharing** with time-limited (e.g., 2h, 12h, 24h, 7d), revocable access tokens and IP audit logging.

*Disclaimer: This platform supports healthcare professionals and patients; it does not replace medical diagnosis or clinical judgment.*

---

## 🏗️ Architecture & Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS with custom healthcare color system (Deep Teal & Mint)
- **Icons**: Lucide React
- **Visualizations**: Recharts (for longitudinal biomarker trajectories: HbA1c, Fasting Blood Sugar, Total Cholesterol, Blood Pressure)
- **Print Optimization**: Dedicated CSS print styles for clinician physical exports

### Backend
- **Framework**: Python FastAPI with Pydantic v2 schemas
- **Database**: PostgreSQL / SQLite with SQLAlchemy ORM and Alembic migration compatibility
- **OCR Engine**: PyMuPDF (`pymupdf`) for digital PDFs and OCR fallback for scanned slips and images
- **Clinical AI Engine**: Structured extraction engine with strict schema enforcement, prompt isolation for untrusted document text, and deterministic clinical NLP fallback adapter
- **Security & Authorization**: JWT token authentication, Firebase-ready auth architecture, isolated user file storage with path traversal prevention

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+** & **npm**

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server (runs on port 8000)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server (runs on port 5173)
npm run dev
```

Visit **`http://localhost:5173`** in your browser!

---

## 🧪 Running Automated Tests

Run the backend test suite:
```bash
cd backend
.\.venv\Scripts\pytest -o pythonpath=. tests/test_api.py -v
```

All 6 integration tests cover:
- Health check verification
- One-click synthetic demo login
- Timeline and dashboard statistics calculation
- Two-Minute Doctor Brief generation and source link integrity
- Verification Center uncertainty resolution and correction logging
- Doctor share token creation, public validation, and instant revocation

---

## 📂 Project Structure

```
sehat-sathi/
├── backend/
│   ├── app/
│   │   ├── config.py                 # Pydantic environment settings
│   │   ├── database.py               # SQLAlchemy engine & session maker
│   │   ├── models/                   # Database models (User, MedicalDocument, Events, Meds, Labs, Sharing)
│   │   ├── schemas/                  # Pydantic v2 validation schemas
│   │   ├── services/
│   │   │   ├── auth_service.py       # Password hashing & JWT auth
│   │   │   ├── storage_service.py    # Private storage with traversal prevention
│   │   │   ├── ocr_service.py        # PyMuPDF & OCR extraction
│   │   │   ├── ai_extraction_service.py # Structured clinical fact extractor
│   │   │   ├── briefing_service.py   # Two-Minute Doctor Brief synthesizer
│   │   │   ├── verification_service.py # Verification & correction audit
│   │   │   └── sharing_service.py    # Time-limited token generator & audit
│   │   ├── routers/                  # REST API endpoints (auth, docs, timeline, briefing, verification, sharing)
│   │   ├── data/
│   │   │   ├── synthetic_samples.py  # Realistic seed patient (Rajesh Sharma, 54M)
│   │   │   └── generate_synthetic_pdfs.py # Script generating sample PDFs
│   │   └── main.py                   # FastAPI application entry point
│   ├── storage/
│   │   ├── synthetic/                # Sample diagnostic reports & discharge summaries
│   │   └── uploads/                  # User private uploads
│   ├── tests/
│   │   └── test_api.py               # Comprehensive pytest test suite
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.tsx            # Navigation header with verification badges
│   │   ├── context/
│   │   │   └── AuthContext.tsx       # Auth state & demo login
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx       # Hero page, value proposition, CTAs
│   │   │   ├── AuthPages.tsx         # Sign in, Sign up, One-click Demo Login
│   │   │   ├── DashboardPage.tsx     # Metrics cards, Recharts trends, recent uploads
│   │   │   ├── DocumentsPage.tsx     # Drag-and-drop upload & OCR inspection
│   │   │   ├── TimelinePage.tsx      # Chronological medical history with filters
│   │   │   ├── DoctorBriefPage.tsx   # Two-Minute Doctor Brief & print export
│   │   │   ├── VerificationPage.tsx  # Flagged facts & audit corrections
│   │   │   ├── SharingPage.tsx       # Patient-controlled revocable share links
│   │   │   └── DoctorPortalPage.tsx  # Dedicated clinician read-only view
│   │   ├── services/
│   │   │   └── api.ts                # Typed REST client
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript definitions
│   │   ├── App.tsx                   # Main router
│   │   └── index.css                 # Tailwind CSS styles & print media rules
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```

---

## 🔒 Security & Privacy Implementation

1. **Backend-Enforced Authorization**: Document endpoints validate ownership before reading or serving files. No public permanent document URLs exist.
2. **Untrusted Input Boundary**: OCR text is strictly treated as untrusted data and parsed into structured schemas without allowing arbitrary execution.
3. **Revocable Doctor Sharing**: Share tokens are cryptographically generated, duration-bounded (e.g. 2h, 24h), and immediately return `410 Gone` upon patient revocation.
4. **Correction Audit Trail**: All edits in the Verification Center preserve the original OCR extraction, documenting who edited what, when, and why.
