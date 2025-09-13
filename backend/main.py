import smtplib

def verify_gmail_login(email, app_password):
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(email, app_password)  
        server.quit()
        return True, "Login successful ✅"
    except smtplib.SMTPAuthenticationError:
        return False, "Authentication failed ❌: Invalid Gmail or App Password"
    except Exception as e:
        return False, f"Error: {str(e)}"