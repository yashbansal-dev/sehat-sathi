import httpx

fe = httpx.get('http://127.0.0.1:5173')
print('Frontend Status:', fe.status_code)

be = httpx.get('http://127.0.0.1:8000/api/health')
print('Backend Status:', be.status_code, be.json())

demo = httpx.post('http://127.0.0.1:8000/api/auth/demo-login')
print('Demo Login Status:', demo.status_code, 'Patient:', demo.json()['user']['full_name'])
