import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc,
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from './AuthContext';
import { db, functions } from '../config/firebase';
import toast from 'react-hot-toast';

const EscrowContext = createContext();

export const useEscrow = () => {
  const context = useContext(EscrowContext);
  if (!context) {
    throw new Error('useEscrow must be used within an EscrowProvider');
  }
  return context;
};

export const EscrowProvider = ({ children }) => {
  const [escrowTransactions, setEscrowTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const { user } = useAuth();

  // Mock escrow transactions for demo
  const mockEscrowTransactions = [
    {
      id: '1',
      propertyId: 'prop_1',
      propertyTitle: 'Luxury Villa in Ikoyi',
      propertyImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400',
      buyerId: 'buyer_1',
      buyerName: 'John Doe',
      buyerEmail: 'john@example.com',
      sellerId: 'seller_1',
      sellerName: 'Jane Smith',
      sellerEmail: 'jane@example.com',
      amount: 150000000,
      currency: 'NGN',
      status: 'funded',
      paymentDate: '2024-01-15T10:30:00Z',
      confirmationDeadline: '2024-01-22T10:30:00Z',
      createdAt: '2024-01-15T10:00:00Z',
      flutterwaveReference: 'ESCROW_1_1705312800000',
      flutterwaveTransactionId: 'FLW_TXN_123456789'
    },
    {
      id: '2',
      propertyId: 'prop_2',
      propertyTitle: 'Modern Apartment in Victoria Island',
      propertyImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
      buyerId: 'buyer_2',
      buyerName: 'Alice Johnson',
      buyerEmail: 'alice@example.com',
      sellerId: 'seller_2',
      sellerName: 'Bob Wilson',
      sellerEmail: 'bob@example.com',
      amount: 85000000,
      currency: 'NGN',
      status: 'in_escrow',
      paymentDate: '2024-01-10T14:20:00Z',
      confirmationDeadline: '2024-01-17T14:20:00Z',
      createdAt: '2024-01-10T14:00:00Z',
      flutterwaveReference: 'ESCROW_2_1704892800000',
      flutterwaveTransactionId: 'FLW_TXN_987654321'
    },
    {
      id: '3',
      propertyId: 'prop_3',
      propertyTitle: 'Penthouse in Lekki',
      propertyImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
      buyerId: 'buyer_3',
      buyerName: 'Mike Brown',
      buyerEmail: 'mike@example.com',
      sellerId: 'seller_3',
      sellerName: 'Sarah Davis',
      sellerEmail: 'sarah@example.com',
      amount: 200000000,
      currency: 'NGN',
      status: 'buyer_confirmed',
      paymentDate: '2024-01-05T09:15:00Z',
      confirmationDeadline: '2024-01-12T09:15:00Z',
      createdAt: '2024-01-05T09:00:00Z',
      flutterwaveReference: 'ESCROW_3_1704441600000',
      flutterwaveTransactionId: 'FLW_TXN_456789123'
    }
  ];

  useEffect(() => {
    setEscrowTransactions(mockEscrowTransactions);
  }, []);

  const createEscrowTransaction = async (transactionData) => {
    try {
      setLoading(true);
      if (!user) throw new Error('User must be logged in');

      const escrowData = {
        ...transactionData,
        buyerId: user.uid,
        buyerName: user.displayName || `${user.firstName} ${user.lastName}`,
        buyerEmail: user.email,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        confirmationDeadline: null, // Will be set after payment
        paymentDate: null,
        disputeReason: null,
        adminNotes: null,
        autoReleaseTriggered: false
      };

      const docRef = await addDoc(collection(db, 'escrow'), escrowData);
      const newTransaction = { id: docRef.id, ...escrowData };
      
      setEscrowTransactions(prev => [newTransaction, ...prev]);
      toast.success('Escrow transaction created successfully!');
      return newTransaction;
    } catch (error) {
      console.error('Error creating escrow transaction:', error);
      toast.error('Failed to create escrow transaction');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async (escrowId, paymentMethod = 'card') => {
    try {
      setPaymentLoading(true);
      
      // Get escrow transaction details
      const escrowDoc = await getDoc(doc(db, 'escrow', escrowId));
      if (!escrowDoc.exists()) {
        throw new Error('Escrow transaction not found');
      }
      
      const escrowData = escrowDoc.data();
      
      // Generate Flutterwave payment data
      const paymentData = {
        tx_ref: `ESCROW_${escrowId}_${Date.now()}`,
        amount: escrowData.totalAmount,
        currency: escrowData.currency,
        redirect_url: `${window.location.origin}/escrow/verify`,
        customer: {
          email: escrowData.buyerEmail,
          name: escrowData.buyerName,
          phone_number: 'N/A'
        },
        customizations: {
          title: 'Property Escrow Payment',
          description: `Payment for ${escrowData.propertyTitle}`,
          logo: 'https://naijaluxuryhomes.com/logo.png'
        },
        meta: {
          escrow_id: escrowId,
          property_id: escrowData.propertyId,
          buyer_id: escrowData.buyerId,
          seller_id: escrowData.sellerId
        }
      };

      // Update escrow with Flutterwave reference
      await updateDoc(doc(db, 'escrow', escrowId), {
        flutterwaveReference: paymentData.tx_ref,
        updatedAt: serverTimestamp()
      });

      // In production, this would make a real API call to Flutterwave
      const mockFlutterwaveResponse = {
        status: 'success',
        message: 'Payment initiated',
        data: {
          link: `https://checkout.flutterwave.com/v3/hosted/pay/${paymentData.tx_ref}`,
          reference: paymentData.tx_ref,
          amount: paymentData.amount,
          currency: paymentData.currency
        }
      };

      // Redirect to Flutterwave payment page
      window.location.href = mockFlutterwaveResponse.data.link;
      return mockFlutterwaveResponse.data;
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('Failed to initiate payment');
      return null;
    } finally {
      setPaymentLoading(false);
    }
  };

  const verifyPayment = async (transactionId, txRef, status) => {
    try {
      setPaymentLoading(true);
      
      // Find escrow transaction by Flutterwave reference
      const escrowQuery = query(
        collection(db, 'escrow'),
        where('flutterwaveReference', '==', txRef)
      );
      const querySnapshot = await getDocs(escrowQuery);
      
      if (querySnapshot.empty) {
        throw new Error('Escrow transaction not found');
      }
      
      const escrowDoc = querySnapshot.docs[0];
      const escrowData = escrowDoc.data();
      
      if (status === 'successful') {
        // Update escrow transaction status
        const confirmationDeadline = new Date();
        confirmationDeadline.setDate(confirmationDeadline.getDate() + 7); // 7 days from now
        
        await updateDoc(escrowDoc.ref, {
          status: 'funded',
          flutterwaveTransactionId: transactionId,
          paymentDate: serverTimestamp(),
          confirmationDeadline: confirmationDeadline,
          updatedAt: serverTimestamp()
        });
        
        // Update local state
        setEscrowTransactions(prev => 
          prev.map(transaction => 
            transaction.id === escrowDoc.id 
              ? { ...transaction, status: 'funded' }
              : transaction
          )
        );
        toast.success('Payment verified successfully!');
        return { success: true, escrow_id: escrowDoc.id, status: 'funded' };
      } else {
        // Payment failed
        await updateDoc(escrowDoc.ref, {
          status: 'failed',
          updatedAt: serverTimestamp()
        });
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
      return null;
    } finally {
      setPaymentLoading(false);
    }
  };

  const getEscrowTransaction = async (id) => {
    try {
      setLoading(true);
      const escrowDoc = await getDoc(doc(db, 'escrow', id));
      
      if (escrowDoc.exists()) {
        return { id: escrowDoc.id, ...escrowDoc.data() };
      } else {
        throw new Error('Escrow transaction not found');
      }
    } catch (error) {
      console.error('Error fetching escrow transaction:', error);
      toast.error('Failed to load escrow transaction details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateEscrowStatus = async (id, status, notes = '') => {
    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'escrow', id), {
        status,
        notes,
        updatedAt: serverTimestamp()
      });
      
      setEscrowTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id 
            ? { ...transaction, status, notes }
            : transaction
        )
      );
      toast.success('Escrow status updated successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error updating escrow status:', error);
      toast.error('Failed to update escrow status');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (transactionId, documentData) => {
    try {
      setLoading(true);
      
      // In a real implementation, this would upload to Firebase Storage
      // For now, we'll just update the escrow transaction with document info
      const documentRef = await addDoc(collection(db, 'escrow', transactionId, 'documents'), {
        ...documentData,
        uploadedAt: serverTimestamp(),
        uploadedBy: user?.uid
      });
      
      toast.success('Document uploaded successfully!');
      return { id: documentRef.id, ...documentData };
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const completeMilestone = async (transactionId, milestoneName) => {
    try {
      setLoading(true);
      
      // Update milestone in escrow transaction
      const escrowRef = doc(db, 'escrow', transactionId);
      const escrowDoc = await getDoc(escrowRef);
      
      if (escrowDoc.exists()) {
        const currentData = escrowDoc.data();
        const milestones = currentData.milestones || {};
        milestones[milestoneName] = {
          completed: true,
          completedAt: serverTimestamp(),
          completedBy: user?.uid
        };
        
        await updateDoc(escrowRef, {
          milestones,
          updatedAt: serverTimestamp()
        });
        
        toast.success('Milestone completed successfully!');
        return { success: true };
      } else {
        throw new Error('Escrow transaction not found');
      }
    } catch (error) {
      console.error('Error completing milestone:', error);
      toast.error('Failed to complete milestone');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // New escrow flow functions
  const confirmPropertyPossession = async (escrowId, confirmationData) => {
    try {
      setLoading(true);
      const confirmProperty = httpsCallable(functions, 'confirmProperty');
      const result = await confirmProperty({
        escrowId,
        confirmationData
      });

      if (result.data.success) {
        setEscrowTransactions(prev => 
          prev.map(transaction => 
            transaction.id === escrowId 
              ? { ...transaction, status: 'buyer_confirmed' }
              : transaction
          )
        );
        toast.success('Property possession confirmed! Funds will be released to vendor.');
        return result.data;
      } else {
        throw new Error(result.data.message || 'Failed to confirm property possession');
      }
    } catch (error) {
      console.error('Error confirming property possession:', error);
      toast.error('Failed to confirm property possession');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const disputeProperty = async (escrowId, disputeData) => {
    try {
      setLoading(true);
      const fileDispute = httpsCallable(functions, 'fileDispute');
      const result = await fileDispute({
        escrowId,
        disputeData
      });

      if (result.data.success) {
        setEscrowTransactions(prev => 
          prev.map(transaction => 
            transaction.id === escrowId 
              ? { ...transaction, status: 'disputed', disputeReason: disputeData.reason }
              : transaction
          )
        );
        toast.success('Dispute filed successfully! Admin will review your case.');
        return result.data;
      } else {
        throw new Error(result.data.message || 'Failed to file dispute');
      }
    } catch (error) {
      console.error('Error filing dispute:', error);
      toast.error('Failed to file dispute');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const releaseEscrowFunds = async (escrowId, releaseType = 'manual') => {
    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'escrow', escrowId), {
        status: 'completed',
        releaseType,
        releasedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      setEscrowTransactions(prev => 
        prev.map(transaction => 
          transaction.id === escrowId 
            ? { ...transaction, status: 'completed' }
            : transaction
        )
      );
      toast.success('Funds released successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error releasing funds:', error);
      toast.error('Failed to release funds');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const refundEscrowFunds = async (escrowId, refundReason = '') => {
    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'escrow', escrowId), {
        status: 'refunded',
        refundReason,
        refundedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      setEscrowTransactions(prev => 
        prev.map(transaction => 
          transaction.id === escrowId 
            ? { ...transaction, status: 'refunded' }
            : transaction
        )
      );
      toast.success('Funds refunded successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error refunding funds:', error);
      toast.error('Failed to refund funds');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getEscrowTimer = (confirmationDeadline) => {
    if (!confirmationDeadline) return null;
    
    const deadline = new Date(confirmationDeadline);
    const now = new Date();
    const timeLeft = deadline.getTime() - now.getTime();
    
    if (timeLeft <= 0) return { expired: true, days: 0, hours: 0, minutes: 0 };
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    return { expired: false, days, hours, minutes };
  };

  const checkAutoRelease = async () => {
    try {
      const now = new Date();
      const expiredTransactions = escrowTransactions.filter(transaction => {
        if (transaction.status !== 'in_escrow') return false;
        if (!transaction.confirmationDeadline) return false;
        
        const deadline = new Date(transaction.confirmationDeadline);
        return deadline <= now;
      });

      for (const transaction of expiredTransactions) {
        await releaseEscrowFunds(transaction.id, 'auto');
      }

      return expiredTransactions.length;
    } catch (error) {
      console.error('Error checking auto-release:', error);
      return 0;
    }
  };

  const value = {
    escrowTransactions,
    loading,
    paymentLoading,
    createEscrowTransaction,
    initiatePayment,
    verifyPayment,
    getEscrowTransaction,
    updateEscrowStatus,
    uploadDocument,
    completeMilestone,
    confirmPropertyPossession,
    disputeProperty,
    releaseEscrowFunds,
    refundEscrowFunds,
    getEscrowTimer,
    checkAutoRelease
  };

  return (
    <EscrowContext.Provider value={value}>
      {children}
    </EscrowContext.Provider>
  );
};