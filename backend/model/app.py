import json
import os
from flask import Flask, request, jsonify
import joblib
import pickle
import pandas as pd
import numpy as np
from datetime import datetime
import google.generativeai as genai
import re
from tensorflow.keras.models import load_model

app = Flask(__name__)

# Load models and preprocessors
rnn_model = load_model('rnn_model_simplified.h5')
with open('preprocessor_simplified.pkl', 'rb') as preprocessor_file:
    preprocessor = pickle.load(preprocessor_file)
anomaly_model = joblib.load('anomaly_model_simplified.pkl')
print("Models and preprocessors loaded")

# Configure Gemini API
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
gemini_model = genai.GenerativeModel('gemini-1.5-flash')

# Predefined options
RESOURCE_TYPES = ['doc', 'spreadsheet', 'video', 'presentation', 'pdf', 'image']
REQUEST_REASONS = ['Routine check', 'Client request', 'Audit', 'Personal use', 'Urgent approval']
RESOURCE_SENSITIVITY = ['confidential', 'restricted', 'public']

# Selected features from training script
selected_features = [
    'user_role', 'department', 'employee_status', 
    'resource_sensitivity', 'request_reason', 'past_violations'
]

# User data - sample data for testing
data = {
    "user_role": "Employee",
    "department": "Sales",
    "employee_status": "Full-time",
    "past_violations": 0,
    "request_reason": ""  # Default, will be overridden by Gemini
}

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
    
    ### Request Reasons Examples:
    1. Routine check: Standard access needed for day-to-day operations
       - "I need to check the standard operating procedures"
       - "I want to access my team's regular update documents"
    
    2. Client request: Access needed to fulfill client needs
       - "The client asked for information about their account"
       - "Need to prepare a presentation for our client meeting tomorrow"
    
    3. Audit: Access needed for compliance or review purposes
       - "Need to verify last quarter's financial records"
       - "I'm conducting the annual security audit"
    
    4. Personal use: Non-work related access request
       - "I want to store some personal files"
       - "Need to check something for my personal project"
    
    5. Urgent approval: Time-sensitive access requirement
       - "Need immediate access to fix a critical bug"
       - "Emergency request for customer issue resolution"
    
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
            "resource_sensitivity": "public",  # Default to public as safest option if parsing fails
            "error": "Failed to parse Gemini response as JSON"
        }

@app.route('/predict', methods=['POST'])
def predict():
    request_data = request.get_json()
    if not request_data or 'query' not in request_data:
        return jsonify({"error": "Please provide a query"}), 400
    
    # Update user data if provided in request
    if 'user_profile' in request_data:
        for key in request_data['user_profile']:
            if key in data:
                data[key] = request_data['user_profile'][key]
    
    query = request_data['query']
    inferred_data = get_gemini_response(query)
    
    if "error" in inferred_data:
        return jsonify({"error": inferred_data["error"]}), 500
    
    # Create request object with the exact features needed for both models
    request_obj = {
        "user_role": data["user_role"],
        "department": data["department"],
        "employee_status": data["employee_status"],
        "resource_sensitivity": inferred_data.get("resource_sensitivity", "public"),  # Now from Gemini
        "request_reason": inferred_data.get("request_reason", data["request_reason"]),
        "past_violations": data["past_violations"]
    }
    
    # Create DataFrame for prediction
    request_df = pd.DataFrame([request_obj])
    X_req = request_df[selected_features]
    
    # Rule-based checks first
    if request_obj["employee_status"] == "Terminated" and request_obj["resource_sensitivity"] in ["restricted", "confidential"]:
        final_prediction = 0
        rule_status = "Denied - Terminated employee"
    elif request_obj["request_reason"] == "Personal use" and request_obj["resource_sensitivity"] in ["restricted", "confidential"]:
        final_prediction = 0
        rule_status = "Denied - Personal use not allowed for sensitive resources"
    else:
        # Apply preprocessing
        X_req_processed = preprocessor.transform(X_req)
        n_features = X_req_processed.shape[1]
        X_req_rnn = X_req_processed.reshape((1, 1, n_features))
        
        # RNN prediction
        rnn_pred_proba = float(rnn_model.predict(X_req_rnn, verbose=0)[0][0])
        rnn_pred = 1 if rnn_pred_proba > 0.65 else 0
        
        if rnn_pred == 0:
            final_prediction = 0
            rule_status = "Denied - Model prediction"
        else:
            # Anomaly detection
            anomaly_score = int(anomaly_model.predict(X_req_processed)[0])
            anomaly_score_value = float(anomaly_model.score_samples(X_req_processed)[0])
            
            if anomaly_score == -1:
                final_prediction = 1  # Still approve but flag
                rule_status = "Approved but flagged as anomaly"
            else:
                final_prediction = 1
                rule_status = "Approved"
    
    # Prepare response
    response = {
        "query": query,
        "inferred_data": inferred_data,
        "request_details": {
            "user_role": request_obj["user_role"],
            "department": request_obj["department"],
            "employee_status": request_obj["employee_status"],
            "resource_type": inferred_data.get("resource_type", "unknown"),
            "resource_sensitivity": request_obj["resource_sensitivity"],
            "request_reason": request_obj["request_reason"],
            "past_violations": request_obj["past_violations"]
        },
        "model_outputs": {
            "rnn_probability": rnn_pred_proba if 'rnn_pred_proba' in locals() else None,
            "anomaly_score": anomaly_score_value if 'anomaly_score_value' in locals() else None,
            "anomaly_prediction": anomaly_score if 'anomaly_score' in locals() else None
        },
        "final_decision": {
            "approved": bool(final_prediction),
            "status": "Approved" if final_prediction == 1 and rule_status == "Approved" else rule_status,
            "reason": rule_status
        }
    }
    
    return jsonify(response)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "models_loaded": True})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)