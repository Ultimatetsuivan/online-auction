/**
 * Mongolian Marketplace Category Seeder
 * Comprehensive category structure tailored for Mongolian users
 */

const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

// Category structure with both English and Mongolian
const categories = [
  {
    code: 'A',
    title: 'Home & Living',
    titleMn: 'Гэр ахуй',
    icon: '🏠',
    subcategories: [
      { title: 'Furniture', titleMn: 'Тавилга (Ор, Ширээ, Сандал, Шкаф)' },
      { title: 'Home Appliances', titleMn: 'Гэрийн техник хэрэгсэл (Тоос сорогч, Индукц, Зуух)' },
      { title: 'Kitchen & Dining', titleMn: 'Гал тогоо, хоолны өрөө' },
      { title: 'Home Decor', titleMn: 'Гэрийн чимэглэл' },
      { title: 'Garden & Tools', titleMn: 'Цэцэрлэг, багаж хэрэгсэл' }
    ]
  },
  {
    code: 'B',
    title: 'Clothing & Fashion',
    titleMn: 'Хувцас загвар',
    icon: '👕',
    subcategories: [
      { title: 'Men\'s Clothing', titleMn: 'Эрэгтэй хувцас' },
      { title: 'Women\'s Clothing', titleMn: 'Эмэгтэй хувцас' },
      { title: 'Kids & Babies', titleMn: 'Хүүхдийн хувцас, хэрэгсэл' },
      { title: 'Shoes', titleMn: 'Гутал' },
      { title: 'Bags', titleMn: 'Цүнх' },
      { title: 'Accessories', titleMn: 'Нэмэлт хэрэгсэл' }
    ]
  },
  {
    code: 'C',
    title: 'Electronics & IT',
    titleMn: 'Электроникс, IT',
    icon: '📱',
    subcategories: [
      { title: 'Phones & Tablets', titleMn: 'Утас, таблет' },
      { title: 'Laptops & Computers', titleMn: 'Зөөврийн болон суурин компьютер' },
      { title: 'PC Components', titleMn: 'Компьютерийн эд ангиуд' },
      { title: 'Gaming Devices', titleMn: 'Тоглоомын төхөөрөмж' },
      { title: 'TVs & Audio', titleMn: 'Телевиз, аудио' },
      { title: 'Cameras', titleMn: 'Камер' }
    ]
  },
  {
    code: 'D',
    title: 'Kids & Baby',
    titleMn: 'Хүүхэд, нялх хүүхэд',
    icon: '🧸',
    subcategories: [
      { title: 'Baby Gear', titleMn: 'Нялхсын тэрэг, суудал' },
      { title: 'Toys', titleMn: 'Тоглоом' },
      { title: 'Kids Clothing', titleMn: 'Хүүхдийн хувцас' },
      { title: 'Learning Items', titleMn: 'Сургалтын хэрэгсэл' }
    ]
  },
  {
    code: 'E',
    title: 'Vehicles & Parts',
    titleMn: 'Тээврийн хэрэгсэл',
    icon: '🚗',
    subcategories: [
      { title: 'Cars', titleMn: 'Автомашин' },
      { title: 'Car Parts', titleMn: 'Машины эд ангиуд' },
      { title: 'Car Accessories', titleMn: 'Машины дагалдах хэрэгсэл' },
      { title: 'Motorcycles', titleMn: 'Мотоцикл' },
      { title: 'Bicycle & Scooters', titleMn: 'Дугуй, скүүтер' }
    ]
  },
  {
    code: 'F',
    title: 'Beauty & Personal Care',
    titleMn: 'Гоо сайхан',
    icon: '🧹',
    subcategories: [
      { title: 'Skincare', titleMn: 'Арьс арчилгаа' },
      { title: 'Makeup', titleMn: 'Нүүр будалт' },
      { title: 'Haircare', titleMn: 'Үс арчилгаа' },
      { title: 'Fragrance', titleMn: 'Үнэртэн' },
      { title: 'Personal Hygiene', titleMn: 'Хувийн ариун цэвэр' }
    ]
  },
  {
    code: 'G',
    title: 'Pets & Supplies',
    titleMn: 'Гэрийн тэжээвэр амьтан',
    icon: '🐶',
    subcategories: [
      { title: 'Dogs', titleMn: 'Нохой' },
      { title: 'Cats', titleMn: 'Муур' },
      { title: 'Pet Food', titleMn: 'Амьтны хоол' },
      { title: 'Pet Accessories', titleMn: 'Амьтны хэрэгсэл' }
    ]
  },
  {
    code: 'H',
    title: 'Hobbies & Entertainment',
    titleMn: 'Хобби, зугаа цэнгэл',
    icon: '🎵',
    subcategories: [
      { title: 'Books', titleMn: 'Ном' },
      { title: 'Music Instruments', titleMn: 'Хөгжмийн зэмсэг' },
      { title: 'Sports & Fitness', titleMn: 'Спорт, фитнесс' },
      { title: 'Outdoor Equipment', titleMn: 'Зуслангийн хэрэгсэл' },
      { title: 'Collectibles', titleMn: 'Цуглуулга' }
    ]
  },
  {
    code: 'I',
    title: 'Jobs & Services',
    titleMn: 'Ажил, үйлчилгээ',
    icon: '💼',
    subcategories: [
      { title: 'Job Listings', titleMn: 'Ажлын зар' },
      { title: 'Freelancers', titleMn: 'Чөлөөт ажилтан' },
      { title: 'Repair Services', titleMn: 'Засварын үйлчилгээ' },
      { title: 'Moving & Transport', titleMn: 'Нүүлгэх, тээвэрлэх' },
      { title: 'Home Cleaning', titleMn: 'Гэр цэвэрлэгээ' },
      { title: 'Beauty Services', titleMn: 'Гоо сайхны үйлчилгээ' }
    ]
  },
  {
    code: 'J',
    title: 'Real Estate',
    titleMn: 'Үл хөдлөх хөрөнгө',
    icon: '🏢',
    subcategories: [
      { title: 'Apartments', titleMn: 'Орон сууц' },
      { title: 'Houses', titleMn: 'Байшин' },
      { title: 'Land', titleMn: 'Газар' },
      { title: 'Office Spaces', titleMn: 'Оффисын орон зай' },
      { title: 'Rentals', titleMn: 'Түрээс' }
    ]
  },
  {
    code: 'K',
    title: 'Industrial / Business',
    titleMn: 'Үйлдвэрлэл / Бизнес',
    icon: '🛠',
    subcategories: [
      { title: 'Construction Materials', titleMn: 'Барилгын материал' },
      { title: 'Tools', titleMn: 'Багаж хэрэгсэл' },
      { title: 'Machinery', titleMn: 'Машин механизм' },
      { title: 'Wholesale Items', titleMn: 'Бөөний бараа' }
    ]
  }
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing categories
    const deleteResult = await Category.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing categories`);

    let totalCreated = 0;
    let errors = 0;

    // Create categories
    for (const categoryData of categories) {
      try {
        // Create parent category
        const parent = await Category.create({
          title: categoryData.title,
          titleMn: categoryData.titleMn,
          icon: categoryData.icon,
          code: categoryData.code,
          parent: null
        });

        console.log(`✅ Created parent: ${categoryData.code}. ${categoryData.title} (${categoryData.titleMn})`);
        totalCreated++;

        // Create subcategories
        for (const sub of categoryData.subcategories) {
          try {
            await Category.create({
              title: sub.title,
              titleMn: sub.titleMn,
              parent: parent._id
            });

            console.log(`   ↳ Created subcategory: ${sub.title} (${sub.titleMn})`);
            totalCreated++;
          } catch (error) {
            console.error(`   ❌ Error creating subcategory ${sub.title}:`, error.message);
            errors++;
          }
        }

        console.log(''); // Empty line for readability
      } catch (error) {
        console.error(`❌ Error creating parent category ${categoryData.title}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Successfully created: ${totalCreated} categories`);
    console.log(`❌ Errors: ${errors}`);

    // Verify counts
    const parentCount = await Category.countDocuments({ parent: null });
    const childCount = await Category.countDocuments({ parent: { $ne: null } });
    console.log(`\n📈 Database Verification:`);
    console.log(`   Parent categories: ${parentCount}`);
    console.log(`   Subcategories: ${childCount}`);
    console.log(`   Total: ${parentCount + childCount}`);

    console.log('\n✅ Mongolian category seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the seeder
seedCategories();
