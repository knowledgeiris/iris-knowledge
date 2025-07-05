import { createClient } from "@supabase/supabase-js"

// 客户端配置 - 只使用公开的环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yqmayjqtmluwgpxalskg.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxbWF5anF0bWx1d2dweGFsc2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2ODU4OTgsImV4cCI6MjA2NzI2MTg5OH0.U86sLB4YngY301czArY1Nrf7p9KM_kdrcrdlS8xJ_Nc"

// 验证环境变量
if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

// 单例模式创建客户端，避免多个实例
let supabaseClient: ReturnType<typeof createClient> | null = null

export const supabase = (() => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
})()

export interface Database {
  public: {
    Tables: {
      capsules: {
        Row: {
          id: string
          content: string
          tags: string[]
          timestamp: number
          type: "text" | "voice"
          audio_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          content: string
          tags: string[]
          timestamp: number
          type: "text" | "voice"
          audio_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          content?: string
          tags?: string[]
          timestamp?: number
          type?: "text" | "voice"
          audio_url?: string | null
          created_at?: string
        }
      }
    }
  }
}

// 测试连接函数
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from("capsules").select("count", { count: "exact", head: true })
    if (error) {
      console.error("Supabase connection error:", error)
      return false
    }
    console.log("Supabase connected successfully")
    return true
  } catch (error) {
    console.error("Supabase connection failed:", error)
    return false
  }
}
