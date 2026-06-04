/**
 * Seed / update fieldSchema on categories.
 * Run with:  node backend/scripts/seedFieldSchemas.js
 *
 * MERGE logic: existing keys are updated in-place; new keys are appended.
 * Re-running is safe — it won't wipe fields added by a previous run.
 *
 * To add a new category's full schema  → add an entry to FULL_SCHEMAS
 * To add a single field everywhere     → add it to BRAND_FIELD / universal pass
 * To add a field to specific cats      → add a MERGE_SCHEMAS entry
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/category');

// ── Helpers ──────────────────────────────────────────────────────────────────

function mergeFields(existing = [], incoming = []) {
  const map = new Map(existing.map(f => [f.key, f]));
  for (const field of incoming) map.set(field.key, field); // update or add
  return [...map.values()];
}

// ── 1. Full schemas (define all fields for these category families) ───────────

const FULL_SCHEMAS = [
  {
    titleKeywords: ['car', 'vehicle', 'auto', 'мотор', 'машин', 'motorbike'],
    fieldSchema: [
      { key: 'make',         labelMn: 'Марк (Үйлдвэрлэгч)', type: 'text',   required: true,  filterable: true,  filterType: 'text',   filterOrder: 1 },
      { key: 'model',        labelMn: 'Загвар',              type: 'text',   required: true,  filterable: true,  filterType: 'text',   filterOrder: 2 },
      { key: 'year',         labelMn: 'Он',                  type: 'number', required: true,  filterable: true,  filterType: 'range',  filterOrder: 3 },
      { key: 'mileage',      labelMn: 'Гүйлт',              type: 'number', unit: 'км',      filterable: true,  filterType: 'range',  filterOrder: 4 },
      {
        key: 'fuelType', labelMn: 'Түлшний төрөл', type: 'select', filterable: true, filterType: 'select', filterOrder: 5,
        options: [
          { value: 'gasoline', labelMn: 'Бензин' },
          { value: 'diesel',   labelMn: 'Дизель' },
          { value: 'electric', labelMn: 'Цахилгаан' },
          { value: 'hybrid',   labelMn: 'Гибрид' },
          { value: 'other',    labelMn: 'Бусад' },
        ],
      },
      {
        key: 'transmission', labelMn: 'Хурдны хайрцаг', type: 'select', filterable: true, filterType: 'select', filterOrder: 6,
        options: [
          { value: 'automatic', labelMn: 'Автомат' },
          { value: 'manual',    labelMn: 'Механик' },
          { value: 'cvt',       labelMn: 'CVT' },
          { value: 'other',     labelMn: 'Бусад' },
        ],
      },
      {
        key: 'vehicleTitle', labelMn: 'Гэрчилгээ', type: 'select', filterable: false, filterType: 'select', filterOrder: 7,
        options: [
          { value: 'clean',   labelMn: 'Цэвэр' },
          { value: 'salvage', labelMn: 'Осол' },
          { value: 'rebuilt', labelMn: 'Сэргээгдсэн' },
          { value: 'other',   labelMn: 'Бусад' },
        ],
      },
      { key: 'color', labelMn: 'Өнгө', type: 'text', filterable: true, filterType: 'text',   filterOrder: 8 },
      { key: 'vin',   labelMn: 'VIN дугаар', type: 'text', filterable: false, filterOrder: 9 },
    ],
  },
  {
    titleKeywords: ['real estate', 'property', 'apartment', 'house', 'орон сууц', 'үл хөдлөх', 'байшин', 'газар'],
    fieldSchema: [
      {
        key: 'propertyType', labelMn: 'Хөрөнгийн төрөл', type: 'select', required: true, filterable: true, filterType: 'select', filterOrder: 1,
        options: [
          { value: 'apartment',  labelMn: 'Орон сууц' },
          { value: 'house',      labelMn: 'Байшин' },
          { value: 'office',     labelMn: 'Оффис' },
          { value: 'land',       labelMn: 'Газар' },
          { value: 'commercial', labelMn: 'Арилжааны' },
          { value: 'other',      labelMn: 'Бусад' },
        ],
      },
      { key: 'area',        labelMn: 'Талбай',       type: 'number', unit: 'м²', required: true, filterable: true, filterType: 'range', filterOrder: 2 },
      { key: 'rooms',       labelMn: 'Өрөөний тоо',  type: 'number', filterable: true,  filterType: 'range',  filterOrder: 3 },
      { key: 'bathrooms',   labelMn: 'Угаалгуур',    type: 'number', filterable: false, filterOrder: 4 },
      { key: 'floor',       labelMn: 'Давхар',       type: 'number', filterable: true,  filterType: 'range',  filterOrder: 5 },
      { key: 'totalFloors', labelMn: 'Нийт давхар',  type: 'number', filterable: false, filterOrder: 6 },
      { key: 'yearBuilt',   labelMn: 'Баригдсан он', type: 'number', filterable: true,  filterType: 'range',  filterOrder: 7 },
      { key: 'district',    labelMn: 'Дүүрэг',      type: 'text',   filterable: true,  filterType: 'text',   filterOrder: 8 },
      {
        key: 'furnished', labelMn: 'Тавилга', type: 'select', filterable: true, filterType: 'select', filterOrder: 9,
        options: [{ value: 'yes', labelMn: 'Тавилгатай' }, { value: 'no', labelMn: 'Тавилгагүй' }],
      },
      {
        key: 'parking', labelMn: 'Зогсоол', type: 'select', filterable: true, filterType: 'select', filterOrder: 10,
        options: [{ value: 'yes', labelMn: 'Байгаа' }, { value: 'no', labelMn: 'Байхгүй' }],
      },
    ],
  },
];

// ── 2. Universal brand field ──────────────────────────────────────────────────
// Added to every category EXCEPT the ones below.

const BRAND_FIELD = {
  key: 'brand', labelMn: 'Брэнд', type: 'text',
  filterable: true, filterType: 'text', filterOrder: 0,
};

// Categories where "brand" doesn't make sense
const NO_BRAND_KEYWORDS = [
  // Real estate
  'real estate', 'property', 'apartment', 'house', 'орон сууц', 'үл хөдлөх', 'байшин', 'газар', 'land',
  // Tickets
  'ticket', 'тасалбар',
  // Written content
  'book', 'magazine', 'comic', 'ном', 'сэтгүүл',
  // Handmade
  'handmade', 'craft', 'гар урлал',
  // Services / jobs
  'service', 'job', 'ажил', 'career', 'үйлчилгэа',
  // Food/drink (uncomment to exclude)
  // 'food', 'drink', 'хоол', 'ундаа',
];

// For automotive main categories, "make" already IS the brand — skip adding brand
const AUTOMOTIVE_BRAND_SKIP = ['car', 'vehicle', 'мотор', 'машин', 'motorbike', 'автомашин'];

// ── Run ──────────────────────────────────────────────────────────────────────

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const categories = await Category.find({});
  let updated = 0;

  // Pass 1: apply full schemas (merge with existing)
  console.log('Pass 1: full schemas');
  for (const schema of FULL_SCHEMAS) {
    for (const cat of categories) {
      const title = ((cat.title || '') + ' ' + (cat.titleMn || '')).toLowerCase();
      if (schema.titleKeywords.some(kw => title.includes(kw.toLowerCase()))) {
        cat.fieldSchema = mergeFields(cat.fieldSchema, schema.fieldSchema);
        await cat.save();
        console.log(`  ✓ ${cat.title} (${cat.titleMn || ''})`);
        updated++;
      }
    }
  }

  // Pass 2: add brand field everywhere it makes sense
  console.log('\nPass 2: brand field');
  for (const cat of categories) {
    const title = ((cat.title || '') + ' ' + (cat.titleMn || '')).toLowerCase();

    const noBrand = NO_BRAND_KEYWORDS.some(kw => title.includes(kw.toLowerCase()));
    if (noBrand) { console.log(`  — skipped (no brand): ${cat.title}`); continue; }

    // Automotive main categories already capture brand via "make" field
    const isAutomotiveMain = AUTOMOTIVE_BRAND_SKIP.some(kw => title.includes(kw.toLowerCase()));
    const hasMake = (cat.fieldSchema || []).some(f => f.key === 'make');
    if (isAutomotiveMain && hasMake) { console.log(`  — skipped (make=brand): ${cat.title}`); continue; }

    const hasBrand = (cat.fieldSchema || []).some(f => f.key === 'brand');
    if (!hasBrand) {
      cat.fieldSchema = mergeFields(cat.fieldSchema, [BRAND_FIELD]);
      await cat.save();
      console.log(`  + brand → ${cat.title} (${cat.titleMn || ''})`);
      updated++;
    } else {
      console.log(`  ✓ already has brand: ${cat.title}`);
    }
  }

  console.log(`\nDone — ${updated} categories updated.`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
