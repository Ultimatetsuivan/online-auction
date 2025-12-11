const mongoose = require('mongoose');
const LegalDocument = require('./models/LegalDocument');
require('dotenv').config();

const seedEULA = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if EULA already exists
        const existingEULA = await LegalDocument.findOne({ type: 'eula', isActive: true });

        if (existingEULA) {
            console.log('Active EULA already exists:', existingEULA.version);
            console.log('Skipping seed...');
            process.exit(0);
        }

        // Create default EULA
        const eula = await LegalDocument.create({
            type: 'eula',
            version: '1.0',
            title: 'End User License Agreement',
            titleMn: 'Хэрэглэгчийн гэрээ',
            content: `
<h2>End User License Agreement</h2>

<h3>1. Acceptance of Terms</h3>
<p>By accessing and using this auction platform, you accept and agree to be bound by the terms and provisions of this agreement.</p>

<h3>2. Use License</h3>
<p>Permission is granted to temporarily access the platform for personal, non-commercial transitory viewing only.</p>

<h3>3. User Responsibilities</h3>
<p>Users must provide accurate information and maintain the confidentiality of their account credentials.</p>

<h3>4. Auction Rules</h3>
<p>All bids are binding. Winners must complete payment within the specified timeframe.</p>

<h3>5. Prohibited Activities</h3>
<p>Users may not engage in fraudulent bidding, spam, or any activity that disrupts the platform.</p>

<h3>6. Privacy</h3>
<p>We collect and process user data in accordance with our Privacy Policy.</p>

<h3>7. Limitation of Liability</h3>
<p>The platform is provided "as is" without warranties of any kind.</p>

<h3>8. Changes to Terms</h3>
<p>We reserve the right to modify these terms at any time.</p>

<h3>9. Contact Information</h3>
<p>For questions about this agreement, please contact us through the platform.</p>
            `,
            contentMn: `
<h2>Хэрэглэгчийн гэрээ</h2>

<h3>1. Нөхцлийг хүлээн зөвшөөрөх</h3>
<p>Энэхүү дуудлага худалдааны платформд нэвтэрч, ашиглах замаар та энэ гэрээний нөхцөл, заалтуудыг хүлээн зөвшөөрч байна.</p>

<h3>2. Ашиглалтын зөвшөөрөл</h3>
<p>Хувийн, арилжааны бус зорилгоор түр хугацаагаар платформд нэвтрэх зөвшөөрөл олгогдоно.</p>

<h3>3. Хэрэглэгчийн үүрэг хариуцлага</h3>
<p>Хэрэглэгчид үнэн зөв мэдээлэл өгч, өөрийн бүртгэлийн нууц үгийг нууцлах ёстой.</p>

<h3>4. Дуудлага худалдааны дүрэм</h3>
<p>Бүх санал өгөлт хүчинтэй байна. Ялагчид тогтоосон хугацаанд төлбөрөө хийх ёстой.</p>

<h3>5. Хориотой үйл ажиллагаа</h3>
<p>Хэрэглэгчид залилан худал санал өгөх, spam илгээх болон платформыг саатуулах үйл ажиллагаа явуулахыг хориглоно.</p>

<h3>6. Нууцлал</h3>
<p>Бид хэрэглэгчийн өгөгдлийг Нууцлалын бодлогын дагуу цуглуулж боловсруулна.</p>

<h3>7. Хариуцлагын хязгаарлалт</h3>
<p>Платформ нь "있는 그대로" ямар нэгэн баталгаагүйгээр үзүүлэгдэнэ.</p>

<h3>8. Нөхцлийн өөрчлөлт</h3>
<p>Бид эдгээр нөхцлийг хэзээ ч өөрчлөх эрхтэй.</p>

<h3>9. Холбоо барих мэдээлэл</h3>
<p>Энэ гэрээтэй холбоотой асуултаа платформоор дамжуулан бидэнтэй холбогдоно уу.</p>
            `,
            effectiveDate: new Date(),
            isActive: true
        });

        console.log('✅ EULA created successfully!');
        console.log('Version:', eula.version);
        console.log('Title (MN):', eula.titleMn);
        console.log('\nYou can now use the mobile app to register with EULA acceptance.');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding EULA:', error);
        process.exit(1);
    }
};

seedEULA();
