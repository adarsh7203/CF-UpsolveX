import requests

def test_notify():
    url = "https://cf-upsolvex.onrender.com/api/notify/adarsh7203?contest_id=1980"
    # Wait, the endpoint requires a JWT token because it's a protected route!
    # Let's hit the local backend first to get a token, or just look at the local backend.
    pass

if __name__ == "__main__":
    test_notify()
