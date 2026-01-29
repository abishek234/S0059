// utils/dailyReportScheduler.js - Cron job for daily reports
const cron = require('node-cron');
const Report = require('../models/Report');
const mailer = require('./mailer');

// Schedule task to run every day at 6:00 PM (18:00)
const scheduleDailyReports = () => {
    cron.schedule('0 18 * * *', async () => {
        try {
            console.log('Running daily reports summary job...');

            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            // Get all reports created today
            const todayReports = await Report.find({
                createdAt: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            })
            .populate('productId', 'name')
            .sort({ createdAt: -1 });

            // Only send email if there are reports
            if (todayReports.length > 0) {
                const reportsData = todayReports.map(report => ({
                    productName: report.productId?.name || 'Deleted Product',
                    reason: report.reason,
                    reporterEmail: report.reporterEmail,
                    createdAt: report.createdAt
                }));

                await mailer.sendDailyReportsSummary(
                    process.env.ADMIN_EMAIL,
                    reportsData
                );

                console.log(`Daily reports summary sent: ${todayReports.length} reports`);
            } else {
                console.log('No reports today, skipping email');
            }

        } catch (error) {
            console.error('Error in daily reports job:', error);
        }
    }, {
        timezone: "Asia/Kolkata" 
    });

    console.log('Daily reports scheduler initialized (runs at 6:00 PM)');
};

module.exports = { scheduleDailyReports };