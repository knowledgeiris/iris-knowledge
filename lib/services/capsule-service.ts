import { supabaseAdmin } from "@/lib/supabase-server"

export interface CapsuleSearchResult {
  capsules: Array<{
    id: string
    content: string
    tags: string[]
    timestamp: number
    created_at: string
  }>
  totalCount: number
}

interface CapsuleRow {
  id: string
  content: string
  tags: string[]
  timestamp: number
  created_at: string
}

// 按标签搜索胶囊
export async function searchCapsulesByTags(tags: string[], page = 1, pageSize = 10): Promise<CapsuleSearchResult> {
  if (!tags || tags.length === 0) {
    throw new Error("Tags parameter is required and must be a non-empty array")
  }

  const offset = (page - 1) * pageSize

  // 获取总数
  const { count, error: countError } = await supabaseAdmin
    .from("capsules")
    .select("*", { count: "exact", head: true })
    .overlaps("tags", tags)

  if (countError) {
    throw new Error(`Database error: ${countError.message}`)
  }

  // 获取数据
  const { data, error } = await supabaseAdmin
    .from("capsules")
    .select("*")
    .overlaps("tags", tags)
    .order("timestamp", { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return {
    capsules: data || [],
    totalCount: count || 0,
  }
}

// 按内容搜索胶囊
export async function searchCapsulesByContent(query: string, page = 1, pageSize = 10): Promise<CapsuleSearchResult> {
  if (!query || query.trim().length === 0) {
    throw new Error("Query parameter is required and must be a non-empty string")
  }

  const offset = (page - 1) * pageSize

  // 获取总数
  const { count, error: countError } = await supabaseAdmin
    .from("capsules")
    .select("*", { count: "exact", head: true })
    .ilike("content", `%${query}%`)

  if (countError) {
    throw new Error(`Database error: ${countError.message}`)
  }

  // 获取数据
  const { data, error } = await supabaseAdmin
    .from("capsules")
    .select("*")
    .ilike("content", `%${query}%`)
    .order("timestamp", { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return {
    capsules: data || [],
    totalCount: count || 0,
  }
}

// 获取最近的胶囊
export async function getRecentCapsules(limit = 5, days?: number): Promise<CapsuleSearchResult> {
  let queryBuilder = supabaseAdmin.from("capsules").select("*").order("timestamp", { ascending: false }).limit(limit)

  if (days) {
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000
    queryBuilder = queryBuilder.gte("timestamp", cutoffTime)
  }

  const { data, error } = await queryBuilder

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return {
    capsules: data || [],
    totalCount: data?.length || 0,
  }
}

// 创建新胶囊
export async function createCapsule(content: string, tags: string[] = []): Promise<CapsuleRow> {
  if (!content || content.trim().length === 0) {
    throw new Error("Content is required and must be a non-empty string")
  }

  const newCapsule = {
    content: content.trim(),
    tags: Array.isArray(tags) ? tags : [],
    timestamp: Date.now(),
  }

  const { data, error } = await supabaseAdmin.from("capsules").insert(newCapsule).select().single()

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return data
}

// 获取胶囊统计
export async function getCapsuleStats(): Promise<{
  totalCapsules: number
  uniqueTags: number
  recentCapsules: number
  thisMonthCapsules: number
  topTags: Array<[string, number]>
}> {
  const { data, error } = await supabaseAdmin.from("capsules").select("*")

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  const totalCapsules = data.length
  const allTags = new Map<string, number>()

  data.forEach((capsule: CapsuleRow) => {
    capsule.tags.forEach((tag: string) => {
      allTags.set(tag, (allTags.get(tag) || 0) + 1)
    })
  })

  const uniqueTags = allTags.size
  const recentCapsules = data.filter((c: CapsuleRow) => c.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000).length
  const thisMonthCapsules = data.filter((c: CapsuleRow) => c.timestamp > Date.now() - 30 * 24 * 60 * 60 * 1000).length

  const topTags = Array.from(allTags.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return {
    totalCapsules,
    uniqueTags,
    recentCapsules,
    thisMonthCapsules,
    topTags,
  }
}
