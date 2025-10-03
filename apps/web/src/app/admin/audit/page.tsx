'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { FEATURE_AUDIT, FeatureAuditor, type FeatureStatus } from '@/lib/audit/feature-status';

function StatusIcon({ status }: { status: FeatureStatus['actualStatus'] }) {
  switch (status) {
    case 'working':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'incomplete':
      return <Clock className="w-4 h-4 text-yellow-600" />;
    case 'missing':
      return <XCircle className="w-4 h-4 text-red-600" />;
    case 'broken':
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-gray-600" />;
  }
}

function StatusBadge({ status }: { status: FeatureStatus['actualStatus'] }) {
  const getVariant = () => {
    switch (status) {
      case 'working': return 'default';
      case 'incomplete': return 'secondary';
      case 'missing': return 'destructive';
      case 'broken': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Badge variant={getVariant()}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function TechnicalDebtBadge({ level }: { level: FeatureStatus['technicalDebt'] }) {
  const getColor = () => {
    switch (level) {
      case 'none': return 'bg-green-100 text-green-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Badge className={getColor()}>
      {level} debt
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: FeatureStatus['priority'] }) {
  const getColor = () => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Badge className={getColor()}>
      {priority}
    </Badge>
  );
}

function FeatureCard({ feature }: { feature: FeatureStatus }) {
  const claimedVsActual = feature.claimedStatus !== 'complete' || feature.actualStatus !== 'working';

  return (
    <Card className={claimedVsActual ? 'border-red-200 bg-red-50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <StatusIcon status={feature.actualStatus} />
            <span className="ml-2">{feature.name}</span>
          </CardTitle>
          <StatusBadge status={feature.actualStatus} />
        </div>
        {claimedVsActual && (
          <div className="flex items-center text-sm text-red-600">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Claimed: {feature.claimedStatus} | Reality: {feature.actualStatus}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <PriorityBadge priority={feature.priority} />
            <TechnicalDebtBadge level={feature.technicalDebt} />
            <Badge variant="outline">{feature.estimatedFixTime}</Badge>
            {!feature.userTested && (
              <Badge className="bg-yellow-100 text-yellow-800">
                Not user tested
              </Badge>
            )}
          </div>

          {feature.dependencies.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700">Dependencies:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {feature.dependencies.map((dep, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {dep}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {feature.blockers.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-700">Blockers:</p>
              <ul className="list-disc list-inside text-sm text-red-600 mt-1">
                {feature.blockers.map((blocker, index) => (
                  <li key={index}>{blocker}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewStats() {
  const status = FeatureAuditor.getOverallStatus();
  const debt = FeatureAuditor.getTechnicalDebtSummary();
  const estimatedHours = FeatureAuditor.getEstimatedFixTime();
  const blocked = FeatureAuditor.getBlockedFeatures();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Overall Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold flex items-center">
            {Math.round((status.working / status.total) * 100)}%
            {status.working / status.total < 0.5 ? (
              <TrendingDown className="w-4 h-4 text-red-500 ml-1" />
            ) : (
              <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {status.working}/{status.total} features working
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Technical Debt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {debt.critical || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Critical issues
          </p>
          <div className="text-xs">
            High: {debt.high || 0} | Medium: {debt.medium || 0}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Fix Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(estimatedHours / 8)}
          </div>
          <p className="text-xs text-muted-foreground">
            Work days ({estimatedHours}h total)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Blocked Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {blocked.length}
          </div>
          <p className="text-xs text-muted-foreground">
            Cannot proceed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuditPage() {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refreshAudit = () => {
    setLastUpdated(new Date());
    // In a real implementation, this would re-run feature tests
    window.location.reload();
  };

  const exportReport = () => {
    const report = FeatureAuditor.generateAuditReport();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stronghold_feature_audit_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const workingFeatures = FEATURE_AUDIT.filter(f => f.actualStatus === 'working');
  const brokenFeatures = FEATURE_AUDIT.filter(f => f.actualStatus === 'broken');
  const incompleteFeatures = FEATURE_AUDIT.filter(f => f.actualStatus === 'incomplete');
  const missingFeatures = FEATURE_AUDIT.filter(f => f.actualStatus === 'missing');
  const highPriorityFeatures = FeatureAuditor.getHighPriorityFeatures();
  const blockedFeatures = FeatureAuditor.getBlockedFeatures();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Feature Reality Audit</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={refreshAudit} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Critical Alert */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">Reality Check Results</h3>
            <p className="text-sm text-red-700 mt-1">
              Only {Math.round((workingFeatures.length / FEATURE_AUDIT.length) * 100)}% of claimed features
              are actually working. {missingFeatures.length} features are completely missing,
              and {brokenFeatures.length} are broken. This is a significant gap between claims and reality.
            </p>
          </div>
        </div>
      </div>

      <OverviewStats />

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All ({FEATURE_AUDIT.length})</TabsTrigger>
          <TabsTrigger value="working">Working ({workingFeatures.length})</TabsTrigger>
          <TabsTrigger value="incomplete">Incomplete ({incompleteFeatures.length})</TabsTrigger>
          <TabsTrigger value="missing">Missing ({missingFeatures.length})</TabsTrigger>
          <TabsTrigger value="broken">Broken ({brokenFeatures.length})</TabsTrigger>
          <TabsTrigger value="priority">Priority ({highPriorityFeatures.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {FEATURE_AUDIT.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="working" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {workingFeatures.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </div>
          {workingFeatures.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No fully working features found. This is concerning.
            </p>
          )}
        </TabsContent>

        <TabsContent value="incomplete" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {incompleteFeatures.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="missing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {missingFeatures.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="broken" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {brokenFeatures.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="priority" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {highPriorityFeatures.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Action Plan</CardTitle>
          <CardDescription>
            Based on current feature status and priorities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-red-800 mb-2">🚨 Immediate Actions (This Week):</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {blockedFeatures.length > 0 && (
                  <li>Resolve {blockedFeatures.length} blocked features first</li>
                )}
                {brokenFeatures.length > 0 && (
                  <li>Fix {brokenFeatures.length} broken features</li>
                )}
                <li>Implement basic analytics tracking to get real user data</li>
                <li>Test all "working" features with real users</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Short Term (2-4 Weeks):</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Complete the {incompleteFeatures.length} incomplete features</li>
                <li>Focus on high-priority features only</li>
                <li>Implement proper error handling and logging</li>
                <li>Set up user feedback collection</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-blue-800 mb-2">📋 Medium Term (1-3 Months):</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Consider implementing missing features based on user demand</li>
                <li>Reduce technical debt systematically</li>
                <li>Improve test coverage and automated testing</li>
                <li>Document all features properly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}