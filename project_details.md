# VSSC LaTeX Analytics — Project Details

## Overview

LaTeX Analytics is a single-page analytics dashboard for monitoring the VSSC collaborative LaTeX platform. It provides visibility into user activity, project statistics, content distribution, and infrastructure status.

---

## Architecture

```
Frontend (HTML/CSS/JS)
    │
    ├── Tries backend API endpoints first
    │       (when the real backend is running)
    │
    └── Falls back to static JSON files
            (frontend/static/data/*.json)
```

**No backend code is modified.** The frontend is completely self-contained.

- When served standalone (via `python -m http.server`): loads static JSON from `static/data/`
- When the real backend is running: calls API endpoints, uses live data

---

## Directory Structure

```
LatexDash/
├── instructions.md                 # How to run (Windows + RHEL)
├── project_details.md              # This file
│
├── backend/                        # *** COMPLETELY UNTOUCHED ***
│   ├── app.py                      # Production Flask app
│   ├── config.py                   # DB connection strings
│   ├── db/
│   │   ├── mongo.py                # MongoDB client
│   │   ├── mysql.py                # MySQL connector
│   │   └── redis.py                # Redis client
│   ├── routes/
│   │   ├── __init__.py             # Blueprint registration
│   │   ├── analytics.py            # /usage-stats/analytics/*
│   │   ├── user_stats.py           # /usage-stats/users/*
│   │   ├── project_stats.py        # /usage-stats/projects/*
│   │   ├── content_stats.py        # /usage-stats/content/*
│   │   └── collaboration_stats.py  # /usage-stats/collaboration/*
│   ├── services/
│   │   ├── overview_service.py
│   │   ├── user_analytics_service.py
│   │   ├── project_analytics_service.py
│   │   ├── content_service.py
│   │   ├── collaboration_service.py
│   │   └── session_service.py
│   ├── utils/
│   │   └── aggregation.py
│   └── packages/                   # Python virtual environment
│
├── frontend/                       # *** ALL CHANGES ARE HERE ***
│   ├── index.html                  # Single-page dashboard
│   ├── assets/
│   │   └── isrologo.svg            # ISRO logo (original)
│   └── static/
│       ├── style.css               # All styles
│       ├── app.js                  # All application logic
│       ├── assets/
│       │   └── isrologo.svg        # ISRO logo (served by static server)
│       └── data/                   # Dummy JSON data (fallback)
│           ├── overview.json
│           ├── user_summary.json
│           ├── user_activity.json
│           ├── user_growth_day.json
│           ├── user_growth_week.json
│           ├── user_growth_month.json
│           ├── user_growth_year.json
│           ├── login_stats.json
│           ├── user_list.json
│           ├── project_summary.json
│           ├── project_activity.json
│           ├── project_growth_day.json
│           ├── project_growth_week.json
│           ├── project_growth_month.json
│           ├── project_growth_year.json
│           ├── content_summary.json
│           ├── file_types.json
│           └── collaboration_distribution.json
│
└── API Endpoints Latex POC/        # Screenshots of live API responses
    └── API Endpoints Latex POC/
        └── *.png
```

---

## How Data Loading Works

The frontend JavaScript (`app.js`) uses a two-tier strategy:

1. **Primary**: Fetch from the backend API endpoint (e.g., `/usage-stats/users/summary`)
2. **Fallback**: If the API call fails (backend not running), load the equivalent static JSON file from `static/data/` (e.g., `static/data/user_summary.json`)

This means:
- **No backend needed** to view the dashboard with dummy data
- **When the backend is running**, live data is used automatically
- **Zero frontend changes** required when switching between modes

---

## API Endpoints Used

The frontend calls **ALL 5 backend blueprints** (12 endpoints total):

### 1. Analytics (`/usage-stats/analytics/`)

| Endpoint | Fallback JSON | Description |
|----------|---------------|-------------|
| `/usage-stats/analytics/overview` | `overview.json` | Platform-wide KPIs |

### 2. Users (`/usage-stats/users/`)

| Endpoint | Params | Fallback JSON | Description |
|----------|--------|---------------|-------------|
| `/users/summary` | — | `user_summary.json` | Total, admin, never-logged-in |
| `/users/activity` | — | `user_activity.json` | Active counts (7d/30d/90d) |
| `/users/growth` | `frequency` (day/week/month/year) | `user_growth_{freq}.json` | Registration time-series |
| `/users/login-stats` | — | `login_stats.json` | Avg and max login counts |
| `/users/list` | — | `user_list.json` | Full user directory |

### 3. Projects (`/usage-stats/projects/`)

| Endpoint | Params | Fallback JSON | Description |
|----------|--------|---------------|-------------|
| `/projects/summary` | — | `project_summary.json` | Total, public, private |
| `/projects/activity` | — | `project_activity.json` | Updated/opened counts |
| `/projects/growth` | `frequency` (day/week/month/year) | `project_growth_{freq}.json` | Creation time-series |

### 4. Content (`/usage-stats/content/`)

| Endpoint | Fallback JSON | Description |
|----------|---------------|-------------|
| `/content/summary` | `content_summary.json` | Document and file counts |
| `/content/fileTypes` | `file_types.json` | File extension distribution |

### 5. Collaboration (`/usage-stats/collaboration/`)

| Endpoint | Fallback JSON | Description |
|----------|---------------|-------------|
| `/collaboration/distribution` | `collaboration_distribution.json` | Projects by collaborator count |

---

## Growth Endpoint Frequency Parameter

The `/growth` endpoints for both users and projects accept a `frequency` query parameter:

| Value | Backend Date Format | Example Output |
|-------|-------------------|----------------|
| `day` | `%Y-%m-%d` | `"2026-06-09"` |
| `week` | `%Y-%U` | `"2026-23"` |
| `month` | `%Y-%m` | `"2026-06"` |
| `year` | defaults to `%Y-%m` | `"2026-06"` (same as month — backend has no explicit year mapping) |

The dashboard provides Day / Week / Month / Year filter buttons for both growth charts.

---

## Infrastructure Section — Important Note

**The Infrastructure section is purely hardcoded display text.** It shows:

- **MongoDB**: `mongo (sharelatex)` — from `backend/config.py` MONGO_URI
- **Redis**: `redis:6379` — from `backend/config.py` REDIS_HOST/PORT
- **MySQL**: `10.41.26.33 / emp_details` — from `backend/config.py` MYSQL_HOST/DATABASE

These are **NOT live connectivity checks**. The values are statically written in `app.js` based on what `backend/config.py` contains. There is no API endpoint for infrastructure status.

### Why all three are shown:

- **MongoDB** (`sharelatex` database): Stores users, projects, documents, file references, collaborators. This is the primary data store.
- **Redis** (`sess:*` keys): Manages active sessions. The `/analytics/overview` endpoint reads Redis to count logged-in users and active sessions.
- **MySQL** (`emp_details.employeeDetails` table): Stores employee records (name, designation, division, section, staff code). The `/users/list` endpoint joins MongoDB user data with MySQL employee records to show the full user directory.

---

## Data Source Mapping

| Dashboard Section | JSON File | Backend Source (Production) |
|---|---|---|
| Overview KPIs | `overview.json` | MongoDB users + projects + Redis sessions |
| User Summary | `user_summary.json` | MongoDB users |
| User Activity | `user_activity.json` | MongoDB users.lastActive |
| User Growth | `user_growth_*.json` | MongoDB users.signUpDate |
| Login Stats | `login_stats.json` | MongoDB users.loginCount |
| User Directory | `user_list.json` | MongoDB users + MySQL employeeDetails |
| Project Summary | `project_summary.json` | MongoDB projects.publicAccessLevel |
| Project Activity | `project_activity.json` | MongoDB projects.lastUpdated/lastOpened |
| Project Growth | `project_growth_*.json` | MongoDB projects._id (ObjectId timestamp) |
| Content Summary | `content_summary.json` | MongoDB projects.rootFolder |
| File Types | `file_types.json` | MongoDB projects.rootFolder.fileRefs |
| Collaboration | `collaboration_distribution.json` | MongoDB projects.collaberator_refs |
| Infrastructure | (hardcoded in app.js) | Values from backend/config.py |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Charts | Chart.js 4.4.7 (CDN) |
| Fonts | Inter, Crimson Text, JetBrains Mono (Google Fonts CDN) |
| Static Server | Python `http.server` (no dependencies) |
| Backend (when used) | Flask + MongoDB + Redis + MySQL |
