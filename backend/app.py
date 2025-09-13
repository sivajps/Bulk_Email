from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
import pandas as pd
from dotenv import load_dotenv
import time
import io

load_dotenv()

app = Flask(__name__)
CORS(app)

# SMTP Configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = os.getenv("SMTP_USER")
EMAIL_PASSWORD = os.getenv("SMTP_PASS")

def read_emails_from_excel(file_content):
    """
    Read email addresses from Excel file
    Supports multiple column names and formats
    """
    try:
        # Try to read Excel file
        df = pd.read_excel(io.BytesIO(file_content))
        
        # Look for email column (case insensitive)
        email_columns = ['email', 'Email', 'EMAIL', 'mail', 'Mail', 'MAIL', 
                        'email_address', 'Email_Address', 'emailaddress']
        
        email_column = None
        for col in email_columns:
            if col in df.columns:
                email_column = col
                break
        
        if not email_column:
            # If no standard column found, take first column
            email_column = df.columns[0]
        
        # Extract emails and remove duplicates/empty values
        emails = df[email_column].dropna().unique().tolist()
        
        # Filter valid email addresses (basic validation)
        valid_emails = []
        for email in emails:
            email = str(email).strip()
            if '@' in email and '.' in email:
                valid_emails.append(email)
        
        return valid_emails, None
        
    except Exception as e:
        return [], str(e)

@app.route('/api/upload-excel', methods=['POST'])
def upload_excel():
    """
    Upload Excel file and extract email addresses
    """
    try:
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "No file uploaded"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"success": False, "error": "No file selected"}), 400
        
        # Check file extension
        if not file.filename.lower().endswith(('.xlsx', '.xls', '.csv')):
            return jsonify({"success": False, "error": "Invalid file format. Please upload Excel or CSV file"}), 400
        
        # Read file content
        file_content = file.read()
        
        # Extract emails from Excel
        emails, error = read_emails_from_excel(file_content)
        
        if error:
            return jsonify({"success": False, "error": f"Error reading file: {error}"}), 400
        
        if not emails:
            return jsonify({"success": False, "error": "No valid email addresses found in the file"}), 400
        
        return jsonify({
            "success": True, 
            "emails": emails,
            "count": len(emails),
            "message": f"Successfully extracted {len(emails)} email addresses"
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/send-bulk-email', methods=['POST'])
def send_bulk_email():
    try:
        data = request.get_json()
        recipients = data.get('to', [])
        cc_recipients = data.get('cc', '').split(',') if data.get('cc') else []
        bcc_recipients = data.get('bcc', '').split(',') if data.get('bcc') else []
        subject = data.get('subject', '')
        html_content = data.get('content', '')
        
        if not recipients:
            return jsonify({"success": False, "error": "No recipients provided"}), 400
        
        # Setup SMTP connection
        context = ssl.create_default_context()
        
        sent_count = 0
        failed_emails = []
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls(context=context)
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            
            # Send to each recipient individually
            for recipient in recipients:
                try:
                    # Create message
                    msg = MIMEMultipart('alternative')
                    msg['From'] = EMAIL_ADDRESS
                    msg['To'] = recipient.strip()
                    msg['Subject'] = subject
                    
                    # Add CC if provided
                    if cc_recipients:
                        msg['Cc'] = ', '.join([cc.strip() for cc in cc_recipients if cc.strip()])
                    
                    # Create HTML part
                    html_part = MIMEText(html_content, 'html')
                    msg.attach(html_part)
                    
                    # Combine all recipients
                    all_recipients = [recipient.strip()]
                    all_recipients.extend([cc.strip() for cc in cc_recipients if cc.strip()])
                    all_recipients.extend([bcc.strip() for bcc in bcc_recipients if bcc.strip()])
                    
                    # Send email
                    server.sendmail(EMAIL_ADDRESS, all_recipients, msg.as_string())
                    sent_count += 1
                    print(f"Email sent successfully to: {recipient}")
                    
                    # Add delay to avoid rate limiting (1 second between emails)
                    time.sleep(1)
                    
                except Exception as e:
                    failed_emails.append({"email": recipient, "error": str(e)})
                    print(f"Failed to send to {recipient}: {str(e)}")
        
        return jsonify({
            "success": True,
            "message": f"Bulk email process completed",
            "sent_count": sent_count,
            "failed_count": len(failed_emails),
            "failed_emails": failed_emails
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
