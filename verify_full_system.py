import httpx
import sys

def verify_system():
    print("==================================================")
    print("   SEHAT SATHI - FULL SYSTEM END-TO-END AUDIT     ")
    print("==================================================")
    
    # 1. Frontend Check
    print("\n[1/7] Testing Frontend Dev Server...")
    try:
        fe_resp = httpx.get("http://localhost:5173", timeout=5.0)
        assert fe_resp.status_code == 200, f"Frontend returned status {fe_resp.status_code}"
        assert "<div id=\"root\"></div>" in fe_resp.text, "Root element missing in index.html"
        print("  -> Frontend running on http://localhost:5173 [HTTP 200 OK]")
    except Exception as e:
        print(f"  FAILED: Frontend error: {e}")
        sys.exit(1)

    # 2. Backend Health Check
    print("\n[2/7] Testing Backend Health Endpoint...")
    try:
        health_resp = httpx.get("http://localhost:8000/api/health", timeout=5.0)
        assert health_resp.status_code == 200, f"Health returned {health_resp.status_code}"
        health_data = health_resp.json()
        assert health_data["status"] == "healthy"
        print(f"  -> Backend running on http://localhost:8000/api/health [HTTP 200 OK]")
        print(f"     App: {health_data['app']}, Database: {health_data['database']}")
    except Exception as e:
        print(f"  FAILED: Backend health error: {e}")
        sys.exit(1)

    # 3. Patient Authentication
    print("\n[3/7] Testing Patient Demo Login...")
    try:
        login_resp = httpx.post("http://localhost:8000/api/auth/demo-login", timeout=5.0)
        assert login_resp.status_code == 200, f"Login returned {login_resp.status_code}"
        login_data = login_resp.json()
        token = login_data["access_token"]
        user_name = login_data["user"]["full_name"]
        print(f"  -> Logged in as: {user_name} [HTTP 200 OK]")
        print(f"     Role: {login_data['user']['role']}, Token: {token[:16]}...")
    except Exception as e:
        print(f"  FAILED: Patient login error: {e}")
        sys.exit(1)

    headers = {"Authorization": f"Bearer {token}"}

    # 4. Patient Living Timeline & Medications
    print("\n[4/7] Testing Living Timeline & Clinical Events...")
    try:
        tl_resp = httpx.get("http://localhost:8000/api/timeline", headers=headers, timeout=5.0)
        assert tl_resp.status_code == 200
        tl_events = tl_resp.json()
        print(f"  -> Retrieved {len(tl_events)} unified chronological health events")
        meds = [e["medications"] for e in tl_events if e.get("medications")]
        flat_meds = [m for sub in meds for m in sub]
        print(f"     Prescriptions verified in record: {len(flat_meds)} (e.g. {flat_meds[:3]})")
    except Exception as e:
        print(f"  FAILED: Timeline retrieval error: {e}")
        sys.exit(1)

    # 5. Biomarker Trends & Lab Comparisons
    print("\n[5/7] Testing Longitudinal Lab Trends...")
    try:
        trends_resp = httpx.get("http://localhost:8000/api/timeline/lab-trends", headers=headers, timeout=5.0)
        assert trends_resp.status_code == 200, f"Trends returned status {trends_resp.status_code}"
        trends_dict = trends_resp.json()
        print(f"  -> Longitudinal biomarker categories returned: {len(trends_dict)}")
        print(f"     Biomarker tests tracked: {', '.join(list(trends_dict.keys())[:4])}")
        
        # Check if HbA1c exists
        for test_name, readings in trends_dict.items():
            if "hba1c" in test_name.lower() or "glucose" in test_name.lower():
                print(f"     Biomarker [{test_name}]: {len(readings)} historical readings found")
                break
    except Exception as e:
        print(f"  FAILED: Lab trends error: {e}")
        sys.exit(1)

    # 6. Two-Minute Doctor Brief Generation
    print("\n[6/7] Testing Doctor Briefing Engine (Clinical Summary & Allergies)...")
    try:
        brief_resp = httpx.get("http://localhost:8000/api/briefing", headers=headers, timeout=5.0)
        assert brief_resp.status_code == 200, f"Brief returned {brief_resp.status_code}: {brief_resp.text}"
        brief_data = brief_resp.json()
        print(f"  -> Generated 2-Minute Doctor Brief for: {brief_data.get('patient_name', 'Patient')}")
        print(f"     Identified Allergies: {', '.join(brief_data.get('allergies', []))}")
        print(f"     Red Flags: {len(brief_data.get('red_flags', []))} flagged")
        print(f"     Clinical Summary: {brief_data.get('quick_summary', '')[:80]}...")
    except Exception as e:
        print(f"  FAILED: Doctor briefing error: {e}")
        sys.exit(1)

    # 7. Doctor Portal Share Token & Clinician Access
    print("\n[7/7] Testing Doctor Portal Token Generation & Clinician View...")
    try:
        share_resp = httpx.post(
            "http://localhost:8000/api/sharing/tokens",
            headers=headers,
            json={
                "doctor_name_or_purpose": "Emergency ER Consult",
                "duration_hours": 48,
                "include_briefing": True
            },
            timeout=5.0
        )
        assert share_resp.status_code in (200, 201), f"Share token returned {share_resp.status_code}"
        share_data = share_resp.json()
        share_token = share_data["token"]
        print(f"  -> Secure token created: {share_token} (expires: {share_data['expires_at'][:10]})")
        
        # Access doctor portal with token (unauthenticated clinician view)
        portal_resp = httpx.get(f"http://localhost:8000/api/sharing/doctor-view/{share_token}", timeout=5.0)
        assert portal_resp.status_code == 200, f"Doctor view returned {portal_resp.status_code}"
        portal_data = portal_resp.json()
        print(f"  -> Clinician Portal accessed with token: [HTTP 200 OK]")
        print(f"     Patient in ER workstation: {portal_data.get('patient_name')}")
        print(f"     Access link: http://localhost:5173/doctor-portal/{share_token}")
    except Exception as e:
        print(f"  FAILED: Doctor share error: {e}")
        sys.exit(1)

    print("\n==================================================")
    print("   ALL 7 SYSTEM SUBSYSTEMS PASSED WITH 100% SUCCESS!")
    print("==================================================")

if __name__ == "__main__":
    verify_system()
