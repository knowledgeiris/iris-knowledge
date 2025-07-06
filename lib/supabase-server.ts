import { createClient } from "@supabase/supabase-js"

// 服务端专用Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pquftfsfztnzgssztebs.supabase.co"
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxbWF5anF0bWx1d2dweGFsc2tnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTY4NTg5OCwiZXhwIjoyMDY3MjYxODk4fQ.ABTef4GBqTg91MmdTDGirnT4oRzWQuyJP7TT4hSvv04"

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
