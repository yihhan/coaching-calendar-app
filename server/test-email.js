const nodemailer = require('nodemailer');
require('dotenv').config();

// Test email configuration
const testEmailTransporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Test email function
const sendTestEmail = async () => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: process.env.EMAIL_USER || 'your-email@gmail.com', // Send to self for testing
      subject: 'Test Email - Calla Booking System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Test Email Notification</h2>
          <p>This is a test email to verify the email service is working correctly.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Sample Session</h3>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
            <p><strong>Student:</strong> Test Student</p>
          </div>
          
          <p>If you receive this email, the notification system is working!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This is a test notification from Calla - Just a good teacher away
            </p>
          </div>
        </div>
      `
    };

    const result = await testEmailTransporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    throw error;
  }
};

// Run the test
console.log('🧪 Testing email service...');
console.log('📧 Email User:', process.env.EMAIL_USER || 'Not configured');
console.log('🔑 Email Pass:', process.env.EMAIL_PASS ? 'Configured' : 'Not configured');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
    process.env.EMAIL_USER === 'your-email@gmail.com' || 
    process.env.EMAIL_PASS === 'your-app-password') {
  console.log('⚠️  Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in .env file');
  console.log('📝 Example:');
  console.log('   EMAIL_USER=your-email@gmail.com');
  console.log('   EMAIL_PASS=your-app-password');
  process.exit(1);
}

sendTestEmail()
  .then(() => {
    console.log('🎉 Email test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Email test failed:', error.message);
    process.exit(1);
  });
