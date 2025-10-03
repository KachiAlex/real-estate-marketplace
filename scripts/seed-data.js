// Script to seed Firestore with initial data
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKPiM3fjQWqxrdN4UoyfLxsJKNk6h8lIU",
  authDomain: "real-estate-marketplace-37544.firebaseapp.com",
  projectId: "real-estate-marketplace-37544",
  storageBucket: "real-estate-marketplace-37544.firebasestorage.app",
  messagingSenderId: "759115682573",
  appId: "1:759115682573:web:2dbddf9ba6dac14764d644",
  measurementId: "G-BMDCTD4W5Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample properties data
const sampleProperties = [
  {
    title: "Luxury Apartment in Victoria Island",
    description: "Stunning 3-bedroom apartment with city views, pool, and gym access. Modern amenities and 24/7 security.",
    price: 75000000,
    status: "For Sale",
    type: "Apartment",
    bedrooms: 3,
    bathrooms: 3,
    sqft: 175,
    location: {
      city: "Lagos",
      state: "Lagos",
      address: "Victoria Island, Lagos",
      coordinates: { lat: 6.4281, lng: 3.4219 }
    },
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"
    ],
    amenities: ["Swimming Pool", "Gym", "24/7 Security", "Air Conditioning", "Parking Space", "WiFi", "Furnished", "Balcony"],
    features: ["City View", "Modern Kitchen", "Marble Floors", "Elevator"],
    createdAt: new Date(),
    updatedAt: new Date(),
    vendorId: "vendor1",
    isActive: true,
    isFeatured: true
  },
  {
    title: "Modern Family House in Lekki",
    description: "Spacious 4-bedroom house with modern kitchen, garden, and 24/7 security. Perfect for families.",
    price: 120000000,
    status: "For Sale",
    type: "House",
    bedrooms: 4,
    bathrooms: 4,
    sqft: 250,
    location: {
      city: "Lagos",
      state: "Lagos",
      address: "Lekki Phase 1, Lagos",
      coordinates: { lat: 6.4698, lng: 3.5852 }
    },
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop"
    ],
    amenities: ["Garden", "24/7 Security", "Parking Space", "WiFi", "Furnished"],
    features: ["Modern Kitchen", "Garden", "Terrace", "Study Room"],
    createdAt: new Date(),
    updatedAt: new Date(),
    vendorId: "vendor2",
    isActive: true,
    isFeatured: true
  },
  {
    title: "Penthouse with Ocean View in Ikoyi",
    description: "Luxurious penthouse with panoramic ocean views and private terrace. Exclusive location.",
    price: 95000000,
    status: "Shortlet",
    type: "Penthouse",
    bedrooms: 2,
    bathrooms: 3,
    sqft: 200,
    location: {
      city: "Lagos",
      state: "Lagos",
      address: "Ikoyi, Lagos",
      coordinates: { lat: 6.4474, lng: 3.4336 }
    },
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop"
    ],
    amenities: ["Swimming Pool", "Gym", "24/7 Security", "Air Conditioning", "Parking Space", "WiFi", "Furnished", "Balcony", "Ocean View"],
    features: ["Ocean View", "Private Terrace", "Modern Kitchen", "Elevator"],
    createdAt: new Date(),
    updatedAt: new Date(),
    vendorId: "vendor1",
    isActive: true,
    isFeatured: true
  },
  {
    title: "Elegant Townhouse in Maitama",
    description: "Contemporary townhouse with private garden and modern amenities. Located in diplomatic area.",
    price: 75000000,
    status: "For Rent",
    type: "Townhouse",
    bedrooms: 4,
    bathrooms: 3,
    sqft: 220,
    location: {
      city: "Abuja",
      state: "Abuja (FCT)",
      address: "Maitama, Abuja",
      coordinates: { lat: 9.0765, lng: 7.3986 }
    },
    images: [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop"
    ],
    amenities: ["Garden", "24/7 Security", "Parking Space", "WiFi", "Furnished"],
    features: ["Private Garden", "Modern Kitchen", "Study Room", "Terrace"],
    createdAt: new Date(),
    updatedAt: new Date(),
    vendorId: "vendor3",
    isActive: true,
    isFeatured: false
  },
  {
    title: "Beachfront Villa in Banana Island",
    description: "Exclusive beachfront villa with private pool and direct beach access. Ultimate luxury living.",
    price: 150000000,
    status: "For Sale",
    type: "Villa",
    bedrooms: 5,
    bathrooms: 5,
    sqft: 400,
    location: {
      city: "Lagos",
      state: "Lagos",
      address: "Banana Island, Lagos",
      coordinates: { lat: 6.4474, lng: 3.4336 }
    },
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop"
    ],
    amenities: ["Swimming Pool", "Gym", "24/7 Security", "Air Conditioning", "Parking Space", "WiFi", "Furnished", "Balcony", "Beach Access"],
    features: ["Beachfront", "Private Pool", "Modern Kitchen", "Garden"],
    createdAt: new Date(),
    updatedAt: new Date(),
    vendorId: "vendor1",
    isActive: true,
    isFeatured: true
  },
  {
    title: "Commercial Office Space in Port Harcourt",
    description: "Modern office space in the heart of Port Harcourt business district. Perfect for corporate headquarters.",
    price: 45000000,
    status: "For Lease",
    type: "Commercial",
    bedrooms: 0,
    bathrooms: 2,
    sqft: 300,
    location: {
      city: "Port Harcourt",
      state: "Rivers",
      address: "Port Harcourt, Rivers",
      coordinates: { lat: 4.8156, lng: 7.0498 }
    },
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop"
    ],
    amenities: ["24/7 Security", "Air Conditioning", "Parking Space", "WiFi", "Elevator", "Conference Rooms"],
    features: ["Modern Design", "Conference Rooms", "Reception Area", "Parking"],
    createdAt: new Date(),
    updatedAt: new Date(),
    vendorId: "vendor4",
    isActive: true,
    isFeatured: false
  }
];

// Sample users/vendors data
const sampleUsers = [
  {
    id: "user1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    role: "buyer",
    roles: ["buyer", "vendor"],
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    phone: "+234 800 123 4567",
    location: {
      city: "Lagos",
      state: "Lagos"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "vendor1",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah@luxuryhomes.com",
    role: "vendor",
    roles: ["vendor"],
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    phone: "+234 800 234 5678",
    companyName: "Luxury Homes Nigeria",
    licenseNumber: "LHN001",
    location: {
      city: "Lagos",
      state: "Lagos"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "vendor2",
    firstName: "Michael",
    lastName: "Adebayo",
    email: "michael@premiumproperties.com",
    role: "vendor",
    roles: ["vendor"],
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    phone: "+234 800 345 6789",
    companyName: "Premium Properties",
    licenseNumber: "PP002",
    location: {
      city: "Lagos",
      state: "Lagos"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Function to seed data
async function seedData() {
  try {
    console.log('Starting to seed Firestore database...');

    // Add properties
    console.log('Adding properties...');
    for (const property of sampleProperties) {
      const docRef = await addDoc(collection(db, 'properties'), property);
      console.log(`Added property: ${property.title} with ID: ${docRef.id}`);
    }

    // Add users
    console.log('Adding users...');
    for (const user of sampleUsers) {
      await setDoc(doc(db, 'users', user.id), user);
      console.log(`Added user: ${user.firstName} ${user.lastName} with ID: ${user.id}`);
    }

    console.log('✅ Data seeding completed successfully!');
    console.log(`Added ${sampleProperties.length} properties and ${sampleUsers.length} users`);
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// Run the seed function
seedData();
