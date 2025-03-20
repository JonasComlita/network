import requests

def fetch_external_block_data():
    response = requests.get('https://api.blockchain.info/latestblock')
    return response.json() if response.status_code == 200 else None

def fetch_price_data():
    response = requests.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
    return response.json() if response.status_code == 200 else None

def fetch_market_data():
    response = requests.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd')
    return response.json() if response.status_code == 200 else None

def fetch_news_data():
    response = requests.get('https://newsapi.org/v2/everything?q=blockchain&apiKey=YOUR_API_KEY')
    return response.json() if response.status_code == 200 else None

def fetch_sentiment_data():
    response = requests.get('https://api.somesentimentapi.com/v1/sentiment?query=blockchain&apiKey=YOUR_API_KEY')
    return response.json() if response.status_code == 200 else None
