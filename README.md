<div align="center">

# 🏛️ JawabDehi AI
### The Automated Civic Accountability & Dispatch Engine for Municipal Governance in Smart Cities.

[![Version](https://img.shields.io/badge/JawabDehi%20AI-v2.0-3b82f6?style=for-the-badge)](https://github.com/SyedSehran/CityPulsePrime)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-009688?style=for-the-badge)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite-61dafb?style=for-the-badge)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)

**JawabDehi AI** is an enterprise-grade civic issue intelligence and municipal accountability platform. It replaces arbitrary dispatch queues with mathematical priority scoring, computer vision resolution auditing, agentic work-order generation, crew route optimization, and open public transparency.

</div>

---

## 🌟 Architectural Pillars

### 1. 🧮 Core Algorithmic Urgency Engine
Every reported issue is evaluated dynamically using a normalized 0–100 mathematical priority formula:

$$\mathbf{P} = (\text{Severity} \times 0.4) + (\text{Cluster Size} \times 0.3) + (\text{SLA Risk} \times 0.2) + (\text{Ward Risk} \times 0.1)$$

* **Spatial Deduplication (<50m Radius)**: Automatically merges incoming citizen reports within 50 meters of an active hazard into a single incident cluster, increments report count, and updates $P$ with `"Merged with N existing reports"`.
* **Proximity-Weighted Voting**: Citizen verification votes scale dynamically based on GPS distance from the ticket:
  * $< 100\text{m} \rightarrow \mathbf{1.0\times}$ weight
  * $< 1\text{km} \rightarrow \mathbf{0.5\times}$ weight
  * $> 1\text{km} \rightarrow \mathbf{0.1\times}$ weight
* **40% Dispute Threshold**: Tickets with $\ge 40\%$ weighted negative feedback are automatically flagged as `"DISPUTED_FLAGGED"` for executive audit.

### 2. 👁️ Computer Vision "Before vs. After" Auditor
* Prevents fraudulent ticket closures by requiring repair crews to upload a post-fix photograph.
* Runs OpenCV structural similarity (SSIM) and color histogram delta analysis against the "Before" photo.
* Automatically rejects identical image re-uploads or fake closures (<10% visual change).

### 3. 📄 Agentic Work-Order Generator (PDF RFP Tenders)
* Parses ticket severity, priority score $P$, coordinates, and SLA windows.
* Generates downloadable, formal contractor **Request for Proposals (RFP) / Repair Tenders** in PDF format complete with budget estimates, safety specs, and SLA compliance terms.

### 4. 🚛 Smart Crew Route Optimization (VRP Solver)
* Solves the **Vehicle Routing Problem (VRP / TSP)** for municipal repair teams using distance matrix calculations boosted by priority score $P$.
* Produces optimal multi-stop dispatch paths, turn-by-turn waypoint numbers, leg distances, and shift duration estimates.

### 5. ⏰ Automated SLA Escalation Engine
* Background cron process monitors active tickets against category SLA limits (e.g., 24h for sewerage/water leakage, 48h for potholes).
* Automatically boosts overdue ticket priority score $P$ by **$+25\%$** and triggers supervisor escalation banners.

### 6. 📊 Open Public Governance Dashboard (`/public`)
* Open-access, no-login portal for citizens, journalists, and city council members.
* Displays ward resolution rates, category average time-to-fix metrics, interactive map views, and an unfixed issue leaderboard ranked strictly by $P$.

---

## 🔄 Platform Workflow Architecture

```
[ Citizen Report ] ──► Spatial Deduplication (<=50m) ──► Formula Priority Scoring (P)
                                                                 │
                                                                 ▼
[ Municipal Command ] ◄── Agentic RFP PDF / Crew VRP Route ◄── Triage Queue
         │
         ▼
[ Resolution Upload ] ──► CV Before-vs-After Auditor ──► Citizen Proximity Vote
                                                                 │
                                                                 ▼
                                                  [ Open Public Dashboard ]
```

---

## ⚡ API Quick Reference

| Endpoint | Method | Description | Access |
| :--- | :--- | :--- | :--- |
| `/api/v1/complaints/report` | `POST` | Submit report with GPS & image (runs 50m spatial merge) | Citizen |
| `/api/v1/complaints/incidents` | `GET` | List active incidents sorted strictly by Priority Score $P$ | Public |
| `/api/v1/complaints/incidents/{id}/resolve` | `POST` | Upload "After" photo & run Computer Vision audit | Official |
| `/api/v1/complaints/incidents/{id}/download-rfp` | `GET` | Download contractor PDF Repair RFP Tender | Official |
| `/api/v1/complaints/crew-route-optimize` | `POST` | Solve VRP multi-stop crew dispatch route | Official |
| `/api/v1/complaints/incidents/{id}/vote-proximity` | `POST` | Proximity-weighted YES/NO vote on repair proof | Citizen |
| `/api/v1/complaints/public-transparency` | `GET` | Public ward analytics & $P$ leaderboard | Public |

---

## 🚀 Local Development Setup

### 1. Backend Service (FastAPI)
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start backend dev server
python -m uvicorn backend.app.main:app --reload --port 8000
```

### 2. Frontend Application (React Vite)
```bash
cd frontend
npm install
npm run dev
```

### 🌐 Application Portals
* **Public Transparency Dashboard**: [http://localhost:5173/public](http://localhost:5173/public)
* **Citizen Reporting Portal**: [http://localhost:5173/citizen](http://localhost:5173/citizen)
* **Municipal Command Center**: [http://localhost:5173/gov/dashboard](http://localhost:5173/gov/dashboard)
* **Interactive OpenAPI Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📜 License
Released under the [MIT License](LICENSE). Built for modern municipal transparency and governance.
