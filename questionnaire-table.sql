-- Vehicle Questionnaire Table
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS vehicle_questionnaire (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  selected_answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_questionnaire_submission_id ON vehicle_questionnaire(submission_id);

ALTER TABLE vehicle_questionnaire ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on vehicle_questionnaire" ON vehicle_questionnaire;
CREATE POLICY "Allow all operations on vehicle_questionnaire" ON vehicle_questionnaire
FOR ALL 
TO public
USING (true)
WITH CHECK (true);