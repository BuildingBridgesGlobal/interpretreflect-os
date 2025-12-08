import { Resend } from "resend";

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = "InterpretReflect <noreply@interpretreflect.com>";

type CertificateEmailData = {
  to: string;
  userName: string;
  certificateNumber: string;
  moduleTitle: string;
  ceuValue: number;
  ridCategory: string;
  activityCode?: string;
  completionDate: string;
  verificationUrl: string;
};

/**
 * Send certificate issued email to user
 */
export async function sendCertificateEmail(data: CertificateEmailData): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn("Resend not configured - skipping certificate email");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Your CEU Certificate is Ready - ${data.moduleTitle}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your CEU Certificate</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0d9488 0%, #7c3aed 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                InterpretReflect
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                RID Approved Sponsor #2309
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px; font-weight: 600;">
                Congratulations, ${data.userName}!
              </h2>
              <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
                You've successfully completed your CEU workshop and earned your certificate.
              </p>

              <!-- Certificate Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f0fdfa; border-radius: 8px; border: 1px solid #99f6e4;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      <tr>
                        <td>
                          <p style="margin: 0 0 4px; color: #0d9488; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                            Workshop Completed
                          </p>
                          <h3 style="margin: 0 0 16px; color: #18181b; font-size: 18px; font-weight: 600;">
                            ${data.moduleTitle}
                          </h3>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                            <tr>
                              <td style="width: 50%; vertical-align: top; padding-right: 12px;">
                                <p style="margin: 0 0 4px; color: #71717a; font-size: 12px;">CEU Earned</p>
                                <p style="margin: 0; color: #0d9488; font-size: 24px; font-weight: 700;">${data.ceuValue}</p>
                              </td>
                              <td style="width: 50%; vertical-align: top;">
                                <p style="margin: 0 0 4px; color: #71717a; font-size: 12px;">Category</p>
                                <p style="margin: 0; color: #18181b; font-size: 14px; font-weight: 500;">${data.ridCategory}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 16px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                            <tr>
                              <td style="width: 50%; vertical-align: top; padding-right: 12px;">
                                <p style="margin: 0 0 4px; color: #71717a; font-size: 12px;">Certificate Number</p>
                                <p style="margin: 0; color: #18181b; font-size: 14px; font-family: monospace;">${data.certificateNumber}</p>
                              </td>
                              <td style="width: 50%; vertical-align: top;">
                                <p style="margin: 0 0 4px; color: #71717a; font-size: 12px;">Completion Date</p>
                                <p style="margin: 0; color: #18181b; font-size: 14px;">${data.completionDate}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ${data.activityCode ? `
                      <tr>
                        <td style="padding-top: 16px;">
                          <p style="margin: 0 0 4px; color: #71717a; font-size: 12px;">Activity Code</p>
                          <p style="margin: 0; color: #18181b; font-size: 14px; font-family: monospace;">${data.activityCode}</p>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://interpretreflect.com/ceu" style="display: inline-block; padding: 14px 28px; background-color: #0d9488; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      View & Download Certificate
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Verification Info -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 24px; background-color: #f4f4f5; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;">
                      <strong>Certificate Verification</strong>
                    </p>
                    <p style="margin: 0; color: #71717a; font-size: 13px; line-height: 1.5;">
                      Your certificate can be verified at any time using this link:<br>
                      <a href="${data.verificationUrl}" style="color: #0d9488; text-decoration: none; font-family: monospace; font-size: 12px;">
                        ${data.verificationUrl}
                      </a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 24px;">
                <tr>
                  <td>
                    <h4 style="margin: 0 0 12px; color: #18181b; font-size: 16px; font-weight: 600;">
                      What's Next?
                    </h4>
                    <ul style="margin: 0; padding: 0 0 0 20px; color: #52525b; font-size: 14px; line-height: 1.8;">
                      <li>Download your certificate from your CEU Dashboard</li>
                      <li>Your CEUs will be submitted to RID monthly</li>
                      <li>Keep earning CEUs to meet your certification requirements</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f4f4f5; border-top: 1px solid #e4e4e7;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px; color: #71717a; font-size: 13px;">
                      InterpretReflect - RID Approved Sponsor #2309
                    </p>
                    <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                      Building Bridges Global LLC<br>
                      <a href="https://interpretreflect.com" style="color: #0d9488; text-decoration: none;">
                        interpretreflect.com
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (error) {
      console.error("Failed to send certificate email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error sending certificate email:", err);
    return { success: false, error: err.message };
  }
}

type EvaluationReminderData = {
  to: string;
  userName: string;
  moduleTitle: string;
  ceuValue: number;
  dashboardUrl: string;
};

/**
 * Send evaluation reminder email (24h after quiz pass if no evaluation)
 */
export async function sendEvaluationReminderEmail(data: EvaluationReminderData): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn("Resend not configured - skipping evaluation reminder email");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Complete Your Evaluation to Get Your CEU Certificate - ${data.moduleTitle}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background-color: #0d9488; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px;">InterpretReflect</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 18px;">
                Almost There, ${data.userName}!
              </h2>
              <p style="margin: 0 0 16px; color: #52525b; font-size: 15px; line-height: 1.6;">
                You passed the quiz for <strong>${data.moduleTitle}</strong> - great work!
              </p>
              <p style="margin: 0 0 24px; color: #52525b; font-size: 15px; line-height: 1.6;">
                Just one more step to get your <strong>${data.ceuValue} CEU</strong> certificate: complete the quick evaluation form (takes about 2 minutes).
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${data.dashboardUrl}" style="display: inline-block; padding: 14px 28px; background-color: #0d9488; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Complete Evaluation
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; color: #71717a; font-size: 13px; text-align: center;">
                Evaluations are required by RID for all CEU-eligible activities.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px; background-color: #f4f4f5; text-align: center;">
              <p style="margin: 0; color: #71717a; font-size: 12px;">
                InterpretReflect - RID Sponsor #2309
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (error) {
      console.error("Failed to send evaluation reminder:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error sending evaluation reminder:", err);
    return { success: false, error: err.message };
  }
}
