import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

// MCP Server Implementation for Next.js App Router
export async function GET() {
  return Response.json({
    name: "iris",
    version: "1.0.0",
    description: "MCP Server for Iris KnowledgeMesh knowledge management",
    capabilities: {
      tools: {},
    },
    tools: [
      {
        name: "search_capsules",
        description: "Search through inspiration capsules by content or tags",
      },
      {
        name: "get_recent_capsules",
        description: "Get the most recent inspiration capsules",
      },
      {
        name: "create_capsule",
        description: "Create a new inspiration capsule",
      },
      {
        name: "get_capsule_stats",
        description: "Get statistics about your knowledge base",
      },
    ],
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle MCP protocol messages
    switch (body.method) {
      case "initialize":
        return Response.json({
          jsonrpc: "2.0",
          id: body.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: "iris",
              version: "1.0.0",
            },
          },
        })

      case "tools/list":
        return Response.json({
          jsonrpc: "2.0",
          id: body.id,
          result: {
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
            ],
          },
        })

      case "tools/call":
        const { name, arguments: args } = body.params || {}

        try {
          let result

          switch (name) {
            case "search_capsules":
              result = await handleSearchCapsules(args)
              break
            case "get_recent_capsules":
              result = await handleGetRecentCapsules(args)
              break
            case "create_capsule":
              result = await handleCreateCapsule(args)
              break
            case "get_capsule_stats":
              result = await handleGetCapsuleStats()
              break
            default:
              throw new Error(`Unknown tool: ${name}`)
          }

          return Response.json({
            jsonrpc: "2.0",
            id: body.id,
            result,
          })
        } catch (error: any) {
          return Response.json({
            jsonrpc: "2.0",
            id: body.id,
            error: {
              code: -32603,
              message: `Error executing ${name}: ${error.message}`,
            },
          })
        }

      default:
        return Response.json({
          jsonrpc: "2.0",
          id: body.id,
          error: {
            code: -32601,
            message: `Method not found: ${body.method}`,
          },
        })
    }
  } catch (error) {
    return Response.json(
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

// Tool handlers
async function handleSearchCapsules(args: any) {
  const { query, tags, limit = 10 } = args || {}

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
    const tagsStr = capsule.tags?.length > 0 ? capsule.tags.map((tag: string) => `#${tag}`).join(" ") : "No tags"

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

async function handleGetRecentCapsules(args: any) {
  const { limit = 5, days } = args || {}

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
    const tags = capsule.tags?.length > 0 ? capsule.tags.map((tag: string) => `#${tag}`).join(" ") : "No tags"
    const icon = "📝"

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

async function handleCreateCapsule(args: any) {
  const { content, tags = [] } = args || {}

  if (!content || typeof content !== "string" || content.trim().length === 0) {
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

  return {
    content: [
      {
        type: "text",
        text: `✨ **New Capsule Created Successfully!**

📝 **Content:** ${content}
🏷️ **Tags:** ${tags.length > 0 ? tags.map((tag: string) => `#${tag}`).join(", ") : "No tags"}
🆔 **ID:** ${data.id}
📅 **Created:** ${new Date(data.timestamp).toLocaleString()}

🌟 Your inspiration has been captured in the knowledge mesh! 🚀`,
      },
    ],
  }
}

async function handleGetCapsuleStats() {
  const { data, error } = await supabaseAdmin.from("capsules").select("*")

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  const totalCapsules = data.length
  const allTags = new Map<string, number>()

  data.forEach((capsule) => {
    capsule.tags?.forEach((tag: string) => {
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
        text: `📊 **Iris KnowledgeMesh Statistics**

🌟 **Total Capsules:** ${totalCapsules}
🏷️ **Unique Tags:** ${uniqueTags}
📅 **Recent (7 days):** ${recentCapsules}
📆 **This Month:** ${thisMonthCapsules}

🔥 **Top Tags:**
${topTags.map(([tag, count]) => `   #${tag} (${count} capsules)`).join("\n")}

✨ Your knowledge mesh is expanding! Keep capturing those inspirations! 🌌`,
      },
    ],
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  })
}
