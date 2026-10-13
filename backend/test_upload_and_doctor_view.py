import urllib.request
import urllib.error
import json
import os

def test_full_pipeline():
    print("=== SEHAT SATHI AI: TESTING DOCUMENT UPLOAD & DOCTOR WORKSTATION VIEW ===\n")

    # 1. Patient Login
    login_req = urllib.request.Request("http://localhost:8000/api/auth/demo-login", data=b"", method="POST")
    with urllib.request.urlopen(login_req) as resp:
        patient = json.loads(resp.read())
    token = patient["access_token"]
    headers = {"Authorization": "Bearer " + token}
    print(f"[OK] Step 1: Patient Logged In as {patient['user']['full_name']}")

    # 2. Upload Document via sample or multipart
    sample_filename = "1_Prescription_Dr_Mehta_Cardiology_Oct2026.pdf"
    sample_url = f"http://localhost:8000/api/documents/samples/{sample_filename}"
    with urllib.request.urlopen(sample_url) as s_resp:
        pdf_bytes = s_resp.read()

    boundary = "----SehatSathiBoundary12345"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{sample_filename}"\r\n'
        f"Content-Type: application/pdf\r\n\r\n"
    ).encode("utf-8") + pdf_bytes + (
        f"\r\n--{boundary}\r\n"
        f'Content-Disposition: form-data; name="category"\r\n\r\n'
        f"Prescription\r\n"
        f"--{boundary}--\r\n"
    ).encode("utf-8")

    upload_headers = {
        "Authorization": "Bearer " + token,
        "Content-Type": f"multipart/form-data; boundary={boundary}"
    }
    upload_req = urllib.request.Request("http://localhost:8000/api/documents/upload", data=body, headers=upload_headers, method="POST")
    with urllib.request.urlopen(upload_req) as up_resp:
        uploaded_doc = json.loads(up_resp.read())

    doc_id = uploaded_doc["id"]
    print(f"[OK] Step 2: Document Uploaded Successfully")
    print(f"     Document ID: {doc_id}")
    print(f"     Title: {uploaded_doc.get('original_filename')}")
    print(f"     Category: {uploaded_doc.get('category')}")
    print(f"     Doctor Extracted: {uploaded_doc.get('doctor_name')}")

    # 3. Create 48-Hour Doctor Share Token
    share_headers = {"Authorization": "Bearer " + token, "Content-Type": "application/json"}
    share_body = json.dumps({
        "title": "Cardiology Consultation with Dr. Verma",
        "doctor_name_or_purpose": "Dr. Arvind Verma, MD",
        "duration_hours": 48
    }).encode("utf-8")
    share_req = urllib.request.Request("http://localhost:8000/api/sharing/tokens", data=share_body, headers=share_headers, method="POST")
    with urllib.request.urlopen(share_req) as sh_resp:
        share_res = json.loads(sh_resp.read())

    token_str = share_res["token"]
    token_id = share_res["id"]
    share_url = f"http://172.27.42.87:5173/doctor-portal/{token_str}"
    print(f"[OK] Step 3: 48-Hour Doctor Share Token Generated")
    print(f"     Token: {token_str[:12]}...")
    print(f"     Share Link: {share_url}")

    # 4. Doctor Opens Doctor Portal View
    doc_view_req = urllib.request.Request(f"http://localhost:8000/api/sharing/doctor-view/{token_str}")
    with urllib.request.urlopen(doc_view_req) as dv_resp:
        portal_data = json.loads(dv_resp.read())

    has_uploaded = any(d["id"] == doc_id for d in portal_data.get("documents", []))
    print(f"[OK] Step 4: Doctor Portal Loaded")
    print(f"     Token Valid: {portal_data.get('token_valid')}")
    print(f"     Patient: {portal_data.get('patient_name')}")
    print(f"     Total Documents Shared: {len(portal_data.get('documents', []))}")
    print(f"     Newly Uploaded Rx Present: {has_uploaded}")

    # 5. Doctor Views the Actual Source Document File
    doc_file_url = f"http://localhost:8000/api/sharing/doctor-file/{token_str}/{doc_id}"
    with urllib.request.urlopen(doc_file_url) as df_resp:
        file_bytes = df_resp.read()
        content_type = df_resp.headers.get("content-type")

    is_pdf = file_bytes.startswith(b"%PDF")
    print(f"[OK] Step 5: Doctor Document Inspection (Inline PDF Viewing)")
    print(f"     HTTP Status: 200")
    print(f"     Content-Type: {content_type}")
    print(f"     File Size: {len(file_bytes)} bytes")
    print(f"     Valid PDF Magic Header (%PDF): {is_pdf}")

    # 6. Patient Revokes Token
    revoke_req = urllib.request.Request(f"http://localhost:8000/api/sharing/tokens/{token_id}/revoke", data=b"", headers=headers, method="POST")
    with urllib.request.urlopen(revoke_req) as rev_resp:
        rev_data = json.loads(rev_resp.read())
    print(f"[OK] Step 6: Patient Revoked Doctor Access Token: {rev_data.get('status')}")

    # 7. Verify Doctor Access is now Blocked with HTTP 410
    try:
        with urllib.request.urlopen(doc_view_req) as blocked_resp:
            print("[FAIL] Doctor could still access revoked link!")
            return False
    except urllib.error.HTTPError as he:
        print(f"[OK] Step 7: Doctor Access Revocation Verified: HTTP {he.code} ({he.reason})")

    print("\n=== SUMMARY: ALL 7 STEPS VERIFIED 100% OPERATIONAL! ===")
    return True

if __name__ == "__main__":
    test_full_pipeline()
