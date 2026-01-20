import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    roc_auc_score
)

# =========================
# CONFIG
# =========================
DATA_PATH = "../../data/dataset/landslide_dataset.csv"
MODEL_PATH = "../../models/natu_v1.0/landslide_v1.0/landslide_model.pkl"
RANDOM_STATE = 42
THRESHOLD = 0.4   # fokus deteksi longsor

# =========================
# LOAD DATA
# =========================
df = pd.read_csv(DATA_PATH)
df = df.drop_duplicates().reset_index(drop=True)

# =========================
# FEATURES & LABEL (FINAL)
# =========================
FEATURES = [
    "rain_duration",
    "rain_intensity",
    "near_hill",
    "soil_type_risk",
    "ever_landslide"
]

X = df[FEATURES].copy()
y = df["landslide"]

# =========================
# TRAIN / TEST SPLIT
# =========================
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.25,
    random_state=RANDOM_STATE,
    stratify=y
)

# =========================
# MODEL
# =========================
model = RandomForestClassifier(
    n_estimators=500,
    max_depth=7,
    min_samples_leaf=6,
    max_features="sqrt",
    class_weight={0: 1, 1: 1.6},  # prioritaskan longsor
    random_state=RANDOM_STATE,
    n_jobs=-1
)

# =========================
# TRAIN
# =========================
model.fit(X_train, y_train)

# =========================
# PREDICTION (THRESHOLD)
# =========================
y_prob = model.predict_proba(X_test)[:, 1]
y_pred = (y_prob >= THRESHOLD).astype(int)

# =========================
# EVALUATION
# =========================
accuracy = accuracy_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_prob)

print("=== LANDSLIDE MODEL EVALUATION ===")
print("Accuracy :", round(accuracy, 3))
print("ROC-AUC  :", round(roc_auc, 3))
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# =========================
# SAVE MODEL
# =========================
joblib.dump(model, MODEL_PATH)
print("\nLandslide Random Forest model saved successfully")
