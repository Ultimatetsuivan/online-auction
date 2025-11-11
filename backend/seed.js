// backend/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models (paths must match your files)
const User = require('./models/User');
const Category = require('./models/category');
const Product = require('./models/product');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // ----- 1) Clean (optional) -----
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({})
  ]);

  // ----- 2) Create a dummy user (required by Product.user) -----
  const passwordHash = await bcrypt.hash('123456', 10);
  const user = await User.create({
    name: 'Seeder User',
    email: 'seed.user@test.com',
    password: passwordHash
  });
  console.log('👤 Dummy user:', user.email);

  // Helper: Generate slug from title
  const slugify = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // ----- 3) Seed categories (auto-detect name field) -----
  // Some projects use "name", others "title" or "categoryName".
  const nameField =
    (Category.schema.path('name') && 'name') ||
    (Category.schema.path('categoryName') && 'categoryName') ||
    (Category.schema.path('title') && 'title') ||
    null;

  if (!nameField) {
    console.error('❌ Could not detect the category name field. Check models/category.js.');
    process.exit(1);
  }

  const catDocs = [
    {
      [nameField]: 'Electronics',
      slug: slugify('Electronics'),
      titleMn: 'Электроникс',
      description: 'Phones, laptops, gadgets, and tech accessories',
      icon: 'phone-portrait-outline'
    },
    {
      [nameField]: 'Clothing',
      slug: slugify('Clothing'),
      titleMn: 'Хувцас',
      description: 'Shirts, jeans, dresses, and fashion items',
      icon: 'shirt-outline'
    },
    {
      [nameField]: 'Home & Furniture',
      slug: slugify('Home & Furniture'),
      titleMn: 'Гэр, Тавилга',
      description: 'Chairs, sofas, appliances, and home decor',
      icon: 'home-outline'
    },
    {
      [nameField]: 'Books',
      slug: slugify('Books'),
      titleMn: 'Ном',
      description: 'Fiction, non-fiction, education, and magazines',
      icon: 'book-outline'
    },
    {
      [nameField]: 'Sports',
      slug: slugify('Sports'),
      titleMn: 'Спорт',
      description: 'Equipment, accessories, and sporting goods',
      icon: 'football-outline'
    },
    {
      [nameField]: 'Automotive',
      slug: slugify('Automotive'),
      titleMn: 'Тээврийн хэрэгсэл',
      description: 'Cars, motorcycles, and vehicle accessories',
      icon: 'car-sport-outline'
    },
    {
      [nameField]: 'Jewelry',
      slug: slugify('Jewelry'),
      titleMn: 'Үнэт эдлэл',
      description: 'Rings, necklaces, watches, and accessories',
      icon: 'diamond-outline'
    },
    {
      [nameField]: 'Art & Collectibles',
      slug: slugify('Art & Collectibles'),
      titleMn: 'Урлаг',
      description: 'Paintings, sculptures, and rare collectibles',
      icon: 'color-palette-outline'
    },
  ];

  const categories = await Category.insertMany(catDocs);
  console.log('📚 Categories seeded:', categories.map(c => c[nameField]));

  // Helper: 7 days from now
  const inDays = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

  // Find category IDs for use in products
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat[nameField]] = cat._id;
  });

  // ----- 4) Seed products (make sure to satisfy required fields) -----
  const products = [
    // Electronics
    {
      title: 'iPhone 14 Pro Max',
      description: 'Brand new Apple iPhone 14 Pro Max, 256GB, Deep Purple. Includes original box, charger, and accessories.',
      price: 1200,
      user: user._id,
      category: categoryMap['Electronics'],
      brand: 'Apple',
      condition: 'new',
      bidDeadline: inDays(7),
      images: [{
        url: 'https://images.unsplash.com/photo-1678652197517-584f837a49aa',
        publicId: 'sample_phone_1',
        isPrimary: true
      }]
    },
    {
      title: 'MacBook Pro 16" M2',
      description: 'Latest MacBook Pro with M2 chip, 16GB RAM, 512GB SSD. Perfect for developers and creators.',
      price: 2000,
      user: user._id,
      category: categoryMap['Electronics'],
      brand: 'Apple',
      condition: 'like-new',
      bidDeadline: inDays(10),
      images: [{
        url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8',
        publicId: 'sample_laptop_1',
        isPrimary: true
      }]
    },
    {
      title: 'Sony WH-1000XM5 Headphones',
      description: 'Premium noise-cancelling wireless headphones with exceptional sound quality.',
      price: 300,
      user: user._id,
      category: categoryMap['Electronics'],
      brand: 'Sony',
      condition: 'new',
      bidDeadline: inDays(5),
      images: [{
        url: 'https://images.unsplash.com/photo-1545127398-14699f92334b',
        publicId: 'sample_headphones_1',
        isPrimary: true
      }]
    },
    // Clothing
    {
      title: 'Premium Leather Jacket',
      description: 'Genuine leather jacket, black, perfect for winter. Size L.',
      price: 250,
      user: user._id,
      category: categoryMap['Clothing'],
      size: 'L',
      color: 'Black',
      condition: 'new',
      bidDeadline: inDays(5),
      images: [{
        url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5',
        publicId: 'sample_jacket_1',
        isPrimary: true
      }]
    },
    {
      title: 'Designer Sneakers',
      description: 'Limited edition Nike Air Jordan 1, size 42, barely worn.',
      price: 180,
      user: user._id,
      category: categoryMap['Clothing'],
      brand: 'Nike',
      size: '42',
      condition: 'like-new',
      bidDeadline: inDays(4),
      images: [{
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
        publicId: 'sample_sneakers_1',
        isPrimary: true
      }]
    },
    // Home & Furniture
    {
      title: 'Modern Velvet Sofa',
      description: 'Luxurious 3-seater velvet sofa in navy blue. Perfect condition, like new.',
      price: 800,
      user: user._id,
      category: categoryMap['Home & Furniture'],
      color: 'Navy Blue',
      condition: 'like-new',
      bidDeadline: inDays(12),
      images: [{
        url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
        publicId: 'sample_sofa_1',
        isPrimary: true
      }]
    },
    {
      title: 'Vintage Coffee Table',
      description: 'Beautiful mid-century modern coffee table, solid wood construction.',
      price: 350,
      user: user._id,
      category: categoryMap['Home & Furniture'],
      condition: 'used',
      bidDeadline: inDays(8),
      images: [{
        url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88',
        publicId: 'sample_table_1',
        isPrimary: true
      }]
    },
    // Books
    {
      title: 'First Edition Harry Potter Set',
      description: 'Complete set of Harry Potter first editions, excellent condition with dust jackets.',
      price: 500,
      user: user._id,
      category: categoryMap['Books'],
      condition: 'like-new',
      bidDeadline: inDays(15),
      images: [{
        url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570',
        publicId: 'sample_books_1',
        isPrimary: true
      }]
    },
    // Sports
    {
      title: 'Mountain Bike - Trek X-Caliber',
      description: 'Professional mountain bike, 29" wheels, full suspension, barely used.',
      price: 1200,
      user: user._id,
      category: categoryMap['Sports'],
      brand: 'Trek',
      condition: 'like-new',
      bidDeadline: inDays(9),
      images: [{
        url: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91',
        publicId: 'sample_bike_1',
        isPrimary: true
      }]
    },
    {
      title: 'Golf Club Set',
      description: 'Complete Callaway golf club set with bag. Professional grade equipment.',
      price: 650,
      user: user._id,
      category: categoryMap['Sports'],
      brand: 'Callaway',
      condition: 'used',
      bidDeadline: inDays(6),
      images: [{
        url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b',
        publicId: 'sample_golf_1',
        isPrimary: true
      }]
    },
    // Automotive
    {
      title: '2019 Toyota Camry',
      description: 'Well-maintained Toyota Camry, low mileage, excellent condition. Full service history.',
      price: 18000,
      user: user._id,
      category: categoryMap['Automotive'],
      brand: 'Toyota',
      condition: 'used',
      bidDeadline: inDays(14),
      images: [{
        url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb',
        publicId: 'sample_car_1',
        isPrimary: true
      }]
    },
    // Jewelry
    {
      title: 'Diamond Engagement Ring',
      description: 'Stunning 1.5 carat diamond ring, 18k white gold setting. Certified diamond.',
      price: 3500,
      user: user._id,
      category: categoryMap['Jewelry'],
      condition: 'new',
      bidDeadline: inDays(10),
      images: [{
        url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e',
        publicId: 'sample_ring_1',
        isPrimary: true
      }]
    },
    {
      title: 'Rolex Submariner Watch',
      description: 'Authentic Rolex Submariner, black dial, with original box and papers.',
      price: 8500,
      user: user._id,
      category: categoryMap['Jewelry'],
      brand: 'Rolex',
      condition: 'like-new',
      bidDeadline: inDays(12),
      images: [{
        url: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49',
        publicId: 'sample_watch_1',
        isPrimary: true
      }]
    },
    // Art & Collectibles
    {
      title: 'Abstract Oil Painting',
      description: 'Original abstract oil painting on canvas, 36x48 inches, signed by artist.',
      price: 1200,
      user: user._id,
      category: categoryMap['Art & Collectibles'],
      condition: 'new',
      bidDeadline: inDays(11),
      images: [{
        url: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912',
        publicId: 'sample_art_1',
        isPrimary: true
      }]
    },
    {
      title: 'Vintage Vinyl Collection',
      description: '50+ vintage vinyl records including Beatles, Pink Floyd, Led Zeppelin.',
      price: 450,
      user: user._id,
      category: categoryMap['Art & Collectibles'],
      condition: 'used',
      bidDeadline: inDays(7),
      images: [{
        url: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617',
        publicId: 'sample_vinyl_1',
        isPrimary: true
      }]
    },
  ];

  // Add slugs to all products
  products.forEach((product, index) => {
    product.slug = slugify(product.title) + '-' + (Date.now() + index);
  });

  await Product.insertMany(products);
  console.log('🛒 Products seeded:', products.map(p => p.title));

  await mongoose.disconnect();
  console.log('✅ Seeding complete');
}

main().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
