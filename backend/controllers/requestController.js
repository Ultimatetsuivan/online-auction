const asyncHandler = require("express-async-handler");
const Request = require("../models/request");
const User = require("../models/User");
const axios = require('axios');

// Cache QPay access token to avoid re-authenticating on every request
let _cachedToken = null;
let _tokenExpiresAt = null;

const getQPayToken = async () => {
  if (_cachedToken && _tokenExpiresAt && Date.now() < _tokenExpiresAt - 60_000) {
    return _cachedToken;
  }

  const authString = Buffer.from(
    `${process.env.QPAY_USERNAME}:${process.env.QPAY_PASSWORD}`
  ).toString('base64');

  const response = await axios.post(
    `${process.env.QPAY_BASE_URL}/v2/auth/token`,
    {},
    {
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }
  );

  const { access_token, expires_in } = response.data;
  if (!access_token) throw new Error('QPay токен хүлээж авсангүй');

  _cachedToken = access_token;
  // QPay returns expires_in as a Unix timestamp (seconds), not a duration
  _tokenExpiresAt = expires_in > 1_000_000_000
    ? expires_in * 1000
    : Date.now() + (expires_in || 3600) * 1000;
  return _cachedToken;
};

const createQPayInvoice = async (requestId, amount) => {
  const token = await getQPayToken();

  const invoiceData = {
    invoice_code: process.env.QPAY_INVOICE_CODE,
    sender_invoice_no: `BN_${requestId}`,
    invoice_receiver_code: "terminal",
    invoice_description: "BidNomad дансны цэнэглэлт",
    amount: amount,
    lines: [
      {
        line_description: "Дансны цэнэглэлт",
        line_quantity: "1.00",
        line_unit_price: amount.toFixed(2)
      }
    ]
  };

  try {
    const response = await axios.post(
      `${process.env.QPAY_BASE_URL}/v2/invoice`,
      invoiceData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    return response.data;
  } catch (error) {
    // Token may be stale — clear cache and let retry happen at controller level
    _cachedToken = null;
    _tokenExpiresAt = null;
    const msg = error.response?.data?.message || error.message;
    console.error('QPay invoice creation error:', error.response?.data || error.message);
    throw new Error('QPay нэхэмжлэл үүсгэхэд алдаа: ' + msg);
  }
};

// Check payment status directly from QPay (used for polling)
const checkQPayStatus = async (invoiceId) => {
  try {
    const token = await getQPayToken();
    const { data } = await axios.get(
      `${process.env.QPAY_BASE_URL}/v2/payment/check`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { object_type: 'INVOICE', object_id: invoiceId },
        timeout: 8000
      }
    );
    // QPay returns { count: N, paid_amount: X, ... } — count > 0 means paid
    return data?.count > 0;
  } catch (err) {
    console.error('QPay status check error:', err.message);
    return false;
  }
};

// POST /api/request — create QPay invoice and return QR data to client
const addRequest = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);

  if (!amount || amount < 5000) {
    res.status(400);
    throw new Error('Доод дүн 5,000₮ байна');
  }

  const newRequest = await Request.create({
    user: req.user.id,
    amount,
    status: 'pending'
  });

  try {
    const invoice = await createQPayInvoice(newRequest._id.toString(), amount);

    newRequest.payment = {
      invoiceId: invoice.invoice_id,
      qrText: invoice.qr_text,
      qrImage: invoice.qr_image,
      urls: invoice.urls || [],
      status: 'pending'
    };
    await newRequest.save();

    res.status(201).json({
      _id: newRequest._id,
      amount: newRequest.amount,
      status: newRequest.status,
      payment: {
        invoiceId: invoice.invoice_id,
        qrText: invoice.qr_text,
        qrImage: invoice.qr_image,
        urls: invoice.urls || []
      }
    });
  } catch (error) {
    await Request.findByIdAndDelete(newRequest._id);
    res.status(502);
    throw new Error(error.message);
  }
});

// GET /api/request/:id — poll payment status; credits balance if now paid
const getRequest = asyncHandler(async (req, res) => {
  const request = await Request.findOne({ _id: req.params.id, user: req.user.id });

  if (!request) {
    res.status(404);
    throw new Error('Хүсэлт олдсонгүй');
  }

  // If still pending, ask QPay for current status
  if (request.payment?.invoiceId && request.status === 'pending') {
    const paid = await checkQPayStatus(request.payment.invoiceId);
    if (paid) {
      await User.findByIdAndUpdate(request.user, {
        $inc: { balance: request.amount }
      });
      request.status = 'completed';
      request.payment.status = 'paid';
      await request.save();
    }
  }

  res.json({
    _id: request._id,
    amount: request.amount,
    status: request.status,
    paymentStatus: request.payment?.status || 'pending',
    createdAt: request.createdAt
  });
});

// GET /api/request/my — current user's top-up history
const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await Request.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(30)
    .select('amount status payment.status createdAt');

  res.json(requests);
});

// GET /api/request — admin: all requests
const getRequests = asyncHandler(async (req, res) => {
  const requests = await Request.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  res.status(200).json(requests);
});

// DELETE /api/request/:id
const deleteRequest = asyncHandler(async (req, res) => {
  const deletedRequest = await Request.findByIdAndDelete(req.params.id)
    .populate('user', 'name email');

  if (!deletedRequest) {
    res.status(404);
    throw new Error('Хүсэлт олдсонгүй');
  }

  res.status(200).json({ message: 'Устгагдлаа', deletedRequest });
});

module.exports = { getRequests, getMyRequests, addRequest, getRequest, deleteRequest };
