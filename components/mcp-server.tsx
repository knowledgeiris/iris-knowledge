"use client"

import { useState } from "react"
import { Copy, Server, CheckCircle, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Capsule } from "@/app/page"

interface MCPServerProps {
  capsules: Capsule[]
}

export default function MCPServer({ capsules }: MCPServerProps) {
  const [copied, setCopied] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [configType, setConfigType] = useState<"cursor" | "claude">("cursor")

  // 获取当前域名
  const getCurrentDomain = () => {
    if (typeof window !== "undefined") {
      return window.location.origin
    }
    return "https://your-domain.vercel.app"
  }

  const mcpUrl = `${getCurrentDomain()}/api/server`

  // Cursor配置
  const cursorConfig = {
    mcpServers: {
      "iris-inner-cosmo": {
        url: mcpUrl,
      },
    },
  }

  // Claude Desktop配置
  const claudeDesktopConfig = {
    mcpServers: {
      "iris-inner-cosmo": {
        transport: {
          type: "http",
          url: mcpUrl,
        },
      },
    },
  }

  const mcpTools = [
    {
      name: "search_capsules_by_tags",
      description: "按标签搜索胶囊",
      icon: "🏷️",
    },
    {
      name: "search_capsules_by_content",
      description: "按内容搜索胶囊",
      icon: "🔍",
    },
    {
      name: "get_recent_capsules",
      description: "获取最近的胶囊",
      icon: "⏰",
    },
    {
      name: "create_capsule",
      description: "创建新的灵感胶囊",
      icon: "✨",
    },
    {
      name: "get_capsule_stats",
      description: "查看知识库统计",
      icon: "📊",
    },
  ]

  const copyConfig = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(
          JSON.stringify(configType === "cursor" ? cursorConfig : claudeDesktopConfig, null, 2),
        )
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = JSON.stringify(configType === "cursor" ? cursorConfig : claudeDesktopConfig, null, 2)
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand("copy")
        textArea.remove()
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const copyUrl = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(mcpUrl)
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = mcpUrl
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand("copy")
        textArea.remove()
      }
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const getAllTags = () => {
    const tags = new Set<string>()
    capsules.forEach((capsule) => {
      capsule.tags.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags)
  }

  const getRecentCapsules = () => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    return capsules.filter((capsule) => capsule.timestamp > oneDayAgo).length
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 md:mb-6 text-center">
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">MCP服务器</h2>
        <p className="text-white/60 text-xs md:text-sm">使用Vercel MCP适配器连接你的知识宇宙</p>
      </div>

      {/* MCP Endpoint */}
      <div className="backdrop-blur-md bg-white/10 rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/20 mb-4 md:mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <Link className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-blue-400 text-sm md:text-base">MCP端点</h3>
        </div>
        <div className="bg-white/10 rounded-lg p-3 border border-white/20">
          <div className="flex items-center justify-between">
            <code className="text-blue-400 text-xs md:text-sm font-mono break-all">{mcpUrl}</code>
            <Button onClick={copyUrl} variant="ghost" size="sm" className="text-white/50 hover:text-white ml-2">
              {copiedUrl ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Server Status */}
      <div className="backdrop-blur-md bg-white/10 rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/20 mb-4 md:mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Server className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm md:text-base">Iris MCP服务器</h3>
              <p className="text-white/60 text-xs md:text-sm">Vercel MCP Adapter</p>
            </div>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-400/30 text-xs">运行中</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-center">
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-lg md:text-2xl font-bold text-white">{capsules.length}</div>
            <div className="text-white/60 text-xs md:text-sm">胶囊</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-lg md:text-2xl font-bold text-white">{getAllTags().length}</div>
            <div className="text-white/60 text-xs md:text-sm">标签</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-lg md:text-2xl font-bold text-white">5</div>
            <div className="text-white/60 text-xs md:text-sm">工具</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-lg md:text-2xl font-bold text-white">{getRecentCapsules()}</div>
            <div className="text-white/60 text-xs md:text-sm">今日</div>
          </div>
        </div>
      </div>

      {/* 可用工具 */}
      <div className="backdrop-blur-md bg-white/10 rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/20 mb-4 md:mb-6">
        <h3 className="font-semibold text-white mb-4 text-sm md:text-base">可用工具</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mcpTools.map((tool, index) => (
            <div key={index} className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{tool.icon}</span>
                <h4 className="font-medium text-white text-sm">{tool.name}</h4>
              </div>
              <p className="text-white/70 text-xs">{tool.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 配置部分 */}
      <div className="backdrop-blur-md bg-white/10 rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-white text-sm md:text-base">配置</h3>
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setConfigType("cursor")}
                className={`px-2 py-1 text-xs rounded ${
                  configType === "cursor" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
                }`}
              >
                Cursor
              </button>
              <button
                onClick={() => setConfigType("claude")}
                className={`px-2 py-1 text-xs rounded ${
                  configType === "claude" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
                }`}
              >
                Claude Desktop
              </button>
            </div>
          </div>
          <Button
            onClick={copyConfig}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs md:text-sm"
          >
            {copied ? (
              <>
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                复制配置
              </>
            )}
          </Button>
        </div>

        <div className="bg-black/30 rounded-xl p-3 md:p-4 border border-white/10 overflow-x-auto">
          <pre className="text-green-400 text-xs md:text-sm font-mono whitespace-pre-wrap">
            {JSON.stringify(configType === "cursor" ? cursorConfig : claudeDesktopConfig, null, 2)}
          </pre>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-400 text-xs md:text-sm font-bold">1</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm md:text-base">复制配置</p>
              <p className="text-white/70 text-xs md:text-sm">点击"复制配置"按钮</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-400 text-xs md:text-sm font-bold">2</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm md:text-base">添加到AI助手</p>
              <p className="text-white/70 text-xs md:text-sm">在设置中粘贴MCP配置</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-400 text-xs md:text-sm font-bold">3</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm md:text-base">重启应用</p>
              <p className="text-white/70 text-xs md:text-sm">重启后即可使用5个工具</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
