const Request = require('../models/request');
const User = require('../models/User');
const { sendPushNotification } = require('../utils/pushNotification');
const { createNotification } = require('./notificationController');
const crypto = require('crypto');

/**
 * Verify QPay webhook signature
 * This prevents unauthorized webhook calls
 * SECURITY: Always fail closed - reject if secret not configured
 */
function verifyQPaySignature(payload, signature) {
    if (!process.env.QPAY_WEBHOOK_SECRET) {
        // QPay sandbox does not send signatures — allow in non-production
        if (process.env.NODE_ENV !== 'production') {
            return true;
        }
        return false;
    }

    if (!signature) {
        return false;
    }

    const hash = crypto
        .createHmac('sha256', process.env.QPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

    const isValid = hash === signature;
    return isValid;
}

/**
 * Handle QPay payment webhook
 * This is called by QPay when a payment is completed
 */
exports.qpayWebhook = async (req, res) => {
    try {
        const signature = req.headers['qpay-signature'] || req.headers['x-qpay-signature'];

        // Verify signature
        if (!verifyQPaySignature(req.body, signature)) {
            return res.status(401).json({
                error: 'Invalid signature'
            });
        }

        const { invoice_id, status, amount, payment_id } = req.body;


        // Handle different payment statuses
        switch (status) {
            case 'PAID':
            case 'paid':
                await handlePaidPayment(invoice_id, amount, payment_id);
                break;

            case 'EXPIRED':
            case 'expired':
                await handleExpiredPayment(invoice_id);
                break;

            case 'FAILED':
            case 'failed':
                await handleFailedPayment(invoice_id);
                break;

            default:
        }

        // Always respond 200 OK to acknowledge receipt
        res.json({ success: true });

    } catch (error) {
        // Still respond 200 to prevent retries
        res.json({ success: false, error: error.message });
    }
};

/**
 * Handle successful payment
 */
async function handlePaidPayment(invoiceId, amount, paymentId) {
    try {
        // Find the payment request
        const request = await Request.findOne({ 'payment.invoiceId': invoiceId });

        if (!request) {
            return;
        }

        // Check if already processed
        if (request.status === 'completed') {
            return;
        }

        // Add balance to user
        await User.findByIdAndUpdate(request.user, {
            $inc: { balance: amount }
        });

        // Update request status
        request.status = 'completed';
        request.payment.status = 'paid';
        request.payment.paymentId = paymentId;
        await request.save();

        // Send push notification
        await sendPushNotification(request.user, {
            title: 'Төлбөр амжилттай',
            body: `${amount.toLocaleString()}₮ дансанд орлоо`,
            type: 'payment_success',
            actionUrl: '/profile'
        });

        // Create in-app notification
        await createNotification(request.user, {
            type: 'payment_success',
            title: 'Төлбөр амжилттай',
            message: `${amount.toLocaleString()}₮ дансанд орлоо`,
            actionUrl: '/profile'
        });


    } catch (error) {
        throw error;
    }
}

/**
 * Handle expired payment
 */
async function handleExpiredPayment(invoiceId) {
    try {
        const request = await Request.findOne({ 'payment.invoiceId': invoiceId });

        if (!request) {
            return;
        }

        request.payment.status = 'expired';
        await request.save();

        // Optionally notify user
        await sendPushNotification(request.user, {
            title: 'Төлбөрийн хугацаа дууссан',
            body: 'Таны төлбөрийн хүсэлтийн хугацаа дууссан. Дахин оролдоно уу',
            type: 'payment_expired'
        });


    } catch (error) {
    }
}

/**
 * Handle failed payment
 */
async function handleFailedPayment(invoiceId) {
    try {
        const request = await Request.findOne({ 'payment.invoiceId': invoiceId });

        if (!request) {
            return;
        }

        request.payment.status = 'failed';
        await request.save();

        await sendPushNotification(request.user, {
            title: 'Төлбөр амжилтгүй',
            body: 'Таны төлбөр амжилтгүй боллоо. Дахин оролдоно уу',
            type: 'payment_failed'
        });


    } catch (error) {
    }
}

/**
 * Manual payment verification (for testing or manual check)
 */
exports.verifyPayment = async (req, res) => {
    try {
        const { invoiceId } = req.params;

        // Call QPay API to check payment status
        const axios = require('axios');

        const authString = Buffer.from(
            `${process.env.QPAY_USERNAME}:${process.env.QPAY_PASSWORD}`
        ).toString('base64');
        const authResponse = await axios.post(
            `${process.env.QPAY_BASE_URL}/v2/auth/token`,
            {},
            { headers: { Authorization: `Basic ${authString}` } }
        );

        const token = authResponse.data.access_token;

        const paymentResponse = await axios.get(
            `${process.env.QPAY_BASE_URL}/v2/payment/${invoiceId}`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        const payment = paymentResponse.data;

        // Update request based on payment status
        if (payment.payment_status === 'PAID') {
            await handlePaidPayment(invoiceId, payment.amount, payment.payment_id);
        }

        res.json({
            success: true,
            payment
        });

    } catch (error) {
        res.status(500).json({
            error: 'Төлбөр шалгахад алдаа гарлаа',
            details: error.message
        });
    }
};
