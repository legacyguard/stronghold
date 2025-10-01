"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useProtectionStats } from '@/lib/stores/magic-onboarding-store';

export function ProfessionalValueCalculator() {
  const stats = useProtectionStats();
  const [animatedStats, setAnimatedStats] = useState({
    protectionValue: 0,
    riskReduction: 0,
    timeToSecurity: 30,
    legalCompliance: 0
  });

  // Animate value changes
  useEffect(() => {
    const duration = 1500;
    const steps = 30;
    const stepDuration = duration / steps;

    let step = 0;
    const interval = setInterval(() => {
      if (step >= steps) {
        clearInterval(interval);
        setAnimatedStats(stats);
        return;
      }

      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats({
        protectionValue: Math.round(easeOut * stats.protectionValue),
        riskReduction: Math.round(easeOut * stats.riskReduction),
        timeToSecurity: Math.round(30 - easeOut * (30 - stats.timeToSecurity)),
        legalCompliance: Math.round(easeOut * stats.legalCompliance)
      });

      step++;
    }, stepDuration);

    return () => clearInterval(interval);
  }, [stats]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="fixed top-4 right-4 bg-white shadow-xl rounded-xl p-lg border border-gray-200 min-w-80 z-50"
    >
      <h3 className="text-heading text-primary mb-lg font-semibold">
        Analýza ochrany
      </h3>

      {/* Protection Value */}
      <div className="mb-lg">
        <div className="flex justify-between items-center mb-sm">
          <span className="text-body text-gray-700 font-medium">Hodnota ochrany</span>
          <span className="text-heading text-primary font-bold">
            €{animatedStats.protectionValue.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-primary to-primary-dark h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(animatedStats.protectionValue / 200000 * 100, 100)}%`
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Risk Reduction */}
      <div className="mb-lg">
        <div className="flex justify-between items-center mb-sm">
          <span className="text-body text-gray-700 font-medium">Zníženie rizika</span>
          <div className="flex items-center space-x-xs">
            <motion.span
              className="text-heading text-green-600 font-bold"
              key={animatedStats.riskReduction}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {animatedStats.riskReduction}%
            </motion.span>
            {animatedStats.riskReduction > 0 && (
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${animatedStats.riskReduction}%` }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          />
        </div>
      </div>

      {/* Legal Compliance */}
      <div className="mb-lg">
        <div className="flex justify-between items-center mb-sm">
          <span className="text-body text-gray-700 font-medium">Právna zhoda</span>
          <div className="flex items-center space-x-xs">
            <motion.span
              className="text-heading text-blue-600 font-bold"
              key={animatedStats.legalCompliance}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {animatedStats.legalCompliance}%
            </motion.span>
            {animatedStats.legalCompliance > 50 && (
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${animatedStats.legalCompliance}%` }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
          />
        </div>
      </div>

      {/* Implementation Time */}
      <div className="text-center pt-lg border-t border-gray-200">
        <span className="text-caption text-gray-600 font-medium">Čas do plnej ochrany</span>
        <div className="flex items-center justify-center space-x-xs mt-xs">
          <motion.div
            className="text-heading text-primary font-bold"
            key={animatedStats.timeToSecurity}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {animatedStats.timeToSecurity}
          </motion.div>
          <span className="text-body text-gray-600">dní</span>
          {animatedStats.timeToSecurity < 15 && (
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-lg flex items-center justify-center space-x-xs text-small"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-gray-600 font-medium">Analýza prebieha</span>
      </motion.div>
    </motion.div>
  );
}