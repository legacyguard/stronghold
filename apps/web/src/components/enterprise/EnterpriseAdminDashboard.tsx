'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  Shield,
  Settings,
  BarChart3,
  Zap,
  Globe,
  Key,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  Database,
  Webhook,
  Link,
  Monitor,
  Clock,
  TrendingUp,
  FileText,
  Download
} from 'lucide-react';

interface AdminMetrics {
  users: {
    total: number;
    active: number;
    new_this_month: number;
    mfa_enabled: number;
  };
  security: {
    mfa_adoption_rate: number;
    failed_login_attempts: number;
    active_sessions: number;
    risk_score: number;
  };
  integrations: {
    total_connectors: number;
    active_connectors: number;
    sync_operations: number;
    success_rate: number;
  };
  api: {
    total_requests: number;
    success_rate: number;
    avg_response_time: number;
    rate_limit_hits: number;
  };
  webhooks: {
    total_endpoints: number;
    active_endpoints: number;
    deliveries_today: number;
    success_rate: number;
  };
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  components: {
    name: string;
    status: 'operational' | 'degraded' | 'down';
    response_time?: number;
    uptime?: number;
  }[];
  last_updated: string;
}

export default function EnterpriseAdminDashboard() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // In production, these would be real API calls
      const mockMetrics: AdminMetrics = {
        users: {
          total: 1247,
          active: 892,
          new_this_month: 156,
          mfa_enabled: 734
        },
        security: {
          mfa_adoption_rate: 82.3,
          failed_login_attempts: 23,
          active_sessions: 456,
          risk_score: 3.2
        },
        integrations: {
          total_connectors: 12,
          active_connectors: 9,
          sync_operations: 45,
          success_rate: 94.7
        },
        api: {
          total_requests: 15674,
          success_rate: 99.2,
          avg_response_time: 145,
          rate_limit_hits: 8
        },
        webhooks: {
          total_endpoints: 6,
          active_endpoints: 5,
          deliveries_today: 234,
          success_rate: 97.8
        }
      };

      const mockHealth: SystemHealth = {
        status: 'healthy',
        components: [
          { name: 'API Gateway', status: 'operational', response_time: 120, uptime: 99.9 },
          { name: 'Database', status: 'operational', response_time: 45, uptime: 100 },
          { name: 'Authentication', status: 'operational', response_time: 89, uptime: 99.8 },
          { name: 'Webhooks', status: 'degraded', response_time: 340, uptime: 98.5 },
          { name: 'Integrations', status: 'operational', response_time: 210, uptime: 99.2 }
        ],
        last_updated: new Date().toISOString()
      };

      setMetrics(mockMetrics);
      setSystemHealth(mockHealth);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'degraded':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'down':
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enterprise Admin Dashboard</h1>
          <p className="text-gray-600">Monitor and manage your LegacyGuard enterprise deployment</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* System Health Alert */}
      {systemHealth && systemHealth.status !== 'healthy' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            System health status: {systemHealth.status}. Check the System Health tab for details.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users & Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="api">API Management</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.users.total.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +{metrics?.users.new_this_month} new this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MFA Adoption</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.security.mfa_adoption_rate}%</div>
                <Progress value={metrics?.security.mfa_adoption_rate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Integration Success</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.integrations.success_rate}%</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.integrations.sync_operations} operations today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Requests</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.api.total_requests.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.api.avg_response_time}ms avg response
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Activity</CardTitle>
                <CardDescription>Recent system events and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Salesforce sync completed</p>
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">High API usage detected</p>
                      <p className="text-xs text-gray-500">15 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Webhook delivery successful</p>
                      <p className="text-xs text-gray-500">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>API Success Rate</span>
                      <span>{metrics?.api.success_rate}%</span>
                    </div>
                    <Progress value={metrics?.api.success_rate} className="mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Webhook Delivery Rate</span>
                      <span>{metrics?.webhooks.success_rate}%</span>
                    </div>
                    <Progress value={metrics?.webhooks.success_rate} className="mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Integration Success Rate</span>
                      <span>{metrics?.integrations.success_rate}%</span>
                    </div>
                    <Progress value={metrics?.integrations.success_rate} className="mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Users</span>
                    <span className="font-semibold">{metrics?.users.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Users</span>
                    <span className="font-semibold">{metrics?.users.active}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New This Month</span>
                    <span className="font-semibold">{metrics?.users.new_this_month}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>MFA Enabled</span>
                    <span className="font-semibold">{metrics?.users.mfa_enabled}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed Logins (24h)</span>
                    <span className="font-semibold">{metrics?.security.failed_login_attempts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Sessions</span>
                    <span className="font-semibold">{metrics?.security.active_sessions}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{metrics?.security.risk_score}/10</div>
                  <p className="text-sm text-gray-600 mt-2">Security Risk Score</p>
                  <Badge className="mt-2 bg-green-100 text-green-800">Low Risk</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Management Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Button variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Policies
                </Button>
                <Button variant="outline">
                  <Key className="h-4 w-4 mr-2" />
                  MFA Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Integration Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Connectors</span>
                    <span className="font-semibold">{metrics?.integrations.total_connectors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active</span>
                    <span className="font-semibold">{metrics?.integrations.active_connectors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate</span>
                    <span className="font-semibold">{metrics?.integrations.success_rate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sync Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold">{metrics?.integrations.sync_operations}</div>
                  <p className="text-sm text-gray-600">Operations Today</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full" variant="outline">
                    <Link className="h-4 w-4 mr-2" />
                    Add Connector
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Sync Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Active Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['Salesforce', 'HubSpot', 'Mailchimp', 'Slack'].map((integration, index) => (
                  <div key={integration} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Globe className="h-6 w-6 text-blue-500" />
                      <div>
                        <p className="font-medium">{integration}</p>
                        <p className="text-sm text-gray-500">Last sync: 2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor('operational')}>Active</Badge>
                      <Button size="sm" variant="outline">Configure</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>API Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.api.total_requests.toLocaleString()}</div>
                <p className="text-sm text-gray-600">Today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.api.success_rate}%</div>
                <Progress value={metrics?.api.success_rate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.api.avg_response_time}ms</div>
                <p className="text-sm text-green-600">Good performance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rate Limits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.api.rate_limit_hits}</div>
                <p className="text-sm text-gray-600">Hits today</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>API Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button>
                  <Key className="h-4 w-4 mr-2" />
                  API Keys
                </Button>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Documentation
                </Button>
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.webhooks.total_endpoints}</div>
                <p className="text-sm text-gray-600">{metrics?.webhooks.active_endpoints} active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deliveries Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.webhooks.deliveries_today}</div>
                <p className="text-sm text-green-600">All successful</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.webhooks.success_rate}%</div>
                <Progress value={metrics?.webhooks.success_rate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Webhook className="h-4 w-4 mr-2" />
                  Add Webhook
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Health Overview</CardTitle>
              <CardDescription>
                Last updated: {systemHealth ? new Date(systemHealth.last_updated).toLocaleString() : 'Never'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3 mb-4">
                {getStatusIcon(systemHealth?.status || 'unknown')}
                <div>
                  <p className="font-medium">Overall Status: {systemHealth?.status}</p>
                  <p className="text-sm text-gray-600">All systems operational</p>
                </div>
              </div>

              <div className="space-y-3">
                {systemHealth?.components.map((component) => (
                  <div key={component.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(component.status)}
                      <div>
                        <p className="font-medium">{component.name}</p>
                        <p className="text-sm text-gray-500">
                          {component.response_time}ms • {component.uptime}% uptime
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(component.status)}>
                      {component.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}