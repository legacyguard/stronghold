'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { Trash2, Archive, Edit, Star, Share, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SwipeAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  backgroundColor: string;
  action: () => void;
}

interface SwipeableItemProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  onSwipe?: (direction: 'left' | 'right', actionId?: string) => void;
  disabled?: boolean;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  onSwipe,
  disabled = false
}) => {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [activeAction, setActiveAction] = useState<SwipeAction | null>(null);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePanStart = () => {
    if (disabled) return;
    setIsSwipeActive(true);
  };

  const handlePan = (event: any, info: PanInfo) => {
    if (disabled) return;

    const { offset } = info;
    const progress = Math.abs(offset.x);
    setSwipeProgress(progress);

    // Determine active action based on swipe direction and distance
    if (offset.x > 0 && leftActions.length > 0) {
      // Swiping right (showing left actions)
      const actionIndex = Math.min(
        Math.floor((progress / threshold) * leftActions.length),
        leftActions.length - 1
      );
      setActiveAction(leftActions[actionIndex] || null);
    } else if (offset.x < 0 && rightActions.length > 0) {
      // Swiping left (showing right actions)
      const actionIndex = Math.min(
        Math.floor((progress / threshold) * rightActions.length),
        rightActions.length - 1
      );
      setActiveAction(rightActions[actionIndex] || null);
    } else {
      setActiveAction(null);
    }
  };

  const handlePanEnd = (event: any, info: PanInfo) => {
    if (disabled) return;

    const { offset, velocity } = info;
    const shouldTriggerAction = Math.abs(offset.x) > threshold || Math.abs(velocity.x) > 500;

    if (shouldTriggerAction && activeAction) {
      // Execute the action
      activeAction.action();

      // Determine swipe direction
      const direction = offset.x > 0 ? 'right' : 'left';
      onSwipe?.(direction, activeAction.id);

      // Animate to action position then back
      controls.start({
        x: offset.x > 0 ? threshold * 1.2 : -threshold * 1.2,
        transition: { duration: 0.2 }
      }).then(() => {
        controls.start({
          x: 0,
          transition: { duration: 0.3 }
        });
      });
    } else {
      // Snap back to center
      controls.start({
        x: 0,
        transition: { type: 'spring', stiffness: 300, damping: 30 }
      });
    }

    setIsSwipeActive(false);
    setActiveAction(null);
    setSwipeProgress(0);
  };

  return (
    <div className="relative overflow-hidden" ref={containerRef}>
      {/* Left actions background */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center">
          {leftActions.map((action, index) => (
            <motion.div
              key={action.id}
              className="h-full flex items-center justify-center px-4"
              style={{
                backgroundColor: action.backgroundColor,
                width: `${threshold}px`
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: swipeProgress > index * (threshold / leftActions.length) ? 1 : 0,
                scale: activeAction?.id === action.id ? 1.1 : 1
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col items-center gap-1">
                <div style={{ color: action.color }}>
                  {action.icon}
                </div>
                <span className="text-xs font-medium" style={{ color: action.color }}>
                  {action.label}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Right actions background */}
      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center">
          {rightActions.map((action, index) => (
            <motion.div
              key={action.id}
              className="h-full flex items-center justify-center px-4"
              style={{
                backgroundColor: action.backgroundColor,
                width: `${threshold}px`
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: swipeProgress > index * (threshold / rightActions.length) ? 1 : 0,
                scale: activeAction?.id === action.id ? 1.1 : 1
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col items-center gap-1">
                <div style={{ color: action.color }}>
                  {action.icon}
                </div>
                <span className="text-xs font-medium" style={{ color: action.color }}>
                  {action.label}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Main content */}
      <motion.div
        drag={!disabled ? 'x' : false}
        dragConstraints={{ left: -threshold * 1.5, right: threshold * 1.5 }}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        animate={controls}
        className="relative z-10 bg-white"
        style={{
          cursor: disabled ? 'default' : 'grab'
        }}
        whileDrag={{ cursor: 'grabbing' }}
      >
        {children}
      </motion.div>
    </div>
  );
};

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  threshold = 80,
  disabled = false
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePanStart = (event: any, info: PanInfo) => {
    if (disabled || isRefreshing) return;

    // Only allow pull to refresh when at the top of the scroll container
    const scrollTop = containerRef.current?.scrollTop || 0;
    setCanRefresh(scrollTop === 0);
  };

  const handlePan = (event: any, info: PanInfo) => {
    if (disabled || isRefreshing || !canRefresh) return;

    const { offset } = info;
    if (offset.y > 0) {
      // Pulling down
      const distance = Math.min(offset.y, threshold * 1.5);
      setPullDistance(distance);
    }
  };

  const handlePanEnd = async (event: any, info: PanInfo) => {
    if (disabled || isRefreshing || !canRefresh) return;

    const { offset } = info;

    if (offset.y > threshold) {
      // Trigger refresh
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        controls.start({
          y: 0,
          transition: { type: 'spring', stiffness: 300, damping: 30 }
        });
      }
    } else {
      // Snap back
      setPullDistance(0);
      controls.start({
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 30 }
      });
    }

    setCanRefresh(false);
  };

  const refreshProgress = Math.min(pullDistance / threshold, 1);

  return (
    <div className="relative overflow-hidden" ref={containerRef}>
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-20"
        style={{
          height: `${Math.max(pullDistance, 0)}px`,
          backgroundColor: 'rgba(107, 142, 35, 0.1)'
        }}
        animate={{
          opacity: pullDistance > 0 ? 1 : 0
        }}
      >
        <div className="flex flex-col items-center gap-2 text-primary">
          <motion.div
            animate={{
              rotate: isRefreshing ? 360 : refreshProgress * 180,
              scale: Math.min(refreshProgress * 2, 1)
            }}
            transition={{
              rotate: isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 0.2 }
            }}
            className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
          />
          <span className="text-sm font-medium">
            {isRefreshing ? 'Refreshing...' : pullDistance > threshold ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        drag={!disabled && !isRefreshing ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.2, bottom: 0 }}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        animate={controls}
        className="relative"
        style={{
          y: pullDistance
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

interface LongPressProps {
  children: React.ReactNode;
  onLongPress: () => void;
  onPress?: () => void;
  delay?: number;
  disabled?: boolean;
}

export const LongPress: React.FC<LongPressProps> = ({
  children,
  onLongPress,
  onPress,
  delay = 500,
  disabled = false
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();
  const progressTimerRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(0);

  const startLongPress = useCallback(() => {
    if (disabled) return;

    setIsPressed(true);
    startTimeRef.current = Date.now();

    // Start progress animation
    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min(elapsed / delay, 1);
      setProgress(newProgress);

      if (newProgress < 1) {
        progressTimerRef.current = setTimeout(updateProgress, 16); // ~60fps
      }
    };
    updateProgress();

    // Set timer for long press
    timerRef.current = setTimeout(() => {
      onLongPress();
      setIsPressed(false);
      setProgress(0);
    }, delay);
  }, [onLongPress, delay, disabled]);

  const stopLongPress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (progressTimerRef.current) {
      clearTimeout(progressTimerRef.current);
    }

    if (isPressed && progress < 1) {
      // This was a regular press, not a long press
      onPress?.();
    }

    setIsPressed(false);
    setProgress(0);
  }, [isPressed, progress, onPress]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      onTouchStart={startLongPress}
      onTouchEnd={stopLongPress}
      onMouseDown={startLongPress}
      onMouseUp={stopLongPress}
      onMouseLeave={stopLongPress}
      className="relative select-none"
      whileTap={{ scale: 0.98 }}
    >
      {/* Progress indicator */}
      {isPressed && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 bg-primary/20 rounded-lg"
            style={{
              clipPath: `circle(${progress * 100}% at center)`
            }}
          />
          <div className="absolute inset-0 border-2 border-primary rounded-lg opacity-50" />
        </div>
      )}

      {children}
    </motion.div>
  );
};

interface PinchZoomProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  disabled?: boolean;
  onZoomChange?: (scale: number) => void;
}

export const PinchZoom: React.FC<PinchZoomProps> = ({
  children,
  minScale = 0.5,
  maxScale = 3,
  initialScale = 1,
  disabled = false,
  onZoomChange
}) => {
  const [scale, setScale] = useState(initialScale);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const controls = useAnimation();

  const handleWheel = (event: React.WheelEvent) => {
    if (disabled) return;

    event.preventDefault();
    const delta = event.deltaY * -0.01;
    const newScale = Math.min(Math.max(scale + delta, minScale), maxScale);

    setScale(newScale);
    onZoomChange?.(newScale);
  };

  const resetZoom = () => {
    setScale(initialScale);
    setPosition({ x: 0, y: 0 });
    onZoomChange?.(initialScale);

    controls.start({
      scale: initialScale,
      x: 0,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    });
  };

  const handleDoubleClick = () => {
    if (disabled) return;

    if (scale === initialScale) {
      // Zoom in
      setScale(maxScale * 0.7);
      onZoomChange?.(maxScale * 0.7);
    } else {
      // Reset to initial scale
      resetZoom();
    }
  };

  return (
    <div className="relative overflow-hidden">
      <motion.div
        animate={controls}
        drag={!disabled && scale > 1}
        dragConstraints={{
          left: -(scale - 1) * 150,
          right: (scale - 1) * 150,
          top: -(scale - 1) * 150,
          bottom: (scale - 1) * 150
        }}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        className="origin-center cursor-move"
        style={{
          scale,
          x: position.x,
          y: position.y
        }}
      >
        {children}
      </motion.div>

      {/* Zoom controls */}
      {scale !== initialScale && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-4 right-4 bg-black/50 rounded-full p-2 text-white text-sm font-medium"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={resetZoom}
            className="text-white hover:bg-white/20"
          >
            Reset
          </Button>
        </motion.div>
      )}
    </div>
  );
};

// Common swipe actions for different item types
export const DocumentSwipeActions = {
  left: [
    {
      id: 'star',
      label: 'Star',
      icon: <Star className="w-5 h-5" />,
      color: '#FFD700',
      backgroundColor: '#FFF8DC',
      action: () => console.log('Starred')
    },
    {
      id: 'share',
      label: 'Share',
      icon: <Share className="w-5 h-5" />,
      color: '#4A90E2',
      backgroundColor: '#E6F3FF',
      action: () => console.log('Shared')
    }
  ],
  right: [
    {
      id: 'edit',
      label: 'Edit',
      icon: <Edit className="w-5 h-5" />,
      color: '#4A90E2',
      backgroundColor: '#E6F3FF',
      action: () => console.log('Edited')
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: <Archive className="w-5 h-5" />,
      color: '#FFA500',
      backgroundColor: '#FFF4E6',
      action: () => console.log('Archived')
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="w-5 h-5" />,
      color: '#FF4444',
      backgroundColor: '#FFE6E6',
      action: () => console.log('Deleted')
    }
  ]
};

export default {
  SwipeableItem,
  PullToRefresh,
  LongPress,
  PinchZoom,
  DocumentSwipeActions
};