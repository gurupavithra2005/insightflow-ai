# InsightFlow — Intelligent Customer Feedback & Decision Platform

> **Hackathon:** Build Battle 2026 — Frontend Arena  
> **Repository:** insightflow-ai  
> **Live App:** AI Studio Build Deployment  

---

## 1. Project Overview

**InsightFlow** is an enterprise customer feedback intelligence and decision-support platform. It transforms fragmented, noisy customer reviews and complaint reports into validated analytical clusters, explainable priority rankings, and actionable executive remediation recommendations.

Unlike tools that present hardcoded mockups or hallucinated business risk metrics, InsightFlow enforces strict **data integrity, non-inflation recurrence counting, transparent 5-factor priority scoring, and verbatim evidence traceability**.

---

## 2. Core Feature Matrix

### Feedback Management (Phase 1)
- **Manual Feedback Recording**: Ingest single customer reviews with instant category assignment and real-time metric recalculation.
- **CSV Ingestion & Validation Engine**: Upload customer feedback datasets (up to 7,000+ rows) with column mapping, schema validation, and row preview.
- **Feedback Explorer**: Full-text keyword search, multi-category filtering, sentiment filtering, paginated grid with instant record inspection.
- **Clean CSV Export**: Export active or filtered records with original text and source taxonomy intact.

### AI & Heuristic Analysis Engine (Phases 2 & 3)
- **Dual Inference Engine**:
  - **Gemini 3.8 Flash AI Model**: Server-side batch processing via `@google/genai` with structured JSON schema enforcement for deep sentiment, semantic topic discovery, and complaint clustering.
  - **Transparent Rule Baseline**: Deterministic heuristic lexicon for offline or unconfigured environments. Never labeled as AI.
- **Traceable Verbatim Evidence**: Every sentiment classification and complaint group citations an exact verbatim quote from the customer.
- **Honest Confidence Scoring**: Validated model confidence (0.0 to 1.0) with zero fabricated scores.

### Intelligent Priority Scoring & Recommendations (Phase 4)
- **Deterministic 5-Factor Priority Scoring (0–100)**:
  1. **Feedback Recurrence (30%)**: Scaled logarithmically ($\ln(\text{count}+1)/\ln(\text{max}+1)$) to prevent high-volume outliers from hiding other issues.
  2. **Sentiment Severity (30%)**: Weighted dissatisfaction ratio ($1.0 \times \text{Neg} + 0.6 \times \text{Mix}$).
  3. **Category Relevance (15%)**: Configurable organizational risk mapping (`Fraud: 95`, `Operations: 85`, `Support: 70`, `Product: 65`).
  4. **Distinct Evidence Statements (15%)**: Measures phrasing diversity.
  5. **Model Confidence (10%)**: Average classification certainty.
- **Proportional Weight Renormalization**: When factors are missing, active weights renormalize to sum to 100%.
- **Evidence-Backed Action Recommendations**: Grounded qualitative operational outcomes and immediate next steps.
- **Full-Featured Issue Tracker**: State management (`Open`, `Under Review`, `In Progress`, `Resolved`, `Dismissed`), owner assignments, due dates, team investigation notes, and audit trails.

### Business Intelligence & Reporting (Phases 5 & 6)
- **Reports & BI Dashboard**: Dynamic executive KPI summary, sentiment distributions with analyzed denominators, category spread, and topic rankings.
- **Report Generator Modal**: Configurable report types (Executive Summary, Sentiment Report, Topics & Complaints, Priority Matrix, Action Plan, Comprehensive Report).
- **Multi-Format Export Hub**:
  - **Printable Executive HTML/PDF**: Formatted publication-ready document with `@media print` styling.
  - **Domain-Specific CSVs**: Filtered feedback, sentiment records, topics, complaints, priority issues, and recommendations.
  - **Structured JSON Snapshot**: Machine-readable payload for external BI ingestion.
- **Persistent Report History**: Audit snapshots stored in browser local storage.

### Data Sources, Benchmark & Adaption Integration (Phase 6)
- **Official 7,000-Record Build Battle Benchmark**: One-click direct ingestion and standalone CSV download of the official benchmark dataset with authentic distribution:
  - Operational Issues: 1,800 rows (80 distinct seeds)
  - Fraud and Scam: 1,755 rows (80 distinct seeds)
  - Product Feedback: 1,738 rows (80 distinct seeds)
  - Customer Service: 1,707 rows (80 distinct seeds)
- **Secure Server-Side Adaption Proxy**: `/api/adaption` handles all interactions with Adaption Labs (`api.prod.adaptionlabs.ai/api/v1`) using `ADAPTION_API_KEY`. The key is never exposed to browser bundles.
- **Zero-Mock Policy**: When credentials are missing, the system reports status as `BLOCKED` with honest explanations rather than fabricating simulated responses or run IDs.
- **Pre-Run Credit Estimation & Explicit Confirmation**: Calculates estimated credit costs and mandates explicit user confirmation before initiating any credit-consuming adaptation run.
- **Verified Column Mapping**: Maps raw `review` and `category` fields to pipeline requirements without assuming synthetic training labels.

---

## 3. Technology Stack

- **Framework**: Next.js 15+ (App Router, Server-Side API Routes, Standalone Output)
- **Runtime**: Node.js 22 (npm)
- **Frontend Core**: React 19, TypeScript 5.9, Tailwind CSS v4, Lucide React icons
- **State & Storage**: Custom singleton repository with `useSyncExternalStore` and `localStorage` persistence
- **Data Ingestion**: PapaParse (CSV parsing & unparsing)
- **AI SDK**: `@google/genai` (v2.4.0) server-side client

---

## 4. Architecture & Data Integrity Principles

```
RAW FEEDBACK (CSV or Manual)
       ↓
DEDUPLICATION & OCCURRENCE INDEXING
       ↓
VALIDATED ANALYSIS (Gemini 3.8 Flash / Baseline)
       ↓
CANDIDATE ISSUES (Complaints / Topics / Recurrence)
       ↓
EXPLAINABLE 5-FACTOR PRIORITY SCORE (0-100)
       ↓
EVIDENCE REVIEW & RECOMMENDATIONS
       ↓
HUMAN-IN-THE-LOOP ISSUE TRACKER
       ↓
EXECUTIVE BI REPORTS (PDF / CSV / JSON)
```

1. **Zero Fake Metrics**: No fabricated dollar amounts, revenue projections, or made-up customer churn percentages.
2. **Occurrence vs Distinct Phrasing**: Total occurrences are strictly maintained without double-counting, while distinct phrasing variations are reported separately.
3. **Temporal Transparency**: In datasets without date columns, time-series charts display honest empty states rather than simulated dates.
4. **Data Isolation**: Re-running analysis or loading a new dataset updates analytical findings while preserving user-managed issue statuses, owners, due dates, and investigation notes.

---

## 5. Environment Variables

Define the following in `.env` (refer to `.env.example`):

```bash
# Server-side Gemini API key for batch customer feedback analysis
GEMINI_API_KEY=your_gemini_api_key_here

# (Optional) External Adaption pipeline cluster API key
ADAPTION_API_KEY=
```

> **Security Note:** The Gemini API key is accessed exclusively server-side in API routes (`process.env.GEMINI_API_KEY`). It is never prefixed with `NEXT_PUBLIC_` and never bundled into client JavaScript.

---

## 6. Installation & Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Add your GEMINI_API_KEY

# 3. Start development server on port 3000
npm run dev

# 4. Run lint verification
npm run lint

# 5. Build for production
npm run build
```

---

## 7. Demonstration Workflow for Judges

1. **Overview Dashboard**: Open the landing page to view dataset metrics, category spread, and workflow pipeline progress.
2. **Load Benchmark Dataset**: In the header or import modal, click **"Load Benchmark Dataset"** to ingest the 7,000-row Build Battle 2026 dataset (320 distinct statements across 4 categories).
3. **Execute AI Analysis**: Navigate to **AI Insights** and run batch inference (using Gemini 3.8 Flash or Transparent Baseline) to discover topics, sentiment, and complaint clusters.
4. **Inspect Candidate Issues**: In **Recommendations**, examine prioritized problem themes. Open the **Explainability Panel** on any issue to see the exact factor weights and contribution breakdown.
5. **Inspect Verbatim Quotations**: Click **"Inspect in Workspace"** on any customer quote to verify the underlying row data.
6. **Track Lifecycle Actions**: In **Issue Tracker**, change an issue's status to `In Progress` or `Resolved`, assign an owner, and add investigation notes.
7. **Generate Executive Report**: In **Reports & BI**, generate a comprehensive report and download the publication-ready printable PDF or CSV datasets.
8. **Verify Persistence**: Refresh the browser to observe that dataset state, analysis results, issues, and notes persist seamlessly.

---

## 8. Official Evaluation Criteria Alignment

| Evaluation Criterion | Weight | Corresponding Repository Files & Verification |
|---|:---:|---|
| **1. Problem Understanding** | **15%** | • `services/benchmarkDataset.ts`: Exact 7,000-row competition dataset with 320 distinct review seeds across 4 categories (1,800 Operational, 1,755 Fraud, 1,738 Product, 1,707 Support).<br>• `services/analyticsService.ts`: Separates total occurrences from unique phrasing without data inflation. |
| **2. Functionality & UX** | **25%** | • Complete end-to-end pipeline: CSV Ingestion (`services/csvImportService.ts`) → Batch Analysis (`services/aiAnalysisService.ts`) → 5-Factor Scoring (`services/priorityScorer.ts`) → Recommendations (`services/recommendationService.ts`) → Issue Tracking (`services/issueService.ts`) → PDF Export (`services/reportService.ts`).<br>• Zero broken buttons or non-functional placeholder interactions. |
| **3. UI/UX & Design** | **20%** | • Responsive AppShell layout (`components/layout/AppShell.tsx`, `TopHeader.tsx`, `Sidebar.tsx`).<br>• Mobile-optimized dashboard with accessible contrast, zero horizontal overflow, and clean responsive card wrapping.<br>• Dynamic, honest status badges (no deceptive "Verified" or "Phase 6 Ready" labels). |
| **4. Innovation & Creativity** | **15%** | • `services/priorityScorer.ts`: Deterministic, explainable 5-factor priority score with logarithmic scaling and proportional weight renormalization.<br>• Evidence Traceability: Every recommendation and issue connects to verbatim customer quotes. |
| **5. Technical Implementation** | **15%** | • Next.js 15 App Router, TypeScript 5.9, Tailwind CSS v4, Lucide React.<br>• Real binary PDF generator using `jspdf` (`downloadExecutivePdfReport`).<br>• Server-side API security for Gemini (`/api/analyze`) and Adaption (`/api/adaption`) with zero browser secret leaks.<br>• Clean `npm run build` and `npm run lint` passes. |
| **6. Presentation & Demo** | **10%** | • One-click benchmark loading and CSV download.<br>• Real-time progress indicators during batch analysis.<br>• Step-by-step 3-minute hackathon demo walkthrough documented in Section 7. |

---

## 9. License

MIT License. Developed for the **Build Battle 2026 — Frontend Arena** hackathon.
