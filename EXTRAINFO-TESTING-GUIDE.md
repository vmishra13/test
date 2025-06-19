# ExtraInfo Testing Guide

This guide will help you test the `extraInfo` field updates in the ReliaCare backend using Postman and curl commands.

## 1. Understanding ExtraInfo Structure

The `extraInfo` field supports the following structure:

```json
{
  "preferences": {
    "theme": "light" | "dark",
    "language": "en" | "es" | "fr" | etc (2-5 chars),
    "notifications": {
      "email": true | false,
      "sms": true | false,
      "push": true | false
    },
    "timezone": "America/New_York"
  },
  "medical": {
    "allergies": ["Peanuts", "Shellfish"],
    "conditions": ["Diabetes", "Hypertension"],
    "emergencyContact": {
      "name": "John Doe",
      "phone": "+1-555-1234",
      "relationship": "Spouse"
    }
  },
  "profile": {
    "bio": "Brief bio up to 500 characters",
    "socialLinks": {
      "linkedin": "https://linkedin.com/in/username",
      "twitter": "https://twitter.com/username"
    }
  },
  "custom": {
    "any_custom_field": "any_value",
    "department": "Cardiology",
    "employee_id": "E12345"
  }
}
```

## 2. Test Cases

### Test Case 1: Create Initial ExtraInfo

**Endpoint:** `PUT /users/:userId`

**Body:**

```json
{
  "firstName": "John",
  "extraInfo": {
    "preferences": {
      "theme": "dark",
      "language": "en",
      "notifications": {
        "email": true,
        "sms": false,
        "push": true
      },
      "timezone": "America/New_York"
    },
    "profile": {
      "bio": "Healthcare professional with 10 years of experience"
    }
  }
}
```

### Test Case 2: Update Existing ExtraInfo (Merge)

**Endpoint:** `PUT /users/:userId`

**Body:**

```json
{
  "extraInfo": {
    "preferences": {
      "theme": "light",
      "notifications": {
        "email": false
      }
    },
    "medical": {
      "allergies": ["Peanuts"],
      "emergencyContact": {
        "name": "Jane Doe",
        "phone": "+1-555-5678",
        "relationship": "Sister"
      }
    }
  }
}
```

**Expected Result:** The new data should merge with existing extraInfo, keeping other fields intact.

### Test Case 3: Add Custom Fields

**Endpoint:** `PUT /users/:userId`

**Body:**

```json
{
  "extraInfo": {
    "custom": {
      "department": "Cardiology",
      "employee_id": "E12345",
      "certification": "Board Certified"
    }
  }
}
```

### Test Case 4: Clear ExtraInfo

**Endpoint:** `PUT /users/:userId`

**Body:**

```json
{
  "extraInfo": null
}
```

### Test Case 5: Invalid ExtraInfo (Should Fail)

**Endpoint:** `PUT /users/:userId`

**Body:**

```json
{
  "extraInfo": {
    "preferences": {
      "theme": "invalid_theme",
      "language": "x",
      "notifications": {
        "email": "not_boolean"
      }
    }
  }
}
```

**Expected Result:** Validation error

## 3. Postman Collection Setup

### Environment Variables

Set these in your Postman environment:

```json
{
  "baseUrl": "http://localhost:3000",
  "authToken": "Bearer your_jwt_token_here",
  "testUserId": "123"
}
```

### Headers for All Requests

```
Authorization: {{authToken}}
Content-Type: application/json
```

## 4. Debugging Steps

### Step 1: Check Current User Data

```bash
curl -X GET "{{baseUrl}}/users/{{testUserId}}" \
  -H "Authorization: {{authToken}}" \
  -H "Content-Type: application/json"
```

### Step 2: Simple Update Test

```bash
curl -X PUT "{{baseUrl}}/users/{{testUserId}}" \
  -H "Authorization: {{authToken}}" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated Name",
    "extraInfo": {
      "test": "simple value"
    }
  }'
```

### Step 3: Check Validation Errors

Look for these common issues:

- Invalid JSON format
- Field type mismatches
- Missing required fields
- URL validation for social links

## 5. Expected Responses

### Successful Update

```json
{
  "success": true,
  "data": {
    "id": 123,
    "firstName": "Updated Name",
    "extraInfo": {
      "preferences": { ... },
      "medical": { ... },
      "profile": { ... },
      "custom": { ... }
    },
    "modUser": "current_user_login",
    "modDate": "2024-01-XX..."
  },
  "message": "User updated successfully"
}
```

### Validation Error

```json
{
  "error": {
    "type": "ValidationError",
    "message": "Invalid extraInfo format",
    "details": [
      {
        "field": "extraInfo.preferences.theme",
        "message": "Invalid enum value. Expected 'light' | 'dark', received 'invalid_theme'"
      }
    ]
  }
}
```

## 6. Server-Side Debugging

If you need to debug on the server side, add these logs to `user.service.ts`:

```typescript
// In validateUpdateRequestBody function
console.log('🔍 Raw extraInfo received:', extraInfo);
console.log('🔍 Type of extraInfo:', typeof extraInfo);

// In performUserUpdate function
console.log('🔍 Existing user extraInfo:', existingUser.extraInfo);
console.log('🔍 New extraInfo to merge:', validatedData.extraInfo);
console.log('🔍 Merged result:', sanitizedExtraInfo);
```

## 7. Common Issues and Solutions

### Issue 1: ExtraInfo Not Updating

**Symptoms:** Request succeeds but extraInfo remains unchanged
**Debugging:**

1. Check if extraInfo is being passed correctly in the request
2. Verify validation is passing
3. Check merge logic in `performUserUpdate`

### Issue 2: Validation Errors

**Symptoms:** 400 Bad Request with validation errors
**Solutions:**

1. Check JSON format
2. Verify field types match schema
3. Ensure URLs are valid format

### Issue 3: Authorization Errors

**Symptoms:** 403 Forbidden
**Solutions:**

1. Verify user has permission to update the target user
2. Check role-based access control
3. Ensure client ID matches for CLIENT_ADMIN users

## 8. Test Script Automation

You can use this Node.js script to automate testing:

```javascript
// See test-extrainfo-update.js in the next file
```
