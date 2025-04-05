import json
import os
from flask import Flask, request, jsonify
import joblib
import pandas as pd
from datetime import datetime
import google.generativeai as genai
import re

app = Flask(__name__)

# Load models and preprocessors
xgb_model = joblib.load('xgb_model.pkl')
preprocessor = joblib.load('preprocessor.pkl')
anomaly_model = joblib.load('anomaly_model.pkl')
anomaly_preprocessor = joblib.load('anomaly_preprocessor.pkl')
print("Models and preprocessors loaded")

# Configure Gemini API
genai.configure(api_key="AIzaSyDq3W6bcmtED-s0vDKmSBZr8uIwy4Gc1Io")
gemini_model = genai.GenerativeModel('gemini-1.5-flash')

# Predefined options
RESOURCE_TYPES = ['doc', 'spreadsheet', 'video', 'presentation', 'pdf', 'image']
RESOURCE_SENSITIVITY = ['confidential', 'restricted', 'public']
REQUEST_REASONS = ['Routine check', 'Client request', 'Audit', 'Personal use', 'Urgent approval']

# User data
data = {
    "user_role": "Intern",
    "department": "Engineering",
    "employee_status": "Part-time",
    "resource_sensitivity": "",
    "past_violations": 2,
    "time_in_position": "6 months",
    "last_security_training": "Never",
    "employee_join_date": "2019-03-01"
}

# Function to convert time_in_position to months
def convert_to_months(time_str):
    if pd.isna(time_str):
        return 0
    time_str = str(time_str).lower().strip()
    if 'year' in time_str or 'years' in time_str:
        years = int(re.search(r'\d+', time_str).group())
        return years * 12
    elif 'month' in time_str or 'months' in time_str:
        months = int(re.search(r'\d+', time_str).group())
        return months
    try:
        return int(time_str)  # Handle cases where it's already a number
    except ValueError:
        return 0  # Default to 0 for unparseable values

# Function to calculate days since a date
def calculate_days_since(date_str, current_date="2025-04-05"):
    if pd.isna(date_str) or date_str == "Never" or date_str == "invalid_date":
        return 365 * 5  # Default to 5 years if missing
    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        current_date_obj = datetime.strptime(current_date, "%Y-%m-%d")
        return (current_date_obj - date_obj).days
    except ValueError:
        return 365 * 5

def get_gemini_response(query):
    prompt = f"""
    # Classification Task
    
    Analyze the following user query and classify the requested information according to predefined categories.
    
    ## User Query:
    "{query}"
    
    ## Classification Schema:
    - resource_type: Select exactly one from [{', '.join(RESOURCE_TYPES)}]
    - request_reason: Select exactly one from [{', '.join(REQUEST_REASONS)}]
    - resource_sensitivity: Select exactly one from [{', '.join(RESOURCE_SENSITIVITY)}]
    
    ## Classification Guidelines and Examples:
    
    ### Resource Sensitivity Examples:
    1. Public: Information that can be freely shared with all employees
       - "I need the company's leave policy document"
       - "I want to access the employee handbook" 
       - "Can I see the cafeteria menu for this week?"
    
    2. Restricted: Information with limited circulation within departments/teams
       - "I need to check last quarter's sales numbers for my team"
       - "I need access to the upcoming product launch presentation"
       - "I'd like to see the department's budget allocation spreadsheet"
    
    3. Confidential: Highly sensitive information with strict access controls
       - "I need the salary information for my direct reports"
       - "I want to see the source code for our proprietary algorithm"
       - "I need access to the executive board meeting notes"
    
    ## Required Output Format:
    Return ONLY a JSON object with your classifications, using this exact structure, enclosed in ```json ... ``` markers:
    
    ```json
    {{
        "resource_type": "one of the allowed resource types",
        "request_reason": "one of the allowed request reasons",
        "resource_sensitivity": "one of the allowed sensitivity levels"
    }}
    ```
    """
    
    response = gemini_model.generate_content(prompt)
    try:
        json_pattern = r'```json\s*([\s\S]*?)\s*```'
        match = re.search(json_pattern, response.text)
        if match:
            return json.loads(match.group(1))
        else:
            return json.loads(response.text)
    except json.JSONDecodeError:
        return {
            "resource_type": "unknown",
            "request_reason": "unknown",
            "resource_sensitivity": "unknown",
            "error": "Failed to parse Gemini response as JSON"
        }

@app.route('/predict', methods=['POST'])
def predict():
    request_data = request.get_json()
    if not request_data or 'query' not in request_data:
        return jsonify({"error": "Please provide a query"}), 400
    
    query = request_data['query']
    inferred_data = get_gemini_response(query)
    
    if "error" in inferred_data:
        return jsonify({"error": inferred_data["error"]}), 500
    
    # Create request object with the exact features needed for both models
    request_obj = {
        "user_role": data["user_role"],
        "department": data["department"],
        "employee_status": data["employee_status"],
        "resource_type": inferred_data.get("resource_type", "unknown"),
        "resource_sensitivity": inferred_data.get("resource_sensitivity", data["resource_sensitivity"]),
        "request_reason": inferred_data.get("request_reason", "unknown"),
        "time_in_position": data["time_in_position"],
        "past_violations": data["past_violations"],
        "last_security_training": data["last_security_training"],
        "employee_join_date": data["employee_join_date"]
    }
    
    # Create DataFrame for prediction
    input_df = pd.DataFrame([request_obj])
    
    # Convert time_in_position to months for the DataFrame
    input_df['time_in_position'] = input_df['time_in_position'].apply(convert_to_months)
    
    # Calculate days since for date columns 
    for col in ['last_security_training', 'employee_join_date']:
        input_df[f'days_since_{col}'] = input_df[col].apply(calculate_days_since)
    
    # Create feature sets for both models
    # For XGBoost
    categorical_cols = ['user_role', 'department', 'employee_status', 'resource_type', 
                         'resource_sensitivity', 'request_reason']
    numeric_cols = ['time_in_position', 'past_violations']
    date_derived_cols = [f'days_since_{col}' for col in ['last_security_training', 'employee_join_date']]
    
    xgb_features = input_df[categorical_cols + numeric_cols + date_derived_cols]
    
    # For anomaly model (may use the same features, but double-check)
    anomaly_features = input_df[categorical_cols + numeric_cols + date_derived_cols]
    
    # Make XGBoost prediction
    xgb_processed = preprocessor.transform(xgb_features)
    xgb_prediction = xgb_model.predict(xgb_processed)[0]
    xgb_prob = xgb_model.predict_proba(xgb_processed)[0][1] if hasattr(xgb_model, 'predict_proba') else None
    
    # Make anomaly prediction only if XGBoost approves
    anomaly_score = None
    anomaly_prediction = None
    
    if xgb_prediction == 1:
        # Only run anomaly detection if XGBoost approved
        anomaly_processed = anomaly_preprocessor.transform(anomaly_features)
        anomaly_score = anomaly_model.score_samples(anomaly_processed)[0] if hasattr(anomaly_model, 'score_samples') else None
        anomaly_prediction = anomaly_model.predict(anomaly_processed)[0]
    
    # Determine final prediction
    final_prediction = 0  # Default to denial
    anomaly_status = None

    if xgb_prediction == 1:  # Only consider approval if XGBoost approves
        if anomaly_prediction == 1:  # Normal behavior detected
            final_prediction = 1
            anomaly_status = "Approved - Confirmed by anomaly detection"
        else:  # Anomaly detected
            final_prediction = 0
            anomaly_status = "Denied - Flagged as anomalous behavior"
    else:
        # XGBoost denied, no need to check anomaly
        final_prediction = 0
        anomaly_status = "Denied by XGBoost model"
    
    # Prepare response
    response = {
        "query": query,
        "inferred_data": inferred_data,
        "request_details": {
            "user_role": request_obj["user_role"],
            "department": request_obj["department"],
            "employee_status": request_obj["employee_status"],
            "resource_type": request_obj["resource_type"],
            "resource_sensitivity": request_obj["resource_sensitivity"],
            "request_reason": request_obj["request_reason"],
            "time_in_position": f"{input_df['time_in_position'].iloc[0]} months",
            "past_violations": request_obj["past_violations"],
            "last_security_training": request_obj["last_security_training"],
            "employee_join_date": request_obj["employee_join_date"]
        },
        "model_outputs": {
            "xgb_prediction": int(xgb_prediction),
            "xgb_probability": float(xgb_prob) if xgb_prob is not None else None,
            "anomaly_score": float(anomaly_score) if anomaly_score is not None else None,
            "anomaly_prediction": int(anomaly_prediction) if anomaly_prediction is not None else None
        },
        "final_decision": {
            "approved": bool(final_prediction),
            "status": "Approved" if final_prediction else "Denied - Flagged for admin review",
            "reason": anomaly_status
        }
    }
    
    return jsonify(response)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "models_loaded": True})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)