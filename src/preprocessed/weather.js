import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const OUTPUT_PATH = path.resolve("../../data/processed");
const LOCATION_FILE = path.join(OUTPUT_PATH, "location.json");
const OUTPUT_FILE = path.join(OUTPUT_PATH, "weather.json");

function loadLocation() {
  try {
    return JSON.parse(fs.readFileSync(LOCATION_FILE, "utf-8"));
  } catch {
    return {};
  }
}

const location = loadLocation();
const ADM4_CODE = location.adm4;

async function fetchWeather(adm4) {
  const url = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${adm4}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "NATU-AI/1.0" }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch BMKG weather data");
  }

  return res.json();
}

function normalizeWeather(data) {
  const timeseries = data?.data?.[0]?.cuaca?.flat() || [];
  if (timeseries.length === 0) return null;

  const item = timeseries[0];

  return {
    datetime: item.local_datetime,
    weather_description: item.weather_desc,
    temperature: item.t,
    humidity: item.hu,
    wind_speed: item.ws,
    wind_direction: item.wd,
    cloud_cover: item.tcc,
    visibility: item.vs_text
  };
}

(async () => {
  try {
    const raw = await fetchWeather(ADM4_CODE);
    const weather = normalizeWeather(raw);

    fs.writeFileSync(
      OUTPUT_FILE,
      JSON.stringify(
        {
          adm4: ADM4_CODE,
          location: raw?.lokasi || {},
          weather
        },
        null,
        2
      ),
      "utf-8"
    );

    console.log("Weather data successfully fetched");
  } catch (err) {
    console.error("Error:", err.message);
  }
})();
