'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Trophy,
  Star,
  Gift,
  Sparkles,
  X,
  Heart,
  Crown,
  Zap,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Milestone } from '@/app/actions/milestones'

interface RecognitionBannerProps {
  milestone?: Milestone | null
  onDismiss?: () => void
  className?: string
}

interface RecognitionType {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  borderColor: string
  animation: string
}

const recognitionTypes: Record<string, RecognitionType> = {
  first_login: {
    icon: Sparkles,
    color: 'text-blue-600',
    bgColor: 'bg-gradient-to-r from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200',
    animation: 'animate-pulse'
  },
  first_document: {
    icon: Target,
    color: 'text-green-600',
    bgColor: 'bg-gradient-to-r from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    animation: 'animate-bounce'
  },
  first_time_capsule: {
    icon: Heart,
    color: 'text-purple-600',
    bgColor: 'bg-gradient-to-r from-purple-50 to-pink-50',
    borderColor: 'border-purple-200',
    animation: 'animate-pulse'
  },
  document_organizer: {
    icon: Star,
    color: 'text-yellow-600',
    bgColor: 'bg-gradient-to-r from-yellow-50 to-amber-50',
    borderColor: 'border-yellow-200',
    animation: 'animate-bounce'
  },
  document_master: {
    icon: Crown,
    color: 'text-orange-600',
    bgColor: 'bg-gradient-to-r from-orange-50 to-red-50',
    borderColor: 'border-orange-200',
    animation: 'animate-pulse'
  },
  time_capsule_creator: {
    icon: Gift,
    color: 'text-indigo-600',
    bgColor: 'bg-gradient-to-r from-indigo-50 to-purple-50',
    borderColor: 'border-indigo-200',
    animation: 'animate-bounce'
  },
  time_capsule_master: {
    icon: Trophy,
    color: 'text-purple-600',
    bgColor: 'bg-gradient-to-r from-purple-50 to-pink-50',
    borderColor: 'border-purple-200',
    animation: 'animate-pulse'
  },
  streak_3_days: {
    icon: Zap,
    color: 'text-orange-600',
    bgColor: 'bg-gradient-to-r from-orange-50 to-yellow-50',
    borderColor: 'border-orange-200',
    animation: 'animate-bounce'
  },
  streak_week: {
    icon: Zap,
    color: 'text-red-600',
    bgColor: 'bg-gradient-to-r from-red-50 to-orange-50',
    borderColor: 'border-red-200',
    animation: 'animate-pulse'
  },
  family_protector: {
    icon: Crown,
    color: 'text-emerald-600',
    bgColor: 'bg-gradient-to-r from-emerald-50 to-green-50',
    borderColor: 'border-emerald-200',
    animation: 'animate-bounce'
  },
  default: {
    icon: Trophy,
    color: 'text-gold-600',
    bgColor: 'bg-gradient-to-r from-yellow-50 to-amber-50',
    borderColor: 'border-yellow-200',
    animation: 'animate-pulse'
  }
}

export function RecognitionBanner({ milestone, onDismiss, className }: RecognitionBannerProps) {
  const [isVisible, setIsVisible] = useState(!!milestone)
  const [showFireworks, setShowFireworks] = useState(false)

  useEffect(() => {
    if (milestone) {
      setIsVisible(true)
      setShowFireworks(true)

      // Auto-hide fireworks after animation
      const fireworksTimer = setTimeout(() => {
        setShowFireworks(false)
      }, 3000)

      return () => clearTimeout(fireworksTimer)
    }
  }, [milestone])

  if (!milestone || !isVisible) {
    return null
  }

  const recognitionConfig = recognitionTypes[milestone.milestone_type] || recognitionTypes.default
  const IconComponent = recognitionConfig.icon

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  const getCelebratoryMessage = (milestoneType: string) => {
    const messages: Record<string, string[]> = {
      first_login: [
        "Vitajte v LegacyGuard! 🎉",
        "Váš prvý krok k ochrane dedičstva!",
        "Začína sa vaša cesta!"
      ],
      first_document: [
        "Fantastické! 📄",
        "Váš prvý dokument je v bezpečí!",
        "Výborný začiatok!"
      ],
      first_time_capsule: [
        "Úžasné! ⏰",
        "Vaša prvá časová schránka je vytvorená!",
        "Spomienky pre budúcnosť!"
      ],
      document_organizer: [
        "Skvelé! 📚",
        "Ste organizovaný správca dokumentov!",
        "Vaša zbierka rastie!"
      ],
      document_master: [
        "Výborné! 👑",
        "Ste majster v správe dokumentov!",
        "Profesionálny prístup!"
      ],
      time_capsule_creator: [
        "Báječné! 🎁",
        "Ste tvorca krásnych spomienok!",
        "Vaše časové schránky sú poklad!"
      ],
      time_capsule_master: [
        "Neuveriteľné! 🏆",
        "Ste majster časových schránok!",
        "Legendárny správca spomienok!"
      ],
      streak_3_days: [
        "Vynikajúco! 🔥",
        "3-dňová séria aktivity!",
        "Pokračujte v skvelej práci!"
      ],
      streak_week: [
        "Úžasné! ⚡",
        "Týždeň nepretrženej aktivity!",
        "Vaša disciplína je obdivuhodná!"
      ],
      family_protector: [
        "Fantastické! 🛡️",
        "Ste skutočný ochránca rodiny!",
        "Vaša rodina je v bezpečí!"
      ]
    }

    return messages[milestoneType] || [
      "Gratulujeme! 🎉",
      "Dosiahli ste nový míľnik!",
      "Pokračujte v skvelej práci!"
    ]
  }

  const celebratoryMessages = getCelebratoryMessage(milestone.milestone_type)

  return (
    <>
      {/* Fireworks effect */}
      {showFireworks && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 animate-ping">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          </div>
          <div className="absolute top-1/3 right-1/4 animate-ping delay-75">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          </div>
          <div className="absolute top-1/2 left-1/3 animate-ping delay-150">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          </div>
          <div className="absolute top-1/3 right-1/3 animate-ping delay-300">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          </div>
          <div className="absolute top-1/4 right-1/2 animate-ping delay-500">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
          </div>
        </div>
      )}

      {/* Recognition Banner */}
      <Card
        className={cn(
          "fixed top-4 left-1/2 transform -translate-x-1/2 z-40 max-w-md w-full mx-4",
          "shadow-2xl",
          recognitionConfig.bgColor,
          recognitionConfig.borderColor,
          "border-2",
          recognitionConfig.animation,
          className
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Icon and title */}
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "p-3 rounded-full",
                  "bg-white shadow-md",
                  recognitionConfig.animation
                )}>
                  <IconComponent
                    className={cn("h-6 w-6", recognitionConfig.color)}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {milestone.milestone_title}
                  </h3>
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", recognitionConfig.color)}
                  >
                    +{milestone.points_awarded} bodov
                  </Badge>
                </div>
              </div>

              {/* Celebratory messages */}
              <div className="space-y-1 mb-4">
                {celebratoryMessages.map((message, index) => (
                  <p
                    key={index}
                    className={cn(
                      "text-sm",
                      index === 0 ? "font-semibold text-gray-900" : "text-gray-700"
                    )}
                  >
                    {message}
                  </p>
                ))}
              </div>

              {/* Description */}
              {milestone.milestone_description && (
                <p className="text-sm text-gray-600 mb-4">
                  {milestone.milestone_description}
                </p>
              )}

              {/* Action button */}
              <Button
                onClick={handleDismiss}
                size="sm"
                className="w-full"
                variant="default"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Ďakujem!
              </Button>
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="ml-2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// Hook for managing recognition banners
export function useRecognitionBanner() {
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null)
  const [queue, setQueue] = useState<Milestone[]>([])

  const showRecognition = (milestone: Milestone) => {
    if (currentMilestone) {
      // Add to queue if banner is already showing
      setQueue(prev => [...prev, milestone])
    } else {
      setCurrentMilestone(milestone)
    }
  }

  const dismissCurrent = () => {
    setCurrentMilestone(null)

    // Show next in queue
    if (queue.length > 0) {
      const [next, ...rest] = queue
      setQueue(rest)
      setTimeout(() => {
        setCurrentMilestone(next)
      }, 500) // Small delay for smooth transition
    }
  }

  return {
    currentMilestone,
    showRecognition,
    dismissCurrent
  }
}