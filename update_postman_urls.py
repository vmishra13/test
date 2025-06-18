#!/usr/bin/env python3
import json
import sys

def update_postman_urls(file_path):
    with open(file_path, 'r') as f:
        collection = json.load(f)
    
    def update_url_objects(obj):
        if isinstance(obj, dict):
            if 'url' in obj and isinstance(obj['url'], dict):
                url_obj = obj['url']
                # Add protocol and port if they don't exist
                if 'protocol' not in url_obj:
                    url_obj['protocol'] = '{{PROTOCOL}}'
                if 'port' not in url_obj:
                    url_obj['port'] = '{{PORT}}'
            
            # Recursively update nested objects
            for key, value in obj.items():
                update_url_objects(value)
        elif isinstance(obj, list):
            for item in obj:
                update_url_objects(item)
    
    update_url_objects(collection)
    
    with open(file_path, 'w') as f:
        json.dump(collection, f, indent='\t')

if __name__ == '__main__':
    file_path = sys.argv[1] if len(sys.argv) > 1 else 'postman/ReliaCare APIs.postman_collection.json'
    update_postman_urls(file_path)
    print(f"Updated URL objects in {file_path}")
