export interface FeatureStatus {
  name: string;
  claimedStatus: 'complete' | 'partial' | 'planned';
  actualStatus: 'working' | 'broken' | 'missing' | 'incomplete';
  userTested: boolean;
  technicalDebt: 'none' | 'low' | 'medium' | 'high' | 'critical';
  estimatedFixTime: string; // in hours
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  blockers: string[];
}

export const FEATURE_AUDIT: FeatureStatus[] = [
  {
    name: "Will Generation Wizard",
    claimedStatus: "complete",
    actualStatus: "working", // Basic functionality exists
    userTested: false,
    technicalDebt: "medium",
    estimatedFixTime: "8h",
    priority: "high",
    dependencies: ["User authentication", "Document templates"],
    blockers: []
  },
  {
    name: "Sofia Chat Widget",
    claimedStatus: "complete",
    actualStatus: "incomplete", // Component exists but not properly integrated
    userTested: false,
    technicalDebt: "high",
    estimatedFixTime: "24h",
    priority: "medium",
    dependencies: ["AI service", "WebSocket connection"],
    blockers: ["No AI service configured", "Missing WebSocket implementation"]
  },
  {
    name: "Admin Analytics Dashboard",
    claimedStatus: "complete",
    actualStatus: "missing", // Only UI mockup exists
    userTested: false,
    technicalDebt: "critical",
    estimatedFixTime: "40h",
    priority: "low",
    dependencies: ["Analytics data collection", "Database tables"],
    blockers: ["No real data collection", "No analytics tables"]
  },
  {
    name: "Multi-Language Support",
    claimedStatus: "complete",
    actualStatus: "broken", // i18n exists but not working properly
    userTested: false,
    technicalDebt: "high",
    estimatedFixTime: "16h",
    priority: "medium",
    dependencies: ["i18next configuration", "Translation files"],
    blockers: ["Incomplete translations", "Broken language switching"]
  },
  {
    name: "Video Tutorial System",
    claimedStatus: "complete",
    actualStatus: "missing", // Only planned, not implemented
    userTested: false,
    technicalDebt: "critical",
    estimatedFixTime: "60h",
    priority: "low",
    dependencies: ["Video storage", "Progress tracking"],
    blockers: ["No video infrastructure", "No database schema"]
  },
  {
    name: "Community Support Platform",
    claimedStatus: "complete",
    actualStatus: "missing", // Only UI component exists
    userTested: false,
    technicalDebt: "critical",
    estimatedFixTime: "80h",
    priority: "low",
    dependencies: ["User system", "Post management"],
    blockers: ["No backend implementation", "No database schema"]
  },
  {
    name: "API Integrations Hub",
    claimedStatus: "complete",
    actualStatus: "missing", // Only class definition exists
    userTested: false,
    technicalDebt: "critical",
    estimatedFixTime: "50h",
    priority: "low",
    dependencies: ["Third-party API keys", "Webhook system"],
    blockers: ["No actual integrations", "No webhook handling"]
  },
  {
    name: "Document Management",
    claimedStatus: "partial",
    actualStatus: "working", // Basic CRUD exists
    userTested: false,
    technicalDebt: "low",
    estimatedFixTime: "4h",
    priority: "high",
    dependencies: ["File storage", "User permissions"],
    blockers: []
  },
  {
    name: "Emergency Contacts",
    claimedStatus: "partial",
    actualStatus: "incomplete", // Basic structure exists
    userTested: false,
    technicalDebt: "medium",
    estimatedFixTime: "12h",
    priority: "high",
    dependencies: ["Contact validation", "Notification system"],
    blockers: ["No notification implementation"]
  },
  {
    name: "User Authentication",
    claimedStatus: "complete",
    actualStatus: "working", // Supabase auth works
    userTested: true,
    technicalDebt: "low",
    estimatedFixTime: "2h",
    priority: "critical",
    dependencies: ["Supabase"],
    blockers: []
  }
];

export class FeatureAuditor {
  static getOverallStatus(): {
    working: number;
    incomplete: number;
    missing: number;
    broken: number;
    total: number;
  } {
    const total = FEATURE_AUDIT.length;
    const working = FEATURE_AUDIT.filter(f => f.actualStatus === 'working').length;
    const incomplete = FEATURE_AUDIT.filter(f => f.actualStatus === 'incomplete').length;
    const missing = FEATURE_AUDIT.filter(f => f.actualStatus === 'missing').length;
    const broken = FEATURE_AUDIT.filter(f => f.actualStatus === 'broken').length;

    return { working, incomplete, missing, broken, total };
  }

  static getTechnicalDebtSummary(): Record<string, number> {
    const debtCounts: Record<string, number> = {};

    FEATURE_AUDIT.forEach(feature => {
      debtCounts[feature.technicalDebt] = (debtCounts[feature.technicalDebt] || 0) + 1;
    });

    return debtCounts;
  }

  static getHighPriorityFeatures(): FeatureStatus[] {
    return FEATURE_AUDIT.filter(f => f.priority === 'high' || f.priority === 'critical');
  }

  static getBlockedFeatures(): FeatureStatus[] {
    return FEATURE_AUDIT.filter(f => f.blockers.length > 0);
  }

  static getEstimatedFixTime(): number {
    return FEATURE_AUDIT.reduce((total, feature) => {
      const hours = parseInt(feature.estimatedFixTime.replace('h', ''));
      return total + hours;
    }, 0);
  }

  static generateAuditReport(): string {
    const status = this.getOverallStatus();
    const debt = this.getTechnicalDebtSummary();
    const blocked = this.getBlockedFeatures();
    const estimatedHours = this.getEstimatedFixTime();

    return `
# Feature Audit Report
Generated: ${new Date().toISOString()}

## Overall Status
- Working: ${status.working}/${status.total} (${Math.round((status.working/status.total)*100)}%)
- Incomplete: ${status.incomplete}/${status.total} (${Math.round((status.incomplete/status.total)*100)}%)
- Missing: ${status.missing}/${status.total} (${Math.round((status.missing/status.total)*100)}%)
- Broken: ${status.broken}/${status.total} (${Math.round((status.broken/status.total)*100)}%)

## Technical Debt Summary
${Object.entries(debt).map(([level, count]) => `- ${level}: ${count} features`).join('\n')}

## Blocked Features
${blocked.map(f => `- ${f.name}: ${f.blockers.join(', ')}`).join('\n')}

## Estimated Fix Time
Total: ${estimatedHours} hours (${Math.round(estimatedHours/8)} work days)

## High Priority Features
${this.getHighPriorityFeatures().map(f => `- ${f.name} (${f.estimatedFixTime})`).join('\n')}
    `;
  }
}