# AgriAble — CS145 Project

AgriAble is a full-stack prototype for **secure fertilizer subsidy distribution**.

It combines:
- **Farmer identity verification** via MOSIP (PhilSys-style flow)
- **Quota tracking and transaction logging** via Supabase
- **Government/admin dashboards** for transparency and auditing
- **WireGuard-based VPN networking** for secure connectivity to protected services

---

## What’s in this repository

- `backend/` — FastAPI server for verification, transaction logging, and dashboard endpoints
- `frontend/` — React + TypeScript + Vite web app (admin, farmer portal, simulator, logs)
- `vpn/` — WireGuard + CoreDNS configuration used by Docker networking
- `docker-compose.yaml` — Multi-service orchestration (`vpn`, `backend`, `frontend`)

---

## Tech stack

### Backend
- Python 3.11
- FastAPI
- Uvicorn
- Supabase Python client
- MOSIP Auth SDK
- Dynaconf

### Frontend
- React 19
- TypeScript
- Vite
- Axios

### Infrastructure
- Docker + Docker Compose
- LinuxServer WireGuard container
- CoreDNS

---

## Architecture at a glance

1. Frontend calls backend APIs on port `8000`
2. Backend verifies farmer identity against MOSIP using demographic match
3. Backend reads/writes quota and transactions in Supabase
4. Backend and frontend run with `network_mode: service:vpn` so traffic shares the VPN network namespace

---

## Prerequisites

Install the following:
- Docker Desktop (macOS)
- Node.js 20+ and npm (for local frontend dev outside Docker)
- Python 3.11+ and pip (for local backend dev outside Docker)

---

## Quick start (recommended: Docker)

From the repository root:

1. Build and start all services with Docker Compose
2. Open the frontend at `http://localhost:5173`
3. Backend health endpoint is at `http://localhost:8000/`

If the stack starts correctly, `/` should return:

`{"message":"AgriAble Server is Online"}`

---

## Local development (without Docker)

### Backend

- Create/activate a Python virtual environment
- Install `backend/requirements.txt`
- Run `backend/server.py` (or run Uvicorn for autoreload)

Server default:
- Host: `0.0.0.0`
- Port: `8000`

### Frontend

- Go to `frontend/`
- Install dependencies
- Start Vite dev server

Frontend default:
- URL: `http://localhost:5173`
- API base in code: `http://localhost:8000`

---

## Backend API reference

### `GET /`
Health/status check.

### `POST /api/verify-farmer`
Verifies identity and returns farmer profile.

Request body:
- `national_id: string`

### `POST /api/log-transaction`
Logs a dispense event and updates remaining quota.

Request body:
- `national_id: string`
- `dispensed_kg: number`

### `GET /api/dashboard-stats`
Returns aggregate dispensed amount and transaction count.

### `GET /api/recent-logs`
Returns recent transaction records (with related farmer data).

---

## Frontend pages

- **Admin Dashboard** — live metrics and activity stream
- **Farmer Portal** — guided verification → weighing → dispensing flow
- **HW Simulator** — simulates ESP32/QR/HX711 workflow
- **RSBSA Registry** — simulated farmer registry view
- **Audit Logs** — traceability and filterable transaction records

---

## Configuration & secrets

This repo currently contains hardcoded credentials/config values in code/config files for development convenience.

Important files to review:
- `backend/server.py`
- `backend/config.toml`
- `vpn/wg_confs/wg0.conf`

For safer setup:
1. Move secrets into environment variables (`.env`)
2. Do **not** commit real credentials or private keys
3. Rotate any exposed keys before sharing/deploying

---

## Troubleshooting

- **Frontend cannot reach backend**
	- Confirm backend is up on `:8000`
	- Check Docker logs for `backend` and `vpn`

- **MOSIP auth failures**
	- Verify `backend/config.toml` values and certificates (`.pem`, `.p12`)
	- Ensure VPN path to MOSIP endpoint is reachable

- **No transaction updates in dashboard**
	- Verify Supabase URL/key and table schema
	- Check backend logs for query/update errors

- **Port conflicts**
	- Ensure `8000` and `5173` are free on host

---

## Project status

This is an academic/prototype implementation for CS145. It demonstrates architecture and core flows, and is not production-hardened yet.