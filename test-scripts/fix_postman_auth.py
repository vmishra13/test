#!/usr/bin/env python3
import json
import re

def main():
    # Read the collection file
    with open('postman/ReliaCare APIs.postman_collection.json', 'r') as f:
        content = f.read()
    
    # Remove Authorization headers using regex
    # Pattern to match authorization header objects
    auth_pattern = r',?\s*{\s*"key":\s*"Authorization",\s*"value":\s*"Bearer {{RELIACARE_X_AUTH_TOKEN}}"\s*}'
    
    content = re.sub(auth_pattern, '', content)
    
    # Clean up any resulting empty arrays or trailing commas
    content = re.sub(r'(\[\s*),', r'\1', content)  # Remove commas after opening brackets
    content = re.sub(r',(\s*\])', r'\1', content)   # Remove commas before closing brackets
    
    # Write the updated collection back
    with open('postman/ReliaCare APIs.postman_collection.json', 'w') as f:
        f.write(content)
    
    print("✅ Successfully removed Authorization headers from all endpoints")
    print("🔧 All endpoints will now inherit authorization from the collection level")

if __name__ == '__main__':
    main()
