CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY,                    -- <-- sin DEFAULT
  user_id uuid REFERENCES users(id),
  status text NOT NULL CHECK (status IN ('queued','running','succeeded','failed')),
  input_video_url text NOT NULL,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY,                    -- <-- sin DEFAULT
  job_id uuid REFERENCES jobs(id),
  exercise text NOT NULL,
  reps int,
  score numeric,
  details jsonb,
  created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_user ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_job ON analyses(job_id);
