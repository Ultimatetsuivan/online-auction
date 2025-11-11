const axios = require('axios');

/**
 * Send OTP via SMS
 * NOTE: You need to configure your SMS gateway credentials in .env
 *
 * For Mongolian providers:
 * - Unitel SMS Gateway: https://smsgw.unitel.mn
 * - Mobicom SMS API: Contact Mobicom for API access
 * - Skytel SMS: Contact Skytel for API access
 *
 * Environment variables needed:
 * - SMS_PROVIDER (unitel, mobicom, or skytel)
 * - SMS_USERNAME
 * - SMS_PASSWORD
 * - SMS_SENDER_ID (optional)
 */

async function sendOTP(phone, code) {
    const provider = process.env.SMS_PROVIDER || 'unitel';

    // Format phone number to international format
    const formattedPhone = phone.startsWith('976') ? phone : `976${phone}`;

    const message = `Таны баталгаажуулах код: ${code}. 3 минутын дотор хүчинтэй.`;

    try {
        switch (provider) {
            case 'unitel':
                return await sendViaUnitel(formattedPhone, message);

            case 'mobicom':
                return await sendViaMobicom(formattedPhone, message);

            case 'skytel':
                return await sendViaSkytel(formattedPhone, message);

            default:
                // Development mode: just log the OTP
                if (process.env.NODE_ENV === 'development') {
                    console.log(`[DEV MODE] OTP for ${phone}: ${code}`);
                    return { success: true, messageId: 'dev-mode' };
                }
                throw new Error(`Unsupported SMS provider: ${provider}`);
        }
    } catch (error) {
        console.error('Failed to send SMS:', error.message);

        // In development, don't fail
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEV MODE] OTP for ${phone}: ${code}`);
            return { success: true, messageId: 'dev-mode-fallback' };
        }

        throw error;
    }
}

async function sendViaUnitel(phone, message) {
    if (!process.env.SMS_USERNAME || !process.env.SMS_PASSWORD) {
        throw new Error('Unitel SMS credentials not configured');
    }

    const response = await axios.post('https://smsgw.unitel.mn/api/send', {
        username: process.env.SMS_USERNAME,
        password: process.env.SMS_PASSWORD,
        recipient: phone,
        message: message,
        sender: process.env.SMS_SENDER_ID || 'Auction'
    });

    return {
        success: response.data.success || true,
        messageId: response.data.messageId || response.data.id
    };
}

async function sendViaMobicom(phone, message) {
    if (!process.env.SMS_USERNAME || !process.env.SMS_PASSWORD) {
        throw new Error('Mobicom SMS credentials not configured');
    }

    // Mobicom API endpoint - update based on actual API documentation
    const response = await axios.post('https://api.mobicom.mn/sms/send', {
        username: process.env.SMS_USERNAME,
        password: process.env.SMS_PASSWORD,
        phone: phone,
        text: message
    });

    return {
        success: response.data.status === 'success',
        messageId: response.data.messageId
    };
}

async function sendViaSkytel(phone, message) {
    if (!process.env.SMS_USERNAME || !process.env.SMS_PASSWORD) {
        throw new Error('Skytel SMS credentials not configured');
    }

    // Skytel API endpoint - update based on actual API documentation
    const response = await axios.post('https://api.skytel.mn/sms/send', {
        username: process.env.SMS_USERNAME,
        password: process.env.SMS_PASSWORD,
        to: phone,
        message: message
    });

    return {
        success: response.data.success,
        messageId: response.data.id
    };
}

module.exports = {
    sendOTP
};
