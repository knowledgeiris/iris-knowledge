"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Hash, Clock, Trash2, ChevronDown, ChevronUp, Edit2, Save, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import type { Capsule } from "@/app/page"

interface CapsuleStreamProps {
  capsules: Capsule[]
  onDeleteCapsule: (id: string) => void
  onUpdateCapsule: (id: string, updates: { content?: string; tags?: string[] }) => void
}

export default function CapsuleStream({ capsules, onDeleteCapsule, onUpdateCapsule }: CapsuleStreamProps) {
  // 添加一个状态来跟踪哪些卡片是展开的
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})
  // 添加一个状态来跟踪哪些卡片是编辑模式
  const [editingCards, setEditingCards] = useState<Record<string, boolean>>({})
  // 添加一个状态来存储编辑中的内容和标签
  const [editContent, setEditContent] = useState<Record<string, string>>({})
  const [editTags, setEditTags] = useState<Record<string, string>>({})

  // 切换卡片展开状态
  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }))
  }

  // 开始编辑卡片
  const startEditing = (cardId: string, content: string, tags: string[]) => {
    setEditingCards(prev => ({
      ...prev,
      [cardId]: true
    }))
    setEditContent(prev => ({
      ...prev,
      [cardId]: content
    }))
    setEditTags(prev => ({
      ...prev,
      [cardId]: tags.join(", ")
    }))
    // 确保卡片展开
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: true
    }))
  }

  // 取消编辑
  const cancelEditing = (cardId: string) => {
    setEditingCards(prev => ({
      ...prev,
      [cardId]: false
    }))
  }

  // 保存编辑
  const saveEditing = (cardId: string) => {
    const content = editContent[cardId]
    const tagsString = editTags[cardId] || ""
    const tags = tagsString
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    onUpdateCapsule(cardId, { content, tags })
    
    setEditingCards(prev => ({
      ...prev,
      [cardId]: false
    }))
  }

  // 格式化内容，将文本中的换行符转换为 <br> 标签
  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  if (capsules.length === 0) {
    return (
      <div className="p-8 md:p-12 text-center">
        <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-white/10 flex items-center justify-center">
          <Hash className="w-8 h-8 md:w-12 md:h-12 text-white/50" />
        </div>
        <h3 className="text-lg md:text-xl font-semibold text-white mb-2">No Capsules Yet</h3>
        <p className="text-white/60 text-sm">Start capturing your inspirations to see them flow in your stream</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 md:mb-6 text-center">
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">Inspiration Stream</h2>
        <p className="text-white/60 text-xs md:text-sm">Your captured thoughts flowing through time</p>
      </div>

      <div className="space-y-3 md:space-y-4 max-h-[500px] md:max-h-[600px] overflow-y-auto">
        {capsules.map((capsule) => (
          <div
            key={capsule.id}
            className="backdrop-blur-md bg-white/10 rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/20 hover:bg-white/15 transition-all duration-300 group relative"
          >
            {!editingCards[capsule.id] ? (
              <>
                {/* Delete Button */}
                <Button
                  onClick={() => onDeleteCapsule(capsule.id)}
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white/50 hover:text-red-400 hover:bg-red-500/10 w-8 h-8 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                
                {/* Edit Button */}
                <Button
                  onClick={() => startEditing(capsule.id, capsule.content, capsule.tags)}
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white/50 hover:text-blue-400 hover:bg-blue-500/10 w-8 h-8 p-0"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>

                {/* Header */}
                <div className="flex items-center justify-between mb-3 pr-20">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-white/60 text-xs md:text-sm">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(new Date(capsule.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-3 md:mb-4">
                  {capsule.content && (
                    <div className="text-white leading-relaxed mb-3 text-sm md:text-base">
                      {expandedCards[capsule.id] ? (
                        // 完整内容，保留格式
                        <div className="whitespace-pre-line">{formatContent(capsule.content)}</div>
                      ) : (
                        // 缩略内容，只显示前 100 个字符
                        <div>
                          {capsule.content.length > 100 
                            ? formatContent(capsule.content.substring(0, 100) + "...") 
                            : formatContent(capsule.content)}
                        </div>
                      )}
                      
                      {/* 展开/收起按钮，仅在内容超过 100 个字符时显示 */}
                      {capsule.content.length > 100 && (
                        <Button
                          onClick={() => toggleCardExpansion(capsule.id)}
                          size="sm"
                          variant="ghost"
                          className="mt-2 text-white/50 hover:text-white hover:bg-white/10 text-xs flex items-center"
                        >
                          {expandedCards[capsule.id] ? (
                            <>Show less <ChevronUp className="ml-1 w-3 h-3" /></>
                          ) : (
                            <>Show more <ChevronDown className="ml-1 w-3 h-3" /></>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Tags */}
                {capsule.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {capsule.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        className="bg-purple-500/20 text-purple-200 border-purple-400/30 hover:bg-purple-500/30 transition-colors text-xs"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Edit Mode */}
                <div className="mb-4 md:mb-6">
                  <Textarea 
                    value={editContent[capsule.id] || ""}
                    onChange={(e) => setEditContent(prev => ({ ...prev, [capsule.id]: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white resize-none mb-3 min-h-[200px]"
                    placeholder="What's on your mind?"
                  />
                  
                  <div className="mb-3">
                    <Input 
                      value={editTags[capsule.id] || ""}
                      onChange={(e) => setEditTags(prev => ({ ...prev, [capsule.id]: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="Tags (comma separated)"
                    />
                    <p className="text-white/50 text-xs mt-1">Separate tags with commas, e.g. "thoughts, ideas, todo"</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => saveEditing(capsule.id)}
                      size="sm"
                      className="bg-purple-800 hover:bg-purple-900 text-white border-0"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    
                    <Button
                      onClick={() => cancelEditing(capsule.id)}
                      size="sm"
                      variant="outline"
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
