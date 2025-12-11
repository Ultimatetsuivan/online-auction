/**
 * AI Category Classifier - Mongolian Marketplace Edition
 * Tailored for Mongolian user behaviors and categories
 */

const axios = require('axios');

class CategoryClassifier {
  constructor() {
    // Category keywords mapping with priority levels
    // Matches the new Mongolian category structure
    this.categoryKeywords = {
      // A. Home & Living (Гэр ахуй)
      'Home & Living': {
        strongKeywords: ['furniture', 'sofa', 'bed', 'table', 'chair', 'cabinet', 'wardrobe', 'mattress',
                        'refrigerator', 'fridge', 'washing machine', 'vacuum', 'microwave', 'oven',
                        'ор', 'ширээ', 'сандал', 'шкаф', 'тавилга', 'индукц', 'зуух', 'тоос сорогч'],
        keywords: ['home', 'living', 'house', 'decor', 'kitchen', 'dining', 'garden', 'tools',
                  'appliance', 'decoration', 'гэр', 'ахуй', 'тогоо', 'цэцэрлэг'],
        weakKeywords: ['room', 'wall', 'floor'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      },

      // B. Clothing & Fashion (Хувцас загвар)
      'Clothing & Fashion': {
        strongKeywords: ['nike', 'adidas', 'gucci', 'prada', 'zara', 'h&m', 'uniqlo',
                        'dress', 'jeans', 'jacket', 'shoes', 'sneakers', 'boots',
                        'хувцас', 'гутал', 'цүнх'],
        keywords: ['clothing', 'fashion', 'shirt', 'pants', 'skirt', 'coat', 'bag', 'purse',
                  'men', 'women', 'kids', 'baby', 'accessories',
                  'эрэгтэй', 'эмэгтэй', 'хүүхэд', 'загвар'],
        weakKeywords: ['wear', 'style', 'outfit'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      },

      // C. Electronics & IT (Электроникс, IT)
      'Electronics & IT': {
        strongKeywords: ['iphone', 'samsung', 'xiaomi', 'huawei', 'oppo', 'vivo',
                        'macbook', 'laptop', 'ipad', 'tablet', 'computer', 'pc',
                        'playstation', 'xbox', 'nintendo', 'gaming',
                        'camera', 'canon', 'nikon', 'sony',
                        'утас', 'компьютер', 'ноутбук', 'планшет'],
        keywords: ['phone', 'mobile', 'smartphone', 'electronic', 'technology',
                  'tv', 'television', 'monitor', 'screen', 'audio', 'speaker',
                  'headphone', 'earphone', 'keyboard', 'mouse',
                  'электроник', 'технологи', 'телевиз'],
        weakKeywords: ['digital', 'smart', 'wireless'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      },

      // D. Kids & Baby (Хүүхэд, нялх хүүхэд)
      'Kids & Baby': {
        strongKeywords: ['baby stroller', 'car seat', 'crib', 'baby gear', 'диaper',
                        'baby bottle', 'pacifier', 'lego', 'barbie', 'toy car',
                        'тэрэг', 'суудал', 'нялх', 'хүүхдийн'],
        keywords: ['baby', 'infant', 'toddler', 'kids', 'children', 'toy', 'toys',
                  'learning', 'educational', 'playground',
                  'хүүхэд', 'тоглоом', 'сургалт'],
        weakKeywords: ['child', 'young', 'little'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      },

      // E. Vehicles & Parts (Тээврийн хэрэгсэл) - PARENT CATEGORY
      'Vehicles & Parts': {
        strongKeywords: [],  // No direct keywords - uses subcategory logic
        keywords: ['vehicle', 'transport', 'тээвэр'],
        weakKeywords: ['motor', 'driving', 'road'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3,
        // Subcategories with specific detection
        subcategories: {
          'Cars': {
            strongKeywords: ['toyota', 'ford', 'honda', 'hyundai', 'kia', 'nissan', 'mazda',
                            'chevrolet', 'bmw', 'mercedes', 'audi', 'volkswagen', 'lexus',
                            'prius', 'camry', 'corolla', 'civic', 'accord', 'santa fe', 'tucson',
                            'vin', 'mileage km', 'sedan', 'suv', 'truck', 'pickup',
                            'автомашин', 'машин зарна'],
            keywords: ['car', 'vehicle', 'auto', 'coupe', 'hatchback', 'wagon',
                      '4x4', 'awd', 'fwd', 'rwd', 'automatic', 'manual'],
            strongWeight: 40,
            weight: 15
          },
          'Car Parts': {
            strongKeywords: ['engine part', 'transmission part', 'brake pad', 'brake pads', 'air filter',
                            'oil filter', 'spark plug', 'alternator', 'starter motor',
                            'radiator', 'exhaust', 'muffler', 'catalytic converter',
                            'suspension', 'shock absorber', 'strut', 'control arm',
                            'brake', 'brakes', 'clutch', 'timing belt', 'serpentine belt',
                            'эд ангиуд', 'сэлбэг', 'тоормос'],
            keywords: ['parts', 'spare', 'replacement', 'component', 'oem', 'aftermarket',
                      'tire', 'tires', 'wheel', 'wheels', 'battery', 'bumper', 'door', 'hood', 'fender',
                      'headlight', 'taillight', 'mirror', 'seat', 'steering wheel',
                      'windshield', 'wiper', 'belt', 'hose', 'gasket',
                      'дугуй', 'батерей', 'угаалга'],
            strongWeight: 50,  // Increased weight to beat "Cars" category
            weight: 20
          },
          'Car Accessories': {
            strongKeywords: ['car seat cover', 'floor mat', 'car charger', 'phone holder',
                            'dash cam', 'car audio', 'subwoofer', 'amplifier',
                            'roof rack', 'bike rack', 'cargo carrier',
                            'дагалдах хэрэгсэл'],
            keywords: ['accessory', 'accessories', 'decoration', 'organizer',
                      'air freshener', 'sun shade', 'steering wheel cover'],
            strongWeight: 40,
            weight: 15
          },
          'Motorcycles': {
            strongKeywords: ['motorcycle', 'motorbike', 'harley', 'yamaha', 'kawasaki',
                            'suzuki', 'honda bike', 'ducati', 'triumph',
                            'мотоцикл', 'мотор'],
            keywords: ['bike', 'scooter', 'moped', 'dirt bike', 'cruiser', 'sport bike',
                      'cc engine', '125cc', '250cc', '500cc'],
            strongWeight: 40,
            weight: 15
          },
          'Bicycle & Scooters': {
            strongKeywords: ['bicycle', 'mountain bike', 'road bike', 'bmx',
                            'electric scooter', 'kick scooter',
                            'дугуй', 'скүүтер'],
            keywords: ['bike', 'cycling', 'pedal', 'gear shift', 'hybrid bike'],
            strongWeight: 40,
            weight: 15
          }
        }
      },

      // F. Beauty & Personal Care (Гоо сайхан)
      'Beauty & Personal Care': {
        strongKeywords: ['skincare', 'lotion', 'cream', 'serum', 'moisturizer',
                        'lipstick', 'foundation', 'mascara', 'eyeshadow',
                        'shampoo', 'conditioner', 'perfume', 'cologne',
                        'арьс', 'будалт', 'үнэртэн', 'шампунь'],
        keywords: ['beauty', 'makeup', 'cosmetics', 'hair', 'skin', 'face',
                  'personal care', 'hygiene', 'grooming',
                  'гоо', 'сайхан', 'нүүр', 'үс'],
        weakKeywords: ['care', 'treatment', 'product'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      },

      // G. Pets & Supplies (Гэрийн тэжээвэр амьтан)
      'Pets & Supplies': {
        strongKeywords: ['dog', 'puppy', 'cat', 'kitten', 'pet food', 'dog food', 'cat food',
                        'pet cage', 'aquarium', 'fish tank',
                        'нохой', 'муур', 'амьтан', 'тэжээвэр'],
        keywords: ['pet', 'animal', 'bird', 'fish', 'rabbit', 'hamster',
                  'collar', 'leash', 'toy', 'bed', 'bowl',
                  'амьтны хоол'],
        weakKeywords: ['animal', 'breed'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      },

      // H. Hobbies & Entertainment (Хобби, зугаа цэнгэл)
      'Hobbies & Entertainment': {
        strongKeywords: ['guitar', 'piano', 'violin', 'drum', 'keyboard',
                        'treadmill', 'dumbbell', 'yoga mat', 'bicycle',
                        'tent', 'sleeping bag', 'camping',
                        'хөгжим', 'спорт', 'фитнесс'],
        keywords: ['book', 'novel', 'music', 'instrument', 'hobby',
                  'sports', 'fitness', 'gym', 'exercise', 'outdoor',
                  'collection', 'collectible',
                  'ном', 'зугаа', 'цэнгэл'],
        weakKeywords: ['fun', 'entertainment', 'leisure'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      },

      // I. Jobs & Services (Ажил, үйлчилгээ)
      'Jobs & Services': {
        strongKeywords: ['hiring', 'job vacancy', 'freelancer', 'repair service',
                        'cleaning service', 'moving service', 'transport',
                        'plumber', 'electrician', 'carpenter',
                        'ажил', 'үйлчилгээ', 'засвар', 'цэвэрлэгээ'],
        keywords: ['job', 'work', 'service', 'professional', 'technician',
                  'maintenance', 'installation', 'delivery',
                  'ажилтан', 'мэргэжилтэн'],
        weakKeywords: ['help', 'assist', 'support'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      },

      // J. Real Estate (Үл хөдлөх хөрөнгө)
      'Real Estate': {
        strongKeywords: ['apartment', 'house', 'villa', 'condo', 'land', 'office',
                        'for rent', 'for sale', 'lease', 'rental',
                        'орон сууц', 'байшин', 'газар', 'түрээс'],
        keywords: ['real estate', 'property', 'estate', 'building', 'commercial',
                  'residential', 'square meter', 'bedroom', 'bathroom',
                  'үл хөдлөх', 'хөрөнгө', 'өрөө'],
        weakKeywords: ['room', 'space', 'area'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      },

      // K. Industrial / Business (Үйлдвэрлэл / Бизнес)
      'Industrial / Business': {
        strongKeywords: ['construction material', 'cement', 'steel', 'lumber', 'wood',
                        'excavator', 'loader', 'crane', 'forklift',
                        'wholesale', 'bulk', 'industrial',
                        'барилга', 'материал', 'бөөний', 'үйлдвэрлэл'],
        keywords: ['business', 'commercial', 'industry', 'factory', 'warehouse',
                  'equipment', 'machinery', 'tools', 'supplies',
                  'бизнес', 'багаж', 'хэрэгсэл'],
        weakKeywords: ['professional', 'trade'],
        strongWeight: 30,
        weight: 10,
        weakWeight: 3
      }
    };
  }

  /**
   * Helper function to check if keyword matches with word boundaries
   */
  matchesKeyword(text, keyword) {
    const keywordLower = keyword.toLowerCase();

    // For multi-word keywords or Mongolian words, use simple includes
    if (keywordLower.includes(' ') || /[\u0400-\u04FF]/.test(keywordLower)) {
      return text.includes(keywordLower);
    }

    // For single-word English keywords, use word boundary matching
    const regex = new RegExp(`\\b${keywordLower}\\b`, 'i');
    return regex.test(text);
  }

  /**
   * Classify product into best matching category (including subcategories)
   * @param {string} title - Product title
   * @param {string} description - Product description
   * @returns {Object} - { category, confidence, suggestions[] }
   */
  classify(title, description = '') {
    const text = `${title} ${description}`.toLowerCase();
    const titleText = title.toLowerCase();
    const scores = {};

    // Calculate scores for each category
    for (const [category, data] of Object.entries(this.categoryKeywords)) {
      let score = 0;
      let matchedKeywords = [];

      // Check strong keywords (high priority)
      if (data.strongKeywords) {
        for (const keyword of data.strongKeywords) {
          if (this.matchesKeyword(text, keyword)) {
            // Give extra weight if strong keyword is in title
            const weight = this.matchesKeyword(titleText, keyword)
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
          if (this.matchesKeyword(text, keyword)) {
            score += data.weight;
            matchedKeywords.push(keyword);
          }
        }
      }

      // Check weak keywords (low priority)
      if (data.weakKeywords) {
        for (const keyword of data.weakKeywords) {
          if (this.matchesKeyword(text, keyword)) {
            score += data.weakWeight;
            matchedKeywords.push(keyword);
          }
        }
      }

      // Check subcategories if present
      if (data.subcategories) {
        for (const [subcat, subdata] of Object.entries(data.subcategories)) {
          let subscore = 0;
          let submatchedKeywords = [];

          // Check subcategory strong keywords
          if (subdata.strongKeywords) {
            for (const keyword of subdata.strongKeywords) {
              if (this.matchesKeyword(text, keyword)) {
                const weight = this.matchesKeyword(titleText, keyword)
                  ? subdata.strongWeight * 1.5
                  : subdata.strongWeight;
                subscore += weight;
                submatchedKeywords.push(keyword);
              }
            }
          }

          // Check subcategory regular keywords
          if (subdata.keywords) {
            for (const keyword of subdata.keywords) {
              if (this.matchesKeyword(text, keyword)) {
                subscore += subdata.weight;
                submatchedKeywords.push(keyword);
              }
            }
          }

          // If subcategory has matches, add as separate category
          if (subscore > 0) {
            scores[subcat] = {
              score: subscore,
              matchedKeywords: submatchedKeywords,
              confidence: Math.min((subscore / 60) * 100, 100),
              parent: category
            };
          }
        }
      }

      if (score > 0) {
        scores[category] = {
          score,
          matchedKeywords,
          confidence: Math.min((score / 60) * 100, 100)
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
      matchedKeywords: data.matchedKeywords,
      parent: data.parent || null
    }));

    return {
      category: topCategory,
      confidence: topData.confidence,
      suggestions,
      matchedKeywords: topData.matchedKeywords,
      parent: topData.parent || null,
      reason: `Matched keywords: ${topData.matchedKeywords.slice(0, 3).join(', ')}`
    };
  }

  /**
   * Classify using OpenAI GPT (Optional - requires API key)
   */
  async classifyWithAI(title, description = '') {
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not found, falling back to rule-based classifier');
      return this.classify(title, description);
    }

    try {
      const prompt = `
You are a product categorization expert for a Mongolian e-commerce marketplace.

Product Title: "${title}"
Product Description: "${description}"

Available Categories:
- Home & Living (Гэр ахуй) - furniture, appliances, kitchen, decor, garden
- Clothing & Fashion (Хувцас загвар) - men's, women's, kids clothing, shoes, bags
- Electronics & IT (Электроникс) - phones, computers, gaming, cameras, audio
- Kids & Baby (Хүүхэд) - baby gear, toys, kids clothing, learning items
- Vehicles & Parts (Тээврийн хэрэгсэл) - cars, motorcycles, bicycles, parts
- Beauty & Personal Care (Гоо сайхан) - skincare, makeup, haircare, fragrance
- Pets & Supplies (Амьтан) - pet food, accessories, animal care
- Hobbies & Entertainment (Хобби) - books, instruments, sports, collectibles
- Jobs & Services (Үйлчилгээ) - job listings, repair, cleaning, transport
- Real Estate (Үл хөдлөх хөрөнгө) - apartments, houses, land, rentals
- Industrial / Business (Үйлдвэрлэл) - construction, machinery, wholesale

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
            { role: 'system', content: 'You are a product classification expert for Mongolian marketplace. Always respond with valid JSON only.' },
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
