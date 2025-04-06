import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.ensemble import IsolationForest
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam
import pickle
import joblib

# Load dataset
df = pd.read_csv('synthetic_access_data_10000.csv')

# Step 1: Select 6 key features
selected_features = [
    'user_role', 'department', 'employee_status', 
    'resource_sensitivity', 'request_reason', 'past_violations'
]
target = 'is_approved'

# Step 2: Clean the dataset
df = df.dropna(subset=selected_features + [target])
df = df[df['past_violations'] <= 50]  # Cap past_violations at 50

# Step 3: Prepare features and target
X = df[selected_features]
y = df[target]

# Define categorical and numerical features
categorical_cols = ['user_role', 'department', 'employee_status', 'resource_sensitivity', 'request_reason']
numeric_cols = ['past_violations']

# Preprocessing pipeline
preprocessor = ColumnTransformer(
    transformers=[
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_cols),
        ('num', 'passthrough', numeric_cols)
    ]
)

# Split data BEFORE preprocessing
X_train_raw, X_test_raw, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Apply preprocessing
X_train = preprocessor.fit_transform(X_train_raw)
X_test = preprocessor.transform(X_test_raw)
feature_names = (preprocessor.named_transformers_['cat'].get_feature_names_out(categorical_cols).tolist() + 
                 numeric_cols)

# Reshape data for RNN (samples, timesteps, features)
n_features = X_train.shape[1]
X_train_rnn = X_train.reshape((X_train.shape[0], 1, n_features))
X_test_rnn = X_test.reshape((X_test.shape[0], 1, n_features))

# Step 4: Define and Train RNN Model
def build_rnn_model():
    model = Sequential()
    model.add(LSTM(128, input_shape=(1, n_features), return_sequences=True))  # First LSTM layer
    model.add(Dropout(0.3))
    model.add(LSTM(64, return_sequences=False))  # Second LSTM layer
    model.add(Dropout(0.3))
    model.add(Dense(32, activation='relu'))
    model.add(Dropout(0.3))
    model.add(Dense(1, activation='sigmoid'))
    optimizer = Adam(learning_rate=0.01)
    model.compile(optimizer=optimizer, loss='binary_crossentropy', metrics=['accuracy'])
    return model

# Train the RNN model
rnn_model = build_rnn_model()
rnn_model.fit(
    X_train_rnn, y_train, 
    epochs=50, 
    batch_size=32, 
    validation_split=0.2, 
    verbose=1
)

# Evaluate on test set
y_pred_proba = rnn_model.predict(X_test_rnn, verbose=0)
y_pred = (y_pred_proba > 0.5).astype(int).flatten()
print("\nRNN Model Test Set Performance:")
print(classification_report(y_test, y_pred))
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")

# Save the RNN model
rnn_model.save('rnn_model_simplified.h5')
with open('preprocessor_simplified.pkl', 'wb') as preprocessor_file:
    pickle.dump(preprocessor, preprocessor_file)
print("RNN model and preprocessor exported as 'rnn_model_simplified.h5' and 'preprocessor_simplified.pkl'")

# Step 5: Train Isolation Forest on Approved Cases
approved_data = df[df['is_approved'] == 1][selected_features]
X_approved_transformed = preprocessor.transform(approved_data)

anomaly_model = IsolationForest(contamination=0.1, random_state=42)
anomaly_model.fit(X_approved_transformed)

# Save Isolation Forest model
joblib.dump(anomaly_model, 'anomaly_model_simplified.pkl')
print("Isolation Forest model saved as 'anomaly_model_simplified.pkl'")

# Step 6: Test Prediction Function
def predict_permission(request, preprocessor, rnn_model, anomaly_model):
    request_df = pd.DataFrame([request])
    X_req = request_df[selected_features]
    X_req_processed = preprocessor.transform(X_req)
    X_req_rnn = X_req_processed.reshape((1, 1, n_features))
    
    # Rule-based checks
    if request.get('employee_status') == 'Terminated' and request.get('resource_sensitivity') in ['restricted', 'confidential']:
        return "Denied - Terminated employee"
    if request.get('request_reason') == 'Personal use' and request.get('resource_sensitivity') in ['restricted', 'confidential']:
        return "Denied - Personal use not allowed"
    
    # RNN prediction
    rnn_pred_proba = rnn_model.predict(X_req_rnn, verbose=0)[0][0]
    rnn_pred = 1 if rnn_pred_proba > 0.5 else 0
    if rnn_pred == 0:
        return "Denied - Model prediction"
    
    # Anomaly detection
    anomaly_score = anomaly_model.predict(X_req_processed)[0]
    if anomaly_score == -1:
        return "Approved but flagged as anomaly"
    
    return "Approved"

# Test case
test_case = {
    "user_role": "Employee", "department": "Sales", "employee_status": "Full-time",
    "resource_sensitivity": "confidential", "request_reason": "Routine check", "past_violations": 10
}
print("\nTest Case Result:")
print(predict_permission(test_case, preprocessor, rnn_model, anomaly_model))