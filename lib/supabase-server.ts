import { createClient } from "@supabase/supabase-js"

// 服务端专用Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pquftfsfztnzgssztebs.supabase.co"
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxdWZ0ZnNmenRuemdzc3p0ZWJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTcyMTMxMSwiZXhwIjoyMDY3Mjk3MzExfQ.bQ0yFqe8Fy_KqIl6bNAinzmWe-si31wiY4aiXHiWGJA"

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
