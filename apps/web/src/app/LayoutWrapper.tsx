"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { LocalizationProvider } from "@/contexts/LocalizationContext";

interface LayoutWrapperProps {
  children: ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  // Auth pages that should use basic layout
  const authPages = ['/login', '/signup', '/reset-password'];
  const isAuthPage = authPages.includes(pathname);

  return (
    <LocalizationProvider>
      {isAuthPage ? (
        // Auth pages without AppLayout
        <>{children}</>
      ) : (
        // Main app with AppLayout
        <AppLayout>{children}</AppLayout>
      )}
    </LocalizationProvider>
  );
}