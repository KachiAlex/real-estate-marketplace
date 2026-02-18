// mortgageApplicationService deprecated — migrated to PostgreSQL/Sequelize.
// TODO: implement PostgreSQL-backed service in `models/sequelize` and replace this stub.
module.exports = {
  submitApplication: async () => { throw new Error('MortgageApplication service migrated to PostgreSQL - not implemented'); },
  getApplicationById: async () => { throw new Error('MortgageApplication service migrated to PostgreSQL - not implemented'); },
  listApplications: async () => { throw new Error('MortgageApplication service migrated to PostgreSQL - not implemented'); },
  updateApplicationStatus: async () => { throw new Error('MortgageApplication service migrated to PostgreSQL - not implemented'); }
};
const mortgageBankService = require('./mortgageBankService');
const userService = require('./userService');
const emailService = require('./emailService');
const { errorLogger, infoLogger } = require('../config/logger');

const APPLICATION_COLLECTION = 'mortgageApplications';
const MORTGAGE_COLLECTION = 'mortgages';

const ensureDb = () => {
  const db = getFirestore();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return db;
};

const convertTimestamp = (value) => {
  if (!value) return value;
  return value.toDate ? value.toDate() : value;
};

const convertApplicationDoc = (doc) => {
  if (!doc) return null;
  const data = doc.data ? doc.data() : doc;

  return {
    id: doc.id || data.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    bankReview: data.bankReview
      ? {
          ...data.bankReview,
          reviewedAt: convertTimestamp(data.bankReview.reviewedAt)
        }
      : undefined
  };
};

const convertMortgageDoc = (doc) => {
  if (!doc) return null;
  const data = doc.data ? doc.data() : doc;

  return {
    id: doc.id || data.id,
    ...data,
    startDate: convertTimestamp(data.startDate),
    nextPaymentDate: convertTimestamp(data.nextPaymentDate),
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    paymentHistory: (data.paymentHistory || []).map((payment) => ({
      ...payment,
      dueDate: convertTimestamp(payment.dueDate),
      paidDate: convertTimestamp(payment.paidDate)
    }))
  };
};

const buildUserSnapshot = (user) => {
  if (!user) return null;
  const { id, firstName, lastName, email, role, phone } = user;
  return { id, firstName, lastName, email, role, phone };
};

const buildPropertySnapshot = (property) => {
  if (!property) return null;
  return {
    id: property.id,
    title: property.title,
    price: property.price,
    location: property.location,
    city: property.location?.city || property.city,
    state: property.location?.state || property.state,
    featuredImage: property.featuredImage,
    coverImage: property.coverImage,
    category: property.category,
    type: property.type
  };
};

const buildBankSnapshot = (bank) => {
  if (!bank) return null;
  return {
    id: bank.id,
    name: bank.name,
    email: bank.email,
    contactPerson: bank.contactPerson,
    isActive: bank.isActive,
    verificationStatus: bank.verificationStatus,
    userAccount: bank.userAccount
  };
};

const calculateMonthlyPayment = (principal, interestRate, loanTermYears) => {
  const monthlyRate = interestRate / 100 / 12;
  const totalPayments = loanTermYears * 12;

  if (monthlyRate === 0) {
    return principal / totalPayments;
  }

  return (
    principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)
  ) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
};

const updateBankStats = async (bankId, updater) => {
  const bank = await mortgageBankService.getMortgageBankById(bankId);
  if (!bank) return;

  const nextStats = {
    totalApplications: bank.statistics?.totalApplications || 0,
    approvedApplications: bank.statistics?.approvedApplications || 0,
    rejectedApplications: bank.statistics?.rejectedApplications || 0,
    activeMortgages: bank.statistics?.activeMortgages || 0,
    ...updater(bank.statistics || {})
  };

  await mortgageBankService.updateBankStatistics(bankId, nextStats);
};

const applyForMortgage = async ({
  buyerId,
  propertyId,
  mortgageBankId,
  productId,
  requestedAmount,
  downPayment,
  loanTermYears,
  interestRate,
  employmentDetails = {},
  documents = []
}) => {
  const db = ensureDb();
  const property = await propertyService.getPropertyById(propertyId);
  if (!property) {
    throw Object.assign(new Error('Property not found'), { statusCode: 404 });
  }

  const bank = await mortgageBankService.getMortgageBankById(mortgageBankId);
  if (!bank || !bank.isActive || bank.verificationStatus !== 'approved') {
    throw Object.assign(new Error('Selected mortgage bank is not available'), { statusCode: 400 });
  }

  const buyer = await userService.findById(buyerId);
  if (!buyer) {
    throw Object.assign(new Error('Buyer not found'), { statusCode: 404 });
  }

  const estimatedMonthlyPayment = Math.round(
    calculateMonthlyPayment(requestedAmount, interestRate, loanTermYears)
  );

  const docRef = db.collection(APPLICATION_COLLECTION).doc();
  const applicationDoc = {
    property: buildPropertySnapshot(property),
    propertyId,
    buyer: buildUserSnapshot(buyer),
    buyerId,
    mortgageBank: buildBankSnapshot(bank),
    mortgageBankId,
    productId: productId || null,
    status: 'pending',
    requestedAmount,
    downPayment,
    loanTermYears,
    interestRate,
    estimatedMonthlyPayment,
    employmentDetails,
    documents,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await docRef.set(applicationDoc);

  await updateBankStats(bank.id, (stats) => ({
    totalApplications: (stats.totalApplications || 0) + 1
  }));

  try {
    const bankUser = bank.userAccount?.id
      ? await userService.findById(bank.userAccount.id)
      : null;

    if (bankUser?.email) {
      emailService.sendNewMortgageApplicationEmail(
        { _id: docRef.id, ...applicationDoc },
        bankUser,
        property,
        buyer
      ).catch((err) => {
        errorLogger(err, null, {
          context: 'Mortgage application email to bank',
          applicationId: docRef.id
        });
      });
      infoLogger('Mortgage application email queued for bank', {
        applicationId: docRef.id,
        bankId: bank.id,
        bankEmail: bankUser.email
      });
    }
  } catch (emailError) {
    errorLogger(emailError, null, {
      context: 'Mortgage application email notification',
      applicationId: docRef.id
    });
  }

  const created = await docRef.get();
  return convertApplicationDoc(created);
};

const submitPrequalification = async ({
  buyerId,
  mortgageBankId,
  employmentDetails = {},
  documents = []
}) => {
  const db = ensureDb();
  const bank = await mortgageBankService.getMortgageBankById(mortgageBankId);
  if (!bank || !bank.isActive || bank.verificationStatus !== 'approved') {
    throw Object.assign(new Error('Selected mortgage bank is not available'), { statusCode: 400 });
  }

  const buyer = await userService.findById(buyerId);
  if (!buyer) {
    throw Object.assign(new Error('Buyer not found'), { statusCode: 404 });
  }

  const monthlyIncome = employmentDetails.monthlyIncome || employmentDetails.businessMonthlyIncome || 0;
  const annualIncome = monthlyIncome * 12;
  const estimatedMaxLoan = Math.round(annualIncome * 4);
  const estimatedDownPayment = Math.round(estimatedMaxLoan * 0.2);

  const docRef = db.collection(APPLICATION_COLLECTION).doc();
  const prequalDoc = {
    buyer: buildUserSnapshot(buyer),
    buyerId,
    mortgageBank: buildBankSnapshot(bank),
    mortgageBankId,
    status: 'prequalification_requested',
    requestedAmount: estimatedMaxLoan,
    downPayment: estimatedDownPayment,
    loanTermYears: 25,
    interestRate: 18.5,
    estimatedMonthlyPayment: Math.round((estimatedMaxLoan * 0.185) / 12),
    employmentDetails,
    documents,
    notes: 'Pre-qualification request - no property selected yet',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await docRef.set(prequalDoc);

  await updateBankStats(bank.id, (stats) => ({
    totalApplications: (stats.totalApplications || 0) + 1
  }));

  try {
    const bankUser = bank.userAccount?.id ? await userService.findById(bank.userAccount.id) : null;
    if (bankUser?.email) {
      await emailService.sendEmail(
        bankUser.email,
        'New Mortgage Pre-qualification Request',
        `A new mortgage pre-qualification request has been submitted by ${buyer.firstName} ${buyer.lastName}.`,
        `New mortgage pre-qualification request from ${buyer.firstName} ${buyer.lastName}`
      );
    }
  } catch (emailError) {
    errorLogger(emailError, null, {
      context: 'Prequalification email notification',
      applicationId: docRef.id
    });
  }

  const created = await docRef.get();
  return convertApplicationDoc(created);
};

const listMortgageApplications = async ({
  role,
  userId,
  mortgageBankId,
  status
} = {}) => {
  const db = ensureDb();
  let query = db.collection(APPLICATION_COLLECTION);

  if (status) {
    query = query.where('status', '==', status);
  }

  if (role === 'admin') {
    // no extra filters
  } else if (role === 'mortgage_bank') {
    if (!mortgageBankId) {
      throw Object.assign(new Error('Mortgage bank profile not linked to this user'), { statusCode: 400 });
    }
    query = query.where('mortgageBank.id', '==', mortgageBankId);
  } else {
    query = query.where('buyer.id', '==', userId);
  }

  const snapshot = await query.orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(convertApplicationDoc);
};

const getMortgageApplicationById = async (applicationId) => {
  const db = ensureDb();
  const doc = await db.collection(APPLICATION_COLLECTION).doc(applicationId).get();
  if (!doc.exists) {
    return null;
  }
  return convertApplicationDoc(doc);
};

const reviewMortgageApplication = async ({
  applicationId,
  reviewer,
  decision,
  notes,
  conditions,
  loanTerms
}) => {
  const db = ensureDb();
  const docRef = db.collection(APPLICATION_COLLECTION).doc(applicationId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    return null;
  }

  const app = convertApplicationDoc(snapshot);
  const isBankReviewer = reviewer.role === 'mortgage_bank';
  if (isBankReviewer) {
    if (!reviewer.mortgageBankProfile || reviewer.mortgageBankProfile !== app.mortgageBank?.id) {
      throw Object.assign(new Error('Not authorized to review this application'), { statusCode: 403 });
    }
  }

  const newStatus = decision === 'approved' ? 'approved' : decision === 'rejected' ? 'rejected' : 'needs_more_info';
  const bankReview = {
    reviewedBy: reviewer.id,
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    decision,
    notes: notes || '',
    conditions: conditions || [],
    loanTerms: loanTerms || app.bankReview?.loanTerms || null
  };

  await docRef.set(
    {
      status: newStatus,
      bankReview,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  await updateBankStats(app.mortgageBank.id, (stats) => {
    const next = { ...stats };
    if (app.status === 'approved') {
      next.approvedApplications = Math.max((next.approvedApplications || 1) - 1, 0);
    }
    if (app.status === 'rejected') {
      next.rejectedApplications = Math.max((next.rejectedApplications || 1) - 1, 0);
    }

    if (newStatus === 'approved') {
      next.approvedApplications = (next.approvedApplications || 0) + 1;
    } else if (newStatus === 'rejected') {
      next.rejectedApplications = (next.rejectedApplications || 0) + 1;
    }
    return next;
  });

  try {
    if (app.buyer?.email) {
      emailService.sendMortgageApplicationStatusEmail(
        { ...app, status: newStatus },
        app.buyer,
        app.property || {},
        decision,
        notes || ''
      ).catch((err) => {
        errorLogger(err, null, {
          context: 'Mortgage application status email to buyer',
          applicationId
        });
      });
    }
  } catch (emailError) {
    errorLogger(emailError, null, {
      context: 'Mortgage application status email notification',
      applicationId
    });
  }

  const updated = await docRef.get();
  return convertApplicationDoc(updated);
};

const activateMortgage = async ({
  applicationId,
  actor
}) => {
  const db = ensureDb();
  const application = await getMortgageApplicationById(applicationId);
  if (!application) {
    throw Object.assign(new Error('Mortgage application not found'), { statusCode: 404 });
  }

  if (application.status !== 'approved') {
    throw Object.assign(new Error('Only approved applications can be activated'), { statusCode: 400 });
  }

  const isBuyer = application.buyer?.id === actor.id;
  const isAdmin = actor.role === 'admin';
  const isBank = actor.role === 'mortgage_bank' && actor.mortgageBankProfile === application.mortgageBank?.id;

  if (!isBuyer && !isAdmin && !isBank) {
    throw Object.assign(new Error('Not authorized to activate this mortgage'), { statusCode: 403 });
  }

  const existing = await db
    .collection(MORTGAGE_COLLECTION)
    .where('applicationId', '==', applicationId)
    .limit(1)
    .get();

  if (!existing.empty) {
    return convertMortgageDoc(existing.docs[0]);
  }

  const loanTerms = application.bankReview?.loanTerms || {};
  const loanAmount = loanTerms.approvedAmount || application.requestedAmount;
  const interestRate = loanTerms.interestRate || application.interestRate;
  const loanTermYears = loanTerms.loanTermYears || application.loanTermYears;
  const monthlyPayment = loanTerms.monthlyPayment || application.estimatedMonthlyPayment;
  const downPayment = application.downPayment;
  const totalPayments = loanTermYears * 12;

  const startDate = new Date();
  const nextPaymentDate = new Date(startDate);
  nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
  const dayOfMonth = startDate.getDate();
  const lastDayOfNextMonth = new Date(nextPaymentDate.getFullYear(), nextPaymentDate.getMonth() + 1, 0).getDate();
  nextPaymentDate.setDate(Math.min(dayOfMonth, lastDayOfNextMonth));

  const mortgageDoc = {
    applicationId,
    property: application.property,
    buyer: application.buyer,
    mortgageBank: application.mortgageBank,
    productId: application.productId,
    loanAmount,
    downPayment,
    loanTermYears,
    interestRate,
    monthlyPayment: Math.round(monthlyPayment),
    startDate: admin.firestore.Timestamp.fromDate(startDate),
    nextPaymentDate: admin.firestore.Timestamp.fromDate(nextPaymentDate),
    totalPayments,
    paymentsMade: 0,
    paymentsRemaining: totalPayments,
    remainingBalance: loanAmount,
    totalPaid: 0,
    documents: application.documents || [],
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  const docRef = db.collection(MORTGAGE_COLLECTION).doc();
  await docRef.set(mortgageDoc);

  await updateBankStats(application.mortgageBank.id, (stats) => ({
    approvedApplications: Math.max((stats.approvedApplications || 1) - 1, 0),
    activeMortgages: (stats.activeMortgages || 0) + 1
  }));

  const created = await docRef.get();
  return convertMortgageDoc(created);
};

const listActiveMortgages = async ({
  role,
  userId,
  mortgageBankId,
  status = 'active'
} = {}) => {
  const db = ensureDb();
  let query = db.collection(MORTGAGE_COLLECTION);

  if (status) {
    query = query.where('status', '==', status);
  }

  if (role === 'admin') {
    // no additional filters
  } else if (role === 'mortgage_bank') {
    if (!mortgageBankId) {
      throw Object.assign(new Error('Mortgage bank profile not linked to this user'), { statusCode: 400 });
    }
    query = query.where('mortgageBank.id', '==', mortgageBankId);
  } else {
    query = query.where('buyer.id', '==', userId);
  }

  const snapshot = await query.orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(convertMortgageDoc);
};

const getMortgageById = async (mortgageId) => {
  const db = ensureDb();
  const doc = await db.collection(MORTGAGE_COLLECTION).doc(mortgageId).get();
  if (!doc.exists) {
    return null;
  }
  return convertMortgageDoc(doc);
};

module.exports = {
  applyForMortgage,
  submitPrequalification,
  listMortgageApplications,
  getMortgageApplicationById,
  reviewMortgageApplication,
  activateMortgage,
  listActiveMortgages,
  getMortgageById
};
