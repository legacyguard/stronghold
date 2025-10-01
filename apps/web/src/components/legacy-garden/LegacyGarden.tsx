'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface LegacyGardenProps {
  progress: {
    total_points: number
    documents_uploaded: number
    time_capsules_created: number
    milestones_achieved: number
    current_streak_days: number
  }
  milestones: Array<{
    id: string
    milestone_type: string
    milestone_title: string
    is_achieved: boolean
    achieved_at?: string
  }>
  className?: string
}

interface GardenNode {
  id: string
  type: 'tree' | 'flower' | 'milestone_marker' | 'memory_stone'
  x: number
  y: number
  growthStage: number // 1-5
  isUnlocked: boolean
  milestone?: string
}

export function LegacyGarden({ progress, milestones, className }: LegacyGardenProps) {
  // Calculate garden progress based on user achievements
  const calculateGardenNodes = (): GardenNode[] => {
    const nodes: GardenNode[] = []

    // Base tree - always present, grows with total progress
    const treeGrowth = Math.min(5, Math.floor(progress.total_points / 20) + 1)
    nodes.push({
      id: 'main-tree',
      type: 'tree',
      x: 200,
      y: 180,
      growthStage: treeGrowth,
      isUnlocked: true
    })

    // Document flowers - one for every 3 documents
    const flowerCount = Math.floor(progress.documents_uploaded / 3)
    for (let i = 0; i < Math.min(flowerCount, 4); i++) {
      nodes.push({
        id: `flower-${i}`,
        type: 'flower',
        x: 120 + i * 40,
        y: 250 + (i % 2) * 20,
        growthStage: Math.min(3, Math.floor(progress.documents_uploaded / (3 * (i + 1))) + 1),
        isUnlocked: progress.documents_uploaded >= 3 * (i + 1)
      })
    }

    // Time capsule memory stones
    const stoneCount = Math.min(progress.time_capsules_created, 3)
    for (let i = 0; i < stoneCount; i++) {
      nodes.push({
        id: `memory-stone-${i}`,
        type: 'memory_stone',
        x: 300 + i * 30,
        y: 240 + i * 15,
        growthStage: 1,
        isUnlocked: true
      })
    }

    // Milestone markers for special achievements
    const specialMilestones = milestones.filter(m =>
      ['streak_week', 'document_master', 'time_capsule_master', 'family_protector'].includes(m.milestone_type)
    )

    specialMilestones.slice(0, 3).forEach((milestone, i) => {
      if (milestone.is_achieved) {
        nodes.push({
          id: `milestone-${milestone.id}`,
          type: 'milestone_marker',
          x: 150 + i * 80,
          y: 120 + i * 20,
          growthStage: 1,
          isUnlocked: true,
          milestone: milestone.milestone_type
        })
      }
    })

    return nodes
  }

  const gardenNodes = calculateGardenNodes()

  return (
    <div className={cn("relative w-full max-w-lg mx-auto", className)}>
      <svg
        viewBox="0 0 400 300"
        className="w-full h-auto bg-gradient-to-b from-sky-200 to-green-100 rounded-lg shadow-inner"
        style={{ aspectRatio: '4/3' }}
      >
        {/* Background elements */}
        <defs>
          <radialGradient id="sunGradient" cx="50%" cy="30%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#EAB308" />
          </radialGradient>
          <linearGradient id="groundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
        </defs>

        {/* Sun */}
        <circle
          cx="350"
          cy="50"
          r="25"
          fill="url(#sunGradient)"
          className="drop-shadow-sm"
        />

        {/* Ground */}
        <ellipse
          cx="200"
          cy="280"
          rx="180"
          ry="20"
          fill="url(#groundGradient)"
          opacity="0.7"
        />

        {/* Render garden nodes */}
        {gardenNodes.map(node => (
          <g key={node.id} opacity={node.isUnlocked ? 1 : 0.3}>
            {node.type === 'tree' && <Tree node={node} />}
            {node.type === 'flower' && <Flower node={node} />}
            {node.type === 'memory_stone' && <MemoryStone node={node} />}
            {node.type === 'milestone_marker' && <MilestoneMarker node={node} />}
          </g>
        ))}

        {/* Progress indicator */}
        <g transform="translate(10, 10)">
          <rect width="120" height="30" rx="15" fill="rgba(0,0,0,0.1)" />
          <rect
            width={Math.min(120, (progress.total_points / 200) * 120)}
            height="30"
            rx="15"
            fill="#16A34A"
          />
          <text
            x="60"
            y="20"
            textAnchor="middle"
            fill="white"
            fontSize="12"
            fontWeight="bold"
          >
            {progress.total_points} bodov
          </text>
        </g>
      </svg>

      {/* Garden status */}
      <div className="mt-4 text-center">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-green-700">
            <div className="font-semibold">{progress.documents_uploaded}</div>
            <div className="text-xs opacity-75">Dokumenty</div>
          </div>
          <div className="text-purple-700">
            <div className="font-semibold">{progress.time_capsules_created}</div>
            <div className="text-xs opacity-75">Časové schránky</div>
          </div>
          <div className="text-blue-700">
            <div className="font-semibold">{progress.milestones_achieved}</div>
            <div className="text-xs opacity-75">Míľniky</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Tree({ node }: { node: GardenNode }) {
  const { x, y, growthStage } = node
  const treeHeight = 20 + growthStage * 15
  const treeWidth = 10 + growthStage * 8
  const crownSize = 15 + growthStage * 10

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Trunk */}
      <rect
        x={-treeWidth / 2}
        y={-treeHeight}
        width={treeWidth}
        height={treeHeight}
        fill="#8B4513"
        rx="2"
      />

      {/* Crown */}
      <circle
        cx="0"
        cy={-treeHeight - crownSize / 2}
        r={crownSize}
        fill={growthStage >= 4 ? "#22C55E" : growthStage >= 2 ? "#16A34A" : "#15803D"}
        className="drop-shadow-sm"
      />

      {/* Fruits for mature tree */}
      {growthStage >= 4 && (
        <>
          <circle cx="-8" cy={-treeHeight - crownSize / 2 + 5} r="3" fill="#EF4444" />
          <circle cx="8" cy={-treeHeight - crownSize / 2 - 5} r="3" fill="#EF4444" />
          <circle cx="0" cy={-treeHeight - crownSize / 2 + 8} r="3" fill="#EF4444" />
        </>
      )}
    </g>
  )
}

function Flower({ node }: { node: GardenNode }) {
  const { x, y, growthStage } = node
  const stemHeight = 5 + growthStage * 8
  const petalSize = 3 + growthStage * 2

  const colors = ['#EC4899', '#8B5CF6', '#06B6D4', '#10B981']
  const colorIndex = Math.floor(x / 100) % colors.length

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Stem */}
      <line
        x1="0"
        y1="0"
        x2="0"
        y2={-stemHeight}
        stroke="#16A34A"
        strokeWidth="2"
      />

      {/* Flower */}
      {growthStage >= 2 && (
        <g transform={`translate(0, ${-stemHeight})`}>
          {/* Petals */}
          {[0, 1, 2, 3, 4].map(i => (
            <circle
              key={i}
              cx={Math.cos((i * 72) * Math.PI / 180) * (petalSize + 1)}
              cy={Math.sin((i * 72) * Math.PI / 180) * (petalSize + 1)}
              r={petalSize}
              fill={colors[colorIndex]}
              opacity="0.8"
            />
          ))}

          {/* Center */}
          <circle cx="0" cy="0" r="2" fill="#FCD34D" />
        </g>
      )}
    </g>
  )
}

function MemoryStone({ node }: { node: GardenNode }) {
  const { x, y } = node

  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse
        cx="0"
        cy="0"
        rx="12"
        ry="8"
        fill="#64748B"
        className="drop-shadow-sm"
      />
      <ellipse
        cx="0"
        cy="-2"
        rx="10"
        ry="6"
        fill="#94A3B8"
      />
      {/* Time capsule symbol */}
      <circle cx="0" cy="-2" r="3" fill="#7C3AED" opacity="0.7" />
      <text x="0" y="0" textAnchor="middle" fill="white" fontSize="8">⏰</text>
    </g>
  )
}

function MilestoneMarker({ node }: { node: GardenNode }) {
  const { x, y, milestone } = node

  const getMarkerColor = (milestoneType?: string) => {
    switch (milestoneType) {
      case 'streak_week': return '#F59E0B'
      case 'document_master': return '#10B981'
      case 'time_capsule_master': return '#8B5CF6'
      case 'family_protector': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const getMarkerSymbol = (milestoneType?: string) => {
    switch (milestoneType) {
      case 'streak_week': return '🔥'
      case 'document_master': return '📚'
      case 'time_capsule_master': return '⏰'
      case 'family_protector': return '🛡️'
      default: return '⭐'
    }
  }

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Flag pole */}
      <line x1="0" y1="0" x2="0" y2="-25" stroke="#8B4513" strokeWidth="2" />

      {/* Flag */}
      <path
        d="M 0,-25 L 20,-20 L 20,-12 L 15,-8 L 0,-13 Z"
        fill={getMarkerColor(milestone)}
        className="drop-shadow-sm"
      />

      {/* Symbol */}
      <text x="8" y="-15" fontSize="8" textAnchor="middle">
        {getMarkerSymbol(milestone)}
      </text>
    </g>
  )
}