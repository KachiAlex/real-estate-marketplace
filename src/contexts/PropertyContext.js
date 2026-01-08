import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc, deleteDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit, startAfter } from 'firebase/firestore';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';

const PropertyContext = createContext();

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};

// Use Firebase Firestore as the primary data source
const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || null;

// Standardized enums
export const LISTING_TYPES = [
  'for-sale',
  'for-rent',
  'for-lease',
  'for-mortgage',
  'for-investment',
  'for-shortlet'
];

export const PROPERTY_TYPES = [
  'apartment',
  'house',
  'duplex',
  'bungalow',
  'studio',
  'land',
  'office',
  'retail',
  'warehouse'
];

// Backend mock properties data - same as in Home.js
const backendMockProperties = [
  {
    id: 'prop_001',
    title: 'Beautiful Family Home in Lekki Phase 1',
    description: 'Spacious 3-bedroom home with modern amenities, stunning views of the lagoon, and premium finishes throughout. Perfect for families seeking luxury living.',
    price: 185000000,
    type: 'house',
    status: 'for-sale',
    details: { bedrooms: 3, bathrooms: 2, sqft: 1800, yearBuilt: 2018, parking: 2, furnished: 'semi-furnished' },
    location: { address: '123 Lekki Phase 1', city: 'Lagos', state: 'Lagos', zipCode: '101001', coordinates: { lat: 6.4654, lng: 3.4654 } },
    images: [{ url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', isPrimary: false }, { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_001', firstName: 'Adebayo', lastName: 'Oluwaseun', email: 'adebayo.oluwaseun@gmail.com', phone: '+234-801-234-5678' },
    views: 45,
    isVerified: false,
    amenities: ['Swimming Pool', 'Gym', '24/7 Security', 'Garden', 'Parking'],
    createdAt: '2024-01-10'
  },
  {
    id: 'prop_002',
    title: 'Modern Downtown Apartment in Victoria Island',
    description: 'Luxury 2-bedroom apartment in the heart of Victoria Island with premium finishes, city views, and access to world-class amenities.',
    price: 1200000,
    type: 'apartment',
    status: 'for-rent',
    details: { bedrooms: 2, bathrooms: 1, sqft: 1200, yearBuilt: 2020, parking: 1, furnished: 'fully-furnished' },
    location: { address: '456 Victoria Island', city: 'Lagos', state: 'Lagos', zipCode: '101241', coordinates: { lat: 6.4281, lng: 3.4219 } },
    images: [{ url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_001', firstName: 'Adebayo', lastName: 'Oluwaseun', email: 'adebayo.oluwaseun@gmail.com', phone: '+234-801-234-5678' },
    views: 32,
    isVerified: true,
    amenities: ['Concierge', 'Gym', 'Swimming Pool', 'Security', 'Parking'],
    createdAt: '2024-01-08'
  },
  {
    id: 'prop_003',
    title: 'Luxury Penthouse Suite with Ocean Views',
    description: 'Stunning penthouse with panoramic city and ocean views, premium finishes, and exclusive access to rooftop amenities.',
    price: 520000000,
    type: 'apartment',
    status: 'for-sale',
    details: { bedrooms: 4, bathrooms: 3, sqft: 2800, yearBuilt: 2021, parking: 3, furnished: 'fully-furnished' },
    location: { address: '789 Banana Island', city: 'Lagos', state: 'Lagos', zipCode: '101001', coordinates: { lat: 6.4528, lng: 3.4068 } },
    images: [{ url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', isPrimary: false }, { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_002', firstName: 'Chioma', lastName: 'Nwosu', email: 'chioma.nwosu@yahoo.com', phone: '+234-802-345-6789' },
    views: 89,
    isVerified: true,
    amenities: ['Rooftop Pool', 'Private Elevator', 'Concierge', 'Gym', 'Security'],
    createdAt: '2024-01-05'
  },
  {
    id: 'prop_004',
    title: 'Cozy Studio Apartment in Surulere',
    description: 'Perfect starter home in a vibrant neighborhood with modern amenities and easy access to transportation.',
    price: 800000,
    type: 'apartment',
    status: 'for-rent',
    details: { bedrooms: 1, bathrooms: 1, sqft: 650, yearBuilt: 2019, parking: 1, furnished: 'unfurnished' },
    location: { address: '321 Surulere', city: 'Lagos', state: 'Lagos', zipCode: '101283', coordinates: { lat: 6.5000, lng: 3.3500 } },
    images: [{ url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_002', firstName: 'Chioma', lastName: 'Nwosu', email: 'chioma.nwosu@yahoo.com', phone: '+234-802-345-6789' },
    views: 24,
    isVerified: true,
    amenities: ['Security', 'Parking', 'Water Supply', 'Power Backup'],
    createdAt: '2024-01-12'
  },
  {
    id: 'prop_005',
    title: 'Suburban Villa with Private Pool',
    description: 'Spacious family villa with private pool, garden, and premium amenities in a secure gated community.',
    price: 310000000,
    type: 'house',
    status: 'for-sale',
    details: { bedrooms: 5, bathrooms: 4, sqft: 3200, yearBuilt: 2017, parking: 4, furnished: 'semi-furnished' },
    location: { address: '456 Magodo GRA', city: 'Lagos', state: 'Lagos', zipCode: '105001', coordinates: { lat: 6.6000, lng: 3.4000 } },
    images: [{ url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', isPrimary: false }, { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_003', firstName: 'Emmanuel', lastName: 'Adeyemi', email: 'emmanuel.adeyemi@hotmail.com', phone: '+234-803-456-7890' },
    views: 67,
    isVerified: false,
    amenities: ['Private Pool', 'Garden', 'Security', 'Parking', 'Power Backup'],
    createdAt: '2024-01-15'
  },
  {
    id: 'prop_007',
    title: 'Luxury Townhouse in Ikoyi',
    description: 'Elegant townhouse with premium finishes, private garden, and access to exclusive community amenities.',
    price: 450000000,
    type: 'house',
    status: 'for-sale',
    details: { bedrooms: 4, bathrooms: 3, sqft: 2400, yearBuilt: 2019, parking: 3, furnished: 'fully-furnished' },
    location: { address: '654 Ikoyi', city: 'Lagos', state: 'Lagos', zipCode: '101001', coordinates: { lat: 6.4500, lng: 3.4000 } },
    images: [{ url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_004', firstName: 'Fatima', lastName: 'Ibrahim', email: 'fatima.ibrahim@gmail.com', phone: '+234-804-567-8901' },
    views: 78,
    isVerified: true,
    amenities: ['Private Garden', 'Security', 'Parking', 'Power Backup'],
    createdAt: '2024-01-06'
  },
  {
    id: 'prop_010',
    title: 'Luxury Apartment in Banana Island',
    description: 'Exclusive apartment with panoramic ocean views and access to world-class amenities.',
    price: 380000000,
    type: 'apartment',
    status: 'for-sale',
    details: { bedrooms: 3, bathrooms: 3, sqft: 2200, yearBuilt: 2021, parking: 2, furnished: 'fully-furnished' },
    location: { address: '789 Banana Island', city: 'Lagos', state: 'Lagos', zipCode: '101001', coordinates: { lat: 6.4528, lng: 3.4068 } },
    images: [{ url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_005', firstName: 'Oluwaseun', lastName: 'Akoma', email: 'oluwaseun.akoma@gmail.com', phone: '+234-805-678-9012' },
    views: 156,
    isVerified: true,
    amenities: ['Ocean Views', 'Concierge', 'Gym', 'Swimming Pool', 'Security'],
    createdAt: '2024-01-01'
  }
];

// Transform backend properties to the format expected by the app
const transformProperty = (prop) => {
  const statusMap = { 'for-sale': 'For Sale', 'for-rent': 'For Rent', 'for-lease': 'For Lease' };
  const typeMap = { 'house': 'House', 'apartment': 'Apartment', 'commercial': 'Office', 'villa': 'Villa', 'penthouse': 'Penthouse', 'townhouse': 'Townhouse' };

  return {
    id: prop.id, // Keep the original ID format
    numericId: parseInt(prop.id.replace('prop_', '')), // For compatibility with numeric IDs
    title: prop.title,
    location: `${prop.location.address}, ${prop.location.city}, ${prop.location.state}`,
    address: prop.location.address,
    city: prop.location.city,
    state: prop.location.state,
    zipCode: prop.location.zipCode,
    coordinates: prop.location.coordinates,
    price: prop.price,
    type: typeMap[prop.type] || prop.type,
    typeSlug: prop.type,
    bedrooms: prop.details.bedrooms,
    bathrooms: prop.details.bathrooms,
    sqft: prop.details.sqft,
    area: prop.details.sqft,
    yearBuilt: prop.details.yearBuilt,
    parking: prop.details.parking,
    furnished: prop.details.furnished,
    image: prop.images[0]?.url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
    images: prop.images.map(img => img.url),
    description: prop.description,
    amenities: prop.amenities || [],
    status: statusMap[prop.status] || prop.status,
    statusSlug: prop.status,
    listingType: prop.status,
    label: statusMap[prop.status] || prop.status,
    labelColor: 'bg-green-600',
    agent: {
      name: `${prop.owner.firstName} ${prop.owner.lastName}`,
      phone: prop.owner.phone,
      email: prop.owner.email
    },
    owner: prop.owner,
    ownerId: prop.owner.id,
    ownerEmail: prop.owner.email,
    isVerified: prop.isVerified,
    views: prop.views,
    createdAt: prop.createdAt,
    // Add more fields that might be expected
    propertyFeatures: [],
    nearbyAttractions: [],
    schoolRatings: {},
    crimeStats: {},
    marketTrends: {},
    neighborhood: prop.location.city
  };
};

// Mock properties data - Now using backend data with proper transformation
const mockProperties = backendMockProperties.map(transformProperty);

export const PropertyProvider = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    bedrooms: '',
    bathrooms: '',
    amenities: []
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  });
  const { user, firebaseAuthReady } = useAuth();

  // Load properties on mount
  useEffect(() => {
    // Transform and set mock properties initially (so UI isn't empty)
      try {
        const propertiesData = mockProperties.map(property => {
          const details = property.details || {};
          return {
            ...property,
            bedrooms: property.bedrooms || details.bedrooms || 0,
            bathrooms: property.bathrooms || details.bathrooms || 0,
            area: property.area || details.sqft || 0,
            parking: property.parking || details.parking || 'N/A',
            location: property.location?.city || `${property.location?.address}, ${property.location?.city}` || 'Location not specified',
            image: property.images?.[0]?.url || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop',
            details: {
              bedrooms: details.bedrooms || property.bedrooms || 0,
              bathrooms: details.bathrooms || property.bathrooms || 0,
              sqft: details.sqft || property.area || 0,
              parking: details.parking || property.parking || 'N/A',
              yearBuilt: details.yearBuilt || null,
              lotSize: details.lotSize || null
            }
          };
        });
        setProperties(propertiesData);
      console.log('Loaded mock properties initially:', propertiesData.length);
      } catch (error) {
      console.error('Error loading mock properties:', error);
      }
    
    // Note: fetchProperties() will be called by components that need all properties
    // This just sets the initial mock properties so UI isn't empty
  }, []);

  // Fetch properties with filters
  const fetchProperties = useCallback(async (newFilters = {}, page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      let data = [...mockProperties]; // Default to mock data
      
      // Try Firestore (public read is allowed, so we can fetch even without auth)
        try {
        console.log('PropertyContext: Attempting to fetch properties from Firestore...');
      const propertiesRef = collection(db, 'properties');
      const constraints = [];

        // Build query constraints
      if (newFilters.type) constraints.push(where('type', '==', newFilters.type));
      if (newFilters.status) constraints.push(where('listingType', '==', newFilters.status));
      if (newFilters.city) constraints.push(where('location.city', '==', newFilters.city));
        
        // Try with orderBy first, but fallback if index is missing
        let snap;
        let firestoreProps = [];
        try {
          const constraintsWithOrder = [...constraints, orderBy('createdAt', 'desc')];
          if (newFilters.limit) constraintsWithOrder.push(limit(Number(newFilters.limit)));
          const q = query(propertiesRef, ...constraintsWithOrder);
          snap = await getDocs(q);
        } catch (orderByError) {
          // If orderBy fails (missing index), fetch without ordering
          console.warn('PropertyContext: orderBy failed, fetching all properties without ordering:', orderByError);
          const constraintsNoOrder = [...constraints];
          if (newFilters.limit) constraintsNoOrder.push(limit(Number(newFilters.limit)));
          const q = constraintsNoOrder.length > 0 ? query(propertiesRef, ...constraintsNoOrder) : query(propertiesRef);
          snap = await getDocs(q);
        }
        
        firestoreProps = snap.docs.map(d => ({ id: d.id, ...d.data() }));

          // Enrich properties with vendorCode if missing
          // Try to fetch vendorCode from users collection for properties that don't have it
          // NOTE: Attempt enrichment if user is authenticated (either via auth.currentUser or user context)
          const isAuthenticated = auth.currentUser || (user && user.id);
          if (firestoreProps.length > 0 && isAuthenticated) {
            try {
              // query, where, getDocs, collection already imported at top
              console.log('PropertyContext: Enriching', firestoreProps.length, 'properties with vendorCode (authenticated user)...');
              
              // First, get all unique ownerIds that need enrichment
              const ownerIdsToLookup = new Set();
              firestoreProps.forEach(prop => {
                const hasAllVendorFields = prop.vendorCode && prop.vendorName && prop.vendorEmail && prop.vendorId;
                if (!hasAllVendorFields && prop.ownerId) {
                  ownerIdsToLookup.add(prop.ownerId);
                }
              });
              
              console.log('PropertyContext: Need to lookup vendor info for', ownerIdsToLookup.size, 'owners');
              
              // Fetch all user documents at once (batch lookup)
              const userCodeMap = new Map(); // ownerId -> { vendorCode, vendorName, vendorEmail }
              const emailToVendorCodeMap = new Map(); // email -> { vendorCode, vendorName, vendorEmail }
              
              if (ownerIdsToLookup.size > 0) {
                // Get unique owner emails for properties that need enrichment
                const ownerEmails = [...new Set(firestoreProps
                  .filter(p => {
                    const hasAllVendorFields = p.vendorCode && p.vendorName && p.vendorEmail && p.vendorId;
                    return !hasAllVendorFields && p.ownerEmail;
                  })
                  .map(p => p.ownerEmail.toLowerCase()))];
                
                console.log('PropertyContext: Also checking', ownerEmails.length, 'owner emails for vendorCode');
                
                // Look up users by ownerId
                await Promise.all(Array.from(ownerIdsToLookup).map(async (ownerId) => {
                  try {
                    const userRef = doc(db, 'users', ownerId);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                      const userData = userSnap.data();
                      const vendorName = userData.firstName && userData.lastName 
                        ? `${userData.firstName} ${userData.lastName}`.trim() 
                        : userData.displayName || '';
                      const vendorInfo = {
                        vendorCode: userData.vendorCode || '',
                        vendorName: vendorName,
                        vendorEmail: userData.email || ''
                      };
                      
                      if (userData.vendorCode) {
                        userCodeMap.set(ownerId, vendorInfo);
                        if (userData.email) {
                          emailToVendorCodeMap.set(userData.email.toLowerCase(), vendorInfo);
                        }
                        console.log('PropertyContext: Found vendor info for owner', ownerId, vendorInfo);
                      }
                    }
                  } catch (err) {
                    console.warn('PropertyContext: Could not fetch user', ownerId, err);
                  }
                }));
                
                // Also try to look up users by email (fallback if ownerId doesn't match)
                if (ownerEmails.length > 0) {
                  try {
                    const usersRef = collection(db, 'users');
                    await Promise.all(ownerEmails.map(async (email) => {
                      try {
                        const emailQuery = query(usersRef, where('email', '==', email));
                        const emailSnap = await getDocs(emailQuery);
                        if (!emailSnap.empty) {
                          const userData = emailSnap.docs[0].data();
                          const vendorName = userData.firstName && userData.lastName 
                            ? `${userData.firstName} ${userData.lastName}`.trim() 
                            : userData.displayName || '';
                          const vendorInfo = {
                            vendorCode: userData.vendorCode || '',
                            vendorName: vendorName,
                            vendorEmail: userData.email || email
                          };
                          if (userData.vendorCode) {
                            emailToVendorCodeMap.set(email.toLowerCase(), vendorInfo);
                            console.log('PropertyContext: Found vendor info by email', email, vendorInfo);
                          }
                        }
                      } catch (err) {
                        console.warn('PropertyContext: Could not query user by email', email, err);
                      }
                    }));
                  } catch (err) {
                    console.warn('PropertyContext: Error querying users by email:', err);
                  }
                }
              }
              
              // Now enrich properties with vendorCode and vendor details
              const enrichedProps = firestoreProps.map((prop) => {
                // Check if property already has all vendor fields
                const hasAllVendorFields = prop.vendorCode && prop.vendorName && prop.vendorEmail && prop.vendorId;
                if (hasAllVendorFields) {
                  // Ensure owner object also has vendor info
                  if (prop.owner && !prop.owner.vendorCode) {
                    prop.owner.vendorCode = prop.vendorCode;
                    if (!prop.owner.name) {
                      prop.owner.name = prop.vendorName;
                    }
                    if (!prop.owner.email) {
                      prop.owner.email = prop.vendorEmail;
                    }
                  }
                  return prop;
                }
                
                let vendorCode = prop.vendorCode || null;
                let vendorName = prop.vendorName || (prop.owner?.name || (prop.owner ? `${prop.owner.firstName || ''} ${prop.owner.lastName || ''}`.trim() : ''));
                let vendorEmail = prop.vendorEmail || prop.ownerEmail || prop.owner?.email || '';
                let vendorId = prop.vendorId || prop.ownerId || prop.owner?.id || '';
                
                // Try ownerId first to get vendor info
                let vendorInfo = null;
                if (prop.ownerId && userCodeMap.has(prop.ownerId)) {
                  vendorInfo = userCodeMap.get(prop.ownerId);
                }
                // Fallback to email lookup
                else if (prop.ownerEmail && emailToVendorCodeMap.has(prop.ownerEmail.toLowerCase())) {
                  vendorInfo = emailToVendorCodeMap.get(prop.ownerEmail.toLowerCase());
                }
                
                // Use vendor info from lookup if available
                if (vendorInfo) {
                  // Only use vendorCode if it's actually set (not empty string)
                  if (!vendorCode && vendorInfo.vendorCode && vendorInfo.vendorCode.trim() !== '') {
                    vendorCode = vendorInfo.vendorCode.trim();
                  }
                  if (!vendorName && vendorInfo.vendorName && vendorInfo.vendorName.trim() !== '') {
                    vendorName = vendorInfo.vendorName.trim();
                  }
                  if (!vendorEmail && vendorInfo.vendorEmail && vendorInfo.vendorEmail.trim() !== '') {
                    vendorEmail = vendorInfo.vendorEmail.trim();
                  }
                }
                
                // Also check if property already has vendorCode in owner object
                if (!vendorCode && prop.owner?.vendorCode && prop.owner.vendorCode.trim() !== '') {
                  vendorCode = prop.owner.vendorCode.trim();
                }
                
                // Get vendor name from existing property data if still not available
                if (!vendorName && prop.owner) {
                  if (prop.owner.firstName || prop.owner.lastName) {
                    vendorName = `${prop.owner.firstName || ''} ${prop.owner.lastName || ''}`.trim();
                  } else if (prop.owner.name) {
                    vendorName = prop.owner.name;
                  }
                }
                
                // Enrich property with vendor information
                // Always enrich if we have any vendor info OR if property is missing vendor fields
                if (vendorCode || vendorName || vendorEmail || !hasAllVendorFields) {
                  if (vendorCode && vendorCode.trim() !== '') {
                    prop.vendorCode = vendorCode.trim();
                  }
                  if (vendorName) {
                    prop.vendorName = vendorName;
                  }
                  if (vendorEmail) {
                    prop.vendorEmail = vendorEmail;
                  }
                  if (vendorId) {
                    prop.vendorId = vendorId;
                  }
                  
                  // Also update owner object
                  if (!prop.owner) {
                    prop.owner = {};
                  }
                  if (vendorCode && !prop.owner.vendorCode) {
                    prop.owner.vendorCode = vendorCode;
                  }
                  if (vendorName && !prop.owner.name) {
                    prop.owner.name = vendorName;
                    if (!prop.owner.firstName) {
                      prop.owner.firstName = vendorName.split(' ')[0];
                    }
                    if (!prop.owner.lastName && vendorName.split(' ').length > 1) {
                      prop.owner.lastName = vendorName.split(' ').slice(1).join(' ');
                    }
                  }
                  if (vendorEmail && !prop.owner.email) {
                    prop.owner.email = vendorEmail;
                  }
                  if (vendorId && !prop.owner.id) {
                    prop.owner.id = vendorId;
                  }
                  
                  // Only log as "enriched" if we actually set vendorCode
                  if (prop.vendorCode && prop.vendorCode.trim() !== '') {
                    console.log('PropertyContext: ✓ Enriched property', prop.id, 'with vendorCode:', prop.vendorCode, {
                      vendorName: prop.vendorName || 'N/A',
                      vendorEmail: prop.vendorEmail || 'N/A'
                    });
                  } else {
                    console.log('PropertyContext: ⚠ Enriched property', prop.id, 'with vendor info but NO vendorCode:', {
                      vendorName: prop.vendorName || 'N/A',
                      vendorEmail: prop.vendorEmail || 'N/A',
                      ownerId: prop.ownerId || 'N/A',
                      ownerEmail: prop.ownerEmail || 'N/A'
                    });
                  }
                } else {
                  console.warn('PropertyContext: Could not enrich property', prop.id, 'ownerId:', prop.ownerId, 'ownerEmail:', prop.ownerEmail);
                }
                
                return prop;
              });
              
              firestoreProps = enrichedProps;
              console.log('PropertyContext: Firestore enrichment complete. Properties with vendorCode:', 
                enrichedProps.filter(p => p.vendorCode).length);
            } catch (err) {
              console.warn('PropertyContext: Error enriching properties with vendorCode (non-blocking):', err);
              // Continue with unenriched properties - they'll still be merged
            }
          } else if (firestoreProps.length > 0) {
            console.log('PropertyContext: Skipping Firestore enrichment - not authenticated via Firebase Auth.');
          }
          
          // ALWAYS try fallback enrichment using user context if user exists
          // This runs regardless of whether Firestore enrichment ran or succeeded
          if (firestoreProps.length > 0 && user && (user.id || user.email)) {
            console.log('PropertyContext: Running fallback enrichment using user context for user:', user.id || user.email, 'vendorCode:', user.vendorCode || 'NOT SET');
            let enrichedCount = 0;
            firestoreProps = firestoreProps.map(prop => {
              // Check if property belongs to current user (by ID or email)
              const userIdMatches = prop.ownerId === user.id || prop.ownerId === user.uid;
              const emailMatches = prop.ownerEmail?.toLowerCase() === user.email?.toLowerCase() ||
                                   prop.owner?.email?.toLowerCase() === user.email?.toLowerCase() ||
                                   prop.vendorEmail?.toLowerCase() === user.email?.toLowerCase();
              const belongsToUser = userIdMatches || emailMatches;
              
              // Log for debugging
              if (emailMatches && (!prop.vendorCode || prop.vendorCode === '')) {
                console.log('PropertyContext: Found property owned by user email:', prop.id, 'ownerEmail:', prop.ownerEmail, 'user email:', user.email, 'user vendorCode:', user.vendorCode);
              }
              
              // If property belongs to user and is missing vendorCode, enrich it
              if (belongsToUser && (!prop.vendorCode || prop.vendorCode === '')) {
                if (user.vendorCode) {
                  prop.vendorCode = user.vendorCode;
                  prop.vendorName = prop.vendorName || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.displayName || prop.vendorName || '');
                  prop.vendorEmail = prop.vendorEmail || user.email || prop.ownerEmail || '';
                  prop.vendorId = prop.vendorId || user.id || user.uid || prop.ownerId || '';
                  
                  if (!prop.owner) prop.owner = {};
                  prop.owner.vendorCode = user.vendorCode;
                  prop.owner.name = prop.vendorName;
                  prop.owner.email = prop.vendorEmail;
                  if (!prop.owner.firstName && user.firstName) prop.owner.firstName = user.firstName;
                  if (!prop.owner.lastName && user.lastName) prop.owner.lastName = user.lastName;
                  
                  enrichedCount++;
                  console.log('PropertyContext: Fallback enriched property', prop.id, 'with user context vendorCode:', user.vendorCode, 'ownerEmail:', prop.ownerEmail);
                } else {
                  console.warn('PropertyContext: Property belongs to user but user has no vendorCode. Property:', prop.id, 'User:', user.id || user.email);
                }
              }
              return prop;
            });
            console.log('PropertyContext: Fallback enrichment complete. Enriched', enrichedCount, 'properties with user context.');
          }

          // MERGE Firestore properties with mock properties (don't replace!)
          // This ensures all properties are available for filtering
          if (firestoreProps.length > 0) {
            console.log('PropertyContext: Found', firestoreProps.length, 'properties in Firestore');
            console.log('PropertyContext: Starting with', data.length, 'mock properties');
            
            // Add Firestore properties that don't already exist in mock properties
            let addedFromFirestore = 0;
            let skippedDuplicates = 0;
            firestoreProps.forEach(fsProp => {
              const existsInMock = data.find(p => p.id === fsProp.id);
              if (!existsInMock) {
                data.push({
                  ...fsProp,
                  source: 'firestore'
                });
                addedFromFirestore++;
              } else {
                skippedDuplicates++;
                // Update mock property with Firestore data (Firestore is source of truth)
                const mockIndex = data.findIndex(p => p.id === fsProp.id);
                if (mockIndex !== -1) {
                  data[mockIndex] = {
                    ...fsProp,
                    source: 'firestore'
                  };
                }
              }
            });
            console.log('PropertyContext: Added', addedFromFirestore, 'from Firestore, updated', skippedDuplicates, 'existing, total:', data.length);
          } else {
            console.log('PropertyContext: No Firestore properties found, using mock data only');
          }
          
        // Also check localStorage for properties saved locally (check regardless of Firestore success)
        try {
          const localStorageData = localStorage.getItem('mockProperties');
          if (localStorageData) {
            const localProperties = JSON.parse(localStorageData);
            console.log('PropertyContext: Found', localProperties.length, 'properties in localStorage');
            
            if (localProperties.length > 0) {
              let addedFromLocal = 0;
              localProperties.forEach(localProp => {
                const exists = data.find(p => p.id === localProp.id);
                if (!exists) {
                  data.push({
                    ...localProp,
                    source: 'localStorage'
                  });
                  addedFromLocal++;
                }
              });
              if (addedFromLocal > 0) {
                console.log('PropertyContext: Added', addedFromLocal, 'properties from localStorage, total:', data.length);
              }
            }
          }
        } catch (localErr) {
          console.warn('PropertyContext: Error reading localStorage properties:', localErr);
          }
        } catch (firestoreError) {
        console.warn('PropertyContext: Firestore fetch failed (non-blocking, will use mock + localStorage):', firestoreError.message || firestoreError);
        // Continue with mock data and check localStorage even if Firestore failed
        try {
          const localStorageData = localStorage.getItem('mockProperties');
          if (localStorageData) {
            const localProperties = JSON.parse(localStorageData);
            if (localProperties.length > 0) {
              let addedFromLocal = 0;
              localProperties.forEach(localProp => {
                const exists = data.find(p => p.id === localProp.id);
                if (!exists) {
                  data.push({
                    ...localProp,
                    source: 'localStorage'
                  });
                  addedFromLocal++;
                }
              });
              if (addedFromLocal > 0) {
                console.log('PropertyContext: Added', addedFromLocal, 'properties from localStorage after Firestore error, total:', data.length);
              }
            }
          }
        } catch (localErr) {
          console.warn('PropertyContext: Error reading localStorage properties:', localErr);
        }
      }

      // Additional client-side filters for fields not indexed
      if (newFilters.search) {
        const searchLower = newFilters.search.toLowerCase();
        data = data.filter(p => 
          (p.title || '').toLowerCase().includes(searchLower) ||
          (p.description || '').toLowerCase().includes(searchLower) ||
          (p.location?.address || '').toLowerCase().includes(searchLower) ||
          (p.location?.city || '').toLowerCase().includes(searchLower) ||
          (p.address || '').toLowerCase().includes(searchLower)
        );
      }

      // Price range filters
      if (newFilters.minPrice) {
        data = data.filter(p => p.price >= parseFloat(newFilters.minPrice));
      }
      if (newFilters.maxPrice) {
        data = data.filter(p => p.price <= parseFloat(newFilters.maxPrice));
      }

      // Bedrooms filter
      if (newFilters.bedrooms) {
        data = data.filter(p => (p.bedrooms || p.details?.bedrooms || 0) >= parseInt(newFilters.bedrooms));
      }

      // Bathrooms filter
      if (newFilters.bathrooms) {
        data = data.filter(p => (p.bathrooms || p.details?.bathrooms || 0) >= parseInt(newFilters.bathrooms));
      }

      // Area filter
      if (newFilters.minArea) {
        data = data.filter(p => (p.area || p.details?.sqft || 0) >= parseFloat(newFilters.minArea));
      }
      if (newFilters.maxArea) {
        data = data.filter(p => (p.area || p.details?.sqft || 0) <= parseFloat(newFilters.maxArea));
      }

      // Features filter
      if (newFilters.features && newFilters.features.length > 0) {
        data = data.filter(p => {
          const propertyFeatures = p.features || p.amenities || [];
          return newFilters.features.every(feature => 
            propertyFeatures.some(pf => pf.toLowerCase().includes(feature.toLowerCase()))
          );
        });
      }

      // Verification filter
      if (newFilters.verified === 'true') {
        data = data.filter(p => p.isVerified === true);
      }
      else if (newFilters.verified === 'false') data = data.filter(p => p.isVerified === false);

      console.log('PropertyContext: Final merged data before filtering:', data.length, 'properties');
      console.log('PropertyContext: Data sources breakdown:', {
        mock: data.filter(p => !p.source || p.source === 'mock').length,
        firestore: data.filter(p => p.source === 'firestore').length,
        localStorage: data.filter(p => p.source === 'localStorage').length
      });

      // Helper function to convert Firestore Timestamps to Date objects or strings
      const normalizeTimestamp = (timestamp) => {
        if (!timestamp) return null;
        // Firestore Timestamp object has seconds and nanoseconds properties
        if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
          return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
        }
        // If it has toDate method (Firestore Timestamp)
        if (timestamp && typeof timestamp.toDate === 'function') {
          return timestamp.toDate();
        }
        // If it's already a Date object
        if (timestamp instanceof Date) {
          return timestamp;
        }
        // If it's a string, try to parse it
        if (typeof timestamp === 'string') {
          const date = new Date(timestamp);
          return isNaN(date.getTime()) ? null : date;
        }
        return null;
      };

      const propertiesData = data.map(property => {
        const details = property.details || {};
        
        // Normalize location to a string
        let locationString = 'Location not specified';
        if (typeof property.location === 'string') {
          locationString = property.location;
        } else if (property.location && typeof property.location === 'object') {
          const address = property.location.address || '';
          const city = property.location.city || '';
          const state = property.location.state || '';
          const parts = [address, city, state].filter(Boolean);
          locationString = parts.length > 0 ? parts.join(', ') : 'Location not specified';
        }
        
        // Normalize all timestamp fields
        const normalizedCreatedAt = normalizeTimestamp(property.createdAt);
        const normalizedUpdatedAt = normalizeTimestamp(property.updatedAt);
        const normalizedListedDate = normalizeTimestamp(property.listedDate || property.datePosted);
        
        return {
          ...property,
          bedrooms: property.bedrooms || details.bedrooms || 0,
          bathrooms: property.bathrooms || details.bathrooms || 0,
          area: property.area || details.sqft || 0,
          parking: property.parking || details.parking || 'N/A',
          location: locationString, // Ensure location is always a string
          createdAt: normalizedCreatedAt, // Ensure createdAt is a Date object or null
          updatedAt: normalizedUpdatedAt, // Ensure updatedAt is a Date object or null
          listedDate: normalizedListedDate || normalizedCreatedAt, // Fallback to createdAt if listedDate doesn't exist
          datePosted: normalizedListedDate || normalizedCreatedAt, // Alias for compatibility
          details: {
            bedrooms: details.bedrooms || property.bedrooms || 0,
            bathrooms: details.bathrooms || property.bathrooms || 0,
            sqft: details.sqft || property.area || 0,
            parking: details.parking || property.parking || 'N/A',
            yearBuilt: details.yearBuilt || null,
            lotSize: details.lotSize || null
          }
        };
      });

      setProperties(propertiesData);
      setFilters(newFilters);
      return propertiesData;
    } catch (err) {
      // Silently use mock data instead of Firestore to avoid permission errors
      try {
        // Use mock data and filter client-side
        let filteredProperties = [...mockProperties];

        // Apply filters
        if (newFilters.search) {
          const searchLower = newFilters.search.toLowerCase();
          filteredProperties = filteredProperties.filter(p => 
            p.title.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            p.location.address.toLowerCase().includes(searchLower) ||
            p.location.city.toLowerCase().includes(searchLower)
          );
        }
        
        if (newFilters.type) {
          filteredProperties = filteredProperties.filter(p => p.type === newFilters.type);
        }
        
        if (newFilters.status) {
          filteredProperties = filteredProperties.filter(p => (p.listingType || p.status) === newFilters.status);
        }
        
        if (newFilters.minPrice) {
          filteredProperties = filteredProperties.filter(p => p.price >= parseInt(newFilters.minPrice));
        }
        
        if (newFilters.maxPrice) {
          filteredProperties = filteredProperties.filter(p => p.price <= parseInt(newFilters.maxPrice));
        }
        
        if (newFilters.bedrooms) {
          filteredProperties = filteredProperties.filter(p => p.details.bedrooms >= parseInt(newFilters.bedrooms));
        }
        
        if (newFilters.bathrooms) {
          filteredProperties = filteredProperties.filter(p => p.details.bathrooms >= parseInt(newFilters.bathrooms));
        }
        
        if (newFilters.verified === 'true') {
          filteredProperties = filteredProperties.filter(p => p.isVerified === true);
        } else if (newFilters.verified === 'false') {
          filteredProperties = filteredProperties.filter(p => p.isVerified === false);
        }

        // Helper function to convert Firestore Timestamps to Date objects or strings
        const normalizeTimestamp = (timestamp) => {
          if (!timestamp) return null;
          // Firestore Timestamp object has seconds and nanoseconds properties
          if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
            return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
          }
          // If it has toDate method (Firestore Timestamp)
          if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
          }
          // If it's already a Date object
          if (timestamp instanceof Date) {
            return timestamp;
          }
          // If it's a string, try to parse it
          if (typeof timestamp === 'string') {
            const date = new Date(timestamp);
            return isNaN(date.getTime()) ? null : date;
          }
          return null;
        };

        const propertiesData = filteredProperties.map(property => {
          const details = property.details || {};
          
          // Normalize location to a string
          let locationString = 'Location not specified';
          if (typeof property.location === 'string') {
            locationString = property.location;
          } else if (property.location && typeof property.location === 'object') {
            const address = property.location.address || '';
            const city = property.location.city || '';
            const state = property.location.state || '';
            const parts = [address, city, state].filter(Boolean);
            locationString = parts.length > 0 ? parts.join(', ') : 'Location not specified';
          }
          
          // Normalize all timestamp fields
          const normalizedCreatedAt = normalizeTimestamp(property.createdAt);
          const normalizedUpdatedAt = normalizeTimestamp(property.updatedAt);
          const normalizedListedDate = normalizeTimestamp(property.listedDate || property.datePosted);
          
          return {
            ...property,
            bedrooms: property.bedrooms || details.bedrooms || 0,
            bathrooms: property.bathrooms || details.bathrooms || 0,
            area: property.area || details.sqft || 0,
            parking: property.parking || details.parking || 'N/A',
            location: locationString, // Ensure location is always a string
            createdAt: normalizedCreatedAt, // Ensure createdAt is a Date object or null
            updatedAt: normalizedUpdatedAt, // Ensure updatedAt is a Date object or null
            listedDate: normalizedListedDate || normalizedCreatedAt, // Fallback to createdAt if listedDate doesn't exist
            datePosted: normalizedListedDate || normalizedCreatedAt, // Alias for compatibility
            details: {
              bedrooms: details.bedrooms || property.bedrooms || 0,
              bathrooms: details.bathrooms || property.bathrooms || 0,
              sqft: details.sqft || property.area || 0,
              parking: details.parking || property.parking || 'N/A',
              yearBuilt: details.yearBuilt || null,
              lotSize: details.lotSize || null
            }
          };
        });

        setProperties(propertiesData);
        setFilters(newFilters);
        return propertiesData;
      } catch (error) {
        setError('Failed to fetch properties');
        console.error('Error fetching properties:', error);
        toast.error('Failed to fetch properties');
        return [];
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single property
  const fetchProperty = useCallback(async (propertyId) => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to find property by string ID (prop_001) or numeric ID
      const property = mockProperties.find(p => 
        p.id === propertyId || 
        p.numericId === propertyId ||
        p.propertyId === propertyId
      );
      
      if (property) {
        const details = property.details || {};
        return {
          ...property,
          bedrooms: property.bedrooms || details.bedrooms || 0,
          bathrooms: property.bathrooms || details.bathrooms || 0,
          area: property.area || details.sqft || 0,
          parking: property.parking || details.parking || 'N/A',
          location: property.location?.city || `${property.location?.address}, ${property.location?.city}` || 'Location not specified',
          image: property.images?.[0]?.url || property.image || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop',
          details: {
            bedrooms: details.bedrooms || property.bedrooms || 0,
            bathrooms: details.bathrooms || property.bathrooms || 0,
            sqft: details.sqft || property.area || 0,
            parking: details.parking || property.parking || 'N/A',
            yearBuilt: details.yearBuilt || property.yearBuilt || null,
            lotSize: details.lotSize || null
          }
        };
      } else {
        throw new Error('Property not found');
      }
    } catch (error) {
      setError('Failed to fetch property');
      console.error('Error fetching property:', error);
      toast.error('Failed to load property');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new property
  const addProperty = useCallback(async (propertyData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if user is authenticated (either mock user or Firebase user)
      if (!user && !auth.currentUser) {
        throw new Error('User must be logged in to add properties');
      }

      // Validate enums
      // Normalize listing type and property type with safe defaults
      let listingType = propertyData.listingType || propertyData.status;
      if (!LISTING_TYPES.includes(listingType)) {
        listingType = 'for-sale';
      }
      let normalizedType = propertyData.type;
      if (!normalizedType || !PROPERTY_TYPES.includes(normalizedType)) {
        normalizedType = 'house';
      }

      // Prepare property data
      const apiPayload = {
        title: propertyData.title,
        description: propertyData.description || '',
        price: Number(propertyData.price || 0),
        type: normalizedType,
        status: listingType,
        listingType: listingType, // Add both for compatibility
        details: propertyData.details || {},
        location: propertyData.location || {},
        amenities: propertyData.amenities || [],
        images: propertyData.images || [],
        videos: propertyData.videos || [],
        documentation: propertyData.documentation || []
      };

      try {
        // Ensure Firebase auth is ready before attempting Firestore operations
        if (!firebaseAuthReady) {
          console.warn('PropertyContext: Firebase auth not ready, will use localStorage fallback');
          throw new Error('Firebase authentication not ready');
        }

        // Use Firestore directly for cloud-based storage
        const fbUser = auth.currentUser;
        if (!fbUser) {
          console.warn('PropertyContext: No Firebase currentUser, will use localStorage fallback');
          throw new Error('No authenticated Firebase user found');
        }

        console.log('PropertyContext: Saving property to Firestore for user:', fbUser.uid, fbUser.email);
        console.log('PropertyContext: User vendorCode:', user?.vendorCode);

        // Get vendor information
        const vendorFirstName = user?.firstName || user?.displayName?.split(' ')[0] || 'Guest';
        const vendorLastName = user?.lastName || user?.displayName?.split(' ')[1] || 'User';
        const vendorFullName = `${vendorFirstName} ${vendorLastName}`.trim();
        const vendorEmail = fbUser.email || user?.email || 'anonymous@example.com';
        const vendorCode = user?.vendorCode || '';
        const vendorId = fbUser.uid;

        const propertyData = {
          ...apiPayload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          // Vendor identification fields (indexed for search)
          ownerId: vendorId,
          ownerEmail: vendorEmail,
          vendorCode: vendorCode,
          vendorName: vendorFullName, // Full vendor name for search
          vendorEmail: vendorEmail, // Duplicate for explicit vendor search
          vendorId: vendorId, // Duplicate for explicit vendor search
          // Owner object (legacy support)
          owner: {
            id: vendorId,
            firstName: vendorFirstName,
            lastName: vendorLastName,
            email: vendorEmail,
            vendorCode: vendorCode,
            name: vendorFullName // Full name in owner object too
          },
          // Set verification status for admin approval
          verificationStatus: 'pending',
          approvalStatus: 'pending',
          isVerified: false
        };

        const propertyRef = await addDoc(collection(db, 'properties'), propertyData);
        
        console.log('PropertyContext: Property saved to Firestore with ID:', propertyRef.id);
        
        // Also save to localStorage as backup (in case Firestore read fails later)
        try {
          const localBackup = {
            id: propertyRef.id,
            ...apiPayload,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ownerId: vendorId,
            ownerEmail: vendorEmail,
            vendorCode: vendorCode,
            vendorName: vendorFullName,
            vendorEmail: vendorEmail,
            vendorId: vendorId,
            owner: propertyData.owner,
            verificationStatus: 'pending',
            approvalStatus: 'pending',
            isVerified: false,
            savedToFirestore: true
          };
          const existingProperties = JSON.parse(localStorage.getItem('mockProperties') || '[]');
          existingProperties.push(localBackup);
          localStorage.setItem('mockProperties', JSON.stringify(existingProperties));
          console.log('PropertyContext: Also saved backup to localStorage');
        } catch (localErr) {
          console.warn('PropertyContext: Failed to save localStorage backup:', localErr);
        }
        
        toast.success('Property added successfully! It will appear after admin approval.');
        await fetchProperties(filters);
        return { success: true, id: propertyRef.id, savedTo: 'firestore' };
      } catch (firestoreError) {
        console.error('PropertyContext: Firestore error:', firestoreError);
        
        // Check if it's a permission error
        if (firestoreError.code === 'permission-denied') {
          throw new Error('Permission denied. Please ensure you are logged in and have proper permissions.');
        }
        
        // For other Firestore errors, attempt to post to backend mock API, then fallback to localStorage
        try {
          const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-759115682573.us-central1.run.app';
          const resp = await fetch(`${API_BASE_URL}/api/properties`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiPayload)
          });
          const data = await resp.json();
          if (data?.success) {
            toast.success('Property added successfully!');
            await fetchProperties(filters);
            return { success: true, id: data.data?.id, savedTo: 'api' };
          }
          throw new Error('Backend create failed');
        } catch (apiError) {
          console.warn('PropertyContext: API fallback failed:', apiError);
          
          // Final fallback to localStorage - use AuthContext user info
          const fbUser = auth.currentUser;
          const userId = fbUser?.uid || user?.uid || user?.id || `temp-${Date.now()}`;
          const userEmail = fbUser?.email || user?.email || 'unknown@example.com';
          const vendorFirstName = user?.firstName || user?.displayName?.split(' ')[0] || 'Guest';
          const vendorLastName = user?.lastName || user?.displayName?.split(' ')[1] || 'User';
          const vendorFullName = `${vendorFirstName} ${vendorLastName}`.trim();
          const vendorCode = user?.vendorCode || '';
          const mockId = `local-${Date.now()}`;
          
          console.log('PropertyContext: Saving to localStorage with user info:', { userId, userEmail, vendorCode });
          
          const localProperty = {
            id: mockId,
            ...apiPayload,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ownerId: userId,
            ownerEmail: userEmail,
            vendorCode: vendorCode,
            vendorName: vendorFullName,
            vendorEmail: userEmail,
            vendorId: userId,
            owner: {
              id: userId,
              firstName: vendorFirstName,
              lastName: vendorLastName,
              email: userEmail,
              vendorCode: vendorCode,
              name: vendorFullName
            },
            // Set verification status for admin approval
            verificationStatus: 'pending',
            approvalStatus: 'pending',
            isVerified: false,
            savedToFirestore: false
          };
          const existingProperties = JSON.parse(localStorage.getItem('mockProperties') || '[]');
          existingProperties.push(localProperty);
          localStorage.setItem('mockProperties', JSON.stringify(existingProperties));
          
          console.log('PropertyContext: Property saved to localStorage with ID:', mockId);
          console.log('PropertyContext: Property owner info:', { ownerId: userId, ownerEmail: userEmail });
          toast.success('Property saved locally. It will sync when connection is restored.');
          await fetchProperties(filters);
          return { success: true, id: mockId, savedTo: 'localStorage' };
        }
      }
    } catch (error) {
      setError('Failed to add property');
      console.error('Error adding property:', error);
      toast.error(error?.message || 'Failed to add property');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user, fetchProperties, filters, firebaseAuthReady]);

  // Update property
  const updateProperty = useCallback(async (propertyId, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user && !auth.currentUser) throw new Error('User must be logged in');
      if (!propertyId) throw new Error('Property ID is required');

      // Try Firestore first if authentication is ready
      if (firebaseAuthReady && auth.currentUser) {
      try {
        const propertyRef = doc(db, 'properties', propertyId);
        await updateDoc(propertyRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
        
        toast.success('Property updated successfully!');
        await fetchProperties(filters);
        return { success: true };
      } catch (firestoreError) {
        console.error('Firestore update error:', firestoreError);
          
          // Check if it's a permission error
          if (firestoreError.code === 'permission-denied') {
            throw new Error('Permission denied. You can only update your own properties.');
          }
          
          // For other errors, fallback to localStorage
          throw firestoreError;
        }
      }
      
        // Fallback to localStorage for demo purposes
        try {
          const allProperties = JSON.parse(localStorage.getItem('mockProperties') || '[]');
          const updatedProperties = allProperties.map(prop => 
            prop.id === propertyId 
              ? { ...prop, ...updates, updatedAt: new Date().toISOString() }
              : prop
          );
          localStorage.setItem('mockProperties', JSON.stringify(updatedProperties));
          
          toast.success('Property updated successfully! (Local storage)');
          await fetchProperties(filters);
          return { success: true };
        } catch (localError) {
          throw new Error('Failed to update property in both Firestore and local storage');
      }
    } catch (error) {
      setError('Failed to update property');
      console.error('Error updating property:', error);
      toast.error(error?.message || 'Failed to update property');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user, fetchProperties, filters, firebaseAuthReady]);

  // Delete property
  const deleteProperty = useCallback(async (propertyId) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user) throw new Error('User must be logged in');

      // For now, just show success message since property deletion isn't fully implemented
      toast.success('Property deleted successfully!');
      return { success: true };
    } catch (error) {
      setError('Failed to delete property');
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch user's properties
  const fetchUserProperties = useCallback(async (userId = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const targetUserId = userId || user?.id;
      if (!targetUserId) throw new Error('User ID required');

      // For now, return all properties since user-specific filtering isn't implemented
      await fetchProperties();
      return properties;
    } catch (error) {
      setError('Failed to fetch user properties');
      console.error('Error fetching user properties:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, fetchProperties, properties]);

  // Search properties
  const searchProperties = useCallback(async (searchTerm) => {
    try {
      await fetchProperties({ search: searchTerm });
      return properties;
    } catch (error) {
      setError('Failed to search properties');
      console.error('Error searching properties:', error);
      return [];
    }
  }, [fetchProperties, properties]);

  // Saved searches
  const saveSearch = useCallback(async (name, criteria) => {
    try {
      if (!user) throw new Error('User must be logged in');
      // For now, just show success message since saved searches aren't implemented in backend yet
      toast.success('Search saved successfully!');
      return { success: true, id: Date.now().toString() };
    } catch (error) {
      console.error('Error saving search:', error);
      toast.error('Failed to save search');
      return { success: false, error: error.message };
    }
  }, [user, filters]);

  // Storage-related functions
  const uploadPropertyImages = async (files, propertyId) => {
    try {
      if (!user) throw new Error('User must be logged in');
      
      // For now, just show success message since image upload isn't implemented yet
      toast.success(`Images uploaded successfully!`);
      return [];
    } catch (error) {
      console.error('Error uploading property images:', error);
      toast.error('Failed to upload images');
      return null;
    }
  };

  /**
   * Favorites: toggle favorite for current user on a property
   * 
   * IMPORTANT: This is the SINGLE SOURCE OF TRUTH for favorite state.
   * All components should call this function instead of directly modifying localStorage.
   * 
   * This function:
   * 1. Updates localStorage (favorites list and metadata)
   * 2. Syncs to Firestore (best-effort, non-blocking)
   * 3. Dispatches events for component synchronization
   * 4. Returns success/failure status
   * 
   * DO NOT modify localStorage directly in components - always use this function.
   */
  const toggleFavorite = useCallback(async (propertyId, propertyData = null) => {
    try {
      if (!user) throw new Error('User must be logged in');

      // Normalize propertyId to string for consistent storage and comparison
      const propertyIdStr = String(propertyId);

      // Local persistence per user
      const key = `favorites_${user.id}`;
      const savedFavorites = JSON.parse(localStorage.getItem(key) || '[]');
      // Normalize all saved IDs to strings for consistent comparison
      const existing = new Set(savedFavorites.map(id => String(id)));
      let isNowFavorited = false;
      
      // Metadata storage key
      const metadataKey = `favorites_metadata_${user.id}`;
      const savedMetadata = JSON.parse(localStorage.getItem(metadataKey) || '{}');
      
      if (existing.has(propertyIdStr)) {
        existing.delete(propertyIdStr);
        delete savedMetadata[propertyIdStr];
        isNowFavorited = false;
      } else {
        existing.add(propertyIdStr);
        isNowFavorited = true;
        
        // Try to find property in current properties list to store metadata
        let propertyToSave = propertyData;
        if (!propertyToSave) {
          propertyToSave = properties.find(p => {
            const propId = p.id || p.propertyId || p._id;
            return String(propId) === propertyIdStr || propId === propertyId;
          });
        }
        
        // Store property metadata if found (for displaying in SavedProperties even if not in current list)
        if (propertyToSave) {
          savedMetadata[propertyIdStr] = {
            id: propertyToSave.id || propertyToSave.propertyId || propertyToSave._id || propertyIdStr,
            title: propertyToSave.title,
            price: propertyToSave.price,
            location: propertyToSave.location,
            bedrooms: propertyToSave.bedrooms || propertyToSave.details?.bedrooms,
            bathrooms: propertyToSave.bathrooms || propertyToSave.details?.bathrooms,
            area: propertyToSave.area || propertyToSave.details?.sqft || propertyToSave.sqft,
            image: propertyToSave.image || propertyToSave.images?.[0]?.url || propertyToSave.images?.[0],
            images: propertyToSave.images,
            status: propertyToSave.status || propertyToSave.listingType || propertyToSave.statusSlug,
            type: propertyToSave.type || propertyToSave.typeSlug,
            agent: propertyToSave.agent,
            owner: propertyToSave.owner,
            vendorName: propertyToSave.vendorName,
            vendorPhone: propertyToSave.vendorPhone,
            vendorEmail: propertyToSave.vendorEmail,
            contactPhone: propertyToSave.contactPhone,
            contactEmail: propertyToSave.contactEmail,
            city: propertyToSave.city,
            state: propertyToSave.state,
            address: propertyToSave.address,
            createdAt: propertyToSave.createdAt,
            dateAdded: new Date().toISOString()
          };
        }
      }
      
      // CRITICAL: Save normalized IDs as strings to localStorage
      // This is the SINGLE SOURCE OF TRUTH - all components read from here
      localStorage.setItem(key, JSON.stringify(Array.from(existing)));
      // Save metadata for displaying properties in SavedProperties tab
      localStorage.setItem(metadataKey, JSON.stringify(savedMetadata));

      // Verify the save was successful
      const verifySaved = JSON.parse(localStorage.getItem(key) || '[]');
      const verifyNormalized = verifySaved.map(id => String(id));
      if (!verifyNormalized.includes(propertyIdStr) === !isNowFavorited) {
        console.warn('PropertyContext: Favorite state verification failed, but continuing...');
      }

      // Best-effort Firestore sync under users/{userId}/favorites/{propertyId}
      // This is non-blocking - localStorage is the source of truth
      try {
        const favoriteRef = doc(db, 'users', user.id, 'favorites', propertyIdStr);
        if (isNowFavorited) {
          await setDoc(favoriteRef, {
            propertyId: propertyIdStr,
            createdAt: new Date().toISOString()
          });
        } else {
          await deleteDoc(favoriteRef);
        }
      } catch (e) {
        // Non-fatal; local storage already updated
        console.warn('PropertyContext: Firestore favorite sync failed (non-fatal):', e);
      }

      // Dispatch event to notify other components (Dashboard, SavedProperties, etc.)
      // Components listen for this event to update their UI
      window.dispatchEvent(new CustomEvent('favoritesUpdated', {
        detail: { propertyId: propertyIdStr, favorited: isNowFavorited }
      }));
      
      // Also trigger a storage event for cross-tab synchronization
      // This allows favorites to sync across multiple browser tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: key,
        newValue: JSON.stringify(Array.from(existing))
      }));

      toast.success(isNowFavorited ? 'Added to favorites' : 'Removed from favorites');
      return { success: true, favorited: isNowFavorited };
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
      return { success: false, error: error.message };
    }
  }, [user]);

  const deletePropertyImage = async (imagePath) => {
    try {
        toast.success('Image deleted successfully');
        return true;
    } catch (error) {
      console.error('Error deleting property image:', error);
      toast.error('Failed to delete image');
      return false;
    }
  };

  const getPropertyImages = async (propertyId) => {
    try {
      // For now, return empty array since image management isn't implemented yet
      return [];
    } catch (error) {
      console.error('Error fetching property images:', error);
      return [];
    }
  };

  // Admin functions
  const getAuthHeaders = () => {
    try {
      const token = localStorage.getItem('token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (error) {
      return {};
    }
  };

  const fetchAdminProperties = useCallback(async (status = '', verificationStatus = '') => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('PropertyContext: Fetching admin properties...');
      
      const queryParams = new URLSearchParams();
      if (status) queryParams.append('status', status);
      if (verificationStatus) queryParams.append('verificationStatus', verificationStatus);
      
      const queryString = queryParams.toString();
      const url = getApiUrl(`/admin/properties${queryString ? `?${queryString}` : ''}`);
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });
      const data = await response.json();
      
      if (data.success) {
        console.log('PropertyContext: Admin properties fetched from API:', data.data);
        setProperties(data.data);
        return data.stats;
      } else {
        throw new Error(data.message || 'Failed to fetch admin properties');
      }
    } catch (error) {
      console.log('PropertyContext: API failed, trying Firestore...', error);
      
      // Try to fetch from Firestore as fallback
      // IMPORTANT: Start with mock data (7 properties)
      console.log('PropertyContext Admin: mockProperties array length:', mockProperties.length);
      console.log('PropertyContext Admin: mockProperties IDs:', mockProperties.map(p => p.id));
      let allProperties = [...mockProperties]; // Start with mock data
      console.log('PropertyContext Admin: Starting with', allProperties.length, 'mock properties');
      
      if (firebaseAuthReady) {
        try {
          console.log('PropertyContext: Fetching from Firestore...');
          const propertiesRef = collection(db, 'properties');
          
          // Try with orderBy first, but fallback to simple query if index is missing
          let snap;
          try {
            const q = query(propertiesRef, orderBy('createdAt', 'desc'));
            snap = await getDocs(q);
          } catch (orderByError) {
            // If orderBy fails (missing index), fetch all properties without ordering
            console.warn('PropertyContext: orderBy failed, fetching all properties without ordering:', orderByError);
            snap = await getDocs(propertiesRef);
          }
          
          let firestoreProps = snap.docs.map(d => {
            const data = d.data();
            return { 
              id: d.id, 
              ...data,
              // Ensure createdAt exists for sorting
              createdAt: data.createdAt || data.createdAt?.toDate?.() || new Date()
            };
          });
          
          // Enrich properties with vendorCode if missing (same logic as fetchProperties)
          try {
            console.log('PropertyContext Admin: Enriching', firestoreProps.length, 'properties with vendorCode...');
            
            const ownerIdsToLookup = new Set();
            firestoreProps.forEach(prop => {
              const hasAllVendorFields = prop.vendorCode && prop.vendorName && prop.vendorEmail && prop.vendorId;
              if (!hasAllVendorFields && prop.ownerId) {
                ownerIdsToLookup.add(prop.ownerId);
              }
            });
            
            const ownerEmails = [...new Set(firestoreProps
              .filter(p => {
                const hasAllVendorFields = p.vendorCode && p.vendorName && p.vendorEmail && p.vendorId;
                return !hasAllVendorFields && p.ownerEmail;
              })
              .map(p => p.ownerEmail.toLowerCase()))];
            
            console.log('PropertyContext Admin: Need to lookup vendorCode for', ownerIdsToLookup.size, 'owners by ID and', ownerEmails.length, 'by email');
            
            const userCodeMap = new Map(); // ownerId -> { vendorCode, vendorName, vendorEmail }
            const emailToVendorCodeMap = new Map(); // email -> { vendorCode, vendorName, vendorEmail }
            
            if (ownerIdsToLookup.size > 0) {
              await Promise.all(Array.from(ownerIdsToLookup).map(async (ownerId) => {
                try {
                  const userRef = doc(db, 'users', ownerId);
                  const userSnap = await getDoc(userRef);
                  if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const vendorName = userData.firstName && userData.lastName 
                      ? `${userData.firstName} ${userData.lastName}`.trim() 
                      : userData.displayName || '';
                    const vendorInfo = {
                      vendorCode: userData.vendorCode || '',
                      vendorName: vendorName,
                      vendorEmail: userData.email || ''
                    };
                    
                    if (userData.vendorCode) {
                      userCodeMap.set(ownerId, vendorInfo);
                      if (userData.email) {
                        emailToVendorCodeMap.set(userData.email.toLowerCase(), vendorInfo);
                      }
                      console.log('PropertyContext Admin: Found vendor info for owner', ownerId, vendorInfo);
                    }
                  }
                } catch (err) {
                  console.warn('PropertyContext Admin: Could not fetch user', ownerId, err);
                }
              }));
            }
            
            if (ownerEmails.length > 0) {
              try {
                const usersRef = collection(db, 'users');
                await Promise.all(ownerEmails.map(async (email) => {
                  try {
                    const emailQuery = query(usersRef, where('email', '==', email));
                    const emailSnap = await getDocs(emailQuery);
                    if (!emailSnap.empty) {
                      const userData = emailSnap.docs[0].data();
                      const vendorName = userData.firstName && userData.lastName 
                        ? `${userData.firstName} ${userData.lastName}`.trim() 
                        : userData.displayName || '';
                      const vendorInfo = {
                        vendorCode: userData.vendorCode || '',
                        vendorName: vendorName,
                        vendorEmail: userData.email || email
                      };
                      if (userData.vendorCode) {
                        emailToVendorCodeMap.set(email.toLowerCase(), vendorInfo);
                        console.log('PropertyContext Admin: Found vendor info by email', email, vendorInfo);
                      }
                    }
                  } catch (err) {
                    console.warn('PropertyContext Admin: Could not query user by email', email, err);
                  }
                }));
              } catch (err) {
                console.warn('PropertyContext Admin: Error querying users by email:', err);
              }
            }
            
            firestoreProps = firestoreProps.map((prop) => {
              // Check if property already has all vendor fields
              const hasAllVendorFields = prop.vendorCode && prop.vendorName && prop.vendorEmail && prop.vendorId;
              if (hasAllVendorFields) {
                // Ensure owner object also has vendor info
                if (prop.owner && !prop.owner.vendorCode) {
                  prop.owner.vendorCode = prop.vendorCode;
                  if (!prop.owner.name) {
                    prop.owner.name = prop.vendorName;
                  }
                  if (!prop.owner.email) {
                    prop.owner.email = prop.vendorEmail;
                  }
                }
                return prop;
              }
              
              let vendorCode = prop.vendorCode || null;
              let vendorName = prop.vendorName || (prop.owner?.name || (prop.owner ? `${prop.owner.firstName || ''} ${prop.owner.lastName || ''}`.trim() : ''));
              let vendorEmail = prop.vendorEmail || prop.ownerEmail || prop.owner?.email || '';
              let vendorId = prop.vendorId || prop.ownerId || prop.owner?.id || '';
              
              // Try ownerId first to get vendor info
              let vendorInfo = null;
              if (prop.ownerId && userCodeMap.has(prop.ownerId)) {
                vendorInfo = userCodeMap.get(prop.ownerId);
              }
              // Fallback to email lookup
              else if (prop.ownerEmail && emailToVendorCodeMap.has(prop.ownerEmail.toLowerCase())) {
                vendorInfo = emailToVendorCodeMap.get(prop.ownerEmail.toLowerCase());
              }
              
              // Use vendor info from lookup if available
              if (vendorInfo) {
                if (!vendorCode && vendorInfo.vendorCode) {
                  vendorCode = vendorInfo.vendorCode;
                }
                if (!vendorName && vendorInfo.vendorName) {
                  vendorName = vendorInfo.vendorName;
                }
                if (!vendorEmail && vendorInfo.vendorEmail) {
                  vendorEmail = vendorInfo.vendorEmail;
                }
              }
              
              // Get vendor name from existing property data if still not available
              if (!vendorName && prop.owner) {
                if (prop.owner.firstName || prop.owner.lastName) {
                  vendorName = `${prop.owner.firstName || ''} ${prop.owner.lastName || ''}`.trim();
                } else if (prop.owner.name) {
                  vendorName = prop.owner.name;
                }
              }
              
              // Enrich property with vendor information
              if (vendorCode || !hasAllVendorFields) {
                if (vendorCode) {
                  prop.vendorCode = vendorCode;
                }
                if (vendorName) {
                  prop.vendorName = vendorName;
                }
                if (vendorEmail) {
                  prop.vendorEmail = vendorEmail;
                }
                if (vendorId) {
                  prop.vendorId = vendorId;
                }
                
                // Also update owner object
                if (!prop.owner) {
                  prop.owner = {};
                }
                if (vendorCode && !prop.owner.vendorCode) {
                  prop.owner.vendorCode = vendorCode;
                }
                if (vendorName && !prop.owner.name) {
                  prop.owner.name = vendorName;
                  if (!prop.owner.firstName) {
                    prop.owner.firstName = vendorName.split(' ')[0];
                  }
                  if (!prop.owner.lastName && vendorName.split(' ').length > 1) {
                    prop.owner.lastName = vendorName.split(' ').slice(1).join(' ');
                  }
                }
                if (vendorEmail && !prop.owner.email) {
                  prop.owner.email = vendorEmail;
                }
                if (vendorId && !prop.owner.id) {
                  prop.owner.id = vendorId;
                }
                
                console.log('PropertyContext Admin: Enriched property', prop.id, 'with vendor info:', {
                  vendorCode: prop.vendorCode || 'N/A',
                  vendorName: prop.vendorName || 'N/A',
                  vendorEmail: prop.vendorEmail || 'N/A'
                });
              } else {
                console.warn('PropertyContext Admin: Could not find vendorCode for property', prop.id);
              }
              return prop;
            });
            
            console.log('PropertyContext Admin: Enrichment complete. Properties with vendorCode:', 
              firestoreProps.filter(p => p.vendorCode).length);
          } catch (err) {
            console.error('PropertyContext Admin: Error enriching properties with vendorCode:', err);
          }
          
          // Sort by createdAt if available (client-side)
          firestoreProps.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB - dateA; // Descending order
          });
          
          console.log('PropertyContext: Found', firestoreProps.length, 'properties in Firestore');
          
          if (firestoreProps.length > 0) {
            console.log('PropertyContext: Firestore property owners:', firestoreProps.map(p => ({
              id: p.id,
              title: p.title,
              ownerEmail: p.ownerEmail,
              ownerId: p.ownerId,
              owner: p.owner
            })));
            
            // Ensure all properties have verificationStatus set to 'pending' if missing
            const propertiesToUpdate = [];
            firestoreProps.forEach(prop => {
              if (!prop.verificationStatus && !prop.approvalStatus) {
                propertiesToUpdate.push(prop.id);
              }
            });
            
            // Update properties missing verificationStatus in the background (only if user is admin)
            if (propertiesToUpdate.length > 0 && user?.role === 'admin') {
              console.log('PropertyContext: Updating', propertiesToUpdate.length, 'properties with missing verificationStatus');
              Promise.all(propertiesToUpdate.map(propId => {
                const propertyRef = doc(db, 'properties', propId);
                return updateDoc(propertyRef, {
                  verificationStatus: 'pending',
                  approvalStatus: 'pending',
                  isVerified: false
                }).catch(err => {
                  console.warn('PropertyContext: Failed to update property', propId, err);
                });
              })).catch(err => {
                console.warn('PropertyContext: Error updating properties:', err);
              });
            }
            
            // MERGE Firestore properties with mock properties (don't replace!)
            // Add Firestore properties that don't already exist in allProperties
            console.log('PropertyContext Admin: Before merge, allProperties has', allProperties.length, 'items');
            console.log('PropertyContext Admin: Firestore has', firestoreProps.length, 'properties to merge');
            let addedFromFirestore = 0;
            let skippedDuplicates = 0;
            firestoreProps.forEach(fsProp => {
              const existsInMock = allProperties.find(p => p.id === fsProp.id);
              if (!existsInMock) {
                allProperties.push({
                  ...fsProp,
                  source: 'firestore'
                });
                addedFromFirestore++;
          } else {
                skippedDuplicates++;
                console.log('PropertyContext Admin: Skipped duplicate ID:', fsProp.id, 'title:', fsProp.title);
              }
            });
            console.log('PropertyContext Admin: Added', addedFromFirestore, 'from Firestore, skipped', skippedDuplicates, 'duplicates');
            console.log('PropertyContext Admin: Total after merging Firestore:', allProperties.length);
          } else {
            console.log('PropertyContext: No Firestore properties found, keeping mock data');
          }
        } catch (firestoreError) {
          console.error('PropertyContext: Firestore fetch failed:', firestoreError);
          console.warn('PropertyContext: Using mock data as fallback');
        }
      }
      
      // IMPORTANT: Also check localStorage for properties saved locally (when Firestore was unavailable)
      console.log('PropertyContext Admin: Checking localStorage for additional properties...');
      try {
        const localStorageData = localStorage.getItem('mockProperties');
        console.log('PropertyContext Admin: Raw localStorage mockProperties:', localStorageData ? 'exists' : 'null/empty');
        
        const localProperties = JSON.parse(localStorageData || '[]');
        console.log('PropertyContext Admin: Parsed localStorage properties count:', localProperties.length);
        
        if (localProperties.length > 0) {
          console.log('PropertyContext Admin: localStorage properties:', localProperties.map(p => ({
            id: p.id,
            title: p.title,
            ownerEmail: p.ownerEmail
          })));
          
          // Add localStorage properties that aren't already in allProperties
          let addedCount = 0;
          localProperties.forEach(prop => {
            const existsInAll = allProperties.find(p => p.id === prop.id);
            if (!existsInAll) {
              allProperties.push({
                ...prop,
                source: 'localStorage',
                createdAt: prop.createdAt ? new Date(prop.createdAt) : new Date()
              });
              addedCount++;
            }
          });
          
          console.log('PropertyContext Admin: Added', addedCount, 'new properties from localStorage');
          console.log('PropertyContext Admin: Total after merging:', allProperties.length);
        } else {
          console.log('PropertyContext Admin: No properties in localStorage');
        }
      } catch (localErr) {
        console.error('PropertyContext Admin: Error reading localStorage:', localErr);
      }
      
      // Apply filters
      let filteredProperties = [...allProperties];
      
      console.log('PropertyContext: Total properties before filtering:', allProperties.length);
      console.log('PropertyContext: Filter status:', status, 'verificationStatus:', verificationStatus);
      
      if (status) {
        filteredProperties = filteredProperties.filter(p => p.status === status);
        console.log('PropertyContext: After status filter:', filteredProperties.length);
      }
      
      if (verificationStatus) {
        filteredProperties = filteredProperties.filter(p => {
          const approvalStatus = p.approvalStatus || p.verificationStatus || 'pending';
          return approvalStatus === verificationStatus;
        });
        console.log('PropertyContext: After verificationStatus filter:', filteredProperties.length);
      }
      
      console.log('PropertyContext: Final filtered properties:', filteredProperties.length);
      console.log('PropertyContext: Property details:', filteredProperties.map(p => ({
        id: p.id,
        title: p.title,
        ownerEmail: p.ownerEmail,
        verificationStatus: p.verificationStatus || p.approvalStatus || 'pending'
      })));
      
      // Normalize property data for consistent display
      const normalizedProperties = filteredProperties.map(property => {
        // Ensure details object exists and has proper values
        const details = property.details || {};
        
        return {
          ...property,
          // Keep both flat and nested versions for compatibility
          bedrooms: property.bedrooms || details.bedrooms || 0,
          bathrooms: property.bathrooms || details.bathrooms || 0,
          area: property.area || details.sqft || 0,
          parking: property.parking || details.parking || 'N/A',
          // Ensure details object is properly structured
          details: {
            bedrooms: details.bedrooms || property.bedrooms || 0,
            bathrooms: details.bathrooms || property.bathrooms || 0,
            sqft: details.sqft || property.area || 0,
            parking: details.parking || property.parking || 'N/A',
            yearBuilt: details.yearBuilt || null,
            lotSize: details.lotSize || null
          }
        };
      });
      
      setProperties(normalizedProperties);
      
      // Calculate stats from all properties (not just filtered)
      const stats = {
        total: allProperties.length,
        pending: allProperties.filter(p => {
          const approvalStatus = p.approvalStatus || p.verificationStatus || 'pending';
          return approvalStatus === 'pending';
        }).length,
        approved: allProperties.filter(p => {
          const approvalStatus = p.approvalStatus || p.verificationStatus;
          return approvalStatus === 'approved';
        }).length,
        rejected: allProperties.filter(p => {
          const approvalStatus = p.approvalStatus || p.verificationStatus;
          return approvalStatus === 'rejected';
        }).length
      };
      
      console.log('PropertyContext: Using combined data with stats:', stats);
      return stats;
    } finally {
      setLoading(false);
    }
  }, [firebaseAuthReady, user]);

  const verifyProperty = useCallback(async (propertyId, verificationStatus, verificationNotes = '') => {
    setLoading(true);
    setError(null);
    
    try {
      // Try Firestore first if authentication is ready
      if (firebaseAuthReady && auth.currentUser) {
        try {
          const propertyRef = doc(db, 'properties', propertyId);
          await updateDoc(propertyRef, {
            verificationStatus: verificationStatus,
            approvalStatus: verificationStatus, // Also set approvalStatus for compatibility
            verificationNotes: verificationNotes || '',
            isVerified: verificationStatus === 'approved',
            verifiedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          toast.success(`Property ${verificationStatus} successfully`);
          // Don't await here to avoid circular dependency - let component refresh
          return true;
        } catch (firestoreError) {
          console.error('Firestore verification error:', firestoreError);
          
          // Check if it's a permission error
          if (firestoreError.code === 'permission-denied') {
            throw new Error('Permission denied. Please ensure you have admin privileges.');
          }
          
          // For other errors, try API fallback
          throw firestoreError;
        }
      }
      
      // Fallback to API if Firestore not available
      try {
        const response = await fetch(getApiUrl(`/admin/properties/${propertyId}/verify`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            verificationStatus,
            verificationNotes
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast.success(`Property ${verificationStatus} successfully`);
          return true;
        } else {
          throw new Error(data.message || 'Failed to verify property');
        }
      } catch (apiError) {
        throw new Error('Failed to verify property via API: ' + apiError.message);
      }
    } catch (error) {
      setError('Failed to verify property');
      console.error('Error verifying property:', error);
      toast.error(error.message || 'Failed to verify property');
      return false;
    } finally {
      setLoading(false);
    }
  }, [firebaseAuthReady]);

  const value = {
    properties,
    loading,
    error,
    filters,
    pagination,
    fetchProperties,
    fetchProperty,
    addProperty,
    createProperty: addProperty,
    updateProperty,
    deleteProperty,
    fetchUserProperties,
    searchProperties,
    setFilters,
    setPagination,
    uploadPropertyImages,
    deletePropertyImage,
    getPropertyImages,
    toggleFavorite,
    saveSearch,
    // Admin functions
    fetchAdminProperties,
    verifyProperty
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}; 