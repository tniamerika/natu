# ===============================
# 1. IMPORT LIBRARY
# ===============================
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

import joblib


# ===============================
# 2. LOAD DATASET TRAINING
# ===============================
DATA_PATH = "../../data/dataset/bansos_dataset.csv"
df = pd.read_csv(DATA_PATH)

print("=== DATASET LOADED ===")
print(df.head())
print("\nJumlah data:", len(df))


# ===============================
# 3. CEK DATASET
# ===============================
print("\n=== INFO DATASET ===")
print(df.info())

print("\n=== DISTRIBUSI PRIORITY ===")
print(df["priority_label"].value_counts())


# ===============================
# 4. PISAHKAN FITUR & LABEL
# ===============================
X = df.drop("priority_label", axis=1)
y = df["priority_label"]


# ===============================
# 5. SPLIT TRAIN & TEST
# ===============================
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\nTrain size:", len(X_train))
print("Test size :", len(X_test))


# ===============================
# 6. TRAIN MODEL (FINAL SETTING)
# ===============================
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=12,
    class_weight="balanced",
    random_state=42
)

model.fit(X_train, y_train)

print("\n=== MODEL TRAINED ===")


# ===============================
# 7. EVALUASI MODEL
# ===============================
y_pred = model.predict(X_test)

print("\n=== EVALUATION ===")
print("Accuracy:", accuracy_score(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred, zero_division=0))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))


# ===============================
# 8. FEATURE IMPORTANCE
# ===============================
feature_importance = pd.Series(
    model.feature_importances_,
    index=X.columns
).sort_values(ascending=False)

print("\n=== FEATURE IMPORTANCE ===")
print(feature_importance)


# ===============================
# 9. SIMPAN MODEL
# ===============================
MODEL_PATH = "../../models/natu_v1.0/bansos_v1.0/bansos_model.pkl"
joblib.dump(model, MODEL_PATH)

print("\nModel saved as:", MODEL_PATH)
