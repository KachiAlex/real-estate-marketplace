import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const InvestmentContext = createContext();

export const useInvestment = () => {
  const context = useContext(InvestmentContext);
  if (!context) {
    throw new Error('useInvestment must be used within an InvestmentProvider');
  }
  return context;
};

export const InvestmentProvider = ({ children }) => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [userInvestments, setUserInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInvestmentCompany, setIsInvestmentCompany] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserRole();
      fetchInvestments();
      fetchUserInvestments();
    }
  }, [user]);

  const checkUserRole = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setIsInvestmentCompany(userData.roles?.includes('investment_company') || false);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const investmentsQuery = query(
        collection(db, 'investments'),
        where('status', 'in', ['active', 'funding', 'completed'])
      );
      const investmentsSnapshot = await getDocs(investmentsQuery);
      const investmentsData = investmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInvestments(investmentsData);
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInvestments = async () => {
    if (!user) return;
    
    try {
      const userInvestmentsQuery = query(
        collection(db, 'userInvestments'),
        where('userId', '==', user.uid)
      );
      const userInvestmentsSnapshot = await getDocs(userInvestmentsQuery);
      const userInvestmentsData = userInvestmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUserInvestments(userInvestmentsData);
    } catch (error) {
      console.error('Error fetching user investments:', error);
    }
  };

  const createInvestment = async (investmentData) => {
    try {
      const investmentRef = await addDoc(collection(db, 'investments'), {
        ...investmentData,
        companyId: user.uid,
        companyName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        status: 'pending_approval',
        totalRaised: 0,
        investors: []
      });
      
      await fetchInvestments();
      return { success: true, investmentId: investmentRef.id };
    } catch (error) {
      console.error('Error creating investment:', error);
      return { success: false, error: error.message };
    }
  };

  const investInOpportunity = async (investmentId, investmentAmount, investorDetails) => {
    try {
      // Create user investment record
      const userInvestmentRef = await addDoc(collection(db, 'userInvestments'), {
        investmentId,
        userId: user.uid,
        investorName: user.displayName || user.email,
        investmentAmount,
        investorDetails,
        status: 'pending_payment',
        createdAt: serverTimestamp(),
        ...investorDetails
      });

      // Update investment total raised
      const investmentRef = doc(db, 'investments', investmentId);
      const investmentDoc = await getDoc(investmentRef);
      const currentInvestment = investmentDoc.data();
      
      await updateDoc(investmentRef, {
        totalRaised: currentInvestment.totalRaised + investmentAmount,
        investors: [...(currentInvestment.investors || []), {
          userId: user.uid,
          amount: investmentAmount,
          investedAt: serverTimestamp()
        }]
      });

      await fetchUserInvestments();
      return { success: true, userInvestmentId: userInvestmentRef.id };
    } catch (error) {
      console.error('Error investing in opportunity:', error);
      return { success: false, error: error.message };
    }
  };

  const updateInvestmentStatus = async (investmentId, status, additionalData = {}) => {
    try {
      const investmentRef = doc(db, 'investments', investmentId);
      await updateDoc(investmentRef, {
        status,
        updatedAt: serverTimestamp(),
        ...additionalData
      });
      
      await fetchInvestments();
      return { success: true };
    } catch (error) {
      console.error('Error updating investment status:', error);
      return { success: false, error: error.message };
    }
  };

  const uploadPropertyDeed = async (investmentId, deedData) => {
    try {
      const deedRef = await addDoc(collection(db, 'propertyDeeds'), {
        investmentId,
        companyId: user.uid,
        deedData,
        status: 'pending_verification',
        uploadedAt: serverTimestamp()
      });

      // Update investment status
      await updateInvestmentStatus(investmentId, 'deed_uploaded', {
        deedId: deedRef.id
      });

      return { success: true, deedId: deedRef.id };
    } catch (error) {
      console.error('Error uploading property deed:', error);
      return { success: false, error: error.message };
    }
  };

  const verifyPropertyDeed = async (deedId, verificationStatus, adminNotes = '') => {
    try {
      const deedRef = doc(db, 'propertyDeeds', deedId);
      await updateDoc(deedRef, {
        status: verificationStatus,
        verifiedAt: serverTimestamp(),
        adminNotes,
        verifiedBy: user.uid
      });

      // Get investment ID from deed
      const deedDoc = await getDoc(deedRef);
      const deedData = deedDoc.data();
      
      if (verificationStatus === 'verified') {
        await updateInvestmentStatus(deedData.investmentId, 'deed_verified');
      } else {
        await updateInvestmentStatus(deedData.investmentId, 'deed_rejected');
      }

      return { success: true };
    } catch (error) {
      console.error('Error verifying property deed:', error);
      return { success: false, error: error.message };
    }
  };

  const processInvestmentPayment = async (userInvestmentId, paymentData) => {
    try {
      const userInvestmentRef = doc(db, 'userInvestments', userInvestmentId);
      await updateDoc(userInvestmentRef, {
        status: 'payment_confirmed',
        paymentData,
        paymentConfirmedAt: serverTimestamp()
      });

      await fetchUserInvestments();
      return { success: true };
    } catch (error) {
      console.error('Error processing investment payment:', error);
      return { success: false, error: error.message };
    }
  };

  const handleInvestmentCompletion = async (investmentId, completionData) => {
    try {
      // Update investment status
      await updateInvestmentStatus(investmentId, 'completed', {
        completedAt: serverTimestamp(),
        ...completionData
      });

      // Update all user investments
      const userInvestmentsQuery = query(
        collection(db, 'userInvestments'),
        where('investmentId', '==', investmentId)
      );
      const userInvestmentsSnapshot = await getDocs(userInvestmentsQuery);
      
      const updatePromises = userInvestmentsSnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          status: 'completed',
          completedAt: serverTimestamp(),
          ...completionData
        })
      );

      await Promise.all(updatePromises);
      await fetchUserInvestments();
      
      return { success: true };
    } catch (error) {
      console.error('Error handling investment completion:', error);
      return { success: false, error: error.message };
    }
  };

  const handleInvestmentDefault = async (investmentId, defaultData) => {
    try {
      // Update investment status
      await updateInvestmentStatus(investmentId, 'defaulted', {
        defaultedAt: serverTimestamp(),
        ...defaultData
      });

      // Update all user investments to transfer property ownership
      const userInvestmentsQuery = query(
        collection(db, 'userInvestments'),
        where('investmentId', '==', investmentId)
      );
      const userInvestmentsSnapshot = await getDocs(userInvestmentsQuery);
      
      const updatePromises = userInvestmentsSnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          status: 'property_transferred',
          propertyTransferredAt: serverTimestamp(),
          ...defaultData
        })
      );

      await Promise.all(updatePromises);
      await fetchUserInvestments();
      
      return { success: true };
    } catch (error) {
      console.error('Error handling investment default:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    investments,
    userInvestments,
    loading,
    isInvestmentCompany,
    createInvestment,
    investInOpportunity,
    updateInvestmentStatus,
    uploadPropertyDeed,
    verifyPropertyDeed,
    processInvestmentPayment,
    handleInvestmentCompletion,
    handleInvestmentDefault,
    fetchInvestments,
    fetchUserInvestments
  };

  return (
    <InvestmentContext.Provider value={value}>
      {children}
    </InvestmentContext.Provider>
  );
};