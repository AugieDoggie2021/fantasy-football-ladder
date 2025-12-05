/**
 * Email Templates
 * 
 * HTML and text templates for league invitation emails.
 */

export interface InviteEmailData {
  leagueName: string
  commissionerName: string
  commissionerEmail?: string
  inviteUrl: string
}

/**
 * Generate HTML email template for league invitation
 */
export function generateInviteEmailHTML(data: InviteEmailData): string {
  const { leagueName, commissionerName, commissionerEmail, inviteUrl } = data

  return `
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
      <strong>${escapeHtml(commissionerName)}</strong>${commissionerEmail ? ` (${escapeHtml(commissionerEmail)})` : ''} has invited you to join their fantasy football league:
    </p>
    
    <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">
        ${escapeHtml(leagueName)}
      </p>
    </div>
    
    <p style="color: #4b5563; font-size: 16px;">
      Click the button below to accept the invitation and join the league:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${escapeHtml(inviteUrl)}" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Join League
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      Or copy and paste this link into your browser:<br>
      <a href="${escapeHtml(inviteUrl)}" style="color: #667eea; word-break: break-all;">${escapeHtml(inviteUrl)}</a>
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
  `.trim()
}

/**
 * Generate plain text email template for league invitation
 */
export function generateInviteEmailText(data: InviteEmailData): string {
  const { leagueName, commissionerName, commissionerEmail, inviteUrl } = data

  return `
You've been invited to join ${leagueName} on Fantasy Football Ladder

${commissionerName}${commissionerEmail ? ` (${commissionerEmail})` : ''} has invited you to join their fantasy football league: ${leagueName}

Accept the invitation by clicking this link:
${inviteUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

---
Fantasy Football Ladder
  `.trim()
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

