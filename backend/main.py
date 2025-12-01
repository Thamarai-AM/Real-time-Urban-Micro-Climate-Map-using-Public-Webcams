from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENWEATHER_API_KEY = "e568ca34956ef248a69b4e41d76f7a02"  
WINDY_KEY = "NKwxShbtP3emt1oHsTw7fEsTdMysafiQ"

class Location(BaseModel):
    lat: float
    lon: float

@app.post("/get_weather")
def get_weather(location: Location):
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={location.lat}&lon={location.lon}&appid={OPENWEATHER_API_KEY}&units=metric"
    res = requests.get(url)
    data = res.json()
    if res.status_code != 200:
        return {"error": data.get("message", "Failed to fetch weather")}

    return {
        "location": data["name"],
        "temperature": data["main"]["temp"],
        "humidity": data["main"]["humidity"],
        "description": data["weather"][0]["description"].title(),
        "wind_speed": data["wind"]["speed"],
        "icon": data["weather"][0]["icon"],
    }

# ----- New endpoint: by city name -----
class City(BaseModel):
    name: str

@app.post("/get_weather_by_city")
def get_weather_by_city(city: City):
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city.name}&appid={OPENWEATHER_API_KEY}&units=metric"
    res = requests.get(url)
    data = res.json()
    if res.status_code != 200:
        return {"error": data.get("message", "Failed to fetch weather")}

    return {
        "location": data["name"],
        "temperature": data["main"]["temp"],
        "humidity": data["main"]["humidity"],
        "description": data["weather"][0]["description"].title(),
        "wind_speed": data["wind"]["speed"],
        "icon": data["weather"][0]["icon"],
    }

# --- WEATHER ENDPOINT ---
@app.get("/api/weather")
def get_weather(lat: float, lon: float):
    """
    Get current weather data from OpenWeatherMap
    """
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
    res = requests.get(url)
    data = res.json()
    return data


# --- WEBCAMS ENDPOINT ---
@app.get("/api/webcams")
def list_webcams_near(lat: float, lon: float):
    """
    Get webcams near a location (lat, lon) from Windy API
    """
    # windy_url = (
    #     f"https://api.windy.com/api/webcams/v2/list/nearby={lat},{lon},50"
    #     f"?show=webcams:location,image,player,live,title&key={WINDY_KEY}"
    # )
    windy_url = (
        "https://api.windy.com/webcams/api/v3/webcams"
        f"?nearby={lat},{lon},50"
        "&include=images"
    )

    headers = {"X-WINDY-API-KEY": WINDY_KEY}

    res = requests.get(windy_url,headers=headers)
    print("Windy URL:", windy_url)
    print("Windy status:", res.status_code)
    print("Windy response:", res.text[:500])  
    data = res.json()

    # Return simplified format for frontend
    # webcams = data.get("result", {}).get("webcams", [])
    webcams = data.get("webcams", [])
    # print("webcams-----",webcams)
    return {"result": {"webcams": webcams}}
