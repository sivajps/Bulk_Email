import os
import pickle
from flask import Flask, request, jsonify, render_template
from main import verify_gmail_login
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
@app.route("/")
def home():
    return "bulk email service is running"

@app.route("/verify", methods=["POST"])
def verify():
    if os.path.exists("credentials.pkl"):
        with open("credentials.pkl", "rb") as f:
            creds = pickle.load(f)
        return jsonify({
            "verify": True,
            "message": f"Already configured for {creds['email']}"
        }), 200

    data = request.json
    email = data.get("email")
    app_password = data.get("app_password")

    if not email or not app_password:
        return jsonify({
            "success": False,
            "message": "Email or App Password required"
        }), 400

    ok, msg = verify_gmail_login(email, app_password)

    return jsonify({
        "verify": ok,
        "message": msg
    })

if __name__ == "__main__":
    app.run('0.0.0.0',port=5000,debug=True)
