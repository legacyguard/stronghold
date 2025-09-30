"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Home,
  Users,
  Settings,
  FileText,
  Lock,
  Menu,
  Bell,
  User,
  Search,
  ChevronDown,
  LogOut,
  UserCircle,
  X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNamespace } from "@/contexts/LocalizationContext";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

interface AppLayoutProps {
  children: ReactNode;
}

interface NavigationItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}

interface User {
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { t } = useNamespace('navigation');
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navigationItems: NavigationItem[] = [
    { icon: Home, label: t('menu.dashboard'), href: "/" },
    { icon: Shield, label: t('menu.family_shield'), href: "/family-shield" },
    { icon: FileText, label: t('menu.will_generator'), href: "/will-generator" },
    { icon: Users, label: t('menu.guardians'), href: "/guardians" },
    { icon: Lock, label: t('menu.vault'), href: "/vault" },
    { icon: Settings, label: t('menu.settings'), href: "/settings" },
  ];

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsUserMenuOpen(false);
  };

  const isActive = (href: string) => pathname === href;

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="flex h-screen bg-neutral-beige">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-text-dark/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-surface shadow-2xl border-r border-border/20
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Section */}
        <div className="flex items-center justify-between p-lg border-b border-border/10">
          <div className="flex items-center gap-sm">
            <div className="p-sm bg-gradient-to-br from-primary to-primary-light rounded-lg shadow-lg">
              <Shield className="h-6 w-6 text-surface" />
            </div>
            <div>
              <h1 className="text-h3 text-text-dark font-semibold">{t('brand.name')}</h1>
              <p className="text-caption text-text-light">{t('brand.tagline')}</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-xs rounded-lg hover:bg-neutral-beige transition-colors lg:hidden"
          >
            <X className="h-5 w-5 text-text-light" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-light" />
            <input
              type="text"
              placeholder={t('header.search_placeholder')}
              className="w-full pl-10 pr-4 py-sm rounded-lg bg-neutral-beige/50 border border-border/20 text-body placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-text-light bg-neutral-beige/80 px-1.5 py-0.5 rounded border border-border/20">
              ⌘K
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-lg pb-lg flex-1 overflow-y-auto">
          <div className="space-y-xs">
            <div className="mb-md">
              <h3 className="text-caption text-text-light font-medium uppercase tracking-wider mb-xs">
                Main Menu
              </h3>
              {navigationItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-sm p-sm rounded-lg text-body font-medium transition-all duration-200 group
                    ${isActive(item.href)
                      ? 'bg-primary text-surface shadow-lg'
                      : 'text-text-light hover:bg-primary-light/10 hover:text-primary'
                    }
                  `}
                >
                  <item.icon className={`
                    h-5 w-5 transition-all duration-200
                    ${isActive(item.href)
                      ? 'text-surface'
                      : 'text-text-light group-hover:text-primary group-hover:scale-110'
                    }
                  `} />
                  <span>{item.label}</span>
                  {isActive(item.href) && (
                    <div className="ml-auto w-2 h-2 bg-surface rounded-full shadow-lg" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-border/10 p-lg">
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full flex items-center gap-sm p-sm rounded-lg bg-neutral-beige/50 hover:bg-neutral-beige transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center shadow-lg">
                <User className="h-5 w-5 text-surface" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-body font-medium text-text-dark truncate">
                  {loading ? 'Loading...' : displayName}
                </p>
                <p className="text-caption text-text-light">Premium Member</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-text-light transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* User Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-border/20 rounded-lg shadow-xl overflow-hidden">
                <div className="p-sm border-b border-border/10">
                  <p className="text-body font-medium text-text-dark truncate">
                    {loading ? 'Loading...' : displayName}
                  </p>
                  <p className="text-caption text-text-light truncate">
                    {user?.email}
                  </p>
                </div>
                <div className="py-xs">
                  <Link
                    href="/profile"
                    className="flex items-center gap-sm px-sm py-xs text-body text-text-light hover:bg-neutral-beige/50 hover:text-text-dark transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <UserCircle className="h-4 w-4" />
                    Edit Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-sm px-sm py-xs text-body text-text-light hover:bg-neutral-beige/50 hover:text-text-dark transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-surface shadow-sm border-b border-border/20 px-lg py-md sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-md">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-sm rounded-lg hover:bg-neutral-beige transition-colors duration-200 lg:hidden"
              >
                <Menu className="h-5 w-5 text-text-dark" />
              </button>
              <div>
                <h2 className="text-h3 text-text-dark font-semibold">
                  {navigationItems.find(item => isActive(item.href))?.label || 'Dashboard'}
                </h2>
                <p className="text-caption text-text-light">
                  {t('pages.dashboard.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-sm">
              {/* Language Switcher */}
              <LanguageSwitcher variant="compact" />

              {/* Notifications */}
              <button className="relative p-sm rounded-lg hover:bg-neutral-beige transition-colors duration-200">
                <Bell className="h-5 w-5 text-text-light" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full shadow-lg animate-pulse"></span>
              </button>

              {/* Quick User Info */}
              <div className="hidden sm:flex items-center gap-sm px-sm py-xs rounded-lg bg-neutral-beige/50">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center shadow-md">
                  <User className="h-4 w-4 text-surface" />
                </div>
                <span className="text-body font-medium text-text-dark">
                  {loading ? '...' : displayName}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-lg bg-background overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;