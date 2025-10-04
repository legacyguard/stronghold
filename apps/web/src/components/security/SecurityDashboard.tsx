'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, ScatterChart, Scatter
} from 'recharts';
import {
  Shield, AlertTriangle, CheckCircle, XCircle, Eye, Lock,
  Activity, Users, Globe, Clock, TrendingUp, TrendingDown,
  Database, Key, FileText, Bell, Settings
} from 'lucide-react';

interface SecurityMetrics {
  threats_detected: number;
  threats_blocked: number;
  active_alerts: number;
  compliance_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  last_incident?: Date;
  mfa_adoption: number;
  audit_events_today: number;
}

interface ThreatAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  detected_at: Date;
  status: 'open' | 'investigating' | 'resolved';
  affected_users: number;
  source_ip?: string;
}

interface ComplianceStatus {
  framework: string;
  score: number;
  status: 'compliant' | 'minor_issues' | 'major_issues' | 'non_compliant';
  last_assessment: Date;
  next_review: Date;
  findings: number;
}

interface AuditActivity {
  timestamp: Date;
  event_type: string;
  user_id?: string;
  severity: string;
  description: string;
  ip_address: string;
}

export default function SecurityDashboard() {
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [threatAlerts, setThreatAlerts] = useState<ThreatAlert[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus[]>([]);
  const [auditActivity, setAuditActivity] = useState<AuditActivity[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setIsLoading(true);
    try {
      // Simulate API calls - replace with actual data fetching
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSecurityMetrics({
        threats_detected: 127,
        threats_blocked: 98,
        active_alerts: 23,
        compliance_score: 87.3,
        risk_level: 'medium',
        last_incident: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        mfa_adoption: 78.5,
        audit_events_today: 2847
      });

      setThreatAlerts([
        {
          id: '1',
          type: 'Brute Force Attack',
          severity: 'high',
          title: 'Multiple Failed Login Attempts',
          description: 'Detected 47 failed login attempts from IP 192.168.1.100',
          detected_at: new Date(Date.now() - 30 * 60 * 1000),
          status: 'investigating',
          affected_users: 1,
          source_ip: '192.168.1.100'
        },
        {
          id: '2',
          type: 'Anomalous Behavior',
          severity: 'medium',
          title: 'Unusual Data Access Pattern',
          description: 'User accessing large volumes of data outside normal hours',
          detected_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'open',
          affected_users: 1
        },
        {
          id: '3',
          type: 'Geographic Anomaly',
          severity: 'medium',
          title: 'Login from Unusual Location',
          description: 'User login detected from previously unseen geographic location',
          detected_at: new Date(Date.now() - 4 * 60 * 60 * 1000),
          status: 'resolved',
          affected_users: 1
        }
      ]);

      setComplianceStatus([
        {
          framework: 'GDPR',
          score: 92.1,
          status: 'compliant',
          last_assessment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          next_review: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          findings: 2
        },
        {
          framework: 'SOX',
          score: 84.7,
          status: 'minor_issues',
          last_assessment: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          next_review: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          findings: 5
        },
        {
          framework: 'ISO 27001',
          score: 88.3,
          status: 'compliant',
          last_assessment: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
          next_review: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          findings: 1
        }
      ]);

      setAuditActivity([
        {
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          event_type: 'authentication',
          user_id: 'user_123',
          severity: 'info',
          description: 'User successfully authenticated with MFA',
          ip_address: '10.0.1.45'
        },
        {
          timestamp: new Date(Date.now() - 12 * 60 * 1000),
          event_type: 'data_access',
          user_id: 'user_456',
          severity: 'warning',
          description: 'Access to sensitive customer data',
          ip_address: '10.0.1.67'
        },
        {
          timestamp: new Date(Date.now() - 18 * 60 * 1000),
          event_type: 'security_event',
          severity: 'error',
          description: 'Failed login attempt - invalid credentials',
          ip_address: '192.168.1.100'
        },
        {
          timestamp: new Date(Date.now() - 25 * 60 * 1000),
          event_type: 'configuration_change',
          user_id: 'admin_789',
          severity: 'info',
          description: 'Security policy updated',
          ip_address: '10.0.1.23'
        }
      ]);

    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'minor_issues': return 'bg-yellow-100 text-yellow-800';
      case 'major_issues': return 'bg-orange-100 text-orange-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'medium': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'high': return <XCircle className="h-5 w-5 text-orange-600" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Shield className="h-5 w-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
          <p className="text-gray-600">Monitor security threats, compliance, and audit activities</p>
        </div>
        <Button onClick={loadSecurityData}>
          Refresh Data
        </Button>
      </div>

      {/* Key Security Metrics */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Threats Detected</p>
                <p className="text-2xl font-bold">{securityMetrics?.threats_detected}</p>
                <p className="text-xs text-green-600">
                  {securityMetrics?.threats_blocked} blocked
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold">{securityMetrics?.active_alerts}</p>
                <p className="text-xs text-gray-500">Requires attention</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Compliance Score</p>
                <p className="text-2xl font-bold">{securityMetrics?.compliance_score}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${securityMetrics?.compliance_score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              {getRiskIcon(securityMetrics?.risk_level || 'low')}
              <div>
                <p className="text-sm text-gray-600">Risk Level</p>
                <p className="text-2xl font-bold capitalize">{securityMetrics?.risk_level}</p>
                <p className="text-xs text-gray-500">
                  MFA: {securityMetrics?.mfa_adoption}% adopted
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="threats">Threats</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Threat Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Threat Trends (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { date: '2024-01-01', threats: 45, blocked: 38 },
                    { date: '2024-01-02', threats: 52, blocked: 44 },
                    { date: '2024-01-03', threats: 38, blocked: 35 },
                    { date: '2024-01-04', threats: 67, blocked: 58 },
                    { date: '2024-01-05', threats: 43, blocked: 39 },
                    { date: '2024-01-06', threats: 55, blocked: 49 },
                    { date: '2024-01-07', threats: 61, blocked: 52 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="threats" stroke="#EF4444" strokeWidth={2} name="Detected" />
                    <Line type="monotone" dataKey="blocked" stroke="#10B981" strokeWidth={2} name="Blocked" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Security Events Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Security Events by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Authentication', value: 45, fill: '#3B82F6' },
                        { name: 'Data Access', value: 23, fill: '#10B981' },
                        { name: 'Failed Logins', value: 18, fill: '#EF4444' },
                        { name: 'Policy Violations', value: 14, fill: '#F59E0B' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Critical Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Critical Alerts</CardTitle>
              <CardDescription>Security alerts requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {threatAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getSeverityColor(alert.severity) }}
                      ></div>
                      <div>
                        <h4 className="font-semibold">{alert.title}</h4>
                        <p className="text-sm text-gray-600">{alert.description}</p>
                        <p className="text-xs text-gray-500">
                          {alert.detected_at.toLocaleString()} • {alert.affected_users} user(s) affected
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusBadgeColor(alert.status)}>
                        {alert.status.replace('_', ' ')}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Investigate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Threat Detection Timeline</CardTitle>
                <CardDescription>Real-time threat detection and response</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {threatAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div
                        className="w-2 h-2 rounded-full mt-2"
                        style={{ backgroundColor: getSeverityColor(alert.severity) }}
                      ></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{alert.title}</h4>
                          <Badge className={getStatusBadgeColor(alert.status)}>
                            {alert.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Type: {alert.type}</span>
                          <span>Severity: {alert.severity}</span>
                          <span>Time: {alert.detected_at.toLocaleString()}</span>
                          {alert.source_ip && <span>IP: {alert.source_ip}</span>}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Threat Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['critical', 'high', 'medium', 'low'].map((severity) => {
                    const count = threatAlerts.filter(a => a.severity === severity).length;
                    const percentage = threatAlerts.length > 0 ? (count / threatAlerts.length) * 100 : 0;

                    return (
                      <div key={severity} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getSeverityColor(severity) }}
                          ></div>
                          <span className="capitalize">{severity}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{count}</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: getSeverityColor(severity)
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {complianceStatus.map((framework) => (
              <Card key={framework.framework}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {framework.framework}
                    <Badge className={getStatusBadgeColor(framework.status)}>
                      {framework.status.replace('_', ' ')}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Compliance Score</span>
                        <span className="font-semibold">{framework.score}%</span>
                      </div>
                      <Progress value={framework.score} className="h-2" />
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Assessment:</span>
                        <span>{framework.last_assessment.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Next Review:</span>
                        <span>{framework.next_review.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Open Findings:</span>
                        <span className={framework.findings > 0 ? 'text-orange-600' : 'text-green-600'}>
                          {framework.findings}
                        </span>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Trends</CardTitle>
              <CardDescription>Compliance scores over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { month: 'Jan', GDPR: 89, SOX: 82, ISO27001: 85 },
                  { month: 'Feb', GDPR: 91, SOX: 84, ISO27001: 87 },
                  { month: 'Mar', GDPR: 92, SOX: 85, ISO27001: 88 },
                  { month: 'Apr', GDPR: 92, SOX: 85, ISO27001: 88 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="GDPR" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="SOX" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="ISO27001" stroke="#F59E0B" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Activity</CardTitle>
              <CardDescription>Real-time audit trail of security events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {activity.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant={activity.severity === 'error' ? 'destructive' : 'default'}>
                          {activity.event_type}
                        </Badge>
                        {activity.user_id && (
                          <span className="text-sm text-gray-600">User: {activity.user_id}</span>
                        )}
                      </div>
                      <p className="text-sm mt-1">{activity.description}</p>
                      <p className="text-xs text-gray-500">IP: {activity.ip_address}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Audit Events by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { type: 'Authentication', count: 1247 },
                    { type: 'Data Access', count: 892 },
                    { type: 'Config Change', count: 156 },
                    { type: 'Security Event', count: 78 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Activity Heatmap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { user: 'user_123', activity: 85, risk: 'low' },
                    { user: 'user_456', activity: 132, risk: 'medium' },
                    { user: 'admin_789', activity: 67, risk: 'low' },
                    { user: 'user_101', activity: 203, risk: 'high' }
                  ].map((user) => (
                    <div key={user.user} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-mono text-sm">{user.user}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{user.activity} events</span>
                        <Badge className={getStatusBadgeColor(user.risk === 'low' ? 'compliant' : user.risk === 'medium' ? 'minor_issues' : 'major_issues')}>
                          {user.risk} risk
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Incidents</CardTitle>
              <CardDescription>Track and manage security incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-semibold">3</p>
                        <p className="text-sm text-gray-600">Open Incidents</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-semibold">2.5h</p>
                        <p className="text-sm text-gray-600">Avg Response Time</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-semibold">15</p>
                        <p className="text-sm text-gray-600">Resolved This Month</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      id: 'INC-001',
                      title: 'Data Breach Attempt',
                      severity: 'critical',
                      status: 'investigating',
                      created: '2 hours ago',
                      assignee: 'Security Team'
                    },
                    {
                      id: 'INC-002',
                      title: 'Malware Detection',
                      severity: 'high',
                      status: 'contained',
                      created: '5 hours ago',
                      assignee: 'IT Security'
                    },
                    {
                      id: 'INC-003',
                      title: 'Phishing Email Campaign',
                      severity: 'medium',
                      status: 'resolved',
                      created: '1 day ago',
                      assignee: 'Security Analyst'
                    }
                  ].map((incident) => (
                    <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getSeverityColor(incident.severity) }}
                        ></div>
                        <div>
                          <h4 className="font-semibold">{incident.id}: {incident.title}</h4>
                          <p className="text-sm text-gray-600">
                            Created {incident.created} • Assigned to {incident.assignee}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusBadgeColor(incident.status)}>
                          {incident.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}