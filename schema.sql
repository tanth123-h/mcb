-- MCB DATABASE SCHEMA v2
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE personnel_status   AS ENUM ('active', 'injured', 'deceased', 'missing', 'observation');

CREATE TABLE squads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, description TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL, codename TEXT NOT NULL UNIQUE,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 80),
  nationality TEXT NOT NULL, role_applied TEXT NOT NULL,
  background_story TEXT NOT NULL, skills TEXT NOT NULL, notes TEXT,
  status application_status NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE personnel (
  id TEXT PRIMARY KEY, full_name TEXT NOT NULL, codename TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL, role TEXT NOT NULL,
  status personnel_status NOT NULL DEFAULT 'active',
  squad_id UUID REFERENCES squads(id) ON DELETE SET NULL,
  avatar_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE SEQUENCE mcb_id_seq START WITH 1;
CREATE OR REPLACE FUNCTION next_mcb_id() RETURNS TEXT AS $$
DECLARE n INTEGER; BEGIN n := nextval('mcb_id_seq'); RETURN 'MCB-' || LPAD(n::TEXT, 4, '0'); END;
$$ LANGUAGE plpgsql;

INSERT INTO squads (name, description) VALUES
  ('ALPHA UNIT','First-response containment team. Handles direct anomaly engagement.'),
  ('SIGMA OPS','Black-ops retrieval and extraction. High-clearance personnel only.'),
  ('DELTA WATCH','Long-term surveillance and monitoring of classified zones.'),
  ('OMEGA ARCHIVE','Research, documentation, and archival of anomalous phenomena.'),
  ('ECHO MEDICS','Field medicine and psychological evaluation unit.');

GRANT ALL ON applications, personnel, squads TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE mcb_id_seq TO anon, authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE personnel;
