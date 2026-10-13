import io
import os
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_flow():
    print("\n--- 1. Testing Health ---")
    res = client.get("/api/health")
    assert res.status_code == 200
    print("Health:", res.json())

    print("\n--- 2. Testing Auth Endpoints ---")
    # Demo Patient Login
    res = client.post("/api/auth/demo-login")
    assert res.status_code == 200
    patient_data = res.json()
    p_token = patient_data["access_token"]
    p_headers = {"Authorization": f"Bearer {p_token}"}
    print("Demo Patient:", patient_data["user"])

    # Demo Doctor Login
    res = client.post("/api/auth/demo-doctor-login")
    assert res.status_code == 200
    doctor_data = res.json()
    d_token = doctor_data["access_token"]
    d_headers = {"Authorization": f"Bearer {d_token}"}
    print("Demo Doctor:", doctor_data["user"])

    # Firebase Bridge Login
    res = client.post("/api/auth/firebase-login", json={
        "firebase_uid": "test_fb_uid_99",
        "email": "testfb@example.com",
        "full_name": "Test Firebase User",
        "role": "patient"
    })
    assert res.status_code == 200
    print("Firebase Login OK")

    # Get Me
    res = client.get("/api/auth/me", headers=p_headers)
    assert res.status_code == 200
    print("/api/auth/me:", res.json()["email"])

    print("\n--- 3. Testing Timeline & Stats ---")
    res = client.get("/api/timeline/stats", headers=p_headers)
    assert res.status_code == 200
    print("Stats:", res.json())

    res = client.get("/api/timeline", headers=p_headers)
    assert res.status_code == 200
    events = res.json()
    print(f"Timeline events count: {len(events)}")

    res = client.get("/api/timeline/lab-trends", headers=p_headers)
    assert res.status_code == 200
    print("Lab trends keys:", list(res.json().keys()))

    print("\n--- 4. Testing Briefing ---")
    res = client.get("/api/briefing", headers=p_headers)
    assert res.status_code == 200
    brief = res.json()
    print("Briefing generated for:", brief["patient_info"]["name"])
    print(f"Active meds: {len(brief['active_medications'])}, Lab results: {len(brief['recent_lab_results'])}")

    print("\n--- 5. Testing Document Endpoints ---")
    res = client.get("/api/documents", headers=p_headers)
    assert res.status_code == 200
    docs = res.json()
    print(f"Existing docs count: {len(docs)}")
    if docs:
        first_doc_id = docs[0]["id"]
        res_doc = client.get(f"/api/documents/{first_doc_id}", headers=p_headers)
        assert res_doc.status_code == 200
        print("Doc details for first doc:", res_doc.json()["document"]["original_filename"])

    # Test Upload with a valid PDF
    sample_pdf_path = os.path.join(os.path.dirname(__file__), "..", "storage", "synthetic", "Dr_Mehta_Cardiology_FollowUp_Oct2026.pdf")
    if os.path.exists(sample_pdf_path):
        with open(sample_pdf_path, "rb") as f:
            sample_content = f.read()
    else:
        sample_content = b"%PDF-1.4\n1 0 obj\n<< /Title (Test Doctor Prescription) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    upload_res = client.post(
        "/api/documents/upload",
        headers=p_headers,
        files={"file": ("test_prescription.pdf", io.BytesIO(sample_content), "application/pdf")},
        data={"category": "Prescription"}
    )
    assert upload_res.status_code == 200
    new_doc_id = upload_res.json()["document_id"]
    print("Uploaded new document:", new_doc_id)

    # Check details of new document
    status_res = client.get(f"/api/documents/{new_doc_id}", headers=p_headers)
    assert status_res.status_code == 200
    print("New doc details & processing status:", status_res.json()["processing_job"]["status"])

    print("\n--- 6. Testing Verification Center ---")
    res = client.get("/api/verification/uncertainties", headers=p_headers)
    assert res.status_code == 200
    uncs = res.json()
    print(f"Uncertainties count: {len(uncs)}")

    res = client.get("/api/verification/history", headers=p_headers)
    assert res.status_code == 200
    print(f"Audit history count: {len(res.json())}")

    print("\n--- 7. Testing Sharing Endpoints ---")
    res = client.post("/api/sharing/tokens", headers=p_headers, json={
        "title": "Test Consultation Token",
        "doctor_name_or_purpose": "Dr. Verification",
        "duration_hours": 12
    })
    assert res.status_code == 200
    token_obj = res.json()
    share_token_str = token_obj["token"]
    token_id = token_obj["id"]
    print("Created Share Token:", share_token_str)

    # Public doctor view
    doc_res = client.get(f"/api/sharing/doctor-view/{share_token_str}")
    assert doc_res.status_code == 200
    print("Doctor View retrieved successfully, patient:", doc_res.json()["patient_name"])

    # Doctor viewing shared source document
    doc_file_res = client.get(f"/api/sharing/doctor-file/{share_token_str}/{new_doc_id}")
    assert doc_file_res.status_code == 200
    assert len(doc_file_res.content) > 0
    print(f"Doctor file view verified: status={doc_file_res.status_code}, type={doc_file_res.headers.get('content-type')}")

    # Revoke
    rev_res = client.post(f"/api/sharing/tokens/{token_id}/revoke", headers=p_headers)
    assert rev_res.status_code == 200
    print("Share token revoked successfully")

    print("\n--- 8. Testing Audit Trail ---")
    audit_res = client.get("/api/audit", headers=p_headers)
    assert audit_res.status_code == 200
    print(f"Audit events total: {len(audit_res.json())}")

    print("\nALL BACKEND ENDPOINTS AND WORKFLOWS TESTED & WORKING!")

if __name__ == "__main__":
    test_full_flow()
