const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/authMiddleware');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/ai/generate-description
router.post('/generate-description', protect, asyncHandler(async (req, res) => {
  const { prompt, title, category, condition, brand } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ message: 'Тайлбарлах зүйлийг оруулна уу' });
  }

  const contextLines = [
    title    && `Барааны нэр: ${title}`,
    category && `Ангилал: ${category}`,
    brand    && `Брэнд: ${brand}`,
    condition && `Байдал: ${condition}`,
  ].filter(Boolean).join('\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Та онлайн дуудлага худалдааны сайтад зарагч хүний бараа борлуулах тайлбар бичихэд туслаж байна.

Зарагч хэлсэн зүйл: "${prompt.trim()}"
${contextLines ? `\nНэмэлт мэдээлэл:\n${contextLines}` : ''}

Монгол хэл дээр бараагийн тайлбар бич. Тайлбар нь:
- Тодорхой, үнэн зөв байх
- Барааны онцлог шинж чанарыг дурдах
- Байдал, сул тал байвал шударгаар дурдах
- 3-5 өгүүлбэр байх
- Хэт албан ёсны бус, байгалийн хэлээр бичих

Зөвхөн тайлбарын текстийг буцаана уу, нэмэлт тайлбаргүйгээр.`
    }]
  });

  res.json({ description: message.content[0].text.trim() });
}));

module.exports = router;
