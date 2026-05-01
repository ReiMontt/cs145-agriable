import uvicorn
import os
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from mosip_auth_sdk.models import DemographicsModel
from mosip_auth_sdk import MOSIPAuthenticator
from dynaconf import Dynaconf
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="AgriAble Web Server - Pro Version")

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

# --- MODELS: Machine Communication ---
class ScanRequest(BaseModel):
    uin: str
    name: str
    dob: str
    machine_id: str
    location1: Optional[str] = None
    location3: Optional[str] = None
    zone: Optional[str] = None
    postal_code: Optional[str] = None
    address_line1: Optional[str] = None

class DispenseLog(BaseModel):
    session_id: str
    target_id: str   
    source_id: str   
    changed_kg: float

class CancelSession(BaseModel):
    session_id: str

# --- MODELS: Admin Operations ---
class FarmerRegister(BaseModel):
    national_id: str
    name: str
    quota_kg: float = 10.0

class QuotaUpdate(BaseModel):
    new_quota_kg: float
    reset_remaining: bool = False # If true, fills the remaining quota back to max

# ==========================================
# PUBLIC / MACHINE ENDPOINTS
# ==========================================

@app.get("/api/health")
def home():
    return {"status": "online", "system": "AgriAble"}

@app.post("/api/verify-farmer")
def verify_farmer(req: ScanRequest):
    try:
        # 1. Build Demographics for MOSIP
        demo_args = {"dob": req.dob, "name":[{"language": "eng", "value": req.name}]}
        if req.location1: demo_args["location1"] =[{"language": "eng", "value": req.location1}]
        demo = DemographicsModel(**demo_args)
        
        # 2. Verify MOSIP
        response = authenticator.auth(individual_id=req.uin, individual_id_type="UIN", demographic_data=demo, consent=True)
        res_body = response.json()
        if not res_body.get("response", {}).get("authStatus", False):
            raise HTTPException(status_code=401, detail="MOSIP Identity Mismatch.")

        # 3. Verify RSBSA / Database Existence
        db_res = supabase.table("users").select("*").eq("national_id", req.uin).execute()
        if not db_res.data:
            raise HTTPException(status_code=404, detail="Identity Verified by MOSIP, but farmer is not registered in AgriAble system.")
        
        user_data = db_res.data[0]

        # 4. Check Quota Limits
        if user_data["remaining_quota_kg"] <= 0:
             raise HTTPException(status_code=403, detail="Farmer has exhausted their dispensing quota.")

        # 5. Clear zombie sessions for this machine
        supabase.table("dispense_sessions").update({"status": "expired"})\
            .eq("machine_id", req.machine_id).eq("status", "active").execute()

        # 6. Create New Authorized Session
        session_res = supabase.table("dispense_sessions").insert({
            "national_id": req.uin,
            "machine_id": req.machine_id,
            "status": "active"
        }).execute()
        
        return {
            "status": "success", 
            "user": user_data, 
            "session_id": session_res.data[0]["id"]
        }
    except HTTPException: raise
    except Exception as e:
        print(f"Verify Error: {e}")
        raise HTTPException(status_code=500, detail="Verification system error.")

@app.post("/api/log-transaction")
def log_transaction(req: DispenseLog):
    try:
        # 1. Update session to completed
        supabase.table("dispense_sessions").update({"status": "completed"})\
            .eq("id", req.session_id).execute()

        # 2. Log transaction
        log_res = supabase.table("transactions").insert({
            "session_id": req.session_id,
            "target_id": req.target_id,
            "source_id": req.source_id,
            "changed_kg": req.changed_kg
        }).execute()

        # 3. Deduct from Farmer's Remaining Quota
        user_res = supabase.table("users").select("remaining_quota_kg").eq("national_id", req.target_id).execute()
        if user_res.data:
            current_remaining = float(user_res.data[0]["remaining_quota_kg"])
            new_remaining = max(0.0, current_remaining - req.changed_kg) # Prevent negative quota
            
            supabase.table("users").update({
                "remaining_quota_kg": new_remaining
            }).eq("national_id", req.target_id).execute()

        return {"status": "success", "id": log_res.data[0]['id']}
    except Exception as e:
        print(f"Logging Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to log transaction.")

@app.post("/api/cancel-session")
def cancel_session(req: CancelSession):
    try:
        supabase.table("dispense_sessions").update({"status": "expired"})\
            .eq("id", req.session_id).execute()
        return {"status": "success"}
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to cancel session.")

# ==========================================
# ADMIN & MANAGEMENT ENDPOINTS
# ==========================================

@app.post("/api/admin/farmers")
def register_farmer(req: FarmerRegister):
    """Register a new farmer into the system with an initial quota."""
    # Check if already exists
    existing = supabase.table("users").select("id").eq("national_id", req.national_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Farmer with this National ID already exists.")

    try:
        res = supabase.table("users").insert({
            "national_id": req.national_id,
            "name": req.name,
            "total_quota_kg": req.quota_kg,
            "remaining_quota_kg": req.quota_kg
        }).execute()
        return {"status": "success", "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to register farmer: {str(e)}")

@app.patch("/api/admin/farmers/{national_id}/quota")
def update_farmer_quota(national_id: str, req: QuotaUpdate):
    """Modify the quota of a specific farmer."""
    existing = supabase.table("users").select("*").eq("national_id", national_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Farmer not found.")
    
    update_data = {"total_quota_kg": req.new_quota_kg}
    
    if req.reset_remaining:
        update_data["remaining_quota_kg"] = req.new_quota_kg

    try:
        res = supabase.table("users").update(update_data).eq("national_id", national_id).execute()
        return {"status": "success", "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update quota: {str(e)}")

@app.delete("/api/admin/farmers/{national_id}")
def delete_farmer(national_id: str):
    """Remove a farmer from the system."""
    try:
        res = supabase.table("users").delete().eq("national_id", national_id).execute()
        if not res.data:
             raise HTTPException(status_code=404, detail="Farmer not found.")
        return {"status": "success", "message": "Farmer deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete farmer: {str(e)}")

@app.get("/api/admin/farmers")
def get_farmers():
    """Retrieve all registered farmers and their quota statuses."""
    res = supabase.table("users").select("*").order("created_at", desc=True).execute()
    return {"status": "success", "data": res.data}

# ==========================================
# DASHBOARD & ANALYTICS ENDPOINTS
# ==========================================

@app.get("/api/dashboard-stats")
def get_stats():
    # Sum of all dispenses
    trans_res = supabase.table("transactions").select("changed_kg").execute()
    total_dispensed = sum(item['changed_kg'] for item in trans_res.data)
    
    # Active farmers
    users_res = supabase.table("users").select("id", count="exact").execute()
    total_farmers = users_res.count if users_res.count else 0
    
    # Number of machines (distinct source_ids in transactions)
    # Using python set since Supabase rest API doesn't do native DISTINCT easily
    machines = set(item['source_id'] for item in supabase.table("transactions").select("source_id").execute().data)

    return {
        "total_kg_dispensed": f"{total_dispensed:.2f}", 
        "total_transactions": len(trans_res.data),
        "total_registered_farmers": total_farmers,
        "active_machines": len(machines)
    }

@app.get("/api/recent-logs")
def get_logs():
    res = supabase.table("transactions").select("*").order("timestamp", desc=True).limit(15).execute()
    # Join user names manually
    for log in res.data:
        u_res = supabase.table("users").select("name").eq("national_id", log["target_id"]).execute()
        log["farmer_name"] = u_res.data[0]["name"] if u_res.data else "Unknown"
    return {"status": "success", "data": res.data}

# --- STATIC FRONTEND MOUNTING ---
DIST_DIR = "/app/dist"
if os.path.exists(DIST_DIR):
    app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="frontend")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)