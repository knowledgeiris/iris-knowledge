// 应用配置
export const config = {
  supabase: {
    url: "https://yqmayjqtmluwgpxalskg.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxbWF5anF0bWx1d2dweGFsc2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2ODU4OTgsImV4cCI6MjA2NzI2MTg5OH0.U86sLB4YngY301czArY1Nrf7p9KM_kdrcrdlS8xJ_Nc",
    serviceRoleKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxbWF5anF0bWx1d2dweGFsc2tnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTY4NTg5OCwiZXhwIjoyMDY3MjYxODk4fQ.ABTef4GBqTg91MmdTDGirnT4oRzWQuyJP7TT4hSvv04",
  },
  app: {
    name: "Iris's Inner Cosmo",
    version: "1.0.0",
    description: "Capture • Organize • Deploy Your Knowledge Universe",
  },
}

// 获取环境变量或使用默认配置
export const getSupabaseConfig = () => {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || config.supabase.url,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || config.supabase.anonKey,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || config.supabase.serviceRoleKey,
  }
}
