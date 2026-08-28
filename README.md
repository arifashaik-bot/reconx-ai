# RECONX AI — Financial Reconciliation Workspace

> **Turn payment chaos into financial clarity.**

RECONX AI is a full-stack, enterprise-grade financial reconciliation application designed to compare three independent financial sources:
1. **Bank Statement**
2. **Merchant Ledger**
3. **Payment Settlement Report**

The engine performs deterministic 3-way cross-source matching, classifies transaction integrity, calculates financial variances, surfaces broken exceptions, audits gateway fees, and provides natural-language AI insights directly grounded in a local SQLite database via Prisma ORM.

---

## 🌟 Key Features

### 1. Multi-Level Deterministic Matching Engine
- **Level 1**: Exact reliable identifier (normalized reference matching).
- **Level 2**: Strong sub-reference match + exact amount.
- **Level 3**: Amount + exact transaction date.
- **Level 4**: Amount + transaction date within configured tolerance ($T \pm n$ days).
- **Level 5**: Fuzzy reference token similarity (> 75%) + amount.
- **Level 6**: Composite metadata (matching customer, payment channel, amount).
- **Conflict Resolution**: Compares confidence scores and flags ambiguities as `REVIEW_REQUIRED`.

### 2. 3-Way Cross-Source Grouping
- Links related records across Bank, Merchant, and Settlement into **ONE unified reconciliation case** with 3-source side-by-side audit breakdowns.

### 3. Dynamic Semantic Column Mapping
- Automatically identifies references, gross/net amounts, fee deductions, taxes, credits, debits, and dates from diverse naming schemas.
- Distinguishes and isolates **running bank balance** columns so they are never mistaken for transaction amounts.
- Parses multi-currency formats (`$`, `₹`, `€`, `£`, `Rs.`), European commas, accounting parentheses `(1,250.00)`, and signed/CR/DR indicators.

### 4. 9 Comprehensive Health Classifications
- `MATCHED`: Complete 3-way consensus with zero variance.
- `LIKELY_MATCH`: High-confidence match within acceptable extended window.
- `AMOUNT_MISMATCH`: Identifiers agree across sources but financial amounts differ.
- `MISSING`: Unmatched record present only in a single source.
- `MISSING_SETTLEMENT`: Verified in Bank and Merchant but missing in Payment Gateway settlement.
- `DUPLICATE`: Multiple identical entries within the same source file.
- `PARTIAL_SETTLEMENT`: Payout amount is strictly lower without an explicit fee deduction.
- `TIMING_DISCREPANCY`: Settled outside the configured day tolerance.
- `REVIEW_REQUIRED`: Ambiguous or competing candidate records.

### 5. Interactive 3D & 2D Node Flow Visualization
- Three.js / React Three Fiber interactive 3D visualization showing Bank, Merchant, and Settlement nodes flowing through the RECONX AI engine with hover tooltips and real-time ledger metrics.
- Automatic, graceful 2D canvas/SVG fallback if WebGL is unavailable or reduced-motion is requested.

### 6. Grounded AI Analyst Workspace
- Natural language query assistant analyzing the active SQLite reconciliation run.
- Powered by OpenAI API (if configured) or an intelligent deterministic financial AI engine that evaluates real database figures, root causes, and specific transaction references.

### 7. Multi-Format Audit Reports
- One-click downloads of Reconciliation, Exceptions, and Settlement reports in **CSV**, **Excel XLSX**, and **Executive HTML** formats.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, SQLite.
- **File Parsing**: `csv-parse`, `xlsx` (SheetJS), `multer`.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Framer Motion, Three.js, React Three Fiber.
- **Testing**: Jest, `ts-jest` automated unit and integration suite.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Install & Setup Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm test # Run automated test suite
```

### 2. Install & Setup Frontend
```bash
cd ../frontend
npm install
npm run build # Verify build
```

### 3. Run the Full-Stack Application
In two separate terminals:

**Terminal 1 (Backend - Port 5000):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend - Port 5173):**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing with Real or Sample Data

1. **Evaluation Demo Mode**: Click **"Launch Demo Mode"** in the sidebar to generate a synthetic dataset with realistic matches, mismatches, missing settlements, duplicates, and timing discrepancies.
2. **Real File Upload**: Go to **Reconcile**, drag and drop your own 3 financial files (or the sample files in `/samples/`), inspect the dynamic column mappings, and click **"Run Reconciliation Engine"**.
