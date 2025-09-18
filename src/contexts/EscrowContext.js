import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, storage } from '../config/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from './AuthContext';

const EscrowContext = createContext();

export const useEscrow = () => {
  const context = useContext(EscrowContext);
  if (!context) {
    throw new Error('useEscrow must be used within an EscrowProvider');
  }
  return context;
};

export const EscrowProvider = ({ children }) => {
  const { user } = useAuth();
  const [escrowTransactions, setEscrowTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create escrow transaction for investment
  const createEscrowTransaction = async (investmentId, amount, buyerId, vendorId) => {
    try {
      setLoading(true);
      setError(null);

      const escrowData = {
        investmentId,
        amount,
        buyerId,
        vendorId,
        status: 'pending_payment', // pending_payment, payment_received, documents_uploaded, buyer_confirmed, funds_released, completed, failed
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Investment-specific fields
        type: 'investment',
        propertyDocuments: null,
        documentVerificationStatus: 'pending',
        roiAmount: null,
        roiDueDate: null,
        agreementTerms: null
      };

      const docRef = await addDoc(collection(db, 'escrowTransactions'), escrowData);
      
      return docRef.id;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Upload property documents (deed, etc.)
  const uploadPropertyDocuments = async (escrowId, documents) => {
    try {
      setLoading(true);
      setError(null);

      const uploadedDocuments = [];
      
      for (const doc of documents) {
        const fileName = `escrow/${escrowId}/${doc.name}`;
        const storageRef = ref(storage, fileName);
        
        await uploadBytes(storageRef, doc.file);
        const downloadURL = await getDownloadURL(storageRef);
        
        uploadedDocuments.push({
          name: doc.name,
          type: doc.type,
          url: downloadURL,
          uploadedAt: serverTimestamp()
        });
      }

      // Update escrow transaction with document URLs
      const escrowRef = doc(db, 'escrowTransactions', escrowId);
      await updateDoc(escrowRef, {
        propertyDocuments: uploadedDocuments,
        documentVerificationStatus: 'uploaded',
        status: 'documents_uploaded',
        updatedAt: serverTimestamp()
      });

      return uploadedDocuments;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify documents (admin action)
  const verifyDocuments = async (escrowId, verificationStatus, adminNotes = '') => {
    try {
      setLoading(true);
      setError(null);

      const escrowRef = doc(db, 'escrowTransactions', escrowId);
      await updateDoc(escrowRef, {
        documentVerificationStatus: verificationStatus,
        adminNotes,
        verifiedAt: serverTimestamp(),
        verifiedBy: user.uid,
        updatedAt: serverTimestamp()
      });

      // If documents are verified, notify buyer
      if (verificationStatus === 'verified') {
        await updateDoc(escrowRef, {
          status: 'documents_verified',
          updatedAt: serverTimestamp()
        });
      }

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Buyer confirms payment after document verification
  const confirmPayment = async (escrowId) => {
    try {
      setLoading(true);
      setError(null);

      const escrowRef = doc(db, 'escrowTransactions', escrowId);
      await updateDoc(escrowRef, {
        status: 'buyer_confirmed',
        buyerConfirmedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Release funds to vendor
  const releaseFunds = async (escrowId) => {
    try {
      setLoading(true);
      setError(null);

      const escrowRef = doc(db, 'escrowTransactions', escrowId);
      await updateDoc(escrowRef, {
        status: 'funds_released',
        fundsReleasedAt: serverTimestamp(),
        releasedBy: user.uid,
        updatedAt: serverTimestamp()
      });

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Vendor pays ROI to buyer
  const recordROIPayment = async (escrowId, roiAmount, paymentProof) => {
    try {
      setLoading(true);
      setError(null);

      const escrowRef = doc(db, 'escrowTransactions', escrowId);
      await updateDoc(escrowRef, {
        roiAmount,
        roiPaidAt: serverTimestamp(),
        paymentProof,
        status: 'roi_paid',
        updatedAt: serverTimestamp()
      });

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Complete transaction (return documents to vendor)
  const completeTransaction = async (escrowId) => {
    try {
      setLoading(true);
      setError(null);

      const escrowRef = doc(db, 'escrowTransactions', escrowId);
      await updateDoc(escrowRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle vendor default (transfer property to buyer)
  const handleVendorDefault = async (escrowId, reason) => {
    try {
      setLoading(true);
      setError(null);

      const escrowRef = doc(db, 'escrowTransactions', escrowId);
      await updateDoc(escrowRef, {
        status: 'vendor_default',
        defaultReason: reason,
        defaultHandledAt: serverTimestamp(),
        handledBy: user.uid,
        updatedAt: serverTimestamp()
      });

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get escrow transactions for user
  const getEscrowTransactions = async (userId, userType) => {
    try {
      setLoading(true);
      setError(null);

      let q;
      if (userType === 'buyer') {
        q = query(
          collection(db, 'escrowTransactions'),
          where('buyerId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      } else if (userType === 'vendor') {
        q = query(
          collection(db, 'escrowTransactions'),
          where('vendorId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Admin - get all transactions
        q = query(
          collection(db, 'escrowTransactions'),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setEscrowTransactions(transactions);
      return transactions;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get single escrow transaction
  const getEscrowTransaction = async (escrowId) => {
    try {
      setLoading(true);
      setError(null);

      const escrowRef = doc(db, 'escrowTransactions', escrowId);
      const escrowDoc = await getDoc(escrowRef);
      
      if (escrowDoc.exists()) {
        return { id: escrowDoc.id, ...escrowDoc.data() };
      } else {
        throw new Error('Escrow transaction not found');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Real-time listener for escrow transactions
  useEffect(() => {
    if (!user) return;

    let q;
    if (user.role === 'admin') {
      q = query(
        collection(db, 'escrowTransactions'),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'escrowTransactions'),
        where(user.role === 'buyer' ? 'buyerId' : 'vendorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEscrowTransactions(transactions);
    });

    return () => unsubscribe();
  }, [user]);

  const value = {
    escrowTransactions,
    loading,
    error,
    createEscrowTransaction,
    uploadPropertyDocuments,
    verifyDocuments,
    confirmPayment,
    releaseFunds,
    recordROIPayment,
    completeTransaction,
    handleVendorDefault,
    getEscrowTransactions,
    getEscrowTransaction
  };

  return (
    <EscrowContext.Provider value={value}>
      {children}
    </EscrowContext.Provider>
  );
};