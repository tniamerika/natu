import pandas as pd
import json
import joblib

# ===============================
# LOAD MODEL
# ===============================
MODEL_PATH = "../../models/natu_v1.0/bansos_v1.0/bansos_model.pkl"
model = joblib.load(MODEL_PATH)

# ===============================
# FEATURE COLUMNS
# ===============================
FEATURE_COLUMNS = [
    "child_count_level",
    "vulnerable_level",
    "house_damage_level",
    "income_level",
    "job_impact_level",
    "risk_area_level",
    "evacuation_status",
    "dtks_status"
]

# ===============================
# LOAD INPUT JSON
# ===============================
JSON_PATH = "../../data/processed/bansos.json"

with open(JSON_PATH, "r") as f:
    raw_data = json.load(f)

df = pd.DataFrame(raw_data)

# Simpan metadata wilayah
wilayah_id = df["wilayah_id"]
nama_wilayah = df["nama_wilayah"]

X = df[FEATURE_COLUMNS]

# ===============================
# PREDICT
# ===============================
predictions = model.predict(X)

priority_map = {
    0: "Kurang layak mendapatkan Bansos",
    1: "Layak mendapatkan Bansos",
    2: "Prioritas Utama"
}

# ===============================
# BUILD OUTPUT JSON
# ===============================
output = []

for i in range(len(df)):
    output.append({
        "wilayah_id": wilayah_id.iloc[i],
        "nama_wilayah": nama_wilayah.iloc[i],
        "priority_label": int(predictions[i]),
        "priority_text": priority_map[int(predictions[i])]
    })

# ===============================
# OUTPUT
# ===============================
print(json.dumps(output, indent=2, ensure_ascii=False))