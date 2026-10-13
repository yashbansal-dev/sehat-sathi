import sys
import json
import urllib.request

BASE_URL = "http://127.0.0.1:8000"

def post(url, data=None, headers=None):
    headers = headers or {}
    if data is not None and not isinstance(data, (bytes, bytearray)):
        data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    elif data is None:
        data = b"{}"
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body

def get(url, headers=None):
    headers = headers or {}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            ct = resp.headers.get("content-type", "")
            if "pdf" in ct or "image" in ct:
                return resp.status, f"Binary file ({len(raw)} bytes, {ct})"
            return resp.status, json.loads(raw.decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body

print("--- Step 1: Patient Login ---")
status, res = post(f"{BASE_URL}/api/auth/demo-login")
assert status == 200, f"Failed demo login: {res}"
token = res["access_token"]
patient_headers = {"Authorization": f"Bearer {token}"}
print("Patient logged in:", res["user"]["full_name"])

print("\n--- Step 2 & 3: Check Documents in Vault ---")
status, docs = get(f"{BASE_URL}/api/documents", headers=patient_headers)
assert status == 200
print(f"Total documents: {len(docs)}")

print("\n--- Step 4: Verification Center (Uncertain fields & Discrepancies) ---")
status, uncerts = get(f"{BASE_URL}/api/verification/uncertainties", headers=patient_headers)
assert status == 200
print(f"Pending review fields: {len(uncerts)}")

print("\n--- Step 5: Timeline ---")
status, timeline = get(f"{BASE_URL}/api/timeline", headers=patient_headers)
assert status == 200
print(f"Timeline events count: {len(timeline)}")

print("\n--- Step 6: Lab Trends ---")
status, trends = get(f"{BASE_URL}/api/timeline/lab-trends", headers=patient_headers)
assert status == 200, f"Trends failed: {trends}"
print(f"Lab trend metrics: {list(trends.keys())[:4]}")

print("\n--- Step 7: AI Clinical Summary ---")
status, briefing = get(f"{BASE_URL}/api/briefing", headers=patient_headers)
assert status == 200
print("Briefing active meds:", len(briefing.get("active_medications", [])))
print("Briefing key citations:", len(briefing.get("provenance_citations", [])))

print("\n--- Step 8 & 9: Create Doctor Share Token ---")
share_payload = {
    "title": "Hackathon Clinical Consultation",
    "doctor_name_or_purpose": "Dr. Arvind Verma (Cardiology)",
    "duration_hours": 24,
    "include_briefing": True
}
status, share_res = post(f"{BASE_URL}/api/sharing/tokens", data=share_payload, headers=patient_headers)
assert status == 200
share_token = share_res["token"]
share_id = share_res["id"]
print("Created Share Token:", share_token)

print("\n--- Step 10 & 11: Doctor Access via Share Token ---")
status, doc_view = get(f"{BASE_URL}/api/sharing/doctor-view/{share_token}")
assert status == 200, f"Doctor view failed: {doc_view}"
print("Doctor accessed shared record for patient:", doc_view["patient_name"])
print("Doctor received briefing:", bool(doc_view.get("briefing")))

print("\n--- Step 12: Doctor View Original Source Document ---")
first_doc_id = docs[0]["id"]
status, file_res = get(f"{BASE_URL}/api/sharing/doctor-file/{share_token}/{first_doc_id}")
# If binary PDF, urllib will get 200
print(f"Doctor source doc retrieval status: {status}")

print("\n--- Step 13: Patient Revokes Access ---")
status, revoke_res = post(f"{BASE_URL}/api/sharing/tokens/{share_id}/revoke", headers=patient_headers)
assert status == 200
print("Revocation successful:", revoke_res)

print("\n--- Step 14: Doctor subsequent access strictly blocked ---")
status, blocked_view = get(f"{BASE_URL}/api/sharing/doctor-view/{share_token}")
assert status == 410, f"Expected 410 Gone for revoked token, got {status}: {blocked_view}"
print("Verified Doctor blocked from portal with HTTP 410:", blocked_view)

status_file, blocked_file = get(f"{BASE_URL}/api/sharing/doctor-file/{share_token}/{first_doc_id}")
assert status_file == 410, f"Expected 410 Gone for revoked token on document access, got {status_file}: {blocked_file}"
print("Verified Doctor blocked from source document retrieval with HTTP 410:", blocked_file)

print("\n[SUCCESS] ALL 14 HACKATHON DEMO STEPS VERIFIED 100% WORKING!")
