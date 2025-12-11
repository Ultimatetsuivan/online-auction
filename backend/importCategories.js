const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auction')
  .then(async () => {
    const Category = require('./models/Category');

    // Read category.json
    const categoriesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'category.json'), 'utf-8')
    );

    console.log('Starting category import...\n');

    for (const catData of categoriesData) {
      try {
        // Create or find parent category
        let parentCategory = await Category.findOne({
          title: catData.mainCategory
        });

        if (!parentCategory) {
          parentCategory = await Category.create({
            title: catData.mainCategory,
            titleMn: catData.mainCategory, // You can translate these later
            description: `${catData.mainCategory} category`,
            icon: 'cube',
            parent: null,
            order: 0,
            isActive: true
          });
          console.log(`✓ Created parent category: ${catData.mainCategory}`);
        } else {
          console.log(`- Parent category exists: ${catData.mainCategory}`);
        }

        // Create subcategories
        for (const subCat of catData.subCategories) {
          const existingSub = await Category.findOne({
            title: subCat,
            parent: parentCategory._id
          });

          if (!existingSub) {
            await Category.create({
              title: subCat,
              titleMn: subCat, // You can translate these later
              description: `${subCat} subcategory`,
              icon: 'cube',
              parent: parentCategory._id,
              order: 0,
              isActive: true
            });
            console.log(`  ✓ Created subcategory: ${subCat}`);
          } else {
            console.log(`  - Subcategory exists: ${subCat}`);
          }
        }

        console.log('');
      } catch (error) {
        console.error(`Error processing ${catData.mainCategory}:`, error.message);
      }
    }

    console.log('\nCategory import completed!');

    // Show final count
    const totalCategories = await Category.countDocuments();
    const parentCategories = await Category.countDocuments({ parent: null });
    const subCategories = await Category.countDocuments({ parent: { $ne: null } });

    console.log(`\nTotal categories: ${totalCategories}`);
    console.log(`Parent categories: ${parentCategories}`);
    console.log(`Subcategories: ${subCategories}`);

    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });
