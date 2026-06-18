import urllib.request
import json

url = 'http://20.97.193.102:3000/api/auth/login'
data = json.dumps({'email': 'admin@test.com', 'password': 'test'}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        print('Status:', response.status)
        print('Response:', response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print('HTTPError:', e.code, e.reason)
    print('Body:', e.read().decode('utf-8'))
except Exception as e:
    print('Error:', e)
