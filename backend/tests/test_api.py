import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_demo_login():
    response = client.post("/api/auth/demo-login")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["full_name"] == "Rajesh Sharma"
    assert data["user"]["email"] == "patient.demo@sehatsathi.ai"
    return data["access_token"]

def test_timeline_and_stats():
    # Login as demo user
    login_resp = client.post("/api/auth/demo-login")
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test stats
    stats_resp = client.get("/api/timeline/stats", headers=headers)
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_documents"] >= 4
    assert stats["total_timeline_events"] >= 4
    assert stats["active_medications"] >= 3

    # Test timeline listing
    timeline_resp = client.get("/api/timeline", headers=headers)
    assert timeline_resp.status_code == 200
    events = timeline_resp.json()
    assert len(events) >= 4
    assert any(e["event_type"] == "Prescription" for e in events)

def test_two_minute_doctor_brief():
    login_resp = client.post("/api/auth/demo-login")
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    brief_resp = client.get("/api/briefing", headers=headers)
    assert brief_resp.status_code == 200
    brief = brief_resp.json()
    assert brief["patient_info"]["name"] == "Rajesh Sharma"
    assert len(brief["active_medications"]) >= 3
    assert len(brief["recent_lab_results"]) >= 5
    assert len(brief["questions_for_clinician"]) > 0
    # Verify source traceability is present
    for med in brief["active_medications"]:
        assert med["source_document_name"] is not None

def test_verification_center():
    login_resp = client.post("/api/auth/demo-login")
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch uncertainties
    unc_resp = client.get("/api/verification/uncertainties", headers=headers)
    assert unc_resp.status_code == 200
    uncertainties = unc_resp.json()
    
    if len(uncertainties) == 0:
        # Create a test uncertainty if all were previously resolved
        from app.database import SessionLocal
        from app.models.all_models import UncertaintyRecord, User, MedicalDocument
        import uuid
        db = SessionLocal()
        user = db.query(User).filter(User.email == "patient.demo@sehatsathi.ai").first()
        doc = db.query(MedicalDocument).filter(MedicalDocument.user_id == user.id).first()
        u = UncertaintyRecord(
            id=str(uuid.uuid4()),
            user_id=user.id,
            document_id=doc.id if doc else "synthetic-doc-id",
            entity_type="medication",
            field_name="duration",
            detected_value="~14 days?",
            reason="Ambiguous handwriting on prescription slip",
            suggested_options=["7 days", "14 days", "30 days"],
            resolved=False
        )
        db.add(u)
        db.commit()
        db.close()
        unc_resp = client.get("/api/verification/uncertainties", headers=headers)
        uncertainties = unc_resp.json()

    assert len(uncertainties) > 0
    target = uncertainties[0]

    # Resolve it
    res_resp = client.post(
        f"/api/verification/resolve/{target['id']}",
        headers=headers,
        json={"resolved_value": "14 days"}
    )
    assert res_resp.status_code == 200

    # Also test manual field correction and audit history preservation
    from app.database import SessionLocal
    from app.models.all_models import MedicationRecord, User
    db = SessionLocal()
    user = db.query(User).filter(User.email == "patient.demo@sehatsathi.ai").first()
    med = db.query(MedicationRecord).filter(MedicationRecord.user_id == user.id).first()
    db.close()

    corr_resp = client.post(
        "/api/verification/correct",
        headers=headers,
        json={
            "entity_type": "medication",
            "entity_id": med.id,
            "field_name": "dosage",
            "old_value": med.dosage or "500mg",
            "new_value": "1000mg",
            "reason": "Confirmed dose titration by Dr. Ananya Verma"
        }
    )
    assert corr_resp.status_code == 200

    # Test audit history endpoint
    hist_resp = client.get("/api/verification/history", headers=headers)
    assert hist_resp.status_code == 200
    assert len(hist_resp.json()) > 0

def test_doctor_share_flow():
    login_resp = client.post("/api/auth/demo-login")
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create share link
    share_req = {
        "title": "Cardiology Consultation Share",
        "doctor_name_or_purpose": "Dr. Verma OPD",
        "duration_hours": 48,
        "include_briefing": True
    }
    share_resp = client.post("/api/sharing/tokens", headers=headers, json=share_req)
    assert share_resp.status_code == 200
    share_data = share_resp.json()
    share_token = share_data["token"]
    token_id = share_data["id"]

    # Public doctor view without user authorization header (uses token in URL)
    doc_resp = client.get(f"/api/sharing/doctor-view/{share_token}")
    assert doc_resp.status_code == 200
    doc_portal_data = doc_resp.json()
    assert doc_portal_data["token_valid"] is True
    assert doc_portal_data["patient_name"] == "Rajesh Sharma"
    assert doc_portal_data["briefing"] is not None

    # Revoke share token
    revoke_resp = client.post(f"/api/sharing/tokens/{token_id}/revoke", headers=headers)
    assert revoke_resp.status_code == 200

    # Doctor access should now be forbidden / revoked (410 Gone)
    revoked_doc_resp = client.get(f"/api/sharing/doctor-view/{share_token}")
    assert revoked_doc_resp.status_code == 410

def test_doctor_demo_login_and_role_isolation():
    # Patient login gives role == 'patient'
    patient_res = client.post("/api/auth/demo-login")
    assert patient_res.status_code == 200
    p_data = patient_res.json()
    assert p_data["user"]["role"] == "patient"
    assert p_data["user"]["full_name"] == "Rajesh Sharma"

    # Doctor login gives role == 'doctor'
    doctor_res = client.post("/api/auth/demo-doctor-login")
    assert doctor_res.status_code == 200
    d_data = doctor_res.json()
    assert d_data["user"]["role"] == "doctor"
    assert "Dr. Arvind Verma" in d_data["user"]["full_name"]

    # Verify doctor token has access to clinical brief
    doc_token = d_data["access_token"]
    brief_res = client.get("/api/briefing", headers={"Authorization": f"Bearer {doc_token}"})
    assert brief_res.status_code == 200
    assert brief_res.json()["patient_info"]["name"] == "Rajesh Sharma"

def test_firebase_login_bridge():
    fb_req = {
        "firebase_uid": "fb_uid_test_12345",
        "email": "test.firebase@sehatsathi.ai",
        "full_name": "Firebase Test User",
        "role": "patient"
    }
    fb_res = client.post("/api/auth/firebase-login", json=fb_req)
    assert fb_res.status_code == 200
    data = fb_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test.firebase@sehatsathi.ai"
    assert data["user"]["full_name"] == "Firebase Test User"
    assert data["user"]["role"] == "patient"
