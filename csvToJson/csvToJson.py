import csv
import json

def csv_to_json(csv_file_path, json_file_path, path_array):
    # Read the CSV and add to a dictionary
    data = []
    for i in path_array:
        with open(i, encoding='utf-8') as csv_file:
            csv_reader = csv.DictReader(csv_file)
            for row in csv_reader:
                data.append(row)

    # Write the dictionary to a JSON file
    with open(json_file_path, 'w', encoding='utf-8') as json_file:
        json.dump(data, json_file, indent=4)

# Example usage
path_array = ['selected.csv', 'selected (1).csv', 'selected (2).csv', 'selected (3).csv', 'selected (4).csv', 'selected (5).csv',]
csv_file_path = 'selected.csv'  # replace with your csv file path
json_file_path = 'output.json'  # replace with your desired json output file path
csv_to_json(csv_file_path, json_file_path, path_array)


def reformat_json(input_file, output_file):
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    reformatted_data = []
    
    for entry in data:
        # Convert the thumbnails string to a list of dictionaries
        thumbnails = json.loads(entry["thumbnails"])
        
        # Extract the 'S' values from each dictionary in the thumbnails list
        thumbnails_urls = [item['S'] for item in thumbnails]
        
        # Create a new dictionary with the desired format
        new_entry = {
            "job_id": entry["job_id"],
            "clip_id": entry["clip_id"],
            "created": entry["created"],
            "job_status": entry["job_status"],
            "last_updated": entry["last_updated"],
            "source": entry["source"],
            "source_file": entry["source_file"],
            "thumbnails": thumbnails_urls
        }
        
        reformatted_data.append(new_entry)
    
    # Write the reformatted data to the output file
    with open(output_file, 'w') as f:
        json.dump(reformatted_data, f, indent=4)

# Example usage
reformat_json(json_file_path, json_file_path)