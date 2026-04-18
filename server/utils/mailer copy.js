// utils/mailer.js - Complete notification system
const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;

async function configureTransporter() {
    transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    await transporter.verify()
        .then(() => {
            console.log("SMTP connection established successfully.");
        })
        .catch(err => {
            console.error("SMTP connection failed:", err);
        });
}

configureTransporter();

// Email Template Styles (matching dashboard design)
const emailStyles = `
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #212B36;
            background-color: #F4F6F8;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #FFFFFF;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 0 2px 0 rgba(145, 158, 171, 0.24), 0 16px 32px -4px rgba(145, 158, 171, 0.24);
        }
        .header {
            background-color: #2065D1;
            color: #FFFFFF;
            padding: 32px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .content {
            padding: 32px;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 16px;
        }
        .badge-warning {
            background-color: #FFF7CD;
            color: #7A4F01;
        }
        .badge-success {
            background-color: #D8FBDE;
            color: #0A5554;
        }
        .badge-error {
            background-color: #FFE7D9;
            color: #7A0C2E;
        }
        .badge-info {
            background-color: #D0F2FF;
            color: #04297A;
        }
        .info-box {
            background-color: #F4F6F8;
            border-left: 4px solid #2065D1;
            padding: 16px;
            margin: 24px 0;
            border-radius: 8px;
        }
        .info-box-warning {
            background-color: #FFF7CD;
            border-left-color: #FFAB00;
        }
        .info-box-success {
            background-color: #D8FBDE;
            border-left-color: #00AB55;
        }
        .info-box-error {
            background-color: #FFE7D9;
            border-left-color: #FF5630;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2065D1;
            color: #FFFFFF;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 16px 0;
        }
        .button:hover {
            background-color: #1939B7;
        }
        .footer {
            background-color: #F4F6F8;
            padding: 24px 32px;
            text-align: center;
            color: #637381;
            font-size: 14px;
        }
        .divider {
            border: 0;
            border-top: 1px solid #DFE3E8;
            margin: 24px 0;
        }
        h2 {
            color: #212B36;
            font-size: 20px;
            font-weight: 600;
            margin-top: 0;
        }
        p {
            color: #637381;
            margin: 16px 0;
        }
        .details {
            background-color: #F9FAFB;
            padding: 16px;
            border-radius: 8px;
            margin: 16px 0;
        }
        .details-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #DFE3E8;
        }
        .details-row:last-child {
            border-bottom: none;
        }
        .details-label {
            color: #637381;
            font-weight: 500;
        }
        .details-value {
            color: #212B36;
            font-weight: 600;
        }
    </style>
`;

module.exports = {
    // Existing OTP function
    sendOtp: async (email, otp) => {
        const mailOptions = {
            from: '"AI Upcycling Platform" <no-reply@upcycling.com>',
            to: email,
            subject: 'Your OTP Code',
            html: `
                ${emailStyles}
                <div class="container">
                    <div class="header">
                        <h1>🔐 Verification Code</h1>
                    </div>
                    <div class="content">
                        <h2>Your OTP Code</h2>
                        <p>Use the following code to verify your account:</p>
                        <div class="info-box">
                            <h1 style="text-align: center; font-size: 36px; letter-spacing: 8px; margin: 16px 0; color: #2065D1;">
                                ${otp}
                            </h1>
                        </div>
                        <p style="color: #FF5630; font-size: 14px;">
                            ⏱️ This code will expire in 10 minutes.
                        </p>
                        <p style="font-size: 14px;">
                            If you didn't request this code, please ignore this email.
                        </p>
                    </div>
                    <div class="footer">
                        <p>AI Upcycling Platform - Transforming Waste into Value</p>
                    </div>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
    },

    // 1. Product Submitted - Notify Admin
    notifyAdminProductSubmitted: async (adminEmail, productDetails, userDetails) => {
        const mailOptions = {
            from: '"AI Upcycling Platform" <no-reply@upcycling.com>',
            to: adminEmail,
            subject: '🔔 New Product Submitted for Review',
            html: `
                ${emailStyles}
                <div class="container">
                    <div class="header">
                        <h1>📦 New Product Submission</h1>
                    </div>
                    <div class="content">
                        <span class="badge badge-warning">Pending Review</span>
                        <h2>A new product has been submitted for verification</h2>
                        
                        <div class="details">
                            <div class="details-row">
                                <span class="details-label">Product Name:</span>
                                <span class="details-value">${productDetails.name}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Material:</span>
                                <span class="details-value">${productDetails.material}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Industry:</span>
                                <span class="details-value">${productDetails.industry}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Submitted At:</span>
                                <span class="details-value">${new Date(productDetails.createdAt).toLocaleString()}</span>
                            </div>
                        </div>

                        <hr class="divider">

                        <h3 style="color: #212B36; font-size: 16px;">User Information</h3>
                        <div class="details">
                            <div class="details-row">
                                <span class="details-label">Name:</span>
                                <span class="details-value">${userDetails.name}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Email:</span>
                                <span class="details-value">${userDetails.email}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Company:</span>
                                <span class="details-value">${userDetails.companyName || 'N/A'}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Verified:</span>
                                <span class="details-value">${userDetails.isVerified ? 'Yes ✅' : 'No ⏳'}</span>
                            </div>
                        </div>

                        <div class="info-box info-box-warning">
                            <p style="margin: 0;">
                                ⚠️ <strong>Action Required:</strong> Please review this product within 1-2 business days.
                            </p>
                        </div>

                        <a href="${process.env.FRONTEND_URL}/dashboard/products/${productDetails.id}/review" class="button">
                            Review Product →
                        </a>
                    </div>
                    <div class="footer">
                        <p>AI Upcycling Platform - Admin Dashboard</p>
                    </div>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
    },

    // 2. Product Approved - Notify User
    notifyUserProductApproved: async (userEmail, productDetails, userVerified) => {
        const mailOptions = {
            from: '"AI Upcycling Platform" <no-reply@upcycling.com>',
            to: userEmail,
            subject: '🎉 Your Product Has Been Approved!',
            html: `
                ${emailStyles}
                <div class="container">
                    <div class="header">
                        <h1>🎉 Congratulations!</h1>
                    </div>
                    <div class="content">
                        <span class="badge badge-success">Approved</span>
                        <h2>Your product is now live on the marketplace!</h2>
                        
                        <p>Great news! Your product <strong>${productDetails.name}</strong> has been approved by our admin team and is now visible to all users.</p>

                        ${userVerified ? `
                            <div class="info-box info-box-success">
                                <p style="margin: 0;">
                                    ✅ <strong>Your Account is Now Verified!</strong><br>
                                    As this is your first approved product, your account has been automatically verified. You can now enjoy full platform access.
                                </p>
                            </div>
                        ` : ''}

                        <div class="details">
                            <div class="details-row">
                                <span class="details-label">Product Name:</span>
                                <span class="details-value">${productDetails.name}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Material:</span>
                                <span class="details-value">${productDetails.material}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Status:</span>
                                <span class="details-value">Live on Marketplace ✅</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Approved On:</span>
                                <span class="details-value">${new Date(productDetails.publishedAt).toLocaleString()}</span>
                            </div>
                        </div>

                        <a href="${process.env.FRONTEND_URL}/dashboard/history" class="button">
                            View Your Products →
                        </a>

                        <hr class="divider">

                        <h3 style="color: #212B36; font-size: 16px;">What's Next?</h3>
                        <ul style="color: #637381;">
                            <li>Your product is now visible in the public marketplace</li>
                            <li>Track views and engagement in your dashboard</li>
                            <li>Submit more innovative upcycling ideas</li>
                            <li>Build your portfolio of sustainable products</li>
                        </ul>
                    </div>
                    <div class="footer">
                        <p>AI Upcycling Platform - Transforming Waste into Value</p>
                    </div>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
    },

    // 3. Product Rejected - Notify User
    notifyUserProductRejected: async (userEmail, productDetails, rejectionReason) => {
        const mailOptions = {
            from: '"AI Upcycling Platform" <no-reply@upcycling.com>',
            to: userEmail,
            subject: '📋 Product Review Update',
            html: `
                ${emailStyles}
                <div class="container">
                    <div class="header">
                        <h1>📋 Product Review Update</h1>
                    </div>
                    <div class="content">
                        <span class="badge badge-error">Not Approved</span>
                        <h2>Your product submission needs revision</h2>
                        
                        <p>Thank you for submitting <strong>${productDetails.name}</strong>. After careful review, we're unable to approve it at this time.</p>

                        <div class="info-box info-box-error">
                            <h3 style="margin-top: 0; color: #B71D18;">Reason for Rejection:</h3>
                            <p style="margin: 8px 0 0 0; color: #212B36;">
                                ${rejectionReason}
                            </p>
                        </div>

                        <div class="details">
                            <div class="details-row">
                                <span class="details-label">Product Name:</span>
                                <span class="details-value">${productDetails.name}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Material:</span>
                                <span class="details-value">${productDetails.material}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Reviewed On:</span>
                                <span class="details-value">${new Date(productDetails.reviewedAt).toLocaleString()}</span>
                            </div>
                        </div>

                        <hr class="divider">

                        <h3 style="color: #212B36; font-size: 16px;">What Can You Do?</h3>
                        <ul style="color: #637381;">
                            <li>Review the feedback carefully</li>
                            <li>Delete this submission and submit a new, improved version</li>
                            <li>Or submit a different product idea</li>
                            <li>Contact us at <strong>admin@upcycling.com</strong> if you have questions</li>
                        </ul>

                        <a href="${process.env.FRONTEND_URL}/dashboard/history" class="button">
                            View Your Submissions →
                        </a>
                    </div>
                    <div class="footer">
                        <p>AI Upcycling Platform - We're here to help you succeed</p>
                    </div>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
    },

    // 4. Product Deactivated - Notify User
    notifyUserProductDeactivated: async (userEmail, productDetails, deactivationReason) => {
        const mailOptions = {
            from: '"AI Upcycling Platform" <no-reply@upcycling.com>',
            to: userEmail,
            subject: '⚠️ Product Deactivated',
            html: `
                ${emailStyles}
                <div class="container">
                    <div class="header" style="background-color: #FF5630;">
                        <h1>⚠️ Product Deactivated</h1>
                    </div>
                    <div class="content">
                        <span class="badge badge-error">Deactivated</span>
                        <h2>Your product has been removed from the marketplace</h2>
                        
                        <p>Your product <strong>${productDetails.name}</strong> has been deactivated and is no longer visible on the public marketplace.</p>

                        <div class="info-box info-box-error">
                            <h3 style="margin-top: 0; color: #B71D18;">Reason for Deactivation:</h3>
                            <p style="margin: 8px 0 0 0; color: #212B36;">
                                ${deactivationReason}
                            </p>
                        </div>

                        <div class="details">
                            <div class="details-row">
                                <span class="details-label">Product Name:</span>
                                <span class="details-value">${productDetails.name}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Material:</span>
                                <span class="details-value">${productDetails.material}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Deactivated On:</span>
                                <span class="details-value">${new Date().toLocaleString()}</span>
                            </div>
                        </div>

                        <hr class="divider">

                        <h3 style="color: #212B36; font-size: 16px;">Need Help?</h3>
                        <p>If you believe this was done in error or would like to discuss reactivation, please contact our admin team:</p>
                        <p><strong>Email:</strong> admin@upcycling.com</p>
                    </div>
                    <div class="footer">
                        <p>AI Upcycling Platform - Support Team</p>
                    </div>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
    },

    // 5. User Suspended - Notify User
    notifyUserSuspended: async (userEmail, userDetails, suspensionReason) => {
        const mailOptions = {
            from: '"AI Upcycling Platform" <no-reply@upcycling.com>',
            to: userEmail,
            subject: '🚫 Account Suspended',
            html: `
                ${emailStyles}
                <div class="container">
                    <div class="header" style="background-color: #FF5630;">
                        <h1>🚫 Account Suspended</h1>
                    </div>
                    <div class="content">
                        <span class="badge badge-error">Suspended</span>
                        <h2>Your account has been suspended</h2>
                        
                        <p>Dear ${userDetails.name},</p>
                        <p>Your account has been temporarily suspended. During this time, your approved products have been deactivated and are not visible on the marketplace.</p>

                        <div class="info-box info-box-error">
                            <h3 style="margin-top: 0; color: #B71D18;">Reason for Suspension:</h3>
                            <p style="margin: 8px 0 0 0; color: #212B36;">
                                ${suspensionReason}
                            </p>
                        </div>

                        <div class="details">
                            <div class="details-row">
                                <span class="details-label">Account:</span>
                                <span class="details-value">${userDetails.email}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Suspended On:</span>
                                <span class="details-value">${new Date().toLocaleString()}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Status:</span>
                                <span class="details-value">Suspended</span>
                            </div>
                        </div>

                        <hr class="divider">

                        <h3 style="color: #212B36; font-size: 16px;">What This Means:</h3>
                        <ul style="color: #637381;">
                            <li>Your access to the platform has been restricted</li>
                            <li>All approved products are temporarily hidden</li>
                            <li>You cannot submit new products during suspension</li>
                        </ul>

                        <h3 style="color: #212B36; font-size: 16px;">How to Resolve:</h3>
                        <p>Please contact our admin team to discuss your account status and potential reactivation:</p>
                        <p><strong>Email:</strong> admin@upcycling.com</p>
                    </div>
                    <div class="footer">
                        <p>AI Upcycling Platform - Compliance Team</p>
                    </div>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
    },



    // 6. User Reactivated - Notify User
    notifyUserReactivated: async (userEmail, userDetails, productsReactivated = 0) => {
        const mailOptions = {
            from: '"AI Upcycling Platform" <no-reply@upcycling.com>',
            to: userEmail,
            subject: '✅ Account Reactivated',
            html: `
            ${emailStyles}
            <div class="container">
                <div class="header" style="background-color: #00AB55;">
                    <h1>✅ Welcome Back!</h1>
                </div>
                <div class="content">
                    <span class="badge badge-success">Account Active</span>
                    <h2>Your account has been reactivated</h2>
                    
                    <p>Dear ${userDetails.name},</p>
                    <p>Good news! Your account has been reactivated and you now have full access to the platform.</p>

                    <div class="info-box info-box-success">
                        <p style="margin: 0;">
                            ✅ <strong>You can now:</strong><br>
                            • Access your dashboard<br>
                            • Submit new products for verification<br>
                            • View your previously approved products
                            ${productsReactivated > 0 ? `<br>• <strong>${productsReactivated} product(s) have been reactivated</strong>` : ''}
                        </p>
                    </div>

                    <div class="details">
                        <div class="details-row">
                            <span class="details-label">Account:</span>
                            <span class="details-value">${userDetails.email}</span>
                        </div>
                        <div class="details-row">
                            <span class="details-label">Reactivated On:</span>
                            <span class="details-value">${new Date().toLocaleString()}</span>
                        </div>
                        <div class="details-row">
                            <span class="details-label">Status:</span>
                            <span class="details-value">Active ✅</span>
                        </div>
                        ${productsReactivated > 0 ? `
                        <div class="details-row">
                            <span class="details-label">Products Reactivated:</span>
                            <span class="details-value">${productsReactivated}</span>
                        </div>
                        ` : ''}
                    </div>

                    <a href="${process.env.FRONTEND_URL}/dashboard/app" class="button">
                        Go to Dashboard →
                    </a>

                    <hr class="divider">

                    <p style="font-size: 14px; color: #637381;">
                        Thank you for your cooperation. We're excited to see your continued contributions to sustainable innovation!
                    </p>
                </div>
                <div class="footer">
                    <p>AI Upcycling Platform - Support Team</p>
                </div>
            </div>
        `
        };
        await transporter.sendMail(mailOptions);
    },
    // 7. Product Reactivated - Notify User
    notifyUserProductReactivated: async (userEmail, productDetails) => {
        const mailOptions = {
            from: '"AI Upcycling Platform" <no-reply@upcycling.com>',
            to: userEmail,
            subject: '✅ Product Reactivated',
            html: `
            ${emailStyles}
            <div class="container">
                <div class="header" style="background-color: #00AB55;">
                    <h1>✅ Product Reactivated</h1>
                </div>
                <div class="content">
                    <span class="badge badge-success">Active</span>
                    <h2>Your product is back on the marketplace!</h2>
                    
                    <p>Good news! Your product <strong>${productDetails.name}</strong> has been reactivated and is now visible on the marketplace again.</p>

                    <div class="info-box info-box-success">
                        <p style="margin: 0;">
                            ✅ <strong>Your product is now:</strong><br>
                            • Live on the public marketplace<br>
                            • Visible to all users<br>
                            • Available for engagement
                        </p>
                    </div>

                    <div class="details">
                        <div class="details-row">
                            <span class="details-label">Product Name:</span>
                            <span class="details-value">${productDetails.name}</span>
                        </div>
                        <div class="details-row">
                            <span class="details-label">Material:</span>
                            <span class="details-value">${productDetails.material}</span>
                        </div>
                        <div class="details-row">
                            <span class="details-label">Status:</span>
                            <span class="details-value">Live ✅</span>
                        </div>
                        <div class="details-row">
                            <span class="details-label">Reactivated On:</span>
                            <span class="details-value">${new Date().toLocaleString()}</span>
                        </div>
                    </div>

                    <a href="${process.env.FRONTEND_URL}/dashboard/history" class="button">
                        View Your Products →
                    </a>

                    <hr class="divider">

                    <p style="font-size: 14px; color: #637381;">
                        Thank you for your patience. Continue contributing to sustainable innovation!
                    </p>
                </div>
                <div class="footer">
                    <p>AI Upcycling Platform - Support Team</p>
                </div>
            </div>
        `
        };
        await transporter.sendMail(mailOptions);
    },

    // 8. Product Deactivated Due to Report - Notify Product Owner
notifyUserProductDeactivatedFromReport: async (userEmail, productDetails, reportDetails) => {
    const mailOptions = {
        from: '"AI Upcycling Platform" <no-reply@upcycling.com>',
        to: userEmail,
        subject: '⚠️ Product Deactivated - Policy Violation',
        html: `
            ${emailStyles}
            <div class="container">
                <div class="header" style="background-color: #FF5630;">
                    <h1>⚠️ Product Deactivated</h1>
                </div>
                <div class="content">
                    <span class="badge badge-error">Policy Violation</span>
                    <h2>Your product has been removed from the marketplace</h2>
                    
                    <p>We're writing to inform you that your product <strong>${productDetails.name}</strong> has been deactivated following our review of concerns raised about this listing.</p>

                    <div class="info-box info-box-error">
                        <h3 style="margin-top: 0; color: #B71D18;">Violation Details:</h3>
                        <p style="margin: 8px 0; color: #212B36;">
                            <strong>Category:</strong> ${reportDetails.reason}<br>
                            <strong>Action Taken:</strong> Product deactivated and removed from marketplace<br>
                            <strong>Review Status:</strong> Completed by moderation team
                        </p>
                    </div>

                    <div class="details">
                        <div class="details-row">
                            <span class="details-label">Product Name:</span>
                            <span class="details-value">${productDetails.name}</span>
                        </div>
                        <div class="details-row">
                            <span class="details-label">Material:</span>
                            <span class="details-value">${productDetails.material}</span>
                        </div>
                        <div class="details-row">
                            <span class="details-label">Current Status:</span>
                            <span class="details-value">Deactivated</span>
                        </div>
                        <div class="details-row">
                            <span class="details-label">Deactivated On:</span>
                            <span class="details-value">${new Date().toLocaleString()}</span>
                        </div>
                    </div>

                    <hr class="divider">

                    <h3 style="color: #212B36; font-size: 16px;">What This Means:</h3>
                    <ul style="color: #637381;">
                        <li>Your product is no longer visible on our marketplace</li>
                        <li>The listing has been flagged for not meeting our community standards</li>
                        <li>This decision was made after thorough review by our moderation team</li>
                        <li>Multiple factors were considered in this determination</li>
                    </ul>

                    <h3 style="color: #212B36; font-size: 16px;">Understanding Our Decision:</h3>
                    <p style="color: #637381;">
                        Our platform maintains strict quality and safety standards to ensure a trustworthy marketplace 
                        for all users. Products are reviewed based on our community guidelines, accuracy of information, 
                        safety considerations, and compliance with applicable regulations.
                    </p>

                    <h3 style="color: #212B36; font-size: 16px;">Appeal Process:</h3>
                    <p style="color: #637381;">
                        If you believe this deactivation was made in error or you have additional information 
                        that should be considered, you may submit an appeal. Our team reviews all appeals 
                        within 3-5 business days.
                    </p>

                    <div class="info-box">
                        <p style="margin: 0;">
                            <strong>Need to Appeal or Have Questions?</strong><br>
                            Email: <strong>support@upcycling.com</strong><br>
                            Subject: Product Appeal - ${productDetails.name}<br>
                            Reference ID: #${Math.random().toString(36).substr(2, 9).toUpperCase()}
                        </p>
                    </div>

                    <hr class="divider">

                    <h3 style="color: #212B36; font-size: 16px;">Moving Forward:</h3>
                    <p style="color: #637381;">
                        We encourage you to review our <strong>Community Guidelines</strong> and <strong>Product Standards</strong> 
                        to ensure future submissions meet our requirements. We're committed to supporting legitimate 
                        upcycling innovations that benefit our community and the environment.
                    </p>

                    <p style="font-size: 14px; color: #637381; margin-top: 24px;">
                        <strong>Resources:</strong><br>
                        • Community Guidelines: <a href="${process.env.FRONTEND_URL}/guidelines" style="color: #2065D1;">View Guidelines</a><br>
                        • Product Standards: <a href="${process.env.FRONTEND_URL}/standards" style="color: #2065D1;">View Standards</a><br>
                        • Help Center: <a href="${process.env.FRONTEND_URL}/help" style="color: #2065D1;">Get Support</a>
                    </p>
                </div>
                <div class="footer">
                    <p>AI Upcycling Platform - Trust & Safety Team</p>
                    <p style="font-size: 12px; margin-top: 8px; color: #919EAB;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            </div>
        `
    };
    await transporter.sendMail(mailOptions);
},


    // 9. Daily Reports Summary - Notify Admin
    sendDailyReportsSummary: async (adminEmail, reportsData) => {
        // Only send if there are reports
        if (!reportsData || reportsData.length === 0) {
            return; // Don't send email if no reports
        }

        const reportRows = reportsData.map(report => `
            <tr style="border-bottom: 1px solid #DFE3E8;">
                <td style="padding: 12px; color: #212B36;">${report.productName}</td>
                <td style="padding: 12px; color: #637381;">${report.reason}</td>
                <td style="padding: 12px; color: #637381;">${report.reporterEmail}</td>
                <td style="padding: 12px; color: #637381;">${new Date(report.createdAt).toLocaleTimeString()}</td>
            </tr>
        `).join('');

        const mailOptions = {
            from: '"AI Upcycling Platform" <no-reply@upcycling.com>',
            to: adminEmail,
            subject: `📊 Daily Reports Summary - ${reportsData.length} New Report(s)`,
            html: `
                ${emailStyles}
                <div class="container">
                    <div class="header">
                        <h1>📊 Daily Reports Summary</h1>
                    </div>
                    <div class="content">
                        <span class="badge badge-warning">${reportsData.length} New Report(s)</span>
                        <h2>Reports received today</h2>
                        
                        <p>Here's a summary of all product reports received today that require your attention.</p>

                        <div class="info-box info-box-warning">
                            <p style="margin: 0;">
                                ⚠️ <strong>${reportsData.length} pending report(s)</strong> waiting for review
                            </p>
                        </div>

                        <div style="overflow-x: auto; margin: 24px 0;">
                            <table style="width: 100%; border-collapse: collapse; background-color: #F9FAFB; border-radius: 8px; overflow: hidden;">
                                <thead>
                                    <tr style="background-color: #DFE3E8;">
                                        <th style="padding: 12px; text-align: left; color: #212B36; font-weight: 600;">Product</th>
                                        <th style="padding: 12px; text-align: left; color: #212B36; font-weight: 600;">Reason</th>
                                        <th style="padding: 12px; text-align: left; color: #212B36; font-weight: 600;">Reporter</th>
                                        <th style="padding: 12px; text-align: left; color: #212B36; font-weight: 600;">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${reportRows}
                                </tbody>
                            </table>
                        </div>

                        <a href="${process.env.FRONTEND_URL}/dashboard/reports" class="button">
                            Review All Reports →
                        </a>

                        <hr class="divider">

                        <p style="font-size: 14px; color: #637381;">
                            This is an automated daily summary sent at 6:00 PM. You only receive this email when there are new reports.
                        </p>
                    </div>
                    <div class="footer">
                        <p>AI Upcycling Platform - Admin Dashboard</p>
                        <p style="font-size: 12px; margin-top: 8px;">
                            Date: ${new Date().toLocaleDateString()} | Time: ${new Date().toLocaleTimeString()}
                        </p>
                    </div>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
    }
};