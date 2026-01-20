import fs from "fs";
import path from "path";

// =========================
// FILE PATH
// =========================
const WEATHER_FILE = "../../data/processed/weather.json";
const CAP_FILE = "../../data/processed/cap.json";
const ENV_FILE = "../../data/processed/enviroment.json";

const OUTPUT_DIR = "../../data/dataset";
const OUTPUT_FILE = path.join(OUTPUT_DIR, "data_input.csv");

// =========================
// LOAD DATA (AMAN)
// =========================
let weather = {};
let cap = {};
let env = {};

try {
  const weatherRaw = JSON.parse(fs.readFileSync(WEATHER_FILE, "utf-8"));
  weather = weatherRaw?.weather || {};
} catch {}

try {
  const capRaw = JSON.parse(fs.readFileSync(CAP_FILE, "utf-8"));
  cap = Array.isArray(capRaw) ? capRaw[0] || {} : capRaw || {};
} catch {}

try {
  env = JSON.parse(fs.readFileSync(ENV_FILE, "utf-8"));
} catch {}

// =========================
// ENCODING FUNCTIONS
// =========================
function encodeBoolean(value) {
  return value === true ? 1 : 0;
}

function encodeRainDuration(hours) {
  if (!Number.isFinite(hours) || hours <= 0) return 0;
  if (hours < 5) return 1;
  if (hours <= 10) return 2;
  return 3;
}

function encodeCloudCover(percent) {
  if (!Number.isFinite(percent)) return 0;
  return percent >= 75 ? 2 : 1;
}

function encodeWindSpeed(speed) {
if (!Number.isFinite(speed)) return 0;
return speed >= 21 ? 2 : 1;
}

function encodeRainIntensity(description) {
  if (!description || typeof description !== "string") return 0;
  const d = description.toLowerCase();
  if (d.includes("lebat") || d.includes("petir")) return 4;
  if (d.includes("sedang")) return 3;
  if (d.includes("ringan")) return 2;
  return 1;
}

function encodeSoilTypeRisk(type) {
  if (!type || typeof type !== "string") return 0;
  const t = type.toLowerCase();

  // Tanah rawan longsor
  if (t.includes("lempung") || t.includes("liat")) return 1;

  // Tidak rawan
  return 0;
}

// =========================
// RAIN HOURS
// =========================
function calculateRainHours(description) {
  if (!description || typeof description !== "string") return 0;

  const matches = description.match(/(\d{2}):(\d{2})\s*(WIB|WITA|WIT)/gi);
  if (!matches || matches.length < 2) return 0;

  const [startTime, endTime] = matches;
  const [sh, sm] = startTime.match(/\d{2}:\d{2}/)[0].split(":").map(Number);
  const [eh, em] = endTime.match(/\d{2}:\d{2}/)[0].split(":").map(Number);

  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff <= 0) diff += 24 * 60;

  return Math.round(diff / 60);
}

// =========================
// FEATURE EXTRACTION
// =========================
const rainHours = calculateRainHours(cap.description);

const rain_duration = encodeRainDuration(rainHours);
const cloud_cover = encodeCloudCover(Number(weather.cloud_cover));
const rain_intensity = encodeRainIntensity(weather.weather_description);

// FLOOD
const ever_flooded = encodeBoolean(env.history?.ever_flooded);
const near_river = encodeBoolean(env.location?.near_river);

// LANDSLIDE (BINER SEMUA)
const near_hill = encodeBoolean(env.location?.near_hill);
const ever_landslide = encodeBoolean(env.history?.landslide);
const soil_type_risk = encodeSoilTypeRisk(
  env.environment_condition?.soil_type
);

// STROM 
const strong_wind = encodeBoolean(env.history?.strong_wind);
const wind_speed = encodeWindSpeed(weather.wind_speed);

// =========================
// WRITE CSV
// =========================
const header =
  "rain_duration,cloud_cover,rain_intensity,ever_flooded,near_river,near_hill,soil_type_risk,ever_landslide,strong_wind,wind_speed\n";

const row = [
  rain_duration,
  cloud_cover,
  rain_intensity,
  ever_flooded,
  near_river,
  near_hill,
  soil_type_risk,
  ever_landslide,
  strong_wind,
  wind_speed,
].join(",") + "\n";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

if (fs.existsSync(OUTPUT_FILE)) {
  fs.unlinkSync(OUTPUT_FILE);
}

fs.writeFileSync(OUTPUT_FILE, header + row);

// =========================
// DEBUG OUTPUT
// =========================
console.log("=== DATA INPUT GENERATED ===");
console.log({
  rain_duration,
  cloud_cover,
  rain_intensity,
  ever_flooded,
  near_river,
  near_hill,
  soil_type_risk,
  ever_landslide,
  strong_wind,
  wind_speed
});
