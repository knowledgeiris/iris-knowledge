"use client"

import type React from "react"
import { useState } from "react"
import { Send, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { Capsule } from "@/app/page"

interface CaptureEngineProps {
  onAddCapsule: (capsule: Omit<Capsule, "id" | "timestamp">) => void
}

export default function CaptureEngine({ onAddCapsule }: CaptureEngineProps) {
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")

  const handleSubmit = () => {
    if (!content.trim()) return

    onAddCapsule({
      content: content.trim(),
      tags,
    })

    // Reset form
    setContent("")
    setTags([])
    setCurrentTag("")
  }

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()])
      setCurrentTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="text-center mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">Capture Your Inspiration</h2>
        <p className="text-white/60 text-xs md:text-sm">
          Save your thoughts instantly - type and tag for easy retrieval
        </p>
      </div>

      {/* Text Input */}
      <div className="space-y-3 md:space-y-4">
        <Textarea
          placeholder="What's inspiring you right now? Share your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          className="min-h-[120px] md:min-h-[150px] bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl resize-none focus:ring-2 focus:ring-blue-400/50 text-sm md:text-base"
        />

        {/* Tags Input */}
        <div className="space-y-3">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
              <Input
                placeholder="Add tags (e.g., inspiration, ideas, notes)"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleTagKeyPress}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl text-sm md:text-base"
              />
            </div>
            <Button
              onClick={addTag}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl px-3 md:px-4 text-xs md:text-sm"
            >
              Add
            </Button>
          </div>

          {/* Tags Display */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  className="bg-blue-500/20 text-blue-200 border-blue-400/30 cursor-pointer hover:bg-blue-500/30 transition-colors text-xs"
                  onClick={() => removeTag(tag)}
                >
                  #{tag} ×
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl py-2 md:py-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
        >
          <Send className="w-4 h-4 mr-2" />
          Create Inspiration Capsule
        </Button>
      </div>

      {/* Quick Tips */}
      <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/10">
        <h3 className="text-white/80 font-medium text-sm mb-2">💡 Quick Tips</h3>
        <ul className="text-white/60 text-xs space-y-1">
          <li>• Press Enter to submit, Shift+Enter for new line</li>
          <li>• Use tags to organize your thoughts by topic</li>
          <li>• Click on tags to remove them</li>
          <li>• Your capsules are automatically saved</li>
        </ul>
      </div>
    </div>
  )
}
