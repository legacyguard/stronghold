'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MobileTopBar, MobileBottomNavigation } from './MobileNavigation';
import { useRouter, usePathname } from 'next/navigation';

interface MobileWrapperProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
  showTopBar?: boolean;
  pageTitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
}

export function MobileWrapper({
  children,
  showBottomNav = true,
  showTopBar = true,
  pageTitle,
  showBackButton = false,
  onBack,
  className = ''
}: MobileWrapperProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`mobile-container ${className}`}>
      {/* Top Bar */}
      {showTopBar && (
        <MobileTopBar
          currentPath={pathname}
          onNavigate={handleNavigation}
          user={user ? {
            name: user.user_metadata?.full_name || user.email || 'User',
            avatar: user.user_metadata?.avatar_url,
            unreadNotifications: 0 // This would come from your notification system
          } : undefined}
          showBackButton={showBackButton}
          onBack={handleBack}
          pageTitle={pageTitle}
        />
      )}

      {/* Main Content */}
      <main className={`
        flex-1 overflow-y-auto
        ${showTopBar ? 'pt-14' : ''}
        ${showBottomNav ? 'pb-16' : ''}
        mobile-safe-area-left mobile-safe-area-right
      `}>
        <div className="min-h-full">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <MobileBottomNavigation
          currentPath={pathname}
          onNavigate={handleNavigation}
        />
      )}
    </div>
  );
}

// Hook for mobile-specific utilities
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateMobileState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setIsMobile(width < 768);
      setOrientation(width > height ? 'landscape' : 'portrait');
      setViewport({ width, height });
    };

    updateMobileState();
    window.addEventListener('resize', updateMobileState);
    window.addEventListener('orientationchange', updateMobileState);

    return () => {
      window.removeEventListener('resize', updateMobileState);
      window.removeEventListener('orientationchange', updateMobileState);
    };
  }, []);

  return {
    isMobile,
    orientation,
    viewport,
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait',
    isSmallScreen: viewport.width < 375,
    isMediumScreen: viewport.width >= 375 && viewport.width < 640,
    isLargeScreen: viewport.width >= 640
  };
}

// Component for mobile-specific conditional rendering
export function MobileOnly({ children }: { children: React.ReactNode }) {
  const { isMobile } = useMobile();
  return isMobile ? <>{children}</> : null;
}

export function DesktopOnly({ children }: { children: React.ReactNode }) {
  const { isMobile } = useMobile();
  return !isMobile ? <>{children}</> : null;
}

// Component for responsive grid that adapts to mobile
export function ResponsiveGrid({
  children,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  gap = 4,
  className = ''
}: {
  children: React.ReactNode;
  mobileColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;
  gap?: number;
  className?: string;
}) {
  return (
    <div className={`
      grid
      grid-cols-${mobileColumns}
      md:grid-cols-${tabletColumns}
      lg:grid-cols-${desktopColumns}
      gap-${gap}
      ${className}
    `}>
      {children}
    </div>
  );
}

// Component for mobile-optimized cards
export function MobileCard({
  children,
  className = '',
  padding = 'normal',
  onClick
}: {
  children: React.ReactNode;
  className?: string;
  padding?: 'compact' | 'normal' | 'large';
  onClick?: () => void;
}) {
  const { isMobile } = useMobile();

  const paddingClasses = {
    compact: isMobile ? 'p-3' : 'p-4',
    normal: isMobile ? 'p-4' : 'p-6',
    large: isMobile ? 'p-6' : 'p-8'
  };

  return (
    <div
      className={`
        ${isMobile ? 'mobile-card' : ''}
        ${paddingClasses[padding]}
        ${onClick ? 'cursor-pointer mobile-tap-highlight' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Component for mobile-optimized buttons
export function MobileButton({
  children,
  variant = 'default',
  size = 'default',
  fullWidth = false,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  fullWidth?: boolean;
  className?: string;
  [key: string]: any;
}) {
  const { isMobile } = useMobile();

  const mobileClasses = isMobile ? 'mobile-btn-compact mobile-touch-target' : '';
  const fullWidthClass = (fullWidth && isMobile) ? 'mobile-btn-full' : '';

  return (
    <button
      className={`
        ${mobileClasses}
        ${fullWidthClass}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}