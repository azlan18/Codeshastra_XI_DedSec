import json
import os
import logging
from flask import Flask, request, jsonify
import joblib
import pickle
import pandas as pd
import numpy as np
from datetime import datetime
import google.generativeai as genai
import re
from tensorflow.keras.models import load_model

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('predict_model.log'),  # Logs to a file
        logging.StreamHandler()                    # Logs to console
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load models and preprocessors
rnn_model = load_model('rnn_model_simplified.h5')
with open('preprocessor_simplified.pkl', 'rb') as preprocessor_file:
    preprocessor = pickle.load(preprocessor_file)
anomaly_model = joblib.load('anomaly_model_simplified.pkl')
logger.info("Models and preprocessors loaded")

# Configure Gemini API
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
gemini_model = genai.GenerativeModel('gemini-1.5-flash')

# Predefined options
RESOURCE_TYPES = ['doc', 'spreadsheet', 'video', 'presentation', 'pdf', 'image']
REQUEST_REASONS = ['Routine check', 'Client request', 'Audit', 'Personal use', 'Urgent approval']
RESOURCE_SENSITIVITY = ['confidential', 'restricted', 'public']

# Performance-related terms for the bypass rule
PERFORMANCE_TERMS = [
    'performance', 'quarterly', 'q1', 'q2', 'q3', 'q4', 
    'report', 'metrics', 'kpi', 'results', 'financials',
    'sales', 'revenue', 'forecast', 'growth', 'dashboard'
]

# Selected features from training script
selected_features = [
    'user_role', 'department', 'employee_status', 
    'resource_sensitivity', 'request_reason', 'past_violations'
]

def get_gemini_response(query, user_profile):
    prompt = f"""
    # Classification and Reasoning Task
    
    Analyze the following user query and user profile information, then classify the requested information according to predefined categories. Pay special attention to determining the appropriate resource sensitivity level based on both the query and the user's profile.
    
    ## User Query:
    "{query}"
    
    ## User Profile:
    ```json
    {json.dumps(user_profile, indent=2)}
    ```
    
    ## Classification Schema:
    - resource_type: Select exactly one from [{', '.join(RESOURCE_TYPES)}]
    - request_reason: Select exactly one from [{', '.join(REQUEST_REASONS)}]
    - resource_sensitivity: Select exactly one from [{', '.join(RESOURCE_SENSITIVITY)}]
    
    ## Reasoning Guidelines for Resource Sensitivity:
    
    1. Consider the user's role and experience level:
       - Higher-level roles (Manager, Director, Executive) should generally have broader access. For these roles, prefer classifying resources as 'public' or 'restricted' unless the content is clearly highly sensitive.
       - Users with more experience (higher years_of_service) have demonstrated reliability and should be granted appropriate access levels.
    
    2. Resource Sensitivity Definitions:
       - Public: Information that can be freely shared with all employees
       - Restricted: Information with limited circulation within departments/teams
       - Confidential: Highly sensitive information with strict access controls
    
    3. Department and Role Context:
       - Consider whether the resource relates to the user's department
       - Higher-level roles should have more access across departments
    
    4. Past Violations Impact:
       - If past_violations > 2, consider stricter classification (i.e., prefer more restrictive categories)
       - If past_violations = 0, lean toward more open access (public or restricted)
    
    5. Employee Status Impact:
       - Full-time employees generally have more access than contractors
       - New employees might need more restricted access until they are fully onboarded
    
    ## Key Decision Factors:
    - If user_role is Manager or higher AND years_of_service > 2, prefer classifying as 'public' unless clearly sensitive
    - If user_role is Director or higher, classify as 'restricted' at most unless extremely sensitive content
    - If employee_status is not "Full-time", lean toward more restrictive classification
    - If past_violations > 0, consider increasing the restriction level
    
    ## Specific Examples:
    1. Manager asking for department reports -> public (even if might normally be restricted)
    2. Executive requesting strategic documents -> restricted (even if might normally be confidential)
    3. New employee requesting company procedures -> public or restricted depending on content
    4. Employee with violations history requesting financial data -> restricted or confidential
    
    ## Required Output Format:
    Return ONLY a JSON object with your classifications and reasoning, using this exact structure, enclosed in ```json ... ``` markers:
    
    ```json
    {{
        "resource_type": "one of the allowed resource types",
        "request_reason": "one of the allowed request reasons",
        "resource_sensitivity": "one of the allowed sensitivity levels",
        "reasoning": "Brief explanation of why you selected this sensitivity level"
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
            "reasoning": "Failed to parse Gemini response as JSON",
            "error": "Failed to parse Gemini response as JSON"
        }

def check_performance_related(query):
    """Check if the query is related to performance metrics"""
    query_lower = query.lower()
    return any(term in query_lower for term in PERFORMANCE_TERMS)

def calculate_experience_years(join_date):
    """Calculate years of experience from join date"""
    if not join_date:
        return 0
    
    try:
        # Handle different date formats
        if isinstance(join_date, str):
            if 'T' in join_date:  # ISO format
                join_date = datetime.fromisoformat(join_date.split('T')[0])
            else:
                # Try different formats
                try:
                    join_date = datetime.strptime(join_date, '%Y-%m-%d')
                except ValueError:
                    return 0  # If we can't parse the date, assume 0 years
        
        # Calculate years
        today = datetime.now()
        years = today.year - join_date.year
        
        # Adjust if birthday hasn't occurred yet this year
        if (today.month, today.day) < (join_date.month, join_date.day):
            years -= 1
            
        return years
    except Exception:
        # If any errors in parsing, default to 0
        return 0

def parse_time_in_position(time_string):
    """Parse time in position from string like '7 years' or '3 months'"""
    if not time_string:
        return 0
    
    try:
        parts = time_string.split()
        if len(parts) >= 2:
            value = float(parts[0])
            unit = parts[1].lower()
            
            if 'year' in unit:
                return value
            elif 'month' in unit:
                return value / 12
            else:
                return 0
        return 0
    except Exception:
        return 0

@app.route('/predict', methods=['POST'])
def predict():
    request_data = request.get_json()
    if not request_data or 'query' not in request_data:
        logger.error("Request missing query")
        return jsonify({"error": "Please provide a query"}), 400

    if 'user_profile' not in request_data or not request_data['user_profile']:
        logger.error("Request missing user_profile")
        return jsonify({"error": "User profile is required"}), 400

    user_profile = request_data['user_profile']
    query = request_data['query']
    logger.info(f"Received user data for query '{query}': {json.dumps(user_profile, indent=2)}")

    # Special bypass check for managers requesting performance data
    is_performance_query = check_performance_related(query)
    user_role = user_profile.get("user_role", "").lower()
    is_manager_or_higher = "manager" in user_role or "director" in user_role or "executive" in user_role or "lead" in user_role
    
    # Calculate years of experience (from either field)
    years_of_service = calculate_experience_years(user_profile.get("employee_join_date"))
    time_in_role = parse_time_in_position(user_profile.get("time_in_position", "0 years"))
    experience_years = max(years_of_service, time_in_role)
    
    department = user_profile.get("department", "Unknown")
    past_violations = user_profile.get("past_violations", 0)
    employee_status = user_profile.get("employee_status", "")
    
    inferred_data = get_gemini_response(query, user_profile)

    if "error" in inferred_data:
        logger.error(f"Gemini response error: {inferred_data['error']}")
        return jsonify({"error": inferred_data["error"]}), 500

    request_obj = {
        "user_role": user_profile.get("user_role", "Employee"),
        "department": department,
        "employee_status": employee_status,
        "resource_sensitivity": inferred_data.get("resource_sensitivity", "public"),
        "request_reason": inferred_data.get("request_reason", "Routine check"),
        "past_violations": past_violations
    }
    
    # Apply manager bypass rule - automatically approve if conditions are met
    manager_bypass = False
    bypass_reason = ""
    
    if (is_manager_or_higher and 
        is_performance_query and 
        experience_years >= 2 and 
        employee_status == "Full-time" and 
        past_violations < 2):
        manager_bypass = True
        bypass_reason = f"Bypass - Manager with {experience_years} years experience requesting performance data"
        logger.info(f"Manager bypass activated: {bypass_reason}")
    
    logger.info(f"Processed request object for model: {json.dumps(request_obj, indent=2)}")
    
    # If manager bypass is active, skip the normal prediction flow
    if manager_bypass:
        final_prediction = 1
        rule_status = bypass_reason
    else:
        request_df = pd.DataFrame([request_obj])
        X_req = request_df[selected_features]

        if request_obj["employee_status"] == "Terminated" and request_obj["resource_sensitivity"] in ["restricted", "confidential"]:
            final_prediction = 0
            rule_status = "Denied - Terminated employee"
        elif request_obj["request_reason"] == "Personal use" and request_obj["resource_sensitivity"] in ["restricted", "confidential"]:
            final_prediction = 0
            rule_status = "Denied - Personal use not allowed for sensitive resources"
        else:
            X_req_processed = preprocessor.transform(X_req)
            X_req_rnn = X_req_processed.reshape((1, 1, X_req_processed.shape[1]))
            rnn_pred_proba = float(rnn_model.predict(X_req_rnn, verbose=0)[0][0])
            
            # Log the probability for debugging
            logger.info(f"RNN prediction probability: {rnn_pred_proba}")
            
            rnn_pred = 1 if rnn_pred_proba > 0.65 else 0

            if rnn_pred == 0:
                final_prediction = 0
                rule_status = "Denied - Model prediction"
            else:
                anomaly_score = int(anomaly_model.predict(X_req_processed)[0])
                anomaly_score_value = float(anomaly_model.score_samples(X_req_processed)[0])
                if anomaly_score == -1:
                    final_prediction = 1  # Approve but flag
                    rule_status = "Approved but flagged as anomaly"
                else:
                    final_prediction = 1
                    rule_status = "Approved"

    response = {
        "query": query,
        "inferred_data": inferred_data,
        "final_decision": {
            "approved": bool(final_prediction),
            "status": rule_status,
            "reason": rule_status
        }
    }
    
    logger.info(f"Prediction response: {json.dumps(response, indent=2)}")
    return jsonify(response)

@app.route('/health', methods=['GET'])
def health_check():
    logger.info("Health check requested")
    return jsonify({"status": "healthy", "models_loaded": True})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)