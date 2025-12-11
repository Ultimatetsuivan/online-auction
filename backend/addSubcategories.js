const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/auction')
  .then(async () => {
    const Category = require('./models/Category');

    console.log('Adding subcategories...\n');

    // Electronics subcategories
    const electronics = await Category.findOne({ title: 'Electronics' });
    if (electronics) {
      const electronicsSubcategories = [
        { title: 'Smartphones', titleMn: 'Ухаалаг утас', icon: 'phone-portrait' },
        { title: 'Laptops & Computers', titleMn: 'Зөөврийн компьютер', icon: 'laptop' },
        { title: 'Tablets', titleMn: 'Таблет', icon: 'tablet-portrait' },
        { title: 'Cameras', titleMn: 'Камер', icon: 'camera' },
        { title: 'TVs & Monitors', titleMn: 'Телевиз, Монитор', icon: 'tv' },
        { title: 'Audio & Headphones', titleMn: 'Аудио, Чихэвч', icon: 'headset' },
        { title: 'Gaming', titleMn: 'Тоглоом', icon: 'game-controller' },
        { title: 'Smart Home', titleMn: 'Ухаалаг гэр', icon: 'bulb' }
      ];

      for (const sub of electronicsSubcategories) {
        const exists = await Category.findOne({
          title: sub.title,
          parent: electronics._id
        });

        if (!exists) {
          await Category.create({
            title: sub.title,
            titleMn: sub.titleMn,
            description: `${sub.title} category`,
            icon: sub.icon,
            parent: electronics._id,
            order: 0,
            isActive: true
          });
          console.log(`✓ Added: Electronics > ${sub.title}`);
        } else {
          console.log(`- Exists: Electronics > ${sub.title}`);
        }
      }
    }

    // Clothing subcategories
    const clothing = await Category.findOne({ title: 'Clothing' });
    if (clothing) {
      const clothingSubcategories = [
        { title: "Men's Wear", titleMn: 'Эрэгтэйчүүдийн хувцас', icon: 'man' },
        { title: "Women's Wear", titleMn: 'Эмэгтэйчүүдийн хувцас', icon: 'woman' },
        { title: "Kids' Wear", titleMn: 'Хүүхдийн хувцас', icon: 'happy' },
        { title: 'Shoes', titleMn: 'Гутал', icon: 'footsteps' },
        { title: 'Bags & Accessories', titleMn: 'Цүнх, Дагалдах хэрэгсэл', icon: 'bag-handle' },
        { title: 'Sportswear', titleMn: 'Спортын хувцас', icon: 'basketball' },
        { title: 'Jewelry & Watches', titleMn: 'Үнэт эдлэл, Цаг', icon: 'watch' }
      ];

      for (const sub of clothingSubcategories) {
        const exists = await Category.findOne({
          title: sub.title,
          parent: clothing._id
        });

        if (!exists) {
          await Category.create({
            title: sub.title,
            titleMn: sub.titleMn,
            description: `${sub.title} category`,
            icon: sub.icon,
            parent: clothing._id,
            order: 0,
            isActive: true
          });
          console.log(`✓ Added: Clothing > ${sub.title}`);
        } else {
          console.log(`- Exists: Clothing > ${sub.title}`);
        }
      }
    }

    console.log('\n✅ Subcategories added successfully!');

    // Verify
    const electronicsChildren = await Category.find({ parent: electronics._id });
    const clothingChildren = await Category.find({ parent: clothing._id });

    console.log(`\nElectronics now has ${electronicsChildren.length} subcategories`);
    console.log(`Clothing now has ${clothingChildren.length} subcategories`);

    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
