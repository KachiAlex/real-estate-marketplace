// Mock property data for the mobile app
export const mockProperties = [
  {
    id: 'prop_001',
    title: 'Luxury Apartment in Victoria Island',
    description: 'Beautiful 3-bedroom apartment with stunning ocean views and modern amenities.',
    price: 250000000,
    type: 'apartment',
    status: 'for-sale',
    details: {
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800,
    },
    location: {
      address: '123 Victoria Island',
      city: 'Lagos',
      state: 'Lagos',
    },
    images: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&h=600&fit=crop',
    ],
    owner: {
      name: 'John Doe',
    },
    views: 120,
    isVerified: true,
  },
  {
    id: 'prop_002',
    title: 'Spacious Family House in Lekki',
    description: 'Elegant 4-bedroom family home with large garden and parking space.',
    price: 180000000,
    type: 'house',
    status: 'for-sale',
    details: {
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2800,
    },
    location: {
      address: '456 Lekki Phase 1',
      city: 'Lagos',
      state: 'Lagos',
    },
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
    ],
    owner: {
      name: 'Jane Smith',
    },
    views: 89,
    isVerified: true,
  },
  {
    id: 'prop_003',
    title: 'Modern Office Space in Ikeja',
    description: 'Premium office space in the heart of Ikeja with excellent connectivity.',
    price: 320000000,
    type: 'commercial',
    status: 'for-sale',
    details: {
      bedrooms: 0,
      bathrooms: 2,
      sqft: 3500,
    },
    location: {
      address: '789 Ikeja GRA',
      city: 'Lagos',
      state: 'Lagos',
    },
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
    ],
    owner: {
      name: 'ABC Properties',
    },
    views: 156,
    isVerified: true,
  },
];

export const mockInvestments = [
  {
    id: 'inv_001',
    title: 'Premium Beachfront Resort Development',
    description: 'Luxury beachfront resort with private beach access.',
    type: 'hospitality',
    totalAmount: 5000000000,
    minimumInvestment: 50000000,
    raisedAmount: 2500000000,
    investors: 50,
    expectedReturn: 22.5,
    duration: 72,
    location: { address: 'Lekki Beachfront', city: 'Lagos', state: 'Lagos' },
    status: 'fundraising',
  },
  {
    id: 'inv_002',
    title: 'Luxury Residential Estate',
    description: 'High-end residential estate with world-class amenities.',
    type: 'residential',
    totalAmount: 3000000000,
    minimumInvestment: 30000000,
    raisedAmount: 1500000000,
    investors: 45,
    expectedReturn: 18.5,
    duration: 60,
    location: { address: 'Victoria Island', city: 'Lagos', state: 'Lagos' },
    status: 'fundraising',
  },
];

export const mockMortgages = [
  {
    id: 'mort_001',
    propertyId: 'prop_001',
    propertyTitle: 'Luxury Apartment in Victoria Island',
    loanAmount: 125000000,
    interestRate: 18.5,
    loanTerm: 20,
    monthlyPayment: 1875000,
    remainingBalance: 118750000,
    paymentsMade: 3,
    totalPayments: 240,
    nextPaymentDate: '2024-02-15',
    status: 'active',
  },
];

