const http = require('http');

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
    parkingSpaces: 2
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
    parkingSpaces: 4
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
    parkingSpaces: 20
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
    parkingSpaces: 1
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
    parkingSpaces: 0
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
    parkingSpaces: 1
  }
];

function createProperty(propertyData) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(propertyData);
    
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/properties',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve({ success: res.statusCode === 200, data: result, status: res.statusCode });
        } catch (error) {
          resolve({ success: false, error: 'Invalid JSON response', status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function seedProperties() {
  console.log('🌱 Starting property seeding via HTTP...');
  console.log('===========================================');

  let createdCount = 0;
  
  for (const property of properties) {
    try {
      console.log(`🏠 Creating: ${property.title}`);
      const result = await createProperty(property);
      
      if (result.success) {
        createdCount++;
        console.log(`✅ Success: ${property.title}`);
      } else {
        console.log(`❌ Failed: ${property.title} - ${result.data?.message || result.error}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${property.title} - ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n===========================================');
  console.log(`📊 Created ${createdCount} out of ${properties.length} properties`);
  console.log('🏁 Property seeding completed!');
  
  if (createdCount > 0) {
    console.log('\n✅ Properties are now available on the home page!');
  } else {
    console.log('\n⚠️ No properties were created. Check if the server is running on localhost:5001');
  }
}

if (require.main === module) {
  seedProperties().catch(error => {
    console.error('❌ Seeding failed:', error);
  });
}

module.exports = { seedProperties };
