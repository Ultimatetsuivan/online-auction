const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auction')
  .then(async () => {
    const Category = require('./models/Category');
    const categories = await Category.find({}).populate('parent').lean();

    console.log('\n=== ALL CATEGORIES ===\n');
    categories.forEach(cat => {
      console.log(`ID: ${cat._id}`);
      console.log(`Title: ${cat.title} / ${cat.titleMn}`);
      console.log(`Parent: ${cat.parent ? (cat.parent._id || cat.parent) : 'None (Root)'}`);
      if (cat.parent && cat.parent.title) {
        console.log(`Parent Name: ${cat.parent.title}`);
      }
      console.log('---');
    });

    // Find Electronics and Clothing
    const electronics = categories.find(c => c.title === 'Electronics');
    const clothing = categories.find(c => c.title === 'Clothing');

    console.log('\n=== ELECTRONICS INFO ===');
    if (electronics) {
      console.log(`ID: ${electronics._id}`);
      const electronicsChildren = categories.filter(c => {
        if (!c.parent) return false;
        const parentId = c.parent._id ? c.parent._id.toString() : c.parent.toString();
        return parentId === electronics._id.toString();
      });
      console.log(`Children count: ${electronicsChildren.length}`);
      electronicsChildren.forEach(child => {
        console.log(`  - ${child.title} / ${child.titleMn}`);
      });
    } else {
      console.log('Electronics category not found');
    }

    console.log('\n=== CLOTHING INFO ===');
    if (clothing) {
      console.log(`ID: ${clothing._id}`);
      const clothingChildren = categories.filter(c => {
        if (!c.parent) return false;
        const parentId = c.parent._id ? c.parent._id.toString() : c.parent.toString();
        return parentId === clothing._id.toString();
      });
      console.log(`Children count: ${clothingChildren.length}`);
      clothingChildren.forEach(child => {
        console.log(`  - ${child.title} / ${child.titleMn}`);
      });
    } else {
      console.log('Clothing category not found');
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
