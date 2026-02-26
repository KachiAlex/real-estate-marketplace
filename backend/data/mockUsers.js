module.exports = [
  {
    id: 'primaryadmin',
    email: 'admin@propertyark.com',
    firstName: 'PropertyArk',
    lastName: 'Adminstrator',
    role: 'admin',
    roles: ['admin']
  }
  ,
  {
    id: 'vendor1',
    email: 'vendor1@example.com',
    firstName: 'Vendor',
    lastName: 'One',
    role: 'vendor',
    roles: ['vendor'],
    onboardingComplete: true,
    vendorData: {
      onboardingComplete: true,
      businessName: 'Mock Vendor Co',
      totalProperties: 5,
      totalSales: 2500000
    }
  }
  ,
  {
    id: 'onyedika',
    email: 'onyedika.akoma@gmail.com',
    firstName: 'Onyedika',
    lastName: 'Akoma',
    role: 'vendor',
    roles: ['vendor'],
    onboardingComplete: true,
    vendorData: {
      onboardingComplete: true,
      businessName: "Onyedika's Realty",
      totalProperties: 3,
      totalSales: 12000000,
      properties: [
        {
          id: 'p-on-1',
          title: '3BR Luxury Apartment, Victoria Island',
          verificationStatus: 'verified',
          status: 'for-sale',
          views: 1200,
          inquiries: ['inq1','inq2','inq3'],
          escrowTransactions: [{ status: 'completed', amount: 4000000 }],
          owner: { email: 'onyedika.akoma@gmail.com', id: 'onyedika' }
        },
        {
          id: 'p-on-2',
          title: 'Ocean-view 2BR Condo, Lagos',
          verificationStatus: 'verified',
          status: 'for-sale',
          views: 800,
          inquiries: ['inq4'],
          escrowTransactions: [{ status: 'completed', amount: 3000000 }],
          owner: { email: 'onyedika.akoma@gmail.com', id: 'onyedika' }
        },
        {
          id: 'p-on-3',
          title: '1BR Studio, Ikeja',
          verificationStatus: 'pending',
          status: 'for-sale',
          views: 150,
          inquiries: [],
          escrowTransactions: [],
          owner: { email: 'onyedika.akoma@gmail.com', id: 'onyedika' }
        }
      ]
    }
  }
];

