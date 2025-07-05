import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

// MCP工具定义
const MCP_TOOLS = [
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
    description: "Create a new inspiration capsule during conversation",
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
      },
      required: ["content"],
    },
  },
  {
    name: "get_capsule_stats",
    description: "Get comprehensive statistics about your knowledge base",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
]

// 工具执行函数
async function executeSearchCapsules(args: any) {
  const { query, tags, limit = 10 } = args

  let queryBuilder = supabaseAdmin.from("capsules").select("*").order("timestamp", { ascending: false }).limit(limit)

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
    const tagsStr = capsule.tags.length > 0 ? capsule.tags.map((tag: string) => `#${tag}`).join(" ") : "No tags"

    return `🌟 **CAPSULE** (${date} ${time})
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

async function executeGetRecentCapsules(args: any) {
  const { limit = 5, days } = args

  let queryBuilder = supabaseAdmin.from("capsules").select("*").order("timestamp", { ascending: false }).limit(limit)

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
    const tags = capsule.tags.length > 0 ? capsule.tags.map((tag: string) => `#${tag}`).join(" ") : "No tags"

    return `📝 **${capsule.content}**
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

async function executeGetCapsulesByTag(args: any) {
  const { tags, match_all = false } = args

  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    throw new Error("Tags parameter is required and must be a non-empty array")
  }

  let queryBuilder = supabaseAdmin.from("capsules").select("*").order("timestamp", { ascending: false })

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
  const tagList = tags.map((tag: string) => `#${tag}`).join(", ")

  const results = data.map((capsule) => {
    const date = new Date(capsule.timestamp).toLocaleDateString()
    const capsuleTags = capsule.tags.map((tag: string) => `#${tag}`).join(" ")
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

async function executeCreateCapsule(args: any) {
  const { content, tags = [] } = args

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    throw new Error("Content is required and must be a non-empty string")
  }

  const newCapsule = {
    content: content.trim(),
    tags: Array.isArray(tags) ? tags : [],
    type: "text",
    timestamp: Date.now(),
  }

  const { data, error } = await supabaseAdmin.from("capsules").insert(newCapsule).select().single()

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return {
    content: [
      {
        type: "text",
        text: `✨ **New Capsule Created Successfully!**

📝 **Content:** ${content}
🏷️ **Tags:** ${tags.length > 0 ? tags.map((tag: string) => `#${tag}`).join(", ") : "No tags"}
🆔 **ID:** ${data.id}
📅 **Created:** ${new Date(data.timestamp).toLocaleString()}

🌟 Your inspiration has been captured in the cosmos! 🚀`,
      },
    ],
  }
}

async function executeGetCapsuleStats() {
  const { data, error } = await supabaseAdmin.from("capsules").select("*")

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  const totalCapsules = data.length
  const allTags = new Map()

  data.forEach((capsule) => {
    capsule.tags.forEach((tag: string) => {
      allTags.set(tag, (allTags.get(tag) || 0) + 1)
    })
  })

  const uniqueTags = allTags.size
  const recentCapsules = data.filter((c) => c.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000).length
  const thisMonthCapsules = data.filter((c) => c.timestamp > Date.now() - 30 * 24 * 60 * 60 * 1000).length

  const topTags = Array.from(allTags.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return {
    content: [
      {
        type: "text",
        text: `📊 **Iris Inner Cosmo Statistics**

🌟 **Total Capsules:** ${totalCapsules}
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

// 工具执行映射
const TOOL_HANDLERS: Record<string, (args: any) => Promise<any>> = {
  search_capsules: executeSearchCapsules,
  get_recent_capsules: executeGetRecentCapsules,
  get_capsules_by_tag: executeGetCapsulesByTag,
  create_capsule: executeCreateCapsule,
  get_capsule_stats: executeGetCapsuleStats,
}

// 处理MCP请求 - 严格按照MCP规范
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("📥 MCP Request:", JSON.stringify(body, null, 2))

    // 验证JSON-RPC 2.0格式
    if (!body.jsonrpc || body.jsonrpc !== "2.0") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id: body.id || null,
        error: {
          code: -32600,
          message: "Invalid Request - must be JSON-RPC 2.0",
        },
      })
    }

    // 处理不同的MCP方法
    switch (body.method) {
      case "initialize":
        console.log("🚀 Handling initialize request")
        return NextResponse.json({
          jsonrpc: "2.0",
          id: body.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: "iris-inner-cosmo",
              version: "1.0.0",
            },
          },
        })

      case "tools/list":
        console.log("🔧 Handling tools/list request")
        return NextResponse.json({
          jsonrpc: "2.0",
          id: body.id,
          result: {
            tools: MCP_TOOLS,
          },
        })

      case "tools/call":
        console.log("⚡ Handling tools/call request")
        const { name, arguments: args } = body.params || {}

        if (!name) {
          return NextResponse.json({
            jsonrpc: "2.0",
            id: body.id,
            error: {
              code: -32602,
              message: "Invalid params - tool name is required",
            },
          })
        }

        const handler = TOOL_HANDLERS[name]
        if (!handler) {
          return NextResponse.json({
            jsonrpc: "2.0",
            id: body.id,
            error: {
              code: -32601,
              message: `Unknown tool: ${name}`,
            },
          })
        }

        try {
          const result = await handler(args || {})
          console.log("✅ Tool execution result:", JSON.stringify(result, null, 2))

          return NextResponse.json({
            jsonrpc: "2.0",
            id: body.id,
            result,
          })
        } catch (error) {
          console.error("❌ Tool execution error:", error)
          return NextResponse.json({
            jsonrpc: "2.0",
            id: body.id,
            error: {
              code: -32603,
              message: `Error executing ${name}: ${error.message}`,
            },
          })
        }

      default:
        console.log("❓ Unknown method:", body.method)
        return NextResponse.json({
          jsonrpc: "2.0",
          id: body.id,
          error: {
            code: -32601,
            message: `Method not found: ${body.method}`,
          },
        })
    }
  } catch (error) {
    console.error("💥 MCP API Error:", error)
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: "Parse error",
        },
      },
      { status: 500 },
    )
  }
}

// 处理GET请求 - 返回服务器信息
export async function GET() {
  return NextResponse.json({
    name: "iris-inner-cosmo",
    version: "1.0.0",
    description: "MCP Server for Iris Inner Cosmo knowledge management",
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {},
    },
    tools: MCP_TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
    })),
    status: "ready",
    endpoint: "/api/mcp",
  })
}

// 处理OPTIONS请求 - CORS支持
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  })
}
