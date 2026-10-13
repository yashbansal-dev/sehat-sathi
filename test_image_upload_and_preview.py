import httpx

BASE_URL = "http://localhost:8000"

def test_full_image_upload_and_preview():
    print("=== Testing Image Upload & Preview Endpoints ===")
    
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Login to get auth token
        login_resp = client.post("/api/auth/demo-login")
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("1. Logged in successfully as Rajesh Sharma.")

        # 2. Minimal valid 1x1 PNG bytes
        png_bytes = (
            b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
            b'\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00'
            b'\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'
        )

        # 3. Upload image
        files = {
            'file': ('prescription_october_2026.png', png_bytes, 'image/png')
        }
        data = {
            'category': 'Prescription',
            'document_date': '2026-10-13'
        }
        upload_resp = client.post(
            "/api/documents/upload",
            headers=headers,
            files=files,
            data=data
        )
        print(f"2. Upload status: {upload_resp.status_code}")
        assert upload_resp.status_code == 200, f"Upload failed: {upload_resp.text}"
        doc_data = upload_resp.json()
        doc_id = doc_data["id"]
        print(f"   Uploaded document ID: {doc_id}, filename: {doc_data['filename']}")

        # 4. Fetch document details
        details_resp = client.get(
            f"/api/documents/{doc_id}",
            headers=headers
        )
        assert details_resp.status_code == 200, f"Details failed: {details_resp.text}"
        print(f"3. Details status: {details_resp.status_code}")

        # 5. Fetch document file (for preview / image rendering)
        file_resp = client.get(
            f"/api/documents/{doc_id}/file",
            headers=headers
        )
        assert file_resp.status_code == 200, f"File retrieval failed: {file_resp.status_code}"
        content_type = file_resp.headers.get("content-type")
        print(f"4. File preview status: {file_resp.status_code}, content-type: {content_type}, size: {len(file_resp.content)} bytes")
        assert "image" in content_type or "png" in content_type, f"Unexpected content-type: {content_type}"

        # 6. Verify Mock documents return files as well without 404
        for mock_id in ["doc-1", "doc-2", "doc-3", "doc-4"]:
            mock_file = client.get(f"/api/documents/{mock_id}/file", headers=headers)
            assert mock_file.status_code == 200, f"Mock file failed for {mock_id}: {mock_file.status_code}"
            print(f"5. Mock document {mock_id} file status: 200 (Safe fallback)")

        print("\nALL IMAGE & DOCUMENT RETRIEVAL AND PREVIEW TESTS PASSED 100%!")

if __name__ == "__main__":
    test_full_image_upload_and_preview()
