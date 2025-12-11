const axios = require('axios');

axios.get('http://localhost:5000/api/category/')
  .then(response => {
    const data = response.data;
    const parents = data.filter(c => !c.parent || (typeof c.parent === 'object' && c.parent === null));
    const subcategories = data.length - parents.length;

    console.log('\n📊 Category Verification:');
    console.log(`Total categories: ${data.length}`);
    console.log(`Parent categories: ${parents.length}`);
    console.log(`Subcategories: ${subcategories}`);
    console.log('\n✅ All categories loaded successfully!');
  })
  .catch(err => {
    console.error('Error:', err.message);
  });
