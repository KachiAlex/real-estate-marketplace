// Quick seed script that creates properties without authentication
// This script uses the database directly and creates a mock vendor and properties

const db = require('../config/sequelizeDb');
const bcrypt = require('bcryptjs');

// Simple property data
const properties = [
  {
    title: "Modern 3-Bedroom Apartment in Lekki",
    description: "A beautiful modern apartment with stunning views of the Lekki coastline. Features high-end finishes, spacious living areas, and access to premium amenities.",
    category: "residential",
    type: "apartment",
    bedrooms: 3,
    bathrooms: 2,
    area: 1200,
    price: 45000000,
    currency: "NGN",
    monthly_rent: 800000,
    city: "Lagos",
    state: "Lagos State",
    address: "Plot 123, Lekki Phase 1, Lagos",
    location: { latitude: 6.4667, longitude: 3.5667 },
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"],
    featuredImage: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
    amenities: ["Swimming Pool", "Gym", "24/7 Security", "Parking"],
    yearBuilt: 2020,
    parkingSpaces: 2,
    status: "active",
    approvalStatus: "approved",
    verificationStatus: "approved"
  },
  {
    title: "Luxury 5-Bedroom Villa in Ikoyi",
    description: "An exquisite luxury villa in the heart of Ikoyi with 5 spacious bedrooms, home cinema, wine cellar, and beautifully landscaped gardens.",
    category: "residential",
    type: "house",
    bedrooms: 5,
    bathrooms: 4,
    area: 3500,
    price: 150000000,
    currency: "NGN",
    city: "Lagos",
    state: "Lagos State",
    address: "45 Glover Road, Ikoyi, Lagos",
    location: { latitude: 6.4531, longitude: 3.4331 },
    images: ["https://images.unsplash.com/photo-1600596542815-ffad416153a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"],
    featuredImage: "https://images.unsplash.com/photo-1600596542815-ffad416153a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
    amenities: ["Swimming Pool", "Gym", "Home Cinema", "Wine Cellar", "Garden"],
    yearBuilt: 2019,
    parkingSpaces: 4,
    status: "active",
    approvalStatus: "approved",
    verificationStatus: "approved"
  },
  {
    title: "Commercial Office Space in Victoria Island",
    description: "Prime commercial office space in Victoria Island with state-of-the-art facilities, high-speed internet, and excellent accessibility.",
    category: "commercial",
    type: "office",
    bedrooms: 0,
    bathrooms: 4,
    area: 2000,
    price: 80000000,
    currency: "NGN",
    monthly_rent: 2000000,
    city: "Lagos",
    state: "Lagos State",
    address: "12 Adeola Odeku Street, Victoria Island, Lagos",
    location: { latitude: 6.4281, longitude: 3.4215 },
    images: ["https://images.unsplash.com/photo-1497366214047-831013752aaa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"],
    featuredImage: "https://images.unsplash.com/photo-1497366214047-831013752aaa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
    amenities: ["High-Speed Internet", "Conference Rooms", "Parking", "24/7 Security"],
    yearBuilt: 2021,
    parkingSpaces: 20,
    status: "active",
    approvalStatus: "approved",
    verificationStatus: "approved"
  },
  {
    title: "2-Bedroom Flat in Abuja",
    description: "A cozy and well-maintained 2-bedroom flat in Abuja with modern amenities, good security, and easy access to major roads.",
    category: "residential",
    type: "apartment",
    bedrooms: 2,
    bathrooms: 1,
    area: 850,
    price: 25000000,
    currency: "NGN",
    monthly_rent: 400000,
    city: "Abuja",
    state: "FCT",
    address: "Block 234, Gwarinpa, Abuja",
    location: { latitude: 9.0765, longitude: 7.3986 },
    images: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"],
    featuredImage: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
    amenities: ["Parking", "Security", "Air Conditioning"],
    yearBuilt: 2018,
    parkingSpaces: 1,
    status: "active",
    approvalStatus: "approved",
    verificationStatus: "approved"
  },
  {
    title: "Beachfront Land in Badagry",
    description: "Prime beachfront land in Badagry with stunning ocean views and excellent potential for development.",
    category: "residential",
    type: "land",
    bedrooms: 0,
    bathrooms: 0,
    area: 1000,
    price: 15000000,
    currency: "NGN",
    city: "Badagry",
    state: "Lagos State",
    address: "Coastal Road, Badagry, Lagos",
    location: { latitude: 6.4147, longitude: 2.8895 },
    images: ["https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"],
    featuredImage: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
    amenities: ["Beach Access", "Ocean View"],
    yearBuilt: null,
    parkingSpaces: 0,
    status: "active",
    approvalStatus: "approved",
    verificationStatus: "approved"
  },
  {
    title: "Studio Apartment in Yaba",
    description: "Affordable and stylish studio apartment in Yaba, perfect for young professionals or students. Close to major tech hubs.",
    category: "residential",
    type: "apartment",
    bedrooms: 1,
    bathrooms: 1,
    area: 450,
    price: 8000000,
    currency: "NGN",
    monthly_rent: 150000,
    city: "Lagos",
    state: "Lagos State",
    address: "Herbert Macaulay Way, Yaba, Lagos",
    location: { latitude: 6.4982, longitude: 3.3792 },
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"],
    featuredImage: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
    amenities: ["Security", "Water Supply", "Parking"],
    yearBuilt: 2020,
    parkingSpaces: 1,
    status: "active",
    approvalStatus: "approved",
    verificationStatus: "approved"
  }
];

async function quickSeed() {
  try {
    console.log('🌱 Starting quick property seeding...');
    
    // Try to connect to database
    try {
      await db.sequelize.authenticate();
      console.log('✅ Database connected');
    } catch (error) {
      console.log('❌ Database connection failed, using fallback approach...');
      
      // If database fails, create properties via API without auth
      console.log('🔄 Trying to create properties via API...');
      
      const axios = require('axios');
      const BASE_URL = 'http://localhost:5001/api';
      
      // Try to create properties directly (some endpoints might not require auth)
      for (const property of properties) {
        try {
          const response = await axios.post(`${BASE_URL}/properties`, property);
          if (response.data.success) {
            console.log(`✅ Created: ${property.title}`);
          }
        } catch (error) {
          console.log(`❌ Failed: ${property.title}`);
        }
      }
      
      console.log('🏁 Quick seeding completed');
      return;
    }
    
    // Create mock vendor
    let vendor = await db.User.findOne({ where: { email: 'vendor@propertyark.com' } });
    
    if (!vendor) {
      const hashedPassword = await bcrypt.hash('vendor123', 10);
      vendor = await db.User.create({
        id: require('uuid').v4(),
        firstName: 'John',
        lastName: 'Property',
        email: 'vendor@propertyark.com',
        password: hashedPassword,
        phone: '+2348012345678',
        role: 'vendor',
        roles: ['vendor'],
        isVerified: true,
        isActive: true,
        company: 'PropertyArk Real Estate',
        bio: 'Leading real estate agency specializing in premium properties across Nigeria.',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
      });
      console.log('✅ Mock vendor created');
    } else {
      console.log('📝 Mock vendor already exists');
    }
    
    // Clear existing properties
    await db.Property.destroy({ where: { ownerId: vendor.id } });
    console.log('🧹 Cleared existing properties');
    
    // Create properties
    for (const propertyData of properties) {
      await db.Property.create({
        ...propertyData,
        id: require('uuid').v4(),
        ownerId: vendor.id,
        ownerEmail: vendor.email,
        views: Math.floor(Math.random() * 1000) + 100,
        savedCount: Math.floor(Math.random() * 50) + 5,
        inquiryCount: Math.floor(Math.random() * 30) + 1,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      });
      console.log(`🏠 Created: ${propertyData.title}`);
    }
    
    console.log(`\n✅ Successfully seeded ${properties.length} properties!`);
    console.log(`👤 Vendor: vendor@propertyark.com (password: vendor123)`);
    
    await db.sequelize.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

if (require.main === module) {
  quickSeed();
}

module.exports = { quickSeed };
