// mortgageBankService deprecated — migrated to PostgreSQL/Sequelize.
// TODO: implement PostgreSQL-backed service in `models/sequelize` and replace this stub.
module.exports = {
  registerMortgageBank: async () => { throw new Error('MortgageBank service migrated to PostgreSQL - not implemented'); },
  listMortgageBanks: async () => { throw new Error('MortgageBank service migrated to PostgreSQL - not implemented'); },
  getMortgageBankById: async () => { throw new Error('MortgageBank service migrated to PostgreSQL - not implemented'); },
  updateMortgageBankProfile: async () => { throw new Error('MortgageBank service migrated to PostgreSQL - not implemented'); },
  addMortgageProduct: async () => { throw new Error('MortgageBank service migrated to PostgreSQL - not implemented'); },
  updateMortgageProduct: async () => { throw new Error('MortgageBank service migrated to PostgreSQL - not implemented'); },
  deleteMortgageProduct: async () => { throw new Error('MortgageBank service migrated to PostgreSQL - not implemented'); },
  updateMortgageBankVerification: async () => { throw new Error('MortgageBank service migrated to PostgreSQL - not implemented'); },
  updateBankStatistics: async () => { throw new Error('MortgageBank service migrated to PostgreSQL - not implemented'); }
};

const convertTimestamp = (value) => {
  if (!value) return value;
  return value.toDate ? value.toDate() : value;
};

const convertProduct = (product = {}) => ({
  ...product,
  createdAt: convertTimestamp(product.createdAt),
  updatedAt: convertTimestamp(product.updatedAt)
});

const convertBankDoc = (doc) => {
  if (!doc) return null;
  const data = doc.data ? doc.data() : doc;
  if (!data) return null;

  return {
    id: doc.id || data.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    verifiedAt: convertTimestamp(data.verifiedAt),
    mortgageProducts: (data.mortgageProducts || []).map(convertProduct)
  };
};

const buildUserSnapshot = (user) => {
  if (!user) return null;
  const { id, firstName, lastName, email, role, isVerified, isActive, phone } = user;
  return { id, firstName, lastName, email, role, isVerified, isActive, phone };
};

const ensureDb = () => {
  const db = getFirestore();
  if (!db) {
    throw Object.assign(new Error('Firestore not initialized'), { statusCode: 500 });
  }
  return db;
};

const checkDuplicate = async (field, value) => {
  const db = ensureDb();
  const snapshot = await db.collection(COLLECTION)
    .where(field, '==', value)
    .limit(1)
    .get();
  return !snapshot.empty;
};

const registerMortgageBank = async (payload) => {
  const db = ensureDb();
  const {
    name,
    registrationNumber,
    email,
    phone,
    address = {},
    contactPerson = {},
    userAccount = {},
    documents = []
  } = payload;

  if (await checkDuplicate('registrationNumber', registrationNumber)) {
    throw Object.assign(new Error('A bank with this registration number already exists'), { statusCode: 400 });
  }

  if (await checkDuplicate('email', email.toLowerCase())) {
    throw Object.assign(new Error('A bank with this email already exists'), { statusCode: 400 });
  }

  const existingUser = await userService.findByEmail(userAccount.email?.toLowerCase());
  if (existingUser) {
    throw Object.assign(new Error('User account with this email already exists'), { statusCode: 400 });
  }

  const createdUser = await userService.createUser({
    firstName: userAccount.firstName,
    lastName: userAccount.lastName,
    email: userAccount.email,
    password: userAccount.password,
    phone: contactPerson.phone || phone,
    role: 'mortgage_bank',
    isVerified: false,
    isActive: false
  });

  const docRef = db.collection(COLLECTION).doc();
  const bankDoc = {
    name,
    registrationNumber,
    email: email.toLowerCase(),
    phone,
    address: {
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      country: address.country || 'Nigeria',
      zipCode: address.zipCode || ''
    },
    contactPerson: {
      firstName: contactPerson.firstName || '',
      lastName: contactPerson.lastName || '',
      email: contactPerson.email?.toLowerCase() || '',
      phone: contactPerson.phone || '',
      position: contactPerson.position || ''
    },
    documents,
    verificationStatus: 'pending',
    verificationNotes: '',
    verifiedBy: null,
    verifiedAt: null,
    isActive: false,
    userAccount: buildUserSnapshot(createdUser),
    mortgageProducts: [],
    statistics: {
      totalApplications: 0,
      approvedApplications: 0,
      rejectedApplications: 0,
      activeMortgages: 0
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await docRef.set(bankDoc);
  await userService.updateUser(createdUser.id, { mortgageBankProfile: docRef.id });

  const snapshot = await docRef.get();
  return {
    bank: convertBankDoc(snapshot),
    user: buildUserSnapshot(createdUser)
  };
};

const listMortgageBanks = async ({ isAdmin = false, status, includeDocuments = false } = {}) => {
  const db = ensureDb();
  let query = db.collection(COLLECTION);

  if (!isAdmin) {
    query = query
      .where('isActive', '==', true)
      .where('verificationStatus', '==', 'approved');
  } else if (status && status !== 'all') {
    query = query.where('verificationStatus', '==', status);
  }

  const snapshot = await query.orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((doc) => {
    const bank = convertBankDoc(doc);
    if (!includeDocuments) {
      delete bank.documents;
    }
    return bank;
  });
};

const getMortgageBankById = async (bankId) => {
  const db = ensureDb();
  const doc = await db.collection(COLLECTION).doc(bankId).get();
  if (!doc.exists) {
    return null;
  }
  return convertBankDoc(doc);
};

const updateMortgageBankProfile = async (bankId, updates = {}) => {
  const db = ensureDb();
  const docRef = db.collection(COLLECTION).doc(bankId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    return null;
  }

  const allowedFields = ['name', 'phone', 'address', 'contactPerson'];
  const payload = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      payload[field] = updates[field];
    }
  });

  await docRef.set(payload, { merge: true });
  const updated = await docRef.get();
  return convertBankDoc(updated);
};

const updateBankStatistics = async (bankId, statsUpdate = {}) => {
  const db = ensureDb();
  const docRef = db.collection(COLLECTION).doc(bankId);
  await docRef.set({
    statistics: statsUpdate,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
};

const ensureOwnership = (bank, userId) => {
  if (!bank?.userAccount?.id || bank.userAccount.id !== userId) {
    throw Object.assign(new Error('Not authorized to manage this bank'), { statusCode: 403 });
  }
};

const addMortgageProduct = async (bankId, userId, productData) => {
  const db = ensureDb();
  const docRef = db.collection(COLLECTION).doc(bankId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    return null;
  }

  const bank = convertBankDoc(snapshot);
  ensureOwnership(bank, userId);

  const productId = db.collection('_ids').doc().id;
  const newProduct = {
    id: productId,
    name: productData.name,
    description: productData.description || '',
    minLoanAmount: productData.minLoanAmount,
    maxLoanAmount: productData.maxLoanAmount,
    minDownPaymentPercent: productData.minDownPaymentPercent,
    maxLoanTerm: productData.maxLoanTerm,
    interestRate: productData.interestRate,
    interestRateType: productData.interestRateType || 'fixed',
    eligibilityCriteria: {
      minMonthlyIncome: productData.eligibilityCriteria?.minMonthlyIncome || 0,
      minCreditScore: productData.eligibilityCriteria?.minCreditScore || 0,
      employmentDuration: productData.eligibilityCriteria?.employmentDuration || 0
    },
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  const updatedProducts = [...(bank.mortgageProducts || []), newProduct];
  await docRef.set({
    mortgageProducts: updatedProducts,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  const updated = await docRef.get();
  const createdProduct = convertBankDoc(updated).mortgageProducts.find((prod) => prod.id === productId);
  return createdProduct;
};

const updateMortgageProduct = async (bankId, userId, productId, updates) => {
  const db = ensureDb();
  const docRef = db.collection(COLLECTION).doc(bankId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    return null;
  }

  const bank = convertBankDoc(snapshot);
  ensureOwnership(bank, userId);

  const products = bank.mortgageProducts || [];
  const productIndex = products.findIndex((product) => product.id === productId);
  if (productIndex === -1) {
    return null;
  }

  const currentProduct = products[productIndex];
  const updatedProduct = {
    ...currentProduct,
    ...updates,
    eligibilityCriteria: {
      ...currentProduct.eligibilityCriteria,
      ...(updates.eligibilityCriteria || {})
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  products[productIndex] = updatedProduct;

  await docRef.set({
    mortgageProducts: products,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  const updated = await docRef.get();
  return convertBankDoc(updated).mortgageProducts.find((product) => product.id === productId);
};

const deleteMortgageProduct = async (bankId, userId, productId) => {
  const db = ensureDb();
  const docRef = db.collection(COLLECTION).doc(bankId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    return null;
  }

  const bank = convertBankDoc(snapshot);
  ensureOwnership(bank, userId);

  const products = bank.mortgageProducts || [];
  const productIndex = products.findIndex((product) => product.id === productId);
  if (productIndex === -1) {
    return null;
  }

  products[productIndex] = {
    ...products[productIndex],
    isActive: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await docRef.set({
    mortgageProducts: products,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return true;
};

const updateMortgageBankVerification = async (bankId, { verificationStatus, verificationNotes, adminId }) => {
  const db = ensureDb();
  const docRef = db.collection(COLLECTION).doc(bankId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    return null;
  }

  const bank = convertBankDoc(snapshot);
  const isApproved = verificationStatus === 'approved';

  const payload = {
    verificationStatus,
    verificationNotes: verificationNotes || '',
    verifiedBy: adminId,
    verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    isActive: isApproved,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (bank.userAccount?.id) {
    const updatedUser = await userService.updateUser(bank.userAccount.id, {
      isActive: isApproved,
      isVerified: isApproved,
      mortgageBankProfile: bankId
    });
    payload.userAccount = buildUserSnapshot(updatedUser);
  }

  await docRef.set(payload, { merge: true });
  const updated = await docRef.get();
  return convertBankDoc(updated);
};

module.exports = {
  registerMortgageBank,
  listMortgageBanks,
  getMortgageBankById,
  updateMortgageBankProfile,
  addMortgageProduct,
  updateMortgageProduct,
  deleteMortgageProduct,
  updateMortgageBankVerification,
  updateBankStatistics
};
