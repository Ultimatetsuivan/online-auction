const mongoose = require("mongoose");
const Category = require("../models/Category");
require("dotenv").config();

const addCarCategory = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📦 Connected to MongoDB");

    // Check if Cars category already exists
    const existingCars = await Category.findOne({ title: "Cars" });
    if (existingCars) {
      console.log("✅ Cars category already exists!");
      process.exit(0);
    }

    // Create parent Cars category
    const carsCategory = await Category.create({
      title: "Cars",
      titleMn: "Машин",
      icon: "car-outline",
      description: "Машин, авто машин, автомашины сэлбэг хэрэгсэл",
      order: 0
    });
    console.log("✅ Created Cars parent category");

    // Create subcategories
    const subcategories = [
      { title: "Sedan", titleMn: "Седан", icon: "car-sport-outline", order: 1 },
      { title: "SUV", titleMn: "SUV", icon: "car-outline", order: 2 },
      { title: "Truck", titleMn: "Ачааны машин", icon: "car-sport-outline", order: 3 },
      { title: "Sports Car", titleMn: "Спортын машин", icon: "speedometer-outline", order: 4 },
      { title: "Motorcycle", titleMn: "Мотоцикл", icon: "bicycle-outline", order: 5 },
      { title: "Car Parts & Accessories", titleMn: "Сэлбэг хэрэгсэл", icon: "construct-outline", order: 6 }
    ];

    const createdSubs = await Category.insertMany(
      subcategories.map(sub => ({
        ...sub,
        parent: carsCategory._id
      }))
    );
    console.log(`✅ Created ${createdSubs.length} car subcategories`);

    // Create sub-subcategories for Sedan
    const sedanSubs = [
      { title: "Toyota", titleMn: "Тойота", order: 1 },
      { title: "Honda", titleMn: "Хонда", order: 2 },
      { title: "Nissan", titleMn: "Ниссан", order: 3 },
      { title: "Hyundai", titleMn: "Хюндай", order: 4 },
      { title: "Kia", titleMn: "Киа", order: 5 },
      { title: "Other Brands", titleMn: "Бусад", order: 6 }
    ];
    const sedanCategory = createdSubs.find(s => s.title === "Sedan");
    if (sedanCategory) {
      await Category.insertMany(
        sedanSubs.map(sub => ({
          ...sub,
          parent: sedanCategory._id
        }))
      );
      console.log("✅ Created Sedan subcategories");
    }

    // Create sub-subcategories for SUV
    const suvSubs = [
      { title: "Toyota", titleMn: "Тойота", order: 1 },
      { title: "Honda", titleMn: "Хонда", order: 2 },
      { title: "Nissan", titleMn: "Ниссан", order: 3 },
      { title: "Hyundai", titleMn: "Хюндай", order: 4 },
      { title: "Kia", titleMn: "Киа", order: 5 },
      { title: "BMW", titleMn: "BMW", order: 6 },
      { title: "Mercedes-Benz", titleMn: "Мерседес", order: 7 },
      { title: "Other Brands", titleMn: "Бусад", order: 8 }
    ];
    const suvCategory = createdSubs.find(s => s.title === "SUV");
    if (suvCategory) {
      await Category.insertMany(
        suvSubs.map(sub => ({
          ...sub,
          parent: suvCategory._id
        }))
      );
      console.log("✅ Created SUV subcategories");
    }

    // Create sub-subcategories for Truck
    const truckSubs = [
      { title: "Pickup Truck", titleMn: "Пикап", order: 1 },
      { title: "Commercial Truck", titleMn: "Ачааны машин", order: 2 },
      { title: "Toyota", titleMn: "Тойота", order: 3 },
      { title: "Ford", titleMn: "Форд", order: 4 },
      { title: "Isuzu", titleMn: "Исузу", order: 5 },
      { title: "Other Brands", titleMn: "Бусад", order: 6 }
    ];
    const truckCategory = createdSubs.find(s => s.title === "Truck");
    if (truckCategory) {
      await Category.insertMany(
        truckSubs.map(sub => ({
          ...sub,
          parent: truckCategory._id
        }))
      );
      console.log("✅ Created Truck subcategories");
    }

    // Create sub-subcategories for Sports Car
    const sportsCarSubs = [
      { title: "BMW", titleMn: "BMW", order: 1 },
      { title: "Mercedes-Benz", titleMn: "Мерседес", order: 2 },
      { title: "Audi", titleMn: "Ауди", order: 3 },
      { title: "Porsche", titleMn: "Порше", order: 4 },
      { title: "Other Brands", titleMn: "Бусад", order: 5 }
    ];
    const sportsCarCategory = createdSubs.find(s => s.title === "Sports Car");
    if (sportsCarCategory) {
      await Category.insertMany(
        sportsCarSubs.map(sub => ({
          ...sub,
          parent: sportsCarCategory._id
        }))
      );
      console.log("✅ Created Sports Car subcategories");
    }

    // Create sub-subcategories for Motorcycle
    const motorcycleSubs = [
      { title: "Yamaha", titleMn: "Ямаха", order: 1 },
      { title: "Honda", titleMn: "Хонда", order: 2 },
      { title: "Suzuki", titleMn: "Сузуки", order: 3 },
      { title: "Kawasaki", titleMn: "Кавасаки", order: 4 },
      { title: "Other Brands", titleMn: "Бусад", order: 5 }
    ];
    const motorcycleCategory = createdSubs.find(s => s.title === "Motorcycle");
    if (motorcycleCategory) {
      await Category.insertMany(
        motorcycleSubs.map(sub => ({
          ...sub,
          parent: motorcycleCategory._id
        }))
      );
      console.log("✅ Created Motorcycle subcategories");
    }

    // Create sub-subcategories for Car Parts & Accessories
    const partsSubs = [
      { title: "Engine Parts", titleMn: "Хөдөлгүүрийн сэлбэг", order: 1 },
      { title: "Body Parts", titleMn: "Биеийн сэлбэг", order: 2 },
      { title: "Tires & Wheels", titleMn: "Дугуй", order: 3 },
      { title: "Interior Accessories", titleMn: "Дотор тохижилт", order: 4 },
      { title: "Exterior Accessories", titleMn: "Гадаад тохижилт", order: 5 },
      { title: "Electronics", titleMn: "Цахилгаан", order: 6 }
    ];
    const partsCategory = createdSubs.find(s => s.title === "Car Parts & Accessories");
    if (partsCategory) {
      await Category.insertMany(
        partsSubs.map(sub => ({
          ...sub,
          parent: partsCategory._id
        }))
      );
      console.log("✅ Created Car Parts & Accessories subcategories");
    }

    console.log("\n🎉 Car category added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding car category:", error);
    process.exit(1);
  }
};

addCarCategory();

