// Comprehensive Mock Properties Data linked to Mock Users
// All properties are owned by realistic users with complete profiles

const mockProperties = [
  {
    id: 'prop_001',
    title: 'Beautiful Family Home in Lekki Phase 1',
    description: 'Spacious 3-bedroom home with modern amenities, stunning views of the lagoon, and premium finishes throughout. Perfect for families seeking luxury living.',
    price: 185000000, // ₦185,000,000
    type: 'house',
    status: 'for-sale',
    details: { 
      bedrooms: 3, 
      bathrooms: 2, 
      sqft: 1800,
      yearBuilt: 2018,
      parking: 2,
      furnished: 'semi-furnished'
    },
    location: { 
      address: '123 Lekki Phase 1', 
      city: 'Lagos', 
      state: 'Lagos',
      zipCode: '101001',
      coordinates: { lat: 6.4654, lng: 3.4654 },
      googleMapsUrl: 'https://maps.google.com/maps?q=123+Lekki+Phase+1+Lagos'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_001',
      firstName: 'Adebayo',
      lastName: 'Oluwaseun',
      email: 'adebayo.oluwaseun@gmail.com',
      phone: '+234-801-234-5678'
    },
    views: 45,
    isVerified: false,
    createdAt: new Date('2024-01-10').toISOString(),
    listingType: 'for-sale',
    amenities: ['Swimming Pool', 'Gym', '24/7 Security', 'Garden', 'Parking'],
    propertyFeatures: ['Modern Kitchen', 'Master Ensuite', 'Built-in Wardrobes', 'Balcony']
  },
  {
    id: 'prop_002',
    title: 'Modern Downtown Apartment in Victoria Island',
    description: 'Luxury 2-bedroom apartment in the heart of Victoria Island with premium finishes, city views, and access to world-class amenities.',
    price: 1200000, // ₦1,200,000/month
    type: 'apartment',
    status: 'for-rent',
    details: { 
      bedrooms: 2, 
      bathrooms: 1, 
      sqft: 1200,
      yearBuilt: 2020,
      parking: 1,
      furnished: 'fully-furnished'
    },
    location: { 
      address: '456 Victoria Island', 
      city: 'Lagos', 
      state: 'Lagos',
      zipCode: '101241',
      coordinates: { lat: 6.4281, lng: 3.4219 },
      googleMapsUrl: 'https://maps.google.com/maps?q=456+Victoria+Island+Lagos'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_001',
      firstName: 'Adebayo',
      lastName: 'Oluwaseun',
      email: 'adebayo.oluwaseun@gmail.com',
      phone: '+234-801-234-5678'
    },
    views: 32,
    isVerified: true,
    createdAt: new Date('2024-01-08').toISOString(),
    listingType: 'for-rent',
    amenities: ['Concierge', 'Gym', 'Swimming Pool', 'Security', 'Parking'],
    propertyFeatures: ['Modern Kitchen', 'City Views', 'Balcony', 'Air Conditioning']
  },
  {
    id: 'prop_003',
    title: 'Luxury Penthouse Suite with Ocean Views',
    description: 'Stunning penthouse with panoramic city and ocean views, premium finishes, and exclusive access to rooftop amenities.',
    price: 520000000, // ₦520,000,000
    type: 'apartment',
    status: 'for-sale',
    details: { 
      bedrooms: 4, 
      bathrooms: 3, 
      sqft: 2800,
      yearBuilt: 2021,
      parking: 3,
      furnished: 'fully-furnished'
    },
    location: { 
      address: '789 Banana Island', 
      city: 'Lagos', 
      state: 'Lagos',
      zipCode: '101001',
      coordinates: { lat: 6.4528, lng: 3.4068 },
      googleMapsUrl: 'https://maps.google.com/maps?q=789+Banana+Island+Lagos'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_002',
      firstName: 'Chioma',
      lastName: 'Nwosu',
      email: 'chioma.nwosu@yahoo.com',
      phone: '+234-802-345-6789'
    },
    views: 89,
    isVerified: true,
    createdAt: new Date('2024-01-05').toISOString(),
    listingType: 'for-sale',
    amenities: ['Rooftop Pool', 'Private Elevator', 'Concierge', 'Gym', 'Security'],
    propertyFeatures: ['Ocean Views', 'Private Terrace', 'Wine Cellar', 'Home Theater']
  },
  {
    id: 'prop_004',
    title: 'Cozy Studio Apartment in Surulere',
    description: 'Perfect starter home in a vibrant neighborhood with modern amenities and easy access to transportation.',
    price: 800000, // ₦800,000/month
    type: 'apartment',
    status: 'for-rent',
    details: { 
      bedrooms: 1, 
      bathrooms: 1, 
      sqft: 650,
      yearBuilt: 2019,
      parking: 1,
      furnished: 'unfurnished'
    },
    location: { 
      address: '321 Surulere', 
      city: 'Lagos', 
      state: 'Lagos',
      zipCode: '101283',
      coordinates: { lat: 6.5000, lng: 3.3500 },
      googleMapsUrl: 'https://maps.google.com/maps?q=321+Surulere+Lagos'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_002',
      firstName: 'Chioma',
      lastName: 'Nwosu',
      email: 'chioma.nwosu@yahoo.com',
      phone: '+234-802-345-6789'
    },
    views: 24,
    isVerified: true,
    createdAt: new Date('2024-01-12').toISOString(),
    listingType: 'for-rent',
    amenities: ['Security', 'Parking', 'Water Supply', 'Power Backup'],
    propertyFeatures: ['Modern Kitchen', 'Balcony', 'Storage Space']
  },
  {
    id: 'prop_005',
    title: 'Suburban Villa with Private Pool',
    description: 'Spacious family villa with private pool, garden, and premium amenities in a secure gated community.',
    price: 310000000, // ₦310,000,000
    type: 'house',
    status: 'for-sale',
    details: { 
      bedrooms: 5, 
      bathrooms: 4, 
      sqft: 3200,
      yearBuilt: 2017,
      parking: 4,
      furnished: 'semi-furnished'
    },
    location: { 
      address: '456 Magodo GRA', 
      city: 'Lagos', 
      state: 'Lagos',
      zipCode: '105001',
      coordinates: { lat: 6.6000, lng: 3.4000 },
      googleMapsUrl: 'https://maps.google.com/maps?q=456+Magodo+GRA+Lagos'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_003',
      firstName: 'Emmanuel',
      lastName: 'Adeyemi',
      email: 'emmanuel.adeyemi@hotmail.com',
      phone: '+234-803-456-7890'
    },
    views: 67,
    isVerified: false,
    createdAt: new Date('2024-01-15').toISOString(),
    listingType: 'for-sale',
    amenities: ['Private Pool', 'Garden', 'Security', 'Parking', 'Power Backup'],
    propertyFeatures: ['Master Suite', 'Guest Quarters', 'Study Room', 'Outdoor Kitchen']
  },
  {
    id: 'prop_006',
    title: 'Commercial Office Space in Ikeja GRA',
    description: 'Prime commercial space perfect for business operations with modern facilities and excellent location.',
    price: 3500000, // ₦3,500,000/month
    type: 'commercial',
    status: 'for-lease',
    details: { 
      bedrooms: 0, 
      bathrooms: 2, 
      sqft: 1500,
      yearBuilt: 2016,
      parking: 6,
      furnished: 'unfurnished'
    },
    location: { 
      address: '123 Ikeja GRA', 
      city: 'Lagos', 
      state: 'Lagos',
      zipCode: '100001',
      coordinates: { lat: 6.6000, lng: 3.3500 },
      googleMapsUrl: 'https://maps.google.com/maps?q=123+Ikeja+GRA+Lagos'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_003',
      firstName: 'Emmanuel',
      lastName: 'Adeyemi',
      email: 'emmanuel.adeyemi@hotmail.com',
      phone: '+234-803-456-7890'
    },
    views: 43,
    isVerified: true,
    createdAt: new Date('2024-01-18').toISOString(),
    listingType: 'for-lease',
    amenities: ['Parking', 'Security', 'Power Backup', 'Water Supply', 'Air Conditioning'],
    propertyFeatures: ['Open Plan', 'Meeting Rooms', 'Reception Area', 'Storage Space']
  },
  {
    id: 'prop_007',
    title: 'Luxury Townhouse in Ikoyi',
    description: 'Elegant townhouse with premium finishes, private garden, and access to exclusive community amenities.',
    price: 450000000, // ₦450,000,000
    type: 'house',
    status: 'for-sale',
    details: { 
      bedrooms: 4, 
      bathrooms: 3, 
      sqft: 2400,
      yearBuilt: 2019,
      parking: 3,
      furnished: 'fully-furnished'
    },
    location: { 
      address: '654 Ikoyi', 
      city: 'Lagos', 
      state: 'Lagos',
      zipCode: '101001',
      coordinates: { lat: 6.4500, lng: 3.4000 },
      googleMapsUrl: 'https://maps.google.com/maps?q=654+Ikoyi+Lagos'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_004',
      firstName: 'Fatima',
      lastName: 'Ibrahim',
      email: 'fatima.ibrahim@gmail.com',
      phone: '+234-804-567-8901'
    },
    views: 78,
    isVerified: true,
    createdAt: new Date('2024-01-06').toISOString(),
    listingType: 'for-sale',
    amenities: ['Private Garden', 'Security', 'Parking', 'Power Backup'],
    propertyFeatures: ['Master Suite', 'Guest Room', 'Study', 'Balcony']
  },
  {
    id: 'prop_008',
    title: 'Modern Apartment in Yaba',
    description: 'Contemporary 2-bedroom apartment with modern amenities and easy access to business districts.',
    price: 950000, // ₦950,000/month
    type: 'apartment',
    status: 'for-rent',
    details: { 
      bedrooms: 2, 
      bathrooms: 2, 
      sqft: 1100,
      yearBuilt: 2020,
      parking: 2,
      furnished: 'semi-furnished'
    },
    location: { 
      address: '321 Yaba', 
      city: 'Lagos', 
      state: 'Lagos',
      zipCode: '101212',
      coordinates: { lat: 6.5000, lng: 3.3800 },
      googleMapsUrl: 'https://maps.google.com/maps?q=321+Yaba+Lagos'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_004',
      firstName: 'Fatima',
      lastName: 'Ibrahim',
      email: 'fatima.ibrahim@gmail.com',
      phone: '+234-804-567-8901'
    },
    views: 35,
    isVerified: true,
    createdAt: new Date('2024-01-14').toISOString(),
    listingType: 'for-rent',
    amenities: ['Security', 'Parking', 'Gym', 'Water Supply'],
    propertyFeatures: ['Modern Kitchen', 'Balcony', 'Built-in Wardrobes', 'Air Conditioning']
  },
  {
    id: 'prop_009',
    title: 'Executive Duplex in Magodo',
    description: 'Spacious executive duplex with premium finishes, private pool, and exclusive community access.',
    price: 280000000, // ₦280,000,000
    type: 'house',
    status: 'for-sale',
    details: { 
      bedrooms: 6, 
      bathrooms: 5, 
      sqft: 3800,
      yearBuilt: 2018,
      parking: 5,
      furnished: 'semi-furnished'
    },
    location: { 
      address: '456 Magodo GRA', 
      city: 'Lagos', 
      state: 'Lagos',
      zipCode: '105001',
      coordinates: { lat: 6.6000, lng: 3.4000 },
      googleMapsUrl: 'https://maps.google.com/maps?q=456+Magodo+GRA+Lagos'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_005',
      firstName: 'Oluwaseun',
      lastName: 'Akoma',
      email: 'oluwaseun.akoma@gmail.com',
      phone: '+234-805-678-9012'
    },
    views: 92,
    isVerified: true,
    createdAt: new Date('2024-01-03').toISOString(),
    listingType: 'for-sale',
    amenities: ['Private Pool', 'Garden', 'Security', 'Parking', 'Power Backup'],
    propertyFeatures: ['Master Suite', 'Guest Quarters', 'Study', 'Outdoor Kitchen', 'Home Theater']
  },
  {
    id: 'prop_010',
    title: 'Luxury Apartment in Banana Island',
    description: 'Exclusive apartment with panoramic ocean views and access to world-class amenities.',
    price: 380000000, // ₦380,000,000
    type: 'apartment',
    status: 'for-sale',
    details: { 
      bedrooms: 3, 
      bathrooms: 3, 
      sqft: 2200,
      yearBuilt: 2021,
      parking: 2,
      furnished: 'fully-furnished'
    },
    location: { 
      address: '789 Banana Island', 
      city: 'Lagos', 
      state: 'Lagos',
      zipCode: '101001',
      coordinates: { lat: 6.4528, lng: 3.4068 },
      googleMapsUrl: 'https://maps.google.com/maps?q=789+Banana+Island+Lagos'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_005',
      firstName: 'Oluwaseun',
      lastName: 'Akoma',
      email: 'oluwaseun.akoma@gmail.com',
      phone: '+234-805-678-9012'
    },
    views: 156,
    isVerified: true,
    createdAt: new Date('2024-01-01').toISOString(),
    listingType: 'for-sale',
    amenities: ['Ocean Views', 'Concierge', 'Gym', 'Swimming Pool', 'Security'],
    propertyFeatures: ['Modern Kitchen', 'Master Ensuite', 'Balcony', 'Air Conditioning']
  },
  {
    id: 'prop_011',
    title: 'Commercial Retail Space in Victoria Island',
    description: 'Prime retail space in bustling Victoria Island, perfect for retail businesses and restaurants.',
    price: 2800000, // ₦2,800,000/month
    type: 'commercial',
    status: 'for-lease',
    details: { 
      bedrooms: 0, 
      bathrooms: 1, 
      sqft: 800,
      yearBuilt: 2015,
      parking: 4,
      furnished: 'unfurnished'
    },
    location: { 
      address: '456 Victoria Island', 
      city: 'Lagos', 
      state: 'Lagos',
      zipCode: '101241',
      coordinates: { lat: 6.4281, lng: 3.4219 },
      googleMapsUrl: 'https://maps.google.com/maps?q=456+Victoria+Island+Lagos'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_005',
      firstName: 'Oluwaseun',
      lastName: 'Akoma',
      email: 'oluwaseun.akoma@gmail.com',
      phone: '+234-805-678-9012'
    },
    views: 67,
    isVerified: true,
    createdAt: new Date('2024-01-16').toISOString(),
    listingType: 'for-lease',
    amenities: ['Parking', 'Security', 'Power Backup', 'Water Supply'],
    propertyFeatures: ['Open Plan', 'Storage Space', 'Restroom', 'Air Conditioning']
  },
  {
    id: 'prop_012',
    title: 'Family Home in Gbagada',
    description: 'Comfortable family home with modern amenities and easy access to schools and hospitals.',
    price: 150000000, // ₦150,000,000
    type: 'house',
    status: 'for-sale',
    details: { 
      bedrooms: 3, 
      bathrooms: 2, 
      sqft: 1600,
      yearBuilt: 2016,
      parking: 2,
      furnished: 'unfurnished'
    },
    location: { 
      address: '987 Gbagada', 
      city: 'Lagos', 
      state: 'Lagos',
      zipCode: '100234',
      coordinates: { lat: 6.5500, lng: 3.3800 },
      googleMapsUrl: 'https://maps.google.com/maps?q=987+Gbagada+Lagos'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_006',
      firstName: 'Blessing',
      lastName: 'Okafor',
      email: 'blessing.okafor@outlook.com',
      phone: '+234-806-789-0123'
    },
    views: 43,
    isVerified: true,
    createdAt: new Date('2024-01-19').toISOString(),
    listingType: 'for-sale',
    amenities: ['Security', 'Parking', 'Water Supply', 'Power Backup'],
    propertyFeatures: ['Modern Kitchen', 'Master Ensuite', 'Garden', 'Storage Space']
  },
  {
    id: 'prop_013',
    title: 'Modern Studio in Port Harcourt',
    description: 'Contemporary studio apartment perfect for young professionals with modern amenities.',
    price: 650000, // ₦650,000/month
    type: 'apartment',
    status: 'for-rent',
    details: { 
      bedrooms: 1, 
      bathrooms: 1, 
      sqft: 550,
      yearBuilt: 2019,
      parking: 1,
      furnished: 'semi-furnished'
    },
    location: { 
      address: '789 Port Harcourt', 
      city: 'Port Harcourt', 
      state: 'Rivers',
      zipCode: '500001',
      coordinates: { lat: 4.8156, lng: 7.0498 },
      googleMapsUrl: 'https://maps.google.com/maps?q=789+Port+Harcourt'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_007',
      firstName: 'Ibrahim',
      lastName: 'Musa',
      email: 'ibrahim.musa@gmail.com',
      phone: '+234-807-890-1234'
    },
    views: 28,
    isVerified: true,
    createdAt: new Date('2024-01-17').toISOString(),
    listingType: 'for-rent',
    amenities: ['Security', 'Parking', 'Water Supply', 'Power Backup'],
    propertyFeatures: ['Modern Kitchen', 'Built-in Wardrobes', 'Air Conditioning']
  },
  {
    id: 'prop_014',
    title: 'Executive Villa in Port Harcourt',
    description: 'Luxury villa with premium finishes, private garden, and exclusive amenities in a secure community.',
    price: 220000000, // ₦220,000,000
    type: 'house',
    status: 'for-sale',
    details: { 
      bedrooms: 4, 
      bathrooms: 3, 
      sqft: 2600,
      yearBuilt: 2017,
      parking: 3,
      furnished: 'semi-furnished'
    },
    location: { 
      address: '456 GRA Phase 2', 
      city: 'Port Harcourt', 
      state: 'Rivers',
      zipCode: '500001',
      coordinates: { lat: 4.8156, lng: 7.0498 },
      googleMapsUrl: 'https://maps.google.com/maps?q=456+GRA+Phase+2+Port+Harcourt'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_007',
      firstName: 'Ibrahim',
      lastName: 'Musa',
      email: 'ibrahim.musa@gmail.com',
      phone: '+234-807-890-1234'
    },
    views: 89,
    isVerified: true,
    createdAt: new Date('2024-01-11').toISOString(),
    listingType: 'for-sale',
    amenities: ['Private Garden', 'Security', 'Parking', 'Power Backup', 'Water Supply'],
    propertyFeatures: ['Master Suite', 'Guest Room', 'Study', 'Outdoor Kitchen']
  },
  {
    id: 'prop_015',
    title: 'Medical Professional Apartment',
    description: 'Comfortable apartment perfect for medical professionals with modern amenities and easy access to hospitals.',
    price: 750000, // ₦750,000/month
    type: 'apartment',
    status: 'for-rent',
    details: { 
      bedrooms: 2, 
      bathrooms: 2, 
      sqft: 950,
      yearBuilt: 2020,
      parking: 1,
      furnished: 'semi-furnished'
    },
    location: { 
      address: '321 Yaba', 
      city: 'Lagos', 
      state: 'Lagos',
      zipCode: '101212',
      coordinates: { lat: 6.5000, lng: 3.3800 },
      googleMapsUrl: 'https://maps.google.com/maps?q=321+Yaba+Lagos'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_008',
      firstName: 'Grace',
      lastName: 'Eze',
      email: 'grace.eze@yahoo.com',
      phone: '+234-808-901-2345'
    },
    views: 41,
    isVerified: true,
    createdAt: new Date('2024-01-13').toISOString(),
    listingType: 'for-rent',
    amenities: ['Security', 'Parking', 'Water Supply', 'Power Backup'],
    propertyFeatures: ['Modern Kitchen', 'Master Ensuite', 'Balcony', 'Air Conditioning']
  },
  {
    id: 'prop_016',
    title: 'Luxury Apartment in Ikoyi',
    description: 'Exclusive apartment with premium finishes and access to world-class amenities.',
    price: 420000000, // ₦420,000,000
    type: 'apartment',
    status: 'for-sale',
    details: { 
      bedrooms: 3, 
      bathrooms: 3, 
      sqft: 2000,
      yearBuilt: 2020,
      parking: 2,
      furnished: 'fully-furnished'
    },
    location: { 
      address: '654 Ikoyi', 
      city: 'Lagos', 
      state: 'Lagos',
      zipCode: '101001',
      coordinates: { lat: 6.4500, lng: 3.4000 },
      googleMapsUrl: 'https://maps.google.com/maps?q=654+Ikoyi+Lagos'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_009',
      firstName: 'Kemi',
      lastName: 'Adebayo',
      email: 'kemi.adebayo@gmail.com',
      phone: '+234-809-012-3456'
    },
    views: 124,
    isVerified: true,
    createdAt: new Date('2024-01-07').toISOString(),
    listingType: 'for-sale',
    amenities: ['Concierge', 'Gym', 'Swimming Pool', 'Security', 'Parking'],
    propertyFeatures: ['Modern Kitchen', 'Master Ensuite', 'Balcony', 'Air Conditioning']
  },
  {
    id: 'prop_017',
    title: 'Modern Townhouse in Lekki',
    description: 'Contemporary townhouse with premium finishes and access to community amenities.',
    price: 180000000, // ₦180,000,000
    type: 'house',
    status: 'for-sale',
    details: { 
      bedrooms: 4, 
      bathrooms: 3, 
      sqft: 2100,
      yearBuilt: 2019,
      parking: 3,
      furnished: 'semi-furnished'
    },
    location: { 
      address: '789 Lekki Phase 2', 
      city: 'Lagos', 
      state: 'Lagos',
      zipCode: '101001',
      coordinates: { lat: 6.4654, lng: 3.4654 },
      googleMapsUrl: 'https://maps.google.com/maps?q=789+Lekki+Phase+2+Lagos'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_009',
      firstName: 'Kemi',
      lastName: 'Adebayo',
      email: 'kemi.adebayo@gmail.com',
      phone: '+234-809-012-3456'
    },
    views: 76,
    isVerified: false,
    createdAt: new Date('2024-01-09').toISOString(),
    listingType: 'for-sale',
    amenities: ['Community Pool', 'Security', 'Parking', 'Power Backup'],
    propertyFeatures: ['Master Suite', 'Guest Room', 'Study', 'Balcony']
  },
  {
    id: 'prop_018',
    title: 'Architectural Masterpiece in Gbagada',
    description: 'Unique architectural design with premium finishes and modern amenities.',
    price: 195000000, // ₦195,000,000
    type: 'house',
    status: 'for-sale',
    details: { 
      bedrooms: 3, 
      bathrooms: 3, 
      sqft: 1900,
      yearBuilt: 2021,
      parking: 2,
      furnished: 'fully-furnished'
    },
    location: { 
      address: '987 Gbagada', 
      city: 'Lagos', 
      state: 'Lagos',
      zipCode: '100234',
      coordinates: { lat: 6.5500, lng: 3.3800 },
      googleMapsUrl: 'https://maps.google.com/maps?q=987+Gbagada+Lagos'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_010',
      firstName: 'Tunde',
      lastName: 'Ogunlana',
      email: 'tunde.ogunlana@hotmail.com',
      phone: '+234-810-123-4567'
    },
    views: 98,
    isVerified: true,
    createdAt: new Date('2024-01-04').toISOString(),
    listingType: 'for-sale',
    amenities: ['Security', 'Parking', 'Garden', 'Power Backup'],
    propertyFeatures: ['Modern Kitchen', 'Master Ensuite', 'Study', 'Balcony', 'Rooftop Terrace']
  },
  {
    id: 'prop_019',
    title: 'Luxury Penthouse in Victoria Island',
    description: 'Exclusive penthouse with panoramic ocean views and premium amenities.',
    price: 650000000, // ₦650,000,000
    type: 'apartment',
    status: 'for-sale',
    details: { 
      bedrooms: 4, 
      bathrooms: 4, 
      sqft: 3000,
      yearBuilt: 2022,
      parking: 3,
      furnished: 'fully-furnished'
    },
    location: { 
      address: '456 Victoria Island', 
      city: 'Lagos', 
      state: 'Lagos',
      zipCode: '101241',
      coordinates: { lat: 6.4281, lng: 3.4219 },
      googleMapsUrl: 'https://maps.google.com/maps?q=456+Victoria+Island+Lagos'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_010',
      firstName: 'Tunde',
      lastName: 'Ogunlana',
      email: 'tunde.ogunlana@hotmail.com',
      phone: '+234-810-123-4567'
    },
    views: 203,
    isVerified: true,
    createdAt: new Date('2024-01-02').toISOString(),
    listingType: 'for-sale',
    amenities: ['Ocean Views', 'Rooftop Pool', 'Concierge', 'Gym', 'Security'],
    propertyFeatures: ['Modern Kitchen', 'Master Ensuite', 'Private Terrace', 'Home Theater', 'Wine Cellar']
  },
  {
    id: 'prop_020',
    title: 'Cozy Studio in Surulere',
    description: 'Perfect starter home in a vibrant neighborhood with modern amenities.',
    price: 550000, // ₦550,000/month
    type: 'apartment',
    status: 'for-rent',
    details: { 
      bedrooms: 1, 
      bathrooms: 1, 
      sqft: 500,
      yearBuilt: 2018,
      parking: 1,
      furnished: 'unfurnished'
    },
    location: { 
      address: '321 Surulere', 
      city: 'Lagos', 
      state: 'Lagos',
      zipCode: '101283',
      coordinates: { lat: 6.5000, lng: 3.3500 },
      googleMapsUrl: 'https://maps.google.com/maps?q=321+Surulere+Lagos'
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', isPrimary: false }
    ],
    owner: {
      id: 'user_010',
      firstName: 'Tunde',
      lastName: 'Ogunlana',
      email: 'tunde.ogunlana@hotmail.com',
      phone: '+234-810-123-4567'
    },
    views: 19,
    isVerified: true,
    createdAt: new Date('2024-01-21').toISOString(),
    listingType: 'for-rent',
    amenities: ['Security', 'Parking', 'Water Supply', 'Power Backup'],
    propertyFeatures: ['Modern Kitchen', 'Built-in Wardrobes', 'Air Conditioning']
  }
];

module.exports = mockProperties;
