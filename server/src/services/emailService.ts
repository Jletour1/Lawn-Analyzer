import nodemailer from 'nodemailer';

// Configure email transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export interface NotificationEmailData {
  submissionId: string;
  analysisResult: any;
}

export const sendNotificationEmail = async (
  userEmail: string,
  data: NotificationEmailData
): Promise<void> => {
  try {
    if (!process.env.SMTP_HOST) {
      console.log('Email service not configured, skipping notification');
      return;
    }

    const { submissionId, analysisResult } = data;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: userEmail,
      subject: 'Your Lawn Analysis Results are Ready! 🌿',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🌿 Lawn Analysis Complete</h1>
            <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Your professional lawn diagnosis is ready</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #374151; margin-top: 0;">Analysis Results</h2>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Root Cause</h3>
              <p style="color: #4b5563; line-height: 1.6;">${analysisResult.rootCause}</p>
            </div>
            
            <h3 style="color: #1f2937;">Recommended Solutions</h3>
            <ul style="color: #4b5563; line-height: 1.8;">
              ${analysisResult.solutions.map((solution: string) => `<li>${solution}</li>`).join('')}
            </ul>
            
            <div style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46;">
                <strong>Confidence:</strong> ${Math.round(analysisResult.confidence * 100)}% | 
                <strong>Urgency:</strong> ${analysisResult.urgency} | 
                <strong>Timeline:</strong> ${analysisResult.timeline}
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/submission/${submissionId}" 
                 style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Full Analysis
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Thank you for using Lawn Analyzer! 
                <a href="${process.env.FRONTEND_URL}" style="color: #10b981;">Analyze another photo</a>
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Notification email sent to:', userEmail);

  } catch (error) {
    console.error('Email service error:', error);
    // Don't throw error - email failure shouldn't break analysis
  }
};

export const sendAdminAlert = async (
  subject: string,
  message: string,
  data?: any
): Promise<void> => {
  try {
    if (!process.env.ADMIN_EMAIL || !process.env.SMTP_HOST) {
      console.log('Admin email not configured, skipping alert');
      return;
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `[Lawn Analyzer Admin] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">${subject}</h2>
          <p style="color: #4b5563; line-height: 1.6;">${message}</p>
          
          ${data ? `
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Additional Data</h3>
              <pre style="color: #6b7280; font-size: 12px; overflow-x: auto;">${JSON.stringify(data, null, 2)}</pre>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.FRONTEND_URL}/admin" 
               style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Admin Dashboard
            </a>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Admin alert sent:', subject);

  } catch (error) {
    console.error('Admin email error:', error);
  }
};