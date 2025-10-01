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
            {generationSteps.map((step, index) => (\n              <div key={index} className=\"flex flex-col items-center space-y-sm\">\n                <div\n                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${\n                    progress >= step.progress\n                      ? 'bg-primary text-white'\n                      : 'bg-gray-200 text-gray-500'\n                  }`}\n                >\n                  <span className=\"text-lg\">{step.icon}</span>\n                </div>\n                <span className=\"text-small text-gray-600 max-w-20 text-center leading-tight\">\n                  {step.title}\n                </span>\n              </div>\n            ))}\n          </div>\n        </motion.div>\n      </div>\n    </div>\n  );\n}\n\ninterface CompletedDashboardProps {\n  scenario: any;\n}\n\nfunction CompletedDashboard({ scenario }: CompletedDashboardProps) {\n  return (\n    <div className=\"min-h-screen bg-gradient-to-br from-slate-50 to-blue-50\">\n      <ProfessionalValueCalculator />\n\n      <div className=\"max-w-6xl mx-auto px-lg py-2xl\">\n        {/* Success Header */}\n        <motion.div\n          initial={{ opacity: 0, y: -20 }}\n          animate={{ opacity: 1, y: 0 }}\n          transition={{ duration: 0.5 }}\n          className=\"text-center mb-2xl\"\n        >\n          <div className=\"w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-lg\">\n            <svg className=\"w-10 h-10 text-white\" fill=\"currentColor\" viewBox=\"0 0 20 20\">\n              <path fillRule=\"evenodd\" d=\"M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z\" clipRule=\"evenodd\" />\n            </svg>\n          </div>\n          <h1 className=\"text-4xl font-bold text-gray-800 mb-md\">\n            Váš plán je pripravený!\n          </h1>\n          <p className=\"text-xl text-gray-600 max-w-2xl mx-auto\">\n            Personalizovaný dashboard pre scenár <span className=\"font-semibold text-primary\">{scenario.name}</span> je aktívny.\n            Máte {scenario.missions.length} prioritných úloh.\n          </p>\n        </motion.div>\n\n        {/* Scenario Overview */}\n        <motion.div\n          initial={{ opacity: 0, y: 20 }}\n          animate={{ opacity: 1, y: 0 }}\n          transition={{ duration: 0.5, delay: 0.2 }}\n          className=\"bg-white rounded-2xl shadow-lg border border-gray-100 p-2xl mb-2xl\"\n        >\n          <h2 className=\"text-2xl font-bold text-gray-800 mb-lg\">\n            {scenario.name}\n          </h2>\n          <p className=\"text-body text-gray-600 mb-xl\">\n            {scenario.description}\n          </p>\n\n          {/* Missions Grid */}\n          <div className=\"grid md:grid-cols-2 lg:grid-cols-3 gap-lg\">\n            {scenario.missions.map((mission: any, index: number) => (\n              <MissionCard key={mission.id} mission={mission} index={index} />\n            ))}\n          </div>\n        </motion.div>\n\n        {/* Action Buttons */}\n        <motion.div\n          initial={{ opacity: 0 }}\n          animate={{ opacity: 1 }}\n          transition={{ duration: 0.5, delay: 0.4 }}\n          className=\"flex justify-center space-x-lg\"\n        >\n          <Button size=\"lg\" className=\"bg-primary hover:bg-primary-dark px-2xl py-lg\">\n            Začať s prvou úlohou\n          </Button>\n          <Button variant=\"outline\" size=\"lg\" className=\"px-2xl py-lg\">\n            Preskúmať dashboard\n          </Button>\n        </motion.div>\n      </div>\n    </div>\n  );\n}\n\ninterface MissionCardProps {\n  mission: any;\n  index: number;\n}\n\nfunction MissionCard({ mission, index }: MissionCardProps) {\n  const priorityColors = {\n    high: 'border-red-200 bg-red-50',\n    medium: 'border-yellow-200 bg-yellow-50',\n    low: 'border-blue-200 bg-blue-50'\n  };\n\n  const priorityTextColors = {\n    high: 'text-red-700',\n    medium: 'text-yellow-700',\n    low: 'text-blue-700'\n  };\n\n  return (\n    <motion.div\n      initial={{ opacity: 0, y: 20 }}\n      animate={{ opacity: 1, y: 0 }}\n      transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}\n    >\n      <Card className={`border-2 ${priorityColors[mission.priority as keyof typeof priorityColors]} hover:shadow-md transition-shadow`}>\n        <CardHeader className=\"pb-sm\">\n          <div className=\"flex items-start justify-between\">\n            <CardTitle className=\"text-body font-semibold text-gray-800\">\n              {mission.title}\n            </CardTitle>\n            <span className={`text-xs font-medium px-sm py-xs rounded-full ${priorityTextColors[mission.priority as keyof typeof priorityTextColors]} bg-white`}>\n              {mission.priority === 'high' ? 'Vysoká' : mission.priority === 'medium' ? 'Stredná' : 'Nízka'}\n            </span>\n          </div>\n        </CardHeader>\n        <CardContent>\n          <p className=\"text-caption text-gray-600 mb-md leading-relaxed\">\n            {mission.description}\n          </p>\n          <div className=\"flex items-center justify-between text-small text-gray-500\">\n            <span>⏱️ {mission.estimatedTime}</span>\n            <span className=\"font-medium\">Čaká</span>\n          </div>\n        </CardContent>\n      </Card>\n    </motion.div>\n  );\n}