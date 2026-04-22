module.exports = [
  {
    id: 'escrow_mock_001',
    propertyId: '550e8400-e29b-41d4-a716-446655440002',
    buyerId: 'user_mock_001',
    sellerId: '550e8400-e29b-41d4-a716-446655440001',
    amount: 185000000,
    currency: 'NGN',
    paymentMethod: 'paystack',
    status: 'pending',
    createdAt: '2026-04-01T09:15:00.000Z',
    updatedAt: '2026-04-01T09:15:00.000Z',
    metadata: {
      buyerName: 'Adebayo Oluwaseun',
      sellerName: 'Mock Vendor'
    }
  },
  {
    id: 'escrow_mock_002',
    propertyId: '550e8400-e29b-41d4-a716-446655440004',
    buyerId: 'user_mock_002',
    sellerId: '550e8400-e29b-41d4-a716-446655440001',
    amount: 520000000,
    currency: 'NGN',
    paymentMethod: 'flutterwave',
    status: 'completed',
    createdAt: '2026-03-28T11:20:00.000Z',
    updatedAt: '2026-03-30T08:05:00.000Z',
    metadata: {
      buyerName: 'Chioma Nwosu',
      sellerName: 'Mock Vendor'
    }
  },
  {
    id: 'escrow_mock_003',
    propertyId: '550e8400-e29b-41d4-a716-44665544000c',
    buyerId: 'user_mock_003',
    sellerId: '550e8400-e29b-41d4-a716-446655440001',
    amount: 84000000,
    currency: 'NGN',
    paymentMethod: 'bank_transfer',
    status: 'disputed',
    createdAt: '2026-03-15T14:45:00.000Z',
    updatedAt: '2026-03-18T10:30:00.000Z',
    metadata: {
      buyerName: 'Emmanuel Adeyemi',
      sellerName: 'Mock Vendor'
    }
  }
];
