"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  useMagicOnboardingStore,
  FAMILY_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  FamilyStatus,
  Priority
} from '@/lib/stores/magic-onboarding-store';
import { SofiaIntroduction } from './SofiaIntroduction';
import { ProfessionalValueCalculator } from './ProfessionalValueCalculator';
import { DashboardGeneration } from './DashboardGeneration';
import { AchievementUnlock } from './AchievementUnlock';

export function MagicOnboardingWizard() {
  const {
    currentStep,
    answers,
    isCompleted,
    isGenerating,
    answerQuestion,
    achievements
  } = useMagicOnboardingStore();

  const [showAchievement, setShowAchievement] = useState<string | null>(null);

  // Watch for new achievements
  useEffect(() => {
    const unlockedAchievements = achievements.filter(a => a.unlocked);
    const latestAchievement = unlockedAchievements[unlockedAchievements.length - 1];

    if (latestAchievement && latestAchievement.id !== showAchievement) {
      setShowAchievement(latestAchievement.id);
      setTimeout(() => setShowAchievement(null), 4000);
    }
  }, [achievements, showAchievement]);

  if (isCompleted) {
    return <DashboardGeneration />;
  }

  if (isGenerating) {
    return <DashboardGeneration />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
      {/* Professional Value Calculator */}
      <ProfessionalValueCalculator />

      {/* Achievement Notifications */}
      <AnimatePresence>
        {showAchievement && (
          <AchievementUnlock
            achievement={achievements.find(a => a.id === showAchievement)!}
            onClose={() => setShowAchievement(null)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-lg py-2xl">
        {/* Sofia Introduction */}
        <SofiaIntroduction />

        {/* Progress Indicator */}
        <div className="mb-2xl">
          <div className="flex items-center justify-center space-x-md">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${step <= currentStep ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}
                >
                  {step}
                </div>
                {step < 2 && (
                  <div
                    className={`w-16 h-1 mx-sm transition-all duration-300 ${step < currentStep ? 'bg-primary' : 'bg-gray-200'}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-md">
            <span className="text-caption text-gray-600">
              Krok {currentStep} z 2
            </span>
          </div>
        </div>

        {/* Question Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <QuestionCard
              key="question-1"
              title="Rodinná situácia"
              subtitle="Pre prípravu optimálnej stratégie ochrany"
              question="Aká je vaša aktuálna rodinná situácia?"
              options={FAMILY_STATUS_OPTIONS}
              onSelect={(option) => answerQuestion(1, option)}
              selectedValue={answers.familyStatus?.id}
            />
          )}

          {currentStep === 2 && (
            <QuestionCard
              key="question-2"
              title="Hlavné priority"
              subtitle="Čo je pre vás najdôležitejšie zabezpečiť?"
              question="Ktorá oblasť vyžaduje najväčšiu pozornosť?"
              options={PRIORITY_OPTIONS}
              onSelect={(option) => answerQuestion(2, option)}
              selectedValue={answers.priority?.id}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface QuestionCardProps {
  title: string;
  subtitle: string;
  question: string;
  options: (FamilyStatus | Priority)[];
  onSelect: (option: FamilyStatus | Priority) => void;
  selectedValue?: string;
}

function QuestionCard({ title, subtitle, question, options, onSelect, selectedValue }: QuestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-xl">
        <h2 className="text-executive font-bold mb-sm">{title}</h2>
        <p className="text-lg text-blue-100">{subtitle}</p>
      </div>

      {/* Content */}
      <div className="p-xl">
        <h3 className="text-heading text-gray-800 mb-2xl text-center">
          {question}
        </h3>

        <div className="grid md:grid-cols-2 gap-lg">
          {options.map((option, index) => (
            <OptionCard
              key={option.id}
              option={option}
              isSelected={selectedValue === option.id}
              onSelect={() => onSelect(option)}
              index={index}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

interface OptionCardProps {
  option: FamilyStatus | Priority;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

function OptionCard({ option, isSelected, onSelect, index }: OptionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <Card
        className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${isSelected ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-gray-200 hover:border-primary/50'}`}
        onClick={onSelect}
      >
        <CardContent className="p-lg">
          <div className="text-center">
            {/* Icon */}
            <div className="text-4xl mb-md">
              {option.icon}
            </div>

            {/* Title */}
            <h4 className="text-body font-semibold text-gray-800 mb-sm">
              {option.title}
            </h4>

            {/* Description */}
            <p className="text-caption text-gray-600 mb-md leading-relaxed">
              {option.description}
            </p>

            {/* Impact/Value Indicator */}
            {'protectionMultiplier' in option && (
              <div className="bg-green-50 text-green-700 px-sm py-xs rounded-lg text-small font-medium">
                +{Math.round((option.protectionMultiplier - 1) * 100)}% protection value
              </div>
            )}

            {'scenario' in option && (
              <div className="bg-blue-50 text-blue-700 px-sm py-xs rounded-lg text-small font-medium">
                {option.missions.length} prioritných úloh
              </div>
            )}

            {/* Selection Indicator */}
            <motion.div
              className="mt-md"
              animate={isSelected ? { scale: 1 } : { scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mx-auto">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}