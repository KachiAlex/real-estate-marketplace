import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Badge, 
  Alert, 
  ProgressBar,
  ListGroup,
  Modal,
  Form,
  Spinner
} from 'react-bootstrap';
import { useEscrow } from '../contexts/EscrowContext';
import { useInvestment } from '../contexts/InvestmentContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const EscrowTransaction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    getEscrowTransaction, 
    confirmPayment, 
    releaseFunds, 
    recordROIPayment, 
    completeTransaction 
  } = useEscrow();
  const { getInvestmentById } = useInvestment();
  
  const [transaction, setTransaction] = useState(null);
  const [investment, setInvestment] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showROIModal, setShowROIModal] = useState(false);
  const [roiAmount, setRoiAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadTransactionDetails();
  }, [id]);

  const loadTransactionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const transactionData = await getEscrowTransaction(id);
      
      if (!transactionData) {
        setError('Escrow transaction not found');
        setLoading(false);
        return;
      }
      
      setTransaction(transactionData);

      // Load investment details if this is an investment transaction
      if (transactionData.investmentId || transactionData.type === 'investment') {
        const investmentId = transactionData.investmentId || id;
        try {
          const investmentData = await getInvestmentById(investmentId);
          if (investmentData) {
            setInvestment(investmentData);
          }
        } catch (err) {
          console.warn('Error loading investment:', err);
          // Continue even if investment loading fails
        }
      }

      // Load vendor/seller details
      const vendorId = transactionData.vendorId || transactionData.sellerId;
      if (vendorId) {
        try {
          const vendorRef = doc(db, 'users', vendorId);
          const vendorDoc = await getDoc(vendorRef);
          if (vendorDoc.exists()) {
            setVendor({ id: vendorDoc.id, ...vendorDoc.data() });
          } else if (transactionData.sellerName) {
            // Use transaction data if Firestore doc doesn't exist
            setVendor({
              id: vendorId,
              firstName: transactionData.sellerName?.split(' ')[0] || '',
              lastName: transactionData.sellerName?.split(' ').slice(1).join(' ') || '',
              email: transactionData.sellerEmail || ''
            });
          }
        } catch (err) {
          console.warn('Error loading vendor:', err);
          // Use transaction data as fallback
          if (transactionData.sellerName) {
            setVendor({
              id: vendorId,
              firstName: transactionData.sellerName?.split(' ')[0] || '',
              lastName: transactionData.sellerName?.split(' ').slice(1).join(' ') || '',
              email: transactionData.sellerEmail || ''
            });
          }
        }
      }

      // Load buyer details
      const buyerId = transactionData.buyerId;
      if (buyerId) {
        try {
          const buyerRef = doc(db, 'users', buyerId);
          const buyerDoc = await getDoc(buyerRef);
          if (buyerDoc.exists()) {
            setBuyer({ id: buyerDoc.id, ...buyerDoc.data() });
          } else if (transactionData.buyerName) {
            // Use transaction data if Firestore doc doesn't exist
            setBuyer({
              id: buyerId,
              firstName: transactionData.buyerName?.split(' ')[0] || '',
              lastName: transactionData.buyerName?.split(' ').slice(1).join(' ') || '',
              email: transactionData.buyerEmail || ''
            });
          }
        } catch (err) {
          console.warn('Error loading buyer:', err);
          // Use transaction data as fallback
          if (transactionData.buyerName) {
            setBuyer({
              id: buyerId,
              firstName: transactionData.buyerName?.split(' ')[0] || '',
              lastName: transactionData.buyerName?.split(' ').slice(1).join(' ') || '',
              email: transactionData.buyerEmail || ''
            });
          }
        }
      }
    } catch (err) {
      console.error('Error loading transaction details:', err);
      setError(err.message || 'Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_payment: { variant: 'warning', text: 'Pending Payment' },
      payment_received: { variant: 'info', text: 'Payment Received' },
      documents_uploaded: { variant: 'primary', text: 'Documents Uploaded' },
      documents_verified: { variant: 'success', text: 'Documents Verified' },
      buyer_confirmed: { variant: 'success', text: 'Buyer Confirmed' },
      funds_released: { variant: 'info', text: 'Funds Released' },
      roi_paid: { variant: 'success', text: 'ROI Paid' },
      completed: { variant: 'success', text: 'Completed' },
      vendor_default: { variant: 'danger', text: 'Vendor Default' },
      failed: { variant: 'danger', text: 'Failed' }
    };

    const config = statusConfig[status] || { variant: 'secondary', text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getProgressPercentage = (status) => {
    const progressMap = {
      pending_payment: 10,
      payment_received: 20,
      documents_uploaded: 40,
      documents_verified: 60,
      buyer_confirmed: 80,
      funds_released: 90,
      roi_paid: 95,
      completed: 100,
      vendor_default: 0,
      failed: 0
    };
    return progressMap[status] || 0;
  };

  const canUserTakeAction = () => {
    if (!user || !transaction) return false;

    // Buyer actions
    if (user.uid === transaction.buyerId) {
      return ['documents_verified'].includes(transaction.status);
    }

    // Vendor actions
    if (user.uid === transaction.vendorId) {
      return ['payment_received', 'funds_released'].includes(transaction.status);
    }

    // Admin actions
    if (user.role === 'admin') {
      return ['documents_uploaded', 'buyer_confirmed', 'roi_paid'].includes(transaction.status);
    }

    return false;
  };

  const handleConfirmPayment = async () => {
    try {
      setProcessing(true);
      await confirmPayment(id);
      await loadTransactionDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReleaseFunds = async () => {
    try {
      setProcessing(true);
      await releaseFunds(id);
      await loadTransactionDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRecordROI = async () => {
    if (!roiAmount || parseFloat(roiAmount) <= 0) {
      setError('Please enter a valid ROI amount');
      return;
    }

    try {
      setProcessing(true);
      await recordROIPayment(id, parseFloat(roiAmount), null);
      setShowROIModal(false);
      setRoiAmount('');
      await loadTransactionDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteTransaction = async () => {
    try {
      setProcessing(true);
      await completeTransaction(id);
      await loadTransactionDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  if (error || !transaction) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          {error || 'Transaction not found'}
        </Alert>
        <Button variant="outline-primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  const progressPercentage = getProgressPercentage(transaction.status);

  return (
    <Container className="py-5">
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h3>Escrow Transaction</h3>
              {getStatusBadge(transaction.status)}
            </Card.Header>
            <Card.Body>
              <h5>Transaction Progress</h5>
              <ProgressBar 
                now={progressPercentage} 
                label={`${progressPercentage}%`}
                className="mb-4"
              />

              <Row>
                <Col md={6}>
                  <h6>Transaction Details</h6>
                  <ListGroup className="mb-4">
                    <ListGroup.Item>
                      <strong>Amount:</strong> ${transaction.amount.toLocaleString()}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Created:</strong> {transaction.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Type:</strong> Investment Escrow
                    </ListGroup.Item>
                  </ListGroup>
                </Col>
                <Col md={6}>
                  <h6>Parties</h6>
                  <ListGroup className="mb-4">
                    <ListGroup.Item>
                      <strong>Buyer:</strong> {buyer?.firstName} {buyer?.lastName}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Vendor:</strong> {vendor?.companyName || vendor?.firstName} {vendor?.lastName}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Investment:</strong> {investment?.title}
                    </ListGroup.Item>
                  </ListGroup>
                </Col>
              </Row>

              {transaction.propertyDocuments && transaction.propertyDocuments.length > 0 && (
                <>
                  <h5>Property Documents</h5>
                  <Alert variant="info">
                    <h6>Document Status: {transaction.documentVerificationStatus}</h6>
                    <p className="mb-2">
                      The investment company has uploaded property documents as collateral.
                    </p>
                    <Button 
                      variant="outline-primary" 
                      onClick={() => setShowDocumentModal(true)}
                    >
                      View Documents
                    </Button>
                  </Alert>
                </>
              )}

              {transaction.roiAmount && (
                <>
                  <h5>ROI Payment</h5>
                  <Alert variant="success">
                    <h6>ROI Amount: ${transaction.roiAmount.toLocaleString()}</h6>
                    <p className="mb-0">
                      Paid on: {transaction.roiPaidAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </p>
                  </Alert>
                </>
              )}

              {transaction.adminNotes && (
                <>
                  <h5>Admin Notes</h5>
                  <Alert variant="light">
                    <p className="mb-0">{transaction.adminNotes}</p>
                  </Alert>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="sticky-top" style={{ top: '20px' }}>
            <Card.Header>
              <h5>Actions</h5>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}

              {canUserTakeAction() && (
                <div className="d-grid gap-2">
                  {user.uid === transaction.buyerId && transaction.status === 'documents_verified' && (
                    <Button 
                      variant="success" 
                      onClick={handleConfirmPayment}
                      disabled={processing}
                    >
                      {processing ? 'Processing...' : 'Confirm Payment'}
                    </Button>
                  )}

                  {user.uid === transaction.vendorId && transaction.status === 'funds_released' && (
                    <Button 
                      variant="primary" 
                      onClick={() => setShowROIModal(true)}
                      disabled={processing}
                    >
                      Record ROI Payment
                    </Button>
                  )}

                  {user.role === 'admin' && transaction.status === 'roi_paid' && (
                    <Button 
                      variant="success" 
                      onClick={handleCompleteTransaction}
                      disabled={processing}
                    >
                      Complete Transaction
                    </Button>
                  )}
                </div>
              )}

              {!canUserTakeAction() && (
                <Alert variant="info">
                  <p className="mb-0">
                    {transaction.status === 'pending_payment' && 'Waiting for payment...'}
                    {transaction.status === 'payment_received' && 'Waiting for document upload...'}
                    {transaction.status === 'documents_uploaded' && 'Waiting for document verification...'}
                    {transaction.status === 'buyer_confirmed' && 'Waiting for fund release...'}
                    {transaction.status === 'funds_released' && 'Waiting for ROI payment...'}
                    {transaction.status === 'completed' && 'Transaction completed successfully!'}
                  </p>
                </Alert>
              )}

              <div className="mt-3">
                <Button 
                  variant="outline-secondary" 
                  onClick={() => navigate('/dashboard')}
                  className="w-100"
                >
                  Back to Dashboard
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Document Modal */}
      <Modal show={showDocumentModal} onHide={() => setShowDocumentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Property Documents</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {transaction.propertyDocuments?.map((doc, index) => (
            <Card key={index} className="mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6>{doc.name}</h6>
                    <small className="text-muted">
                      Uploaded: {doc.uploadedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </small>
                  </div>
                  <Button 
                    variant="outline-primary" 
                    href={doc.url}
                    target="_blank"
                  >
                    View Document
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDocumentModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ROI Payment Modal */}
      <Modal show={showROIModal} onHide={() => setShowROIModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Record ROI Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>ROI Amount Paid</Form.Label>
              <Form.Control
                type="number"
                value={roiAmount}
                onChange={(e) => setRoiAmount(e.target.value)}
                placeholder="Enter ROI amount"
                min="0"
                step="0.01"
              />
            </Form.Group>
            <Alert variant="info">
              <p className="mb-0">
                This will record the ROI payment made to the investor. 
                Once confirmed, the transaction can be completed and property documents returned.
              </p>
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowROIModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={handleRecordROI}
            disabled={processing || !roiAmount}
          >
            {processing ? 'Processing...' : 'Record Payment'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EscrowTransaction;

