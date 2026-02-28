const axios = require('axios');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5001/api';

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
    parkingSpaces: 2
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
    parkingSpaces: 4
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
    parkingSpaces: 20
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
    parkingSpaces: 1
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
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      "https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    amenities: ["Beach Access", "Ocean View", "Development Ready"],
    yearBuilt: null,
    parkingSpaces: 0
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
    parkingSpaces: 1
  }
];

// Helper functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const makeRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    };
    
    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Try different admin credentials
const adminCredentials = [
  { email: 'admin@propertyark.com', password: 'admin123' },
  { email: 'admin@example.com', password: 'admin123' },
  { email: 'admin', password: 'admin123' }
];

const testAdminLogin = async () => {
  console.log('\n🔐 Testing Admin Login...');
  
  for (const creds of adminCredentials) {
    const result = await makeRequest('POST', '/auth/jwt/login', creds);
    
    if (result.success && result.data.success) {
      console.log(`✅ Admin login successful with: ${creds.email}`);
      return { token: result.data.token, user: result.data.user };
    }
  }
  
  console.log('❌ All admin login attempts failed');
  return null;
};

const createVendor = async (adminToken) => {
  console.log('\n👤 Creating Mock Vendor...');
  
  const vendorData = {
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

  // Try to create vendor
  let result = await makeRequest('POST', '/auth/jwt/register', vendorData);
  
  if (result.success && result.data.success) {
    console.log('✅ Vendor created successfully');
    return { token: result.data.token, user: result.data.user };
  } else {
    console.log('❌ Vendor creation failed, trying to login...');
    
    // Try to login if already exists
    const loginResult = await makeRequest('POST', '/auth/jwt/login', {
      email: vendorData.email,
      password: vendorData.password
    });
    
    if (loginResult.success && loginResult.data.success) {
      console.log('✅ Vendor login successful (existing user)');
      return { token: loginResult.data.token, user: loginResult.data.user };
    }
    
    console.log('❌ Vendor login failed:', loginResult.error);
    return null;
  }
};

const createProperties = async (vendorToken) => {
  console.log('\n🏠 Creating Properties...');
  
  let createdCount = 0;
  for (const propertyData of mockProperties) {
    const result = await makeRequest('POST', '/properties', propertyData, vendorToken);
    
    if (result.success && result.data.success) {
      createdCount++;
      console.log(`✅ Created property: ${propertyData.title}`);
    } else {
      console.log(`❌ Failed to create property: ${propertyData.title}`, result.error);
    }
    
    // Small delay between requests
    await delay(500);
  }
  
  console.log(`\n📊 Created ${createdCount} out of ${mockProperties.length} properties`);
  return createdCount > 0;
};

const getProperties = async () => {
  console.log('\n📋 Fetching Properties...');
  const result = await makeRequest('GET', '/properties');
  
  if (result.success && result.data.success) {
    console.log(`✅ Found ${result.data.properties.length} properties`);
    result.data.properties.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.title} - ₦${prop.price?.toLocaleString()}`);
    });
    return true;
  } else {
    console.log('❌ Failed to fetch properties:', result.error);
    return false;
  }
};

// Main seeding function
const seedProperties = async () => {
  console.log('🌱 Starting Property Seeding via API...');
  console.log('===========================================');

  // Test admin login
  const adminAuth = await testAdminLogin();
  if (!adminAuth) {
    console.log('❌ Cannot proceed without admin access');
    process.exit(1);
  }

  // Create/get vendor
  const vendorAuth = await createVendor(adminAuth.token);
  if (!vendorAuth) {
    console.log('❌ Cannot proceed without vendor access');
    process.exit(1);
  }

  // Create properties
  const propertiesCreated = await createProperties(vendorAuth.token);
  if (!propertiesCreated) {
    console.log('❌ Failed to create properties');
    process.exit(1);
  }

  // Verify properties
  const propertiesVerified = await getProperties();
  if (!propertiesVerified) {
    console.log('❌ Failed to verify properties');
    process.exit(1);
  }

  console.log('\n===========================================');
  console.log('🎉 Property seeding completed successfully!');
  console.log('===========================================');
  console.log('\n📝 Mock vendor credentials:');
  console.log(`   Email: vendor@propertyark.com`);
  console.log(`   Password: vendor123`);

  process.exit(0);
};

// Run the seeding
if (require.main === module) {
  seedProperties().catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = { seedProperties, mockProperties };
