import { Metadata } from 'next';
import Link from 'next/link';
import { Activity, BarChart3, Settings, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Stronghold',
  description: 'Administrative dashboard for Stronghold application',
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigation = [
    {
      name: 'Feature Audit',
      href: '/admin/audit',
      icon: AlertTriangle,
      description: 'Reality check of implemented features'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      description: 'Real user metrics and insights'
    },
    {
      name: 'Feature Flags',
      href: '/admin/feature-flags',
      icon: Settings,
      description: 'Control feature rollouts'
    },
    {
      name: 'Activity Monitor',
      href: '/admin/activity',
      icon: Activity,
      description: 'System health and performance'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Stronghold Admin</h1>
              <div className="ml-4 px-3 py-1 bg-red-100 border border-red-300 rounded-full">
                <span className="text-xs font-medium text-red-800">DEVELOPMENT</span>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to App
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group flex items-start p-3 rounded-lg border bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 mt-0.5" />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Admin Notes */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="ml-2">
                  <h4 className="text-sm font-medium text-yellow-800">Admin Only</h4>
                  <p className="text-xs text-yellow-700 mt-1">
                    This section provides real insights into feature status and user behavior.
                    Use this data to make informed decisions about development priorities.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}