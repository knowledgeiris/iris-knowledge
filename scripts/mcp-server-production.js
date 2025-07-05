#!/usr/bin/env node

/**
 * Iris Inner Cosmo MCP Server - Production Ready
 * 使用正确的Supabase配置
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"
import { createClient } from "@supabase/supabase-js"

// 使用正确的Supabase配置
const supabaseUrl = process.env.SUPABASE_URL || "https://yqmayjqtmluwgpxalskg.supabase.co"
const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxbWF5anF0bWx1d2dweGFsc2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2ODU4OTgsImV4cCI6MjA2NzI2MTg5OH0.U86sLB4YngY301czArY1Nrf7p9KM_kdrcrdlS8xJ_Nc"

const supabase = createClient(supabaseUrl, supabaseKey)

class IrisMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "iris-inner-cosmo",
        version: "1.0.0",
        description: "Access and manage your Iris Inner Cosmo knowledge capsules",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    )

    this.setupToolHandlers()
  }

  setupToolHandlers() {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "search_capsules",
            description: "Search through inspiration capsules by content, tags, or date range",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string", description: "Search query for content" },
                tags: { type: "array", items: { type: "string" }, description: "Filter by specific tags" },
                limit: { type: "number", description: "Maximum results to return", default: 10 },
                type: { type: "string", enum: ["text", "voice"], description: "Filter by capsule type" },
                days: { type: "number", description: "Only return capsules from last N days" },
              },
            },
          },
          {
            name: "get_capsules_by_tag",
            description: "Retrieve all capsules with specific tags",
            inputSchema: {
              type: "object",
              properties: {
                tags: { type: "array", items: { type: "string" }, description: "Array of tags to search for" },
                match_all: { type: "boolean", description: "Whether to match all tags or any tag", default: false },
                limit: { type: "number", description: "Maximum results to return", default: 20 },
              },
              required: ["tags"],
            },
          },
          {
            name: "get_recent_capsules",
            description: "Get the most recent inspiration capsules",
            inputSchema: {
              type: "object",
              properties: {
                limit: { type: "number", description: "Number of capsules to return", default: 5 },
                days: { type: "number", description: "Only return capsules from last N days" },
                type: { type: "string", enum: ["text", "voice"], description: "Filter by capsule type" },
              },
            },
          },
          {
            name: "get_capsule_stats",
            description: "Get comprehensive statistics about the knowledge base",
            inputSchema: {
              type: "object",
              properties: {
                detailed: { type: "boolean", description: "Include detailed tag statistics", default: false },
              },
            },
          },
          {
            name: "create_capsule",
            description: "Create a new inspiration capsule during conversation",
            inputSchema: {
              type: "object",
              properties: {
                content: { type: "string", description: "The content of the capsule" },
                tags: { type: "array", items: { type: "string" }, description: "Tags to associate with the capsule" },
                type: { type: "string", enum: ["text", "voice"], description: "Type of capsule", default: "text" },
              },
              required: ["content"],
            },
          },
          {
            name: "get_tag_cloud",
            description: "Get all unique tags with their usage counts",
            inputSchema: {
              type: "object",
              properties: {
                min_count: { type: "number", description: "Minimum usage count to include tag", default: 1 },
              },
            },
          },
        ],
      }
    })

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params

      try {
        switch (name) {
          case "search_capsules":
            return await this.searchCapsules(args)
          case "get_capsules_by_tag":
            return await this.getCapsulesByTag(args)
          case "get_recent_capsules":
            return await this.getRecentCapsules(args)
          case "get_capsule_stats":
            return await this.getCapsuleStats(args)
          case "create_capsule":
            return await this.createCapsule(args)
          case "get_tag_cloud":
            return await this.getTagCloud(args)
          default:
            throw new Error(`Unknown tool: ${name}`)
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Error executing ${name}: ${error.message}`,
            },
          ],
        }
      }
    })
  }

  async searchCapsules(args) {
    const { query, tags, limit = 10, type, days } = args

    let queryBuilder = supabase.from("capsules").select("*").order("timestamp", { ascending: false }).limit(limit)

    if (query) {
      queryBuilder = queryBuilder.ilike("content", `%${query}%`)
    }

    if (tags && tags.length > 0) {
      queryBuilder = queryBuilder.overlaps("tags", tags)
    }

    if (type) {
      queryBuilder = queryBuilder.eq("type", type)
    }

    if (days) {
      const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000
      queryBuilder = queryBuilder.gte("timestamp", cutoffTime)
    }

    const { data, error } = await queryBuilder

    if (error) throw error

    const formatCapsule = (capsule) => {
      const date = new Date(capsule.timestamp).toLocaleDateString()
      const time = new Date(capsule.timestamp).toLocaleTimeString()
      const tagsStr = capsule.tags.length > 0 ? capsule.tags.map((tag) => `#${tag}`).join(" ") : "No tags"

      return `🌟 **${capsule.type.toUpperCase()} CAPSULE** (${date} ${time})
📝 ${capsule.content}
🏷️ ${tagsStr}
🆔 ${capsule.id}
---`
    }

    return {
      content: [
        {
          type: "text",
          text: `🔍 **Search Results** (${data.length} capsules found)

${data.length > 0 ? data.map(formatCapsule).join("\n\n") : "No capsules found matching your criteria."}

${data.length === limit ? `\n⚠️ Results limited to ${limit}. Use a higher limit to see more.` : ""}`,
        },
      ],
    }
  }

  async getCapsulesByTag(args) {
    const { tags, match_all = false, limit = 20 } = args

    let queryBuilder = supabase.from("capsules").select("*").order("timestamp", { ascending: false }).limit(limit)

    if (match_all) {
      queryBuilder = queryBuilder.contains("tags", tags)
    } else {
      queryBuilder = queryBuilder.overlaps("tags", tags)
    }

    const { data, error } = await queryBuilder

    if (error) throw error

    const matchType = match_all ? "ALL" : "ANY"
    const tagList = tags.map((tag) => `#${tag}`).join(", ")

    return {
      content: [
        {
          type: "text",
          text: `🏷️ **Capsules with ${matchType} tags: ${tagList}** (${data.length} found)

${
  data.length > 0
    ? data
        .map((capsule) => {
          const date = new Date(capsule.timestamp).toLocaleDateString()
          const capsuleTags = capsule.tags.map((tag) => `#${tag}`).join(" ")
          return `🌟 **${capsule.content}**
🏷️ ${capsuleTags}
📅 ${date}
🆔 ${capsule.id}`
        })
        .join("\n\n---\n\n")
    : "No capsules found with the specified tags."
}`,
        },
      ],
    }
  }

  async getRecentCapsules(args) {
    const { limit = 5, days, type } = args

    let queryBuilder = supabase.from("capsules").select("*").order("timestamp", { ascending: false }).limit(limit)

    if (days) {
      const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000
      queryBuilder = queryBuilder.gte("timestamp", cutoffTime)
    }

    if (type) {
      queryBuilder = queryBuilder.eq("type", type)
    }

    const { data, error } = await queryBuilder

    if (error) throw error

    const timeframe = days ? `from the last ${days} days` : "overall"
    const typeFilter = type ? ` (${type} only)` : ""

    return {
      content: [
        {
          type: "text",
          text: `⏰ **Your ${data.length} most recent capsules ${timeframe}${typeFilter}:**

${
  data.length > 0
    ? data
        .map((capsule) => {
          const date = new Date(capsule.timestamp).toLocaleDateString()
          const time = new Date(capsule.timestamp).toLocaleTimeString()
          const tags = capsule.tags.length > 0 ? capsule.tags.map((tag) => `#${tag}`).join(" ") : "No tags"
          const icon = capsule.type === "voice" ? "🎤" : "📝"

          return `${icon} **${capsule.content}**
🏷️ ${tags}
📅 ${date} at ${time}
🆔 ${capsule.id}`
        })
        .join("\n\n---\n\n")
    : "No recent capsules found."
}`,
        },
      ],
    }
  }

  async getCapsuleStats(args) {
    const { detailed = false } = args

    const { data, error } = await supabase.from("capsules").select("*")

    if (error) throw error

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
      .slice(0, 10)

    let statsText = `📊 **Iris Inner Cosmo Statistics**

🌟 **Total Capsules:** ${totalCapsules}
📝 **Text Capsules:** ${textCapsules}
🎤 **Voice Capsules:** ${voiceCapsules}
🏷️ **Unique Tags:** ${uniqueTags}
📅 **Recent (7 days):** ${recentCapsules}
📆 **This Month:** ${thisMonthCapsules}

🔥 **Top Tags:**
${topTags.map(([tag, count]) => `   #${tag} (${count} capsules)`).join("\n")}

✨ Your knowledge universe is expanding! Keep capturing those inspirations! 🌌`

    if (detailed && data.length > 0) {
      const oldestCapsule = new Date(Math.min(...data.map((c) => c.timestamp)))
      const newestCapsule = new Date(Math.max(...data.map((c) => c.timestamp)))
      const avgCapsulesPerDay =
        totalCapsules / Math.max(1, (Date.now() - oldestCapsule.getTime()) / (24 * 60 * 60 * 1000))

      statsText += `

📈 **Detailed Analytics:**
🗓️ **First Capsule:** ${oldestCapsule.toLocaleDateString()}
🗓️ **Latest Capsule:** ${newestCapsule.toLocaleDateString()}
📊 **Average per Day:** ${avgCapsulesPerDay.toFixed(2)} capsules
💭 **Average Tags per Capsule:** ${(Array.from(allTags.values()).reduce((a, b) => a + b, 0) / totalCapsules).toFixed(1)}`
    }

    return {
      content: [
        {
          type: "text",
          text: statsText,
        },
      ],
    }
  }

  async createCapsule(args) {
    const { content, tags = [], type = "text" } = args

    const newCapsule = {
      content,
      tags,
      type,
      timestamp: Date.now(),
    }

    const { data, error } = await supabase.from("capsules").insert(newCapsule).select().single()

    if (error) throw error

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

🌟 Your inspiration has been captured in the cosmos! It's now part of your knowledge universe and can be accessed anytime. 🚀`,
        },
      ],
    }
  }

  async getTagCloud(args) {
    const { min_count = 1 } = args

    const { data, error } = await supabase.from("capsules").select("tags")

    if (error) throw error

    const tagCounts = new Map()
    data.forEach((capsule) => {
      capsule.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    const filteredTags = Array.from(tagCounts.entries())
      .filter(([tag, count]) => count >= min_count)
      .sort((a, b) => b[1] - a[1])

    return {
      content: [
        {
          type: "text",
          text: `🏷️ **Tag Cloud** (${filteredTags.length} tags with ${min_count}+ uses)

${filteredTags
  .map(([tag, count]) => {
    const size = count > 10 ? "🔥" : count > 5 ? "⭐" : count > 2 ? "✨" : "💫"
    return `${size} #${tag} (${count})`
  })
  .join("\n")}

💡 **Legend:** 🔥 10+ uses | ⭐ 6-10 uses | ✨ 3-5 uses | 💫 1-2 uses`,
        },
      ],
    }
  }

  async run() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error("🌟 Iris Inner Cosmo MCP Server is running and ready to serve your knowledge universe!")
  }
}

// 启动服务器
const server = new IrisMCPServer()
server.run().catch(console.error)
