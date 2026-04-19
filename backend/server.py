import uvicorn
import traceback
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from mosip_auth_sdk.models import DemographicsModel
from mosip_auth_sdk import MOSIPAuthenticator
from dynaconf import Dynaconf

app = FastAPI(title="AgriAble Web Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGS ---
SUPABASE_URL = "https://ptlsehqsupagemvfzipz.supabase.co"
SUPABASE_KEY = "sb_secret_Dmh_zR76mqZXT-thfhr_fw_kZkyDJo7"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

config = Dynaconf(settings_files=["./config.toml"], environments=False)
authenticator = MOSIPAuthenticator(config=config)

# --- MODELS ---
class ScanRequest(BaseModel):
    uin: str
    name: str
    dob: str
    location1: Optional[str] = None
    location3: Optional[str] = None
    zone: Optional[str] = None
    postal_code: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    address_line3: Optional[str] = None

class DispenseLog(BaseModel):
    target_id: str   
    source_id: str   
    changed_kg: float

@app.get("/api/health")
def home():
    return {"status": "online", "system": "AgriAble"}

@app.post("/api/verify-farmer")
def verify_farmer(req: ScanRequest):
    try:
        # Build Demographics
        demo_args = {"dob": req.dob, "name": [{"language": "eng", "value": req.name}]}
        if req.location1: demo_args["location1"] = [{"language": "eng", "value": req.location1}]
        if req.location3: demo_args["location3"] = [{"language": "eng", "value": req.location3}]
        if req.zone: demo_args["zone"] = [{"language": "eng", "value": req.zone}]
        if req.postal_code: demo_args["postal_code"] = req.postal_code
        if req.address_line1: demo_args["address_line1"] = [{"language": "eng", "value": req.address_line1}]
        if req.address_line2: demo_args["address_line2"] = [{"language": "eng", "value": req.address_line2}]
        if req.address_line3: demo_args["address_line3"] = [{"language": "eng", "value": req.address_line3}]

        demo = DemographicsModel(**demo_args)
        
        # Verify MOSIP
        response = authenticator.auth(individual_id=req.uin, individual_id_type="UIN", demographic_data=demo, consent=True)
        res_body = response.json()
        
        if not res_body.get("response", {}).get("authStatus", False):
            raise HTTPException(status_code=401, detail="MOSIP Identity Mismatch.")

        # Verify RSBSA
        db_res = supabase.table("users").select("*").eq("national_id", req.uin).execute()
        if not db_res.data:
            raise HTTPException(status_code=404, detail="Identity Verified by MOSIP, but not in RSBSA.")
        
        return {"status": "success", "user": db_res.data[0]}
    except HTTPException: raise
    except Exception:
        raise HTTPException(status_code=500, detail="Verification system error.")

@app.post("/api/log-transaction")
def log_transaction(req: DispenseLog):
    try:
        log_res = supabase.table("transactions").insert({
            "target_id": req.target_id,
            "source_id": req.source_id,
            "changed_kg": req.changed_kg
        }).execute()
        return {"status": "success", "id": log_res.data[0]['id'], "timestamp": log_res.data[0]['timestamp']}
    except Exception as e:
        print(f"Logging Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to log.")

@app.get("/api/dashboard-stats")
def get_stats():
    res = supabase.table("transactions").select("changed_kg").execute()
    total = sum(item['changed_kg'] for item in res.data)
    return {"total_kg": f"{total:.2f}", "count": len(res.data)}

@app.get("/api/recent-logs")
def get_logs():
    # Fetch logs
    res = supabase.table("transactions").select("*").order("timestamp", desc=True).limit(10).execute()
    # Manual Join to prevent schema cache errors
    for log in res.data:
        u_res = supabase.table("users").select("name").eq("national_id", log["target_id"]).execute()
        log["users"] = {"name": u_res.data[0]["name"]} if u_res.data else {"name": "Unknown"}
    return res.data

@app.get("/api/farmers")
def get_farmers():
    res = supabase.table("users").select("*").execute()
    return res.data

import os
from fastapi.staticfiles import StaticFiles
DIST_DIR = "/app/dist"
if os.path.exists(DIST_DIR):
    app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="frontend")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)