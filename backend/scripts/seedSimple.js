const db = require('../config/sequelizeDb');
const bcrypt = require('bcryptjs');

// Mock property data
const mockProperties = [
  {
    title: "Modern 3-Bedroom Apartment in Lekki",
    description: "A beautiful modern apartment with stunning views of the Lekki coastline. This property features high-end finishes, spacious living areas, and access to premium amenities including a swimming pool, gym, and 24/7 security.",
    category: "residential",
    type: "apartment",
    bedrooms: 3,
    bathrooms: 2,
    area: 1200,
    price: 45000000, // 45 million NGN
    currency: "NGN",
    monthly_rent: 800000, // 800k NGN per month
    city: "Lagos",
    state: "Lagos State",
    address: "Plot 123, Lekki Phase 1, Lagos",
    location: {
      latitude: 6.4667,
      longitude: 3.5667,
      coordinates: [3.5667, 6.4667]
    },
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    amenities: ["Swimming Pool", "Gym", "24/7 Security", "Parking", "Balcony", "Air Conditioning"],
    yearBuilt: 2020,
    parkingSpaces: 2,
    status: "active",
    approvalStatus: "approved",
    verificationStatus: "approved"
  },
  {
    title: "Luxury 5-Bedroom Villa in Ikoyi",
    description: "An exquisite luxury villa in the heart of Ikoyi. This property offers unparalleled luxury with 5 spacious bedrooms, a home cinema, wine cellar, and beautifully landscaped gardens. Perfect for discerning buyers seeking premium living.",
    category: "residential",
    type: "house",
    bedrooms: 5,
    bathrooms: 4,
    area: 3500,
    price: 150000000, // 150 million NGN
    currency: "NGN",
    city: "Lagos",
    state: "Lagos State",
    address: "45 Glover Road, Ikoyi, Lagos",
    location: {
      latitude: 6.4531,
      longitude: 3.4331,
      coordinates: [3.4331, 6.4531]
    },
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad416153a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1600596542815-ffad416153a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    amenities: ["Swimming Pool", "Gym", "Home Cinema", "Wine Cellar", "Garden", "24/7 Security", "Parking", "Guest House"],
    yearBuilt: 2019,
    parkingSpaces: 4,
    status: "active",
    approvalStatus: "approved",
    verificationStatus: "approved"
  },
  {
    title: "Commercial Office Space in Victoria Island",
    description: "Prime commercial office space located in the heart of Victoria Island. This modern office building features state-of-the-art facilities, high-speed internet, and excellent accessibility. Perfect for businesses looking for a prestigious address.",
    category: "commercial",
    type: "office",
    bedrooms: 0,
    bathrooms: 4,
    area: 2000,
    price: 80000000, // 80 million NGN
    currency: "NGN",
    monthly_rent: 2000000, // 2 million NGN per month
    city: "Lagos",
    state: "Lagos State",
    address: "12 Adeola Odeku Street, Victoria Island, Lagos",
    location: {
      latitude: 6.4281,
      longitude: 3.4215,
      coordinates: [3.4215, 6.4281]
    },
    images: [
      "https://images.unsplash.com/photo-1497366214047-831013752aaa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1497366214047-831013752aaa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    amenities: ["High-Speed Internet", "Conference Rooms", "Parking", "24/7 Security", "Elevator", "Air Conditioning", "Backup Power"],
    yearBuilt: 2021,
    parkingSpaces: 20,
    status: "active",
    approvalStatus: "approved",
    verificationStatus: "approved"
  },
  {
    title: "2-Bedroom Flat in Abuja",
    description: "A cozy and well-maintained 2-bedroom flat in the heart of Abuja. This property offers comfortable living with modern amenities, good security, and easy access to major roads and shopping centers.",
    category: "residential",
    type: "apartment",
    bedrooms: 2,
    bathrooms: 1,
    area: 850,
    price: 25000000, // 25 million NGN
    currency: "NGN",
    monthly_rent: 400000, // 400k NGN per month
    city: "Abuja",
    state: "FCT",
    address: "Block 234, Gwarinpa, Abuja",
    location: {
      latitude: 9.0765,
      longitude: 7.3986,
      coordinates: [7.3986, 9.0765]
    },
    images: [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    amenities: ["Parking", "Security", "Air Conditioning", "Water Supply"],
    yearBuilt: 2018,
    parkingSpaces: 1,
    status: "active",
    approvalStatus: "approved",
    verificationStatus: "approved"
  },
  {
    title: "Beachfront Land in Badagry",
    description: "Prime beachfront land opportunity in Badagry. This 1000 square meter plot offers stunning ocean views and excellent potential for development. Perfect for investors looking to build a resort or luxury beach home.",
    category: "residential",
    type: "land",
    bedrooms: 0,
    bathrooms: 0,
    area: 1000,
    price: 15000000, // 15 million NGN
    currency: "NGN",
    city: "Badagry",
    state: "Lagos State",
    address: "Coastal Road, Badagry, Lagos",
    location: {
      latitude: 6.4147,
      longitude: 2.8895,
      coordinates: [2.8895, 6.4147]
    },
    images: [
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      "https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    amenities: ["Beach Access", "Ocean View", "Development Ready"],
    yearBuilt: null,
    parkingSpaces: 0,
    status: "active",
    approvalStatus: "approved",
    verificationStatus: "approved"
  },
  {
    title: "Studio Apartment in Yaba",
    description: "Affordable and stylish studio apartment in the vibrant Yaba area. Perfect for young professionals or students. Close to major tech hubs and universities with good transport links.",
    category: "residential",
    type: "apartment",
    bedrooms: 1,
    bathrooms: 1,
    area: 450,
    price: 8000000, // 8 million NGN
    currency: "NGN",
    monthly_rent: 150000, // 150k NGN per month
    city: "Lagos",
    state: "Lagos State",
    address: " Herbert Macaulay Way, Yaba, Lagos",
    location: {
      latitude: 6.4982,
      longitude: 3.3792,
      coordinates: [3.3792, 6.4982]
    },
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    amenities: ["Security", "Water Supply", "Parking", "Proximity to Tech Hub"],
    yearBuilt: 2020,
    parkingSpaces: 1,
    status: "active",
    approvalStatus: "approved",
    verificationStatus: "approved"
  }
];

// Mock vendor data
const mockVendor = {
  firstName: "John",
  lastName: "Property",
  email: "vendor@propertyark.com",
  password: "vendor123",
  phone: "+2348012345678",
  role: "vendor",
  isVerified: true,
  isActive: true,
  company: "PropertyArk Real Estate",
  bio: "Leading real estate agency specializing in premium properties across Nigeria. With over 10 years of experience, we provide exceptional service to both buyers and sellers.",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
};

async function seedProperties() {
  try {
    console.log('🌱 Starting simple property seeding...');
    console.log('===========================================');

    // Initialize database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check if mock vendor already exists
    let vendor = await db.User.findOne({
      where: { email: mockVendor.email }
    });

    if (!vendor) {
      // Create mock vendor
      const hashedPassword = await bcrypt.hash(mockVendor.password, 10);
      vendor = await db.User.create({
        ...mockVendor,
        password: hashedPassword,
        roles: ['vendor'],
        isAdmin: false
      });
      console.log('✅ Mock vendor created:', vendor.email);
    } else {
      console.log('📝 Mock vendor already exists:', vendor.email);
    }

    // Clear existing properties for this vendor
    await db.Property.destroy({
      where: { ownerId: vendor.id }
    });
    console.log('🧹 Cleared existing properties for vendor');

    // Create mock properties
    const createdProperties = [];
    for (const propertyData of mockProperties) {
      const property = await db.Property.create({
        ...propertyData,
        ownerId: vendor.id,
        ownerEmail: vendor.email,
        views: Math.floor(Math.random() * 1000) + 100, // Random views between 100-1100
        savedCount: Math.floor(Math.random() * 50) + 5, // Random saves between 5-55
        inquiryCount: Math.floor(Math.random() * 30) + 1, // Random inquiries between 1-31
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        updatedAt: new Date()
      });
      createdProperties.push(property);
      console.log(`🏠 Created property: ${property.title}`);
    }

    console.log(`\n✅ Successfully seeded ${createdProperties.length} properties!`);
    console.log(`👤 Vendor: ${vendor.firstName} ${vendor.lastName} (${vendor.email})`);
    console.log(`📊 Properties created:`);
    
    createdProperties.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.title} - ₦${prop.price.toLocaleString()}`);
    });

    console.log('\n🎉 Property seeding completed successfully!');
    console.log('\n📝 Login credentials for mock vendor:');
    console.log(`   Email: ${mockVendor.email}`);
    console.log(`   Password: ${mockVendor.password}`);

    // Close database connection
    await db.sequelize.close();
    console.log('\n🔒 Database connection closed');

  } catch (error) {
    console.error('❌ Error seeding properties:', error);
    process.exit(1);
  }
}

// Run the seeding
if (require.main === module) {
  seedProperties()
    .then(() => {
      console.log('\n🏁 Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedProperties, mockProperties, mockVendor };
