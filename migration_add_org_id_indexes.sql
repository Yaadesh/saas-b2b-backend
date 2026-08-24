-- Adds indexes on org_id for tables that are filtered by org_id on nearly
-- every request but currently rely on a full table scan.
-- Run this script against your PostgreSQL database.

BEGIN;

CREATE INDEX IF NOT EXISTS idx_roles_org_id ON roles (org_id);
CREATE INDEX IF NOT EXISTS idx_modules_org_id ON modules (org_id);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users (org_id);

COMMIT;
