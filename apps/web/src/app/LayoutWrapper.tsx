"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { LocalizationProvider } from "@/contexts/LocalizationContext";
import { I18nProvider } from "@/lib/i18n/provider";

interface LayoutWrapperProps {
  children: ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  // Pages that should use basic layout without AppLayout
  const basicLayoutPages = ['/', '/login', '/signup', '/reset-password'];
  const isBasicLayoutPage = basicLayoutPages.includes(pathname);

  return (
    <I18nProvider>
      <LocalizationProvider>
        {isBasicLayoutPage ? (
          // Basic layout pages without AppLayout
          <>{children}</>
        ) : (
          // Main app with AppLayout
          <AppLayout>{children}</AppLayout>
        )}
      </LocalizationProvider>
    </I18nProvider>
  );
}