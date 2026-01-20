import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";

const RSS_URL = "https://www.bmkg.go.id/alerts/nowcast/id";

const OUTPUT_PATH = path.resolve("../../data/processed");
const LOCATION_FILE = path.join(OUTPUT_PATH, "location.json");
const OUTPUT_FILE = path.join(OUTPUT_PATH, "cap.json");

if (!fs.existsSync(OUTPUT_PATH)) {
  fs.mkdirSync(OUTPUT_PATH, { recursive: true });
}

function loadLocation() {
  try {
    return JSON.parse(fs.readFileSync(LOCATION_FILE, "utf-8"));
  } catch {
    return {};
  }
}

const location = loadLocation();

async function fetchRSS() {
  const res = await fetch(RSS_URL, {
    headers: { "User-Agent": "NATU-AI/1.0" }
  });
  const xml = await res.text();
  return parseStringPromise(xml);
}

async function parseCapDetail(url, title) {
  const res = await fetch(url, {
    headers: { "User-Agent": "NATU-AI/1.0" }
  });

  const xml = await res.text();
  const data = await parseStringPromise(xml);

  if (!data?.alert?.info?.[0]) return null;

  const info = data.alert.info[0];

  const areas = Array.isArray(info.area)
    ? info.area.map(a => a.areaDesc?.[0]).filter(Boolean)
    : [];

  return {
    title,
    event: info.event?.[0] || null,
    urgency: info.urgency?.[0] || null,
    severity: info.severity?.[0] || null,
    certainty: info.certainty?.[0] || null,
    areas,
    sent: data.alert.sent?.[0] || null,
    description: info.description?.[0] || "",
    source: "BMKG"
  };
}

function isRelevantAlert(alert, location) {
  const { province, city, district, village } = location || {};
  if (!province) return false;

  const text = []
    .concat(alert.areas || [])
    .concat(alert.title || "")
    .concat(alert.description || "")
    .join(" ")
    .toLowerCase();

  const provinceMatch = text.includes(province.toLowerCase());

  const subRegionMatch = [city, district, village]
    .filter(Boolean)
    .some(v => text.includes(v.toLowerCase()));

  return provinceMatch && subRegionMatch;
}

async function parseCAP() {
  try {
    const rss = await fetchRSS();
    const items = rss?.rss?.channel?.[0]?.item || [];
    const alerts = [];

    for (const item of items) {
      const link = item.link?.[0];
      const title = item.title?.[0] || "";
      if (!link) continue;

      try {
        const alert = await parseCapDetail(link, title);
        if (alert && isRelevantAlert(alert, location)) {
          alerts.push(alert);
        }
      } catch {}
    }

    return alerts;
  } catch {
    return [];
  }
}

(async () => {
  const alerts = await parseCAP();

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(alerts, null, 2),
    "utf-8"
  );

  console.log("CAP alerts parsed:", alerts.length);
})();
