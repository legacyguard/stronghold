"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Achievement } from '@/lib/stores/magic-onboarding-store';

interface AchievementUnlockProps {
  achievement: Achievement;
  onClose: () => void;
}

export function AchievementUnlock({ achievement, onClose }: AchievementUnlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{
          type: "spring",
          damping: 15,
          stiffness: 300,
          duration: 0.6
        }}
        className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-2xl text-center shadow-2xl border border-blue-100 max-w-md mx-lg"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Achievement Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="text-6xl mb-lg"
        >
          {achievement.icon}
        </motion.div>

        {/* Achievement Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="text-2xl font-bold text-gray-800 mb-sm"
        >
          {achievement.title}
        </motion.h2>

        {/* Achievement Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="text-body text-gray-600 mb-lg leading-relaxed"
        >
          {achievement.description}
        </motion.p>

        {/* XP Reward */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl p-md mb-lg"
        >
          <div className="text-sm font-medium mb-xs">Odmeňa získaná</div>
          <div className="text-xl font-bold">
            +{achievement.xp} XP
          </div>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.3 }}
          className="text-small text-gray-500 font-medium"
        >
          Úspešne dokončené!
        </motion.div>

        {/* Confetti Effect */}
        <ConfettiEffect />
      </motion.div>
    </motion.div>
  );
}

function ConfettiEffect() {
  const confettiPieces = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {confettiPieces.map((piece) => {
        const colors = ['bg-primary', 'bg-yellow-400', 'bg-green-400'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        return (
          <motion.div
            key={piece}
            initial={{
              opacity: 1,
              scale: 0,
              x: "50%",
              y: "50%",
              rotate: 0
            }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0, 1, 1],
              x: `${50 + (Math.random() - 0.5) * 300}%`,
              y: `${50 + (Math.random() - 0.5) * 300}%`,
              rotate: Math.random() * 360
            }}
            transition={{
              duration: 2,
              delay: Math.random() * 0.5,
              ease: "easeOut"
            }}
            className={`absolute w-2 h-2 ${randomColor} rounded-sm`}
          />
        );
      })}
    </div>
  );
}