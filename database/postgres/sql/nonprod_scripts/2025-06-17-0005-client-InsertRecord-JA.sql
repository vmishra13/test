-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateHealthPartnersClient()
LANGUAGE plpgsql
AS $$
BEGIN
   IF NOT EXISTS (
        SELECT * from client where name = 'HealthPartners Medical Group'
    )
    THEN

    INSERT INTO client
( "name", description, "timeZone", status, logo, "favIcon", "language", website, "extraInfo", "crUser", "crDate", "modUser", "modDate")
VALUES( 'HealthPartners Medical Group', 'A leading integrated healthcare delivery system providing primary care, specialty services, and wellness programs across multiple locations with a focus on preventive care and patient-centered treatment.', 
'America/New_York', 1, 'https://assets.relicare.com/logos/healthpartners-medical.png', 'https://assets.relicare.com/favicons/healthpartners-medical.ico',
 'en', 'https://www.healthpartners.com', '{
        "type": "medical_group",
        "specialties": ["Primary Care", "Internal Medicine", "Pediatrics", "Dermatology", "Endocrinology", "Gastroenterology"],
        "locations": 8,
        "providersCount": 45,
        "preventiveCare": true,
        "accreditation": "NCQA Patient-Centered Medical Home",
        "establishedYear": 1992,
        "address": {
            "street": "789 Wellness Drive",
            "city": "New York",
            "state": "New York",
            "zipCode": "10001",
            "country": "USA"
        },
        "contact": {
            "phone": "+1-212-555-7890",
            "fax": "+1-212-555-7891",
            "appointmentLine": "+1-212-555-CARE"
        },
        "services": [
            "Primary Care Services",
            "Preventive Health Screenings",
            "Chronic Disease Management",
            "Telemedicine Consultations",
            "Wellness Programs",
            "Women''s Health Services",
            "Pediatric Care",
            "Mental Health Counseling",
            "Nutrition Counseling",
            "Immunizations"
        ],
        "insurance": [
            "Medicare",
            "Medicaid",
            "Blue Cross Blue Shield",
            "Aetna",
            "Cigna",
            "UnitedHealthcare",
            "Humana"
        ],
        "qualityMetrics": {
            "patientSatisfactionScore": 4.7,
            "waitTimeAverage": "15 minutes",
            "appointmentAvailability": "Same day or next day",
            "chronicCareManagement": true
        }
    }', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP);

END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateHealthPartnersClient();
