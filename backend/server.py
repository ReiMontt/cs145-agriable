import uvicorn
import traceback
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

# --- CREDENTIALS ---
SUPABASE_URL = "https://ptlsehqsupagemvfzipz.supabase.co"
SUPABASE_KEY = "sb_secret_Dmh_zR76mqZXT-thfhr_fw_kZkyDJo7"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

config = Dynaconf(settings_files=["./config.toml"], environments=False)
authenticator = MOSIPAuthenticator(config=config)

class ScanRequest(BaseModel):
    national_id: str

class DispenseLog(BaseModel):
    national_id: str
    dispensed_kg: float

@app.get("/")
def home():
    return {"message": "AgriAble Server is Online"}

@app.post("/api/verify-farmer")
def verify_farmer(req: ScanRequest):
    print(f"\n--- Processing Verification for ID: {req.national_id} ---")
    
    # 1. Fetch from Supabase
    try:
        db_res = supabase.table("rsbsa_farmers").select("*").eq("national_id", req.national_id).execute()
        if not db_res.data:
            print("Error: ID not in Supabase")
            raise HTTPException(status_code=404, detail="ID not found in RSBSA Database")
        
        farmer_data = db_res.data[0]
        farmer_name = farmer_data["name"]
        print(f"Database Match: {farmer_name}")
    except Exception as e:
        print(f"Supabase Error: {e}")
        raise HTTPException(status_code=500, detail="Database Error")

    # 2. Verify with MOSIP
    try:
        print("Sending Request to MOSIP Testbed...")
        demographics_data = DemographicsModel(
            name=[{"language": "eng", "value": farmer_name}]
        )
        
        response = authenticator.auth(
            individual_id=req.national_id,
            individual_id_type="UIN",
            demographic_data=demographics_data,
            consent=True
        )
        
        response_body = response.json()
        print(f"MOSIP Raw Response: {response_body}")

        if "errors" in response_body and response_body["errors"]:
            error_msg = response_body["errors"][0].get("errorMessage", "Unknown Error")
            raise HTTPException(status_code=401, detail=f"MOSIP Error: {error_msg}")
            
        auth_status = response_body.get("response", {}).get("authStatus", False)
        if not auth_status:
            raise HTTPException(status_code=401, detail="Auth Failed: Name mismatch")
        
        print("Verification Successful!")
        return {"status": "success", "verified": True, "data": farmer_data}
        
    except Exception as e:
        print("\n!!! MOSIP AUTHENTICATION CRASHED !!!")
        traceback.print_exc() # This prints the REAL error to your terminal
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/log-transaction")
def log_transaction(req: DispenseLog):
    try:
        res = supabase.table("rsbsa_farmers").select("quota_kg").eq("national_id", req.national_id).execute()
        new_quota = max(0, res.data[0]['quota_kg'] - req.dispensed_kg)
        supabase.table("rsbsa_farmers").update({"quota_kg": new_quota}).eq("national_id", req.national_id).execute()
        supabase.table("transactions").insert({"national_id": req.national_id, "dispensed_kg": req.dispensed_kg}).execute()
        return {"status": "success", "new_quota": new_quota}
    except Exception as e:
        print(f"Log Transaction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard-stats")
def get_stats():
    res = supabase.table("transactions").select("dispensed_kg").execute()
    total = sum(item['dispensed_kg'] for item in res.data)
    return {"total_kg": f"{total:.2f}", "count": len(res.data)}

@app.get("/api/recent-logs")
def get_logs():
    res = supabase.table("transactions").select("*, rsbsa_farmers(name)").order("timestamp", desc=True).limit(10).execute()
    return res.data

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)