import { Shield, Users, FileText, Lock, TrendingUp, Bell } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const stats = [
    { label: "Documents Protected", value: "12", icon: FileText, color: "text-primary" },
    { label: "Guardians Active", value: "4", icon: Users, color: "text-blue-600" },
    { label: "Security Score", value: "95%", icon: Shield, color: "text-green-600" },
    { label: "Monthly Savings", value: "$2.4K", icon: TrendingUp, color: "text-purple-600" },
  ];

  const recentActivity = [
    { action: "Document vault updated", time: "2 hours ago", type: "document" },
    { action: "Guardian invitation sent", time: "1 day ago", type: "guardian" },
    { action: "Will template generated", time: "3 days ago", type: "will" },
    { action: "Security check completed", time: "1 week ago", type: "security" },
  ];

  const quickActions = [
    { title: "Generate Will", description: "Create a legally compliant will", href: "/will-generator", icon: FileText },
    { title: "Add Guardian", description: "Invite trusted contacts", href: "/guardians", icon: Users },
    { title: "Upload Documents", description: "Secure important files", href: "/vault", icon: Lock },
    { title: "Family Shield", description: "Comprehensive protection", href: "/family-shield", icon: Shield },
  ];

  return (
    <div className="space-y-2xl">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary-light rounded-xl p-2xl text-surface shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h1 font-bold mb-sm">Welcome back!</h1>
            <p className="text-xl opacity-90">Your family&apos;s protection is our priority</p>
          </div>
          <div className="hidden md:block">
            <Shield className="h-16 w-16 opacity-20" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
        {stats.map((stat, index) => (
          <div key={index} className="bg-surface rounded-lg p-lg border border-border/20 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-text-light font-medium uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-h2 font-bold text-text-dark mt-xs">{stat.value}</p>
              </div>
              <div className={`p-sm rounded-lg bg-neutral-beige/50 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2xl">
        {/* Quick Actions */}
        <div className="bg-surface rounded-lg border border-border/20 shadow-sm">
          <div className="p-lg border-b border-border/10">
            <h2 className="text-h3 font-semibold text-text-dark">Quick Actions</h2>
            <p className="text-body text-text-light">Get started with essential tasks</p>
          </div>
          <div className="p-lg space-y-md">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="flex items-center gap-md p-md rounded-lg hover:bg-neutral-beige/50 transition-colors group"
              >
                <div className="p-sm bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-body font-medium text-text-dark">{action.title}</h3>
                  <p className="text-caption text-text-light">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-surface rounded-lg border border-border/20 shadow-sm">
          <div className="p-lg border-b border-border/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-h3 font-semibold text-text-dark">Recent Activity</h2>
                <p className="text-body text-text-light">Latest updates and changes</p>
              </div>
              <button className="p-sm hover:bg-neutral-beige/50 rounded-lg transition-colors">
                <Bell className="h-5 w-5 text-text-light" />
              </button>
            </div>
          </div>
          <div className="p-lg space-y-md">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-md">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-body text-text-dark">{activity.action}</p>
                  <p className="text-caption text-text-light">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Alert */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-lg">
        <div className="flex items-start gap-md">
          <div className="p-sm bg-yellow-100 rounded-lg">
            <Shield className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-body font-medium text-yellow-800">Security Recommendation</h3>
            <p className="text-caption text-yellow-700 mt-xs">
              Consider enabling two-factor authentication for enhanced account security.
            </p>
            <Link href="/settings" className="text-caption text-yellow-600 hover:underline mt-xs inline-block">
              Update Security Settings →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
