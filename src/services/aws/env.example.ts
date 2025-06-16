/**
 * AWS Environment Variables Configuration
 * 
 * Copy this to your .env file and fill in the appropriate values
 */

export const AWS_ENV_VARIABLES = `
# ===================================================================
# AWS CONFIGURATION
# ===================================================================

# AWS Region (e.g., us-east-1, us-west-2, eu-west-1)
AWS_REGION=us-east-1

# AWS Access Credentials (use IAM roles in production)
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_SESSION_TOKEN=your_session_token_here  # Optional, for temporary credentials

# ===================================================================
# SES (Simple Email Service) CONFIGURATION
# ===================================================================

# Default sender email (must be verified in SES)
SES_DEFAULT_FROM_EMAIL=noreply@reliacare.com

# ===================================================================
# SNS (Simple Notification Service) CONFIGURATION
# ===================================================================

# Platform Application ARNs for Push Notifications
SNS_APNS_PLATFORM_APP_ARN=arn:aws:sns:us-east-1:123456789012:app/APNS/ReliaCare-iOS
SNS_APNS_SANDBOX_PLATFORM_APP_ARN=arn:aws:sns:us-east-1:123456789012:app/APNS_SANDBOX/ReliaCare-iOS-Dev
SNS_FCM_PLATFORM_APP_ARN=arn:aws:sns:us-east-1:123456789012:app/FCM/ReliaCare-Android

# Topic ARNs for different notification types
SNS_EMERGENCY_ALERTS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:emergency-alerts
SNS_APPOINTMENT_REMINDERS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:appointment-reminders
SNS_MEDICATION_REMINDERS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:medication-reminders

# ===================================================================
# S3 (Simple Storage Service) CONFIGURATION
# ===================================================================

# Default S3 bucket for file storage
S3_DEFAULT_BUCKET=reliacare-storage

# S3 bucket for patient documents
S3_PATIENT_DOCUMENTS_BUCKET=reliacare-patient-docs

# S3 bucket for medical images
S3_MEDICAL_IMAGES_BUCKET=reliacare-medical-images

# S3 bucket for exercise videos
S3_EXERCISE_VIDEOS_BUCKET=reliacare-exercise-content

# S3 bucket for backups
S3_BACKUPS_BUCKET=reliacare-backups

# ===================================================================
# SECRETS MANAGER CONFIGURATION
# ===================================================================

# Secret names for different credentials
SECRET_JWT_SECRET_NAME=reliacare/jwt-secret
SECRET_DB_CREDENTIALS_NAME=reliacare/database-credentials
SECRET_FHIR_CREDENTIALS_PREFIX=reliacare/fhir-credentials
SECRET_ENCRYPTION_KEYS_NAME=reliacare/encryption-keys

# ===================================================================
# MOBILE PUSH NOTIFICATION CREDENTIALS
# ===================================================================

# iOS APNS Credentials (stored in Secrets Manager)
APNS_CERTIFICATE_SECRET_NAME=reliacare/apns-certificate
APNS_PRIVATE_KEY_SECRET_NAME=reliacare/apns-private-key
APNS_TEAM_ID=your_apple_team_id
APNS_KEY_ID=your_apple_key_id
APNS_BUNDLE_ID=com.reliacare.app

# Android FCM Credentials (stored in Secrets Manager)
FCM_SERVER_KEY_SECRET_NAME=reliacare/fcm-server-key
FCM_PROJECT_ID=reliacare-firebase-project
`;

// Usage instructions
export const SETUP_INSTRUCTIONS = `
# ===================================================================
# AWS SERVICES SETUP INSTRUCTIONS
# ===================================================================

## 1. SES Setup
1. Verify your sender email addresses in AWS SES console
2. Request production access if needed (to send to unverified emails)
3. Create email templates for appointment reminders, medication alerts, etc.

## 2. SNS Setup for Push Notifications

### iOS (APNS) Setup:
1. Create APNS certificate in Apple Developer Console
2. Upload certificate to AWS SNS Platform Applications
3. Create platform application for production (APNS) and development (APNS_SANDBOX)

### Android (FCM) Setup:
1. Create Firebase project and get Server Key
2. Store FCM Server Key in AWS Secrets Manager
3. Create platform application for FCM in AWS SNS

### Topic Setup:
1. Create SNS topics for different notification types
2. Set up subscriptions for different user groups

## 3. S3 Setup
1. Create S3 buckets for different file types
2. Configure bucket policies for security
3. Set up lifecycle rules for automatic archiving

## 4. Secrets Manager Setup
1. Store sensitive credentials in Secrets Manager
2. Set up rotation policies for database credentials
3. Configure IAM policies for secret access

## 5. IAM Permissions
Ensure your AWS credentials have the following permissions:
- SES: SendEmail, SendTemplatedEmail, CreateTemplate
- SNS: Publish, CreatePlatformApplication, CreatePlatformEndpoint
- S3: GetObject, PutObject, DeleteObject, ListBucket
- Secrets Manager: GetSecretValue, CreateSecret, UpdateSecret

## 6. Environment Variables
Copy the environment variables above to your .env file and customize
`;