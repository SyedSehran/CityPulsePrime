# CityPulse Prime — AI-Driven Municipal Governance & Algorithmic Triage Platform

**CityPulse Prime** is an advanced, next-gen municipal governance platform featuring exact algorithmic priority scoring, spatial report deduplication, computer vision before-vs-after resolution auditing, agentic contractor work-order PDF RFP generation, vehicle routing problem (VRP) crew dispatch optimization, background SLA escalation monitoring, and an open public accountability dashboard.

---

## Key Differentiating Features

### 1. Core Algorithmic Engine
* **Formula Priority Scoring ($P$)**:
  $$P = (\text{Severity} \times 0.4) + (\text{Cluster Size} \times 0.3) + (\text{SLA Risk} \times 0.2) + (\text{Ward Risk} \times 0.1)$$
  Provides an explicit weight breakdown in both backend API responses and frontend visual score cards.
* **Spatial Deduplication (50-Meter Radius)**:
  Automatically merges newly submitted reports within 50 meters of an active ticket. Displays `"Merged with N existing reports"` and recalculates $P$.
* **Proximity-Weighted Voting & 40% Dispute Threshold**:
  Citizen vote weight scales by distance to incident location ($<100\text{m} = 1.0\times, <1\text{km} = 0.5\times, >1\text{km} = 0.1\times$). Flags tickets exceeding a 40% dispute threshold for urgent review.

### 2. AI & Automated Auditing
* **CV "Before vs. After" Auditor**:
  Requires municipal workers to upload a post-repair photo upon ticket resolution. Runs OpenCV structural comparison to block fraudulent closures or identical photo re-uploads.
* **Agentic Work-Order Generator (PDF RFP Tenders)**:
  Generates downloadable, formal contractor repair tenders / RFPs in PDF format complete with budget estimates, line-item specs, and SLA compliance terms.

### 3. Smart Routing & Operations
* **Crew Route Optimization (VRP Solver)**:
  Solves the Vehicle Routing Problem (VRP / TSP) across active high-priority tickets in a ward to compute the fastest multi-stop pickup and repair routes for field crews.
* **Automated SLA Escalation Cron**:
  Background task tracks ticket ages against ward SLA limits (e.g. 24h for critical sewer/water, 48h for potholes). Automatically boosts priority score $P$ by $+25\%$ and flags overdue tickets.

### 4. Public Governance & Transparency
* **Open Accountability Dashboard (`/public`)**:
  No-login open route displaying ward-level resolution rates, average time-to-fix metrics, interactive issue map, and unfixed issue leaderboard sorted strictly by $P$.

---

## Quickstart & Local Setup

### 1. Backend Server
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI backend server
python -m uvicorn backend.app.main:app --reload --port 8000
```

### 2. Frontend Application
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser:
* **Public Transparency Dashboard**: [http://localhost:5173/public](http://localhost:5173/public)
* **Citizen Reporting Portal**: [http://localhost:5173/citizen](http://localhost:5173/citizen)
* **Officer Command Center**: [http://localhost:5173/gov/dashboard](http://localhost:5173/gov/dashboard)
* **Interactive API Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## License
MIT License.
