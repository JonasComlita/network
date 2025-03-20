import requests

def fetch_external_data():
    response = requests.get('https://api.example.com/data')
    if response.status_code == 200:
        return response.json()
    return None
