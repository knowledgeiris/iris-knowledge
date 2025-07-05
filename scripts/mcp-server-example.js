#!/usr/bin/env node

/**
 * Iris Inner Cosmo MCP Server
 * This is an example implementation of the MCP server for accessing Iris capsules
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.IRIS_DATABASE_URL
const supabaseKey = process.env.IRIS_DATABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

class IrisMCPServer {
  constructor() {
    this.server = new Server(
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

    this.setupToolHandlers()
  }

  setupToolHandlers() {
    // List available tools
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
              },
            },
          },
          {
            name: "get_capsule_stats",
            description: "Get comprehensive statistics about the knowledge base",
            inputSchema: {
              type: "object",
              properties: {},
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
        ],
      }
    })

    // Handle tool calls
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
            return await this.getCapsuleStats()
          case "create_capsule":
            return await this.createCapsule(args)
          default:
            throw new Error(`Unknown tool: ${name}`)
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
        }
      }
    })
  }

  async searchCapsules(args) {
    const { query, tags, limit = 10, type } = args

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

    const { data, error } = await queryBuilder

    if (error) throw error

    return {
      content: [
        {
          type: "text",
          text: `Found ${data.length} capsules:\n\n${data
            .map(
              (capsule) =>
                `**${capsule.type.toUpperCase()}** (${new Date(capsule.timestamp).toLocaleDateString()})\n${capsule.content}\nTags: ${capsule.tags.map((tag) => `#${tag}`).join(", ")}\n`,
            )
            .join("\n")}`,
        },
      ],
    }
  }

  async getCapsulesByTag(args) {
    const { tags, match_all = false } = args

    let queryBuilder = supabase.from("capsules").select("*").order("timestamp", { ascending: false })

    if (match_all) {
      queryBuilder = queryBuilder.contains("tags", tags)
    } else {
      queryBuilder = queryBuilder.overlaps("tags", tags)
    }

    const { data, error } = await queryBuilder

    if (error) throw error

    return {
      content: [
        {
          type: "text",
          text: `Found ${data.length} capsules with tags [${tags.join(", ")}]:\n\n${data
            .map(
              (capsule) =>
                `**${capsule.content}**\nTags: ${capsule.tags.map((tag) => `#${tag}`).join(", ")}\nDate: ${new Date(capsule.timestamp).toLocaleDateString()}\n`,
            )
            .join("\n")}`,
        },
      ],
    }
  }

  async getRecentCapsules(args) {
    const { limit = 5, days } = args

    let queryBuilder = supabase.from("capsules").select("*").order("timestamp", { ascending: false }).limit(limit)

    if (days) {
      const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000
      queryBuilder = queryBuilder.gte("timestamp", cutoffTime)
    }

    const { data, error } = await queryBuilder

    if (error) throw error

    return {
      content: [
        {
          type: "text",
          text: `Your ${data.length} most recent capsules:\n\n${data
            .map(
              (capsule) =>
                `**${capsule.content}**\nTags: ${capsule.tags.map((tag) => `#${tag}`).join(", ")}\nDate: ${new Date(capsule.timestamp).toLocaleDateString()}\n`,
            )
            .join("\n")}`,
        },
      ],
    }
  }

  async getCapsuleStats() {
    const { data, error } = await supabase.from("capsules").select("*")

    if (error) throw error

    const totalCapsules = data.length
    const textCapsules = data.filter((c) => c.type === "text").length
    const voiceCapsules = data.filter((c) => c.type === "voice").length

    const allTags = new Set()
    data.forEach((capsule) => {
      capsule.tags.forEach((tag) => allTags.add(tag))
    })

    const recentCapsules = data.filter((c) => c.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000).length

    return {
      content: [
        {
          type: "text",
          text: `📊 **Iris Inner Cosmo Statistics**

🌟 **Total Capsules:** ${totalCapsules}
📝 **Text Capsules:** ${textCapsules}
🎤 **Voice Capsules:** ${voiceCapsules}
🏷️ **Unique Tags:** ${allTags.size}
📅 **Recent (7 days):** ${recentCapsules}

🌌 **Top Tags:** ${Array.from(allTags)
            .slice(0, 5)
            .map((tag) => `#${tag}`)
            .join(", ")}

Your knowledge universe is growing! ✨`,
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
          text: `✨ **New Capsule Created!**

**Content:** ${content}
**Tags:** ${tags.map((tag) => `#${tag}`).join(", ")}
**Type:** ${type}
**ID:** ${data.id}

Your inspiration has been captured in the cosmos! 🌟`,
        },
      ],
    }
  }

  async run() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error("Iris Inner Cosmo MCP Server running on stdio")
  }
}

// Start the server
const server = new IrisMCPServer()
server.run().catch(console.error)
