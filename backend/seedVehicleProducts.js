require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
const Category = require('./models/Category');
const slugify = require('slugify');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected for Seeding'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

// Helper function to generate random VIN
const generateVIN = () => {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) {
    vin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return vin;
};

// Helper function for random dates
const getRandomFutureDate = (daysMin, daysMax) => {
  const days = Math.floor(Math.random() * (daysMax - daysMin + 1)) + daysMin;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// Vehicle Products Data
const vehicleProducts = [
  // 1. Ford Transit RV Camper
  {
    title: "2023 Ford Transit AWD Camper Van Truck Recreational Vehicle RV Motorhome",
    description: "Professionally converted camper van with full amenities. Perfect for road trips!",
    category: "Cars",
    brand: "Ford",
    condition: "used",
    price: 18500,
    buyNowPrice: 25000,
    reservePrice: 19000,
    minIncrement: 500,
    auctionDuration: 7,

    // Vehicle-specific
    vin: "1FBAXYY88PKA03922",
    make: "Ford",
    model: "Transit",
    year: 2023,
    mileage: 43524,
    transmission: "automatic",
    fuelType: "gasoline",
    vehicleTitle: "clean",

    // Vehicle History Report
    vehicleHistoryReport: {
      available: true,
      provider: "AutoCheck",
      reportUrl: "https://www.autocheck.com/sample-report"
    },

    // Item Specifics
    itemSpecifics: {
      "Engine Size": "3.5L V6",
      "Drivetrain": "AWD",
      "Exterior Color": "Multicolor Wrap",
      "Interior Color": "Gray",
      "Sleeping Capacity": "4 People",
      "Roof Type": "High Roof",
      "Documentation Fee": "$525.20"
    },

    // Rich Seller Description
    sellerDescription: `
      <h2>🚐 Exclusive Sale from Escape Campervans</h2>
      <p>The largest and most trusted online auction company on the world's largest auction marketplace, eBay.</p>

      <h3>Watch Videos | Specs & Features | Resources | Get Financing</h3>

      <h3>2023 Ford Transit AWD Camper Van Truck Recreational Vehicle RV Motorhome bidadoo</h3>

      <table>
        <tr>
          <th>Feature</th>
          <th>Details</th>
        </tr>
        <tr>
          <td><strong>Sleeping</strong></td>
          <td>Sleeps 4 comfortably with convertible bed system</td>
        </tr>
        <tr>
          <td><strong>Kitchen</strong></td>
          <td>2-burner stove, sink, refrigerator, storage cabinets</td>
        </tr>
        <tr>
          <td><strong>Power</strong></td>
          <td>Solar panels, house battery, inverter, shore power hookup</td>
        </tr>
        <tr>
          <td><strong>Water</strong></td>
          <td>20-gallon fresh water tank, 15-gallon gray water tank</td>
        </tr>
        <tr>
          <td><strong>Climate</strong></td>
          <td>Roof vent fan, insulated walls and ceiling, heating system</td>
        </tr>
      </table>

      <p><strong>All items must be shipped, picked up, or removed within 14 days of the end of auction</strong> (unless pre-approved via email).</p>

      <ul>
        <li>✅ Full mechanical inspection completed</li>
        <li>✅ Recent oil change and tune-up</li>
        <li>✅ New tires (less than 5,000 miles)</li>
        <li>✅ Clean title in hand</li>
        <li>✅ Ready for your next adventure!</li>
      </ul>
    `,
    images: [
      { url: "https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=800", isPrimary: true },
      { url: "https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=800", isPrimary: false },
      { url: "https://images.unsplash.com/photo-1587897773780-fe72528d5081?w=800", isPrimary: false }
    ]
  },

  // 2. Tesla Model 3
  {
    title: "2022 Tesla Model 3 Long Range AWD Electric Sedan - Autopilot",
    description: "Tesla Model 3 with Full Self-Driving capability, premium interior, and long range battery.",
    category: "Cars",
    brand: "Tesla",
    condition: "like-new",
    price: 35000,
    buyNowPrice: 42000,
    reservePrice: 37000,
    minIncrement: 1000,
    auctionDuration: 5,

    vin: "5YJ3E1EA8NF123456",
    make: "Tesla",
    model: "Model 3",
    year: 2022,
    mileage: 18500,
    transmission: "automatic",
    fuelType: "electric",
    vehicleTitle: "clean",

    vehicleHistoryReport: {
      available: true,
      provider: "Carfax",
      reportUrl: "https://www.carfax.com/sample"
    },

    itemSpecifics: {
      "Battery Range": "358 miles",
      "Drivetrain": "Dual Motor AWD",
      "Exterior Color": "Pearl White",
      "Interior Color": "Black Premium",
      "Acceleration": "0-60 mph in 4.2s",
      "Top Speed": "145 mph",
      "Autopilot": "Full Self-Driving Capable",
      "Warranty": "Remaining Factory Warranty"
    },

    sellerDescription: `
      <h2>⚡ 2022 Tesla Model 3 Long Range - Like New!</h2>
      <p>This stunning Tesla Model 3 is in pristine condition with low mileage and all premium features.</p>

      <h3>Key Features:</h3>
      <ul>
        <li>🔋 Long Range Battery - 358 miles EPA estimated range</li>
        <li>🚗 Dual Motor All-Wheel Drive</li>
        <li>🤖 Full Self-Driving Capability (FSD)</li>
        <li>📱 Premium Connectivity included</li>
        <li>🎵 Premium Audio System - 14 speakers</li>
        <li>☀️ Glass roof with UV protection</li>
        <li>🔌 Mobile charging cable included</li>
      </ul>

      <h3>Technology & Safety:</h3>
      <p>Equipped with Tesla's latest Autopilot hardware and software. Features include:</p>
      <ul>
        <li>Navigate on Autopilot</li>
        <li>Auto Lane Change</li>
        <li>Autopark</li>
        <li>Summon</li>
        <li>Full Self-Driving Computer</li>
        <li>8 Cameras, 12 Ultrasonic Sensors</li>
      </ul>

      <p><strong>Charging:</strong> Includes Mobile Connector for home charging. Access to Tesla Supercharger network.</p>
      <p><strong>Maintenance:</strong> No oil changes, minimal maintenance required. Brakes last longer due to regenerative braking.</p>
    `,
    images: [
      { url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800", isPrimary: true },
      { url: "https://images.unsplash.com/photo-1562911791-c7a97b729ec5?w=800", isPrimary: false },
      { url: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800", isPrimary: false }
    ]
  },

  // 3. Toyota Tacoma TRD Pro
  {
    title: "2021 Toyota Tacoma TRD Pro 4x4 Off-Road Pickup Truck",
    description: "Rugged off-road pickup with TRD Pro package, lifted suspension, and premium features.",
    category: "Cars",
    brand: "Toyota",
    condition: "used",
    price: 28000,
    buyNowPrice: 35000,
    reservePrice: 30000,
    minIncrement: 750,
    auctionDuration: 7,

    vin: generateVIN(),
    make: "Toyota",
    model: "Tacoma TRD Pro",
    year: 2021,
    mileage: 35200,
    transmission: "manual",
    fuelType: "gasoline",
    vehicleTitle: "clean",

    vehicleHistoryReport: {
      available: true,
      provider: "AutoCheck"
    },

    itemSpecifics: {
      "Engine": "3.5L V6 DOHC",
      "Horsepower": "278 hp",
      "Drivetrain": "4WD",
      "Bed Length": "5 ft",
      "Cab Type": "Double Cab",
      "Exterior Color": "Army Green",
      "Interior Color": "Black w/ TRD Logos",
      "Suspension": "TRD-Tuned Fox Shocks"
    },

    sellerDescription: `
      <h2>🏔️ 2021 Toyota Tacoma TRD Pro - Ultimate Off-Road Machine</h2>
      <p>This TRD Pro is ready for any adventure with factory off-road upgrades and rugged reliability.</p>

      <h3>TRD Pro Features:</h3>
      <ul>
        <li>Fox 2.5" Internal Bypass Shocks</li>
        <li>TRD Pro Skid Plate</li>
        <li>1.25" Front Lift</li>
        <li>Rigid Industries LED Fog Lights</li>
        <li>TRD Pro Wheels (16" Black Alloy)</li>
        <li>Goodyear Wrangler All-Terrain Tires</li>
        <li>TRD Cat-Back Exhaust</li>
      </ul>

      <h3>Interior Comfort:</h3>
      <ul>
        <li>Premium JBL Audio with Subwoofer</li>
        <li>Heated Front Seats</li>
        <li>Leather-Trimmed Seats with TRD Logo</li>
        <li>8" Touchscreen with Navigation</li>
        <li>Dual Zone Climate Control</li>
      </ul>

      <p><strong>Modifications:</strong> Bed liner installed, tonneau cover included, LED light bar (removable).</p>
    `,
    images: [
      { url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800", isPrimary: true },
      { url: "https://images.unsplash.com/photo-1612710747893-0b1c00a3fb6e?w=800", isPrimary: false }
    ]
  },

  // 4. BMW 5 Series
  {
    title: "2020 BMW 530i xDrive Luxury Sedan - M Sport Package",
    description: "Elegant luxury sedan with M Sport package, premium technology, and all-wheel drive.",
    category: "Cars",
    brand: "BMW",
    condition: "used",
    price: 32000,
    buyNowPrice: 38000,
    reservePrice: 33500,
    minIncrement: 500,
    auctionDuration: 5,

    vin: generateVIN(),
    make: "BMW",
    model: "530i xDrive",
    year: 2020,
    mileage: 28400,
    transmission: "automatic",
    fuelType: "gasoline",
    vehicleTitle: "clean",

    vehicleHistoryReport: {
      available: true,
      provider: "Carfax",
      reportUrl: "https://www.carfax.com/sample"
    },

    itemSpecifics: {
      "Engine": "2.0L TwinPower Turbo I4",
      "Horsepower": "248 hp",
      "Drivetrain": "xDrive AWD",
      "Transmission": "8-Speed Automatic",
      "Exterior Color": "Alpine White",
      "Interior Color": "Black Vernasca Leather",
      "Package": "M Sport, Premium, Convenience"
    },

    sellerDescription: `
      <h2>🏁 2020 BMW 530i xDrive - M Sport Excellence</h2>
      <p>Sophisticated luxury sedan combining performance, comfort, and cutting-edge technology.</p>

      <h3>M Sport Package Includes:</h3>
      <ul>
        <li>M Sport Suspension</li>
        <li>18" M Double-Spoke Wheels</li>
        <li>Aerodynamic Kit</li>
        <li>Sport Seats</li>
        <li>M Sport Steering Wheel</li>
      </ul>

      <h3>Premium Features:</h3>
      <ul>
        <li>Panoramic Moonroof</li>
        <li>Harman Kardon Surround Sound</li>
        <li>Gesture Control</li>
        <li>Wireless Apple CarPlay</li>
        <li>Head-Up Display</li>
        <li>360° Camera System</li>
        <li>Parking Assistance Plus</li>
      </ul>

      <p><strong>Service History:</strong> All maintenance performed at BMW dealership. Records available.</p>
    `,
    images: [
      { url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800", isPrimary: true },
      { url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800", isPrimary: false }
    ]
  },

  // 5. Honda CR-V
  {
    title: "2022 Honda CR-V EX-L AWD SUV - One Owner, Low Miles",
    description: "Reliable family SUV with leather interior, sunroof, and advanced safety features.",
    category: "Cars",
    brand: "Honda",
    condition: "like-new",
    price: 24000,
    buyNowPrice: 28500,
    reservePrice: 25000,
    minIncrement: 500,
    auctionDuration: 5,

    vin: generateVIN(),
    make: "Honda",
    model: "CR-V EX-L",
    year: 2022,
    mileage: 15800,
    transmission: "cvt",
    fuelType: "gasoline",
    vehicleTitle: "clean",

    vehicleHistoryReport: {
      available: true,
      provider: "AutoCheck"
    },

    itemSpecifics: {
      "Engine": "1.5L Turbocharged I4",
      "Horsepower": "190 hp",
      "Drivetrain": "Real Time AWD",
      "MPG": "28 City / 34 Highway",
      "Seating": "5 Passengers",
      "Exterior Color": "Crystal Black Pearl",
      "Interior Color": "Black Leather"
    },

    sellerDescription: `
      <h2>🚙 2022 Honda CR-V EX-L - Perfect Family SUV</h2>
      <p>One-owner vehicle with excellent fuel economy and Honda reliability.</p>

      <h3>Comfort & Convenience:</h3>
      <ul>
        <li>Leather-Trimmed Seats</li>
        <li>Heated Front Seats</li>
        <li>Power Moonroof</li>
        <li>Dual-Zone Climate Control</li>
        <li>Remote Engine Start</li>
        <li>Smart Entry with Push Button Start</li>
      </ul>

      <h3>Honda Sensing® Safety:</h3>
      <ul>
        <li>Collision Mitigation Braking System</li>
        <li>Road Departure Mitigation</li>
        <li>Adaptive Cruise Control</li>
        <li>Lane Keeping Assist</li>
        <li>Blind Spot Information System</li>
      </ul>

      <p><strong>Warranty:</strong> Remainder of factory warranty still active!</p>
    `,
    images: [
      { url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800", isPrimary: true }
    ]
  },

  // 6. Mercedes-Benz GLE
  {
    title: "2021 Mercedes-Benz GLE 350 4MATIC Luxury SUV - AMG Line",
    description: "Premium luxury SUV with AMG styling, advanced tech, and commanding presence.",
    category: "Cars",
    brand: "Mercedes-Benz",
    condition: "used",
    price: 42000,
    buyNowPrice: 52000,
    reservePrice: 45000,
    minIncrement: 1000,
    auctionDuration: 7,

    vin: generateVIN(),
    make: "Mercedes-Benz",
    model: "GLE 350",
    year: 2021,
    mileage: 22100,
    transmission: "automatic",
    fuelType: "gasoline",
    vehicleTitle: "clean",

    vehicleHistoryReport: {
      available: true,
      provider: "Carfax"
    },

    itemSpecifics: {
      "Engine": "2.0L Turbo I4 + EQ Boost",
      "Horsepower": "255 hp + 21 hp EQ Boost",
      "Drivetrain": "4MATIC AWD",
      "Transmission": "9-Speed Automatic",
      "Seating": "5 Passengers",
      "Exterior Color": "Obsidian Black Metallic",
      "Interior Color": "Saddle Brown Leather"
    },

    sellerDescription: `
      <h2>⭐ 2021 Mercedes-Benz GLE 350 - Ultimate Luxury</h2>
      <p>Experience Mercedes-Benz luxury with cutting-edge technology and refined performance.</p>

      <h3>AMG Line Package:</h3>
      <ul>
        <li>AMG Bodystyling</li>
        <li>AMG 20" Wheels</li>
        <li>Sport Suspension</li>
        <li>AMG Floor Mats</li>
      </ul>

      <h3>Technology & Safety:</h3>
      <ul>
        <li>MBUX Infotainment with Dual 12.3" Screens</li>
        <li>"Hey Mercedes" Voice Control</li>
        <li>Burmester Surround Sound</li>
        <li>Panoramic Sunroof</li>
        <li>Active Distance Assist DISTRONIC</li>
        <li>Active Steering Assist</li>
        <li>360° Camera</li>
        <li>Air Body Control Suspension</li>
      </ul>

      <p><strong>Condition:</strong> Meticulously maintained with all service records. Garage kept.</p>
    `,
    images: [
      { url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800", isPrimary: true }
    ]
  },

  // 7. Jeep Wrangler Rubicon
  {
    title: "2023 Jeep Wrangler Rubicon Unlimited 4x4 - Lifted, Custom Build",
    description: "Ultimate off-road machine with lift kit, 35\" tires, and extensive modifications.",
    category: "Cars",
    brand: "Jeep",
    condition: "used",
    price: 38000,
    buyNowPrice: 48000,
    reservePrice: 40000,
    minIncrement: 1000,
    auctionDuration: 7,

    vin: generateVIN(),
    make: "Jeep",
    model: "Wrangler Rubicon",
    year: 2023,
    mileage: 12500,
    transmission: "automatic",
    fuelType: "gasoline",
    vehicleTitle: "clean",

    vehicleHistoryReport: {
      available: true,
      provider: "AutoCheck"
    },

    itemSpecifics: {
      "Engine": "3.6L V6",
      "Horsepower": "285 hp",
      "Drivetrain": "4WD w/ 4:1 Transfer Case",
      "Axles": "Dana 44 Front & Rear",
      "Lift": "3.5\" Lift Kit",
      "Tires": "35x12.5R17 BFGoodrich KM3",
      "Exterior Color": "Hydro Blue",
      "Interior Color": "Black Leather"
    },

    sellerDescription: `
      <h2>🏜️ 2023 Jeep Wrangler Rubicon - Trail Ready!</h2>
      <p>Fully built Rubicon with professional modifications for serious off-roading.</p>

      <h3>Modifications ($15,000+ invested):</h3>
      <ul>
        <li>✅ 3.5" TeraFlex Suspension Lift</li>
        <li>✅ 35" BFGoodrich KM3 Mud-Terrain Tires</li>
        <li>✅ 17" Method Race Wheels</li>
        <li>✅ Warn Zeon 10-S Winch (10,000 lbs)</li>
        <li>✅ Steel Front Bumper with D-Ring Mounts</li>
        <li>✅ Rock Sliders</li>
        <li>✅ 50" LED Light Bar + Pods</li>
        <li>✅ Snorkel Intake</li>
        <li>✅ Skid Plate Protection</li>
      </ul>

      <h3>Factory Rubicon Features:</h3>
      <ul>
        <li>Electronic Locking Differentials (Front & Rear)</li>
        <li>Electronic Sway Bar Disconnect</li>
        <li>Rock-Trac 4WD System</li>
        <li>Removable Top & Doors</li>
        <li>8.4" Uconnect Touchscreen</li>
        <li>Alpine Premium Audio</li>
        <li>Leather Seats with Heating</li>
      </ul>

      <p><strong>Warranty:</strong> Factory warranty still valid. All mods professionally installed with receipts.</p>
    `,
    images: [
      { url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800", isPrimary: true }
    ]
  },

  // 8. Porsche 911
  {
    title: "2019 Porsche 911 Carrera S Coupe - Sports Exhaust, Low Miles",
    description: "Iconic sports car with premium options, immaculate condition, and thrilling performance.",
    category: "Cars",
    brand: "Porsche",
    condition: "like-new",
    price: 85000,
    buyNowPrice: 98000,
    reservePrice: 88000,
    minIncrement: 2000,
    auctionDuration: 7,

    vin: generateVIN(),
    make: "Porsche",
    model: "911 Carrera S",
    year: 2019,
    mileage: 9800,
    transmission: "automatic",
    fuelType: "gasoline",
    vehicleTitle: "clean",

    vehicleHistoryReport: {
      available: true,
      provider: "Carfax"
    },

    itemSpecifics: {
      "Engine": "3.0L Twin-Turbo Flat-6",
      "Horsepower": "443 hp",
      "Torque": "390 lb-ft",
      "0-60 mph": "3.3 seconds",
      "Top Speed": "191 mph",
      "Transmission": "8-Speed PDK",
      "Exterior Color": "GT Silver Metallic",
      "Interior Color": "Black w/ Carmine Red Stitching"
    },

    sellerDescription: `
      <h2>🏎️ 2019 Porsche 911 Carrera S - Pure Performance</h2>
      <p>Legendary sports car with low miles and extensive options. Adult owned, garage kept.</p>

      <h3>Performance Options ($20,000+):</h3>
      <ul>
        <li>Sport Chrono Package</li>
        <li>Sport Exhaust System (PSE)</li>
        <li>Porsche Active Suspension Management (PASM)</li>
        <li>20/21" Carrera S Wheels</li>
        <li>Sport Design Steering Wheel</li>
        <li>Porsche Torque Vectoring Plus (PTV+)</li>
      </ul>

      <h3>Luxury & Technology:</h3>
      <ul>
        <li>Premium Package Plus</li>
        <li>18-Way Adaptive Sport Seats</li>
        <li>Burmester High-End Surround Sound</li>
        <li>Porsche Communication Management (PCM)</li>
        <li>LED Matrix Headlights with PDLS+</li>
        <li>Lane Change Assist</li>
        <li>Park Assist (Front & Rear)</li>
      </ul>

      <p><strong>Service:</strong> All service performed at Porsche dealership. Never tracked. Non-smoker.</p>
      <p><strong>Documentation:</strong> Original window sticker, all keys, manuals, and service records included.</p>
    `,
    images: [
      { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800", isPrimary: true }
    ]
  },

  // 9. Chevrolet Silverado
  {
    title: "2022 Chevrolet Silverado 2500HD LTZ Crew Cab 4WD Diesel - Tow Package",
    description: "Heavy-duty diesel truck with max towing capacity and luxury features.",
    category: "Cars",
    brand: "Chevrolet",
    condition: "used",
    price: 42000,
    buyNowPrice: 52000,
    minIncrement: 1000,
    auctionDuration: 7,

    vin: generateVIN(),
    make: "Chevrolet",
    model: "Silverado 2500HD",
    year: 2022,
    mileage: 28900,
    transmission: "automatic",
    fuelType: "diesel",
    vehicleTitle: "clean",

    vehicleHistoryReport: {
      available: false,
      provider: "N/A"
    },

    itemSpecifics: {
      "Engine": "6.6L Duramax Turbo-Diesel V8",
      "Horsepower": "445 hp",
      "Torque": "910 lb-ft",
      "Towing Capacity": "18,510 lbs",
      "Payload": "3,979 lbs",
      "Bed Length": "6.75 ft",
      "Exterior Color": "Satin Steel Metallic",
      "Interior Color": "Jet Black Leather"
    },

    sellerDescription: `
      <h2>💪 2022 Silverado 2500HD - Ultimate Towing Machine</h2>
      <p>Heavy-duty diesel truck ready for any job. Perfect for towing RVs, boats, or trailers.</p>

      <h3>Towing & Capability:</h3>
      <ul>
        <li>Duramax 6.6L Turbo-Diesel Engine</li>
        <li>Allison 10-Speed Automatic Transmission</li>
        <li>Max Trailering Package</li>
        <li>Integrated Trailer Brake Controller</li>
        <li>HD Trailering Camera System</li>
        <li>Trailer Tire Pressure Monitoring</li>
        <li>Gooseneck/5th Wheel Prep</li>
      </ul>

      <h3>LTZ Luxury Features:</h3>
      <ul>
        <li>Leather-Appointed Seats</li>
        <li>Heated & Ventilated Front Seats</li>
        <li>Bose Premium Audio</li>
        <li>Wireless Apple CarPlay & Android Auto</li>
        <li>Dual-Zone Climate Control</li>
        <li>Remote Start</li>
        <li>Power Sliding Rear Window</li>
      </ul>
    `,
    images: [
      { url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800", isPrimary: true }
    ]
  },

  // 10. Audi Q5
  {
    title: "2021 Audi Q5 Premium Plus Quattro - S-Line, Panoramic Roof",
    description: "Sophisticated luxury SUV with S-Line package and advanced technology.",
    category: "Cars",
    brand: "Audi",
    condition: "used",
    price: 35000,
    buyNowPrice: 42000,
    minIncrement: 750,
    auctionDuration: 5,

    vin: generateVIN(),
    make: "Audi",
    model: "Q5 Premium Plus",
    year: 2021,
    mileage: 24600,
    transmission: "automatic",
    fuelType: "gasoline",
    vehicleTitle: "clean",

    vehicleHistoryReport: {
      available: true,
      provider: "Carfax"
    },

    itemSpecifics: {
      "Engine": "2.0L TFSI Turbocharged I4",
      "Horsepower": "248 hp",
      "Drivetrain": "Quattro AWD",
      "MPG": "23 City / 28 Highway",
      "Exterior Color": "Navarra Blue Metallic",
      "Interior Color": "Black/Beige Leather",
      "Wheels": "20\" S-Line Design"
    },

    sellerDescription: `
      <h2>🔷 2021 Audi Q5 - Refined Luxury</h2>
      <p>Premium SUV combining Audi's legendary Quattro system with modern luxury.</p>

      <h3>S-Line Package:</h3>
      <ul>
        <li>S-Line Exterior Styling</li>
        <li>S-Line Sport Seats</li>
        <li>20" Wheels</li>
        <li>Sport Suspension</li>
      </ul>

      <h3>Premium Plus Features:</h3>
      <ul>
        <li>Virtual Cockpit Plus (12.3" Digital Display)</li>
        <li>MMI Navigation Plus</li>
        <li>Bang & Olufsen 3D Sound System</li>
        <li>Panoramic Sunroof</li>
        <li>Power Tailgate</li>
        <li>Wireless Phone Charging</li>
        <li>Audi Pre-Sense Front & Rear</li>
      </ul>
    `,
    images: [
      { url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800", isPrimary: true }
    ]
  }
];

// Main seeding function
const seedVehicles = async () => {
  try {
    console.log('🚀 Starting Vehicle Product Seeding...\n');

    // Get all users
    const users = await User.find({});
    if (users.length === 0) {
      console.log('❌ No users found in database. Please create users first.');
      process.exit(1);
    }

    console.log(`✅ Found ${users.length} users in database\n`);

    // Find the "Cars" category
    const carsCategory = await Category.findOne({
      title: 'Cars',
      parent: { $ne: null }  // Ensure it's a subcategory
    });

    if (!carsCategory) {
      console.log('❌ "Cars" category not found in database.');
      console.log('Please run the Mongolian categories seeder first: node seedMongolianCategories.js');
      process.exit(1);
    }

    console.log(`✅ Found "Cars" category: ${carsCategory.title} (${carsCategory.titleMn})`);
    console.log(`   Category ID: ${carsCategory._id}\n`);

    // Create products
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < vehicleProducts.length; i++) {
      try {
        // Assign random user to each product
        const randomUser = users[Math.floor(Math.random() * users.length)];

        // Calculate auction dates
        const auctionStart = new Date();
        const bidDeadline = new Date();
        bidDeadline.setDate(bidDeadline.getDate() + vehicleProducts[i].auctionDuration);

        // Generate unique slug
        const baseSlug = slugify(vehicleProducts[i].title, { lower: true, strict: true });
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 7);
        const uniqueSlug = `${baseSlug}-${timestamp}-${randomSuffix}`;

        const productData = {
          ...vehicleProducts[i],
          category: carsCategory._id,  // Use ObjectId instead of string
          slug: uniqueSlug,
          user: randomUser._id,
          auctionStart,
          bidDeadline,
          startMode: 'immediate',
          auctionStatus: 'active',
          available: true,
          verified: true,
          sold: false,
          currentBid: vehicleProducts[i].price
        };

        const product = new Product(productData);
        await product.save();

        successCount++;
        console.log(`✅ [${successCount}/${vehicleProducts.length}] Created: ${product.title}`);
        console.log(`   - VIN: ${product.vin}`);
        console.log(`   - Make: ${product.make} ${product.model} (${product.year})`);
        console.log(`   - Price: $${product.price.toLocaleString()}`);
        console.log(`   - Seller: ${randomUser.name}`);
        console.log('');
      } catch (error) {
        errorCount++;
        console.error(`❌ Error creating product ${i + 1}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Seeding Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created: ${successCount} products`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`👥 Users in database: ${users.length}`);
    console.log('='.repeat(60));
    console.log('\n🎉 Vehicle seeding completed!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  }
};

// Run seeder
seedVehicles();
