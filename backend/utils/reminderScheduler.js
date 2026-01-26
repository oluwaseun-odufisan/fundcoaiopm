import cron from 'node-cron';
import mongoose from 'mongoose';
import Reminder from '../models/reminderModel.js';
import User from '../models/userModel.js';
import { sendEmail } from './emailService.js';
import { sendPushNotification } from './pushService.js';

const sendReminder = async (reminder) => {
    console.log(`Processing reminder ${reminder._id} for user ${reminder.user} at ${new Date().toISOString()}`);
    const user = await User.findById(reminder.user);
    if (!user) {
        console.error(`User ${reminder.user} not found for reminder ${reminder._id}`);
        return false;
    }

    let emailSent = false;
    let pushSent = false;
    let inAppSent = false;

    try {
        // In-app notification
        if (reminder.deliveryChannels.inApp) {
            console.log(`Emitting inApp notification for reminder ${reminder._id}`);
            global.io.to(`user:${user._id}`).emit('reminderTriggered', reminder);
            inAppSent = true;
        }

        // Email notification with retry
        if (reminder.deliveryChannels.email) {
            const emailTo = reminder.emailOverride || user.email;
            if (emailTo) {
                console.log(`Sending email for reminder ${reminder._id} to ${emailTo}`);
                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        await sendEmail({
                            to: emailTo,
                            subject: `Reminder: ${reminder.message}`,
                            text: `You have a ${reminder.type.replace('_', ' ')} scheduled for ${new Date(reminder.remindAt).toLocaleString('en-US', { timeZone: 'UTC' })}.`,
                        });
                        emailSent = true;
                        console.log(`Email sent successfully for reminder ${reminder._id} to ${emailTo}`);
                        break;
                    } catch (error) {
                        console.error(`Email attempt ${attempt} failed for ${emailTo}: ${error.message}`);
                        if (attempt === 3) throw error;
                        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait before retry
                    }
                }
            } else {
                console.warn(`No email address found for reminder ${reminder._id}`);
            }
        }

        // Push notification with retry
        if (reminder.deliveryChannels.push && user.pushToken) {
            console.log(`Sending push notification for reminder ${reminder._id} to ${user.pushToken}`);
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    await sendPushNotification({
                        to: user.pushToken,
                        title: 'Reminder',
                        body: reminder.message,
                    });
                    pushSent = true;
                    console.log(`Push notification sent for reminder ${reminder._id}`);
                    break;
                } catch (error) {
                    console.error(`Push attempt ${attempt} failed for ${user.pushToken}: ${error.message}`);
                    if (attempt === 3) throw error;
                    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait before retry
                }
            }
        }

        // Update reminder status
        reminder.status = emailSent || pushSent || inAppSent ? 'sent' : 'pending';
        if (reminder.repeatInterval && reminder.isActive) {
            reminder.remindAt = new Date(reminder.remindAt.getTime() + reminder.repeatInterval * 60 * 1000);
            reminder.status = 'pending';
            console.log(`Rescheduling repeating reminder ${reminder._id} to ${reminder.remindAt.toISOString()}`);
        } else if (!reminder.repeatInterval) {
            reminder.isActive = false;
        }
        await reminder.save();
        console.log(`Reminder ${reminder._id} status updated to ${reminder.status}`);
        global.io.to(`user:${user._id}`).emit('reminderUpdated', reminder);
        return true;
    } catch (error) {
        console.error(`Error processing reminder ${reminder._id}:`, error.message, error.stack);
        reminder.status = 'pending'; // Keep pending to retry in next cycle
        await reminder.save();
        return false;
    }
};

// Run every 30 seconds for more frequent checks
const startReminderScheduler = () => {
    console.log('Starting reminder scheduler...');
    cron.schedule('*/30 * * * * *', async () => {
        console.log(`Running reminder scheduler at ${new Date().toISOString()}`);
        try {
            const now = new Date();
            const reminders = await Reminder.find({
                status: { $in: ['pending', 'snoozed'] },
                remindAt: { $lte: now },
                isActive: true,
            }).limit(100); // Prevent overload
            console.log(`Found ${reminders.length} reminders to process`);
            await Promise.all(
                reminders.map(async (reminder) => {
                    const success = await sendReminder(reminder);
                    console.log(`Reminder ${reminder._id} processed ${success ? 'successfully' : 'with errors'}`);
                })
            );
        } catch (error) {
            console.error('Reminder scheduler error:', error.message, error.stack);
        }
    });
};

export { startReminderScheduler, sendReminder };