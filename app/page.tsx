"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Filter, Globe, Settings, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import CaptureEngine from "@/components/capture-engine"
import CapsuleStream from "@/components/capsule-stream"
import GalaxyView from "@/components/galaxy-view"
import MCPServer from "@/components/mcp-server"
import { ToastContainer } from "@/components/toast-container"
import { useToast } from "@/hooks/use-toast"
import { checkConnection, capsuleOperations } from "@/lib/supabase-client"

export interface Capsule {
  id: string
  content: string
  tags: string[]
  timestamp: number
}

export default function HomePage() {
  const [capsules, setCapsules] = useState<Capsule[]>([])
  const [currentView, setCurrentView] = useState<"capture" | "stream" | "galaxy" | "mcp">("capture")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [deletedCapsules, setDeletedCapsules] = useState<Map<string, Capsule>>(new Map())

  const { addToast } = useToast()

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Load capsules from Supabase
  useEffect(() => {
    loadCapsules()
  }, [])

  const loadCapsules = async () => {
    try {
      setIsLoading(true)
      console.log("开始加载胶囊...")

      // Check connection first
      const isConnected = await checkConnection()
      console.log("数据库连接状态:", isConnected)
      
      if (!isConnected) {
        console.warn("数据库连接失败，使用localStorage回退")
        const saved = localStorage.getItem("iris-capsules")
        if (saved) {
          setCapsules(JSON.parse(saved))
        }
        return
      }

      console.log("从数据库获取数据...")
      const data = await capsuleOperations.getAll()
      console.log("数据库返回数据:", data)
      
      const formattedCapsules = data.map((item: any) => ({
        id: item.id as string,
        content: item.content as string,
        tags: (item.tags || []) as string[],
        timestamp: item.timestamp as number,
      }))

      setCapsules(formattedCapsules)
      localStorage.setItem("iris-capsules", JSON.stringify(formattedCapsules))
    } catch (error) {
      console.error("数据库错误:", error)
      // Fallback to localStorage
      const saved = localStorage.getItem("iris-capsules")
      if (saved) {
        setCapsules(JSON.parse(saved))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const addCapsule = async (capsule: Omit<Capsule, "id" | "timestamp">) => {
    const newCapsule: Capsule = {
      ...capsule,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    
    console.log("新胶囊:", newCapsule)

    // Optimistically update UI
    setCapsules((prev) => [newCapsule, ...prev])

    try {
      // Try to save to database
      console.log("检查数据库连接...")
      const isConnected = await checkConnection()
      console.log("数据库连接状态:", isConnected)
      
      if (isConnected) {
        console.log("开始保存到数据库...")
        const result = await capsuleOperations.create({
          content: newCapsule.content,
          tags: newCapsule.tags,
          timestamp: newCapsule.timestamp,
        })
        console.log("数据库保存结果:", result)
      } else {
        console.warn("数据库未连接，只保存到本地")
      }
    } catch (error) {
      console.error("保存到数据库时出错:", error)
    }

    // Always save to localStorage as backup
    const updatedCapsules = [newCapsule, ...capsules]
    localStorage.setItem("iris-capsules", JSON.stringify(updatedCapsules))
  }

  const deleteCapsule = async (capsuleId: string) => {
    const capsuleToDelete = capsules.find((c) => c.id === capsuleId)
    if (!capsuleToDelete) return

    // 立即从UI中移除
    setCapsules((prev) => prev.filter((c) => c.id !== capsuleId))

    // 保存到已删除列表，用于撤销
    setDeletedCapsules((prev) => new Map(prev).set(capsuleId, capsuleToDelete))

    // 更新localStorage
    const updatedCapsules = capsules.filter((c) => c.id !== capsuleId)
    localStorage.setItem("iris-capsules", JSON.stringify(updatedCapsules))

    // 显示撤销提示
    addToast({
      title: "Capsule deleted",
      description: "Your inspiration has been removed from the cosmos",
      duration: 4000,
      action: (
        <Button
          size="sm"
          variant="outline"
          onClick={() => undoDelete(capsuleId)}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
        >
          Undo
        </Button>
      ),
      onClose: () => {},
    })

    // 4秒后永久删除（从数据库）
    setTimeout(async () => {
      try {
        const isConnected = await checkConnection()
        if (isConnected) {
          await capsuleOperations.delete(capsuleId)
        }
      } catch (error) {
        console.error("Error deleting from database:", error)
      }

      // 从已删除列表中移除
      setDeletedCapsules((prev) => {
        const newMap = new Map(prev)
        newMap.delete(capsuleId)
        return newMap
      })
    }, 4000)
  }

  const undoDelete = (capsuleId: string) => {
    const capsuleToRestore = deletedCapsules.get(capsuleId)
    if (!capsuleToRestore) return

    // 恢复到capsules列表
    setCapsules((prev) => [capsuleToRestore, ...prev].sort((a, b) => b.timestamp - a.timestamp))

    // 从已删除列表中移除
    setDeletedCapsules((prev) => {
      const newMap = new Map(prev)
      newMap.delete(capsuleId)
      return newMap
    })

    // 更新localStorage
    const restoredCapsules = [capsuleToRestore, ...capsules].sort((a, b) => b.timestamp - a.timestamp)
    localStorage.setItem("iris-capsules", JSON.stringify(restoredCapsules))

    addToast({
      title: "Capsule restored",
      description: "Your inspiration is back in the cosmos",
      duration: 2000,
      onClose: () => {},
    })
  }

  const updateCapsule = async (capsuleId: string, updates: { content?: string, tags?: string[] }) => {
    try {
      // 找到要更新的胶囊
      const capsuleIndex = capsules.findIndex((c) => c.id === capsuleId)
      if (capsuleIndex === -1) return

      // 创建更新后的胶囊
      const updatedCapsule = {
        ...capsules[capsuleIndex],
        ...updates,
      }

      // 乐观更新UI
      const updatedCapsules = [...capsules]
      updatedCapsules[capsuleIndex] = updatedCapsule
      setCapsules(updatedCapsules)

      // 更新localStorage
      localStorage.setItem("iris-capsules", JSON.stringify(updatedCapsules))

      // 尝试保存到数据库
      const isConnected = await checkConnection()
      if (isConnected) {
        await capsuleOperations.update(capsuleId, updates)
      } else {
        console.warn("数据库未连接，只保存到本地")
      }

      // 显示成功提示
      addToast({
        title: "Capsule updated",
        description: "Your inspiration has been updated in the cosmos",
        duration: 2000,
        onClose: () => {},
      })

    } catch (error) {
      console.error("更新胶囊时出错:", error)
      
      // 显示错误提示
      addToast({
        title: "Update failed",
        description: "Failed to update your capsule. Please try again.",
        duration: 2000,
        onClose: () => {},
      })
    }
  }

  const getAllTags = () => {
    const tags = new Set<string>()
    capsules.forEach((capsule) => {
      capsule.tags.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags)
  }

  const filteredCapsules = capsules.filter((capsule) => {
    const matchesSearch =
      capsule.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      capsule.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => capsule.tags.includes(tag))
    return matchesSearch && matchesTags
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading your cosmos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 md:w-80 md:h-80 md:-top-40 md:-right-40 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 md:w-80 md:h-80 md:-bottom-40 md:-left-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-60 md:h-60 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Main container */}
      <div className="relative z-10 container mx-auto px-3 py-4 md:px-4 md:py-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Iris's KnowledgeMesh
          </h1>
          <p className="text-white/70 text-xs md:text-sm">Capture • Organize • Deploy Your Knowledge Universe</p>

          {/* Connection Status */}
          <div className="flex items-center justify-center mt-2">
            <div className="flex items-center space-x-1 text-xs">
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400">Offline Mode</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="backdrop-blur-md bg-white/10 rounded-full p-1 border border-white/20 w-full max-w-md">
            <div className="grid grid-cols-4 gap-1">
              <Button
                variant={currentView === "capture" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentView("capture")}
                className={`rounded-full px-2 md:px-4 text-xs md:text-sm ${
                  currentView === "capture"
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">Capture</span>
              </Button>
              <Button
                variant={currentView === "stream" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentView("stream")}
                className={`rounded-full px-2 md:px-4 text-xs md:text-sm ${
                  currentView === "stream"
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Filter className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">Stream</span>
              </Button>
              <Button
                variant={currentView === "galaxy" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentView("galaxy")}
                className={`rounded-full px-2 md:px-4 text-xs md:text-sm ${
                  currentView === "galaxy"
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Globe className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">Galaxy</span>
              </Button>
              <Button
                variant={currentView === "mcp" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentView("mcp")}
                className={`rounded-full px-2 md:px-4 text-xs md:text-sm ${
                  currentView === "mcp" ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Settings className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">MCP</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filter (for stream and galaxy views) */}
        {(currentView === "stream" || currentView === "galaxy") && (
          <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
            <div className="backdrop-blur-md bg-white/10 rounded-2xl p-3 md:p-4 border border-white/20">
              <div className="relative mb-3 md:mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                <Input
                  placeholder="Search capsules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl text-sm md:text-base"
                />
              </div>

              {getAllTags().length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {getAllTags().map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className={`cursor-pointer transition-all text-xs ${
                        selectedTags.includes(tag)
                          ? "bg-blue-500/50 text-white border-blue-400"
                          : "bg-white/10 text-white/70 border-white/30 hover:bg-white/20"
                      }`}
                      onClick={() => {
                        setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
                      }}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="backdrop-blur-md bg-white/5 rounded-2xl md:rounded-3xl border border-white/20 overflow-hidden">
          {currentView === "capture" && <CaptureEngine onAddCapsule={addCapsule} />}

          {currentView === "stream" && (
            <CapsuleStream 
              capsules={filteredCapsules} 
              onDeleteCapsule={deleteCapsule}
              onUpdateCapsule={updateCapsule} 
            />
          )}

          {currentView === "galaxy" && <GalaxyView capsules={filteredCapsules} onDeleteCapsule={deleteCapsule} />}

          {currentView === "mcp" && <MCPServer capsules={capsules} />}
        </div>

        {/* Stats */}
        <div className="mt-4 md:mt-6 text-center">
          <div className="backdrop-blur-md bg-white/10 rounded-2xl p-3 md:p-4 border border-white/20 inline-block">
            <p className="text-white/70 text-xs md:text-sm">
              <span className="text-white font-semibold">{capsules.length}</span> capsules captured •
              <span className="text-white font-semibold ml-1">{getAllTags().length}</span> galaxies formed
            </p>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  )
}
