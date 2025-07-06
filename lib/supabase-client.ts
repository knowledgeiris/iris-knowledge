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
    console.log("创建Supabase客户端实例，URL:", config.url);
    console.log("环境变量 NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("环境变量 NEXT_PUBLIC_SUPABASE_ANON_KEY 是否存在:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    clientInstance = createClient(config.url, config.anonKey)
  }
  return clientInstance
})()

// 连接状态检查
export const checkConnection = async () => {
  try {
    console.log("检查数据库连接...");
    console.log("使用的Supabase URL:", config.url);
    
    // 先检查服务是否可用
    const { error: pingError } = await supabase.from('capsules').select('count', { count: 'exact', head: true }).limit(1);
    if (pingError) {
      console.error("数据库连接测试失败:", pingError.message, pingError.code, pingError.details);
      return false;
    }
    
    // 获取记录数
    const { data, error, count } = await supabase.from("capsules").select("count", { count: "exact", head: true })
    
    if (error) {
      console.error("数据库连接错误:", error.message, error.code, error.details);
      return false;
    }
    
    console.log("数据库连接成功, 计数:", count);
    return true;
  } catch (error) {
    console.error("数据库连接异常:", error);
    return false;
  }
}

// 数据库操作封装
export const capsuleOperations = {
  // 获取所有胶囊
  async getAll() {
    console.log("获取所有胶囊...");
    try {
      const { data, error } = await supabase.from("capsules").select("*").order("timestamp", { ascending: false })

      if (error) {
        console.error("获取胶囊错误:", error.message, error.code, error.details);
        throw error;
      }
      
      console.log(`成功获取 ${data?.length || 0} 个胶囊:`, data);
      return data || [];
    } catch (error) {
      console.error("获取胶囊异常:", error);
      throw error;
    }
  },

  // 创建新胶囊
  async create(capsule: {
    content: string
    tags: string[]
    timestamp: number
  }) {
    console.log("创建新胶囊:", capsule);
    try {
      const { data, error } = await supabase.from("capsules").insert(capsule).select().single()

      if (error) {
        console.error("创建胶囊错误:", error.message, error.code, error.details);
        throw error;
      }
      
      console.log("胶囊创建成功:", data);
      return data;
    } catch (error) {
      console.error("创建胶囊异常:", error);
      throw error;
    }
  },

  // 更新胶囊
  async update(id: string, updates: {
    content?: string
    tags?: string[]
  }) {
    console.log("更新胶囊:", id, updates);
    try {
      const { data, error } = await supabase
        .from("capsules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("更新胶囊错误:", error.message, error.code, error.details);
        throw error;
      }
      
      console.log("胶囊更新成功:", data);
      return data;
    } catch (error) {
      console.error("更新胶囊异常:", error);
      throw error;
    }
  },

  // 删除胶囊
  async delete(id: string) {
    console.log("删除胶囊:", id);
    try {
      const { error } = await supabase.from("capsules").delete().eq("id", id)

      if (error) {
        console.error("删除胶囊错误:", error.message, error.code, error.details);
        throw error;
      }
      
      console.log("胶囊删除成功");
      return true;
    } catch (error) {
      console.error("删除胶囊异常:", error);
      throw error;
    }
  },

  // 搜索胶囊
  async search(query: string, tags?: string[]) {
    console.log("搜索胶囊, 查询:", query, "标签:", tags);
    try {
      let queryBuilder = supabase.from("capsules").select("*").order("timestamp", { ascending: false })

      if (query) {
        queryBuilder = queryBuilder.ilike("content", `%${query}%`)
      }

      if (tags && tags.length > 0) {
        queryBuilder = queryBuilder.overlaps("tags", tags)
      }

      const { data, error } = await queryBuilder
      if (error) {
        console.error("搜索胶囊错误:", error.message, error.code, error.details);
        throw error;
      }
      
      console.log(`搜索结果: ${data?.length || 0} 个胶囊:`, data);
      return data || [];
    } catch (error) {
      console.error("搜索胶囊异常:", error);
      throw error;
    }
  },
}
