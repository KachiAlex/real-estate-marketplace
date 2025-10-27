import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProperty } from '../contexts/PropertyContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaMapMarkerAlt, 
  FaRulerCombined, 
  FaHeart, 
  FaShare, 
  FaArrowRight, 
  FaTimes,
  FaCheck,
  FaBuilding,
  FaChartLine,
  FaPlay,
  FaSort,
  FaBed,
  FaBath,
  FaShieldAlt,
  FaLock,
  FaFileContract,
  FaHandshake,
  FaClock,
  FaCertificate,
  FaUsers,
  FaMobileAlt
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import HomeSections from '../components/HomeSections';
import BlogSection from '../components/BlogSection';
import HeroBannerCarousel from '../components/HeroBannerCarousel';
import SEO from '../components/SEO';

// Mock properties from backend/data/mockProperties.js - transformed for frontend
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
    id: 'prop_006',
    title: 'Commercial Office Space in Ikeja GRA',
    description: 'Prime commercial space perfect for business operations with modern facilities and excellent location.',
    price: 3500000,
    type: 'commercial',
    status: 'for-lease',
    details: { bedrooms: 0, bathrooms: 2, sqft: 1500, yearBuilt: 2016, parking: 6, furnished: 'unfurnished' },
    location: { address: '123 Ikeja GRA', city: 'Lagos', state: 'Lagos', zipCode: '100001', coordinates: { lat: 6.6000, lng: 3.3500 } },
    images: [{ url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_003', firstName: 'Emmanuel', lastName: 'Adeyemi', email: 'emmanuel.adeyemi@hotmail.com', phone: '+234-803-456-7890' },
    views: 43,
    isVerified: true,
    amenities: ['Parking', 'Security', 'Power Backup', 'Water Supply', 'Air Conditioning'],
    createdAt: '2024-01-18'
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
    id: 'prop_008',
    title: 'Modern Apartment in Yaba',
    description: 'Contemporary 2-bedroom apartment with modern amenities and easy access to business districts.',
    price: 950000,
    type: 'apartment',
    status: 'for-rent',
    details: { bedrooms: 2, bathrooms: 2, sqft: 1100, yearBuilt: 2020, parking: 2, furnished: 'semi-furnished' },
    location: { address: '321 Yaba', city: 'Lagos', state: 'Lagos', zipCode: '101212', coordinates: { lat: 6.5000, lng: 3.3800 } },
    images: [{ url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_004', firstName: 'Fatima', lastName: 'Ibrahim', email: 'fatima.ibrahim@gmail.com', phone: '+234-804-567-8901' },
    views: 35,
    isVerified: true,
    amenities: ['Security', 'Parking', 'Gym', 'Water Supply'],
    createdAt: '2024-01-14'
  },
  {
    id: 'prop_009',
    title: 'Executive Duplex in Magodo',
    description: 'Spacious executive duplex with premium finishes, private pool, and exclusive community access.',
    price: 280000000,
    type: 'house',
    status: 'for-sale',
    details: { bedrooms: 6, bathrooms: 5, sqft: 3800, yearBuilt: 2018, parking: 5, furnished: 'semi-furnished' },
    location: { address: '456 Magodo GRA', city: 'Lagos', state: 'Lagos', zipCode: '105001', coordinates: { lat: 6.6000, lng: 3.4000 } },
    images: [{ url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_005', firstName: 'Oluwaseun', lastName: 'Akoma', email: 'oluwaseun.akoma@gmail.com', phone: '+234-805-678-9012' },
    views: 92,
    isVerified: true,
    amenities: ['Private Pool', 'Garden', 'Security', 'Parking', 'Power Backup'],
    createdAt: '2024-01-03'
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
  },
  {
    id: 'prop_011',
    title: 'Commercial Retail Space in Victoria Island',
    description: 'Prime retail space in bustling Victoria Island, perfect for retail businesses and restaurants.',
    price: 2800000,
    type: 'commercial',
    status: 'for-lease',
    details: { bedrooms: 0, bathrooms: 1, sqft: 800, yearBuilt: 2015, parking: 4, furnished: 'unfurnished' },
    location: { address: '456 Victoria Island', city: 'Lagos', state: 'Lagos', zipCode: '101241', coordinates: { lat: 6.4281, lng: 3.4219 } },
    images: [{ url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_005', firstName: 'Oluwaseun', lastName: 'Akoma', email: 'oluwaseun.akoma@gmail.com', phone: '+234-805-678-9012' },
    views: 67,
    isVerified: true,
    amenities: ['Parking', 'Security', 'Power Backup', 'Water Supply'],
    createdAt: '2024-01-16'
  },
  {
    id: 'prop_012',
    title: 'Family Home in Gbagada',
    description: 'Comfortable family home with modern amenities and easy access to schools and hospitals.',
    price: 150000000,
    type: 'house',
    status: 'for-sale',
    details: { bedrooms: 3, bathrooms: 2, sqft: 1600, yearBuilt: 2016, parking: 2, furnished: 'unfurnished' },
    location: { address: '987 Gbagada', city: 'Lagos', state: 'Lagos', zipCode: '100234', coordinates: { lat: 6.5500, lng: 3.3800 } },
    images: [{ url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_006', firstName: 'Blessing', lastName: 'Okafor', email: 'blessing.okafor@outlook.com', phone: '+234-806-789-0123' },
    views: 43,
    isVerified: true,
    amenities: ['Security', 'Parking', 'Water Supply', 'Power Backup'],
    createdAt: '2024-01-19'
  },
  {
    id: 'prop_013',
    title: 'Modern Studio in Port Harcourt',
    description: 'Contemporary studio apartment perfect for young professionals with modern amenities.',
    price: 650000,
    type: 'apartment',
    status: 'for-rent',
    details: { bedrooms: 1, bathrooms: 1, sqft: 550, yearBuilt: 2019, parking: 1, furnished: 'semi-furnished' },
    location: { address: '789 Port Harcourt', city: 'Port Harcourt', state: 'Rivers', zipCode: '500001', coordinates: { lat: 4.8156, lng: 7.0498 } },
    images: [{ url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_007', firstName: 'Ibrahim', lastName: 'Musa', email: 'ibrahim.musa@gmail.com', phone: '+234-807-890-1234' },
    views: 28,
    isVerified: true,
    amenities: ['Security', 'Parking', 'Water Supply', 'Power Backup'],
    createdAt: '2024-01-17'
  },
  {
    id: 'prop_014',
    title: 'Executive Villa in Port Harcourt',
    description: 'Luxury villa with premium finishes, private garden, and exclusive amenities in a secure community.',
    price: 220000000,
    type: 'house',
    status: 'for-sale',
    details: { bedrooms: 4, bathrooms: 3, sqft: 2600, yearBuilt: 2017, parking: 3, furnished: 'semi-furnished' },
    location: { address: '456 GRA Phase 2', city: 'Port Harcourt', state: 'Rivers', zipCode: '500001', coordinates: { lat: 4.8156, lng: 7.0498 } },
    images: [{ url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_007', firstName: 'Ibrahim', lastName: 'Musa', email: 'ibrahim.musa@gmail.com', phone: '+234-807-890-1234' },
    views: 89,
    isVerified: true,
    amenities: ['Private Garden', 'Security', 'Parking', 'Power Backup', 'Water Supply'],
    createdAt: '2024-01-11'
  },
  {
    id: 'prop_015',
    title: 'Medical Professional Apartment',
    description: 'Comfortable apartment perfect for medical professionals with modern amenities and easy access to hospitals.',
    price: 750000,
    type: 'apartment',
    status: 'for-rent',
    details: { bedrooms: 2, bathrooms: 2, sqft: 950, yearBuilt: 2020, parking: 1, furnished: 'semi-furnished' },
    location: { address: '321 Yaba', city: 'Lagos', state: 'Lagos', zipCode: '101212', coordinates: { lat: 6.5000, lng: 3.3800 } },
    images: [{ url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_008', firstName: 'Grace', lastName: 'Eze', email: 'grace.eze@yahoo.com', phone: '+234-808-901-2345' },
    views: 41,
    isVerified: true,
    amenities: ['Security', 'Parking', 'Water Supply', 'Power Backup'],
    createdAt: '2024-01-13'
  },
  {
    id: 'prop_016',
    title: 'Luxury Apartment in Ikoyi',
    description: 'Exclusive apartment with premium finishes and access to world-class amenities.',
    price: 420000000,
    type: 'apartment',
    status: 'for-sale',
    details: { bedrooms: 3, bathrooms: 3, sqft: 2000, yearBuilt: 2020, parking: 2, furnished: 'fully-furnished' },
    location: { address: '654 Ikoyi', city: 'Lagos', state: 'Lagos', zipCode: '101001', coordinates: { lat: 6.4500, lng: 3.4000 } },
    images: [{ url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_009', firstName: 'Kemi', lastName: 'Adebayo', email: 'kemi.adebayo@gmail.com', phone: '+234-809-012-3456' },
    views: 124,
    isVerified: true,
    amenities: ['Concierge', 'Gym', 'Swimming Pool', 'Security', 'Parking'],
    createdAt: '2024-01-07'
  },
  {
    id: 'prop_017',
    title: 'Modern Townhouse in Lekki',
    description: 'Contemporary townhouse with premium finishes and access to community amenities.',
    price: 180000000,
    type: 'house',
    status: 'for-sale',
    details: { bedrooms: 4, bathrooms: 3, sqft: 2100, yearBuilt: 2019, parking: 3, furnished: 'semi-furnished' },
    location: { address: '789 Lekki Phase 2', city: 'Lagos', state: 'Lagos', zipCode: '101001', coordinates: { lat: 6.4654, lng: 3.4654 } },
    images: [{ url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_009', firstName: 'Kemi', lastName: 'Adebayo', email: 'kemi.adebayo@gmail.com', phone: '+234-809-012-3456' },
    views: 76,
    isVerified: false,
    amenities: ['Community Pool', 'Security', 'Parking', 'Power Backup'],
    createdAt: '2024-01-09'
  },
  {
    id: 'prop_018',
    title: 'Architectural Masterpiece in Gbagada',
    description: 'Unique architectural design with premium finishes and modern amenities.',
    price: 195000000,
    type: 'house',
    status: 'for-sale',
    details: { bedrooms: 3, bathrooms: 3, sqft: 1900, yearBuilt: 2021, parking: 2, furnished: 'fully-furnished' },
    location: { address: '987 Gbagada', city: 'Lagos', state: 'Lagos', zipCode: '100234', coordinates: { lat: 6.5500, lng: 3.3800 } },
    images: [{ url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_010', firstName: 'Tunde', lastName: 'Ogunlana', email: 'tunde.ogunlana@hotmail.com', phone: '+234-810-123-4567' },
    views: 98,
    isVerified: true,
    amenities: ['Security', 'Parking', 'Garden', 'Power Backup'],
    createdAt: '2024-01-04'
  },
  {
    id: 'prop_019',
    title: 'Luxury Penthouse in Victoria Island',
    description: 'Exclusive penthouse with panoramic ocean views and premium amenities.',
    price: 650000000,
    type: 'apartment',
    status: 'for-sale',
    details: { bedrooms: 4, bathrooms: 4, sqft: 3000, yearBuilt: 2022, parking: 3, furnished: 'fully-furnished' },
    location: { address: '456 Victoria Island', city: 'Lagos', state: 'Lagos', zipCode: '101241', coordinates: { lat: 6.4281, lng: 3.4219 } },
    images: [{ url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_010', firstName: 'Tunde', lastName: 'Ogunlana', email: 'tunde.ogunlana@hotmail.com', phone: '+234-810-123-4567' },
    views: 203,
    isVerified: true,
    amenities: ['Ocean Views', 'Rooftop Pool', 'Concierge', 'Gym', 'Security'],
    createdAt: '2024-01-02'
  },
  {
    id: 'prop_020',
    title: 'Cozy Studio in Surulere',
    description: 'Perfect starter home in a vibrant neighborhood with modern amenities.',
    price: 550000,
    type: 'apartment',
    status: 'for-rent',
    details: { bedrooms: 1, bathrooms: 1, sqft: 500, yearBuilt: 2018, parking: 1, furnished: 'unfurnished' },
    location: { address: '321 Surulere', city: 'Lagos', state: 'Lagos', zipCode: '101283', coordinates: { lat: 6.5000, lng: 3.3500 } },
    images: [{ url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', isPrimary: true }, { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', isPrimary: false }],
    owner: { id: 'user_010', firstName: 'Tunde', lastName: 'Ogunlana', email: 'tunde.ogunlana@hotmail.com', phone: '+234-810-123-4567' },
    views: 19,
    isVerified: true,
    amenities: ['Security', 'Parking', 'Water Supply', 'Power Backup'],
    createdAt: '2024-01-21'
  }
];

// Transform backend format to frontend format
const transformPropertyForFrontend = (prop) => {
  // Convert status format
  const statusMap = {
    'for-sale': 'For Sale',
    'for-rent': 'For Rent',
    'for-lease': 'For Lease'
  };

  // Convert type format
  const typeMap = {
    'house': 'House',
    'apartment': 'Apartment',
    'commercial': 'Office',
    'villa': 'Villa',
    'penthouse': 'Penthouse',
    'townhouse': 'Townhouse'
  };

  return {
    id: parseInt(prop.id.replace('prop_', '')), // Numeric ID for listing
    propertyId: prop.id, // Original string ID for detail page lookup
    title: prop.title,
    location: `${prop.location.address}, ${prop.location.city}, ${prop.location.state}`,
    price: prop.price,
    type: typeMap[prop.type] || prop.type,
    bedrooms: prop.details.bedrooms,
    bathrooms: prop.details.bathrooms,
    area: prop.details.sqft,
    image: prop.images[0]?.url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
    description: prop.description,
    amenities: prop.amenities || [],
    status: statusMap[prop.status] || prop.status,
    label: statusMap[prop.status] || prop.status,
    labelColor: 'bg-green-600',
    agent: {
      name: `${prop.owner.firstName} ${prop.owner.lastName}`,
      phone: prop.owner.phone,
      email: prop.owner.email
    },
    ownerId: prop.owner.id,
    ownerEmail: prop.owner.email,
    isVerified: prop.isVerified,
    views: prop.views
  };
};

// Transform all properties
const mockProperties = backendMockProperties.map(transformPropertyForFrontend);

const Home = () => {
  const { properties, toggleFavorite } = useProperty();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 1000000000]);
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [propertyAge, setPropertyAge] = useState('Any Age');
  const [sortBy, setSortBy] = useState('Most Relevant');
  const [showMoreAmenities, setShowMoreAmenities] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [propertiesPerPage] = useState(9);
  const [displayProperties, setDisplayProperties] = useState([]);
  
  // Real-time filtering
  const filteredProperties = useMemo(() => {
    let filtered = [...mockProperties];
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(property => 
        property.title?.toLowerCase().includes(query) ||
        property.description?.toLowerCase().includes(query) ||
        property.location?.toLowerCase().includes(query) ||
        property.address?.toLowerCase().includes(query)
      );
    }
    
    // Apply location filter
    if (selectedLocation) {
      filtered = filtered.filter(property => 
        property.location?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }
    
    // Apply property status filter
    if (selectedStatus) {
      filtered = filtered.filter(property => 
        property.status === selectedStatus || property.label === selectedStatus
      );
    }
    
    // Apply property type filter
    if (selectedType) {
      filtered = filtered.filter(property => 
        property.type === selectedType
      );
    }
    
    // Apply bedrooms filter
    if (bedrooms) {
      const bedroomCount = parseInt(bedrooms);
      filtered = filtered.filter(property => property.bedrooms >= bedroomCount);
    }
    
    // Apply bathrooms filter
    if (bathrooms) {
      const bathroomCount = parseInt(bathrooms);
      filtered = filtered.filter(property => property.bathrooms >= bathroomCount);
    }
    
    // Apply price range filter
    filtered = filtered.filter(property => 
      property.price >= priceRange[0] && property.price <= priceRange[1]
    );
    
    return filtered;
  }, [searchQuery, selectedLocation, selectedType, selectedStatus, bedrooms, bathrooms, priceRange]);

  // Enhanced Quick Filters with sublinks
  const quickFilters = {
    'All Properties': [],
    'For Sale': ['House', 'Apartment', 'Condo', 'Penthouse', 'Land', 'Villa', 'Townhouse'],
    'For Rent': ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Kaduna', 'Enugu', 'Aba'],
    'Shortlet': ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Calabar', 'Jos', 'Ibadan', 'Kaduna'],
    'New Developments': [],
    'Waterfront': [],
    'Luxury': [],
    'Blog': [],
    'Diasporan Services': ['Legal Services', 'Account & Book Keeping', 'Business Office for consultation']
  };

  // All Nigerian States
  const locations = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 
    'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 
    'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 
    'Zamfara', 'Abuja (FCT)'
  ];
  const propertyTypes = ['Apartment', 'House', 'Villa', 'Condo', 'Townhouse', 'Penthouse', 'Land'];
  const propertyStatuses = ['For Sale', 'For Rent', 'For Lease', 'Shortlet'];
  const amenities = [
    'Swimming Pool', 'Gym', '24/7 Security', 'Air Conditioning', 'Parking Space', 
    'WiFi', 'Furnished', 'Balcony', 'Garden', 'Terrace', 'Home Theater', 'Sauna'
  ];

  const handleAmenityToggle = (amenity) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const removeFilter = (filterType, value) => {
    switch(filterType) {
      case 'location':
        setSelectedLocation('');
        break;
      case 'status':
        setSelectedStatus('');
        break;
      case 'type':
        setSelectedType('');
        break;
      case 'bedrooms':
        setBedrooms('');
        break;
    }
  };

  const handleResetAllFilters = () => {
    setSelectedLocation('');
    setSelectedStatus('');
    setSelectedType('');
    setBedrooms('');
    setBathrooms('');
    setPriceRange([0, 100000000]);
    setSearchQuery('');
    setActiveDropdown(null);
  };

  // Initialize filtered properties on component mount
  useEffect(() => {
    setDisplayProperties(mockProperties);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);
  
  // Calculate pagination
  const indexOfLastProperty = currentPage * propertiesPerPage;
  const indexOfFirstProperty = indexOfLastProperty - propertiesPerPage;
  const currentProperties = filteredProperties.slice(indexOfFirstProperty, indexOfLastProperty);
  const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);


  const handleApplyFilters = () => {
    let filtered = [...mockProperties];
    
    // Apply location filter
    if (selectedLocation) {
      filtered = filtered.filter(property => 
        property.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }
    
    // Apply property status filter
    if (selectedStatus) {
      filtered = filtered.filter(property => 
        property.status === selectedStatus || property.label === selectedStatus
      );
    }
    
    // Apply property type filter
    if (selectedType) {
      filtered = filtered.filter(property => 
        property.type === selectedType
      );
    }
    
    // Apply bedrooms filter
    if (bedrooms) {
      const bedroomCount = parseInt(bedrooms);
      filtered = filtered.filter(property => property.bedrooms >= bedroomCount);
    }
    
    // Apply bathrooms filter
    if (bathrooms) {
      const bathroomCount = parseInt(bathrooms);
      filtered = filtered.filter(property => property.bathrooms >= bathroomCount);
    }
    
    // Apply price range filter
    filtered = filtered.filter(property => 
      property.price >= priceRange[0] && property.price <= priceRange[1]
    );
    
    // Apply search query filter
    if (searchQuery) {
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setCurrentPage(1);
    toast.success(`Found ${filtered.length} properties matching your criteria!`);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedLocation('Lagos');
    setSelectedType('Apartment');
    setSelectedStatus('');
    setPriceRange([0, 100000000]);
    setBedrooms('2');
    setBathrooms('3');
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleLearnMore = () => {
    navigate('/about');
  };
  
  const handleToggleFavorite = (propertyId) => {
    if (!user) {
      toast.error('Please login to save properties to favorites');
      navigate('/login');
      return;
    }
    
    const newFavorites = new Set(favorites);
    if (newFavorites.has(propertyId)) {
      newFavorites.delete(propertyId);
      toast.success('Removed from favorites');
    } else {
      newFavorites.add(propertyId);
      toast.success('Added to favorites');
    }
    setFavorites(newFavorites);
    toggleFavorite(propertyId);
  };
  
  const handleShareProperty = async (property) => {
    const shareData = {
      title: property.title,
      text: `Check out this amazing property: ${property.title}`,
      url: `${window.location.origin}/property/${property.propertyId || property.id}`
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Property shared successfully!');
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Property link copied to clipboard!');
      }
    } catch (error) {
      toast.error('Failed to share property');
    }
  };
  
  
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    let sorted = [...(filteredProperties.length > 0 ? filteredProperties : mockProperties)];
    
    switch (newSortBy) {
      case 'Price Low to High':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'Price High to Low':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'Newest':
        sorted.sort((a, b) => b.id - a.id);
        break;
      default:
        // Most Relevant - keep original order
        break;
    }
    
    setDisplayProperties(sorted);
    toast.success(`Sorted by ${newSortBy.toLowerCase()}`);
  };
  
  const handlePaginationClick = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <SEO 
        title="Find Your Dream Property in Nigeria"
        description="Browse thousands of properties for sale, rent, and investment across Nigeria. Luxury homes, apartments, land, and commercial properties."
        keywords="real estate Nigeria, buy property Nigeria, rent property Lagos, property for sale, investment property, luxury homes"
      />
      <div className="min-h-screen bg-gray-50 w-full">
      {/* Custom CSS for Range Slider */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .slider-thumb::-webkit-slider-thumb {
            appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f97316, #ea580c);
            cursor: grab;
            border: 3px solid #fff;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2);
            transition: all 0.2s ease;
          }
          
          .slider-thumb::-webkit-slider-thumb:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.3);
          }
          
          .slider-thumb::-webkit-slider-thumb:active {
            cursor: grabbing;
            transform: scale(1.05);
          }
          
          .slider-thumb::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f97316, #ea580c);
            cursor: grab;
            border: 3px solid #fff;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2);
            transition: all 0.2s ease;
          }
          
          .slider-thumb::-moz-range-thumb:hover {
            transform: scale(1.1);
          }
          
          .slider-thumb::-moz-range-thumb:active {
            cursor: grabbing;
            transform: scale(1.05);
          }
          
          .slider-thumb:focus {
            outline: none;
          }
          
          .slider-thumb:focus::-webkit-slider-thumb {
            box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.3), 0 3px 8px rgba(0, 0, 0, 0.3);
          }
          
          .slider-thumb:focus::-moz-range-thumb {
            box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.3), 0 3px 8px rgba(0, 0, 0, 0.3);
          }

          .slider-thumb::-webkit-slider-track {
            background: transparent;
          }
          
          .slider-thumb::-moz-range-track {
            background: transparent;
            border: none;
          }
        `
      }} />
      
      {/* Hero Banner Carousel - Full Width */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 mb-16">
        <HeroBannerCarousel />
      </div>

      {/* Navigation Menu Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-center space-x-8 py-4">
            {/* For Sale */}
            <div className="relative dropdown-container">
                <button
                onClick={() => setActiveDropdown(activeDropdown === 'For Sale' ? null : 'For Sale')}
                className={`flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-colors hover:text-orange-600 ${
                  activeDropdown === 'For Sale' ? 'text-orange-600' : 'text-gray-700'
                }`}
              >
                <span>For Sale</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${
                    activeDropdown === 'For Sale' ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                </button>
              
              {activeDropdown === 'For Sale' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                  <div className="py-2">
                    {quickFilters['For Sale'].map((item) => (
                      <Link
                        key={item}
                        to={`/properties?type=${encodeURIComponent(item)}&status=For Sale`}
                        onClick={() => setActiveDropdown(null)}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors text-gray-700"
                      >
                        {item}
                      </Link>
              ))}
            </div>
          </div>
              )}
            </div>

            {/* For Rent */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'For Rent' ? null : 'For Rent')}
                className={`flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-colors hover:text-orange-600 ${
                  activeDropdown === 'For Rent' ? 'text-orange-600' : 'text-gray-700'
                }`}
              >
                <span>For Rent</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${
                    activeDropdown === 'For Rent' ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {activeDropdown === 'For Rent' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                  <div className="py-2">
                    {quickFilters['For Rent'].map((location) => (
                      <Link
                        key={location}
                        to={`/properties?location=${encodeURIComponent(location)}&status=For Rent`}
                        onClick={() => setActiveDropdown(null)}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors text-gray-700"
                      >
                        {location}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Shortlet */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'Shortlet' ? null : 'Shortlet')}
                className={`flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-colors hover:text-orange-600 ${
                  activeDropdown === 'Shortlet' ? 'text-orange-600' : 'text-gray-700'
                }`}
              >
                <span>Shortlet</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${
                    activeDropdown === 'Shortlet' ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {activeDropdown === 'Shortlet' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                  <div className="py-2">
                    {quickFilters['Shortlet'].map((location) => (
                      <Link
                        key={location}
                        to={`/properties?location=${encodeURIComponent(location)}&status=Shortlet`}
                        onClick={() => setActiveDropdown(null)}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors text-gray-700"
                      >
                        {location}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Blog */}
            <Link
              to="/blog"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
            >
              Blog
            </Link>

            {/* Diasporan Services */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'Diasporan Services' ? null : 'Diasporan Services')}
                className={`flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-colors hover:text-orange-600 ${
                  activeDropdown === 'Diasporan Services' ? 'text-orange-600' : 'text-gray-700'
                }`}
              >
                <span>Diasporan Services</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${
                    activeDropdown === 'Diasporan Services' ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {activeDropdown === 'Diasporan Services' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                  <div className="py-2">
                    {quickFilters['Diasporan Services'].map((service) => (
                      <button
                        key={service}
                        onClick={() => {
                          toast.info(`${service} - Coming soon!`);
                          setActiveDropdown(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors text-gray-700"
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-80 bg-gray-800 text-white rounded-lg p-6 h-fit">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Property Filters</h3>
              <button 
                onClick={handleResetAllFilters}
                className="text-sm text-gray-300 hover:text-white"
              >
                Reset All
              </button>
            </div>

            {/* Active Filters */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {selectedLocation && (
                  <span className="flex items-center bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                    {selectedLocation} <FaTimes className="ml-2 cursor-pointer" onClick={() => removeFilter('location')} />
                  </span>
                )}
                {selectedStatus && (
                  <span className="flex items-center bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                    {selectedStatus} <FaTimes className="ml-2 cursor-pointer" onClick={() => removeFilter('status')} />
                  </span>
                )}
                {selectedType && (
                  <span className="flex items-center bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                    {selectedType} <FaTimes className="ml-2 cursor-pointer" onClick={() => removeFilter('type')} />
                  </span>
                )}
                {bedrooms && (
                  <span className="flex items-center bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                    {bedrooms} Bedrooms <FaTimes className="ml-2 cursor-pointer" onClick={() => removeFilter('bedrooms')} />
                  </span>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            {/* Property Status */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Property Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Status</option>
                {propertyStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Property Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Property Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Types</option>
                {propertyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Price Range (₦)</label>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={priceRange[0].toLocaleString()}
                    onChange={(e) => {
                      const inputValue = e.target.value.replace(/,/g, '');
                      if (inputValue === '') {
                        setPriceRange([0, priceRange[1]]);
                        return;
                      }
                      const value = parseInt(inputValue) || 0;
                      // Allow any minimum value - no restrictions
                      setPriceRange([value, priceRange[1]]);
                    }}
                    onBlur={(e) => {
                      const inputValue = e.target.value.replace(/,/g, '');
                      if (inputValue === '') {
                        setPriceRange([0, priceRange[1]]);
                        return;
                      }
                      const value = parseInt(inputValue) || 0;
                      // Only ensure non-negative values, no upper limit restriction
                      const clampedValue = Math.max(0, value);
                      setPriceRange([clampedValue, priceRange[1]]);
                    }}
                    className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Min Price (Any amount)"
                  />
                  <input
                    type="text"
                    value={priceRange[1].toLocaleString()}
                    onChange={(e) => {
                      const inputValue = e.target.value.replace(/,/g, '');
                      if (inputValue === '') {
                        setPriceRange([priceRange[0], 1000000000]); // Default to 1B if empty
                        return;
                      }
                      const value = parseInt(inputValue) || 200000000;
                      // Allow any maximum value - no restrictions
                      setPriceRange([priceRange[0], value]);
                    }}
                    onBlur={(e) => {
                      const inputValue = e.target.value.replace(/,/g, '');
                      if (inputValue === '') {
                        setPriceRange([priceRange[0], 1000000000]);
                        return;
                      }
                      const value = parseInt(inputValue) || 200000000;
                      // Only ensure it's not less than minimum
                      const clampedValue = Math.max(value, priceRange[0]);
                      setPriceRange([priceRange[0], clampedValue]);
                    }}
                    className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Max Price (Any amount)"
                  />
                </div>
                
                {/* Interactive Range Slider */}
                <div className="relative">
                  <div className="relative h-2 bg-gray-600 rounded-full">
                    <div 
                      className="absolute h-2 bg-orange-500 rounded-full"
                      style={{
                        left: `${Math.min((priceRange[0] / Math.max(priceRange[1], 200000000)) * 100, 95)}%`,
                        width: `${Math.max(((priceRange[1] - priceRange[0]) / Math.max(priceRange[1], 200000000)) * 100, 5)}%`
                      }}
                    ></div>
                    <input
                      type="range"
                      min="0"
                      max={Math.max(priceRange[1], 200000000)}
                      step="500000"
                      value={priceRange[0]}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        // Allow any minimum value without restriction
                        setPriceRange([value, priceRange[1]]);
                      }}
                      className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
                      style={{ zIndex: 2 }}
                    />
                    <input
                      type="range"
                      min="0"
                      max={Math.max(priceRange[1], 200000000)}
                      step="500000"
                      value={priceRange[1]}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        // Allow any maximum value without restriction
                        setPriceRange([priceRange[0], value]);
                      }}
                      className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
                      style={{ zIndex: 3 }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-300 mt-2">
                    <span>₦0</span>
                    <div className="text-center">
                      <span className="text-orange-500 font-medium bg-gray-800 px-3 py-1 rounded inline-block">
                      ₦{priceRange[0].toLocaleString()} - ₦{priceRange[1].toLocaleString()}
                    </span>
                    </div>
                    <span>₦{Math.max(priceRange[1], 200000000).toLocaleString()}+</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 text-center">
                    Drag the slider handles or type any amount in the input fields above
                  </div>
                </div>
              </div>
            </div>

            {/* Bedrooms */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Bedrooms</label>
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Any</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5+">5+</option>
              </select>
            </div>

            {/* Bathrooms */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Bathrooms</label>
              <select
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Any</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5+">5+</option>
              </select>
            </div>

            {/* Amenities */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Amenities</label>
              <div className="space-y-2">
                {amenities.slice(0, showMoreAmenities ? amenities.length : 8).map((amenity) => (
                  <label key={amenity} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                      className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm">{amenity}</span>
                  </label>
                ))}
                {!showMoreAmenities && (
                  <button
                    onClick={() => setShowMoreAmenities(true)}
                    className="text-orange-500 text-sm hover:text-orange-400"
                  >
                    + Show more amenities
                  </button>
                )}
              </div>
            </div>

            {/* Property Age */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Property Age</label>
              <div className="flex space-x-2">
                {['Any Age', 'New 0-5 yrs', '5-10 yrs Age'].map((age) => (
                  <button
                    key={age}
                    onClick={() => setPropertyAge(age)}
                    className={`px-3 py-2 rounded-full text-sm transition-colors ${
                      propertyAge === age
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="space-y-3">
              <button 
                onClick={handleApplyFilters}
                className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                Apply Filters
              </button>
              <button 
                onClick={handleResetAllFilters}
                className="w-full bg-transparent border border-gray-600 text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Property Listings */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-700">{displayProperties.length} properties found</p>
              <div className="flex items-center space-x-2">
                <FaSort className="text-gray-400" title="Sort properties" />
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  title="Sort properties by preference"
                >
                  <option value="Most Relevant">Most Relevant</option>
                  <option value="Price Low to High">Price Low to High</option>
                  <option value="Price High to Low">Price High to Low</option>
                  <option value="Newest">Newest</option>
                </select>
              </div>
            </div>

            {/* Property Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentProperties.map((property) => (
                <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 text-xs font-medium text-white rounded ${property.labelColor}`}>
                        {property.label}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 flex space-x-2">
                      <button 
                        onClick={() => handleToggleFavorite(property.id)}
                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
                        title={favorites.has(property.id) ? "Remove from favorites" : "Add to favorites"}
                      >
                        <FaHeart className={`text-sm transition-colors ${
                          favorites.has(property.id) ? 'text-red-500' : 'text-gray-400'
                        }`} />
                      </button>
                      <button 
                        onClick={() => handleShareProperty(property)}
                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
                        title="Share property"
                      >
                        <FaShare className="text-gray-400 text-sm hover:text-blue-500 transition-colors" />
                      </button>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="text-2xl font-bold text-white">
                        ₦{property.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{property.title}</h3>
                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <FaMapMarkerAlt className="mr-1" />
                      <span>{property.location}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{property.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <FaBed className="mr-1" />
                          {property.bedrooms || property.details?.bedrooms || 0} Beds
                        </span>
                        <span className="flex items-center">
                          <FaBath className="mr-1" />
                          {property.bathrooms || property.details?.bathrooms || 0} Baths
                        </span>
                        <span className="flex items-center">
                          <FaRulerCombined className="mr-1" />
                          {property.sqft || property.details?.sqft || property.area || 0}m²
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/property/${property.propertyId || property.id}`}
                      className="flex items-center justify-center w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors"
                      title={`View details for ${property.title}`}
                    >
                      View Details
                      <FaArrowRight className="ml-2 text-sm" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center mt-8 space-x-2">
                <button 
                  onClick={() => handlePaginationClick(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  &lt;
                </button>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <button 
                      key={pageNumber}
                      onClick={() => handlePaginationClick(pageNumber)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === pageNumber
                          ? 'bg-orange-500 text-white'
                          : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                      title={`Go to page ${pageNumber}`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                {totalPages > 5 && (
                  <>
                    <span className="px-3 py-2 text-gray-600">...</span>
                    <button 
                      onClick={() => handlePaginationClick(totalPages)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                      title={`Go to page ${totalPages}`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                
                <button 
                  onClick={() => handlePaginationClick(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security & Value Proposition Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 rounded-full mb-6">
              <FaLock className="text-yellow-300" />
              <p className="font-medium">Bank-Level Security</p>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose KIKI ESTATES for Secure Real Estate?
            </h2>
            
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              We understand the risks in real estate transactions. That's why we've built the most secure 
              property marketplace in Nigeria with multiple layers of protection for buyers, sellers, and investors.
            </p>
          </div>

          {/* Security Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Escrow Protection */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <FaShieldAlt className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center">Escrow Protection</h3>
              <p className="text-blue-100 text-center leading-relaxed">
                Your money is held in secure escrow until the transaction is complete. No payments are released 
                until both parties are satisfied. Our escrow system protects your funds at every stage.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-blue-50">
                <li className="flex items-start">
                  <FaCheck className="text-yellow-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Automatic refund protection</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-yellow-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Identity verification required</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-yellow-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Payment processed only on agreement</span>
                </li>
              </ul>
            </div>

            {/* Verified Properties */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <FaCertificate className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center">Property Verification</h3>
              <p className="text-blue-100 text-center leading-relaxed">
                Every property listing undergoes rigorous verification. We confirm ownership, legality, 
                documents, and accuracy of details before listing. No fake listings on our platform.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-blue-50">
                <li className="flex items-start">
                  <FaCheck className="text-green-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Complete document verification</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-green-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Ownership and title confirmation</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-green-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Physical inspection reports</span>
                </li>
              </ul>
            </div>

            {/* Dispute Resolution */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <FaHandshake className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center">Fair Dispute Resolution</h3>
              <p className="text-blue-100 text-center leading-relaxed">
                If something goes wrong, we're here to help. Our expert team mediates disputes fairly 
                and ensures both parties are treated justly. We provide transparent resolution processes.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-blue-50">
                <li className="flex items-start">
                  <FaCheck className="text-purple-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Expert mediation team</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-purple-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Evidence-based decisions</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-purple-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Quick turnaround times</span>
                </li>
              </ul>
            </div>

            {/* Legal Compliance */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <FaFileContract className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center">Legal Documentation</h3>
              <p className="text-blue-100 text-center leading-relaxed">
                We guide you through all legal requirements. From contracts to deed transfers, our legal 
                framework ensures compliance with Nigerian real estate laws and regulations.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-blue-50">
                <li className="flex items-start">
                  <FaCheck className="text-red-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Standardized legal contracts</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-red-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Professional legal guidance</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-red-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Government compliance support</span>
                </li>
              </ul>
            </div>

            {/* 24/7 Support */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <FaClock className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center">24/7 Support</h3>
              <p className="text-blue-100 text-center leading-relaxed">
                Our dedicated support team is available around the clock to assist you with any concerns. 
                Get help via phone, email, or live chat whenever you need it.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-blue-50">
                <li className="flex items-start">
                  <FaCheck className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Instant live chat support</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Phone and email assistance</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Transaction progress tracking</span>
                </li>
              </ul>
            </div>

            {/* Mobile Access */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <FaMobileAlt className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center">Mobile-First Platform</h3>
              <p className="text-blue-100 text-center leading-relaxed">
                Browse, search, and complete transactions from anywhere. Our mobile-optimized platform 
                makes real estate investing accessible from your phone, tablet, or computer.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-blue-50">
                <li className="flex items-start">
                  <FaCheck className="text-indigo-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Responsive design for all devices</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-indigo-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Quick property notifications</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-indigo-400 mr-2 mt-1 flex-shrink-0" />
                  <span>Secure mobile payments</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-white text-gray-900 rounded-2xl p-12 text-center shadow-2xl">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Invest Securely?
            </h3>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of smart investors who trust KIKI ESTATES for their real estate transactions. 
              Start browsing verified properties today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/properties')}
                className="px-10 py-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group"
              >
                <span>Explore Properties</span>
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              {!user && (
                <button 
                  onClick={() => navigate('/register')}
                  className="px-10 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Create Free Account
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Property Discovery Section */}
      <div className="bg-brand-blue text-white py-16 mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Experience Premium Property Discovery</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              KIKI ESTATES offers exclusive features to enhance your property search. 
              Our advanced tools help you find, evaluate, and secure your dream property with confidence.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white bg-opacity-10 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaPlay className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Virtual Tours</h3>
                <p className="text-gray-300 mb-4">
                  Experience immersive 3D tours of properties from the comfort of your home. 
                  Get a realistic feel of spaces before visiting in person.
                </p>
                <button 
                  onClick={handleLearnMore}
                  className="text-yellow-400 hover:text-yellow-300 font-medium"
                >
                  Learn More →
                </button>
              </div>

              <div className="bg-white bg-opacity-10 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheck className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Verified Properties</h3>
                <p className="text-gray-300 mb-4">
                  Every property is verified by our expert team for authenticity and legal compliance. 
                  Buy with confidence knowing all details are accurate.
                </p>
                <button 
                  onClick={handleLearnMore}
                  className="text-yellow-400 hover:text-yellow-300 font-medium"
                >
                  Learn More →
                </button>
              </div>

              <div className="bg-white bg-opacity-10 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaChartLine className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Market Insights</h3>
                <p className="text-gray-300 mb-4">
                  Access detailed market analysis and investment reports. 
                  Make informed decisions with comprehensive property data and trends.
                </p>
                <button 
                  onClick={handleLearnMore}
                  className="text-yellow-400 hover:text-yellow-300 font-medium"
                >
                  Learn More →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Home Sections - Agents and Property Categories */}
      <HomeSections />

      {/* Blog Section */}
      <BlogSection />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-brand-orange rounded-lg flex items-center justify-center">
                  <FaBuilding className="text-white text-xl" />
                </div>
                <span className="text-2xl font-bold">KIKI ESTATES</span>
              </div>
              <p className="text-gray-400 mb-6">
                Your trusted partner in finding premium properties across Nigeria. 
                We connect you with verified luxury homes, apartments, and investment opportunities.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-orange transition-colors">
                  <span className="text-sm font-bold">f</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-orange transition-colors">
                  <span className="text-sm font-bold">t</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-orange transition-colors">
                  <span className="text-sm font-bold">in</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-orange transition-colors">
                  <span className="text-sm font-bold">ig</span>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link to="/properties" className="text-gray-400 hover:text-white transition-colors">Browse Properties</Link></li>
                <li><Link to="/mortgage" className="text-gray-400 hover:text-white transition-colors">Mortgage Calculator</Link></li>
                <li><Link to="/investment" className="text-gray-400 hover:text-white transition-colors">Investment Opportunities</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/help" className="text-gray-400 hover:text-white transition-colors">Help & Support</Link></li>
              </ul>
            </div>

            {/* Property Types */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Property Types</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Luxury Apartments</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Family Houses</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Penthouses</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Beachfront Villas</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Commercial Properties</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <FaMapMarkerAlt className="text-brand-orange mt-1" />
                  <div>
                    <p className="text-gray-400">123 Victoria Island</p>
                    <p className="text-gray-400">Lagos, Nigeria</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-brand-orange">📞</span>
                  <p className="text-gray-400">+234 800 123 4567</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-brand-orange">✉️</span>
                  <p className="text-gray-400">info@kikiestate.com</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-brand-orange">🕒</span>
                  <p className="text-gray-400">Mon - Fri: 9:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 KIKI ESTATES. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      
    </div>
    </>
  );
};

export default Home;