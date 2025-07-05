"use client"

import { formatDistanceToNow } from "date-fns"
import { Volume2, Hash, Clock, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Capsule } from "@/app/page"

interface CapsuleStreamProps {
  capsules: Capsule[]
  onDeleteCapsule: (id: string) => void
}

export default function CapsuleStream({ capsules, onDeleteCapsule }: CapsuleStreamProps) {
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
            {/* Delete Button */}
            <Button
              onClick={() => onDeleteCapsule(capsule.id)}
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white/50 hover:text-red-400 hover:bg-red-500/10 w-8 h-8 p-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            {/* Header */}
            <div className="flex items-center justify-between mb-3 pr-8">
              <div className="flex items-center space-x-2">
                {capsule.type === "voice" && (
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Volume2 className="w-3 h-3 md:w-4 md:h-4 text-red-400" />
                  </div>
                )}
                <div className="flex items-center text-white/60 text-xs md:text-sm">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDistanceToNow(new Date(capsule.timestamp), { addSuffix: true })}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="mb-3 md:mb-4">
              {capsule.content && (
                <p className="text-white leading-relaxed mb-3 text-sm md:text-base">{capsule.content}</p>
              )}

              {capsule.audio_url && (
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <audio controls className="w-full h-8">
                    <source src={capsule.audio_url} type="audio/wav" />
                  </audio>
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
          </div>
        ))}
      </div>
    </div>
  )
}
