-- Create capsules table
CREATE TABLE IF NOT EXISTS capsules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  timestamp BIGINT NOT NULL,
  type TEXT CHECK (type IN ('text', 'voice')) NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_capsules_timestamp ON capsules(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_capsules_tags ON capsules USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_capsules_type ON capsules(type);

-- Enable Row Level Security (optional, for future user authentication)
ALTER TABLE capsules ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on capsules" ON capsules
  FOR ALL USING (true);
