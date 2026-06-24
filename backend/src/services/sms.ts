import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

let client: any = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export const sendApprovalSMS = async (phoneNumber: string, scheduleId: string) => {
  try {
    if (!client) {
      console.log('SMS service not configured, skipping SMS');
      return;
    }

    await client.messages.create({
      body: `✅ Your schedule (${scheduleId}) has been approved!`,
      from: process.env.TWILIO_PHONE,
      to: phoneNumber,
    });

    console.log(`Approval SMS sent to ${phoneNumber}`);
  } catch (error) {
    console.error('Failed to send approval SMS:', error);
  }
};

export const sendRejectionSMS = async (phoneNumber: string, scheduleId: string, reason?: string) => {
  try {
    if (!client) {
      console.log('SMS service not configured, skipping SMS');
      return;
    }

    const message = reason
      ? `❌ Your schedule (${scheduleId}) was rejected: ${reason.substring(0, 50)}...`
      : `❌ Your schedule (${scheduleId}) was rejected. Check the app for details.`;

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: phoneNumber,
    });

    console.log(`Rejection SMS sent to ${phoneNumber}`);
  } catch (error) {
    console.error('Failed to send rejection SMS:', error);
  }
};

export const sendUploadNotificationSMS = async (phoneNumber: string, inmateName: string) => {
  try {
    if (!client) {
      console.log('SMS service not configured, skipping SMS');
      return;
    }

    await client.messages.create({
      body: `📅 New schedule submitted by ${inmateName} for review.`,
      from: process.env.TWILIO_PHONE,
      to: phoneNumber,
    });

    console.log(`Upload notification SMS sent to ${phoneNumber}`);
  } catch (error) {
    console.error('Failed to send upload notification SMS:', error);
  }
};
