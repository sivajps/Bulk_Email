# Creating an Excel template `emails.xlsx` with sample rows for the bulk email project.
import pandas as pd

# Template columns and example rows
data = [
    { "Email": "scarydare13@gmail.com"},
    { "Email": "sivajps112002@gmail.com"},
    {"Email":"itsmegodgamer@gmail.com"},
    {"Email":"iam.vetrivel.r@gmail.com"}]

df = pd.DataFrame(data, columns= ["Email"])

output_path = "emails.xlsx"
df.to_excel(output_path, index=False)

try:
    from caas_jupyter_tools import display_dataframe_to_user
    display_dataframe_to_user("emails.xlsx (sample rows)", df)
except Exception as e:
    print("Could not use display helper, showing DataFrame below.")
    print(df)

print(f"\nSaved Excel template to: {output_path}")
