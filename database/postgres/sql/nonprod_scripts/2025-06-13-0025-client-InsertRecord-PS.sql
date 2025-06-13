-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN
   IF NOT EXISTS (
        SELECT * from client where name = 'Regional Medical Center'
    )
    THEN

    INSERT INTO client
( "name", description, "timeZone", status, logo, "favIcon", "language", website, "extraInfo", "crUser", "crDate", "modUser", "modDate")
VALUES( 'Regional Medical Center', 'A comprehensive healthcare facility providing specialized medical services, emergency care, and outpatient treatments to the regional community.', 
'America/Chicago', 1, 'https://assets.relicare.com/logos/regional-medical-center.png', 'https://assets.relicare.com/favicons/regional-medical-center.ico',
 'en', 'https://www.regionalmedcenter.com', '{
        "type": "medical_center",
        "specialties": ["Emergency Care", "Cardiology", "Orthopedics", "Radiology"],
        "bedCount": 150,
        "emergencyServices": true,
        "accreditation": "Joint Commission",
        "establishedYear": 1985,
        "address": {
            "street": "456 Healthcare Blvd",
            "city": "Medical City",
            "state": "Texas",
            "zipCode": "75001",
            "country": "USA"
        },
        "contact": {
            "phone": "+1-555-234-5678",
            "fax": "+1-555-234-5679",
            "emergencyPhone": "+1-555-911-2345"
        },
        "services": [
            "24/7 Emergency Room",
            "Surgical Services",
            "Diagnostic Imaging",
            "Laboratory Services",
            "Pharmacy",
            "Physical Therapy"
        ]
    }', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP);


 
END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
