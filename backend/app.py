from main import verify_gmail_login
from flask import Flask, request, jsonify,render_template


app = Flask(__name__)

@app.route("/")
def home():
     return render_template("index.html") 

@app.route("/verify", methods=["POST"])
def verify():
    data = request.json
    email = data.get("email")
    app_password = data.get("app_password")

    if not email or not app_password:
        return jsonify({"success": False, "message": "Email or App Password required"}), 400

    ok, msg = verify_gmail_login(email, app_password)

    return jsonify({"verify": True, "message": msg})

if __name__ == "__main__":
    app.run(debug=True)
