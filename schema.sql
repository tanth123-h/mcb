-- MCB DATABASE SCHEMA v2
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE personnel_status   AS ENUM ('active', 'injured', 'deceased', 'missing', 'observation');
CREATE TYPE task_type         AS ENUM ('research', 'mission');
CREATE TYPE task_priority     AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_status       AS ENUM ('pending', 'in_progress', 'submitted', 'accepted', 'rejected');
CREATE TYPE submission_status AS ENUM ('submitted', 'accepted', 'rejected');
CREATE TYPE task_result       AS ENUM ('success', 'failure', 'inconclusive');

CREATE TABLE squads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, description TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL, codename TEXT NOT NULL UNIQUE,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 80),
  nationality TEXT NOT NULL, role_applied TEXT NOT NULL,
  background_story TEXT NOT NULL, skills TEXT NOT NULL, notes TEXT, image_url TEXT,
  status application_status NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE personnel (
  id TEXT PRIMARY KEY, full_name TEXT NOT NULL, codename TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL, role TEXT NOT NULL,
  status personnel_status NOT NULL DEFAULT 'active',
  squad_id UUID REFERENCES squads(id) ON DELETE SET NULL,
  avatar_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type task_type NOT NULL,
  description TEXT NOT NULL,
  objective TEXT NOT NULL,
  assigned_to TEXT NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'pending',
  assigned_by TEXT DEFAULT 'BUREAU ADMIN',
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE task_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
  personnel_id TEXT NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  report_title TEXT NOT NULL,
  findings TEXT NOT NULL,
  actions_taken TEXT NOT NULL,
  result task_result NOT NULL,
  notes TEXT,
  image_url TEXT,
  status submission_status NOT NULL DEFAULT 'submitted',
  admin_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
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

GRANT ALL ON applications, personnel, squads, tasks, task_submissions TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE mcb_id_seq TO anon, authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE personnel;
