"use client"

import { useMemo } from "react"
import { Star, Sparkles, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Capsule } from "@/app/page"

interface GalaxyViewProps {
  capsules: Capsule[]
  onDeleteCapsule: (id: string) => void
}

interface Galaxy {
  name: string
  capsules: Capsule[]
  color: string
}

export default function GalaxyView({ capsules, onDeleteCapsule }: GalaxyViewProps) {
  const galaxies = useMemo(() => {
    const galaxyMap = new Map<string, Capsule[]>()
    const colors = [
      "from-blue-400 to-cyan-400",
      "from-purple-400 to-pink-400",
      "from-green-400 to-emerald-400",
      "from-yellow-400 to-orange-400",
      "from-red-400 to-rose-400",
      "from-indigo-400 to-purple-400",
    ]

    // Group capsules by tags
    capsules.forEach((capsule) => {
      if (capsule.tags.length === 0) {
        const untagged = galaxyMap.get("untagged") || []
        galaxyMap.set("untagged", [...untagged, capsule])
      } else {
        capsule.tags.forEach((tag) => {
          const existing = galaxyMap.get(tag) || []
          galaxyMap.set(tag, [...existing, capsule])
        })
      }
    })

    // Convert to galaxy objects
    return Array.from(galaxyMap.entries()).map(([name, capsules], index) => ({
      name: name === "untagged" ? "Uncharted Space" : name,
      capsules,
      color: colors[index % colors.length],
    }))
  }, [capsules])

  if (capsules.length === 0) {
    return (
      <div className="p-8 md:p-12 text-center">
        <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-white/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-white/50" />
        </div>
        <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Empty Universe</h3>
        <p className="text-white/60 text-sm">Capture some inspirations to see your knowledge galaxy come to life</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 md:mb-6 text-center">
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">Knowledge Galaxy</h2>
        <p className="text-white/60 text-xs md:text-sm">Your inspirations clustered by cosmic themes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-h-[500px] md:max-h-[600px] overflow-y-auto">
        {galaxies.map((galaxy, index) => (
          <div
            key={galaxy.name}
            className="backdrop-blur-md bg-white/10 rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/20 hover:bg-white/15 transition-all duration-300 group"
          >
            {/* Galaxy Header */}
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-r ${galaxy.color} flex items-center justify-center`}
                >
                  <Star className="w-3 h-3 md:w-4 md:h-4 text-white" />
                </div>
                <h3 className="font-semibold text-white capitalize text-sm md:text-base">{galaxy.name}</h3>
              </div>
              <Badge className="bg-white/20 text-white border-white/30 text-xs">{galaxy.capsules.length}</Badge>
            </div>

            {/* Stars (Capsules) */}
            <div className="space-y-2 md:space-y-3 max-h-40 md:max-h-48 overflow-y-auto">
              {galaxy.capsules.slice(0, 5).map((capsule) => (
                <div
                  key={capsule.id}
                  className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group/star relative"
                >
                  {/* Delete Button for Star */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteCapsule(capsule.id)
                    }}
                    size="sm"
                    variant="ghost"
                    className="absolute top-1 right-1 opacity-0 group-hover/star:opacity-100 transition-opacity duration-200 text-white/50 hover:text-red-400 hover:bg-red-500/10 w-6 h-6 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>

                  <p className="text-white/90 text-xs md:text-sm line-clamp-2 mb-2 pr-6">
                    {capsule.content || "Voice Capsule"}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      {capsule.tags.slice(0, 2).map((tag, tagIndex) => (
                        <Badge key={tagIndex} className="text-xs bg-white/10 text-white/70 border-white/20">
                          #{tag}
                        </Badge>
                      ))}
                      {capsule.tags.length > 2 && (
                        <Badge className="text-xs bg-white/10 text-white/70 border-white/20">
                          +{capsule.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${galaxy.color}`}></div>
                  </div>
                </div>
              ))}

              {galaxy.capsules.length > 5 && (
                <div className="text-center py-2">
                  <Badge className="bg-white/10 text-white/60 border-white/20 text-xs">
                    +{galaxy.capsules.length - 5} more stars
                  </Badge>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Galaxy Stats */}
      <div className="mt-4 md:mt-6 text-center">
        <div className="backdrop-blur-md bg-white/10 rounded-2xl p-3 md:p-4 border border-white/20 inline-block">
          <p className="text-white/70 text-xs md:text-sm">
            <span className="text-white font-semibold">{galaxies.length}</span> galaxies •
            <span className="text-white font-semibold ml-1">{capsules.length}</span> stars illuminating your cosmos
          </p>
        </div>
      </div>
    </div>
  )
}
