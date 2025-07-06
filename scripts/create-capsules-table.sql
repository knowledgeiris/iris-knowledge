-- 创建capsules表，用于存储灵感胶囊
CREATE TABLE IF NOT EXISTS capsules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_capsules_timestamp ON capsules(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_capsules_tags ON capsules USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_capsules_created_at ON capsules(created_at DESC);

-- 创建更新时间的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_capsules_updated_at 
    BEFORE UPDATE ON capsules 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略（RLS）
ALTER TABLE capsules ENABLE ROW LEVEL SECURITY;

-- 创建允许所有操作的策略（后续可以根据用户认证进行限制）
CREATE POLICY "Allow all operations on capsules" ON capsules
  FOR ALL USING (true);

-- 插入一些示例数据（可选）
INSERT INTO capsules (content, tags, timestamp) VALUES 
  ('Welcome to Iris Inner Cosmo! This is your first inspiration capsule.', ARRAY['welcome', 'first'], EXTRACT(EPOCH FROM NOW()) * 1000),
  ('Remember: Every great journey begins with a single step.', ARRAY['motivation', 'journey'], EXTRACT(EPOCH FROM NOW()) * 1000 - 3600000),
  ('Ideas are like stars - they shine brightest in the darkness of uncertainty.', ARRAY['creativity', 'inspiration'], EXTRACT(EPOCH FROM NOW()) * 1000 - 7200000)
ON CONFLICT DO NOTHING;
