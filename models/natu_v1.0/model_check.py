import joblib

model = joblib.load("./flood_v1.0/flood_model.pkl")

print("FEATURE DI DALAM MODEL:")
print(model.feature_names_in_)
