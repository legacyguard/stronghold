import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface TimeCapsuleDelivery {
  id: string
  user_id: string
  title: string
  message: string
  message_type: 'text' | 'audio' | 'video'
  file_url?: string
  recipient_email?: string
  recipient_name?: string
  user_email?: string
  user_name?: string
}

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cookieStore = await cookies()
    const supabase = createServerComponentClient({
      cookies: () => cookieStore
    }, {
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    })

    // Get time capsules that should be delivered today
    const today = new Date().toISOString().split('T')[0]

    const { data: timeCapsules, error: fetchError } = await supabase
      .from('time_capsules')
      .select(`
        id,
        user_id,
        title,
        message,
        message_type,
        file_url,
        recipient_email,
        recipient_name,
        users:user_id (
          email,
          raw_user_meta_data
        )
      `)
      .eq('delivery_date', today)
      .eq('is_delivered', false)

    if (fetchError) {
      console.error('Error fetching time capsules:', fetchError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!timeCapsules || timeCapsules.length === 0) {
      return NextResponse.json({
        message: 'No time capsules to deliver today',
        delivered: 0
      })
    }

    let deliveredCount = 0
    const deliveryResults = []

    for (const capsule of timeCapsules) {
      try {
        // Prepare email data
        const deliveryData: TimeCapsuleDelivery = {
          id: capsule.id,
          user_id: capsule.user_id,
          title: capsule.title,
          message: capsule.message,
          message_type: capsule.message_type,
          file_url: capsule.file_url,
          recipient_email: capsule.recipient_email,
          recipient_name: capsule.recipient_name,
          user_email: (capsule.users as unknown as Record<string, unknown>)?.email as string,
          user_name: ((capsule.users as unknown as Record<string, unknown>)?.raw_user_meta_data as Record<string, unknown>)?.full_name as string ||
                    ((capsule.users as unknown as Record<string, unknown>)?.raw_user_meta_data as Record<string, unknown>)?.name as string ||
                    'Používateľ LegacyGuard'
        }

        // Send email notification
        const emailResult = await sendTimeCapsuleEmail(deliveryData)

        if (emailResult.success) {
          // Mark as delivered
          const { error: updateError } = await supabase
            .from('time_capsules')
            .update({ is_delivered: true })
            .eq('id', capsule.id)

          if (!updateError) {
            deliveredCount++
            deliveryResults.push({
              id: capsule.id,
              title: capsule.title,
              status: 'delivered'
            })
          } else {
            console.error(`Error marking time capsule ${capsule.id} as delivered:`, updateError)
            deliveryResults.push({
              id: capsule.id,
              title: capsule.title,
              status: 'marked_delivery_failed',
              error: updateError.message
            })
          }
        } else {
          console.error(`Error sending time capsule ${capsule.id}:`, emailResult.error)
          deliveryResults.push({
            id: capsule.id,
            title: capsule.title,
            status: 'email_failed',
            error: emailResult.error
          })
        }
      } catch (error) {
        console.error(`Error processing time capsule ${capsule.id}:`, error)
        deliveryResults.push({
          id: capsule.id,
          title: capsule.title,
          status: 'processing_failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: `Processed ${timeCapsules.length} time capsules, delivered ${deliveredCount}`,
      delivered: deliveredCount,
      total: timeCapsules.length,
      results: deliveryResults
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function sendTimeCapsuleEmail(delivery: TimeCapsuleDelivery): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Determine recipient
    const recipientEmail = delivery.recipient_email || delivery.user_email
    const recipientName = delivery.recipient_name || delivery.user_name

    if (!recipientEmail) {
      return { success: false, error: 'No recipient email found' }
    }

    // For now, we'll use a simple email service
    // In production, you would integrate with services like:
    // - Resend (recommended for this project)
    // - SendGrid
    // - Mailgun
    // - Amazon SES

    // This is a placeholder for email sending logic
    // You'll need to implement actual email sending based on your choice of service

    const emailData = {
      to: recipientEmail,
      subject: `⏰ Časová schránka: ${delivery.title}`,
      html: generateTimeCapsuleEmailHTML(delivery),
      from: 'noreply@legacyguard.sk' // Replace with your domain
    }

    // TODO: Implement actual email sending
    // For now, we'll log the email data and return success
    console.log('Time capsule email to be sent:', {
      to: emailData.to,
      subject: emailData.subject,
      timeCapsuleId: delivery.id
    })

    // In a real implementation, you would:
    // 1. Call your email service API
    // 2. Handle any errors from the email service
    // 3. Return the actual result

    return { success: true }

  } catch (error) {
    console.error('Email sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email sending failed'
    }
  }
}

function generateTimeCapsuleEmailHTML(delivery: TimeCapsuleDelivery): string {
  const isRecipientOwner = !delivery.recipient_email

  return `
    <!DOCTYPE html>
    <html lang="sk">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Časová schránka - ${delivery.title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #6B8E23;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #6B8E23;
          margin-bottom: 10px;
        }
        .title {
          font-size: 22px;
          color: #333;
          margin-bottom: 20px;
        }
        .message {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
          border-left: 4px solid #6B8E23;
        }
        .media-note {
          background: #e8f5e8;
          padding: 15px;
          border-radius: 6px;
          margin: 15px 0;
          text-align: center;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          background: #6B8E23;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">⏰ LegacyGuard</div>
          <h1 class="title">Vaša časová schránka je pripravená!</h1>
        </div>

        <p>Milý/á ${delivery.recipient_name},</p>

        ${isRecipientOwner
          ? `<p>Vaša časová schránka "<strong>${delivery.title}</strong>" je pripravená na otvorenie!</p>`
          : `<p><strong>${delivery.user_name}</strong> pre vás vytvoril/a časovú schránku "<strong>${delivery.title}</strong>".</p>`
        }

        ${delivery.message_type === 'text'
          ? `<div class="message">
               <h3>Správa:</h3>
               <p>${delivery.message.replace(/\n/g, '<br>')}</p>
             </div>`
          : `<div class="media-note">
               <h3>📹 ${delivery.message_type === 'video' ? 'Video' : 'Audio'} správa</h3>
               <p>Táto časová schránka obsahuje ${delivery.message_type === 'video' ? 'video' : 'audio'} správu.</p>
               ${delivery.file_url
                 ? `<a href="${delivery.file_url}" class="button">Pozrieť/Počúvať správu</a>`
                 : '<p><em>Súbor nie je dostupný.</em></p>'
               }
             </div>`
        }

        <div class="footer">
          <p>Táto správa bola doručená automaticky systémom LegacyGuard.</p>
          <p>Ak máte otázky, kontaktujte nás na <a href="mailto:support@legacyguard.sk">support@legacyguard.sk</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}