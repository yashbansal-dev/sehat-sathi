import httpx

r = httpx.post('http://localhost:8000/api/auth/demo-login')
tok = r.json()['access_token']
headers = {'Authorization': 'Bearer ' + tok}
docs = httpx.get('http://localhost:8000/api/documents', headers=headers).json()

print(f"Total documents: {len(docs)}")
for d in docs[:5]:
    doc_id = d['id']
    fname = d['original_filename']
    f_res = httpx.get(f'http://localhost:8000/api/documents/{doc_id}/file?token={tok}')
    details_res = httpx.get(f'http://localhost:8000/api/documents/{doc_id}', headers=headers)
    print(f"Doc {doc_id} ({fname}): details status = {details_res.status_code}, file status = {f_res.status_code}")
