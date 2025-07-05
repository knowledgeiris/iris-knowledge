import { createClient } from "@supabase/supabase-js"

const config = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yqmayjqtmluwgpxalskg.supabase.co",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxbWF5anF0bWx1d2dweGFsc2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2ODU4OTgsImV4cCI6MjA2NzI2MTg5OH0.U86sLB4YngY301czArY1Nrf7p9KM_kdrcrdlS8xJ_Nc"
}

// 单例客户端实例
let clientInstance: ReturnType<typeof createClient> | null = null

// 创建客户端实例
export const supabase = (() => {
  if (!clientInstance) {
    clientInstance = createClient(config.url, config.anonKey)
  }
  return clientInstance
})()

// 连接状态检查
export const checkConnection = async () => {
  try {
    const { error } = await supabase.from("capsules").select("count", { count: "exact", head: true })
    return !error
  } catch {
    return false
  }
}

// 数据库操作封装
export const capsuleOperations = {
  // 获取所有胶囊
  async getAll() {
    const { data, error } = await supabase.from("capsules").select("*").order("timestamp", { ascending: false })

    if (error) throw error
    return data
  },

  // 创建新胶囊
  async create(capsule: {
    content: string
    tags: string[]
    type: "text" | "voice"
    timestamp: number
    audio_url?: string
  }) {
    const { data, error } = await supabase.from("capsules").insert(capsule).select().single()

    if (error) throw error
    return data
  },

  // 删除胶囊
  async delete(id: string) {
    const { error } = await supabase.from("capsules").delete().eq("id", id)

    if (error) throw error
    return true
  },

  // 搜索胶囊
  async search(query: string, tags?: string[]) {
    let queryBuilder = supabase.from("capsules").select("*").order("timestamp", { ascending: false })

    if (query) {
      queryBuilder = queryBuilder.ilike("content", `%${query}%`)
    }

    if (tags && tags.length > 0) {
      queryBuilder = queryBuilder.overlaps("tags", tags)
    }

    const { data, error } = await queryBuilder
    if (error) throw error
    return data
  },
}
