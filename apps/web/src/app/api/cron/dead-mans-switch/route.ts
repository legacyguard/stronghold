import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DeadMansSwitchService, DEAD_MANS_SWITCH_CONFIG } from '@/lib/notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Verify CRON_SECRET for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!authHeader || !cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing credentials' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    if (token !== cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('💀 Starting dead man\'s switch check...', new Date().toISOString());
    console.log('⚙️ Configuration:', DEAD_MANS_SWITCH_CONFIG);

    // Initialize Dead Man's Switch Service
    const deadMansSwitchService = new DeadMansSwitchService(supabase);

    const results = {
      timestamp: new Date().toISOString(),
      users_checked: 0,
      inactive_users: [] as any[],
      notifications_sent: 0,
      escalations_triggered: 0,
      crisis_levels: {
        warning: 0,
        critical: 0,
        emergency: 0
      }
    };

    // 1. Detect inactive users across all inactivity levels
    console.log('🔍 Detecting inactive users...');
    const inactiveUsers = await deadMansSwitchService.detectInactiveUsers();

    results.users_checked = inactiveUsers.length;
    results.inactive_users = inactiveUsers.map(user => ({
      id: user.id,
      email: user.email,
      days_inactive: user.days_inactive,
      inactivity_level: user.inactivity_level,
      last_sign_in_at: user.last_sign_in_at
    }));

    // Count users by crisis level
    inactiveUsers.forEach(user => {
      results.crisis_levels[user.inactivity_level]++;
    });

    console.log(`📊 Found ${inactiveUsers.length} inactive users:`, {
      warning: results.crisis_levels.warning,
      critical: results.crisis_levels.critical,
      emergency: results.crisis_levels.emergency
    });

    // 2. Process each inactive user for notifications and escalations
    for (const inactiveUser of inactiveUsers) {
      console.log(`🔄 Processing user ${inactiveUser.email} (${inactiveUser.inactivity_level} level, ${inactiveUser.days_inactive} days)`);

      // Send crisis notifications to guardians
      if (inactiveUser.guardians && inactiveUser.guardians.length > 0) {
        const notificationResults = await deadMansSwitchService.sendCrisisNotifications(inactiveUser);
        results.notifications_sent += notificationResults.length;

        console.log(`📧 Sent ${notificationResults.length} notifications for ${inactiveUser.email}`);
      } else {
        console.log(`⚠️ No guardians configured for ${inactiveUser.email}`);
      }

      // Trigger escalation procedures for critical/emergency cases
      if (inactiveUser.inactivity_level === 'critical' || inactiveUser.inactivity_level === 'emergency') {
        const escalation = await deadMansSwitchService.triggerEscalationProcedures(inactiveUser);
        results.escalations_triggered++;

        console.log(`🚨 Triggered ${escalation.escalation_level} escalation for ${inactiveUser.email}`);
      }
    }

    console.log('✅ Dead man\'s switch check completed:', {
      users_checked: results.users_checked,
      inactive_users_found: results.inactive_users.length,
      notifications_sent: results.notifications_sent,
      escalations_triggered: results.escalations_triggered,
      crisis_breakdown: results.crisis_levels,
      timestamp: results.timestamp
    });

    return NextResponse.json({
      success: true,
      message: 'Dead man\'s switch check completed successfully',
      results
    });

  } catch (error) {
    console.error('❌ Error in dead-mans-switch cron:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle POST requests (Vercel cron might use POST)
export async function POST(request: NextRequest) {
  return GET(request);
}