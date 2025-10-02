"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOnboardingGeneration, useSofiaState } from '@/lib/stores/magic-onboarding-store';
import { ProfessionalValueCalculator } from './ProfessionalValueCalculator';

export function DashboardGeneration() {
  const { isGenerating, progress, scenario } = useOnboardingGeneration();
  const { message } = useSofiaState();

  if (isGenerating) {
    return <GeneratingView progress={progress} message={message} />;
  }

  if (scenario) {
    return <CompletedDashboard scenario={scenario} />;
  }

  return null;
}

interface GeneratingViewProps {
  progress: number;
  message: string;
}

function GeneratingView({ progress, message }: GeneratingViewProps) {
  const generationSteps = [
    { progress: 25, icon: '📊', title: 'Analyzujem vašu situáciu' },
    { progress: 50, icon: '🎯', title: 'Vyberám optimálnu stratégiu' },
    { progress: 75, icon: '⚙️', title: 'Pripravujem personalizované nástroje' },
    { progress: 100, icon: '✅', title: 'Plán je pripravený' }
  ];

  const currentStep = generationSteps.find(step => progress <= step.progress) || generationSteps[3];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
      <ProfessionalValueCalculator />

      <div className="max-w-4xl mx-auto px-lg py-2xl flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2xl text-center max-w-2xl w-full"
        >
          {/* Progress Circle */}
          <div className="relative w-32 h-32 mx-auto mb-2xl">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="transparent"
                className="opacity-20"
              />
              {/* Progress circle */}
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - progress / 100) }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e40af" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div>
                <motion.div
                  key={currentStep.icon}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-4xl mb-xs"
                >
                  {currentStep.icon}
                </motion.div>
                <motion.div
                  key={progress}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-2xl font-bold text-primary"
                >
                  {progress}%
                </motion.div>
              </div>
            </div>
          </div>

          {/* Current Step */}
          <motion.h2
            key={currentStep.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-executive font-bold text-gray-800 mb-md"
          >
            {currentStep.title}
          </motion.h2>

          {/* Sofia Message */}
          <motion.p
            key={message}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-body text-gray-600 mb-2xl leading-relaxed"
          >
            {message}
          </motion.p>

          {/* Progress Steps */}
          <div className="flex justify-center space-x-lg">
            {generationSteps.map((step, index) => (
              <div key={index} className="flex flex-col items-center space-y-sm">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                    progress >= step.progress
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <span className="text-lg">{step.icon}</span>
                </div>
                <span className="text-small text-gray-600 max-w-20 text-center leading-tight">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

interface CompletedDashboardProps {
  scenario: any;
}

function CompletedDashboard({ scenario }: CompletedDashboardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <ProfessionalValueCalculator />

      <div className="max-w-6xl mx-auto px-lg py-2xl">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-2xl"
        >
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-lg">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-md">
            Váš plán je pripravený!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Personalizovaný dashboard pre scenár <span className="font-semibold text-primary">{scenario.name}</span> je aktívny.
            Máte {scenario.missions.length} prioritných úloh.
          </p>
        </motion.div>

        {/* Scenario Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2xl mb-2xl"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-lg">
            {scenario.name}
          </h2>
          <p className="text-body text-gray-600 mb-xl">
            {scenario.description}
          </p>

          {/* Missions Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {scenario.missions.map((mission: any, index: number) => (
              <MissionCard key={mission.id} mission={mission} index={index} />
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center space-x-lg"
        >
          <Button size="lg" className="bg-primary hover:bg-primary-dark px-2xl py-lg">
            Začať s prvou úlohou
          </Button>
          <Button variant="outline" size="lg" className="px-2xl py-lg">
            Preskúmať dashboard
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

interface MissionCardProps {
  mission: any;
  index: number;
}

function MissionCard({ mission, index }: MissionCardProps) {
  const priorityColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-blue-200 bg-blue-50'
  };

  const priorityTextColors = {
    high: 'text-red-700',
    medium: 'text-yellow-700',
    low: 'text-blue-700'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
    >
      <Card className={`border-2 ${priorityColors[mission.priority as keyof typeof priorityColors]} hover:shadow-md transition-shadow`}>
        <CardHeader className="pb-sm">
          <div className="flex items-start justify-between">
            <CardTitle className="text-body font-semibold text-gray-800">
              {mission.title}
            </CardTitle>
            <span className={`text-xs font-medium px-sm py-xs rounded-full ${priorityTextColors[mission.priority as keyof typeof priorityTextColors]} bg-white`}>
              {mission.priority === 'high' ? 'Vysoká' : mission.priority === 'medium' ? 'Stredná' : 'Nízka'}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-caption text-gray-600 mb-md leading-relaxed">
            {mission.description}
          </p>
          <div className="flex items-center justify-between text-small text-gray-500">
            <span>⏱️ {mission.estimatedTime}</span>
            <span className="font-medium">Čaká</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}