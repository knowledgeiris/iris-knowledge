import { createClient } from "@supabase/supabase-js"

const config = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pquftfsfztnzgssztebs.supabase.co",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxdWZ0ZnNmenRuemdzc3p0ZWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MjEzMTEsImV4cCI6MjA2NzI5NzMxMX0.Ufgk3l8Qus9i61SAFWNtoJPt9udu6Vu9MGoLkGiBiv0"
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
