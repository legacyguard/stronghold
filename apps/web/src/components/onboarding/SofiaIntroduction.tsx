"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSofiaState } from '@/lib/stores/magic-onboarding-store';

export function SofiaIntroduction() {
  const { message, isVisible } = useSofiaState();
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Typewriter effect for Sofia's messages
  useEffect(() => {
    if (!message) return;

    setIsTyping(true);
    setDisplayedMessage('');

    let i = 0;
    const typeInterval = setInterval(() => {
      if (i < message.length) {
        setDisplayedMessage(message.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
      }
    }, 30); // Typing speed

    return () => clearInterval(typeInterval);
  }, [message]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-2xl"
    >
      {/* Sofia Avatar and Message */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-xl">
        <div className="flex items-start space-x-lg">
          {/* Sofia Avatar */}
          <div className="flex-shrink-0">
            <SofiaAvatar />
          </div>

          {/* Message Bubble */}
          <div className="flex-1">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-lg border border-blue-100">
              <div className="flex items-start justify-between mb-sm">
                <div>
                  <h3 className="text-body font-semibold text-primary mb-xs">
                    Sofia
                  </h3>
                  <span className="text-small text-blue-600 font-medium">
                    Digitálna poradkyňa pre ochranu dedičstva
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date().toLocaleTimeString('sk-SK', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              <div className="text-body text-gray-800 leading-relaxed">
                {displayedMessage}
                {isTyping && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="ml-1 text-primary"
                  >
                    |
                  </motion.span>
                )}
              </div>
            </div>

            {/* Professional Credentials */}
            <div className="mt-md flex items-center space-x-lg text-small text-gray-600">
              <div className="flex items-center space-x-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Online</span>
              </div>
              <div className="flex items-center space-x-xs">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Certifikovaná pre SK právo</span>
              </div>
              <div className="flex items-center space-x-xs">
                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Odpoveď do 30s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SofiaAvatar() {
  return (
    <div className="relative">
      {/* Main Avatar */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-blue-300 to-indigo-500 rounded-full flex items-center justify-center">
          <div className="text-2xl font-bold text-white">S</div>
        </div>
      </motion.div>

      {/* Professional Badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.7 }}
        className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"
      >
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </motion.div>

      {/* Subtle Pulse Effect */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.1, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-blue-400 rounded-full -z-10"
      />
    </div>
  );
}