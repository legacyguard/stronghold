'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { EmergencyDashboardData } from '@/lib/emergency/types';
import { getEmergencySettings, toggleEmergencySystem } from '@/actions/emergency/settings';

interface EmergencyDashboardProps {
  className?: string;
}

export function EmergencyDashboard({ className = '' }: EmergencyDashboardProps) {
  const [dashboardData, setDashboardData] = useState<EmergencyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const result = await getEmergencySettings();

      if (result.success && result.settings) {
        setDashboardData({
          settings: result.settings,
          contacts: [],
          triggers: [],
          recentActivations: [],
          systemStatus: {
            is_active: result.settings.is_system_active,
            last_health_check: new Date().toISOString(),
            next_scheduled_check: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            pending_activations: 0,
            total_contacts: 0,
            active_triggers: 0
          }
        });
      } else {
        setError(result.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError('Unexpected error loading dashboard');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSystem = async () => {
    if (!dashboardData) return;

    try {
      setToggling(true);
      const newState = !dashboardData.settings.is_system_active;
      const result = await toggleEmergencySystem(newState);

      if (result.success) {
        setDashboardData(prev => prev ? {
          ...prev,
          settings: {
            ...prev.settings,
            is_system_active: newState
          },
          systemStatus: {
            ...prev.systemStatus,
            is_active: newState
          }
        } : null);
      } else {
        setError(result.error || 'Failed to toggle system');
      }
    } catch (err) {
      setError('Unexpected error toggling system');
      console.error('Toggle error:', err);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className={`emergency-dashboard ${className}`}>
        <div className="flex items-center justify-center py-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className={`emergency-dashboard ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-lg">
          <h3 className="text-red-800 font-semibold mb-sm">Error Loading Dashboard</h3>
          <p className="text-red-600">{error || 'Unknown error occurred'}</p>
          <Button
            onClick={loadDashboardData}
            variant="outline"
            className="mt-md border-red-300 text-red-700 hover:bg-red-50"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { settings, systemStatus } = dashboardData;

  return (
    <div className={`emergency-dashboard ${className}`}>
      {/* System Status Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-xl mb-xl">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Emergency Activation System</h2>
            <p className="text-gray-600 mt-xs">
              Dead man&apos;s switch and emergency notification system
            </p>
          </div>

          <div className="flex items-center space-x-lg">
            <div className={`flex items-center space-x-sm px-md py-sm rounded-full ${
              systemStatus.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                systemStatus.is_active ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm font-medium">
                {systemStatus.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <Button
              onClick={handleToggleSystem}
              disabled={toggling}
              className={`${
                systemStatus.is_active
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {toggling ? 'Updating...' : (systemStatus.is_active ? 'Deactivate' : 'Activate')}
            </Button>
          </div>
        </div>

        {/* System Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
          <div className="bg-gray-50 rounded-lg p-lg">
            <div className="text-2xl font-bold text-gray-900">{systemStatus.total_contacts}</div>
            <div className="text-sm text-gray-600">Emergency Contacts</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-lg">
            <div className="text-2xl font-bold text-gray-900">{systemStatus.active_triggers}</div>
            <div className="text-sm text-gray-600">Active Triggers</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-lg">
            <div className="text-2xl font-bold text-gray-900">{systemStatus.pending_activations}</div>
            <div className="text-sm text-gray-600">Pending Activations</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-lg">
            <div className="text-2xl font-bold text-gray-900">{settings.max_escalation_levels}</div>
            <div className="text-sm text-gray-600">Escalation Levels</div>
          </div>
        </div>
      </div>

      {/* Quick Setup Cards */}
      {systemStatus.total_contacts === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-xl mb-xl">
          <div className="flex items-start space-x-lg">
            <div className="text-yellow-600 text-2xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-yellow-800 font-semibold mb-sm">
                Emergency System Setup Required
              </h3>
              <p className="text-yellow-700 mb-lg">
                Your emergency system is not fully configured. Complete these steps to ensure your Family Shield can protect your loved ones.
              </p>
              <div className="space-y-md">
                <div className="flex items-center space-x-sm">
                  <div className="w-5 h-5 rounded-full bg-yellow-200 flex items-center justify-center">
                    <span className="text-xs font-bold text-yellow-800">1</span>
                  </div>
                  <span className="text-yellow-800">Add emergency contacts</span>
                </div>
                <div className="flex items-center space-x-sm">
                  <div className="w-5 h-5 rounded-full bg-yellow-200 flex items-center justify-center">
                    <span className="text-xs font-bold text-yellow-800">2</span>
                  </div>
                  <span className="text-yellow-800">Configure activation triggers</span>
                </div>
                <div className="flex items-center space-x-sm">
                  <div className="w-5 h-5 rounded-full bg-yellow-200 flex items-center justify-center">
                    <span className="text-xs font-bold text-yellow-800">3</span>
                  </div>
                  <span className="text-yellow-800">Test the system</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
        {/* Emergency Contacts */}
        <div className="bg-white rounded-lg border border-gray-200 p-lg">
          <div className="flex items-center space-x-sm mb-md">
            <div className="text-2xl">👥</div>
            <h3 className="text-lg font-semibold text-gray-900">Emergency Contacts</h3>
          </div>
          <p className="text-gray-600 text-sm mb-lg">
            Manage the people who will be notified during an emergency
          </p>
          <Button className="w-full bg-primary hover:bg-primary-dark">
            Manage Contacts
          </Button>
        </div>

        {/* Activation Triggers */}
        <div className="bg-white rounded-lg border border-gray-200 p-lg">
          <div className="flex items-center space-x-sm mb-md">
            <div className="text-2xl">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900">Activation Triggers</h3>
          </div>
          <p className="text-gray-600 text-sm mb-lg">
            Configure when emergency notifications should be sent
          </p>
          <Button className="w-full bg-primary hover:bg-primary-dark">
            Configure Triggers
          </Button>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-lg">
          <div className="flex items-center space-x-sm mb-md">
            <div className="text-2xl">⚙️</div>
            <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
          </div>
          <p className="text-gray-600 text-sm mb-lg">
            Customize notification preferences and security settings
          </p>
          <Button className="w-full bg-primary hover:bg-primary-dark">
            Adjust Settings
          </Button>
        </div>

        {/* Test System */}
        <div className="bg-white rounded-lg border border-gray-200 p-lg">
          <div className="flex items-center space-x-sm mb-md">
            <div className="text-2xl">🧪</div>
            <h3 className="text-lg font-semibold text-gray-900">Test System</h3>
          </div>
          <p className="text-gray-600 text-sm mb-lg">
            Run a test activation to verify everything works correctly
          </p>
          <Button className="w-full" variant="outline">
            Run Test
          </Button>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-lg border border-gray-200 p-lg">
          <div className="flex items-center space-x-sm mb-md">
            <div className="text-2xl">📋</div>
            <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
          </div>
          <p className="text-gray-600 text-sm mb-lg">
            View recent system activity and activation history
          </p>
          <Button className="w-full" variant="outline">
            View History
          </Button>
        </div>

        {/* Emergency Override */}
        <div className="bg-white rounded-lg border border-gray-200 p-lg">
          <div className="flex items-center space-x-sm mb-md">
            <div className="text-2xl">🚨</div>
            <h3 className="text-lg font-semibold text-gray-900">Emergency Override</h3>
          </div>
          <p className="text-gray-600 text-sm mb-lg">
            Manually trigger emergency notification immediately
          </p>
          <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
            Manual Trigger
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      {dashboardData.recentActivations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-xl mt-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-lg">Recent Emergency Activity</h3>
          <div className="space-y-md">
            {dashboardData.recentActivations.map((activation) => (
              <div key={activation.id} className="flex items-center justify-between py-md border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="font-medium text-gray-900">
                    {activation.activation_type} activation
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(activation.triggered_at).toLocaleString()}
                  </div>
                </div>
                <div className={`px-sm py-xs rounded-full text-xs font-medium ${
                  activation.status === 'completed' ? 'bg-green-100 text-green-800' :
                  activation.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                  activation.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {activation.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}