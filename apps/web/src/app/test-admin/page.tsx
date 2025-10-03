'use client';

import { useState } from 'react';
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
            <Badge variant="outline">{feature.priority}</Badge>
            <Badge variant="outline">{feature.technicalDebt} debt</Badge>
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

export default function TestAdminPage() {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refreshAudit = () => {
    setLastUpdated(new Date());
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Test Banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
          <div>
            <h3 className="font-semibold text-orange-800">Test Admin Page</h3>
            <p className="text-sm text-orange-700">
              This is a test version of the admin audit page without authentication.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Feature Reality Audit (Test)</h1>
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
    </div>
  );
}