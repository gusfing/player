import { Resend } from "resend"

let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

const FROM_EMAIL = "YouTube Shell <noreply@shrazen.com>"

export async function sendWebhookFailureAlert(
  email: string,
  webhookName: string,
  webhookUrl: string,
  lastError: string,
  failureCount: number
) {
  const resend = getResendClient()
  if (!resend) {
    console.warn("RESEND_API_KEY not configured, skipping email")
    return false
  }
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `YouTube Shell: Webhook "${webhookName}" failing`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #FF0000; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">⚠️ Webhook Delivery Failing</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <p style="font-size: 16px; color: #333;">
              Your webhook <strong>"${webhookName}"</strong> has failed ${failureCount} consecutive times.
            </p>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1a1a1a;">Webhook Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Name:</td>
                  <td style="padding: 8px 0; font-weight: 500;">${webhookName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">URL:</td>
                  <td style="padding: 8px 0; font-family: monospace;">${webhookUrl}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Failed Attempts:</td>
                  <td style="padding: 8px 0; color: #dc2626; font-weight: 500;">${failureCount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Last Error:</td>
                  <td style="padding: 8px 0; color: #dc2626;">${lastError || "Unknown error"}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fef3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>What this means:</strong> We will continue to retry delivery, but events may be delayed or lost during this time.
              </p>
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://shrazen.com"}/dashboard/settings" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 10px;">
              View in Dashboard
            </a>
            
            <p style="margin-top: 30px; font-size: 12px; color: #999;">
              You received this email because your webhook is experiencing delivery issues. 
              If you continue to have problems, check that your endpoint is accepting requests and returning a 2xx status code.
            </p>
          </div>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error("Failed to send webhook failure alert:", error)
    return false
  }
}

export async function sendTestEmail(email: string) {
  const resend = getResendClient()
  if (!resend) {
    console.warn("RESEND_API_KEY not configured, skipping email")
    return false
  }
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "YouTube Shell - Test Email",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">✓ Email Working!</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <p style="font-size: 16px; color: #333;">
              This is a test email from YouTube Shell. Your email notifications are working correctly.
            </p>
          </div>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error("Failed to send test email:", error)
    return false
  }
}

export async function sendLeadNotification(
  userEmail: string,
  lead: {
    email: string
    name?: string | null
    phone?: string | null
  },
  installationDomain: string
) {
  const resend = getResendClient()
  if (!resend) {
    console.warn("RESEND_API_KEY not configured, skipping email")
    return false
  }
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `New Lead Captured: ${lead.email}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🎉 New Lead Captured!</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <p style="font-size: 16px; color: #333;">
              A new lead was captured on your site <strong>${installationDomain}</strong>.
            </p>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1a1a1a;">Lead Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Email:</td>
                  <td style="padding: 8px 0; font-weight: 500;">
                    <a href="mailto:${lead.email}" style="color: #2563eb;">${lead.email}</a>
                  </td>
                </tr>
                ${lead.name ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Name:</td>
                  <td style="padding: 8px 0; font-weight: 500;">${lead.name}</td>
                </tr>
                ` : ""}
                ${lead.phone ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Phone:</td>
                  <td style="padding: 8px 0; font-weight: 500;">
                    <a href="tel:${lead.phone}" style="color: #2563eb;">${lead.phone}</a>
                  </td>
                </tr>
                ` : ""}
                <tr>
                  <td style="padding: 8px 0; color: #666;">Captured:</td>
                  <td style="padding: 8px 0;">${new Date().toLocaleString()}</td>
                </tr>
              </table>
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://shrazen.com"}/dashboard/installation/${installationDomain}/leads" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 10px;">
              View All Leads
            </a>
          </div>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error("Failed to send lead notification:", error)
    return false
  }
}

export async function sendHotLeadNotification(
  userEmail: string,
  lead: {
    email: string
    name?: string
    phone?: string | null
    submissionCount: number
  },
  installationDomain: string
) {
  const resend = getResendClient()
  if (!resend) {
    console.warn("RESEND_API_KEY not configured, skipping email")
    return false
  }
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `🔥 HOT LEAD: ${lead.email} (${lead.submissionCount} submissions)`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FF6B6B 0%, #FF4757 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🔥 HOT LEAD!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">High-intent visitor detected</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <div style="background: white; border: 2px solid #FF6B6B; border-radius: 12px; padding: 25px; margin-bottom: 20px;">
              <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                <div style="width: 60px; height: 60px; background: #FF6B6B; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 24px; color: white;">👤</span>
                </div>
                <div>
                  <h2 style="margin: 0; color: #1a1a1a; font-size: 20px;">${lead.email}</h2>
                  ${lead.name ? `<p style="margin: 5px 0 0 0; color: #666;">${lead.name}</p>` : ""}
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="background: #FFF5F5; padding: 15px; border-radius: 8px; text-align: center;">
                  <p style="margin: 0; font-size: 32px; font-weight: bold; color: #FF6B6B;">${lead.submissionCount}</p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Submissions</p>
                </div>
                <div style="background: #FFF5F5; padding: 15px; border-radius: 8px; text-align: center;">
                  <p style="margin: 0; font-size: 32px; font-weight: bold; color: #FF6B6B;">🔥</p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Hot Lead</p>
                </div>
              </div>
            </div>
            
            <div style="background: #fef3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>💡 Why this matters:</strong> This visitor has submitted the form multiple times, indicating high interest. Consider reaching out immediately!
              </p>
            </div>
            
            ${lead.phone ? `
            <a href="tel:${lead.phone}" style="display: inline-block; background: #10b981; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin-right: 10px;">
              📞 Call Now
            </a>
            ` : ""}
            
            <a href="mailto:${lead.email}" style="display: inline-block; background: #2563eb; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              ✉️ Send Email
            </a>
            
            <p style="margin-top: 25px; font-size: 12px; color: #999;">
              From: <strong>${installationDomain}</strong> • 
              Last submission: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error("Failed to send hot lead notification:", error)
    return false
  }
}
