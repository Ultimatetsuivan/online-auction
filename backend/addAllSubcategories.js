const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/auction')
  .then(async () => {
    const Category = require('./models/Category');

    console.log('Adding subcategories for all parent categories...\n');

    // Define all subcategories for each parent category
    const categoryStructure = {
      'Home & Furniture': [
        { title: 'Living Room Furniture', titleMn: 'Зочны өрөөний тавилга', icon: 'tv' },
        { title: 'Bedroom Furniture', titleMn: 'Унтлагын өрөөний тавилга', icon: 'moon' },
        { title: 'Kitchen Furniture', titleMn: 'Гал тогооны тавилга', icon: 'restaurant' },
        { title: 'Office Furniture', titleMn: 'Албан өрөөний тавилга', icon: 'briefcase' },
        { title: 'Storage & Organization', titleMn: 'Хадгалалт, Зохион байгуулалт', icon: 'filing' },
        { title: 'Home Decor', titleMn: 'Гэрийн чимэглэл', icon: 'home' },
        { title: 'Lighting', titleMn: 'Гэрэлтүүлэг', icon: 'bulb' },
        { title: 'Home Appliances', titleMn: 'Гэрийн цахилгаан хэрэгсэл', icon: 'hardware-chip' }
      ],
      'Books': [
        { title: 'Fiction', titleMn: 'Уран зохиол', icon: 'book' },
        { title: 'Non-Fiction', titleMn: 'Уран бус зохиол', icon: 'newspaper' },
        { title: 'Educational', titleMn: 'Боловсролын ном', icon: 'school' },
        { title: 'Children Books', titleMn: 'Хүүхдийн ном', icon: 'balloon' },
        { title: 'Comics & Manga', titleMn: 'Комикс, Манга', icon: 'albums' },
        { title: 'Magazines', titleMn: 'Сэтгүүл', icon: 'newspaper' },
        { title: 'Reference Books', titleMn: 'Лавлах ном', icon: 'library' }
      ],
      'Sports': [
        { title: 'Gym & Fitness', titleMn: 'Биеийн тамир', icon: 'barbell' },
        { title: 'Team Sports', titleMn: 'Багийн спорт', icon: 'football' },
        { title: 'Outdoor Sports', titleMn: 'Гадаа спорт', icon: 'bicycle' },
        { title: 'Water Sports', titleMn: 'Усан спорт', icon: 'boat' },
        { title: 'Winter Sports', titleMn: 'Өвлийн спорт', icon: 'snow' },
        { title: 'Cycling', titleMn: 'Дугуй', icon: 'bicycle' },
        { title: 'Sports Nutrition', titleMn: 'Спортын тэжээл', icon: 'fitness' }
      ],
      'Automotive': [
        { title: 'Cars', titleMn: 'Автомашин', icon: 'car-sport' },
        { title: 'Motorcycles', titleMn: 'Мотоцикл', icon: 'bicycle' },
        { title: 'Car Parts & Accessories', titleMn: 'Машины сэлбэг, дагалдах', icon: 'construct' },
        { title: 'Motorcycle Parts', titleMn: 'Мотоциклын сэлбэг', icon: 'settings' },
        { title: 'Car Electronics', titleMn: 'Машины электроник', icon: 'radio' },
        { title: 'Tools & Equipment', titleMn: 'Багаж хэрэгсэл', icon: 'hammer' },
        { title: 'Tires & Wheels', titleMn: 'Дугуй, Обуд', icon: 'disc' }
      ],
      'Jewelry': [
        { title: 'Rings', titleMn: 'Бөгж', icon: 'radio-button-on' },
        { title: 'Necklaces', titleMn: 'Зүүлт', icon: 'ellipse' },
        { title: 'Earrings', titleMn: 'Ээмэг', icon: 'ellipsis-horizontal' },
        { title: 'Bracelets', titleMn: 'Бугуйвч', icon: 'link' },
        { title: 'Watches', titleMn: 'Цаг', icon: 'watch' },
        { title: 'Gemstones', titleMn: 'Үнэт чулуу', icon: 'diamond' },
        { title: 'Jewelry Sets', titleMn: 'Үнэт эдлэлийн багц', icon: 'gift' }
      ],
      'Art & Collectibles': [
        { title: 'Paintings', titleMn: 'Зураг', icon: 'color-palette' },
        { title: 'Sculptures', titleMn: 'Баримал', icon: 'cube' },
        { title: 'Antiques', titleMn: 'Эртний эд зүйлс', icon: 'hourglass' },
        { title: 'Collectible Coins', titleMn: 'Цуглуулгын зоос', icon: 'cash' },
        { title: 'Stamps', titleMn: 'Марк', icon: 'mail' },
        { title: 'Photography', titleMn: 'Гэрэл зураг', icon: 'camera' },
        { title: 'Vintage Items', titleMn: 'Хуучны эд зүйлс', icon: 'time' }
      ]
    };

    let totalAdded = 0;
    let totalExisting = 0;

    for (const [parentTitle, subcategories] of Object.entries(categoryStructure)) {
      const parentCategory = await Category.findOne({ title: parentTitle });

      if (!parentCategory) {
        console.log(`⚠️  Parent category "${parentTitle}" not found. Skipping...`);
        continue;
      }

      console.log(`\n📁 ${parentTitle} (${parentCategory._id})`);

      for (const sub of subcategories) {
        const exists = await Category.findOne({
          title: sub.title,
          parent: parentCategory._id
        });

        if (!exists) {
          await Category.create({
            title: sub.title,
            titleMn: sub.titleMn,
            description: `${sub.title} category`,
            icon: sub.icon,
            parent: parentCategory._id,
            order: 0,
            isActive: true
          });
          console.log(`  ✓ Added: ${sub.title}`);
          totalAdded++;
        } else {
          console.log(`  - Exists: ${sub.title}`);
          totalExisting++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Subcategories setup completed!');
    console.log(`📊 Total added: ${totalAdded}`);
    console.log(`📊 Already existing: ${totalExisting}`);
    console.log('='.repeat(60));

    // Show final statistics
    const allCategories = await Category.find({});
    const parentCategories = allCategories.filter(c => !c.parent || (typeof c.parent === 'object' && c.parent === null));

    console.log('\n📈 Final Category Statistics:');
    for (const parent of parentCategories) {
      const children = allCategories.filter(c => {
        if (!c.parent) return false;
        const parentId = typeof c.parent === 'object' && c.parent !== null
          ? c.parent._id?.toString()
          : c.parent?.toString();
        return parentId === parent._id.toString();
      });
      console.log(`  ${parent.title}: ${children.length} subcategories`);
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
