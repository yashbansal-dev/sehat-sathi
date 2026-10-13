import httpx

fe = httpx.get('http://localhost:5173')
print('Frontend Status:', fe.status_code)

be = httpx.get('http://localhost:8000/api/health')
print('Backend Status:', be.status_code, be.json())

demo = httpx.post('http://localhost:8000/api/auth/demo-login')
print('Demo Login Status:', demo.status_code, 'Patient:', demo.json()['user']['full_name'])
demo_doc = httpx.post('http://localhost:8000/api/auth/demo-doctor-login')
print('Demo Doctor Login Status:', demo_doc.status_code, 'Doctor:', demo_doc.json()['user']['full_name'])

token = demo.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}
docs = httpx.get('http://localhost:8000/api/documents', headers=headers)
print('Documents Count:', len(docs.json()))
print('All server endpoints operational!')