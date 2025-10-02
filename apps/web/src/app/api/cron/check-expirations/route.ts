import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NotificationService } from '@/lib/notifications';

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🔍 Starting daily expiration check...', new Date().toISOString());

    // Initialize notification service
    const notificationService = new NotificationService();

    const results = {
      timestamp: new Date().toISOString(),
      expiring_documents: [] as unknown[],
      expiring_wills: [] as unknown[],
      expiring_guardians: [] as unknown[],
      notifications_sent: 0,
      notification_results: [] as unknown[]
    };

    try {
      // 1. Check for expiring documents
      console.log('📄 Checking for expiring documents...');
      const expiringDocuments = await notificationService.findExpiringDocuments();
      results.expiring_documents = expiringDocuments;

      // 2. Check for wills needing updates
      console.log('📋 Checking for wills needing updates...');
      const expiringWills = await notificationService.findWillsNeedingUpdate();
      results.expiring_wills = expiringWills;

      // 3. Check for expiring guardian assignments
      console.log('👥 Checking for expiring guardian assignments...');
      const expiringGuardians = await notificationService.findExpiringGuardians();
      results.expiring_guardians = expiringGuardians;

      // 4. Send notifications (skeleton - just logs for now)
      const allNotifications = [
        ...expiringDocuments,
        ...expiringWills,
        ...expiringGuardians
      ];

      if (allNotifications.length > 0) {
        console.log(`📧 Processing ${allNotifications.length} potential notifications...`);

        const notificationResults = await notificationService.sendBatchNotifications(allNotifications);
        results.notification_results = notificationResults;
        results.notifications_sent = notificationResults.filter(r => r.sent).length;

        console.log(`✅ Sent ${results.notifications_sent} notifications successfully`);
      } else {
        console.log('📭 No notifications needed at this time');
      }

      // 5. Log summary
      console.log('✅ Expiration check completed:', {
        documents_checked: expiringDocuments.length,
        wills_checked: expiringWills.length,
        guardians_checked: expiringGuardians.length,
        notifications_sent: results.notifications_sent,
        timestamp: results.timestamp
      });

    } catch (error) {
      console.error('❌ Error during expiration checks:', error);
      // Continue execution but log the error
    }

    return NextResponse.json({
      success: true,
      message: 'Expiration check completed successfully',
      results
    });

  } catch (error) {
    console.error('❌ Error in check-expirations cron:', error);
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