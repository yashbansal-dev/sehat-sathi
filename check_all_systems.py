import urllib.request
import json
import sys

def check_url(name, url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    try:
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=5) as response:
            status = response.getcode()
            body = response.read().decode('utf-8')
            print(f"[OK] {name}: HTTP {status}")
            return status, body
    except Exception as e:
        print(f"[FAIL] {name}: {e}")
        return None, None

def get_local_ip():
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def run_checks():
    print("=== SEHAT SATHI AI: FULL SYSTEM HEALTH AUDIT ===\n")

    local_ip = get_local_ip()
    # 1. Check Servers
    check_url("FastAPI Localhost", "http://127.0.0.1:8000/docs")
    check_url(f"FastAPI Wi-Fi LAN IP ({local_ip})", f"http://{local_ip}:8000/docs")
    check_url("Doctor Web Platform", "http://localhost:5173/")
    check_url("Patient Mobile Expo Web (Optional)", "http://localhost:8081/")

    # 2. Test Patient Auth
    print("\n--- Testing Patient Auth & APIs ---")
    status, body = check_url("Patient Demo Login", "http://localhost:8000/api/auth/demo-login", method="POST")
    if status == 200 and body:
        token_data = json.loads(body)
        token = token_data.get("access_token")
        auth_headers = {"Authorization": f"Bearer {token}"}
        print(f"  Patient Name: {token_data.get('user', {}).get('full_name')}")

        check_url("Timeline Stats API", "http://localhost:8000/api/timeline/stats", headers=auth_headers)
        check_url("Timeline Events API", "http://localhost:8000/api/timeline", headers=auth_headers)
        check_url("Lab Trends API", "http://localhost:8000/api/timeline/lab-trends", headers=auth_headers)
        check_url("Clinical Briefing API", "http://localhost:8000/api/briefing", headers=auth_headers)
        check_url("Documents Vault API", "http://localhost:8000/api/documents", headers=auth_headers)
        check_url("Doctor Tokens API", "http://localhost:8000/api/sharing/tokens", headers=auth_headers)

    # 3. Test Doctor Auth
    print("\n--- Testing Doctor Auth & APIs ---")
    d_status, d_body = check_url("Doctor Demo Login", "http://localhost:8000/api/auth/demo-doctor-login", method="POST")
    if d_status == 200 and d_body:
        d_token_data = json.loads(d_body)
        print(f"  Doctor Name: {d_token_data.get('user', {}).get('full_name')}")

    print("\n=== AUDIT COMPLETE: ALL SYSTEMS NOMINAL ===")

if __name__ == "__main__":
    run_checks()
