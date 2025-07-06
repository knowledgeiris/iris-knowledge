// 加载环境变量
import "dotenv/config"
import { createMcpHandler } from "@vercel/mcp-adapter"
import { z } from "zod"
import {
  searchCapsulesByTags,
  searchCapsulesByContent,
  getRecentCapsules,
  createCapsule,
  getCapsuleStats,
} from "../lib/services/capsule-service"

const handler = createMcpHandler((server) => {
  // 按标签搜索胶囊
  server.tool(
    "search_capsules_by_tags",
    {
      tags: z.array(z.string()).describe("要搜索的标签数组"),
      page: z.number().optional().default(1).describe("页码"),
      pageSize: z.number().optional().default(10).describe("每页数量"),
    },
    async ({ tags, page, pageSize }) => {
      try {
        const result = await searchCapsulesByTags(tags, page, pageSize)

        const formattedCapsules = result.capsules.map((capsule) => {
          const date = new Date(capsule.timestamp).toLocaleDateString()
          const time = new Date(capsule.timestamp).toLocaleTimeString()
          const tagsStr = capsule.tags.length > 0 ? capsule.tags.map((tag) => `#${tag}`).join(" ") : "No tags"

          return `🌟 **CAPSULE** (${date} ${time})
📝 ${capsule.content}
🏷️ ${tagsStr}
🆔 ${capsule.id}`
        })

        return {
          content: [
            {
              type: "text",
              text: `🏷️ **按标签搜索结果** (找到 ${result.totalCount} 个胶囊)

${formattedCapsules.length > 0 ? formattedCapsules.join("\n\n---\n\n") : "没有找到匹配的胶囊"}

📄 第 ${page} 页，共 ${Math.ceil(result.totalCount / pageSize)} 页`,
            },
          ],
        }
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 按标签搜索胶囊失败: ${error.message}` }],
        }
      }
    },
    {
      description: "根据标签数组搜索相关的知识胶囊。适用于用户想查找某一主题下的所有内容时",
      usage: "当用户输入了一个或多个标签，想要获取与这些标签相关的所有胶囊时使用。例如：'查找Iris mcp中所有与标签"trading"相关的内容'。"
    }
  )

  // 按内容搜索胶囊
  server.tool(
    "search_capsules_by_content",
    {
      query: z.string().describe("搜索关键词"),
      page: z.number().optional().default(1).describe("页码"),
      pageSize: z.number().optional().default(10).describe("每页数量"),
    },
    async ({ query, page, pageSize }) => {
      try {
        const result = await searchCapsulesByContent(query, page, pageSize)

        const formattedCapsules = result.capsules.map((capsule) => {
          const date = new Date(capsule.timestamp).toLocaleDateString()
          const time = new Date(capsule.timestamp).toLocaleTimeString()
          const tagsStr = capsule.tags.length > 0 ? capsule.tags.map((tag) => `#${tag}`).join(" ") : "No tags"

          return `🌟 **CAPSULE** (${date} ${time})
📝 ${capsule.content}
🏷️ ${tagsStr}
🆔 ${capsule.id}`
        })

        return {
          content: [
            {
              type: "text",
              text: `🔍 **内容搜索结果** (找到 ${result.totalCount} 个包含"${query}"的胶囊)

${formattedCapsules.length > 0 ? formattedCapsules.join("\n\n---\n\n") : "没有找到匹配的胶囊"}

📄 第 ${page} 页，共 ${Math.ceil(result.totalCount / pageSize)} 页`,
            },
          ],
        }
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 按内容搜索胶囊失败: ${error.message}` }],
        }
      }
    },
    {
      description: "根据内容关键词搜索相关的知识胶囊。适用于用户想查找某一关键词下的所有内容时",
      usage: "当用户输入了关键词，想要获取与这些关键词相关的所有胶囊内容时使用。例如：'查找Iris mcp中所有\"AI\"相关的内容'。"
    }
  )

  // 获取最近的胶囊
  server.tool(
    "get_recent_capsules",
    {
      limit: z.number().optional().default(5).describe("返回数量"),
      days: z.number().optional().describe("限制在最近N天内"),
    },
    async ({ limit, days }) => {
      try {
        const result = await getRecentCapsules(limit, days)

        const timeframe = days ? `最近 ${days} 天` : "所有时间"

        const formattedCapsules = result.capsules.map((capsule) => {
          const date = new Date(capsule.timestamp).toLocaleDateString()
          const time = new Date(capsule.timestamp).toLocaleTimeString()
          const tags = capsule.tags.length > 0 ? capsule.tags.map((tag) => `#${tag}`).join(" ") : "No tags"

          return `📝 **${capsule.content}**
🏷️ ${tags}
📅 ${date} at ${time}
🆔 ${capsule.id}`
        })

        return {
          content: [
            {
              type: "text",
              text: `⏰ **最近的 ${result.totalCount} 个胶囊** (${timeframe})

${formattedCapsules.length > 0 ? formattedCapsules.join("\n\n---\n\n") : "没有找到最近的胶囊"}`,
            },
          ],
        }
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 获取最近胶囊失败: ${error.message}` }],
        }
      }
    },
  )

  // 创建新胶囊
  server.tool(
    "create_capsule",
    {
      content: z.string().describe("胶囊内容"),
      tags: z.array(z.string()).optional().default([]).describe("标签数组"),
    },
    async ({ content, tags }) => {
      try {
        const newCapsule = await createCapsule(content, tags)

        return {
          content: [
            {
              type: "text",
              text: `✨ **新胶囊创建成功！**

📝 **内容:** ${content}
🏷️ **标签:** ${tags.length > 0 ? tags.map((tag) => `#${tag}`).join(", ") : "无标签"}
🆔 **ID:** ${newCapsule.id}
📅 **创建时间:** ${new Date(newCapsule.timestamp).toLocaleString()}

🌟 你的灵感已经被捕获到宇宙中！现在它是你知识宇宙的一部分了。🚀`,
            },
          ],
        }
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 创建胶囊失败: ${error.message}` }],
        }
      }
    },
  )

  // 获取胶囊统计
  server.tool("get_capsule_stats", {}, async () => {
    try {
      const stats = await getCapsuleStats()

      return {
        content: [
          {
            type: "text",
            text: `📊 **Iris Inner Cosmo 统计数据**

🌟 **总胶囊数:** ${stats.totalCapsules}
🏷️ **独特标签数:** ${stats.uniqueTags}
📅 **最近7天:** ${stats.recentCapsules}
📆 **本月:** ${stats.thisMonthCapsules}

🔥 **热门标签:**
${stats.topTags.map(([tag, count]) => `   #${tag} (${count} 个胶囊)`).join("\n")}

✨ 你的知识宇宙正在不断扩展！继续捕获那些灵感吧！🌌`,
          },
        ],
      }
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ 获取统计数据失败: ${error.message}` }],
      }
    }
  })
})

export { handler as GET, handler as POST, handler as DELETE }
