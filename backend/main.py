import smtplib
import pickle

def verify_gmail_login(email, app_password):
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(email, app_password)  
        server.quit()

        # ✅ Save credentials to pickle file
        with open("credentials.pkl", "wb") as f:
            pickle.dump({"email": email, "app_password": app_password}, f)

        return True, "Login successful ✅ (credentials stored)"
    except smtplib.SMTPAuthenticationError:
        return False, "Authentication failed ❌: Invalid Gmail or App Password"
    except Exception as e:
        return False, f"Error: {str(e)}"
 