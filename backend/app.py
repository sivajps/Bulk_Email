import os
import pickle
import smtplib
import psycopg2
import pandas as pd
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from main import verify_gmail_login
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

app = Flask(__name__)
CORS(app)

# ✅ PostgreSQL connection config
DB_CONFIG = {
    "dbname": "BulkEmail",
    "user": "postgres",
    "password": "0303",
    "host": "localhost",
    "port": "5432"
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)


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

@app.route("/recent_bulk", methods=["GET"])
def get_recent_bulk():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        # Fetch last 5 bulk sends
        cur.execute("""
            SELECT id, subject, sender_email, sent_time, success_count, failed_count
            FROM bulk_summary
            ORDER BY sent_time DESC
            LIMIT 5;
        """)
        bulk_rows = cur.fetchall()

        bulk_data = []
        for row in bulk_rows:
            bulk_id, subject, sender_email, sent_time, success_count, failed_count = row

            # Get history (who failed, who succeeded)
            cur.execute("""
                SELECT email, status FROM bulk_history WHERE bulk_id = %s;
            """, (bulk_id,))
            history = cur.fetchall()
            sent_emails = [h[0] for h in history if h[1] == "sent"]
            failed_emails = [h[0] for h in history if h[1] == "failed"]

            bulk_data.append({
                "id": bulk_id,
                "subject": subject,
                "sender_email": sender_email,
                "sent_time": sent_time.isoformat(),
                "success_count": success_count,
                "failed_count": failed_count,
                "sent_emails": sent_emails,
                "failed_emails": failed_emails,
            })

        cur.close()
        conn.close()

        return jsonify({"success": True, "data": bulk_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route("/send_bulk", methods=["POST"])
def send_bulk():
    # Step 1: Check credentials
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

    # Step 3: Read Excel file for recipients
    try:
        df = pd.read_excel(file)
        if "Email" not in df.columns:
            return jsonify({"success": False, "message": "Excel must have 'Email' column"}), 400
        recipients = df["Email"].dropna().tolist()
    except Exception as e:
        return jsonify({"success": False, "message": f"Excel read error: {str(e)}"}), 400

    # Step 4: Setup SMTP
    SMTP_SERVER = "smtp.gmail.com"
    PORT = 587
    results = {}

    try:
        server = smtplib.SMTP(SMTP_SERVER, PORT)
        server.starttls()
        server.login(sender_email, sender_pass)
    except Exception as e:
        return jsonify({"success": False, "message": f"SMTP login failed: {str(e)}"}), 500

    # Step 5: Send emails
    success_count, failed_count = 0, 0
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
            success_count += 1
        except Exception as e:
            results[email] = f"failed ❌ ({str(e)})"
            failed_count += 1

    server.quit()

    # Step 6: Save results in PostgreSQL
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Insert into summary
        cur.execute(
            """
            INSERT INTO bulk_summary (subject, sender_email, success_count, failed_count, sent_time)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id;
            """,
            (subject, sender_email, success_count, failed_count, datetime.utcnow())
        )
        bulk_id = cur.fetchone()[0]

        # Insert into history
        for email, status_msg in results.items():
            status = "sent" if "sent" in status_msg else "failed"
            error_message = None if status == "sent" else status_msg
            cur.execute(
                """
                INSERT INTO bulk_history (bulk_id, email, status, error_message)
                VALUES (%s, %s, %s, %s);
                """,
                (bulk_id, email, status, error_message)
            )

        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        return jsonify({"success": False, "message": f"DB insert failed: {str(e)}"}), 500

    return jsonify({
        "success": True,
        "summary": {
            "bulk_id": bulk_id,
            "subject": subject,
            "sender_email": sender_email,
            "success_count": success_count,
            "failed_count": failed_count
        },
        "results": results
    })


if __name__ == "__main__":
    app.run("0.0.0.0", port=5000, debug=True)
