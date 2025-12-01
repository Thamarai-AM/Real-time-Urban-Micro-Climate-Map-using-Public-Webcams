import React, { useState, useEffect } from "react";
const API_BASE = "http://localhost:8000/api";

// --- Simple Carousel Component ---
const ImageCarousel = ({ images, width = 340, height = 200 , autoplay = 6000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  useEffect(() => {
    if (!autoplay || images.length <= 1) return; // no need for autoplay if single image
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, autoplay);

    return () => clearInterval(interval); // cleanup on unmount
  }, [images, autoplay]);


  return (
    <div style={{ position: "relative", width, margin: "auto" }}>
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
              background: "rgba(0,0,0,0.5)",
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
              background: "rgba(0,0,0,0.5)",
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
        </>
      )}

            {/* Pagination Dots */}
      {images.length > 1 && (
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
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: idx === currentIndex ? "#fff" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      )}

    </div>
  );
};

// --- Main Component ---
const WebcamWeather = () => {
  const [city, setCity] = useState("");
  const [coords, setCoords] = useState(null);
  const [webcams, setWebcams] = useState([]);
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (!coords) return;

    const fetchData = async () => {
      try {
        const { lat, lon } = coords;

        // --- Fetch webcams ---
        const webcamRes = await fetch(`${API_BASE}/webcams?lat=${lat}&lon=${lon}`);
        const webcamData = await webcamRes.json();
                // console.log(webcamData?.result?.webcams)

        setWebcams(webcamData?.result?.webcams || []);

        // --- Fetch weather ---
        const weatherRes = await fetch(`${API_BASE}/weather?lat=${lat}&lon=${lon}`);
        setWeather(await weatherRes.json());
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [coords]);

  const getCoordinates = async () => {
    if (!city) return;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${city}&format=json&limit=1`
    );
    const data = await res.json();
    if (data.length > 0) {
      setCoords({ lat: data[0].lat, lon: data[0].lon });
    } else {
      alert("City not found!");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <h1>🌤 Live Weather from Public Webcams</h1>

      <input
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Enter city..."
        style={{ padding: "10px", borderRadius: "8px", width: "250px" }}
      />
      <button
        onClick={getCoordinates}
        style={{ marginLeft: 10, padding: "10px 20px" }}
      >
        Search
      </button>

      {coords && (
        <div style={{ marginTop: 20 }}>
          {weather && weather.main && (
            <div style={{ marginBottom: 20 }}>
              <h2>🌡 Weather</h2>
              <p>Temperature: {weather.main.temp}°C</p>
              <p>Condition: {weather.weather[0].description}</p>
            </div>
          )}

          <h2>📷 Nearby Webcams</h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {webcams.length === 0 && <p>No webcams found nearby.</p>}
            
            {webcams.map((cam) => (
              <div
                key={cam.id}
                style={{
                  margin: 10,
                  border: "1px solid #ccc",
                  borderRadius: 10,
                  padding: 10,
                  width: 360,
                }}
              >
                <h4>{cam.title}</h4>

                {cam.player?.live?.embed ? (
                  <iframe
                    src={cam.player.live.embed}
                    width="340"
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

                <p style={{ marginTop: 10 }}>👁️ {cam.viewCount} views</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebcamWeather;
