import os
import pickle
from flask import Flask, request, jsonify, render_template
from main import verify_gmail_login
import smtplib
import pandas as pd
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
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
 
@app.route("/send_bulk", methods=["POST"])
def send_bulk():
    #  Step 1: Check credentials
    if not os.path.exists("credentials.pkl"):
        return jsonify({"success": False, "message": "Email not configured"}), 400
 
    with open("credentials.pkl", "rb") as f:
        creds = pickle.load(f)
    sender_email = creds["email"]
    sender_pass = creds["app_password"]
 
    # Step 2: Validate request fields
    if "file" not in request.files:
        return jsonify({"success": False, "message": "Excel file required"}), 400
 
    file = request.files["file"]
    subject = request.form.get("subject")
    content = request.form.get("content")
    cc = request.form.get("cc")
    bcc = request.form.get("bcc")
    attachment = request.files.get("attachment")
 
    if not subject or not content:
        return jsonify({"success": False, "message": "Subject and Content required"}), 400
 
    # ✅ Step 3: Read Excel file for recipients
    try:
        df = pd.read_excel(file)
        if "Email" not in df.columns:
            return jsonify({"success": False, "message": "Excel must have 'Email' column"}), 400
        recipients = df["Email"].dropna().tolist()
    except Exception as e:
        return jsonify({"success": False, "message": f"Excel read error: {str(e)}"}), 400
 
    # ✅ Step 4: Setup SMTP
    SMTP_SERVER = "smtp.gmail.com"
    PORT = 587
    results = {}
 
    try:
        server = smtplib.SMTP(SMTP_SERVER, PORT)
        server.starttls()
        server.login(sender_email, sender_pass)
    except Exception as e:
        return jsonify({"success": False, "message": f"SMTP login failed: {str(e)}"}), 500
 
    # ✅ Step 5: Send emails
    for email in recipients:
        try:
            msg = MIMEMultipart()
            msg["From"] = sender_email
            msg["To"] = email
            msg["Subject"] = subject
 
            if cc:
                msg["Cc"] = cc
            if bcc:
                msg["Bcc"] = bcc
 
            msg.attach(MIMEText(content, "plain"))
 
            # Attach file if provided
            if attachment:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(attachment.read())
                encoders.encode_base64(part)
                part.add_header("Content-Disposition", f"attachment; filename={attachment.filename}")
                msg.attach(part)
 
            all_recipients = [email]
            if cc:
                all_recipients += [cc]
            if bcc:
                all_recipients += [bcc]
 
            server.sendmail(sender_email, all_recipients, msg.as_string())
            results[email] = "sent ✅"
        except Exception as e:
            results[email] = f"failed ❌ ({str(e)})"
 
    server.quit()
 
    return jsonify({"success": True, "results": results})
 
 
if __name__ == "__main__":
    app.run('0.0.0.0',port=5000,debug=True)