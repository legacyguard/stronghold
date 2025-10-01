'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Trophy,
  Star,
  Calendar,
  FileText,
  Clock,
  TrendingUp,
  Gift,
  Target,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getUserProgress, getUserMilestones, type UserProgress, type Milestone } from '@/app/actions/milestones'

interface UserProgressTrackerProps {
  className?: string
  showDetailed?: boolean
}

export function UserProgressTracker({ className, showDetailed = false }: UserProgressTrackerProps) {
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [progressResult, milestonesResult] = await Promise.all([
          getUserProgress(),
          getUserMilestones()
        ])

        if (progressResult.success) {
          setProgress(progressResult.data)
        } else {
          setError(progressResult.error || 'Unknown error')
        }

        if (milestonesResult.success) {
          setMilestones(milestonesResult.data)
        }
      } catch (err) {
        setError('Failed to load progress data')
        console.error('Progress fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !progress) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Chyba pri načítavaní pokroku: {error}</p>
        </CardContent>
      </Card>
    )
  }

  const recentMilestones = milestones
    .filter(m => m.is_achieved)
    .sort((a, b) => new Date(b.achieved_at!).getTime() - new Date(a.achieved_at!).getTime())
    .slice(0, 3)

  const nextLevelPoints = Math.ceil(progress.total_points / 100) * 100 + 100
  const progressToNextLevel = ((progress.total_points % 100) / 100) * 100

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overview Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Váš pokrok
              </CardTitle>
              <CardDescription>
                Level {Math.floor(progress.total_points / 100) + 1} • {progress.total_points} bodov
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg font-bold">
              🔥 {progress.current_streak_days}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress to next level */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Do ďalšieho levelu</span>
              <span>{100 - (progress.total_points % 100)} bodov</span>
            </div>
            <Progress value={progressToNextLevel} className="h-2" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{progress.documents_uploaded}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <FileText className="h-3 w-3" />
                Dokumenty
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{progress.time_capsules_created}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                Časové schránky
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{progress.milestones_achieved}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Star className="h-3 w-3" />
                Míľniky
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{progress.longest_streak_days}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Calendar className="h-3 w-3" />
                Najdlhšia séria
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {recentMilestones.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-600" />
              Nedávne úspechy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{milestone.milestone_title}</div>
                    <div className="text-sm text-muted-foreground">
                      {milestone.milestone_description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(milestone.achieved_at!).toLocaleDateString('sk-SK')}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    +{milestone.points_awarded} bodov
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Stats */}
      {showDetailed && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Activity Streak */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                Aktivita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {progress.current_streak_days}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Aktuálna séria dní
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Najdlhšia séria:</span>
                  <span className="font-medium">{progress.longest_streak_days} dní</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Posledná aktivita:</span>
                  <span className="font-medium">
                    {new Date(progress.last_activity_date).toLocaleDateString('sk-SK')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goals Progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Ciele
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Documents goal */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Dokumenty (cieľ: 10)</span>
                    <span>{progress.documents_uploaded}/10</span>
                  </div>
                  <Progress value={(progress.documents_uploaded / 10) * 100} className="h-2" />
                </div>

                {/* Time capsules goal */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Časové schránky (cieľ: 5)</span>
                    <span>{progress.time_capsules_created}/5</span>
                  </div>
                  <Progress value={(progress.time_capsules_created / 5) * 100} className="h-2" />
                </div>

                {/* Streak goal */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Týždenná séria (cieľ: 7)</span>
                    <span>{Math.min(progress.current_streak_days, 7)}/7</span>
                  </div>
                  <Progress value={(Math.min(progress.current_streak_days, 7) / 7) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Pokračujte vo svojom progrese
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href="/documents/upload">
                  <FileText className="h-4 w-4 mr-2" />
                  Nahrať dokument
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href="/time-capsules/create">
                  <Clock className="h-4 w-4 mr-2" />
                  Vytvoriť časovú schránku
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}