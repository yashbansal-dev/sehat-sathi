import os
import sys
import io
import time
import httpx
from PIL import Image

BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5173"

def run_deep_check():
    results = []
    print("=" * 65)
    print("  SEHAT SATHI AI — COMPREHENSIVE FULL-SYSTEM DIAGNOSTIC SUITE")
    print("=" * 65)

    client = httpx.Client(timeout=15.0)

    # -------------------------------------------------------------
    # 1. Health & Server Status
    # -------------------------------------------------------------
    try:
        r = client.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("database") == "connected"
        results.append(("1. Backend Health Check", "PASS", f"Status 200, DB: {data.get('database')}"))
    except Exception as e:
        results.append(("1. Backend Health Check", "FAIL", str(e)))

    # Frontend Check
    try:
        r = client.get(FRONTEND_URL)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert "<div id=\"root\">" in r.text or "vite" in r.text.lower()
        results.append(("2. Frontend Vite Dev Server", "PASS", "Status 200, Serving SPA"))
    except Exception as e:
        results.append(("2. Frontend Vite Dev Server", "FAIL", str(e)))

    # -------------------------------------------------------------
    # 2. Authentication & Dual Role Verification
    # -------------------------------------------------------------
    patient_token = None
    doctor_token = None
    try:
        r = client.post(f"{BASE_URL}/api/auth/demo-login")
        assert r.status_code == 200
        p_data = r.json()
        patient_token = p_data["access_token"]
        assert "Rajesh Sharma" in p_data["user"]["full_name"]
        results.append(("3. Demo Patient Login", "PASS", f"Logged in as {p_data['user']['full_name']} (Role: {p_data['user']['role']})"))
    except Exception as e:
        results.append(("3. Demo Patient Login", "FAIL", str(e)))

    try:
        r = client.post(f"{BASE_URL}/api/auth/demo-doctor-login")
        assert r.status_code == 200
        d_data = r.json()
        doctor_token = d_data["access_token"]
        assert "Dr. Arvind Verma" in d_data["user"]["full_name"]
        results.append(("4. Demo Doctor Login", "PASS", f"Logged in as {d_data['user']['full_name']} (Role: {d_data['user']['role']})"))
    except Exception as e:
        results.append(("4. Demo Doctor Login", "FAIL", str(e)))

    # Verify Current User Profile
    if patient_token:
        try:
            r = client.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {patient_token}"})
            assert r.status_code == 200
            user = r.json()
            assert user["full_name"] == "Rajesh Sharma"
            results.append(("5. Patient Auth Profile", "PASS", f"Verified profile for: {user.get('full_name')} ({user.get('email')})"))
        except Exception as e:
            results.append(("5. Patient Auth Profile", "FAIL", str(e)))

    # -------------------------------------------------------------
    # 3. Documents Listing & Preview
    # -------------------------------------------------------------
    sample_doc_id = None
    if patient_token:
        try:
            r = client.get(f"{BASE_URL}/api/documents", headers={"Authorization": f"Bearer {patient_token}"})
            assert r.status_code == 200
            docs = r.json()
            assert len(docs) > 0, "No documents found"
            sample_doc_id = docs[0]["id"]
            results.append(("6. Document List Fetch", "PASS", f"Retrieved {len(docs)} documents successfully"))
        except Exception as e:
            results.append(("6. Document List Fetch", "FAIL", str(e)))

    # Document File Retrieval (Synthetic Fallback)
    try:
        r = client.get(f"{BASE_URL}/api/documents/doc-1/file")
        assert r.status_code == 200
        assert "application/pdf" in r.headers.get("content-type", "")
        results.append(("7. Document PDF Preview (doc-1)", "PASS", f"Returned {len(r.content)} bytes (type: {r.headers.get('content-type')})"))
    except Exception as e:
        results.append(("7. Document PDF Preview (doc-1)", "FAIL", str(e)))

    # -------------------------------------------------------------
    # 4. Image Upload & Inline Preview Check
    # -------------------------------------------------------------
    uploaded_image_id = None
    if patient_token:
        try:
            # Generate test medical scan image
            img = Image.new("RGB", (300, 300), color=(240, 245, 255))
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format="PNG")
            img_bytes = img_byte_arr.getvalue()

            files = {"file": ("diagnostic_xray_test.png", img_bytes, "image/png")}
            data = {"category": "Diagnostic Scan"}
            r = client.post(
                f"{BASE_URL}/api/documents/upload",
                headers={"Authorization": f"Bearer {patient_token}"},
                files=files,
                data=data
            )
            assert r.status_code == 200
            resp = r.json()
            uploaded_image_id = resp["id"]
            results.append(("8. Image Upload (PNG)", "PASS", f"Uploaded successfully as doc ID: {uploaded_image_id}"))

            # Fetch the uploaded image file
            r_file = client.get(f"{BASE_URL}/api/documents/{uploaded_image_id}/file")
            assert r_file.status_code == 200
            assert "image/png" in r_file.headers.get("content-type", "")
            assert len(r_file.content) == len(img_bytes)
            results.append(("9. Image Inline Preview", "PASS", f"Retrieved exact image ({len(r_file.content)} bytes, image/png)"))
        except Exception as e:
            results.append(("8. Image Upload & Preview", "FAIL", str(e)))

    # -------------------------------------------------------------
    # 5. Timeline & Longitudinal Records
    # -------------------------------------------------------------
    if patient_token:
        try:
            r = client.get(f"{BASE_URL}/api/timeline", headers={"Authorization": f"Bearer {patient_token}"})
            assert r.status_code == 200
            timeline_data = r.json()
            events = timeline_data if isinstance(timeline_data, list) else timeline_data.get("events", [])
            assert len(events) > 0, "No timeline events returned"
            results.append(("10. Medical Timeline Engine", "PASS", f"Generated {len(events)} longitudinal health events"))
        except Exception as e:
            results.append(("10. Medical Timeline Engine", "FAIL", str(e)))

    # -------------------------------------------------------------
    # 6. Two-Minute Doctor Briefing Engine
    # -------------------------------------------------------------
    if patient_token:
        try:
            r = client.get(f"{BASE_URL}/api/briefing", headers={"Authorization": f"Bearer {patient_token}"})
            assert r.status_code == 200
            briefing = r.json()
            assert "active_medications" in briefing
            assert "documented_allergies" in briefing or "clinical_narrative" in briefing
            results.append(("11. Two-Minute Doctor Briefing", "PASS", f"Briefing generated with {len(briefing.get('active_medications', []))} active meds"))
        except Exception as e:
            results.append(("11. Two-Minute Doctor Briefing", "FAIL", str(e)))

    # -------------------------------------------------------------
    # 7. Doctor Sharing & Token Access Flow
    # -------------------------------------------------------------
    share_token_str = None
    share_token_id = None
    if patient_token:
        try:
            r = client.post(
                f"{BASE_URL}/api/sharing/tokens",
                headers={"Authorization": f"Bearer {patient_token}"},
                json={
                    "title": "Dr. Verma OPD Consultation",
                    "doctor_name_or_purpose": "Cardiology & General Checkup",
                    "duration_hours": 24,
                    "include_briefing": True
                }
            )
            assert r.status_code == 200
            tok = r.json()
            share_token_str = tok["token"]
            share_token_id = tok["id"]
            results.append(("12. Doctor Share Token Creation", "PASS", f"Created token: {share_token_str[:8]}... (Valid 24h)"))
        except Exception as e:
            results.append(("12. Doctor Share Token Creation", "FAIL", str(e)))

    # Test Doctor Public Portal View via Token
    if share_token_str:
        try:
            r = client.get(f"{BASE_URL}/api/sharing/doctor-view/{share_token_str}")
            assert r.status_code == 200
            shared_data = r.json()
            patient_name = shared_data.get("patient_name") or shared_data.get("patient", {}).get("name")
            assert patient_name == "Rajesh Sharma"
            assert "briefing" in shared_data
            results.append(("13. Doctor Portal Public Access", "PASS", f"Verified shared record for {patient_name}"))
        except Exception as e:
            results.append(("13. Doctor Portal Public Access", "FAIL", str(e)))

    # Test Doctor Viewing Document File via Share Token
    if share_token_str and sample_doc_id:
        try:
            r = client.get(f"{BASE_URL}/api/sharing/doctor-file/{share_token_str}/{sample_doc_id}")
            assert r.status_code == 200
            assert len(r.content) > 0
            results.append(("14. Doctor Shared File Access", "PASS", f"Doctor successfully retrieved file ({len(r.content)} bytes)"))
        except Exception as e:
            results.append(("14. Doctor Shared File Access", "FAIL", str(e)))

    # Test Revoking Token
    if patient_token and share_token_id and share_token_str:
        try:
            r = client.post(
                f"{BASE_URL}/api/sharing/tokens/{share_token_id}/revoke",
                headers={"Authorization": f"Bearer {patient_token}"}
            )
            assert r.status_code == 200
            # Subsequent access should return 410 Gone
            r_revoked = client.get(f"{BASE_URL}/api/sharing/doctor-view/{share_token_str}")
            assert r_revoked.status_code == 410, f"Expected 410 for revoked token, got {r_revoked.status_code}"
            results.append(("15. Token Revocation & Security", "PASS", "Token revoked, subsequent access denied with 410 Gone"))
        except Exception as e:
            results.append(("15. Token Revocation & Security", "FAIL", str(e)))

    # -------------------------------------------------------------
    # 8. Printing Diagnostics Summary
    # -------------------------------------------------------------
    print("\n" + "-" * 65)
    print("  TEST RESULTS SUMMARY:")
    print("-" * 65)
    all_pass = True
    for name, status, detail in results:
        status_color = "\033[92mPASS\033[0m" if status == "PASS" else "\033[91mFAIL\033[0m"
        print(f"[{status}] {name:32} | {detail}")
        if status != "PASS":
            all_pass = False

    print("=" * 65)
    if all_pass:
        print(">>> ALL 15 CRITICAL CORE SYSTEMS PASSED (100% OPERATIONAL) <<<")
    else:
        print(">>> SOME TESTS FAILED! CHECK DETAILS ABOVE <<<")
    print("=" * 65)

if __name__ == "__main__":
    run_deep_check()
