import React, { useState } from 'react';
import { FaPlus, FaCheck, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AdminDataSeeder = () => {
  const [isSeeding, setIsSeeding] = useState(false);

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
    },
    {
      title: "Apartment in Abuja Central",
      description: "Modern 2-bedroom apartment in the heart of Abuja with easy access to business districts.",
      price: 55000000,
      status: "For Rent",
      type: "Apartment",
      bedrooms: 2,
      bathrooms: 2,
      sqft: 120,
      location: {
        city: "Abuja",
        state: "Abuja (FCT)",
        address: "Abuja Central, Abuja",
        coordinates: { lat: 9.0579, lng: 7.4951 }
      },
      images: [
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop"
      ],
      amenities: ["24/7 Security", "Air Conditioning", "Parking Space", "WiFi", "Furnished"],
      features: ["City View", "Modern Kitchen", "Balcony"],
      createdAt: new Date(),
      updatedAt: new Date(),
      vendorId: "vendor3",
      isActive: true,
      isFeatured: false
    },
    {
      title: "Luxury Villa in Kano",
      description: "Spacious 6-bedroom villa in the ancient city of Kano with traditional and modern elements.",
      price: 85000000,
      status: "For Sale",
      type: "Villa",
      bedrooms: 6,
      bathrooms: 5,
      sqft: 350,
      location: {
        city: "Kano",
        state: "Kano",
        address: "Kano, Kano State",
        coordinates: { lat: 12.0022, lng: 8.5920 }
      },
      images: [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop"
      ],
      amenities: ["Garden", "24/7 Security", "Parking Space", "WiFi", "Furnished", "Swimming Pool"],
      features: ["Traditional Design", "Modern Kitchen", "Garden", "Study Room"],
      createdAt: new Date(),
      updatedAt: new Date(),
      vendorId: "vendor5",
      isActive: true,
      isFeatured: false
    }
  ];

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

  const seedProperties = async () => {
    setIsSeeding(true);
    try {
      let addedCount = 0;
      // Store to localStorage instead of Firestore
      const existingProperties = JSON.parse(localStorage.getItem('mockProperties') || '[]');
      for (const property of sampleProperties) {
        existingProperties.push({
          ...property,
          id: `property-${Date.now()}-${Math.random()}`
        });
        addedCount++;
      }
      localStorage.setItem('mockProperties', JSON.stringify(existingProperties));
      toast.success(`Successfully added ${addedCount} properties to local storage!`);
    } catch (error) {
      console.error('Error adding properties:', error);
      toast.error('Failed to add properties. Please check console for details.');
    } finally {
      setIsSeeding(false);
    }
  };

  const seedUsers = async () => {
    setIsSeeding(true);
    try {
      let addedCount = 0;
      // Store to localStorage instead of Firestore
      const existingUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
      for (const user of sampleUsers) {
        existingUsers.push(user);
        addedCount++;
      }
      localStorage.setItem('mockUsers', JSON.stringify(existingUsers));
      toast.success(`Successfully added ${addedCount} users to local storage!`);
    } catch (error) {
      console.error('Error adding users:', error);
      toast.error('Failed to add users. Please check console for details.');
    } finally {
      setIsSeeding(false);
    }
  };

  const seedAllData = async () => {
    setIsSeeding(true);
    try {
      // Store to localStorage instead of Firestore
      // Add users first
      const existingUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
      let userCount = 0;
      for (const user of sampleUsers) {
        existingUsers.push(user);
        userCount++;
      }
      localStorage.setItem('mockUsers', JSON.stringify(existingUsers));

      // Add properties
      const existingProperties = JSON.parse(localStorage.getItem('mockProperties') || '[]');
      let propertyCount = 0;
      for (const property of sampleProperties) {
        existingProperties.push({
          ...property,
          id: `property-${Date.now()}-${Math.random()}`
        });
        propertyCount++;
      }
      localStorage.setItem('mockProperties', JSON.stringify(existingProperties));

      toast.success(`Successfully added ${userCount} users and ${propertyCount} properties to local storage!`);
    } catch (error) {
      console.error('Error seeding data:', error);
      toast.error('Failed to seed data. Please check console for details.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Firestore Data Seeder</h2>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Sample Data</h3>
          <ul className="text-blue-800 space-y-1">
            <li>• {sampleProperties.length} Properties across Lagos, Abuja, Port Harcourt, and Kano</li>
            <li>• {sampleUsers.length} Users including buyers and vendors</li>
            <li>• Properties include: For Sale, For Rent, For Lease, and Shortlet</li>
            <li>• Property types: Apartment, House, Villa, Townhouse, Penthouse, Commercial</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={seedProperties}
            disabled={isSeeding}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSeeding ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <FaPlus className="mr-2" />
            )}
            Add Properties
          </button>

          <button
            onClick={seedUsers}
            disabled={isSeeding}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSeeding ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <FaPlus className="mr-2" />
            )}
            Add Users
          </button>

          <button
            onClick={seedAllData}
            disabled={isSeeding}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSeeding ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <FaCheck className="mr-2" />
            )}
            Add All Data
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Note:</h4>
          <p className="text-gray-700 text-sm">
            This will add sample data to your Firestore database. Make sure you're authenticated 
            and have the proper permissions to write to Firestore.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDataSeeder;
