// Comprehensive Mock Users Data for Real Estate Marketplace
// All users have realistic Nigerian profiles with complete account details

const mockUsers = [
  {
    id: 'user_001',
    firstName: 'Adebayo',
    lastName: 'Oluwaseun',
    email: 'adebayo.oluwaseun@gmail.com',
    phone: '+234-801-234-5678',
    password: 'password123', // For testing purposes
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    isActive: true,
    dateOfBirth: '1985-03-15',
    gender: 'male',
    occupation: 'Software Engineer',
    company: 'Flutterwave',
    address: {
      street: '123 Lekki Phase 1',
      city: 'Lagos',
      state: 'Lagos',
      zipCode: '101001'
    },
    bankDetails: {
      accountNumber: '0123456789',
      bankName: 'First Bank of Nigeria',
      accountName: 'Adebayo Oluwaseun'
    },
    kycStatus: 'verified',
    createdAt: new Date('2024-01-15').toISOString(),
    lastLogin: new Date('2024-01-20').toISOString(),
    properties: ['prop_001', 'prop_002'] // Property IDs owned by this user
  },
  {
    id: 'user_002',
    firstName: 'Chioma',
    lastName: 'Nwosu',
    email: 'chioma.nwosu@yahoo.com',
    phone: '+234-802-345-6789',
    password: 'password123',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    isActive: true,
    dateOfBirth: '1988-07-22',
    gender: 'female',
    occupation: 'Real Estate Agent',
    company: 'Knight Frank Nigeria',
    address: {
      street: '456 Victoria Island',
      city: 'Lagos',
      state: 'Lagos',
      zipCode: '101241'
    },
    bankDetails: {
      accountNumber: '9876543210',
      bankName: 'Guaranty Trust Bank',
      accountName: 'Chioma Nwosu'
    },
    kycStatus: 'verified',
    createdAt: new Date('2024-01-10').toISOString(),
    lastLogin: new Date('2024-01-19').toISOString(),
    properties: ['prop_003', 'prop_004']
  },
  {
    id: 'user_003',
    firstName: 'Emmanuel',
    lastName: 'Adeyemi',
    email: 'emmanuel.adeyemi@hotmail.com',
    phone: '+234-803-456-7890',
    password: 'password123',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    isActive: true,
    dateOfBirth: '1982-11-08',
    gender: 'male',
    occupation: 'Investment Banker',
    company: 'Stanbic IBTC',
    address: {
      street: '789 Banana Island',
      city: 'Lagos',
      state: 'Lagos',
      zipCode: '101001'
    },
    bankDetails: {
      accountNumber: '1122334455',
      bankName: 'Access Bank',
      accountName: 'Emmanuel Adeyemi'
    },
    kycStatus: 'verified',
    createdAt: new Date('2024-01-08').toISOString(),
    lastLogin: new Date('2024-01-18').toISOString(),
    properties: ['prop_005', 'prop_006']
  },
  {
    id: 'user_004',
    firstName: 'Fatima',
    lastName: 'Ibrahim',
    email: 'fatima.ibrahim@gmail.com',
    phone: '+234-804-567-8901',
    password: 'password123',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    isActive: true,
    dateOfBirth: '1990-05-12',
    gender: 'female',
    occupation: 'Business Owner',
    company: 'Fashion Forward Ltd',
    address: {
      street: '321 Surulere',
      city: 'Lagos',
      state: 'Lagos',
      zipCode: '101283'
    },
    bankDetails: {
      accountNumber: '5566778899',
      bankName: 'Zenith Bank',
      accountName: 'Fatima Ibrahim'
    },
    kycStatus: 'verified',
    createdAt: new Date('2024-01-12').toISOString(),
    lastLogin: new Date('2024-01-17').toISOString(),
    properties: ['prop_007', 'prop_008']
  },
  {
    id: 'user_005',
    firstName: 'Oluwaseun',
    lastName: 'Akoma',
    email: 'oluwaseun.akoma@gmail.com',
    phone: '+234-805-678-9012',
    password: 'password123',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    isActive: true,
    dateOfBirth: '1987-09-30',
    gender: 'male',
    occupation: 'Property Developer',
    company: 'Prime Properties Ltd',
    address: {
      street: '456 Magodo GRA',
      city: 'Lagos',
      state: 'Lagos',
      zipCode: '105001'
    },
    bankDetails: {
      accountNumber: '9988776655',
      bankName: 'United Bank for Africa',
      accountName: 'Oluwaseun Akoma'
    },
    kycStatus: 'verified',
    createdAt: new Date('2024-01-05').toISOString(),
    lastLogin: new Date('2024-01-16').toISOString(),
    properties: ['prop_009', 'prop_010', 'prop_011']
  },
  {
    id: 'user_006',
    firstName: 'Blessing',
    lastName: 'Okafor',
    email: 'blessing.okafor@outlook.com',
    phone: '+234-806-789-0123',
    password: 'password123',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    isActive: true,
    dateOfBirth: '1992-12-03',
    gender: 'female',
    occupation: 'Corporate Lawyer',
    company: 'Aluko & Oyebode',
    address: {
      street: '123 Ikeja GRA',
      city: 'Lagos',
      state: 'Lagos',
      zipCode: '100001'
    },
    bankDetails: {
      accountNumber: '4433221100',
      bankName: 'Fidelity Bank',
      accountName: 'Blessing Okafor'
    },
    kycStatus: 'verified',
    createdAt: new Date('2024-01-20').toISOString(),
    lastLogin: new Date('2024-01-21').toISOString(),
    properties: ['prop_012', 'prop_013']
  },
  {
    id: 'user_007',
    firstName: 'Ibrahim',
    lastName: 'Musa',
    email: 'ibrahim.musa@gmail.com',
    phone: '+234-807-890-1234',
    password: 'password123',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    isActive: true,
    dateOfBirth: '1984-04-18',
    gender: 'male',
    occupation: 'Oil & Gas Executive',
    company: 'Shell Nigeria',
    address: {
      street: '789 Port Harcourt',
      city: 'Port Harcourt',
      state: 'Rivers',
      zipCode: '500001'
    },
    bankDetails: {
      accountNumber: '7788990011',
      bankName: 'First Bank of Nigeria',
      accountName: 'Ibrahim Musa'
    },
    kycStatus: 'verified',
    createdAt: new Date('2024-01-18').toISOString(),
    lastLogin: new Date('2024-01-20').toISOString(),
    properties: ['prop_014', 'prop_015']
  },
  {
    id: 'user_008',
    firstName: 'Grace',
    lastName: 'Eze',
    email: 'grace.eze@yahoo.com',
    phone: '+234-808-901-2345',
    password: 'password123',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    isActive: true,
    dateOfBirth: '1989-08-25',
    gender: 'female',
    occupation: 'Medical Doctor',
    company: 'Lagos University Teaching Hospital',
    address: {
      street: '321 Yaba',
      city: 'Lagos',
      state: 'Lagos',
      zipCode: '101212'
    },
    bankDetails: {
      accountNumber: '2233445566',
      bankName: 'Guaranty Trust Bank',
      accountName: 'Grace Eze'
    },
    kycStatus: 'verified',
    createdAt: new Date('2024-01-14').toISOString(),
    lastLogin: new Date('2024-01-19').toISOString(),
    properties: ['prop_016']
  },
  {
    id: 'user_009',
    firstName: 'Kemi',
    lastName: 'Adebayo',
    email: 'kemi.adebayo@gmail.com',
    phone: '+234-809-012-3456',
    password: 'password123',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    isActive: true,
    dateOfBirth: '1986-01-14',
    gender: 'female',
    occupation: 'Entrepreneur',
    company: 'Kemi Foods Ltd',
    address: {
      street: '654 Ikoyi',
      city: 'Lagos',
      state: 'Lagos',
      zipCode: '101001'
    },
    bankDetails: {
      accountNumber: '6677889900',
      bankName: 'Access Bank',
      accountName: 'Kemi Adebayo'
    },
    kycStatus: 'verified',
    createdAt: new Date('2024-01-11').toISOString(),
    lastLogin: new Date('2024-01-18').toISOString(),
    properties: ['prop_017', 'prop_018']
  },
  {
    id: 'user_010',
    firstName: 'Tunde',
    lastName: 'Ogunlana',
    email: 'tunde.ogunlana@hotmail.com',
    phone: '+234-810-123-4567',
    password: 'password123',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    isActive: true,
    dateOfBirth: '1983-06-07',
    gender: 'male',
    occupation: 'Architect',
    company: 'Tunde & Associates',
    address: {
      street: '987 Gbagada',
      city: 'Lagos',
      state: 'Lagos',
      zipCode: '100234'
    },
    bankDetails: {
      accountNumber: '8899001122',
      bankName: 'Zenith Bank',
      accountName: 'Tunde Ogunlana'
    },
    kycStatus: 'verified',
    createdAt: new Date('2024-01-09').toISOString(),
    lastLogin: new Date('2024-01-17').toISOString(),
    properties: ['prop_019', 'prop_020']
  },
  {
    id: 'user_011',
    firstName: 'Onyedikachi',
    lastName: 'Akoma',
    email: 'onyedika.akoma@gmail.com',
    phone: '+234-811-234-5678',
    password: 'dikaoliver2660',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    isActive: true,
    dateOfBirth: '1985-05-15',
    gender: 'male',
    occupation: 'Software Developer',
    company: 'Tech Solutions Ltd',
    address: {
      street: '789 Abuja Central',
      city: 'Abuja',
      state: 'FCT',
      zipCode: '900001'
    },
    bankDetails: {
      accountNumber: '1234567890',
      bankName: 'Guaranty Trust Bank',
      accountName: 'Onyedikachi Akoma'
    },
    kycStatus: 'verified',
    createdAt: new Date('2024-01-18').toISOString(),
    lastLogin: new Date('2024-01-21').toISOString(),
    properties: [] // No properties currently owned
  },
    // Real Estate Agents by Location
    {
      id: 'agent_001',
      firstName: 'Emeka',
      lastName: 'Okafor',
      email: 'emeka.okafor@lagosagents.com',
      phone: '+234-803-111-2222',
      password: 'agent123',
      role: 'vendor',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      isVerified: true,
      isActive: true,
      dateOfBirth: '1982-05-10',
      gender: 'male',
      occupation: 'Real Estate Agent',
      company: 'Lagos Prime Properties',
      address: {
        street: '456 Victoria Island',
        city: 'Lagos',
        state: 'Lagos',
        zipCode: '101241'
      },
      bankDetails: {
        accountNumber: '1111111111',
        bankName: 'Guaranty Trust Bank',
        accountName: 'Emeka Okafor'
      },
      kycStatus: 'verified',
      createdAt: new Date('2024-01-10').toISOString(),
      lastLogin: new Date('2024-01-21').toISOString(),
      vendorData: {
        businessName: 'Lagos Prime Properties',
        businessType: 'Real Estate Agent',
        vendorCategory: 'agent',
        agentLocation: 'Lagos',
        phone: '+234-803-111-2222',
        experience: '5+ years',
        registeredAt: new Date('2024-01-10').toISOString(),
        status: 'active'
      },
      properties: []
    },
    {
      id: 'agent_002',
      firstName: 'Fatima',
      lastName: 'Ibrahim',
      email: 'fatima.ibrahim@abujaagents.com',
      phone: '+234-804-333-4444',
      password: 'agent123',
      role: 'vendor',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      isVerified: true,
      isActive: true,
      dateOfBirth: '1985-08-15',
      gender: 'female',
      occupation: 'Real Estate Agent',
      company: 'Abuja Elite Realty',
      address: {
        street: '789 Asokoro District',
        city: 'Abuja',
        state: 'FCT',
        zipCode: '900001'
      },
      bankDetails: {
        accountNumber: '2222222222',
        bankName: 'Access Bank',
        accountName: 'Fatima Ibrahim'
      },
      kycStatus: 'verified',
      createdAt: new Date('2024-01-12').toISOString(),
      lastLogin: new Date('2024-01-21').toISOString(),
      vendorData: {
        businessName: 'Abuja Elite Realty',
        businessType: 'Real Estate Agent',
        vendorCategory: 'agent',
        agentLocation: 'Abuja',
        phone: '+234-804-333-4444',
        experience: '7+ years',
        registeredAt: new Date('2024-01-12').toISOString(),
        status: 'active'
      },
      properties: []
    },
    {
      id: 'agent_003',
      firstName: 'Chidi',
      lastName: 'Nwankwo',
      email: 'chidi.nwankwo@riversagents.com',
      phone: '+234-805-555-6666',
      password: 'agent123',
      role: 'vendor',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      isVerified: true,
      isActive: true,
      dateOfBirth: '1980-12-03',
      gender: 'male',
      occupation: 'Real Estate Agent',
      company: 'Port Harcourt Properties',
      address: {
        street: '321 GRA Phase 2',
        city: 'Port Harcourt',
        state: 'Rivers',
        zipCode: '500001'
      },
      bankDetails: {
        accountNumber: '3333333333',
        bankName: 'Zenith Bank',
        accountName: 'Chidi Nwankwo'
      },
      kycStatus: 'verified',
      createdAt: new Date('2024-01-08').toISOString(),
      lastLogin: new Date('2024-01-21').toISOString(),
      vendorData: {
        businessName: 'Port Harcourt Properties',
        businessType: 'Real Estate Agent',
        vendorCategory: 'agent',
        agentLocation: 'Rivers',
        phone: '+234-805-555-6666',
        experience: '10+ years',
        registeredAt: new Date('2024-01-08').toISOString(),
        status: 'active'
      },
      properties: []
    },
    // Property Owner Vendor
    {
      id: 'owner_001',
      firstName: 'Aisha',
      lastName: 'Mohammed',
      email: 'aisha.mohammed@propertyowner.com',
      phone: '+234-806-777-8888',
      password: 'owner123',
      role: 'vendor',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      isVerified: true,
      isActive: true,
      dateOfBirth: '1975-04-20',
      gender: 'female',
      occupation: 'Property Developer',
      company: 'Mohammed Properties Ltd',
      address: {
        street: '654 Ikoyi Close',
        city: 'Lagos',
        state: 'Lagos',
        zipCode: '101233'
      },
      bankDetails: {
        accountNumber: '4444444444',
        bankName: 'United Bank for Africa',
        accountName: 'Aisha Mohammed'
      },
      kycStatus: 'verified',
      createdAt: new Date('2024-01-05').toISOString(),
      lastLogin: new Date('2024-01-21').toISOString(),
      vendorData: {
        businessName: 'Mohammed Properties Ltd',
        businessType: 'Property Developer',
        vendorCategory: 'property_owner',
        phone: '+234-806-777-8888',
        experience: '15+ years',
        registeredAt: new Date('2024-01-05').toISOString(),
        status: 'active'
      },
      properties: ['prop_015', 'prop_016'] // Properties owned by this vendor
    },
    // Admin User
    {
      id: 'admin_001',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@propertyark.com',
      phone: '+234-800-000-0000',
      password: 'admin123',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      isVerified: true,
      isActive: true,
      dateOfBirth: '1980-01-01',
      gender: 'male',
      occupation: 'System Administrator',
      company: 'PROPERTY ARK',
      address: {
        street: '1 Admin Street',
        city: 'Lagos',
        state: 'Lagos',
        zipCode: '100001'
      },
      bankDetails: {
        accountNumber: '0000000000',
        bankName: 'First Bank of Nigeria',
        accountName: 'Admin User'
      },
      kycStatus: 'verified',
      createdAt: new Date('2024-01-01').toISOString(),
      lastLogin: new Date('2024-01-21').toISOString(),
      properties: [] // Admin doesn't own properties
    }
];

module.exports = mockUsers;


