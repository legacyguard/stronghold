'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Menu, X, Bell, Search, User, Home, FileText, Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileNavigationProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  user?: {
    name: string;
    avatar?: string;
    unreadNotifications?: number;
  };
  showBackButton?: boolean;
  onBack?: () => void;
  pageTitle?: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  description?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Domov',
    icon: <Home className="w-5 h-5" />,
    path: '/dashboard',
    description: 'Prehľad a rýchle akcie'
  },
  {
    id: 'will',
    label: 'Testament',
    icon: <FileText className="w-5 h-5" />,
    path: '/will',
    description: 'Vytvorte a spravujte testamenty'
  },
  {
    id: 'documents',
    label: 'Dokumenty',
    icon: <Shield className="w-5 h-5" />,
    path: '/documents',
    description: 'Spravujte svoje právne dokumenty'
  },
  {
    id: 'emergency-contacts',
    label: 'Kontakty',
    icon: <Shield className="w-5 h-5" />,
    path: '/emergency-contacts',
    description: 'Núdzové kontakty'
  },
  {
    id: 'settings',
    label: 'Nastavenia',
    icon: <Settings className="w-5 h-5" />,
    path: '/settings',
    description: 'Nastavenia účtu a aplikácie'
  }
];

export const MobileTopBar: React.FC<MobileNavigationProps> = ({
  currentPath,
  onNavigate,
  user,
  showBackButton = false,
  onBack,
  pageTitle
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bg-background border-b border-surface z-50 h-14">
        <div className="flex items-center justify-between h-full px-4">
          {/* Left side */}
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="p-2 -ml-2"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            ) : (
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 -ml-2"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <MobileMenuContent
                  currentPath={currentPath}
                  onNavigate={(path) => {
                    onNavigate?.(path);
                    setIsMenuOpen(false);
                  }}
                  user={user}
                />
              </Sheet>
            )}

            {pageTitle && (
              <h1 className="text-lg font-semibold text-text-dark truncate">
                {pageTitle}
              </h1>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2"
            >
              <Search className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="p-2 relative"
            >
              <Bell className="w-5 h-5" />
              {user?.unreadNotifications && user.unreadNotifications > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
                >
                  {user.unreadNotifications > 99 ? '99+' : user.unreadNotifications}
                </Badge>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="p-2"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <User className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Search overlay */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 bg-background border-b border-surface p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Hľadať dokumenty, nastavenia..."
                    className="w-full pl-10 pr-4 py-2 bg-surface rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-14" />
    </>
  );
};

const MobileMenuContent: React.FC<{
  currentPath?: string;
  onNavigate?: (path: string) => void;
  user?: {
    name: string;
    avatar?: string;
  };
}> = ({ currentPath, onNavigate, user }) => {
  return (
    <SheetContent side="left" className="w-80 p-0">
      <div className="flex flex-col h-full">
        {/* User profile section */}
        {user && (
          <div className="p-6 border-b border-surface">
            <div className="flex items-center gap-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-text-dark">{user.name}</h3>
                <p className="text-sm text-gray-500">LegacyGuard člen</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation items */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = currentPath === item.path;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => onNavigate?.(item.path)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'bg-surface hover:bg-gray-100 text-text-dark'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`${isActive ? 'text-white' : 'text-gray-600'}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className={`text-sm mt-1 ${
                        isActive ? 'text-white/80' : 'text-gray-500'
                      }`}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-surface">
          <div className="text-center text-sm text-gray-500">
            <p>LegacyGuard v2.0</p>
            <p>Bezpečné • Súkromné • Dôveryhodné</p>
          </div>
        </div>
      </div>
    </SheetContent>
  );
};

export const MobileBottomNavigation: React.FC<{
  currentPath?: string;
  onNavigate?: (path: string) => void;
}> = ({ currentPath, onNavigate }) => {
  const mainItems = navigationItems.slice(0, 4); // Show only main 4 items

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-surface z-50">
      <div className="flex items-center justify-around py-2">
        {mainItems.map((item) => {
          const isActive = currentPath === item.path;

          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate?.(item.path)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-gray-500'
              }`}
              whileTap={{ scale: 0.9 }}
            >
              <div className={`${isActive ? 'text-primary' : 'text-gray-500'}`}>
                {item.icon}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
              {item.badge && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 text-xs p-0 flex items-center justify-center"
                >
                  {item.badge}
                </Badge>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </div>
  );
};

export default {
  MobileTopBar,
  MobileBottomNavigation
};