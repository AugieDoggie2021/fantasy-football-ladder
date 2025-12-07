/**
 * Send Invite Email Edge Function
 * 
 * Sends league invitation emails via Resend API.
 * In development, emails are logged to Inbucket for testing.
 * In production, emails are sent via Resend using the custom domain (fantasyladder.app).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "npm:resend"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendInviteEmailRequest {
  to: string
  inviteUrl: string
  leagueName: string
  commissionerName: string
  commissionerEmail?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body: SendInviteEmailRequest = await req.json()
    const { to, inviteUrl, leagueName, commissionerName, commissionerEmail } = body

    if (!to || !inviteUrl || !leagueName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, inviteUrl, leagueName' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Email template
    const subject = `You've been invited to join ${leagueName} on Fantasy Football Ladder`
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>League Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Fantasy Football Ladder</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1f2937; margin-top: 0;">You've been invited!</h2>
    
    <p style="color: #4b5563; font-size: 16px;">
      <strong>${commissionerName}</strong>${commissionerEmail ? ` (${commissionerEmail})` : ''} has invited you to join their fantasy football league:
    </p>
    
    <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">
        ${leagueName}
      </p>
    </div>
    
    <p style="color: #4b5563; font-size: 16px;">
      Click the button below to accept the invitation and join the league:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Join League
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      Or copy and paste this link into your browser:<br>
      <a href="${inviteUrl}" style="color: #667eea; word-break: break-all;">${inviteUrl}</a>
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #6b7280; font-size: 12px; margin: 0;">
      This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>Fantasy Football Ladder - Fantasy football with promotion and relegation</p>
  </div>
</body>
</html>
    `

    const textBody = `
You've been invited to join ${leagueName} on Fantasy Football Ladder

${commissionerName}${commissionerEmail ? ` (${commissionerEmail})` : ''} has invited you to join their fantasy football league: ${leagueName}

Accept the invitation by clicking this link:
${inviteUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

---
Fantasy Football Ladder
    `.trim()

    // Check environment
    const env = Deno.env.get('ENVIRONMENT') || Deno.env.get('SUPABASE_ENVIRONMENT') || 'dev'
    const isDev = env === 'dev' || env === 'local'
    
    // In development, log to Inbucket
    if (isDev) {
      console.log('DEV MODE: Email would be sent to:', to)
      console.log('DEV MODE: Subject:', subject)
      console.log('DEV MODE: Invite URL:', inviteUrl)
      console.log('DEV MODE: Check Inbucket at http://localhost:54324')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email logged (dev mode - check Inbucket at http://localhost:54324)',
          devMode: true 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // In production, use Resend API
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not set')
      return new Response(
        JSON.stringify({ 
          error: 'Email service not configured',
          details: 'RESEND_API_KEY secret is not set in Supabase Edge Functions'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    try {
      const resend = new Resend(resendApiKey)
      
      // Send email via Resend API
      // Using custom domain: mail.fantasyladder.app
      const { data, error: resendError } = await resend.emails.send({
        from: 'Fantasy Football Ladder <invites@mail.fantasyladder.app>',
        to: [to],
        subject: subject,
        html: htmlBody,
        text: textBody,
        replyTo: commissionerEmail || undefined,
      })

      if (resendError) {
        console.error('Resend API error:', resendError)
        
        // Handle specific Resend errors
        let errorMessage = 'Failed to send email'
        let statusCode = 500
        
        if (resendError.message) {
          errorMessage = resendError.message
          
          // Handle rate limiting
          if (resendError.message.includes('rate limit') || resendError.message.includes('429')) {
            statusCode = 429
            errorMessage = 'Email service rate limit exceeded. Please try again later.'
          }
          
          // Handle invalid API key
          if (resendError.message.includes('401') || resendError.message.includes('unauthorized')) {
            statusCode = 401
            errorMessage = 'Email service authentication failed'
          }
          
          // Handle domain verification issues
          if (resendError.message.includes('domain') || resendError.message.includes('verify')) {
            errorMessage = 'Email domain not verified. Please verify fantasyladder.app in Resend dashboard.'
          }
        }
        
        return new Response(
          JSON.stringify({ 
            error: errorMessage,
            details: resendError.message || 'Unknown Resend API error'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: statusCode,
          }
        )
      }

      // Success
      console.log('Email sent successfully via Resend:', data?.id)
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Email sent successfully',
          emailId: data?.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } catch (error: any) {
      console.error('Unexpected error sending email:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email',
          details: error.message || 'Unknown error occurred'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

