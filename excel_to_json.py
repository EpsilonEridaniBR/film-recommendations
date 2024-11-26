import pandas as pd
import json


# Load the Excel file and convert it to JSON structure
def convert_excel_to_json(excel_path, json_path):
    # Read the Excel file
    df = pd.read_excel(excel_path, na_filter=[''], keep_default_na=False)

    # Transform data into the desired JSON structure
    films_data = {}
    for _, row in df.iterrows():
        recommendations = [
            {"title": row[f"Recommendation {i}"],
             "reason": row[f"Reason {i}"] or ""}
            for i in range(1, 4)
            if row[f"Recommendation {i}"]
        ]

        films_data[row["Title"]] = {
            "year": int(row["Year"]) if pd.notna(row["Year"]) else None,
            "author": row["Initials"] or "",
            "description": row["Description"] or "",
            "recommendations": recommendations,
        }

    # Write JSON data to the output file
    with open(json_path, "w") as json_file:
        json.dump(films_data, json_file, indent=4)


# Paths for the Excel and JSON files
excel_path = "films.xlsx"
json_path = "films.json"

# Convert the Excel file to JSON
convert_excel_to_json(excel_path, json_path)
