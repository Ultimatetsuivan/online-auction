const mongoose = require("mongoose");
const Category = require("../models/Category");
require("dotenv").config();

// Parent categories (level 1)
const parentCategories = [
  {
    title: "Cars",
    titleMn: "Машин",
    icon: "car-outline",
    description: "Машин, авто машин, автомашины сэлбэг хэрэгсэл",
    order: 0
  },
  {
    title: "Electronics",
    titleMn: "Цахилгаан бараа",
    icon: "phone-portrait-outline",
    description: "Гар утас, компьютер, дуу видео хэрэгсэл",
    order: 1
  },
  {
    title: "Fashion",
    titleMn: "Хувцас загвар",
    icon: "shirt-outline",
    description: "Эрэгтэй, эмэгтэй хувцас, гутал",
    order: 2
  },
  {
    title: "Home & Furniture",
    titleMn: "Гэр ахуй тавилга",
    icon: "home-outline",
    description: "Тавилга, гэрийн тохижилт, гал тогоо хэрэгсэл",
    order: 3
  },
  {
    title: "Beauty & Health",
    titleMn: "Гоо сайхан эрүүл мэнд",
    icon: "heart-outline",
    description: "Гоо сайхны бүтээгдэхүүн, эрүүл мэндийн хэрэгсэл",
    order: 4
  },
  {
    title: "Sports & Outdoors",
    titleMn: "Спорт гадаа",
    icon: "football-outline",
    description: "Спортын хэрэгсэл, гадаа зугаалга",
    order: 5
  },
  {
    title: "Books",
    titleMn: "Ном",
    icon: "book-outline",
    description: "Ном, манга, сэтгүүл",
    order: 6
  },
  {
    title: "Other",
    titleMn: "Бусад",
    icon: "ellipsis-horizontal-outline",
    description: "Бусад төрөл",
    order: 99
  }
];

// Subcategories (level 2) - organized by parent
const subcategories = {
  "Cars": [
    { title: "Sedan", titleMn: "Седан", icon: "car-sport-outline", order: 1 },
    { title: "SUV", titleMn: "SUV", icon: "car-outline", order: 2 },
    { title: "Truck", titleMn: "Ачааны машин", icon: "car-sport-outline", order: 3 },
    { title: "Sports Car", titleMn: "Спортын машин", icon: "speedometer-outline", order: 4 },
    { title: "Motorcycle", titleMn: "Мотоцикл", icon: "bicycle-outline", order: 5 },
    { title: "Car Parts & Accessories", titleMn: "Сэлбэг хэрэгсэл", icon: "construct-outline", order: 6 }
  ],
  "Electronics": [
    { title: "Smartphones", titleMn: "Гар утас", icon: "phone-portrait-outline", order: 1 },
    { title: "Computers & Laptops", titleMn: "Компьютер ноутбук", icon: "laptop-outline", order: 2 },
    { title: "Audio & Video", titleMn: "Дуу видео", icon: "headset-outline", order: 3 },
    { title: "Cameras", titleMn: "Камер", icon: "camera-outline", order: 4 },
    { title: "Gaming", titleMn: "Тоглоом", icon: "game-controller-outline", order: 5 }
  ],
  "Fashion": [
    { title: "Men's Clothing", titleMn: "Эрэгтэй хувцас", icon: "man-outline", order: 1 },
    { title: "Women's Clothing", titleMn: "Эмэгтэй хувцас", icon: "woman-outline", order: 2 },
    { title: "Shoes", titleMn: "Гутал", icon: "footsteps-outline", order: 3 },
    { title: "Bags & Accessories", titleMn: "Цүнх дагалдах хэрэгсэл", icon: "bag-handle-outline", order: 4 }
  ],
  "Home & Furniture": [
    { title: "Furniture", titleMn: "Тавилга", icon: "bed-outline", order: 1 },
    { title: "Kitchen & Dining", titleMn: "Гал тогоо", icon: "restaurant-outline", order: 2 },
    { title: "Home Decor", titleMn: "Гэрийн тохижилт", icon: "color-palette-outline", order: 3 },
    { title: "Appliances", titleMn: "Гэр ахуйн бараа", icon: "grid-outline", order: 4 }
  ],
  "Beauty & Health": [
    { title: "Skincare", titleMn: "Арьс арчилгаа", icon: "sparkles-outline", order: 1 },
    { title: "Makeup", titleMn: "Нүүр будалт", icon: "brush-outline", order: 2 },
    { title: "Fragrance", titleMn: "Үнэр", icon: "flask-outline", order: 3 },
    { title: "Health Products", titleMn: "Эрүүл мэндийн бүтээгдэхүүн", icon: "fitness-outline", order: 4 }
  ],
  "Sports & Outdoors": [
    { title: "Exercise & Fitness", titleMn: "Дасгал биеийн тамир", icon: "barbell-outline", order: 1 },
    { title: "Outdoor Recreation", titleMn: "Гадаа зугаалга", icon: "bicycle-outline", order: 2 },
    { title: "Team Sports", titleMn: "Багийн спорт", icon: "football-outline", order: 3 },
    { title: "Winter Sports", titleMn: "Өвлийн спорт", icon: "snow-outline", order: 4 }
  ],
  "Books": [
    { title: "Book", titleMn: "Ном", icon: "book-outline", order: 1 },
    { title: "Manga", titleMn: "Манга", icon: "book-outline", order: 2 },
    { title: "Magazine", titleMn: "Сэтгүүл", icon: "newspaper-outline", order: 3 }
  ]
};

// Sub-subcategories (level 3) - organized by parent subcategory
const subSubcategories = {
  "Sedan": [
    { title: "Toyota", titleMn: "Тойота", order: 1 },
    { title: "Honda", titleMn: "Хонда", order: 2 },
    { title: "Nissan", titleMn: "Ниссан", order: 3 },
    { title: "Hyundai", titleMn: "Хюндай", order: 4 },
    { title: "Kia", titleMn: "Киа", order: 5 },
    { title: "Other Brands", titleMn: "Бусад", order: 6 }
  ],
  "SUV": [
    { title: "Toyota", titleMn: "Тойота", order: 1 },
    { title: "Honda", titleMn: "Хонда", order: 2 },
    { title: "Nissan", titleMn: "Ниссан", order: 3 },
    { title: "Hyundai", titleMn: "Хюндай", order: 4 },
    { title: "Kia", titleMn: "Киа", order: 5 },
    { title: "BMW", titleMn: "BMW", order: 6 },
    { title: "Mercedes-Benz", titleMn: "Мерседес", order: 7 },
    { title: "Other Brands", titleMn: "Бусад", order: 8 }
  ],
  "Truck": [
    { title: "Pickup Truck", titleMn: "Пикап", order: 1 },
    { title: "Commercial Truck", titleMn: "Ачааны машин", order: 2 },
    { title: "Toyota", titleMn: "Тойота", order: 3 },
    { title: "Ford", titleMn: "Форд", order: 4 },
    { title: "Isuzu", titleMn: "Исузу", order: 5 },
    { title: "Other Brands", titleMn: "Бусад", order: 6 }
  ],
  "Sports Car": [
    { title: "BMW", titleMn: "BMW", order: 1 },
    { title: "Mercedes-Benz", titleMn: "Мерседес", order: 2 },
    { title: "Audi", titleMn: "Ауди", order: 3 },
    { title: "Porsche", titleMn: "Порше", order: 4 },
    { title: "Other Brands", titleMn: "Бусад", order: 5 }
  ],
  "Motorcycle": [
    { title: "Yamaha", titleMn: "Ямаха", order: 1 },
    { title: "Honda", titleMn: "Хонда", order: 2 },
    { title: "Suzuki", titleMn: "Сузуки", order: 3 },
    { title: "Kawasaki", titleMn: "Кавасаки", order: 4 },
    { title: "Other Brands", titleMn: "Бусад", order: 5 }
  ],
  "Car Parts & Accessories": [
    { title: "Engine Parts", titleMn: "Хөдөлгүүрийн сэлбэг", order: 1 },
    { title: "Body Parts", titleMn: "Биеийн сэлбэг", order: 2 },
    { title: "Tires & Wheels", titleMn: "Дугуй", order: 3 },
    { title: "Interior Accessories", titleMn: "Дотор тохижилт", order: 4 },
    { title: "Exterior Accessories", titleMn: "Гадаад тохижилт", order: 5 },
    { title: "Electronics", titleMn: "Цахилгаан", order: 6 }
  ],
  "Smartphones": [
    { title: "iPhone", titleMn: "Айфон", order: 1 },
    { title: "Samsung", titleMn: "Самсунг", order: 2 },
    { title: "Xiaomi", titleMn: "Шяоми", order: 3 },
    { title: "Other Brands", titleMn: "Бусад", order: 4 }
  ],
  "Computers & Laptops": [
    { title: "Windows Laptops", titleMn: "Виндовс ноутбук", order: 1 },
    { title: "MacBooks", titleMn: "Макбүүк", order: 2 },
    { title: "Desktops", titleMn: "Ширээний компьютер", order: 3 },
    { title: "Tablets", titleMn: "Таблет", order: 4 }
  ],
  "Men's Clothing": [
    { title: "Shirts", titleMn: "Цамц", order: 1 },
    { title: "Pants", titleMn: "Өмд", order: 2 },
    { title: "Jackets & Coats", titleMn: "Хүрэм пальто", order: 3 },
    { title: "Suits", titleMn: "Костюм", order: 4 }
  ],
  "Women's Clothing": [
    { title: "Dresses", titleMn: "Даашинз", order: 1 },
    { title: "Tops & Blouses", titleMn: "Цамц блузка", order: 2 },
    { title: "Pants & Skirts", titleMn: "Өмд банзал", order: 3 },
    { title: "Outerwear", titleMn: "Гадуур хувцас", order: 4 }
  ],
  "Shoes": [
    { title: "Sneakers", titleMn: "Пүүз", order: 1 },
    { title: "Boots", titleMn: "Гутал", order: 2 },
    { title: "Formal Shoes", titleMn: "Албан ёсны гутал", order: 3 },
    { title: "Sandals", titleMn: "Сандаал", order: 4 }
  ],
  "Book": [
    { title: "Literature", titleMn: "Уран зохиол", order: 1 },
    { title: "Art", titleMn: "Урлаг", order: 2 },
    { title: "Language Studies", titleMn: "Хэл судлал", order: 3 },
    { title: "Game Strategy", titleMn: "Тоглоомын стратеги", order: 4 },
    { title: "Entertainment", titleMn: "Зугаа цэнгэл", order: 5 }
  ]
};

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📦 Connected to MongoDB");

    // Clear existing categories
    await Category.deleteMany({});
    console.log("🗑️  Cleared existing categories");

    // Insert parent categories first
    const createdParents = await Category.insertMany(parentCategories);
    console.log(`✅ Created ${createdParents.length} parent categories`);

    // Insert subcategories with parent references
    let totalSubcategories = 0;
    for (const parent of createdParents) {
      const subs = subcategories[parent.title];
      if (subs) {
        const subsWithParent = subs.map(sub => ({
          ...sub,
          parent: parent._id
        }));
        const createdSubs = await Category.insertMany(subsWithParent);
        totalSubcategories += createdSubs.length;

        // Insert sub-subcategories with parent references
        for (const sub of createdSubs) {
          const subSubs = subSubcategories[sub.title];
          if (subSubs) {
            const subSubsWithParent = subSubs.map(subSub => ({
              ...subSub,
              parent: sub._id
            }));
            await Category.insertMany(subSubsWithParent);
          }
        }
      }
    }
    console.log(`✅ Created ${totalSubcategories} subcategories`);

    // Get total count
    const totalCount = await Category.countDocuments();
    console.log(`\n✅ Total categories created: ${totalCount}`);

    // Display hierarchy
    console.log("\n📁 Category Hierarchy:");
    const allParents = await Category.find({ parent: null }).sort({ order: 1 });
    for (const parent of allParents) {
      console.log(`\n├─ ${parent.titleMn} (${parent.title})`);
      const subs = await Category.find({ parent: parent._id }).sort({ order: 1 });
      for (let i = 0; i < subs.length; i++) {
        const sub = subs[i];
        const isLast = i === subs.length - 1;
        console.log(`${isLast ? '└─' : '├─'} ${sub.titleMn} (${sub.title})`);

        const subSubs = await Category.find({ parent: sub._id }).sort({ order: 1 });
        for (let j = 0; j < subSubs.length; j++) {
          const subSub = subSubs[j];
          const isSubLast = j === subSubs.length - 1;
          console.log(`   ${isLast ? ' ' : '│'} ${isSubLast ? '└─' : '├─'} ${subSub.titleMn} (${subSub.title})`);
        }
      }
    }

    console.log("\n🎉 Category seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    process.exit(1);
  }
};

seedCategories();
