import joblib
import pandas as pd
import json

# =========================
# CONFIG
# =========================
INPUT_FILE = "../../data/dataset/data_input.csv"

MODELS = {
    "flood": {
        "path": "../../models/natu_v1.0/flood_v1.0/flood_model.pkl",
        "features": [
            "rain_duration",
            "cloud_cover",
            "rain_intensity",
            "ever_flooded",
            "near_river",
        ],
        "disaster_type": "Banjir",
        "model_name": "natu-flood:v1.0",
        "labels": ("Tidak Banjir", "Banjir"),
    },
    "landslide": {
        "path": "../../models/natu_v1.0/landslide_v1.0/landslide_model.pkl",
        "features": [
            "rain_duration",
            "rain_intensity",
            "near_hill",
            "soil_type_risk",
            "ever_landslide",
        ],
        "disaster_type": "Longsor",
        "model_name": "natu-landslide:v1.0",
        "labels": ("Tidak Longsor", "Longsor"),
    },
    "storm": {
        "path": "../../models/natu_v1.0/storm_v1.0/storm_model.pkl",
        "features": [
            "rain_intensity",
            "strong_wind",
            "wind_speed",
            "cloud_cover",
        ],
        "disaster_type": "Badai",
        "model_name": "natu-storm:v1.0",
        "labels": ("Tidak Badai", "Badai"),
    },
}

# =========================
# STATUS LOGIC (PROBABILITY BASED)
# =========================
def get_status(confidence):
    if confidence < 0.4:
        return "AMAN"
    elif confidence < 0.7:
        return "WASPADA"
    return "BAHAYA"

# =========================
# LOAD INPUT DATA
# =========================
data = pd.read_csv(INPUT_FILE)

# =========================
# PREDICTION
# =========================
results = []

for disaster, cfg in MODELS.items():
    try:
        model = joblib.load(cfg["path"])

        missing = [f for f in cfg["features"] if f not in data.columns]
        if missing:
            raise ValueError(f"Missing features: {missing}")

        X = data[cfg["features"]]

        pred = int(model.predict(X)[0])
        prediction_label = cfg["labels"][pred]

        confidence = 0.0
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(X)
            confidence = round(float(proba[0][1]), 2)

        risk_score = round(confidence * 10, 1)
        status = get_status(confidence)

        results.append({
            "disaster_type": cfg["disaster_type"],
            "prediction": prediction_label,
            "status": status,
            "risk_score": risk_score,
            "confidence": confidence,
            "model": cfg["model_name"]
        })

    except Exception as e:
        results.append({
            "disaster_type": cfg["disaster_type"],
            "error": str(e),
            "model": cfg["model_name"]
        })

# =========================
# OUTPUT JSON
# =========================
print(json.dumps(results, indent=2))
