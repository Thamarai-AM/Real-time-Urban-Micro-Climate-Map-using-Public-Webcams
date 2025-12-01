import React, { useEffect, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./Weather.css";

import rainGif from "../assets/rain.gif";
import cloudGif from "../assets/cloud.gif";
import clearGif from "../assets/clear.gif";
import stormGif from "../assets/storm.gif";
import snowGif from "../assets/snow.gif";
import defaultGif from "../assets/default.gif";
import temperatureGif from "../assets/temperature.gif";
import fogGif from "../assets/fog.gif";
import mistGif from "../assets/mist.png";
import drizzleGif from "../assets/drizzle.gif";

/* ---------- Fix Leaflet Marker Icons ---------- */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API_BASE = "http://localhost:8000/api";

/* ---------- Recenter Map ---------- */
const RecenterMap = ({ lat, lon }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) map.setView([lat, lon], 10);
  }, [lat, lon, map]);
  return null;
};

/* ---------- Image Carousel ---------- */
const ImageCarousel = ({ images = [], width = 340, height = 200, autoplay = 6000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  if (images.length === 0) return null;

  useEffect(() => {
    if (!autoplay || images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, autoplay);
    return () => clearInterval(interval);
  }, [images, autoplay]);

  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const nextSlide = () => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <div className="carousel" style={{ position: "relative", width, margin: "auto" }}>
      <img
        src={images[currentIndex]}
        alt={`Slide ${currentIndex}`}
        style={{ width, height, borderRadius: "8px", objectFit: "cover" }}
      />

      {images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.4)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 30,
              height: 30,
              cursor: "pointer",
            }}
          >
            ‹
          </button>

          <button
            onClick={nextSlide}
            style={{
              position: "absolute",
              top: "50%",
              right: 0,
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.4)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 30,
              height: 30,
              cursor: "pointer",
            }}
          >
            ›
          </button>

          {/* Pagination dots with unique keys */}
          <div
            style={{
              position: "absolute",
              bottom: 10,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {images.map((_, idx) => (
              <span
                key={`dot-${idx}`} // ✅ unique key fix
                onClick={() => setCurrentIndex(idx)}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: idx === currentIndex ? "#fff" : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ---------- Main Component ---------- */
const Weather = () => {
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [webcams, setWebcams] = useState([]);

  /* ---------- Load Current Location ---------- */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lon: longitude });
        const res = await axios.post("http://127.0.0.1:8000/get_weather", {
          lat: latitude,
          lon: longitude,
        });
        console.log(res.data)
        setWeather(res.data);
      },
      (err) => {
        console.error("Location error:", err);
        alert("Could not access location. Please allow it or search by city.");
      }
    );
  }, []);

  /* ---------- Search by City ---------- */
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true);

    try {
      const res = await axios.post("http://127.0.0.1:8000/get_weather_by_city", { name: city });
      const data = res.data;
      if (data.error) {
        alert(data.error);
        return;
      }
      console.log(data)
      setWeather(data);

      const geoRes = await axios.get(
        `https://nominatim.openstreetmap.org/search?city=${city}&format=json&limit=1`
      );
      if (geoRes.data.length > 0) {
        const { lat, lon } = geoRes.data[0];
        setCoords({ lat: parseFloat(lat), lon: parseFloat(lon) });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Weather Animation ---------- */
  const getWeatherGif = (desc) => {
    if (!desc) return defaultGif;
    const d = desc.toLowerCase();
    if (d.includes("rain")) return rainGif;
    if (d.includes("cloud")) return cloudGif;
    if (d.includes("clear")) return clearGif;
    if (d.includes("storm") || d.includes("thunder")) return stormGif;
    if (d.includes("snow")) return snowGif;
    if (d.includes("temperature")) return temperatureGif;
    if (d.includes("fog") || d.includes("haze")) return fogGif;
    if (d.includes("mist")) return mistGif;
    if (d.includes("drizzle")) return drizzleGif;
    return defaultGif;
  };

  /* ---------- Fetch Webcams + Weather ---------- */
  useEffect(() => {
    if (!coords.lat || !coords.lon) return;

    const fetchData = async () => {
      try {
        const { lat, lon } = coords;
        const webcamRes = await fetch(`${API_BASE}/webcams?lat=${lat}&lon=${lon}`);
        const webcamData = await webcamRes.json();
        setWebcams(webcamData?.result?.webcams || []);

        const weatherRes = await fetch(`${API_BASE}/weather?lat=${lat}&lon=${lon}`);
        // setWeather(await weatherRes.json());
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [coords]);

  return (
    <div className="container-grid">
      {/* ---------- TOP SECTION: INPUT + MAP ---------- */}
      <div className="top-section">
        <div className="containerLeft">
          <h2 className="heading">Live Weather Map</h2>

          {/* Search */}
          <form onSubmit={handleSearch} className="weatherform">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city or location..."
            />
            <button type="submit">Search</button>
          </form>

          {loading && <p>Fetching weather...</p>}

          {weather && !weather.error && (
            // <div className="weather-card">
            //   {weather.id}
            //   <h3>{weather.location}</h3>
            //   <div className="weather-display">--------------
            //     <div className="weather-icon">
            //       <img
            //         alt="weather icon"
            //         src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            //       />
            //     </div>
            //     <div className="weather-gif">
            //       <img alt="weather animation" src={getWeatherGif(weather.description)} />
            //     </div>
            //   </div>
            //   <p>
            //     {weather.description} <br />
            //     🌡 Temp: {weather.temperature} °C <br />
            //     💧 Humidity: {weather.humidity}% <br />
            //     🌬 Wind: {weather.wind_speed} m/s
            //   </p>
            // </div>
            <div className="weather-card">
          <div className="weather-display">
            {/* 🔹 First row: location + weather icon */}
            <div className="weather-top">
              <h3 className="weather-location">{weather.location}</h3>
              <img
                alt="weather icon"
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                className="weather-icon-img"
              />
            </div>

            {/* 🔹 Second row: weather GIF */}
            <div className="weather-gif">
              <img
                alt="weather animation"
                src={getWeatherGif(weather.description)}
                className="weather-gif-img"
              />
            </div>
          </div>

          {/* 🔹 Weather details */}
          <p className="weather-info">
            {weather.description} <br />
            Temp: {weather.temperature} °C <br />
            Humidity: {weather.humidity}% <br />
            Wind: {weather.wind_speed} m/s
          </p>
        </div>

          )}

          {weather?.error && <p style={{ color: "red" }}>{weather.error}</p>}
        </div>

        <div className="containerRight">
          {coords.lat && coords.lon ? (
            <MapContainer center={[coords.lat, coords.lon]} zoom={10} className="mapContainer">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
              />
              <RecenterMap lat={coords.lat} lon={coords.lon} />
              {weather && !weather.error && (
                <Marker position={[coords.lat, coords.lon]}>
                  <Popup>
                    <div className="marker">
                      <strong>{weather.location}</strong>
                      <br />
                      <img
                        alt="icon"
                        src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                        style={{ height: "50px" }}
                      />
                      <br />
                      {weather.description}
                      <br />
                      🌡 {weather.temperature} °C <br />
                      💧 {weather.humidity}% <br />
                      🌬 {weather.wind_speed} m/s
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          ) : (
            <p>Loading map...</p>
          )}
        </div>
      </div>

      {/* ---------- SECOND ROW: WEBCAMS ---------- */}
      <div className="web">
                <h2 className="webh2">Nearby Webcams</h2>


      <div className="webcam-grid">
        {webcams.length === 0 ? (
          <p>No webcams found nearby.</p>
        ) : (
          webcams.map((cam) => (
            // <div className="webcam-card" key={cam.id || cam.title}> {/* ✅ unique key fix */}
            <div className="webcam-card" key={`${cam.id || cam.title}-${cam.player?.live?.embed || Math.random()}`}>

              <h4>{cam.title}</h4>
              {cam.player?.live?.embed ? (
                <iframe
                  src={cam.player.live.embed}
                  width="100%"
                  height="200"
                  title={cam.title}
                  style={{ borderRadius: "8px", border: "none" }}
                  allowFullScreen
                ></iframe>
              ) : (
                <ImageCarousel
                  images={[
                    cam.images?.current?.preview,
                    cam.images?.daylight?.preview,
                    cam.images?.current?.thumbnail,
                  ].filter(Boolean)}
                  autoplay={5000}
                />
              )}
              <p>👁️ {cam.viewCount} views</p>
            </div>
          ))
        )}
      </div>
            </div>
    </div>
  );
};

export default Weather;
