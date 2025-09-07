-- Seed script for users table with OKTA SCIM 2.0 sample data
-- This script simulates users that would be sent from OKTA via SCIM 2.0 protocol
-- Run this against your PostgreSQL database

BEGIN;

-- Create a sample organization if it doesn't exist
-- (assuming organization ID 1 for this seed data)
INSERT INTO organizations (id, name, created_at, updated_at) 
VALUES (1, 'ACME Corporation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Insert sample users that simulate OKTA SCIM 2.0 data
-- Each user represents data that would typically come from OKTA's SCIM provisioning

-- User 1: John Doe (Active)
-- SCIM userName: john.doe@acmecorp.com
-- SCIM name: { "formatted": "John Doe", "familyName": "Doe", "givenName": "John", "middleName": "Michael" }
-- SCIM emails: [{ "value": "john.doe@acmecorp.com", "type": "work", "primary": true }]
-- SCIM active: true
INSERT INTO users (org_id, email, status, created_at, updated_at)
VALUES (1, 'john.doe@acmecorp.com', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- User 2: Jane Smith (Active)  
-- SCIM userName: jane.smith@acmecorp.com
-- SCIM name: { "formatted": "Jane Smith", "familyName": "Smith", "givenName": "Jane" }
-- SCIM emails: [{ "value": "jane.smith@acmecorp.com", "type": "work", "primary": true }]
-- SCIM active: true
INSERT INTO users (org_id, email, status, created_at, updated_at)
VALUES (1, 'jane.smith@acmecorp.com', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- User 3: Mike Wilson (Active)
-- SCIM userName: mike.wilson@acmecorp.com  
-- SCIM name: { "formatted": "Mike Wilson", "familyName": "Wilson", "givenName": "Mike" }
-- SCIM emails: [{ "value": "mike.wilson@acmecorp.com", "type": "work", "primary": true }]
-- SCIM active: true
INSERT INTO users (org_id, email, status, created_at, updated_at)
VALUES (1, 'mike.wilson@acmecorp.com', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- User 4: Sarah Johnson (Active)
-- SCIM userName: sarah.johnson@acmecorp.com
-- SCIM name: { "formatted": "Sarah Johnson", "familyName": "Johnson", "givenName": "Sarah", "middleName": "Elizabeth" }
-- SCIM emails: [{ "value": "sarah.johnson@acmecorp.com", "type": "work", "primary": true }]
-- SCIM active: true
INSERT INTO users (org_id, email, status, created_at, updated_at)
VALUES (1, 'sarah.johnson@acmecorp.com', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- User 5: David Brown (Inactive)
-- SCIM userName: david.brown@acmecorp.com
-- SCIM name: { "formatted": "David Brown", "familyName": "Brown", "givenName": "David" }
-- SCIM emails: [{ "value": "david.brown@acmecorp.com", "type": "work", "primary": true }]
-- SCIM active: false (This user is deactivated in OKTA)
INSERT INTO users (org_id, email, status, created_at, updated_at)
VALUES (1, 'david.brown@acmecorp.com', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- User 6: Lisa Garcia (Active)
-- SCIM userName: lisa.garcia@acmecorp.com
-- SCIM name: { "formatted": "Lisa Garcia", "familyName": "Garcia", "givenName": "Lisa", "middleName": "Marie" }
-- SCIM emails: [{ "value": "lisa.garcia@acmecorp.com", "type": "work", "primary": true }]
-- SCIM active: true
INSERT INTO users (org_id, email, status, created_at, updated_at)
VALUES (1, 'lisa.garcia@acmecorp.com', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- User 7: Robert Taylor (Active)
-- SCIM userName: robert.taylor@acmecorp.com
-- SCIM name: { "formatted": "Robert Taylor", "familyName": "Taylor", "givenName": "Robert" }
-- SCIM emails: [{ "value": "robert.taylor@acmecorp.com", "type": "work", "primary": true }]
-- SCIM active: true
INSERT INTO users (org_id, email, status, created_at, updated_at)
VALUES (1, 'robert.taylor@acmecorp.com', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- User 8: Emily Davis (Active)
-- SCIM userName: emily.davis@acmecorp.com
-- SCIM name: { "formatted": "Emily Davis", "familyName": "Davis", "givenName": "Emily", "middleName": "Rose" }
-- SCIM emails: [{ "value": "emily.davis@acmecorp.com", "type": "work", "primary": true }]
-- SCIM active: true
INSERT INTO users (org_id, email, status, created_at, updated_at)
VALUES (1, 'emily.davis@acmecorp.com', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- User 9: Alex Martinez (Active)
-- SCIM userName: alex.martinez@acmecorp.com
-- SCIM name: { "formatted": "Alex Martinez", "familyName": "Martinez", "givenName": "Alex" }
-- SCIM emails: [{ "value": "alex.martinez@acmecorp.com", "type": "work", "primary": true }]
-- SCIM active: true
INSERT INTO users (org_id, email, status, created_at, updated_at)
VALUES (1, 'alex.martinez@acmecorp.com', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- User 10: Jessica White (Active)
-- SCIM userName: jessica.white@acmecorp.com
-- SCIM name: { "formatted": "Jessica White", "familyName": "White", "givenName": "Jessica", "middleName": "Lynn" }
-- SCIM emails: [{ "value": "jessica.white@acmecorp.com", "type": "work", "primary": true }]
-- SCIM active: true
INSERT INTO users (org_id, email, status, created_at, updated_at)
VALUES (1, 'jessica.white@acmecorp.com', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

COMMIT;

-- Display results
SELECT 'Seeded users summary:' as info;
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN status = 1 THEN 1 END) as active_users,
    COUNT(CASE WHEN status = 0 THEN 1 END) as inactive_users
FROM users 
WHERE org_id = 1;

SELECT 'Sample seeded users:' as info;
SELECT id, email, status, created_at FROM users WHERE org_id = 1 ORDER BY created_at DESC LIMIT 10;

/*
OKTA SCIM 2.0 Data Structure Reference:

The users seeded above simulate data that would come from OKTA in this format:

{
  "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
  "userName": "john.doe@acmecorp.com",
  "name": {
    "formatted": "John Doe",
    "familyName": "Doe",
    "givenName": "John",
    "middleName": "Michael"
  },
  "displayName": "John Doe",
  "emails": [
    {
      "value": "john.doe@acmecorp.com",
      "type": "work", 
      "primary": true
    }
  ],
  "active": true
}

Status mapping:
- status = 1: active = true (user is active in OKTA)
- status = 0: active = false (user is deactivated in OKTA)
*/