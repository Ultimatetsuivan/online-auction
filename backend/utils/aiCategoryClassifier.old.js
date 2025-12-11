/**
 * AI Category Classifier
 * Uses product title and description to automatically suggest the best category
 */

const axios = require('axios');

/**
 * Simple rule-based classifier (works offline, no API needed)
 * For production, you can integrate with OpenAI GPT or Google Gemini
 */
class CategoryClassifier {
  constructor() {
    // Category keywords mapping with priority levels
    // Updated for Mongolian marketplace categories
    this.categoryKeywords = {
      'Vehicles & Parts': {
        // Strong indicators (high weight) - specific car brands and models
        strongKeywords: ['toyota', 'ford', 'honda', 'bmw', 'mercedes', 'audi', 'jeep', 'tesla',
                        'prius', 'camry', 'civic', 'accord', 'f150', 'silverado', 'tacoma', 'wrangler',
                        'mustang', 'corvette', 'porsche', 'ferrari', 'lamborghini', 'mileage', 'vin'],
        // Regular indicators (normal weight)
        keywords: ['car', 'truck', 'vehicle', 'auto', 'suv', 'sedan', 'van', 'camper', 'rv', 'motorhome',
                  'engine', 'transmission', 'tire', 'wheel', 'brake', 'motor', 'diesel', 'gasoline'],
        // Weak indicators (low weight) - could be accessories
        weakKeywords: ['holder', 'mount', 'charger'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      },
      'Electronics': {
        // Strong indicators - specific product names and brands
        strongKeywords: ['iphone', 'ipad', 'macbook', 'airpods', 'samsung galaxy', 'pixel', 'oneplus',
                        'playstation', 'xbox', 'nintendo switch', 'apple watch', 'galaxy watch',
                        'surface', 'chromebook', 'kindle'],
        // Regular indicators
        keywords: ['phone', 'laptop', 'computer', 'samsung', 'tablet', 'camera',
                  'tv', 'monitor', 'speaker', 'headphone', 'watch', 'smartwatch',
                  'gaming', 'console', 'nintendo', 'dell',
                  'hp', 'lenovo', 'asus', 'sony', 'lg', 'apple', 'android', 'ios', 'windows'],
        // Weak indicators
        weakKeywords: ['screen', 'battery', 'charger', 'cable'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      },
      'Fashion': {
        strongKeywords: ['nike', 'adidas', 'gucci', 'prada', 'louis vuitton', 'chanel', 'supreme',
                        'balenciaga', 'versace', 'armani'],
        keywords: ['shoes', 'sneakers', 'boots', 'dress', 'shirt', 'pants', 'jacket', 'coat',
                  'jeans', 'clothing', 'apparel', 'fashion', 'style', 'wear', 'outfit', 'designer',
                  'luxury', 'vintage', 'retro', 'streetwear', 'athletic'],
        weakKeywords: ['brand', 'new', 'used'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      },
      'Home & Garden': {
        strongKeywords: ['furniture', 'sofa', 'mattress', 'fridge', 'refrigerator', 'washing machine'],
        keywords: ['chair', 'table', 'bed', 'couch', 'desk', 'lamp', 'decor', 'kitchen',
                  'appliance', 'microwave', 'oven', 'garden', 'plant', 'outdoor', 'patio', 'lawn'],
        weakKeywords: ['tools', 'drill', 'saw'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      },
      'Toys & Hobbies': {
        strongKeywords: ['lego', 'barbie', 'hot wheels', 'nerf', 'pokemon card', 'magic the gathering'],
        keywords: ['toy', 'doll', 'action figure', 'puzzle', 'board game', 'kids',
                  'children', 'baby', 'educational', 'learning', 'hobby', 'collectible',
                  'trading card', 'pokemon', 'baseball card', 'basketball card', 'sports card'],
        weakKeywords: ['play', 'fun'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      },
      'Sports & Outdoors': {
        strongKeywords: ['treadmill', 'peloton', 'bowflex', 'schwinn', 'trek bike'],
        keywords: ['bike', 'bicycle', 'weights', 'gym', 'fitness', 'exercise',
                  'camping', 'tent', 'sleeping bag', 'hiking', 'fishing', 'rod', 'reel',
                  'golf', 'clubs', 'tennis', 'racket', 'basketball', 'football', 'soccer'],
        weakKeywords: ['outdoor', 'sport'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      },
      'Books & Media': {
        strongKeywords: ['hardcover', 'paperback', 'audiobook', 'blu-ray', 'vinyl record', 'first edition'],
        keywords: ['book', 'novel', 'textbook', 'magazine', 'comic', 'manga', 'dvd',
                  'cd', 'vinyl', 'record', 'music', 'album', 'movie', 'film', 'series'],
        weakKeywords: ['read', 'listen'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      },
      'Jewelry & Watches': {
        strongKeywords: ['rolex', 'omega', 'cartier', 'tiffany', 'patek philippe', 'diamond ring',
                        'engagement ring', 'wedding ring'],
        keywords: ['ring', 'necklace', 'bracelet', 'earrings', 'jewelry', 'gold', 'silver',
                  'diamond', 'watch', 'precious', 'gemstone', 'pearl', 'platinum'],
        weakKeywords: ['wedding', 'engagement'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      },
      'Art & Collectibles': {
        strongKeywords: ['original painting', 'limited edition', 'signed print', 'antique', 'picasso',
                        'warhol', 'banksy'],
        keywords: ['painting', 'artwork', 'sculpture', 'print', 'poster', 'vintage',
                  'collectible', 'rare', 'signed', 'numbered', 'art',
                  'canvas', 'frame', 'reproduction', 'gallery'],
        weakKeywords: ['old', 'classic'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      },
      'Musical Instruments': {
        strongKeywords: ['fender', 'gibson', 'yamaha piano', 'steinway', 'roland', 'marshall amp'],
        keywords: ['guitar', 'piano', 'keyboard', 'drums', 'violin', 'saxophone', 'trumpet',
                  'bass', 'acoustic', 'electric', 'amplifier', 'amp', 'pedal', 'effects',
                  'microphone', 'midi', 'synthesizer', 'ukulele', 'banjo'],
        weakKeywords: ['music', 'sound'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      }
    };
  }

  /**
   * Classify product into best matching category
   * @param {string} title - Product title
   * @param {string} description - Product description
   * @returns {Object} - { category, confidence, suggestions[] }
   */
  classify(title, description = '') {
    const text = `${title} ${description}`.toLowerCase();
    const titleText = title.toLowerCase(); // Check title separately for priority
    const scores = {};

    // Helper function to check if keyword matches with word boundaries
    const matchesKeyword = (text, keyword) => {
      const keywordLower = keyword.toLowerCase();

      // For multi-word keywords (e.g., "louis vuitton"), use simple includes
      if (keywordLower.includes(' ')) {
        return text.includes(keywordLower);
      }

      // For single-word keywords, use word boundary matching
      const regex = new RegExp(`\\b${keywordLower}\\b`, 'i');
      return regex.test(text);
    };

    // Calculate scores for each category
    for (const [category, data] of Object.entries(this.categoryKeywords)) {
      let score = 0;
      let matchedKeywords = [];

      // Check strong keywords (high priority - e.g., "iPhone", "Toyota")
      if (data.strongKeywords) {
        for (const keyword of data.strongKeywords) {
          if (matchesKeyword(text, keyword)) {
            // Give extra weight if strong keyword is in title
            const weight = matchesKeyword(titleText, keyword)
              ? data.strongWeight * 1.5
              : data.strongWeight;
            score += weight;
            matchedKeywords.push(keyword);
          }
        }
      }

      // Check regular keywords
      if (data.keywords) {
        for (const keyword of data.keywords) {
          if (matchesKeyword(text, keyword)) {
            score += data.weight;
            matchedKeywords.push(keyword);
          }
        }
      }

      // Check weak keywords (low priority - e.g., "charger", "holder")
      if (data.weakKeywords) {
        for (const keyword of data.weakKeywords) {
          if (matchesKeyword(text, keyword)) {
            score += data.weakWeight;
            matchedKeywords.push(keyword);
          }
        }
      }

      if (score > 0) {
        scores[category] = {
          score,
          matchedKeywords,
          confidence: Math.min((score / 60) * 100, 100) // Adjusted for new weight system
        };
      }
    }

    // Sort by score
    const sorted = Object.entries(scores)
      .sort(([, a], [, b]) => b.score - a.score);

    if (sorted.length === 0) {
      return {
        category: 'Other',
        confidence: 0,
        suggestions: [],
        reason: 'No matching keywords found'
      };
    }

    const [topCategory, topData] = sorted[0];
    const suggestions = sorted.slice(0, 3).map(([cat, data]) => ({
      category: cat,
      confidence: data.confidence,
      matchedKeywords: data.matchedKeywords
    }));

    return {
      category: topCategory,
      confidence: topData.confidence,
      suggestions,
      matchedKeywords: topData.matchedKeywords,
      reason: `Matched keywords: ${topData.matchedKeywords.slice(0, 3).join(', ')}`
    };
  }

  /**
   * Classify using OpenAI GPT (Optional - requires API key)
   * More accurate but requires paid API
   */
  async classifyWithAI(title, description = '') {
    // Check if OpenAI API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not found, falling back to rule-based classifier');
      return this.classify(title, description);
    }

    try {
      const prompt = `
You are a product categorization expert for an e-commerce platform.

Product Title: "${title}"
Product Description: "${description}"

Available Categories:
- Automotive (cars, trucks, vehicles, auto parts)
- Electronics (phones, computers, TVs, cameras)
- Fashion (clothing, shoes, accessories)
- Home & Garden (furniture, appliances, decor)
- Toys & Hobbies (kids toys, collectibles)
- Sports & Outdoors (fitness, camping, sports equipment)
- Books & Media (books, DVDs, music)
- Jewelry & Watches (rings, necklaces, luxury watches)
- Art & Collectibles (paintings, antiques, rare items)
- Musical Instruments (guitars, pianos, drums)
- Other (if none match)

Analyze the product and return ONLY a JSON object in this exact format:
{
  "category": "category name",
  "confidence": 0-100,
  "reason": "brief explanation"
}
`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a product classification expert. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 150
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = JSON.parse(response.data.choices[0].message.content);
      return {
        ...result,
        suggestions: [
          {
            category: result.category,
            confidence: result.confidence,
            reason: result.reason
          }
        ],
        method: 'AI (OpenAI GPT)'
      };
    } catch (error) {
      console.error('OpenAI API error:', error.message);
      // Fallback to rule-based
      return this.classify(title, description);
    }
  }

  /**
   * Get all available categories
   */
  getAvailableCategories() {
    return Object.keys(this.categoryKeywords);
  }
}

module.exports = new CategoryClassifier();
