#!/usr/bin/env node

/**
 * Iris Inner Cosmo MCP Server - 修复版本
 * 基于官方MCP文档标准实现
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js"
import { createClient } from "@supabase/supabase-js"

// Supabase配置
const supabaseUrl = process.env.SUPABASE_URL || "https://yqmayjqtmluwgpxalskg.supabase.co"
const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxbWF5anF0bWx1d2dweGFsc2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2ODU4OTgsImV4cCI6MjA2NzI2MTg5OH0.U86sLB4YngY301czArY1Nrf7p9KM_kdrcrdlS8xJ_Nc"

const supabase = createClient(supabaseUrl, supabaseKey)

// 创建MCP服务器
const server = new Server(
  {
    name: "iris-inner-cosmo",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
)

// 注册工具列表处理器
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_capsules",
        description: "Search through inspiration capsules by content or tags",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query for content",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Filter by specific tags",
            },
            limit: {
              type: "number",
              description: "Maximum results to return",
              default: 10,
            },
          },
        },
      },
      {
        name: "get_recent_capsules",
        description: "Get the most recent inspiration capsules",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Number of capsules to return",
              default: 5,
            },
            days: {
              type: "number",
              description: "Only return capsules from last N days",
            },
          },
        },
      },
      {
        name: "get_capsules_by_tag",
        description: "Retrieve capsules with specific tags",
        inputSchema: {
          type: "object",
          properties: {
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Array of tags to search for",
            },
            match_all: {
              type: "boolean",
              description: "Whether to match all tags or any tag",
              default: false,
            },
          },
          required: ["tags"],
        },
      },
      {
        name: "create_capsule",
        description: "Create a new inspiration capsule",
        inputSchema: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "The content of the capsule",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Tags to associate with the capsule",
            },
            type: {
              type: "string",
              enum: ["text", "voice"],
              description: "Type of capsule",
              default: "text",
            },
          },
          required: ["content"],
        },
      },
      {
        name: "get_capsule_stats",
        description: "Get statistics about your knowledge base",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  }
})

// 注册工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case "search_capsules":
        return await handleSearchCapsules(args)
      case "get_recent_capsules":
        return await handleGetRecentCapsules(args)
      case "get_capsules_by_tag":
        return await handleGetCapsulesByTag(args)
      case "create_capsule":
        return await handleCreateCapsule(args)
      case "get_capsule_stats":
        return await handleGetCapsuleStats(args)
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`)
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error
    }
    throw new McpError(ErrorCode.InternalError, `Error executing ${name}: ${error.message}`)
  }
})

// 工具实现函数
async function handleSearchCapsules(args) {
  const { query, tags, limit = 10 } = args

  let queryBuilder = supabase.from("capsules").select("*").order("timestamp", { ascending: false }).limit(limit)

  if (query) {
    queryBuilder = queryBuilder.ilike("content", `%${query}%`)
  }

  if (tags && tags.length > 0) {
    queryBuilder = queryBuilder.overlaps("tags", tags)
  }

  const { data, error } = await queryBuilder

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  const results = data.map((capsule) => {
    const date = new Date(capsule.timestamp).toLocaleDateString()
    const time = new Date(capsule.timestamp).toLocaleTimeString()
    const tagsStr = capsule.tags.length > 0 ? capsule.tags.map((tag) => `#${tag}`).join(" ") : "No tags"

    return `🌟 **${capsule.type.toUpperCase()} CAPSULE** (${date} ${time})
📝 ${capsule.content}
🏷️ ${tagsStr}
🆔 ${capsule.id}`
  })

  return {
    content: [
      {
        type: "text",
        text: `🔍 **Search Results** (${data.length} capsules found)

${results.length > 0 ? results.join("\n\n---\n\n") : "No capsules found matching your criteria."}

${data.length === limit ? `\n⚠️ Results limited to ${limit}. Use a higher limit to see more.` : ""}`,
      },
    ],
  }
}

async function handleGetRecentCapsules(args) {
  const { limit = 5, days } = args

  let queryBuilder = supabase.from("capsules").select("*").order("timestamp", { ascending: false }).limit(limit)

  if (days) {
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000
    queryBuilder = queryBuilder.gte("timestamp", cutoffTime)
  }

  const { data, error } = await queryBuilder

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  const timeframe = days ? `from the last ${days} days` : "overall"

  const results = data.map((capsule) => {
    const date = new Date(capsule.timestamp).toLocaleDateString()
    const time = new Date(capsule.timestamp).toLocaleTimeString()
    const tags = capsule.tags.length > 0 ? capsule.tags.map((tag) => `#${tag}`).join(" ") : "No tags"
    const icon = capsule.type === "voice" ? "🎤" : "📝"

    return `${icon} **${capsule.content}**
🏷️ ${tags}
📅 ${date} at ${time}
🆔 ${capsule.id}`
  })

  return {
    content: [
      {
        type: "text",
        text: `⏰ **Your ${data.length} most recent capsules ${timeframe}:**

${results.length > 0 ? results.join("\n\n---\n\n") : "No recent capsules found."}`,
      },
    ],
  }
}

async function handleGetCapsulesByTag(args) {
  const { tags, match_all = false } = args

  let queryBuilder = supabase.from("capsules").select("*").order("timestamp", { ascending: false })

  if (match_all) {
    queryBuilder = queryBuilder.contains("tags", tags)
  } else {
    queryBuilder = queryBuilder.overlaps("tags", tags)
  }

  const { data, error } = await queryBuilder

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  const matchType = match_all ? "ALL" : "ANY"
  const tagList = tags.map((tag) => `#${tag}`).join(", ")

  const results = data.map((capsule) => {
    const date = new Date(capsule.timestamp).toLocaleDateString()
    const capsuleTags = capsule.tags.map((tag) => `#${tag}`).join(" ")
    return `🌟 **${capsule.content}**
🏷️ ${capsuleTags}
📅 ${date}
🆔 ${capsule.id}`
  })

  return {
    content: [
      {
        type: "text",
        text: `🏷️ **Capsules with ${matchType} tags: ${tagList}** (${data.length} found)

${results.length > 0 ? results.join("\n\n---\n\n") : "No capsules found with the specified tags."}`,
      },
    ],
  }
}

async function handleCreateCapsule(args) {
  const { content, tags = [], type = "text" } = args

  const newCapsule = {
    content,
    tags,
    type,
    timestamp: Date.now(),
  }

  const { data, error } = await supabase.from("capsules").insert(newCapsule).select().single()

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return {
    content: [
      {
        type: "text",
        text: `✨ **New Capsule Created Successfully!**

📝 **Content:** ${content}
🏷️ **Tags:** ${tags.length > 0 ? tags.map((tag) => `#${tag}`).join(", ") : "No tags"}
📱 **Type:** ${type}
🆔 **ID:** ${data.id}
📅 **Created:** ${new Date().toLocaleString()}

🌟 Your inspiration has been captured in the cosmos! It's now part of your knowledge universe. 🚀`,
      },
    ],
  }
}

async function handleGetCapsuleStats(args) {
  const { data, error } = await supabase.from("capsules").select("*")

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  const totalCapsules = data.length
  const textCapsules = data.filter((c) => c.type === "text").length
  const voiceCapsules = data.filter((c) => c.type === "voice").length

  const allTags = new Map()
  data.forEach((capsule) => {
    capsule.tags.forEach((tag) => {
      allTags.set(tag, (allTags.get(tag) || 0) + 1)
    })
  })

  const uniqueTags = allTags.size
  const recentCapsules = data.filter((c) => c.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000).length
  const thisMonthCapsules = data.filter((c) => c.timestamp > Date.now() - 30 * 24 * 60 * 60 * 1000).length

  // 获取最受欢迎的标签
  const topTags = Array.from(allTags.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return {
    content: [
      {
        type: "text",
        text: `📊 **Iris Inner Cosmo Statistics**

🌟 **Total Capsules:** ${totalCapsules}
📝 **Text Capsules:** ${textCapsules}
🎤 **Voice Capsules:** ${voiceCapsules}
🏷️ **Unique Tags:** ${uniqueTags}
📅 **Recent (7 days):** ${recentCapsules}
📆 **This Month:** ${thisMonthCapsules}

🔥 **Top Tags:**
${topTags.map(([tag, count]) => `   #${tag} (${count} capsules)`).join("\n")}

✨ Your knowledge universe is expanding! Keep capturing those inspirations! 🌌`,
      },
    ],
  }
}

// 启动服务器
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("🌟 Iris Inner Cosmo MCP Server is running!")
}

main().catch((error) => {
  console.error("Server error:", error)
  process.exit(1)
})
